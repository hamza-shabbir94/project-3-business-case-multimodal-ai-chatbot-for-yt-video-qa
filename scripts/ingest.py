"""Pipeline 1, phase 1: collect transcripts + metadata for every video in videos.txt.

For each video:
  1. get metadata (title, channel, duration...) with yt-dlp
  2. get captions with youtube-transcript-api
  3. no captions? download the audio and transcribe it with local Whisper (faster-whisper)
  4. save everything as backend/data/<video_id>.json

Run from the project root:
    .venv/bin/python scripts/ingest.py
    .venv/bin/python scripts/ingest.py --force            # re-download videos already saved
    .venv/bin/python scripts/ingest.py --force-whisper    # skip captions, test the Whisper path
"""
import argparse
import json
import re
import shutil
import time
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import parse_qs, urlparse

import yt_dlp
from youtube_transcript_api import (
    NoTranscriptFound,
    RequestBlocked,
    TranscriptsDisabled,
    YouTubeTranscriptApi,
)

ROOT = Path(__file__).resolve().parent.parent
VIDEOS_FILE = ROOT / "scripts" / "videos.txt"
DATA_DIR = ROOT / "backend" / "data"
AUDIO_DIR = ROOT / "scripts" / ".audio_tmp"

PAUSE_SECONDS = 3  # wait between videos so YouTube doesn't rate-limit us

ID_PATTERN = re.compile(r"^[A-Za-z0-9_-]{11}$")


def extract_video_id(url_or_id: str) -> str:
    """Accept a plain ID or any common YouTube URL form and return the 11-char video ID."""
    s = url_or_id.strip()
    if ID_PATTERN.match(s):
        return s
    parsed = urlparse(s)
    host = parsed.netloc.lower().removeprefix("www.").removeprefix("m.")
    if host == "youtu.be":
        candidate = parsed.path.lstrip("/").split("/")[0]
    elif host.endswith("youtube.com"):
        if parsed.path == "/watch":
            candidate = parse_qs(parsed.query).get("v", [""])[0]
        else:  # /shorts/<id>, /embed/<id>, /live/<id>
            parts = [p for p in parsed.path.split("/") if p]
            candidate = parts[1] if len(parts) >= 2 else ""
    else:
        candidate = ""
    if not ID_PATTERN.match(candidate):
        raise ValueError(f"Not a YouTube video link or ID: {url_or_id!r}")
    return candidate


def read_video_list(path: Path) -> list[str]:
    """One link per line. Blank lines and lines starting with # are skipped."""
    lines = path.read_text(encoding="utf-8").splitlines()
    return [line.strip() for line in lines if line.strip() and not line.strip().startswith("#")]


def get_metadata(video_id: str) -> dict:
    """Title, channel, duration etc. from yt-dlp, without downloading the video."""
    opts = {"quiet": True, "no_warnings": True, "skip_download": True}
    with yt_dlp.YoutubeDL(opts) as ydl:
        info = ydl.extract_info(f"https://www.youtube.com/watch?v={video_id}", download=False)
    return {
        "video_id": video_id,
        "url": f"https://www.youtube.com/watch?v={video_id}",
        "title": info.get("title"),
        "channel": info.get("channel") or info.get("uploader"),
        "duration_seconds": info.get("duration"),
        "upload_date": info.get("upload_date"),  # YYYYMMDD
        "description": info.get("description") or "",
    }


def get_transcript(video_id: str, languages: list[str]) -> tuple[list[dict], str, bool]:
    """Captions as segments [{text, start, duration}], plus language code and whether auto-generated.

    Raises TranscriptsDisabled / NoTranscriptFound when the video has no usable captions.
    """
    fetched = YouTubeTranscriptApi().fetch(video_id, languages=languages)
    segments = [
        {"text": s.text.strip(), "start": round(s.start, 2), "duration": round(s.duration, 2)}
        for s in fetched.snippets
        if s.text.strip()
    ]
    return segments, fetched.language_code, fetched.is_generated


