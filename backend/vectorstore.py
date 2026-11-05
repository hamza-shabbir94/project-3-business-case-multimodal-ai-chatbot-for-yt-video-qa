"""Shared Pinecone + OpenAI embeddings setup.

Used by scripts/index_videos.py (to upload chunks) and later by the backend (to search).
The caller must load the environment variables (OPENAI_API_KEY, PINECONE_API_KEY) first.
"""
from langchain_openai import OpenAIEmbeddings
from langchain_pinecone import PineconeVectorStore
from pinecone import Pinecone, ServerlessSpec

INDEX_NAME = "yt-video-qa"
EMBEDDING_MODEL = "text-embedding-3-small"
EMBEDDING_DIM = 1536  # must match the embedding model


def get_embeddings() -> OpenAIEmbeddings:
    return OpenAIEmbeddings(model=EMBEDDING_MODEL)


def get_index(create_if_missing: bool = False):
    """Return the Pinecone index. Optionally create it (serverless, cosine)."""
    pc = Pinecone()
    if not pc.has_index(INDEX_NAME):
        if not create_if_missing:
            raise RuntimeError(f"Pinecone index '{INDEX_NAME}' does not exist. Run scripts/index_videos.py first.")
        pc.create_index(
            name=INDEX_NAME,
            dimension=EMBEDDING_DIM,
            metric="cosine",
            spec=ServerlessSpec(cloud="aws", region="us-east-1"),
        )
    return pc.Index(INDEX_NAME)


def get_vectorstore(create_if_missing: bool = False) -> PineconeVectorStore:
    return PineconeVectorStore(index=get_index(create_if_missing), embedding=get_embeddings())
