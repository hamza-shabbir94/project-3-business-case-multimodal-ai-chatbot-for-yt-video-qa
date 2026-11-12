"""Phase 0 check: are the keys set, and does one OpenAI call show up in LangSmith?

Run from the project root:
    .venv/bin/python scripts/check_setup.py
"""
import os
import sys

from dotenv import load_dotenv

load_dotenv()

REQUIRED = ["OPENAI_API_KEY", "LANGSMITH_API_KEY", "LANGSMITH_TRACING", "LANGSMITH_PROJECT"]
LATER = ["PINECONE_API_KEY", "DATABASE_URL"]


def is_set(name: str) -> bool:
    value = os.getenv(name, "")
    return bool(value) and not value.startswith("your-")


def main() -> None:
    # Only report whether each key is set. Never print the values.
    for name in REQUIRED + LATER:
        status = "set" if is_set(name) else "MISSING"
        note = "" if name in REQUIRED else "  (needed later)"
        print(f"{name:20} {status}{note}")

    missing = [n for n in REQUIRED if not is_set(n)]
    if missing:
        sys.exit(f"\nAdd these to .env first: {', '.join(missing)}")

    from langchain_openai import ChatOpenAI

    llm = ChatOpenAI(model="gpt-6-luna", max_tokens=200)
    reply = llm.invoke("Reply with exactly: setup ok")
    print(f"\nOpenAI reply: {reply.content}")
    print(f"Now open LangSmith, project '{os.getenv('LANGSMITH_PROJECT')}'. You should see this call as a trace.")


if __name__ == "__main__":
    main()