def transcribe_with_whisper(video_id: str, model_size: str) -> tuple[list[dict], str]:
    """Fallback: download the audio track and transcribe it locally with faster-whisper."""
    from faster_whisper import WhisperModel  # imported here: only loaded when needed

    AUDIO_DIR.mkdir(parents=True, exist_ok=True)
    opts = {
        "quiet": True,
        "no_warnings": True,
        "noprogress": True,
        "format": "bestaudio[ext=m4a]/bestaudio",
        "outtmpl": str(AUDIO_DIR / f"{video_id}.%(ext)s"),
    }
    with yt_dlp.YoutubeDL(opts) as ydl:
        info = ydl.extract_info(f"https://www.youtube.com/watch?v={video_id}", download=True)
        audio_path = Path(ydl.prepare_filename(info))

    try:
        model = WhisperModel(model_size, device="cpu", compute_type="int8")
        raw_segments, info = model.transcribe(str(audio_path), vad_filter=True)
        segments = [
            {"text": s.text.strip(), "start": round(s.start, 2), "duration": round(s.end - s.start, 2)}
            for s in raw_segments
            if s.text.strip()
        ]
    finally:
        audio_path.unlink(missing_ok=True)
    return segments, info.language


def collect_video(url_or_id: str, languages: list[str], whisper_model: str, force_whisper: bool) -> dict:
    video_id = extract_video_id(url_or_id)
    record = get_metadata(video_id)

    segments = None
    if not force_whisper:
        try:
            segments, language, generated = get_transcript(video_id, languages)
            record["source"] = "youtube_auto_captions" if generated else "youtube_captions"
            record["language"] = language
        except (TranscriptsDisabled, NoTranscriptFound):
            print("    no captions, using Whisper fallback")
        except RequestBlocked:
            # YouTube rate-limits the captions endpoint after many requests.
            # The audio download still works, so Whisper can take over.
            print("    captions blocked by YouTube (rate limit), using Whisper fallback")

    if segments is None:
        segments, language = transcribe_with_whisper(video_id, whisper_model)
        record["source"] = f"whisper_{whisper_model}"
        record["language"] = language

    record["segments"] = segments
    record["collected_at"] = datetime.now(timezone.utc).isoformat(timespec="seconds")
    return record


def main() -> None:
    parser = argparse.ArgumentParser(description="Collect YouTube transcripts into backend/data/")
    parser.add_argument("--videos", type=Path, default=VIDEOS_FILE, help="file with one link per line")
    parser.add_argument("--languages", default="en", help="caption languages in order of preference, e.g. en,ur")
    parser.add_argument("--whisper-model", default="base", help="tiny, base, small, medium...")
    parser.add_argument("--force", action="store_true", help="collect again even if the JSON exists")
    parser.add_argument("--force-whisper", action="store_true", help="skip captions and use Whisper")
    args = parser.parse_args()

    DATA_DIR.mkdir(parents=True, exist_ok=True)
    links = read_video_list(args.videos)
    languages = [lang.strip() for lang in args.languages.split(",") if lang.strip()]
    print(f"{len(links)} videos in {args.videos.name}")

    saved, skipped, failed = 0, 0, []
    for i, link in enumerate(links, 1):
        try:
            video_id = extract_video_id(link)
        except ValueError as err:
            print(f"[{i}/{len(links)}] skip: {err}")
            failed.append((link, str(err)))
            continue

        out_path = DATA_DIR / f"{video_id}.json"
        if out_path.exists() and not args.force:
            print(f"[{i}/{len(links)}] {video_id} already saved, skipping")
            skipped += 1
            continue

        if saved or failed:
            time.sleep(PAUSE_SECONDS)  # be gentle with YouTube between requests
        print(f"[{i}/{len(links)}] {video_id} ...")
        try:
            record = collect_video(link, languages, args.whisper_model, args.force_whisper)
        except Exception as err:  # keep going with the other videos
            print(f"    FAILED: {type(err).__name__}: {str(err).splitlines()[0][:200]}")
            failed.append((link, type(err).__name__))
            continue

        out_path.write_text(json.dumps(record, ensure_ascii=False, indent=2), encoding="utf-8")
        words = sum(len(s["text"].split()) for s in record["segments"])
        print(f"    saved: {record['title']!r} | {record['source']} | "
              f"{len(record['segments'])} segments, {words} words")
        saved += 1

    shutil.rmtree(AUDIO_DIR, ignore_errors=True)
    print(f"\nDone. saved={saved} skipped={skipped} failed={len(failed)}")
    for link, reason in failed:
        print(f"  failed: {link} ({reason})")


if __name__ == "__main__":
    main()
