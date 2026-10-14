CREATE EXTENSION IF NOT EXISTS vector;
CREATE TABLE IF NOT EXISTS llm_rag_chunks (
    id text NOT NULL,
    source text NOT NULL,
    page integer,
    content text NOT NULL,
    embedding_model text NOT NULL,
    embedding vector(1024) NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (embedding_model, id)
);
CREATE INDEX IF NOT EXISTS llm_rag_chunks_model_idx ON llm_rag_chunks (embedding_model);
-- Exact cosine search is sufficient for the initial small document collection.
