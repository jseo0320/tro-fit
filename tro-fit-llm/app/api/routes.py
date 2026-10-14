"""HTTP request validation and service delegation."""
from fastapi import APIRouter, Path
from ..schemas import GenerateRequest, VideoPrompt, EmbedRequest, SearchRequest
from ..services import generation_service as service

router = APIRouter()


@router.get('/', tags=['health'])
async def health():
    return {'status': 'running', 'video_provider': 'ltx'}


@router.post('/prompts', response_model=VideoPrompt, tags=['text'])
async def create_prompt(request: GenerateRequest):
    return await service.create_prompt(request.prompt, request.use_rag)


@router.post('/embeddings', tags=['embeddings'])
async def create_embeddings(request: EmbedRequest):
    return await service.create_embeddings(request.texts)


@router.post('/videos', status_code=202, tags=['video'])
async def create_video(request: VideoPrompt):
    return await service.create_video(request)


@router.post('/generate', status_code=202, tags=['video'])
async def generate(request: GenerateRequest):
    return await service.generate(request.prompt, request.use_rag)


@router.get('/jobs/{job_id}', tags=['video'])
async def get_job(job_id: str = Path(pattern=r'^[A-Za-z0-9_-]{1,128}$')):
    return await service.get_job(job_id)


@router.post('/rag/search', tags=['rag'])
async def search_documents(request: SearchRequest):
    return {'matches': await service.search_documents(request.query, request.limit)}
