"""Phase 5: API tests.

Run from the project root:
    .venv/bin/pytest backend/tests -m "not live"   # free: validation and static endpoints only
    .venv/bin/pytest backend/tests                 # also live tests (OpenAI + Pinecone + Neon, ~20 s)
"""
import io
import sys
import uuid
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app import MAX_AUDIO_BYTES, MAX_MESSAGE_CHARS, app  # noqa: E402

client = TestClient(app)


# ---------- free tests: no LLM, no database ----------

def test_health():
    assert client.get("/api/health").json() == {"status": "ok"}


def test_videos():
    videos = client.get("/api/videos").json()
    assert len(videos) == 18
    assert {"video_id", "title", "channel", "duration_seconds", "url", "thumbnail_url"} <= videos[0].keys()


@pytest.mark.parametrize("body", [
    {"message": ""},
    {"message": "   "},
    {"message": "a" * (MAX_MESSAGE_CHARS + 1)},
    {"message": "hi", "thread_id": "has spaces"},
    {"message": "hi", "thread_id": "x" * 65},
    {},
])
def test_chat_rejects_bad_input(body):
    assert client.post("/api/chat", json=body).status_code == 422


def test_history_rejects_bad_thread_id():
    assert client.get("/api/history/" + "x" * 65).status_code == 422


def test_transcribe_rejects_non_audio():
    files = {"audio": ("notes.txt", b"hello", "text/plain")}
    assert client.post("/api/transcribe", files=files).status_code == 415


def test_transcribe_rejects_large_file():
    files = {"audio": ("big.webm", io.BytesIO(b"\0" * (MAX_AUDIO_BYTES + 1)), "audio/webm")}
    assert client.post("/api/transcribe", files=files).status_code == 413


def test_transcribe_rejects_empty_file():
    files = {"audio": ("empty.webm", b"", "audio/webm")}
    assert client.post("/api/transcribe", files=files).status_code == 422


def test_cors_allows_vite_dev_server():
    r = client.options("/api/chat", headers={"Origin": "http://localhost:5173",
                                             "Access-Control-Request-Method": "POST",
                                             "Access-Control-Request-Headers": "content-type"})
    assert r.headers["access-control-allow-origin"] == "http://localhost:5173"


# ---------- live tests: real OpenAI, Pinecone and Neon calls ----------

@pytest.mark.live
def test_chat_follow_up_and_history():
    thread_id = f"pytest-{uuid.uuid4().hex[:8]}"

    first = client.post("/api/chat", json={"message": "How deep should I squat?", "thread_id": thread_id}).json()
    assert first["thread_id"] == thread_id
    assert "search_videos" in first["tools_used"]
    assert first["sources"] and "&t=" in first["sources"][0]["url"]
    assert "[How to PROPERLY Squat for Growth (4 Easy Steps)," in first["answer"]

    second = client.post("/api/chat", json={"message": "What did I ask you before?", "thread_id": thread_id}).json()
    assert "squat" in second["answer"].lower()

    turns = client.get(f"/api/history/{thread_id}").json()["turns"]
    assert [t["question"] for t in turns] == ["How deep should I squat?", "What did I ask you before?"]


@pytest.mark.live
def test_chat_new_thread_and_out_of_scope():
    r = client.post("/api/chat", json={"message": "Give me a keto pancake recipe."}).json()
    assert len(r["thread_id"]) == 32  # a new thread_id was created
    assert "don't cover" in r["answer"].lower() or "do not cover" in r["answer"].lower()
    assert r["sources"] == [] or "search_videos" in r["tools_used"]


@pytest.mark.live
def test_unknown_thread_has_empty_history():
    assert client.get(f"/api/history/never-{uuid.uuid4().hex[:8]}").json()["turns"] == []
