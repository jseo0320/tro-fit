"""Isolated API/queue tests: no production database, GPU or Ollama calls."""
from unittest.mock import patch
from uuid import uuid4
import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from app.db.base import Base
from app.db.session import get_db
from app.models.user import User
from app.models.choreography import ChoreographyJob
from app.api.v1.endpoints import choreography as api
from app import choreography_worker as worker
from tro_fit_llm.app.catalog import Catalog


@pytest.fixture
def context():
    engine = create_engine('sqlite://', connect_args={'check_same_thread': False}, poolclass=StaticPool)
    Base.metadata.create_all(engine)
    sessions = sessionmaker(bind=engine)
    with sessions.begin() as db:
        for key in ('owner', 'other'):
            db.add(User(user_id=key, password_hash='test', salt='test', user_email=key+'@test.invalid',
                        user_name=key, user_age=25, user_height=170, user_weight=60))
    app = FastAPI()
    app.include_router(api.router, prefix='/api/v1/choreography')
    def database():
        with sessions() as db:
            yield db
    def user():
        return User(user_id='owner')
    app.dependency_overrides[get_db] = database
    app.dependency_overrides[api.get_current_user] = user
    with TestClient(app) as client:
        yield client, sessions, app
    engine.dispose()


def catalog():
    return Catalog(version='test', reviewed_by='test-only', limits_deg={'right_elbow_flexion': 20}, motions=[{
        'id': 'test', 'asset_id': 'test', 'cue': 'test', 'targets_deg': {'right_elbow_flexion': 10},
        'loaded_regions': ['right_elbow'], 'source_ids': ['test-evidence'], 'neutral_to_neutral': True}])


def body():
    return {'pain_regions': [], 'measurements': [{'key': 'right_elbow_flexion', 'rom_deg': 90,
                                                 'reliable': True, 'confidence': 'HIGH'}]}


def test_queue_limits_and_ownership(context):
    client, sessions, app = context
    with patch.object(api, 'load_catalog', return_value=catalog()):
        result = client.post('/api/v1/choreography/generate', json=body())
        assert result.status_code == 202
        job_id = result.json()['job_id']
        assert client.get('/api/v1/choreography/jobs/'+job_id).json()['status'] == 'queued'
        assert client.get('/api/v1/choreography/jobs/'+job_id+'/video').status_code == 409
        assert client.post('/api/v1/choreography/generate', json=body()).status_code == 202
        assert client.post('/api/v1/choreography/generate', json=body()).status_code == 429
    app.dependency_overrides[api.get_current_user] = lambda: User(user_id='other')
    assert client.get('/api/v1/choreography/jobs/'+job_id).status_code == 404
    app.dependency_overrides.pop(api.get_current_user)
    assert client.get('/api/v1/choreography/jobs/'+job_id).status_code in (401, 403)


def test_client_cannot_supply_catalog_or_approved_angles(context):
    client, _, _ = context
    request = body()
    request['motion_catalog'] = []
    assert client.post('/api/v1/choreography/generate', json=request).status_code == 422
    request = body()
    request['measurements'][0]['approved_max_deg'] = 180
    assert client.post('/api/v1/choreography/generate', json=request).status_code == 422


def test_worker_errors_and_review_transition(context, tmp_path):
    _, sessions, _ = context
    job_id = str(uuid4())
    with sessions.begin() as db:
        db.add(ChoreographyJob(id=job_id, user_id='owner', status='queued', request={}))
    with patch.object(worker, 'SessionLocal', sessions), \
            patch.object(worker.main, 'generate_with_rag', side_effect=worker.embedding.RAGError('offline')):
        assert worker.process_one()
    with sessions.begin() as db:
        job = db.get(ChoreographyJob, job_id)
        assert job.status == 'failed' and job.error_code == 'rag_unavailable'
        job.status = 'queued'
    (tmp_path / 'video.mp4').write_bytes(b'test-only')
    with patch.object(worker, 'SessionLocal', sessions), patch.object(worker, 'output_root', return_value=tmp_path), \
            patch.object(worker.main, 'generate_with_rag', return_value={'status': 'plan_ready', 'video_request': {}}), \
            patch.object(worker.video, 'generate_video', return_value={'path': str(tmp_path/'video.mp4'), 'duration_seconds': 3}), \
            patch.object(worker, 'validate_video', return_value={'status': 'passed'}):
        assert worker.process_one()
        with sessions() as db:
            assert db.get(ChoreographyJob, job_id).status == 'needs_review'
        worker.approve(job_id, 'test reviewer')
        with sessions() as db:
            assert db.get(ChoreographyJob, job_id).status == 'succeeded'
