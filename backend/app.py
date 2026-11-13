"""Phase 5: FastAPI backend.

    GET  /api/health                health check (no API calls)
    GET  /api/videos                the videos in the knowledge base
    POST /api/chat                  {message, thread_id?} -> {answer, sources, tools_used, plan?, thread_id}
    GET  /api/history/{thread_id}   all turns of a saved conversation
    POST /api/transcribe            audio file -> text (OpenAI Whisper API), for voice questions

Run locally from the project root:
    .venv/bin/uvicorn app:app --app-dir backend --reload
Interactive docs: http://127.0.0.1:8000/docs
"""
import logging
import os
import re
import uuid
from functools import lru_cache

from dotenv import find_dotenv, load_dotenv
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from openai import OpenAI
from pydantic import BaseModel, Field

load_dotenv(find_dotenv(usecwd=True))  # local only; on Vercel the keys come from project settings

from agent import ask, build_agent, get_history  # noqa: E402
from catalog import load_videos  # noqa: E402

log = logging.getLogger("api")

MAX_MESSAGE_CHARS = 2000
MAX_AUDIO_BYTES = 4 * 1024 * 1024  # Vercel rejects request bodies over 4.5 MB
TRANSCRIBE_MODEL = "whisper-1"
# The videos and answers are in English. Without a fixed language, Whisper guesses it from the accent
# and sometimes wrote an English question in Urdu (or another) script.
TRANSCRIBE_LANGUAGE = "en"
# Vocabulary hint for Whisper: without it "creatine" was heard as "creating".
TRANSCRIBE_PROMPT = ("A question about fitness: creatine, protein, hypertrophy, progressive overload, "
                     "deadlift, squat, bench press, push pull legs, cardio, calories, warm-up.")
THREAD_ID_PATTERN = r"^[A-Za-z0-9_-]{1,64}$"

app = FastAPI(title="Fitness Video QA API", version="1.0.0",
              description="Ask questions about fitness YouTube videos. Answers cite [Video title, m:ss].")

# The React dev server runs on another port. On Vercel frontend and API share one domain.
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "http://localhost:5173").split(","),
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)


# ---------- contract: request and response models ----------

class Source(BaseModel):
    title: str
    channel: str
    timestamp: str = Field(examples=["3:25"])
    url: str = Field(description="YouTube link that starts at the timestamp")


class Cue(BaseModel):
    text: str
    source: Source


class PlanExercise(BaseModel):
    id: str = Field(description="Exercise ID, also used for its diagram")
    name: str
    muscle: str
    sets: int
    reps: str = Field(examples=["8 to 12"])
    rest_seconds: int
    demo: Source = Field(description="Where the exercise is demonstrated in a video")
    cues: list[Cue]


class PlanDay(BaseModel):
    day: int
    name: str
    minutes: int = Field(description="Estimated length including a 5 minute warm up")
    exercises: list[PlanExercise]


class PlanInputs(BaseModel):
    goal: str
    days: int
    experience: str
    equipment: str
    minutes: int
    avoid: list[str]


class PlanRule(BaseModel):
    text: str
    source: Source


class Plan(BaseModel):
    inputs: PlanInputs
    split: str
    weekly_sets_per_muscle: int
    days: list[PlanDay]
    rules: list[PlanRule]
    notes: list[str]


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=MAX_MESSAGE_CHARS, examples=["How deep should I squat?"])
    thread_id: str | None = Field(default=None, pattern=THREAD_ID_PATTERN,
                                  description="Leave empty to start a new conversation")


class ChatResponse(BaseModel):
    answer: str
    sources: list[Source]
    tools_used: list[str]
    plan: Plan | None = Field(default=None, description="Set when the agent built a weekly workout plan")
    thread_id: str


class Turn(BaseModel):
    question: str
    answer: str
    sources: list[Source]
    tools_used: list[str]
    plan: Plan | None = None


class HistoryResponse(BaseModel):
    thread_id: str
    turns: list[Turn]


class Video(BaseModel):
    video_id: str
    title: str
    channel: str
    duration_seconds: int
    url: str
    thumbnail_url: str


class TranscribeResponse(BaseModel):
    text: str


# ---------- shared objects, created on the first request ----------

@lru_cache(maxsize=1)
def get_agent():
    return build_agent()  # opens the Neon connection pool once per server process


@lru_cache(maxsize=1)
def get_openai() -> OpenAI:
    return OpenAI()


# ---------- endpoints ----------
# Plain `def` (not async): FastAPI runs them in a thread pool, so the blocking
# LangChain / OpenAI calls don't block other requests.

@app.get("/api/health")
def health() -> dict:
    return {"status": "ok"}


@app.get("/api/videos", response_model=list[Video])
def videos() -> list[Video]:
    return [
        Video(video_id=v["video_id"], title=v["title"], channel=v["channel"],
              duration_seconds=v["duration_seconds"], url=v["url"],
              thumbnail_url=f"https://i.ytimg.com/vi/{v['video_id']}/hqdefault.jpg")
        for v in load_videos().values()
    ]


@app.post("/api/chat", response_model=ChatResponse)
def chat(req: ChatRequest) -> ChatResponse:
    thread_id = req.thread_id or uuid.uuid4().hex
    message = req.message.strip()
    if not message:
        raise HTTPException(422, "Message is empty.")
    try:
        turn = ask(get_agent(), message, thread_id)
    except Exception:
        log.exception("chat failed (thread %s)", thread_id)
        raise HTTPException(502, "The assistant could not answer. Please try again.")
    return ChatResponse(thread_id=thread_id, **turn)


@app.get("/api/history/{thread_id}", response_model=HistoryResponse)
def history(thread_id: str) -> HistoryResponse:
    if not re.fullmatch(THREAD_ID_PATTERN, thread_id):
        raise HTTPException(422, "Invalid thread_id.")
    try:
        turns = get_history(get_agent(), thread_id)
    except Exception:
        log.exception("history failed (thread %s)", thread_id)
        raise HTTPException(502, "Could not load the conversation.")
    return HistoryResponse(thread_id=thread_id, turns=turns)  # unknown thread -> empty list


@app.post("/api/transcribe", response_model=TranscribeResponse)
def transcribe(audio: UploadFile = File(description="Recorded question, e.g. audio/webm from the browser")) -> TranscribeResponse:
    content_type = (audio.content_type or "").split(";")[0]
    if not (content_type.startswith("audio/") or content_type == "video/webm"):
        raise HTTPException(415, f"Expected an audio file, got '{content_type or 'unknown'}'.")
    data = audio.file.read(MAX_AUDIO_BYTES + 1)
    if len(data) > MAX_AUDIO_BYTES:
        raise HTTPException(413, "Audio is too large (max 4 MB, about 4 minutes of speech).")
    if not data:
        raise HTTPException(422, "Audio file is empty.")
    try:
        result = get_openai().audio.transcriptions.create(
            model=TRANSCRIBE_MODEL, file=(audio.filename or "question.webm", data, content_type),
            prompt=TRANSCRIBE_PROMPT, language=TRANSCRIBE_LANGUAGE)
    except Exception:
        log.exception("transcription failed")
        raise HTTPException(502, "Could not transcribe the audio. Please try again.")
    text = result.text.strip()
    if not text:
        raise HTTPException(422, "No speech found in the audio.")
    return TranscribeResponse(text=text)
