"""Phase 4: LangGraph agent with tools and memory.

    user message + thread_id
        -> agent (gpt-4o-mini) decides which tool(s) to call
             search_videos   : top-k transcript chunks from Pinecone (optionally one video)
             list_videos     : the videos in the knowledge base
             video_info      : title, channel, length, upload date, link of one video
             summarize_video : summary of one whole video, with timestamps
             create_weekly_plan : a weekly workout plan from goal, days, level, equipment (planner.py)
        -> answer with [Video title, m:ss] citations

Memory: every message of a thread is saved by a LangGraph checkpointer under its
thread_id. With DATABASE_URL set it is Neon Postgres (survives restarts and works on
serverless Vercel). Without it, an in-RAM MemorySaver is used (local tests only).

The caller must load the environment variables first.
"""
import os
import re

from langchain.agents import create_agent
from langchain_core.messages import AIMessage, HumanMessage, ToolMessage
from langchain_core.tools import tool
from langchain_openai import ChatOpenAI
from langgraph.checkpoint.memory import MemorySaver

from catalog import find_video, load_videos, transcript_with_timestamps, video_summary_line
from planner import AVOID, EQUIPMENT, EXPERIENCE, GOALS, build_plan, plan_as_text
from rag import DEFAULT_K, LLM_MODEL, format_docs, get_sources
from vectorstore import get_vectorstore

SYSTEM_PROMPT = """You are a fitness assistant for a collection of YouTube videos about muscle growth, training, exercise technique, nutrition, fat loss and recovery.

Tools:
- search_videos: use it for any question about the video content. Search again with other words if the first results don't answer the question. Pass video_id to search inside one video.
- list_videos: use it when the user asks which videos or topics you know.
- video_info: details about one video (channel, length, upload date, link).
- summarize_video: when the user asks for a summary, the main points, or all the steps of a routine from one video. It reads the whole transcript, so nothing is missed.
- create_weekly_plan: when the user asks for a workout plan, routine or schedule for the week, or wants to change one ("only 3 days", "my knee hurts", "no gym"). If goal or days per week are missing, ask for them in one short question. Assume beginner, full gym and 60 minutes when not given. To change a plan, call it again with the earlier inputs plus the change.

Plans:
- The app shows the full plan as a card with every exercise, form cues and a video demo. Do not repeat the plan. Reply in 2 to 4 sentences: the split, why it fits the user, and one tip from the plan rules with its citation tag.
- If the user mentions pain or an injury, use avoid, and say they should see a physiotherapist or doctor.

Rules:
- Answer ONLY from tool results. If they do not contain the answer, say that the videos don't cover it. Do not use outside knowledge.
- After each fact, copy the citation tag from the tool result exactly, for example [How Sleep Powers Muscle Growth, 7:20]. Every citation has the full video title and the time, even when all facts come from one video. Never write only [7:20].
- Keep the context of every number: units, body weight, and whether it is for bulking, cutting or general health. Prefer per-kilogram ranges over single examples, and say who an example applies to.
- If the question asks how to do something, give all the steps or parts the results mention.
- When several videos answer the question, combine them and say where they agree or differ.
- The transcripts are auto-generated and can contain errors, especially in numbers. If a number looks wrong, say so.
- Use the conversation history for follow-up questions like "and for women?" or "summarize that video".
- When asked about earlier questions, look at the previous user messages above. Only if there are none, say this is the start of the conversation. Never invent earlier questions.
- When listing videos, give only the title and channel, one line each.
- Be concise: a few sentences or a short list."""

SUMMARY_PROMPT = """Summarize this YouTube video transcript in 5-8 bullet points.
If the video teaches a routine or steps, list every step instead, with all its numbers (sets, reps, percentages, rest times).
After each bullet, cite the time it comes from as [{title}, m:ss], using the [m:ss] markers in the transcript.
Keep numbers with their units. The transcript is auto-generated, so ignore obvious caption errors.
{focus}
Title: {title}
Channel: {channel}

Transcript:
{transcript}"""

BARE_TIME = re.compile(r"\[(\d{1,2}:\d{2}(?::\d{2})?)\]")  # [1:00] or [1:02:03], without a title

NOT_FOUND = "No video matches '{query}'. Call list_videos to see the available titles and IDs."

