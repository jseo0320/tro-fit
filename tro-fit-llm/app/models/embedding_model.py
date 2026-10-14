"""Embeddings require actual support in the selected Ollama model/server."""
import math
import httpx
from ollama import ResponseError
from langchain_ollama import OllamaEmbeddings
from ..core.config import OLLAMA_HOST, EMBED_MODEL
from ..core.errors import ServiceError

class StrictOllamaEmbeddings(OllamaEmbeddings):
    """Preserve the existing no-silent-truncation policy with the pinned adapter."""

    async def aembed_documents(self, texts: list[str]) -> list[list[float]]:
        result = await self._async_client.embed(
            self.model, texts, dimensions=self.dimensions,
            options=self._default_params, keep_alive=self.keep_alive, truncate=False,
        )
        return result['embeddings']


embeddings = StrictOllamaEmbeddings(
    model=EMBED_MODEL, base_url=OLLAMA_HOST, keep_alive=0,
    client_kwargs={'timeout': 120}, validate_model_on_init=False,
)


async def embed(texts: list[str]) -> dict:
    try:
        vectors = await embeddings.aembed_documents(texts)
    except ResponseError as exc:
        if exc.status_code in (400, 501):
            raise ServiceError('embedding_unsupported', '현재 모델 또는 서버에서 임베딩을 지원하지 않습니다.', 422) from None
        raise ServiceError('embedding_failed', 'Ollama 임베딩 모델 상태를 확인하세요.') from None
    except (httpx.HTTPError, ConnectionError):
        raise ServiceError('ollama_unavailable', 'Ollama 서버 연결 실패 또는 시간 초과입니다.', 503) from None
    if (len(vectors) != len(texts) or not vectors or not vectors[0]
            or any(len(v) != len(vectors[0]) or not all(math.isfinite(x) for x in v)
                   or not any(x != 0 for x in v) for v in vectors)):
        raise ServiceError('invalid_embeddings', '유효하지 않은 임베딩 응답입니다.')
    return {'model': EMBED_MODEL, 'dimensions': len(vectors[0]), 'embeddings': vectors}
