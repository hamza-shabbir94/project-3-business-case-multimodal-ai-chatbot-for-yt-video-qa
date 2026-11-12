![logo_ironhack_blue 7](https://user-images.githubusercontent.com/23629340/40541063-a07a0a8a-601a-11e8-91b5-2f13e4e6b441.png)

# Project III | Business Case: Building a Multimodal AI ChatBot for YouTube Video QA

Building a chatbot that can translate YouTube videos into text and allow for natural language querying offers several compelling business cases.

- Firstly, it improves accessibility for users with hearing impairments or those who prefer reading over watching videos, thereby broadening the audience reach and enhancing brand reputation.
- Secondly, it enables efficient indexing and searching of video content, allowing users to quickly find specific information within videos, which is particularly useful for educational content and tutorials.
- Thirdly, it improves customer support by leveraging existing video content to provide instant, accurate responses to customer queries, thus reducing support costs and improving response times.
- Additionally, it serves educational and training purposes by enhancing the learning experience, enabling easy querying and access to specific segments of instructional videos. From an SEO and content marketing perspective, video transcripts can significantly boost website traffic and video discoverability by improving search engine indexing. Lastly, supporting multiple languages allows the chatbot to cater to a global audience, expanding market reach and enhancing user engagement.

### Project Overview

The goal of this final project is to develop a RAG system or AI bot that combines the power of text and audio processing to answer questions about YouTube videos. The bot will utilize natural language processing (NLP) techniques and speech recognition to analyze both textual and audio input, extract relevant information from YouTube videos, and provide accurate answers to user queries.

### Key Objectives

1. Develop a text-based question answering (QA) model using pre-trained language models. You may find it useful to fine-tune your model.
2. Integrate speech recognition capabilities to convert audio/video input (user questions) into text transcripts.
3. Build a conversational interface for users to interact with the bot via text or voice input. The latter is not a must.
4. Retrieve, analyze, and store into a vector database (pinecone, chromabd...) YouTube video content to generate answers to user questions.
5. Test and evaluate the bot's performance in accurately answering questions about YouTube videos.
6. Your AI must use agents with several tools and memory.

### Incorporating LangChain & LangSmith

To enhance the project with LangChain, you can utilize LangChain agents and functions for various tasks:

1. **Text Preprocessing:**
   - Use LangChain functions for tokenization, lemmatization, and other text preprocessing tasks as you see fit.

2. **QA Model Development:**
   - Utilize LangChain agents for fine-tuning pre-trained language models from HuggingFace or OpenAI for question answering tasks. If you use OpenAI api key provide by Ironhack, be mindful of the limited credits available for the entire class.

3. **Speech Recognition Integration:**
   - Incorporate LangChain agents for integrating speech recognition capabilities into the bot, allowing it to process audio and/or text inputs.

4. **Conversational Interface:**
   - Design conversational flows using LangChain agents to handle user interactions and route queries to the appropriate processing modules.

5. **YouTube Video Retrieval:**
   - Develop LangChain agents for accessing YouTube video content and extracting relevant metadata for analysis.

6. **Make use of a vector database of your choice**

7. **Make use of LangSmith platform for testing, evaluation, and deployment of your AI**

### Deliverables

1. Source code for the multimodal bot implementation, including LangChain integration.
2. Documentation detailing the project architecture, methodology, and LangChain usage.
3. Presentation slides summarizing the project objectives, process, and results.
4. This must be deployed as a web/mobile app.

### Project Timeline

- Day 1-2: Project kickoff, data collection, and text preprocessing using LangChain functions.
- Day 3-4: QA model development with LangChain agents and speech recognition integration.
- Day 5-6: Conversational interface development with LangChain agents and YouTube video retrieval.
- Day 7: Testing, evaluation, documentation, and presentation preparation.

## Resources

Below are some useful resources, but you don't have to use them.

- [YouTube](https://pypi.org/project/youtube-transcript-api/) Python [module](https://pypi.org/project/yt-dlp/2021.3.7/).
- [Whisper LLM](https://huggingface.co/openai/whisper-large-v3)
- Pre-trained language models available in libraries like [HuggingFace](https://huggingface.co/) Transformers.
- [LangChain](https://python.langchain.com/v0.1/docs/get_started/quickstart/) for text preprocessing, model development, and conversational interface design.
- [LangSmith](https://www.langchain.com/langsmith) for testing, performance checks, and [deploying](https://langchain-ai.github.io/langgraph/cloud/quick_start/#test-the-graph-build-locally) your model and app.

## Evaluation Criteria

- Accuracy of the bot in answering user questions about YouTube videos.
- Usability and responsiveness of the conversational interface (latency).
- Documentation quality and clarity of presentation slides.

## Conclusion

This final project offers an exciting opportunity to explore the intersection of NLP, speech recognition, and multimedia analysis in building a multimodal bot for YouTube video QA. By leveraging state-of-the-art techniques and technologies, including LangChain, you will gain valuable hands-on experience in developing innovative AI applications with real-world impact. You may find it to focus on my topic like health, nutrition, astrophysics...but this is an open ended project in some ways. So, feel free to build something you will be proud of. If you have other source of data other than YouTube you are free to use it.

---

# Our Implementation: Liftline (Fitness Video QA Bot)

**Live:** https://fitness-video-qa.vercel.app

A chatbot that answers questions about **fitness YouTube videos** (strength training, muscle growth, nutrition, recovery). It finds the right part of the right video and cites it as `[Video title, m:ss]`, with a link that opens the video at that second. The knowledge base has 32 videos from 9 channels, about 307 minutes.

It also builds a **weekly workout plan** from the user's goal, days per week, experience, equipment, time per workout and painful joints. Every exercise in the plan has a drawn diagram, form cues and a video demo that starts at the right second (see [Feature: weekly workout plan](#feature-weekly-workout-plan)).

## Tech Stack

| Job | Tool |
|---|---|
| Transcripts + metadata | `youtube-transcript-api`, `yt-dlp` (run locally) |
| Speech to text | Local Hugging Face Whisper (`faster-whisper`) for videos without captions; OpenAI Whisper API (`whisper-1`) for voice questions |
| Chunks + documents | LangChain `Document`, custom time-based chunker |
| Embeddings | OpenAI `text-embedding-3-small` (1536 dims) |
| Vector database | Pinecone (serverless, cosine) via `langchain-pinecone` |
| LLM | OpenAI `gpt-6-luna` (a reasoning model; until 12 November 2026 `gpt-4o-mini`) |
| Agent + memory | LangGraph agent (`create_agent`, 5 tools) + Postgres checkpointer on Neon |
| Weekly plan | Plain Python rules (`planner.py`, no LLM) + exercise catalog (`exercises.json`) |
| Backend | FastAPI on Vercel |
| Frontend | React + Vite on Vercel |
| Tracing + evaluation | LangSmith |

## Architecture

There are two pipelines. Pipeline 1 runs on a laptop and fills Pinecone. Pipeline 2 runs on Vercel for every question.

```
PIPELINE 1: INGEST (local scripts, once per video)

  videos.txt ──> ingest.py ──────────────────────────────> backend/data/<id>.json
                  │  metadata (yt-dlp)                            │
                  │  captions (youtube-transcript-api)            │
                  │  no captions / blocked? audio -> local Whisper│
                                                                  v
                                index_videos.py: clean -> chunk (~800 chars, keep start time)
                                                 -> OpenAI embeddings -> Pinecone "yt-video-qa"

PIPELINE 2: ASK (Vercel, every question)

  User ──> React + Vite ──> FastAPI /api/chat ──> LangGraph agent (gpt-6-luna) 
              ^                   │                   │        │
              │            /api/transcribe            │        └── memory: Postgres (Neon)
              │            (voice -> Whisper)         v
              │                                  tools: search_videos ──> Pinecone
              │                                         list_videos, video_info, summarize_video
              │                                         create_weekly_plan ──> planner.py + exercises.json
              └──── answer + [Title, 12:41] citations + video links (+ plan card when a plan was built)

  LangSmith traces every step and runs the evaluation.
```

## Project Structure

```
├── backend/
│   ├── data/                 # 32 transcripts as JSON (Phase 1, extended for the weekly plan)
│   ├── vectorstore.py        # Pinecone index + OpenAI embeddings, shared (Phase 2)
│   ├── rag.py                # baseline RAG chain: retriever -> prompt -> gpt-6-luna (Phase 3)
│   ├── catalog.py            # reads full transcripts for list / info / summarize (Phase 4)
│   ├── agent.py              # LangGraph agent: 5 tools + memory per thread_id (Phase 4)
│   ├── planner.py            # weekly plan builder: rules from the videos, no LLM (weekly plan)
│   ├── exercises.json        # 23 exercises: demo second + form cues (built by scripts/build_exercises.py)
│   ├── app.py                # FastAPI: /api/chat, /api/transcribe, /api/history, /api/videos (Phase 5)
│   ├── openapi.json          # API contract, generated from app.py (Phase 5)
│   ├── tests/test_api.py     # API tests: 13 free + 5 live (Phase 5)
│   ├── tests/test_planner.py # plan builder: 2,405 free tests (every input combination)
│   └── requirements.txt      # API clients only, for Vercel (no torch)
├── frontend/                 # React + Vite site (Phase 6): one HTML file per page
│   ├── index.html            # / landing page (src/pages/Landing.jsx)
│   ├── chat/index.html       # /chat/ chat app (src/App.jsx)
│   ├── privacy/, terms/, 404.html   # legal pages and branded 404 (src/pages/StaticPage.jsx)
│   ├── src/styles/tokens.css # design system: colors, text styles, spacing, radius, motion
│   ├── src/content/faq.js    # FAQ text, also written into the landing page as FAQ schema
│   ├── src/App.jsx           # chat: layout, chat state, thread_id in localStorage, history reload
│   ├── src/components/       # Message (markdown + citation links), Composer (text + mic), VideoList
│   │                         # weekly plan: PlanForm (dialog), PlanCard (day tabs, cues, rules),
│   │                         #   ExerciseDiagram (start/end pose), VideoDemo (player at the demo second)
│   ├── src/content/poses.js  # joint coordinates for every exercise diagram (+ poses.test.js)
│   ├── src/citations.js      # [Title, m:ss] -> YouTube link at that second (+ citations.test.js)
│   ├── src/api.js            # calls to /api/*
│   └── src/useRecorder.js    # microphone recording (MediaRecorder)
├── scripts/                  # run locally, never on Vercel
│   ├── check_setup.py        # checks keys + one traced LLM call (Phase 0)
│   ├── ingest.py             # collects transcripts + metadata (Phase 1)
│   ├── index_videos.py       # cleans, chunks, embeds, uploads to Pinecone (Phase 2)
│   ├── test_rag.py           # runs the test set: retrieval hit@k + answers (Phase 3)
│   ├── chat.py               # chat with the agent in the terminal, or run the demo (Phase 4)
│   ├── build_exercises.py    # builds backend/exercises.json: finds the second of every form cue (weekly plan)
│   ├── videos.txt            # the YouTube links we use
│   └── requirements.txt      # local tools: yt-dlp, faster-whisper, ...
├── eval/
│   ├── qa_dataset.csv        # 13 test questions with reference answers (Phase 3)
│   └── results/              # saved answers of each test run, for comparison
├── vercel.json               # Vercel Services: /api/* -> FastAPI, everything else -> React (Phase 7)
├── .vercelignore             # keeps .env, .venv, node_modules, scripts/, eval/ out of the upload
├── .env.example              # placeholder keys
└── README.md
```

## Setup

```bash
# 1. Virtual environment (Python 3.13)
python3 -m venv .venv
.venv/bin/pip install -r scripts/requirements.txt

# 2. Keys: copy .env.example to .env and fill in your own values.
#    The scripts also find a .env in a parent folder.
cp .env.example .env

# 3. Frontend (Node 20+)
cd frontend && npm install
```

Required keys: `OPENAI_API_KEY`, `LANGSMITH_API_KEY`, `LANGSMITH_TRACING=true`, `LANGSMITH_PROJECT`, `PINECONE_API_KEY`. `DATABASE_URL` (Neon Postgres) stores chat memory; without it the agent uses in-RAM memory, which is fine locally but not on Vercel. Never commit `.env`.

## How to Run

```bash
# Phase 0: check keys and LangSmith tracing
.venv/bin/python scripts/check_setup.py

# Phase 1: collect transcripts for every link in scripts/videos.txt
.venv/bin/python scripts/ingest.py                  # skips videos already saved
.venv/bin/python scripts/ingest.py --force-whisper  # test the Whisper path

# Weekly plan: rebuild the exercise catalog (finds the exact second of every form cue)
.venv/bin/python scripts/build_exercises.py --show

# Phase 2: chunk, embed and upload to Pinecone
.venv/bin/python scripts/index_videos.py --dry-run  # show chunks only, no API calls
.venv/bin/python scripts/index_videos.py            # skips videos already indexed
.venv/bin/python scripts/index_videos.py --reindex  # replace all chunks

# Phase 3: test the RAG chain
.venv/bin/python scripts/test_rag.py --retrieval              # hit@k for k=1..8, no LLM calls
.venv/bin/python scripts/test_rag.py --label phase3_v2         # answer all test questions, save results
.venv/bin/python scripts/test_rag.py --question "Is creatine safe?"

# Phase 5: run the API (docs at http://127.0.0.1:8000/docs)
.venv/bin/uvicorn app:app --app-dir backend --reload
.venv/bin/pytest backend/tests -m "not live"        # free tests (2,418, includes the plan builder)
.venv/bin/pytest backend/tests/test_planner.py       # plan builder only (2,405 tests, no API calls)
.venv/bin/pytest backend/tests                       # + 5 live tests (OpenAI, Pinecone, Neon)

# Phase 6: frontend (start the API first; Vite forwards /api to it)
cd frontend && npm run dev                           # http://localhost:5173
cd frontend && npm test                              # citation + exercise diagram unit tests (9)

# Phase 4: chat with the agent
.venv/bin/python scripts/chat.py --demo              # scripted test of all tools + memory
.venv/bin/python scripts/chat.py                     # interactive chat
.venv/bin/python scripts/chat.py --thread my-test    # continue a thread (needs DATABASE_URL)
```

## Progress

| Phase | What | Status |
|---|---|---|
| 0 | Setup, keys, LangSmith tracing | Done |
| 1 | Data collection (transcripts + metadata) | Done |
| 2 | Chunk, embed, store in Pinecone | Done |
| 3 | Baseline RAG chain | Done |
| 4 | Agent with tools and memory | Done |
| 5 | FastAPI backend | Done |
| 6 | React + Vite frontend | Done |
| 7 | Deploy on Vercel | Done: live at https://fitness-video-qa.vercel.app |
| Design | Liftline landing page and design system | Done |
| Feature | Weekly workout plan (14 more videos, plan builder, diagrams, video demos) | Done: live |
| 8 | Evaluation, docs, slides | Planned |

Phases 1 to 6 were built and tested with the first 18 videos; their results below say "18 videos". The weekly plan feature added 14 videos, so the app now has 32.

## Phase Details

### Phase 0: Setup
- Folder structure, `.gitignore` (keeps `.env`, `*.key`, `secrets/`, `.venv/` out of git), `.env.example` with placeholders.
- Two requirement files: `backend/requirements.txt` holds API clients only, because Vercel functions have a size limit. `scripts/requirements.txt` adds the local tools.
- `scripts/check_setup.py` reports which keys are set (never their values) and makes one `gpt-6-luna` call.
- **Result:** the call returned `setup ok` and appeared as a trace in LangSmith project `yt-video-qa`.

### Phase 1: Data Collection
For each link in `scripts/videos.txt`, `scripts/ingest.py`:
1. gets metadata with `yt-dlp` (title, channel, duration, upload date);
2. gets captions with `youtube-transcript-api` (each line with its start time);
3. if there are no captions, or YouTube blocks the captions request, downloads the audio and transcribes it with local Whisper (`faster-whisper`, model `base`);
4. saves `backend/data/<video_id>.json`, skips videos already saved, and waits 3 seconds between videos.

**Result:** 18 videos, about 179 minutes, 34,676 words. 3 with manual captions, 12 with auto captions, 3 transcribed by Whisper. Timestamps were checked: in order, none past the video's end.

### Phase 2: Chunk, Embed, Store
`scripts/index_videos.py`:
1. **Light cleaning:** removes `[Music]`, `[Applause]`, `>>` and extra spaces. No lemmatization (see Design Decisions).
2. **Time-based chunking:** joins caption segments until a chunk reaches ~800 characters (about 1 minute of speech), with ~150 characters of overlap. Sentence splitting would not work, because auto captions often have no punctuation.
3. **Metadata per chunk:** `video_id`, `title`, `channel`, `url`, `start_seconds`, `end_seconds`, `timestamp` (e.g. `0:48`), `timestamp_url` (e.g. `...&t=48s`), `chunk_index`, `transcript_source`.
4. **Stable IDs** like `Pok0Jg2JAkE-0003`: rerunning skips indexed videos, so nothing is embedded twice.

**Result:** 295 chunks uploaded to Pinecone index `yt-video-qa` in 37 seconds, at a cost of a fraction of a cent. Retrieval test: 8 of 8 fitness questions returned the correct video as the top result.

| Question | Top result |
|---|---|
| how much protein should I eat per day | Jeff Nippard, protein video `[0:48]` |
| is creatine safe and how does it work | McMaster, creatine video `[4:16]` |
| how deep should I squat | Jeremy Ethier, squat video `[3:25]` |
| how many sets per week to build muscle | Jeremy Ethier, sets video `[0:00]` |
| does sleep affect muscle growth | Institute of Human Anatomy, sleep video `[7:20]` |
| is cardio or weight lifting better for losing fat | Precision Nutrition `[5:07]` |
| how do I avoid losing muscle while dieting | Jeff Nippard, dieting video `[0:31]` |
| what is progressive overload | PictureFit `[0:00]` |

### Phase 3: Baseline RAG Chain
`backend/rag.py` builds an LCEL chain with no agent yet:

```
question -> Pinecone retriever (top-k chunks) -> prompt with excerpts -> gpt-6-luna -> answer + sources
```

- **Prompt rules:** answer only from the excerpts; say "the videos don't cover it" otherwise; cite every fact as `[Video title, m:ss]`; keep the context of numbers (units, body weight, bulking or cutting); give every step for how-to questions; flag numbers that look wrong.
- Each excerpt is shown to the model with the exact citation tag to copy, so citations have one format the frontend can turn into links.
- The chain returns the retrieved documents too, so sources can be shown as links that open the video at that second.
- `max_tokens=2000` (gpt-6-luna only accepts the default temperature, and its limit also counts its thinking; with gpt-4o-mini it was `temperature=0`, `max_tokens=400`). Every run is traced in LangSmith (run name `baseline_rag`).

**Test set:** `eval/qa_dataset.csv` has 13 questions written from the transcripts, each with the expected video(s) and a reference answer. It covers protein, creatine, squat depth, training volume, progressive overload, fat loss, sleep, push pull legs, warm-up and dieting, plus one caption-error question (q03) and one out-of-scope question (q13).

**Retrieval (hit@k, 12 in-scope questions):** hit@1 = 92%, hit@2 to hit@8 = 100%.

**Tuning:** two runs on the same questions, saved in `eval/results/`. These runs used gpt-4o-mini, the model before the switch to gpt-6-luna.

| | v1: k=4, first prompt | v2: k=6, improved prompt |
|---|---|---|
| Citation format `[Title, m:ss]` | mixed (`[1, 2]`, `[1, 3:27]`) | 13/13 correct |
| Protein (q01) | numbers without context | 1.6-2.2 g/kg, with the 75 kg example |
| Cardio vs weights (q08) | missed the conclusion | "combine both" included |
| Sleep (q09) | missed consistency | consistency included |
| Warm-up (q11) | no structure | 4 warm-up sets with percentages and rest times |
| Dieting (q12) | missed "maintain strength" | 4 strategies including strength |
| Caption error (q03) | correct (~64 g) | correct (~64 g) |
| Out of scope (q13) | refused | refused |
| Median / max latency | 2.0 s / 3.7 s | 2.5 s / 5.2 s |

**Chosen setting:** k=6 with the improved prompt. All numbers in the answers were checked against the transcripts, and none were invented.

### Phase 4: Agent with Tools and Memory
`backend/agent.py` builds a LangGraph agent with LangChain's `create_agent` (the teacher's notebooks use the older `initialize_agent`, which langchain 1.x removed).

```
user message + thread_id -> agent (gpt-6-luna) -> picks tool(s) -> answer with [Title, m:ss] citations
                               ^                                      |
                               └──── memory: all messages of the thread (checkpointer)
```

| Tool | What it does | Data |
|---|---|---|
| `search_videos(query, video_id?)` | top-6 chunks; with `video_id` only inside one video | Pinecone |
| `list_videos()` | every video (now 32) with channel, length, ID | `backend/data/*.json` |
| `video_info(video)` | channel, length, upload date, link; finds a video by ID or part of its title | `backend/data/*.json` |
| `summarize_video(video, focus?)` | summary of the whole video, or every step of a routine, with timestamps | full transcript + one extra LLM call |
| `create_weekly_plan(goal, days_per_week, experience?, equipment?, session_minutes?, avoid?)` | weekly plan; added with the [weekly plan feature](#feature-weekly-workout-plan) | `planner.py` + `exercises.json`, no LLM |

- **Plans as an artifact:** `create_weekly_plan` returns a short text for the LLM and the full plan as the tool's artifact (`{"plan": ...}`). The LLM never rewrites the plan; `ask()` passes it to the frontend unchanged.

- **Sources:** `search_videos` and `summarize_video` also return their sources (title, timestamp, link with `&t=Ns`) next to the text. `ask()` collects them per turn for the frontend.
- **Memory:** a LangGraph checkpointer saves every message under its `thread_id`. With `DATABASE_URL` set it uses `PostgresSaver` on Neon (survives restarts and works on serverless Vercel); otherwise `MemorySaver` (in RAM, local tests only).
- **Citation fix:** the summary LLM copied the bare `[1:00]` markers from the transcript, and the agent then dropped titles in the rest of the thread. Prompt rules did not fix this, so `summarize_video` now rewrites `[1:00]` to `[Title, 1:00]` with a regex.
- **Off-topic check (added later):** before the agent runs, `is_on_topic()` makes one small gpt-6-luna call that answers ON or OFF. It sees the message and the start of the previous answer, so follow-ups like "give me the link to that video" count as ON. OFF (the date, the weather, news, coding, ...) returns a fixed polite reply: "Sorry, I can't help with that. I can only answer questions about fitness...", saved in the thread so the history keeps it. Why not a rule in the agent prompt? Every refusal rule we tried there made the model (then gpt-4o-mini) also refuse real questions such as "Is creatine safe?" and "How much sleep do I need?". Tested on 72 messages (52 fitness, 20 off-topic) with gpt-4o-mini: 0 wrong. Tested again on 43 messages (30 fitness, 13 off-topic) with gpt-6-luna: 0 wrong.

**Demo (`scripts/chat.py --demo`), one thread, 7 turns:**

| Turn | Tests | Tools used | Result |
|---|---|---|---|
| Which videos do you have? | `list_videos` | list_videos | all 18 listed |
| How much protein per day to build muscle? | `search_videos` | search_videos | bulking, cutting, high body fat and minimum figures, cited |
| And how much of that in one meal? | memory follow-up | search_videos | understood "that" = protein; 20-25 g vs 40-70 g studies |
| Who made the Institute of Human Anatomy protein video, how long? | `video_info` | video_info | 16 min, uploaded 2023-06-18 |
| Summarize that video. | `summarize_video` + memory | summarize_video | found "that video" from the last turn; 7 bullets with times |
| Give me a keto pancake recipe. | out of scope | none | "The videos do not cover keto pancake recipes." |
| What was my first question about nutrition? | memory recall | none | repeated the protein question |

**Memory on Neon Postgres (project in AWS us-east-2, pooled connection):**
- `PostgresSaver.setup()` created the tables `checkpoints`, `checkpoint_blobs`, `checkpoint_writes`, `checkpoint_migrations`.
- Restart test: process 1 asked "How deep should I squat?". A **new process** with the same `thread_id` answered "You asked how deep you should squat." A new `thread_id` answered "This is the start of the conversation."
- The 7-turn demo also passes with `PostgresSaver`.
- **Fix:** on an empty thread the agent first invented an earlier question. A prompt rule fixed it, and its first wording broke the opposite case (a thread with history also said "start of the conversation"), so both cases are tested.

**Compared with Phase 3:** the warm-up question now has every part (5 min cycling, dynamic stretches, foam rolling, and all 4 warm-up sets with 50/70/90% and rest times), because the agent calls `summarize_video`. Numbers were checked against the transcripts.

### Phase 5: FastAPI Backend
`backend/app.py` puts the agent behind an HTTP API. The Pydantic models are the contract; `backend/openapi.json` is generated from them, and `/docs` shows it interactively.

| Endpoint | Request | Response |
|---|---|---|
| `GET /api/health` | - | `{status: "ok"}` |
| `GET /api/videos` | - | all videos (now 32): id, title, channel, duration, url, thumbnail |
| `POST /api/chat` | `{message, thread_id?}` | `{answer, sources[], tools_used[], plan?, thread_id}`; no `thread_id` starts a new conversation; `plan` is set when the agent built a weekly plan (typed models `Plan`, `PlanDay`, `PlanExercise`, `Cue`, `PlanRule`) |
| `GET /api/history/{thread_id}` | - | all turns of a thread from Neon, so the frontend can reload a chat |
| `POST /api/transcribe` | audio file (multipart, max 4 MB) | `{text}` from the OpenAI Whisper API (`whisper-1`) |

- **Voice flow:** the browser records audio -> `/api/transcribe` -> the text goes into `/api/chat` like a typed question. Voice is a separate endpoint so the user can check the text before sending it.
- **Validation:** message 1-2000 characters, `thread_id` only letters, digits, `-`, `_` (max 64). Audio: only `audio/*` or `video/webm`, max 4 MB, because Vercel rejects request bodies over 4.5 MB.
- **Errors:** 422 bad input, 413 audio too large, 415 not audio, 502 when OpenAI, Pinecone or Neon fail. Details go to the server log, never to the user.
- **CORS:** allows the Vite dev server (`http://localhost:5173`); change with `CORS_ORIGINS`. On Vercel frontend and API share one domain.
- Endpoints are plain `def`, so FastAPI runs the blocking LangChain calls in a thread pool. The agent and the Neon connection pool are created on the first request and reused.

**Tests (`backend/tests/test_api.py`):** 18 of 18 pass. 13 free tests (validation, file type and size, CORS, static endpoints) and 5 live tests (squat answer with citation and timestamp link, follow-up from memory, history, new thread, out-of-scope, unknown thread, and since the weekly plan feature: plan, "my knee hurts" follow-up, plan in the history; and the polite reply to an off-topic question).

**Manual test with `curl` and a voice question made with macOS `say`:**
- "How much creatine should I take per day?" -> transcribed -> answer "5 grams" cited to the beginner gym guide at 10:05. Checked: the creatine video gives no dose; the guide says "five grams every day".
- Follow-up "Is it safe for teenagers?" -> "the videos do not specifically address teenagers", plus what they say about general safety.
- **Fix:** Whisper first heard "creatine" as "creating". A vocabulary `prompt` (creatine, hypertrophy, deadlift, ...) fixed it. Silence returns 422 instead of an empty question.

### Phase 6: React + Vite Frontend
`frontend/` is a single-page chat app (React 19, Vite 8, `react-markdown` for the answer formatting).

- **Chat:** typed questions, 4 example questions on an empty chat, a typing indicator, Enter to send (Shift+Enter for a new line).
- **Citations as links:** every `[Video title, m:ss]` in an answer becomes a small `▶ 3:17` button that opens YouTube at that second (the full title shows on hover). Below each answer, "Sources" lists the videos and times the agent retrieved.
- **Voice:** the 🎤 button records with the browser's `MediaRecorder` (max 60 s) and sends the audio to `/api/transcribe`. The text goes into the text box, so the user can check it before sending.
- **Memory:** the `thread_id` is kept in `localStorage`. On reload the app loads the conversation from `/api/history`. "New chat" starts a new thread.
- **Video list:** all videos (18 then, 32 now) with thumbnail, length and channel, plus a "Summarize" button that asks the agent for a summary of that video.
- **Weekly plan (added later):** a "Create my plan" button in the toolbar and on the empty chat opens the plan form; the plan appears as a card inside the answer.
- **Layout:** light and dark mode follow the system setting. On phones (under 760 px) the video list moves behind a "Videos" button.
- **Dev setup:** Vite forwards `/api` to FastAPI on port 8000, so the browser sees one origin, as it will on Vercel.

**Tests:**
- `npm test`: 6 of 6 unit tests for the citation parser (times like `1:02:03`, titles with commas, two citations side by side, unknown titles left as text).
- `npm run lint` clean, `npm run build` 107 kB gzipped JavaScript.
- **End-to-end in headless Chrome** (Playwright, with a fake microphone playing a recorded question), all steps passed:

| Step | Result |
|---|---|
| Page load | 18 videos and 4 example questions shown |
| Click the protein example | answer with 10 citation links, all to `youtube.com/watch?v=...&t=Ns`, none left as plain text |
| Type a follow-up | answered from memory ("that" = protein) |
| Reload the page | both turns restored from Neon |
| Record a voice question | text box shows "How many sets per week should I do to build muscle?" |
| New chat | empty chat |
| Phone width 390 px | no horizontal scroll; Videos button swaps the list and the chat |
| Browser console | no errors |

### Design pass: landing page and design system
The site is called **Liftline** (lift + timeline: every answer points to a moment on a video's timeline). It follows a landing page design skill (page structure, conversion copy, and strict visual rules).

- **Full screen hero:** a dark gym photo (CC0, Binyamin Mellish, credited in the footer) under a flat shade, an uppercase headline on the right, and two glass cards with real project data: the lengths of the videos by topic (now 32 videos, 307 min) and the retrieval score (right video first for 11 of 12 test questions). Every section below is a full width band, alternating base, surface and black backgrounds, and the final call to action sits on the photo again. Orange accent (`#ff6b1a`) with dark button text for contrast.

- **Pages:** `/` landing page, `/chat/` the chat app, `/privacy/`, `/terms/`, and a branded 404. Each is its own HTML file, so Vercel serves them as static files. `/chat`, `/privacy` and `/terms` redirect to the version with a slash (`vercel.json`).
- **Landing page (layout A, classic hero plus sections):** hero with one call to action ("Ask your first question") and a real example answer with working timestamp links; problem and solution; 6 benefits (including the weekly plan); a large tagline whose words light up one by one while scrolling; how it works in 3 steps; test results as proof; the 32 videos; 10 FAQ answers (including "Can it make a workout plan for me?"); final call to action. All numbers come from this README's test results. There are no invented testimonials.
- **Design system (`src/styles/tokens.css`):** one font (Geist, with Geist Mono for timestamps); named text styles (`heading-1`, `body-6`, `caption-5`, ...) on the Tailwind type scale; spacing only from 2 to 96 px steps; Tailwind radii with nested radius = outer minus gap; flat backgrounds (the only gradient is on the hero heading text); approved dark backgrounds; Phosphor icons; one easing curve, `cubic-bezier(0.22, 1, 0.36, 1)`, animating only transform and opacity, with `prefers-reduced-motion` support.
- **States:** skeleton loaders shaped like the video list and an answer (no spinners), a composed empty chat, inline errors, hover, press and focus styles on every button, and a skip-to-content link.
- **SEO:** title, description, canonical, Open Graph and Twitter tags, `og.png` (1200 x 630), and FAQ schema (JSON-LD) built from `src/content/faq.js`.

**Tests (headless Chrome, light and dark, 1440 px and 390 px):** no horizontal scroll at 390 px, the call to action is in the first screen on phones, all sections and all 17 tagline words reveal, the mobile menu opens and closes with Escape, only Geist fonts load, and the copy has no hyphens, no italics, no weights above 700 and none of the banned filler words. No console errors. The chat end-to-end test (answer with 10 citation links, follow-up from memory, reload from Neon, voice question, new chat, phone layout) passes in the new design, both with the Vite dev server and with `vercel dev -L`.

### Feature: weekly workout plan
A "Create my plan" form in the chat (goal, days per week, experience, equipment, time per workout, anything that hurts) gives a weekly plan. Every exercise has a simple diagram, form cues and a video demo that starts at the right second.

```
form -> chat message -> agent -> create_weekly_plan tool -> planner.py (no LLM)
                                                               |-- split for the days     (rules from the videos)
                                                               |-- exercises.json         (equipment, avoid, demo, cues)
                                                               |-- sets, reps, rest       (rules from the videos)
                                                               '-- fit to the time per workout
     <- short answer with a citation + the plan as structured data -> plan card in the chat
```

- **14 new videos** (technique for overhead press, rows, pull ups, pulldown, Romanian deadlift, hip thrust, push ups, split squats, plank, arms, home training, short sessions): 32 videos, 510 passages in Pinecone.
- **Plan builder (`backend/planner.py`) is plain code, not an LLM**, so the same inputs always give the same plan and every input combination is tested. Each programming rule is a quote from a video with its second, for example "10 to 20 sets per muscle per week" (Jeremy Ethier, 2:02), "8 to 15 reps for muscle growth" (Institute of Human Anatomy, 14:20), "push, pull, legs for 6 days" (trainer winny, 2:22), "combine weights and cardio for fat loss" (Precision Nutrition, 5:00).
- **Splits:** 2 to 3 days full body, 4 days workout A and B, 5 days push, pull, legs plus upper and lower, 6 days push, pull, legs twice. Sets per exercise come from the weekly target (6, 10 or 14 sets per muscle), capped at 2 to 4; beginners get 8 to 10 reps; "get stronger" gets heavy 3 to 5 rep sets on the main barbell lifts. Exercises that are left out of a session to fit the time are the last accessories.
- **Exercise catalog (`backend/exercises.json`, 23 exercises, 69 cues):** gym, dumbbell and bodyweight versions, and which joints each one loads (knees, lower back, shoulders), so "my knee hurts" swaps the barbell squat for a box squat. The cues were drafted by an LLM from the transcripts; `scripts/build_exercises.py` finds the exact second of each cue in the transcript and fails if the words are not there, and every cue was then checked by hand.
- **Agent:** the form becomes a normal chat message, so memory works: "make it 3 days" or "my lower back hurts" rebuilds the plan with the earlier answers kept. The agent replies in 2 to 4 sentences with one cited rule; the plan itself goes to the frontend as structured data (`plan` in the `/api/chat` response, typed in `openapi.json`).
- **Frontend:** plan card with one tab per day; each exercise opens to show the diagram (start and end position, drawn as joint coordinates in `src/content/poses.js`), the cues with timestamp links, and a YouTube player that loads only when clicked and starts at the demo second.

**Tests:**
- `pytest backend/tests/test_planner.py`: 2,405 tests. Every combination of goal, days, experience, equipment, session length and painful joints (2,400 plans) respects the equipment and the avoided joints, keeps 2 to 4 sets per exercise and fits the session length; every cue and rule points to a second inside its video.
- Live API test: a plan request returns 4 days with demo links; "My knee hurts" keeps the 4 days and adds knees to avoid; the plan comes back from the history.
- `npm test`: 9 tests, including "every exercise has a diagram" and the joined citation fix below.
- Browser test (headless Chrome): form -> plan card with 4 day tabs and the chosen inputs -> diagrams, cue links with `&t=` -> video player starts at the demo second -> day 2 tab -> 11 cited rules -> "Make it 3 days instead" gives a 3 day plan with the same inputs -> plans come back after a reload -> no overflow at 390 px -> no console errors. All 10 steps pass locally and on production (https://fitness-video-qa.vercel.app/chat/).

**Fixed while testing:** with 32 videos the video section is about 8,000 px tall on phones, so the 10% scroll reveal threshold was never reached (now 0); the model once joined two citations in one bracket (`[A, 3:17; B, 2:03]`), which the link converter now splits.

### Phase 7: Deploy on Vercel
One Vercel project, `fitness-video-qa`, with two [Vercel Services](https://vercel.com/docs/services) on one domain:

```
https://<project>.vercel.app/api/*  ->  backend  (FastAPI, Python 3.13, one Vercel Function, maxDuration 60 s)
https://<project>.vercel.app/*      ->  frontend (Vite build, served from the CDN)
```

- The backend receives the full path (`/api/chat`), so the FastAPI routes are unchanged. Same domain, so no CORS.
- `backend/requirements.txt` pins the versions tested locally; `backend/.python-version` sets Python 3.13.
- A clean install of the backend is 172 MB (Vercel's Python limit is 500 MB). Tests, `pytest.ini` and `openapi.json` are excluded from the function.
- The GitHub repo is connected: a push to `main` deploys production, other branches get preview URLs.
- **Keys** are set in Vercel (Settings -> Environment Variables), never uploaded: `OPENAI_API_KEY`, `PINECONE_API_KEY`, `DATABASE_URL`, `LANGSMITH_API_KEY`, `LANGSMITH_TRACING`, `LANGSMITH_PROJECT`.

**Local test of the deploy config:** `vercel dev -L` runs both services like Vercel does. The headless Chrome end-to-end test (8 steps: videos, answer with 10 citation links, follow-up from memory, reload from Neon, voice question, new chat, phone layout, no console errors) passed through it.

**Live test (production, headless Chrome):** all 8 chat steps pass on https://fitness-video-qa.vercel.app (answer with 10 citation links, follow-up from memory, reload from Neon, voice question, new chat, phone layout, no console errors). The landing page checks pass in light and dark at 1440 px and 390 px. Unknown paths return the branded 404 page with status 404 (a service-level route in `vercel.json`).

### Model switch: gpt-4o-mini to gpt-6-luna (12 November 2026)
All LLM calls (RAG chain, agent, `summarize_video`, topic check, setup check) now use `gpt-6-luna`. It is a reasoning model, so three things changed:
- **No `temperature=0`:** the model only accepts the default temperature and returns an error otherwise.
- **Higher `max_tokens`:** the limit also counts the model's thinking. The topic check went from 2 to 300 tokens, the RAG chain from 400 to 2000, the agent and `summarize_video` to 3000. With the old limits the call fails.
- **Answer text is read with `.text`:** the model returns a list of text blocks, not a plain string.

**Tests with gpt-6-luna:** all 2,423 pytest tests pass (5 live) and all 9 vitest tests. Topic check: 43 of 43 messages correct, and follow-ups still count as ON. Spot checks (protein, creatine, sleep, squat summary) cite the videos correctly. "Does caffeine help my workout?" now only says the videos don't cover it, with no outside knowledge. Answers take 8 to 18 s, slower than with gpt-4o-mini. The Phase 3 tuning numbers above were measured with gpt-4o-mini.

## Known Issues and Limitations

- **YouTube rate limits:** after many fast requests, YouTube blocks the captions endpoint (`IpBlocked`). `ingest.py` then falls back to Whisper. Cloud servers like Vercel are blocked even more often, so ingestion runs locally.
- **Auto-caption errors:** auto captions can contain wrong numbers. Example: one chunk says "about 655 g of protein per day" for an 80 kg person, where 0.8 g/kg gives about 64 g. The LLM may repeat such errors, so the test set includes questions like this.
- **Extra citations:** the model sometimes adds a citation to a chunk that is only loosely related (for example a progressive overload video cited in the sets-per-week answer).
- **Long how-to answers:** the Phase 3 chain misses parts of routines spread across a whole video (the warm-up answer misses the 5-minute cycling step). Fixed in Phase 4: the agent calls `summarize_video`, which reads the whole transcript.
- **Chunk boundaries:** a number and its context can land in different chunks. Example: the agent gives "120-165 g of protein" without "for a 75 kg person", because the "1.6-2.2 g/kg" sentence is in the previous chunk.
- **Agent latency:** 8-18 s per answer with gpt-6-luna, which thinks before it answers (2-16 s with gpt-4o-mini). The agent needs one LLM call to pick a tool and one to answer; `summarize_video` adds a third. The plain RAG chain took about 2.5 s with gpt-4o-mini.
- **Tool choice is not always ideal:** for "Summarize the creatine video" the agent sometimes uses `search_videos` instead of `summarize_video`. The answer is still correct, but it may be less complete.
- **Calculated numbers:** the agent sometimes works out its own example from a video's range ("for 180 lbs, about 145-218 g"). The math is close, but the number is not said in any video. To be measured in the Phase 8 evaluation.
- **Public API with no login:** anyone with the URL can ask questions, which costs OpenAI credits. Set a monthly spending limit in the OpenAI dashboard; rate limiting would be the next step.
- **Growing history:** every message of a thread is sent to the model again. Fine for a demo; long threads would need trimming or summarizing old messages.
- **Exercise diagrams are simplified:** stick figures from the side, drawn by hand from joint coordinates. They remind of the start and end position; the video demo shows the real technique.
- **Demo start times:** for some technique videos the demo link starts at 0:20, near the start of the video, not at a precise second.
- **Plan programming is rule based:** it covers the rules found in the 32 videos (volume, reps, rest, splits). It does not adapt week to week or know about specific injuries beyond "spare knees, lower back or shoulders".
- **`vercel dev` and the 404 route:** the service level 404 route in `vercel.json` runs before the Vite dev server in `vercel dev`, so every page shows the 404 there. Production is not affected (static files are served first). For local work, use `npm run dev` with uvicorn.
- **`av` version pin:** `av` 16+ breaks `faster-whisper` 1.2.x, so `scripts/requirements.txt` pins `av<16`.

## Design Decisions: README Points We Interpret Differently

Some parts of the brief mix up what each tool does. These are the choices we made and why.

### 1. Fine-tuning with LangChain agents
- **Brief says:** use LangChain agents to fine-tune pre-trained models.
- **Why it doesn't fit:** agents don't train models. They call tools at runtime. Fine-tuning is a separate training job (OpenAI fine-tuning API or Hugging Face Trainer).
- **Our choice:** skip fine-tuning. In a RAG system, better chunking and retrieval improve answers much more.

### 2. Speech recognition with LangChain agents
- **Brief says:** use LangChain agents to integrate speech recognition.
- **Why it doesn't fit:** turning audio into text is a fixed step, not a decision for an agent.
- **Our choice:** Whisper runs in a plain FastAPI endpoint (`/api/transcribe`) before the agent. The agent only receives the text.

### 3. Tokenization and lemmatization
- **Brief says:** use LangChain functions for tokenization, lemmatization and other preprocessing.
- **Why it doesn't fit:** embedding models are trained on normal sentences. Lemmatizing ("running" → "run") removes meaning and can make search worse.
- **Our choice:** light cleaning only (remove tags like `[Music]` and extra spaces). Tokens are used only to measure chunk size.

### 4. LangSmith for deployment
- **Brief says:** use LangSmith for testing, evaluation and deployment.
- **Why it doesn't fit:** LangSmith deployment only targets LangGraph Platform. We deploy on Vercel (FastAPI backend + React frontend).
- **Our choice:** LangSmith is used for tracing and evaluation. Vercel handles deployment.

### 5. Testing only on Day 7
- **Brief says:** testing and evaluation happen on Day 7.
- **Why it doesn't fit:** if we test only at the end, there is no time to tune chunk size, retrieval or prompts.
- **Our choice:** start a small test set of questions in the RAG phase and rerun it after every change. The full LangSmith evaluation runs on Day 7.


## Data Sources: YouTube Videos Used

Topic: **fitness** (strength training, muscle growth, nutrition, recovery). Transcripts were collected with `scripts/ingest.py` and are saved in `backend/data/<video_id>.json`.

### Muscle growth basics

| # | Video | Channel | Length | Transcript source |
|---|---|---|---|---|
| 1 | [How To Build Muscle (Explained In 5 Levels)](https://www.youtube.com/watch?v=lu_BObG6dj8) | Jeff Nippard | 21:55 | Auto captions |
| 2 | [What makes muscles grow? - Jeffrey Siegel](https://www.youtube.com/watch?v=2tM1LFFxeKg) | TED-Ed | 4:20 | Manual captions |
| 3 | [Strength vs Hypertrophy: The Science of How to Build Muscle](https://www.youtube.com/watch?v=sxn5kPQ4Gl0) | Institute of Human Anatomy | 17:49 | Auto captions |
| 4 | [What EXACTLY Is Progressive Overload?](https://www.youtube.com/watch?v=HiJ1uLuTNxo) | PictureFit | 5:23 | Manual captions |

### Training volume and programs

| # | Video | Channel | Length | Transcript source |
|---|---|---|---|---|
| 5 | [How Many Sets Do You Really Need to Build Muscle?](https://www.youtube.com/watch?v=PQWw0BJc5LQ) | Jeremy Ethier | 11:01 | Auto captions |
| 6 | [Bodybuilding Simplified: Push Pull Legs (Full Explanation + Free Training Plan)](https://www.youtube.com/watch?v=TJHZI3McmE4) | trainer winny | 10:20 | Auto captions |
| 7 | [Step by Step Beginner Gym Guide (Full Training Plan + All You Need To Know)](https://www.youtube.com/watch?v=U9ENCvFf9yQ) | trainer winny | 12:14 | Auto captions |

### Exercise technique

| # | Video | Channel | Length | Transcript source |
|---|---|---|---|---|
| 8 | [How to PROPERLY Squat for Growth (4 Easy Steps)](https://www.youtube.com/watch?v=gcNh17Ckjgg) | Jeremy Ethier | 7:15 | Auto captions |
| 9 | [How to PROPERLY Deadlift for Growth (5 Easy Steps)](https://www.youtube.com/watch?v=XxWcirHIwVo) | Jeremy Ethier | 8:03 | Auto captions |
| 10 | [How to PROPERLY Bench Press for Growth (5 Easy Steps)](https://www.youtube.com/watch?v=4Y2ZdHCOXok) | Jeremy Ethier | 8:04 | Auto captions |
| 11 | [How to PROPERLY Warm Up Before Weights](https://www.youtube.com/watch?v=MncQw-H3MPU) | Jeremy Ethier | 7:38 | Auto captions |

### Nutrition and supplements

| # | Video | Channel | Length | Transcript source |
|---|---|---|---|---|
| 12 | [The Smartest Way To Use Protein To Build Muscle (Science Explained)](https://www.youtube.com/watch?v=Pok0Jg2JAkE) | Jeff Nippard | 10:20 | Auto captions |
| 13 | [How Much Protein You Really Need (According to Science)](https://www.youtube.com/watch?v=2WvBe_rsg_Y) | Institute of Human Anatomy | 15:32 | Auto captions |
| 14 | [What is creatine and how does it work?](https://www.youtube.com/watch?v=EDjDpcdWFlA) | Demystifying Medicine McMaster | 5:57 | Manual captions |

### Fat loss

| # | Video | Channel | Length | Transcript source |
|---|---|---|---|---|
| 15 | [The Best Exercises for Fat Loss: Cardio vs Weight Lifting](https://www.youtube.com/watch?v=GIFSoEajOPQ) | Precision Nutrition | 6:42 | Auto captions |
| 16 | [How To Prevent Muscle Loss When Dieting (Science Explained)](https://www.youtube.com/watch?v=EOh2R-89qqg) | Jeff Nippard | 8:26 | Whisper (local) |

### Recovery and sleep

| # | Video | Channel | Length | Transcript source |
|---|---|---|---|---|
| 17 | [How To Maximize Gains and NOT Overtrain - Overtraining Science Explained](https://www.youtube.com/watch?v=NLqq_dJB0iM) | Jeff Nippard | 7:14 | Whisper (local) |
| 18 | [How Sleep Powers Muscle Growth](https://www.youtube.com/watch?v=pUZvynhxYb4) | Institute of Human Anatomy | 10:54 | Whisper (local) |

### Exercise technique and programming (added for the weekly plan)

| # | Video | Channel | Length | Transcript source |
|---|---|---|---|---|
| 19 | [Build Bigger Shoulders With Perfect Training Technique (The Overhead Press)](https://www.youtube.com/watch?v=_RlRDWO2jfg) | Jeff Nippard | 7:58 | Auto captions |
| 20 | [How To PROPERLY Barbell Row For A Bigger Back (Stop Making These Mistakes!)](https://www.youtube.com/watch?v=kBWAon7ItDw) | Jeremy Ethier | 9:30 | Whisper (local) |
| 21 | [How To Get MORE Gains From Pull-Ups (4 Mistakes You Need To Fix)](https://www.youtube.com/watch?v=D-TL5hDQucI) | Jeremy Ethier | 8:22 | Auto captions |
| 22 | [The ONLY 2 Exercises You Need For A Wide Back](https://www.youtube.com/watch?v=b_eislFFVhk) | Jeremy Ethier | 10:19 | Auto captions |
| 23 | [HOW TO DO ROMANIAN DEADLIFTS (RDLs): Build Beefy Hamstrings With Perfect Technique](https://www.youtube.com/watch?v=_oyxCn2iSjU) | Jeff Nippard | 6:21 | Auto captions |
| 24 | [How To Build Great Glutes with Perfect Hip Thrust Technique (Fix Mistakes!)](https://www.youtube.com/watch?v=xDmFkJxPzeM) | Jeff Nippard | 7:12 | Auto captions |
| 25 | [The Perfect Push-Up To Build Muscle (AVOID THESE MISTAKES!)](https://www.youtube.com/watch?v=MO10KOoQx5E) | Jeremy Ethier | 9:49 | Auto captions |
| 26 | [The ONLY 2 Exercises You Need For A Thicker Back](https://www.youtube.com/watch?v=JdjJC6eIk44) | Jeremy Ethier | 8:51 | Auto captions |
| 27 | [How To Squat Without Knee Pain (4 Mistakes You’re Probably Making)](https://www.youtube.com/watch?v=W73Mc0Gil9A) | Jeremy Ethier | 8:46 | Auto captions |
| 28 | [The Best Science-Based DUMBBELL Legs Exercises For Size And Symmetry](https://www.youtube.com/watch?v=jVabPEjDCHY) | Jeremy Ethier | 10:18 | Auto captions |
| 29 | [How To Plank (Proper Form \| Cues \| Progressions)](https://www.youtube.com/watch?v=A2b2EmIg0dA) | E3 Rehab | 3:59 | Auto captions |
| 30 | [The ONLY 2 Exercises You Need For Massive Arms](https://www.youtube.com/watch?v=WvlDMlMx1Ok) | Jeremy Ethier | 11:35 | Auto captions |
| 31 | [How To Build Muscle At Home: The BEST Full Body Home Workout For Growth](https://www.youtube.com/watch?v=95846CBGU0M) | Jeremy Ethier | 11:58 | Auto captions |
| 32 | [The Best Science-Based Minimalist Workout Plan (Under 45 Mins)](https://www.youtube.com/watch?v=eMjyvIQbn9M) | Jeff Nippard | 13:07 | Auto captions |

**Total:** 32 videos from 9 channels, about 307 minutes. Whisper was used when a video had no captions or YouTube blocked the captions request.