# Off-topic check. It runs as its own small LLM call before the agent, because a refusal rule
# inside the agent prompt made gpt-4o-mini also refuse real questions (creatine, sleep).
TOPIC_PROMPT = """You protect a fitness chatbot from questions it cannot answer.
Reply OFF only if the message is clearly about something with no link to the body, health or exercise, for example:
the date or time, the weather, news, politics, sports results, money or prices, movies, travel, translation, coding, math homework or general knowledge.
Reply ON for everything else, including training, exercises, workout plans, food, calories, diet, supplements, sleep, rest, pain, injuries, body weight,
greetings, thanks, short answers like "yes" or "4 days", any follow-up, questions about the assistant itself (what it can do, which languages it speaks), questions about the videos ("summarize that video", "who made it?") and questions about this conversation ("what did I ask first?").
When unsure, reply ON. Reply with one word: ON or OFF.
{previous}
Message: {message}"""

OFF_TOPIC_REPLY = ("Sorry, I can't help with that. I can only answer questions about fitness: training, exercise technique, "
                   "nutrition, sleep and recovery, based on the videos. For example, ask \"How much protein should I eat?\" "
                   "or ask me to create a weekly workout plan.")


def is_on_topic(message: str, previous_answer: str = "") -> bool:
    """True unless the message is clearly not about fitness. When unsure, the answer is yes.

    previous_answer: start of the assistant's last reply, so follow-ups like "give me the link" are understood.
    """
    previous = f"\nThe assistant's previous reply started with: {previous_answer[:300]}\n" if previous_answer else ""
    llm = ChatOpenAI(model=LLM_MODEL, temperature=0, max_tokens=2)
    reply = llm.invoke(TOPIC_PROMPT.format(message=message, previous=previous)).content.strip().lower()
    return not reply.startswith("off")


@tool(response_format="content_and_artifact")
def search_videos(query: str, video_id: str | None = None) -> tuple[str, list[dict]]:
    """Search the video transcripts for passages that answer a question.

    Args:
        query: what to look for, e.g. "how much protein per day to build muscle".
        video_id: optional, only search inside this one video.
    """
    search_filter = {"video_id": video_id} if video_id else None
    docs = get_vectorstore().similarity_search(query, k=DEFAULT_K, filter=search_filter)
    if not docs:
        return "No matching passages found.", []
    return format_docs(docs), get_sources(docs)


@tool
def list_videos() -> str:
    """List every video in the knowledge base with its channel, length and ID."""
    videos = load_videos().values()
    return f"{len(videos)} videos:\n" + "\n".join(video_summary_line(v) for v in videos)


@tool
def video_info(video: str) -> str:
    """Details of one video: title, channel, length, upload date, transcript source and link.

    Args:
        video: the video ID or (part of) its title.
    """
    record = find_video(video)
    if record is None:
        return NOT_FOUND.format(query=video)
    d = record["upload_date"]
    return (f"Title: {record['title']}\nChannel: {record['channel']}\n"
            f"Length: {round(record['duration_seconds'] / 60)} min\nUploaded: {d[:4]}-{d[4:6]}-{d[6:]}\n"
            f"Transcript: {record['source']}\nLink: {record['url']}\nID: {record['video_id']}")


@tool(response_format="content_and_artifact")
def summarize_video(video: str, focus: str | None = None) -> tuple[str, list[dict]]:
    """Summarize one whole video with timestamps, or list every step of a routine it teaches.

    Args:
        video: the video ID or (part of) its title.
        focus: optional topic to focus on, e.g. "nutrition advice" or "all warm-up steps".
    """
    record = find_video(video)
    if record is None:
        return NOT_FOUND.format(query=video), []
    llm = ChatOpenAI(model=LLM_MODEL, temperature=0, max_tokens=900)
    prompt = SUMMARY_PROMPT.format(
        title=record["title"], channel=record["channel"],
        focus=f"Focus on: {focus}\n" if focus else "",
        transcript=transcript_with_timestamps(record),
    )
    summary = llm.invoke(prompt).content

    # The model copies the bare [m:ss] markers of the transcript. Turn them into full
    # citation tags in code (prompting alone did not work) and return them as sources.
    summary = BARE_TIME.sub(lambda m: f"[{record['title']}, {m.group(1)}]", summary)
    sources = []
    for ts in dict.fromkeys(re.findall(r", (\d{1,2}:\d{2}(?::\d{2})?)\]", summary)):
        seconds = sum(int(x) * 60 ** i for i, x in enumerate(reversed(ts.split(":"))))
        sources.append({"title": record["title"], "channel": record["channel"],
                        "timestamp": ts, "url": f"{record['url']}&t={seconds}s"})
    return summary, sources


