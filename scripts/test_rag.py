"""Phase 3: test the baseline RAG chain on eval/qa_dataset.csv.

Run from the project root:
    .venv/bin/python scripts/test_rag.py --retrieval        # hit rate for k = 1..8 (cheap, no LLM)
    .venv/bin/python scripts/test_rag.py                    # answer every test question with k=4
    .venv/bin/python scripts/test_rag.py --k 6
    .venv/bin/python scripts/test_rag.py --question "Is creatine safe?"

Answers are saved to eval/results/ so later phases can be compared with this baseline.
Every chain run is also traced in LangSmith.
"""
import argparse
import csv
import json
import sys
import time
from pathlib import Path

from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "backend"))
DATASET = ROOT / "eval" / "qa_dataset.csv"
RESULTS_DIR = ROOT / "eval" / "results"

load_dotenv()

from rag import DEFAULT_K, build_rag_chain, get_sources  # noqa: E402
from vectorstore import get_vectorstore  # noqa: E402


def load_dataset() -> list[dict]:
    with open(DATASET, encoding="utf-8") as f:
        rows = list(csv.DictReader(f))
    for row in rows:
        row["expected"] = [v for v in row["expected_video_ids"].split(";") if v]
    return rows


def retrieval_report(rows: list[dict], max_k: int = 8) -> None:
    """Hit@k: is at least one expected video among the top-k chunks? Out-of-scope questions are skipped."""
    store = get_vectorstore()
    scored = [r for r in rows if r["expected"]]
    ranks = []  # rank of the first chunk from an expected video, or None
    for row in scored:
        docs = store.similarity_search(row["question"], k=max_k)
        rank = next((i for i, d in enumerate(docs, 1) if d.metadata["video_id"] in row["expected"]), None)
        ranks.append(rank)
        print(f"  {row['id']} first correct chunk at rank {rank or '-'}  | {row['question']}")
    print(f"\nRetrieval over {len(scored)} questions (out-of-scope skipped):")
    for k in range(1, max_k + 1):
        hits = sum(1 for r in ranks if r and r <= k)
        print(f"  hit@{k}: {hits}/{len(scored)} = {hits / len(scored):.0%}")


def answer_questions(questions: list[dict], k: int, save: bool, label: str = "phase3") -> None:
    chain = build_rag_chain(k=k)
    results = []
    for row in questions:
        t0 = time.perf_counter()
        out = chain.invoke(row["question"])
        latency = time.perf_counter() - t0
        retrieved = [d.metadata["video_id"] for d in out["docs"]]
        hit = any(v in retrieved for v in row.get("expected", [])) if row.get("expected") else None

        print(f"\n{'=' * 90}\n{row.get('id', '')} Q: {row['question']}")
        print(f"A: {out['answer']}")
        print("Sources:")
        for s in get_sources(out["docs"]):
            print(f"  - [{s['timestamp']}] {s['title']} ({s['channel']}) {s['url']}")
        if row.get("reference_answer"):
            print(f"Reference: {row['reference_answer']}")
        print(f"Expected video retrieved: {hit} | latency {latency:.1f}s")

        results.append({
            "id": row.get("id"), "question": row["question"], "answer": out["answer"],
            "reference_answer": row.get("reference_answer"), "expected_video_retrieved": hit,
            "retrieved_video_ids": retrieved, "latency_seconds": round(latency, 2),
        })

    latencies = sorted(r["latency_seconds"] for r in results)
    print(f"\n{len(results)} questions | median latency {latencies[len(latencies) // 2]:.1f}s | max {latencies[-1]:.1f}s")
    if save:
        RESULTS_DIR.mkdir(parents=True, exist_ok=True)
        path = RESULTS_DIR / f"{label}_k{k}.json"
        path.write_text(json.dumps(results, indent=2, ensure_ascii=False), encoding="utf-8")
        print(f"Saved to {path.relative_to(ROOT)}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Test the baseline RAG chain")
    parser.add_argument("--retrieval", action="store_true", help="only measure retrieval hit@k")
    parser.add_argument("--k", type=int, default=DEFAULT_K, help="chunks to retrieve per question")
    parser.add_argument("--question", help="ask one question instead of the test set")
    parser.add_argument("--label", default="phase3", help="name for the results file, e.g. phase3_v2")
    args = parser.parse_args()

    if args.retrieval:
        retrieval_report(load_dataset())
    elif args.question:
        answer_questions([{"question": args.question}], args.k, save=False)
    else:
        answer_questions(load_dataset(), args.k, save=True, label=args.label)


if __name__ == "__main__":
    main()
