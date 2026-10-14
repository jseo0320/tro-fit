"""Reuse the backend PostgreSQL server via the LLM project's DATABASE_URL."""
from contextlib import contextmanager
import psycopg
from ..core.config import SETTINGS
from ..core.errors import ServiceError


@contextmanager
def connect():
    url = SETTINGS.get('RAG_DATABASE_URL') or SETTINGS.get('DATABASE_URL')
    if not url:
        raise ServiceError('database_not_configured', 'DATABASE_URL이 필요합니다.', 503)
    url = url.replace('postgresql+psycopg2://', 'postgresql://').replace('postgresql+psycopg://', 'postgresql://')
    if not url.startswith(('postgresql://', 'postgres://')):
        raise ServiceError('database_not_configured', 'pgvector에는 PostgreSQL 연결이 필요합니다.', 503)
    try:
        with psycopg.connect(url, connect_timeout=5) as conn:
            yield conn
    except psycopg.Error:
        raise ServiceError('database_unavailable',
                           'PostgreSQL 연결, pgvector 확장 및 RAG 테이블 초기화 상태를 확인하세요.', 503) from None