@tool(response_format="content_and_artifact")
def create_weekly_plan(goal: str, days_per_week: int, experience: str = "beginner", equipment: str = "gym",
                       session_minutes: int = 60, avoid: list[str] | None = None) -> tuple[str, dict]:
    """Build a weekly workout plan from the programming rules and exercise demos in the videos.

    Args:
        goal: one of build_muscle, get_stronger, lose_fat, general_fitness.
        days_per_week: training days, 2 to 6.
        experience: beginner or intermediate.
        equipment: gym, dumbbells (at home) or bodyweight.
        session_minutes: time per workout, 20 to 120.
        avoid: body parts to spare because of pain or injury: knees, lower_back, shoulders.
    """
    try:
        plan = build_plan(goal, days_per_week, experience, equipment, session_minutes, avoid)
    except ValueError:
        return (f"Unknown value. goal: {', '.join(GOALS)}; experience: {', '.join(EXPERIENCE)}; "
                f"equipment: {', '.join(EQUIPMENT)}; avoid: {', '.join(AVOID)}."), {}
    return plan_as_text(plan), {"plan": plan}


TOOLS = [search_videos, list_videos, video_info, summarize_video, create_weekly_plan]


def get_checkpointer():
    """Neon Postgres when DATABASE_URL is set, otherwise in-RAM memory (lost on restart)."""
    url = os.getenv("DATABASE_URL", "")
    if not url or url.startswith("your-"):
        return MemorySaver()
    from langgraph.checkpoint.postgres import PostgresSaver
    from psycopg_pool import ConnectionPool

    # prepare_threshold=0: needed for Neon's pooled (pgbouncer) connection string
    pool = ConnectionPool(url, max_size=5, kwargs={"autocommit": True, "prepare_threshold": 0}, open=True)
    checkpointer = PostgresSaver(pool)
    checkpointer.setup()  # creates the checkpoint tables once; safe to call again
    return checkpointer


def build_agent(checkpointer=None):
    llm = ChatOpenAI(model=LLM_MODEL, temperature=0, max_tokens=1000)
    return create_agent(
        llm, TOOLS, system_prompt=SYSTEM_PROMPT,
        checkpointer=checkpointer if checkpointer is not None else get_checkpointer(),
        name="fitness_video_agent",
    )


def _summarize_turn(turn: list) -> dict:
    """The messages after one user message -> {answer, sources, tools_used, plan}."""
    sources, seen, tools_used, plan = [], set(), [], None
    for m in turn:
        if isinstance(m, AIMessage):
            tools_used += [c["name"] for c in m.tool_calls]
        if isinstance(m, ToolMessage) and isinstance(m.artifact, dict):
            plan = m.artifact.get("plan") or plan  # the last plan of the turn wins
            continue
        if isinstance(m, ToolMessage) and m.artifact:
            for s in m.artifact:
                if s["url"] not in seen:
                    seen.add(s["url"])
                    sources.append(s)
    answer = turn[-1].content if turn and isinstance(turn[-1], AIMessage) else ""
    return {"answer": answer, "sources": sources, "tools_used": tools_used, "plan": plan}


def ask(agent, question: str, thread_id: str) -> dict:
    """Send one user message. Returns {answer, sources, tools_used, plan} for this turn only."""
    config = {"configurable": {"thread_id": thread_id}}
    state = agent.get_state(config)
    earlier = state.values.get("messages", []) if state and state.values else []
    last_answer = next((m.content for m in reversed(earlier) if isinstance(m, AIMessage) and m.content), "")
    if not is_on_topic(question, last_answer):
        # polite fixed reply, saved in the thread like a normal turn so the history keeps it
        agent.update_state(config, {"messages": [HumanMessage(question), AIMessage(OFF_TOPIC_REPLY)]}, as_node="model")
        return {"answer": OFF_TOPIC_REPLY, "sources": [], "tools_used": [], "plan": None}
    messages = agent.invoke({"messages": [HumanMessage(question)]}, config)["messages"]
    last_human = max(i for i, m in enumerate(messages) if isinstance(m, HumanMessage))
    return _summarize_turn(messages[last_human + 1:])


def get_history(agent, thread_id: str) -> list[dict]:
    """All turns of a saved thread: [{question, answer, sources, tools_used}], oldest first."""
    state = agent.get_state({"configurable": {"thread_id": thread_id}})
    messages = state.values.get("messages", []) if state and state.values else []
    starts = [i for i, m in enumerate(messages) if isinstance(m, HumanMessage)]
    turns = []
    for n, i in enumerate(starts):
        end = starts[n + 1] if n + 1 < len(starts) else len(messages)
        turns.append({"question": messages[i].content, **_summarize_turn(messages[i + 1:end])})
    return turns
