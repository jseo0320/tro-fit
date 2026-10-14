"""Durable database queue. Run separately from Uvicorn; one worker per GPU/database."""
import argparse
import logging
import time
from pathlib import Path
from sqlalchemy import select, text
from app.db.session import SessionLocal, engine
from app.models.user import User  # Registers the foreign-key target.
from app.models.choreography import ChoreographyJob
from tro_fit_llm.app import embedding, main, video
from tro_fit_llm.app.llm import LLMError
from tro_fit_llm.app.validation import validate_video
from tro_fit_llm.app.config import output_root

logger = logging.getLogger(__name__)
LOCK_ID = 73482191


def process_one():
    with SessionLocal.begin() as db:
        job = db.execute(select(ChoreographyJob).where(ChoreographyJob.status == 'queued')
                         .order_by(ChoreographyJob.created_at).with_for_update(skip_locked=True).limit(1)).scalar_one_or_none()
        if job is None:
            return False
        job.status = 'running'
        job_id, request = job.id, job.request
    result, path, error = None, None, None
    try:
        result = main.generate_with_rag(request)
        if result['status'] != 'plan_ready':
            status = 'blocked'
        else:
            rendered = video.generate_video(result['video_request'])
            path = rendered['path']
            try:
                report = validate_video(path, result)
            except Exception:
                report = {'status': 'needs_review', 'reason': 'Vision validation unavailable or failed'}
            result['validation'] = report
            result['video_status'] = 'needs_review'
            result['actual_duration_seconds'] = rendered['duration_seconds']
            status = 'needs_review'
    except embedding.RAGError:
        status, error = 'failed', 'rag_unavailable'
    except LLMError:
        status, error = 'failed', 'planning_failed'
    except video.VideoGenerationError:
        status, error = 'failed', 'video_generation_failed'
    except Exception:
        status, error = 'failed', 'worker_failed'
        logger.error('Choreography job %s failed unexpectedly', job_id)
    with SessionLocal.begin() as db:
        job = db.get(ChoreographyJob, job_id)
        job.status, job.result, job.video_path, job.error_code = status, result, path, error
    return True


def approve(job_id, reviewer):
    with SessionLocal.begin() as db:
        job = db.get(ChoreographyJob, job_id, with_for_update=True)
        if not job or job.status != 'needs_review' or not job.video_path:
            raise ValueError('Only generated videos awaiting review can be approved.')
        if job.result.get('validation', {}).get('status') != 'passed':
            raise ValueError('Automatic angle checks must pass before approving the video.')
        path = Path(job.video_path).resolve()
        if not path.is_relative_to(output_root()) or not path.is_file():
            raise ValueError('The generated private video file is missing.')
        job.status, job.reviewed_by = 'succeeded', reviewer
        job.result = dict(job.result, video_status='ready')


def run(once=False):
    if engine.dialect.name != 'postgresql':
        raise RuntimeError('The production worker requires PostgreSQL advisory locks.')
    # A dedicated session lock survives per-job commits and prevents two local GPU workers.
    with engine.connect().execution_options(isolation_level='AUTOCOMMIT') as lock:
        if not lock.execute(text('SELECT pg_try_advisory_lock(:key)'), {'key': LOCK_ID}).scalar():
            raise RuntimeError('Another choreography worker is already running.')
        try:
            # The lock proves the previous worker is gone. Never silently retry costly interrupted inference.
            with SessionLocal.begin() as db:
                db.query(ChoreographyJob).filter_by(status='running').update(
                    {'status': 'failed', 'error_code': 'worker_interrupted'})
            while True:
                processed = process_one()
                if once:
                    break
                if not processed:
                    time.sleep(2)
        finally:
            lock.execute(text('SELECT pg_advisory_unlock(:key)'), {'key': LOCK_ID})


def cli():
    parser = argparse.ArgumentParser()
    parser.add_argument('--once', action='store_true')
    parser.add_argument('--init-db', action='store_true')
    parser.add_argument('--approve', metavar='JOB_ID')
    parser.add_argument('--reviewer')
    args = parser.parse_args()
    if args.init_db:
        ChoreographyJob.__table__.create(engine, checkfirst=True)
    elif args.approve:
        if not args.reviewer or not args.reviewer.strip():
            parser.error('--reviewer is required after actually reviewing the video')
        approve(args.approve, args.reviewer)
    else:
        run(args.once)


if __name__ == '__main__':
    cli()
