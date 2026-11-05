"""Pipeline 1, phase 2: clean + chunk the saved transcripts, embed them, upload to Pinecone.

Reads backend/data/<video_id>.json (made by scripts/ingest.py).

Chunks are built from the timed caption segments, not from sentences, because
auto-captions often have no punctuation. Every chunk keeps the start time of its
first segment, so answers can cite e.g. [12:41] and link to that second.

Run from the project root:
    .venv/bin/python scripts/index_videos.py              # index videos not yet in Pinecone
    .venv/bin/python scripts/index_videos.py --reindex    # replace all chunks
    .venv/bin/python scripts/index_videos.py --dry-run    # only show the chunks, no OpenAI/Pinecone calls
"""
import argparse
import json
import re
import sys
from pathlib import Path

from dotenv import load_dotenv
from langchain_core.documents import Document

ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "backend" / "data"
sys.path.insert(0, str(ROOT / "backend"))

from vectorstore import INDEX_NAME, get_vectorstore  # noqa: E402

CHUNK_SIZE = 800     # target characters per chunk (about 1 minute of speech)
CHUNK_OVERLAP = 150  # characters repeated from the end of the previous chunk

TAG_PATTERN = re.compile(r"\[(?:music|applause|laughter|laughs|inaudible|silence|__)\]", re.IGNORECASE)


def clean_text(text: str) -> str:
    """Light cleaning only: remove caption tags like [Music], '>>' speaker marks, extra spaces."""
    text = TAG_PATTERN.sub(" ", text)
    text = text.replace(">>", " ").replace("\n", " ")
    return re.sub(r"\s+", " ", text).strip()


def format_timestamp(seconds: float) -> str:
    seconds = int(seconds)
    h, rest = divmod(seconds, 3600)
    m, s = divmod(rest, 60)
    return f"{h}:{m:02d}:{s:02d}" if h else f"{m}:{s:02d}"


def chunk_segments(segments: list[dict]) -> list[dict]:
    """Group consecutive segments into chunks of ~CHUNK_SIZE characters with overlap.

    Returns [{text, start, end}] where start/end are seconds in the video.
    """
    segments = [dict(s, text=clean_text(s["text"])) for s in segments]
    segments = [s for s in segments if s["text"]]

    chunks, current, length = [], [], 0
    for seg in segments:
        current.append(seg)
        length += len(seg["text"]) + 1
        if length >= CHUNK_SIZE:
            chunks.append(current)
            # start the next chunk with the last segments (~CHUNK_OVERLAP characters)
            overlap, overlap_len = [], 0
            for prev in reversed(current):
                if overlap_len >= CHUNK_OVERLAP:
                    break
                overlap.insert(0, prev)
                overlap_len += len(prev["text"]) + 1
            if len(overlap) == len(current):  # one huge segment: don't repeat it forever
                overlap = []
            current, length = overlap, overlap_len if overlap else 0

    # last chunk: keep it unless it is only the overlap from the previous chunk
    if current and (not chunks or current[-1] is not chunks[-1][-1]):
        chunks.append(current)

    return [
        {
            "text": " ".join(s["text"] for s in group),
            "start": group[0]["start"],
            "end": group[-1]["start"] + group[-1]["duration"],
        }
        for group in chunks
    ]


def video_to_documents(record: dict) -> tuple[list[Document], list[str]]:
    docs, ids = [], []
    for i, chunk in enumerate(chunk_segments(record["segments"])):
        start = int(chunk["start"])
        docs.append(Document(
            page_content=chunk["text"],
            metadata={
                "video_id": record["video_id"],
                "title": record["title"],
                "channel": record["channel"],
                "url": record["url"],
                "start_seconds": start,
                "end_seconds": int(chunk["end"]),
                "timestamp": format_timestamp(start),
                "timestamp_url": f"{record['url']}&t={start}s",
                "chunk_index": i,
                "transcript_source": record["source"],
            },
        ))
        ids.append(f"{record['video_id']}-{i:04d}")  # stable IDs: re-running overwrites, no duplicates
    return docs, ids


def delete_video_chunks(index, video_id: str) -> None:
    """Remove old chunks of one video (the new chunking may produce fewer chunks)."""
    old_ids = [vid for page in index.list(prefix=f"{video_id}-") for vid in page]
    if old_ids:
        index.delete(ids=old_ids)


def main() -> None:
    parser = argparse.ArgumentParser(description="Chunk transcripts and upload them to Pinecone")
    parser.add_argument("--reindex", action="store_true", help="replace chunks of videos already indexed")
    parser.add_argument("--dry-run", action="store_true", help="only chunk and print stats")
    args = parser.parse_args()

    files = sorted(DATA_DIR.glob("*.json"))
    records = [json.loads(f.read_text(encoding="utf-8")) for f in files]
    print(f"{len(records)} transcripts in {DATA_DIR.relative_to(ROOT)}")

    if args.dry_run:
        total = 0
        for record in records:
            docs, _ = video_to_documents(record)
            total += len(docs)
            sizes = [len(d.page_content) for d in docs]
            print(f"  {record['video_id']}: {len(docs):3d} chunks, {min(sizes)}-{max(sizes)} chars | {record['title'][:55]}")
        print(f"Total: {total} chunks (dry run, nothing uploaded)")
        return

    load_dotenv()
    store = get_vectorstore(create_if_missing=True)
    index = store.index

    added, skipped = 0, 0
    for record in records:
        video_id = record["video_id"]
        already = bool(index.fetch(ids=[f"{video_id}-0000"]).vectors)
        if already and not args.reindex:
            print(f"  {video_id}: already indexed, skipping")
            skipped += 1
            continue
        if already:
            delete_video_chunks(index, video_id)

        docs, ids = video_to_documents(record)
        store.add_documents(docs, ids=ids)
        added += len(docs)
        print(f"  {video_id}: {len(docs)} chunks uploaded | {record['title'][:55]}")

    print(f"\nDone. chunks uploaded={added}, videos skipped={skipped}")
    print(f"Pinecone index '{INDEX_NAME}' now holds {index.describe_index_stats().total_vector_count} vectors "
          "(the count can take a few seconds to update)")


if __name__ == "__main__":
    main()
