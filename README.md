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

# Our Implementation: Fitness Video QA Bot

A chatbot that answers questions about **fitness YouTube videos** (strength training, muscle growth, nutrition, recovery). It finds the right part of the right video and cites the timestamp, for example `[0:48]`, with a link that opens the video at that second.

## Tech Stack

| Job | Tool |
|---|---|
| Transcripts + metadata | `youtube-transcript-api`, `yt-dlp` (run locally) |
| Speech to text | Local Hugging Face Whisper (`faster-whisper`) for videos without captions; OpenAI Whisper API for voice questions (planned) |
| Chunks + documents | LangChain `Document`, custom time-based chunker |
| Embeddings | OpenAI `text-embedding-3-small` (1536 dims) |
| Vector database | Pinecone (serverless, cosine) via `langchain-pinecone` |
| LLM | OpenAI `gpt-4o-mini` |
| Agent + memory | LangGraph agent + Postgres checkpointer on Neon (planned) |
| Backend | FastAPI on Vercel (planned) |
| Frontend | React + Vite on Vercel (planned) |
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

PIPELINE 2: ASK (Vercel, every question)                        [planned]

  User ──> React + Vite ──> FastAPI /api/chat ──> LangGraph agent (gpt-4o-mini)
              ^                   │                   │        │
              │            /api/transcribe            │        └── memory: Postgres (Neon)
              │            (voice -> Whisper)         v
              │                                  tools: search_videos ──> Pinecone
              │                                         list_videos, video_info, summarize
              └──── answer + [12:41] citations + video links

  LangSmith traces every step and runs the evaluation.
```

## Project Structure

```
├── backend/
│   ├── data/                 # 18 transcripts as JSON (Phase 1)
│   ├── vectorstore.py        # Pinecone index + OpenAI embeddings, shared (Phase 2)
│   └── requirements.txt      # API clients only, for Vercel (no torch)
├── scripts/                  # run locally, never on Vercel
│   ├── check_setup.py        # checks keys + one traced LLM call (Phase 0)
│   ├── ingest.py             # collects transcripts + metadata (Phase 1)
│   ├── index_videos.py       # cleans, chunks, embeds, uploads to Pinecone (Phase 2)
│   ├── videos.txt            # the YouTube links we use
│   └── requirements.txt      # local tools: yt-dlp, faster-whisper, ...
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
```

Required keys: `OPENAI_API_KEY`, `LANGSMITH_API_KEY`, `LANGSMITH_TRACING=true`, `LANGSMITH_PROJECT`, `PINECONE_API_KEY`. `DATABASE_URL` (Neon) is needed from Phase 4. Never commit `.env`.

## How to Run

```bash
# Phase 0: check keys and LangSmith tracing
.venv/bin/python scripts/check_setup.py

# Phase 1: collect transcripts for every link in scripts/videos.txt
.venv/bin/python scripts/ingest.py                  # skips videos already saved
.venv/bin/python scripts/ingest.py --force-whisper  # test the Whisper path

# Phase 2: chunk, embed and upload to Pinecone
.venv/bin/python scripts/index_videos.py --dry-run  # show chunks only, no API calls
.venv/bin/python scripts/index_videos.py            # skips videos already indexed
.venv/bin/python scripts/index_videos.py --reindex  # replace all chunks
```

## Progress

| Phase | What | Status |
|---|---|---|
| 0 | Setup, keys, LangSmith tracing | Done |
| 1 | Data collection (transcripts + metadata) | Done |
| 2 | Chunk, embed, store in Pinecone | Done |
| 3 | Baseline RAG chain | In progress |
| 4 | Agent with tools and memory | Planned |
| 5 | FastAPI backend | Planned |
| 6 | React + Vite frontend | Planned |
| 7 | Deploy on Vercel | Planned |
| 8 | Evaluation, docs, slides | Planned |

## Phase Details

### Phase 0: Setup
- Folder structure, `.gitignore` (keeps `.env`, `*.key`, `secrets/`, `.venv/` out of git), `.env.example` with placeholders.
- Two requirement files: `backend/requirements.txt` holds API clients only, because Vercel functions have a size limit. `scripts/requirements.txt` adds the local tools.
- `scripts/check_setup.py` reports which keys are set (never their values) and makes one `gpt-4o-mini` call.
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

## Known Issues and Limitations

- **YouTube rate limits:** after many fast requests, YouTube blocks the captions endpoint (`IpBlocked`). `ingest.py` then falls back to Whisper. Cloud servers like Vercel are blocked even more often, so ingestion runs locally.
- **Auto-caption errors:** auto captions can contain wrong numbers. Example: one chunk says "about 655 g of protein per day" for an 80 kg person, where 0.8 g/kg gives about 64 g. The LLM may repeat such errors, so the test set includes questions like this.
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

**Total:** 18 videos, about 179 minutes. Whisper was used when a video had no captions or YouTube blocked the captions request.
