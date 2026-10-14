"""Connect text, embeddings and video without depending on HTTP routes."""
from ..models import text_model, video_model, embedding_model
from ..schemas import VideoPrompt
from ..rag.retriever import retrieve
from ..core.errors import ServiceError


async def create_prompt(prompt: str, use_rag: bool = False) -> VideoPrompt:
    if use_rag:
        matches = await retrieve(prompt, 3)
        if not matches:
            raise ServiceError('rag_empty', '색인된 자료가 없습니다. 먼저 data 자료를 ingest하세요.', 409)
        return await text_model.generate_video_prompt(prompt, context=matches)
    return await text_model.generate_video_prompt(prompt)


async def search_documents(query: str, limit: int = 5):
    return await retrieve(query, limit)


async def create_embeddings(texts: list[str]) -> dict:
    return await embedding_model.embed(texts)


async def create_video(prompt: VideoPrompt) -> dict:
    return await video_model.generate_video(prompt)


async def get_job(job_id: str) -> dict:
    return await video_model.get_job(job_id)


async def generate(user_prompt: str, use_rag: bool = False) -> dict:
    # Fail before expensive text inference when no video provider is connected.
    video_model.require_video_provider()
    prompt = await create_prompt(user_prompt, use_rag)
    result = await video_model.generate_video(prompt)
    return {'user_prompt': user_prompt, **prompt.model_dump(), **result}
