"""Phase 4: talk to the agent in the terminal.

Run from the project root:
    .venv/bin/python scripts/chat.py                  # interactive chat (type 'quit' to stop)
    .venv/bin/python scripts/chat.py --thread my-test # continue a saved thread (needs DATABASE_URL)
    .venv/bin/python scripts/chat.py --demo           # scripted test of every tool + memory

Every agent run is traced in LangSmith (each tool call is a child run).
"""
import argparse
import sys
import time
import uuid
from pathlib import Path

from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "backend"))

load_dotenv()

from agent import ask, build_agent, get_checkpointer  # noqa: E402

# Each turn tests one thing. Turns 3, 5 and 7 only make sense with memory of earlier turns.
DEMO = [
    ("list_videos", "Which videos do you have?"),
    ("search_videos", "How much protein should I eat per day to build muscle?"),
    ("memory follow-up", "And how much of that should be in one meal?"),
    ("video_info", "Who made the video about protein from the Institute of Human Anatomy, and how long is it?"),
    ("summarize_video + memory", "Summarize that video for me."),
    ("out of scope", "Give me a keto pancake recipe."),
    ("memory recall", "What was my first question about nutrition?"),
]


def show(turn: dict, seconds: float) -> None:
    print(f"\nBot: {turn['answer']}")
    if turn["sources"]:
        print("Sources:")
        for s in turn["sources"]:
            print(f"  - [{s['timestamp']}] {s['title']} {s['url']}")
    print(f"(tools: {', '.join(turn['tools_used']) or 'none'} | {seconds:.1f}s)")


def run_turn(agent, question: str, thread_id: str) -> None:
    t0 = time.perf_counter()
    turn = ask(agent, question, thread_id)
    show(turn, time.perf_counter() - t0)


def main() -> None:
    parser = argparse.ArgumentParser(description="Chat with the fitness video agent")
    parser.add_argument("--demo", action="store_true", help="run the scripted test conversation")
    parser.add_argument("--thread", help="thread_id to use (default: a new random one)")
    args = parser.parse_args()

    checkpointer = get_checkpointer()
    print(f"Memory: {type(checkpointer).__name__}")
    agent = build_agent(checkpointer)
    thread_id = args.thread or f"cli-{uuid.uuid4().hex[:8]}"
    print(f"Thread: {thread_id}")

    if args.demo:
        for i, (checks, question) in enumerate(DEMO, 1):
            print(f"\n{'=' * 90}\nTurn {i} [{checks}]\nYou: {question}")
            run_turn(agent, question, thread_id)
        return

    while True:
        question = input("\nYou: ").strip()
        if question.lower() in {"quit", "exit", "q"}:
            break
        if question:
            run_turn(agent, question, thread_id)


if __name__ == "__main__":
    main()
