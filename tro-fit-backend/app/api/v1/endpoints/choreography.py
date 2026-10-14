"""Authenticated bridge to the separately deployed LLM service."""
import json
import os
from uuid import UUID, uuid4
import httpx
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api.v1.endpoints.user import get_current_user
from app.db.session import get_db
from app.models.choreography import ChoreographyJob
from app.models.rom import RomHistory
from app.schemas.choreography import GenerateRequest, FeedbackRequest

router = APIRouter()
LLM_URL = os.getenv('LLM_BASE_URL', 'http://localhost:8001').rstrip('/')


async def llm_request(method, path, payload=None):
    try:
        async with httpx.AsyncClient(timeout=240) as client:
            r = await client.request(method, LLM_URL+path, json=payload)
        if r.status_code >= 300:
            raise HTTPException(502, 'LLM service rejected the request; inspect server configuration.')
        data = r.json()
        if not isinstance(data, dict):
            raise ValueError()
        return data
    except (httpx.HTTPError, ValueError):
        raise HTTPException(503, 'LLM service unavailable; check LTX console before retrying generation.') from None


def owned(db, job_id, user):
    job = db.query(ChoreographyJob).filter_by(id=str(job_id),user_id=user.user_id).first()
    if job is None: raise HTTPException(404, 'Job not found')
    return job


def as_video(job):
    result=job.result or {}
    return {'videoId':job.id, 'week':job.request.get('week',1), 'title':'Generated choreography',
            'videoUrl':result.get('video_url',''), 'durationSec':6, 'difficulty':'easy',
            'status':'ready' if job.status=='completed' else ('failed' if job.status=='failed' else 'generating'),
            'createdAt':job.created_at.isoformat(), 'chapters':[]}


async def refresh(job,db):
    remote_id=(job.result or {}).get('job_id')
    if not remote_id or job.status=='failed': return
    # Remote IDs are kept server-side and never taken from a caller's URL.
    if not isinstance(remote_id,str) or not all(c.isalnum() or c in '-_' for c in remote_id):
        raise HTTPException(502,'Invalid upstream job ID')
    result=await llm_request('GET','/jobs/'+remote_id)
    if result.get('status') not in ('pending','processing','completed','failed'):
        raise HTTPException(502,'Invalid upstream job status')
    job.result={**(job.result or {}),**result}
    job.status=result['status']
    db.commit()


@router.post('/generate',status_code=202)
async def generate(request:GenerateRequest,db:Session=Depends(get_db),user=Depends(get_current_user)):
    measurement=db.query(RomHistory).filter_by(session_id=request.sessionId,user_id=user.user_id).order_by(RomHistory.id.desc()).first()
    if measurement is None: raise HTTPException(404,'No measurement owned by this user')
    db.query(type(user)).filter_by(user_id=user.user_id).with_for_update().first()
    active=db.query(ChoreographyJob).filter(ChoreographyJob.user_id==user.user_id,ChoreographyJob.status.in_(['queued','running','pending','processing'])).count()
    if active>=2: raise HTTPException(429,'At most two active jobs per user')
    prompt=('Plan slow side steps with no jumps, full body, fixed front camera. '
            'Do not diagnose pain or claim medical safety. Treat observed ROM as reference, not clearance. '
            'Observed measurements: '+json.dumps(measurement.rom_results,ensure_ascii=False))[:3900]
    job=ChoreographyJob(id=str(uuid4()),user_id=user.user_id,status='running',
                       request={'sessionId':request.sessionId,'week':measurement.week_number or 1})
    db.add(job); db.commit(); db.refresh(job)
    try:
        result=await llm_request('POST','/generate',{'prompt':prompt,'use_rag':True})
        if not isinstance(result.get('job_id'),str): raise HTTPException(502,'Missing upstream job ID')
        job.result=result; job.status='pending'; db.commit()
    except HTTPException:
        job.status='failed'; job.error_code='submission_failed_or_unknown'; db.commit()
        raise
    return {'requestId':job.id,'status':'generating','estimatedSeconds':120,'video':as_video(job)}


@router.get('/jobs/{job_id}')
async def status(job_id:UUID,db:Session=Depends(get_db),user=Depends(get_current_user)):
    job=owned(db,job_id,user); await refresh(job,db)
    return {'requestId':job.id,'status':as_video(job)['status'],'video':as_video(job)}


@router.get('/videos')
async def videos(db:Session=Depends(get_db),user=Depends(get_current_user)):
    jobs=db.query(ChoreographyJob).filter_by(user_id=user.user_id).order_by(ChoreographyJob.created_at.desc()).limit(20).all()
    for job in jobs:
        await refresh(job,db)
    return [as_video(job) for job in jobs]


@router.post('/feedback')
def feedback(request:FeedbackRequest,db:Session=Depends(get_db),user=Depends(get_current_user)):
    job=owned(db,request.videoId,user)
    job.result={**(job.result or {}),'feedback':request.feedback}
    db.commit()
    return {'accepted':True,'nextAction':'save_only'}
