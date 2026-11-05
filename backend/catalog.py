"""Phase 4: read the saved transcripts (backend/data/*.json) for the agent tools.

Pinecone only holds ~800-character chunks. Tools that need the whole video
(list, info, summarize) read the original JSON files instead. 18 small files,
so they are loaded once and kept in memory.
"""
import difflib
import json
from functools import lru_cache
from pathlib import Path

DATA_DIR = Path(__file__).resolve().parent / "data"
MARK_EVERY_SECONDS = 60  # summarize() input gets a [m:ss] marker about once a minute


def format_timestamp(seconds: float) -> str:
    seconds = int(seconds)
    h, rest = divmod(seconds, 3600)
    m, s = divmod(rest, 60)
    return f"{h}:{m:02d}:{s:02d}" if h else f"{m}:{s:02d}"


@lru_cache(maxsize=1)
def load_videos() -> dict[str, dict]:
    """{video_id: record} for every saved transcript."""
    videos = {}
    for path in sorted(DATA_DIR.glob("*.json")):
        record = json.loads(path.read_text(encoding="utf-8"))
        videos[record["video_id"]] = record
    return videos


def find_video(query: str) -> dict | None:
    """Find a video by ID, by part of its title, or by a close title match."""
    videos = load_videos()
    q = query.strip()
    if q in videos:
        return videos[q]
    q_lower = q.lower()
    for record in videos.values():
        if q_lower in record["title"].lower():
            return record
    titles = {record["title"].lower(): record for record in videos.values()}
    close = difflib.get_close_matches(q_lower, titles, n=1, cutoff=0.5)
    return titles[close[0]] if close else None


def video_summary_line(record: dict) -> str:
    minutes = round(record["duration_seconds"] / 60)
    return f"- {record['title']} | channel: {record['channel']} | {minutes} min | id: {record['video_id']}"


def transcript_with_timestamps(record: dict) -> str:
    """Full transcript text with a [m:ss] marker about every minute, so a summary can cite times."""
    parts, next_mark = [], 0
    for seg in record["segments"]:
        if seg["start"] >= next_mark:
            parts.append(f"\n[{format_timestamp(seg['start'])}]")
            next_mark = seg["start"] + MARK_EVERY_SECONDS
        parts.append(seg["text"].replace("\n", " "))
    return " ".join(parts).strip()
