"""Phase 3: baseline RAG chain (no agent yet).

    question -> retriever (Pinecone, top-k chunks) -> prompt with excerpts -> gpt-4o-mini -> answer

The answer cites every fact as [Video title, m:ss]. The chain also returns the
retrieved documents, so the caller can show clickable sources.
The caller must load the environment variables first.
"""
from langchain_core.documents import Document
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import Runnable, RunnableLambda, RunnableParallel, RunnablePassthrough
from langchain_openai import ChatOpenAI

from vectorstore import get_vectorstore

LLM_MODEL = "gpt-4o-mini"
DEFAULT_K = 6  # 4 missed steps of multi-part answers (e.g. the 3-part warm-up); see eval/results/

SYSTEM_PROMPT = """You are a fitness assistant. You answer questions using ONLY the YouTube transcript excerpts below.

Rules:
- Use only the excerpts. If they do not contain the answer, say that the videos don't cover it. Do not use outside knowledge.
- After each fact, copy the citation tag shown above the excerpt it came from, exactly as written, for example [How Sleep Powers Muscle Growth, 7:20]. Never cite by excerpt number.
- Keep the context of every number: units, body weight, and whether it is for bulking, cutting or general health. Prefer per-kilogram ranges over single examples.
- If the question asks how to do something, give all the steps or parts the excerpts mention.
- When several videos answer the question, combine them and say where they agree or differ.
- The transcripts are auto-generated and can contain errors, especially in numbers. If a number looks wrong or the excerpts disagree, say so.
- Be concise: a few sentences or a short list.

Excerpts:
{context}"""

PROMPT = ChatPromptTemplate.from_messages([
    ("system", SYSTEM_PROMPT),
    ("human", "{question}"),
])


def format_docs(docs: list[Document]) -> str:
    """Turn retrieved chunks into excerpts, each headed by the exact citation tag to copy."""
    parts = []
    for doc in docs:
        m = doc.metadata
        parts.append(f"Citation tag: [{m['title']}, {m['timestamp']}] (channel: {m['channel']})\n{doc.page_content}")
    return "\n\n---\n\n".join(parts)


def get_sources(docs: list[Document]) -> list[dict]:
    """Unique (video, timestamp) sources in retrieval order, with links that open the video at that second."""
    seen, sources = set(), []
    for doc in docs:
        m = doc.metadata
        key = (m["video_id"], m["start_seconds"])
        if key not in seen:
            seen.add(key)
            sources.append({"title": m["title"], "channel": m["channel"],
                            "timestamp": m["timestamp"], "url": m["timestamp_url"]})
    return sources


def build_rag_chain(k: int = DEFAULT_K) -> Runnable:
    """Input: a question string. Output: {question, docs, context, answer}."""
    retriever = get_vectorstore().as_retriever(search_kwargs={"k": k})
    llm = ChatOpenAI(model=LLM_MODEL, temperature=0, max_tokens=400)

    chain = (
        RunnableParallel(question=RunnablePassthrough(), docs=retriever)
        | RunnablePassthrough.assign(context=RunnableLambda(lambda x: format_docs(x["docs"])))
        | RunnablePassthrough.assign(answer=PROMPT | llm | StrOutputParser())
    )
    return chain.with_config(run_name="baseline_rag")
