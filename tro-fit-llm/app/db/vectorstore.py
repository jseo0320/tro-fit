"""1024-dimensional embeddings stored separately from backend business tables."""
import math
from pathlib import Path
from ..core.config import EMBED_MODEL
from ..core.errors import ServiceError
from .connection import connect

DIMENSIONS = 1024


def vector_literal(values):
    if len(values) != DIMENSIONS or not all(math.isfinite(v) for v in values) or not any(values):
        raise ServiceError('embedding_dimension_mismatch', 'pgvector 저장에는 유효한 1024차원 벡터가 필요합니다.', 422)
    return '[' + ','.join(str(float(v)) for v in values) + ']'


def initialize():
    with connect() as conn:
        conn.execute((Path(__file__).parent / 'schema.sql').read_text(encoding='utf-8'))


def replace_sources(chunks, embeddings, sources):
    if len(chunks) != len(embeddings):
        raise ValueError('Chunk and embedding counts differ')
    vectors = [vector_literal(v) for v in embeddings]
    with connect() as conn:
        conn.execute('SELECT pg_advisory_xact_lock(73482192)')
        conn.execute('DELETE FROM llm_rag_chunks WHERE embedding_model=%s AND source=ANY(%s)',
                     (EMBED_MODEL, list(sources)))
        with conn.cursor() as cur:
            cur.executemany('''INSERT INTO llm_rag_chunks
                (id, source, page, content, embedding_model, embedding)
                VALUES (%s,%s,%s,%s,%s,%s::vector)''',
                [(c['id'],c['source'],c['page'],c['content'],EMBED_MODEL,v)
                 for c,v in zip(chunks,vectors)])


def search(vector, limit=5):
    if not 1 <= limit <= 10:
        raise ValueError('limit must be between 1 and 10')
    literal = vector_literal(vector)
    with connect() as conn:
        rows = conn.execute('''SELECT id, source, page, content, 1-(embedding <=> %s::vector) AS score
            FROM llm_rag_chunks WHERE embedding_model=%s
            ORDER BY embedding <=> %s::vector LIMIT %s''',
            (literal, EMBED_MODEL, literal, limit)).fetchall()
    return [dict(zip(('id','source','page','content','score'), row)) for row in rows]
