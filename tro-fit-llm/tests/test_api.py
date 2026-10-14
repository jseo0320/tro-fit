import unittest
from types import SimpleNamespace
from unittest.mock import AsyncMock, patch
import httpx
from fastapi.testclient import TestClient
from app.main import app
from app.models import text_model, video_model, embedding_model
from app.schemas import VideoPrompt
from langchain_core.exceptions import OutputParserException
from ollama import ResponseError


class ApiTests(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_validation_and_docs(self):
        self.assertEqual(self.client.get('/docs').status_code, 200)
        self.assertEqual(self.client.post('/prompts', json={'prompt': '  '}).status_code, 422)
        self.assertEqual(self.client.post('/videos', json={'video_prompt': 'x', 'model': 'other'}).status_code, 422)

    def test_real_prompt_json_validation(self):
        with patch('app.chains.video_prompt_chain.chain', SimpleNamespace(ainvoke=AsyncMock(return_value=VideoPrompt(video_prompt='A full-body dancer.')))):
            self.assertEqual(self.client.post('/prompts', json={'prompt': 'dance'}).json(), {'video_prompt': 'A full-body dancer.'})
        with patch('app.chains.video_prompt_chain.chain', SimpleNamespace(ainvoke=AsyncMock(side_effect=OutputParserException('not json')))):
            self.assertEqual(self.client.post('/prompts', json={'prompt': 'dance'}).status_code, 502)

    def test_no_fake_embeddings(self):
        with patch.object(embedding_model, 'embeddings', SimpleNamespace(aembed_documents=AsyncMock(side_effect=ResponseError('unsupported', status_code=501)))):
            response = self.client.post('/embeddings', json={'texts': ['dance']})
            self.assertEqual(response.status_code, 422)
            self.assertEqual(response.json()['error']['code'], 'embedding_unsupported')

    def test_video_payload_and_poll(self):
        replies = [httpx.Response(202, json={'id':'test-job'}), httpx.Response(200, json={'status':'completed','result':{'video_url':'https://example.com/video.mp4'}})]
        with patch.dict(video_model.SETTINGS, {'LTX_API_KEY':'test-secret','LTX_MODEL':'ltx-2-3-fast'}), patch('app.models.video_model.httpx.AsyncClient') as factory:
            http = factory.return_value.__aenter__.return_value
            http.request = AsyncMock(side_effect=replies)
            response = self.client.post('/videos', json={'video_prompt':'A dancer.'})
            self.assertEqual(response.status_code, 202)
            call = http.request.call_args
            self.assertEqual(call.kwargs['json']['duration'], 6)
            self.assertEqual(call.kwargs['json']['model'], 'ltx-2-3-fast')
            result = self.client.get('/jobs/test-job').json()
            self.assertEqual(result['video_url'], 'https://example.com/video.mp4')

    def test_invalid_embedding_vector_is_rejected(self):
        with patch.object(embedding_model, 'embeddings', SimpleNamespace(aembed_documents=AsyncMock(return_value=[[0.0, 0.0]]))):
            response = self.client.post('/embeddings', json={'texts':['dance']})
            self.assertEqual(response.status_code, 502)

    def test_error_does_not_leak_provider_body(self):
        with patch.dict(video_model.SETTINGS, {'LTX_API_KEY':'test-secret','LTX_MODEL':'ltx-2-3-fast'}), patch('app.models.video_model.httpx.AsyncClient') as factory:
            factory.return_value.__aenter__.return_value.request = AsyncMock(return_value=httpx.Response(401, text='test-secret'))
            response = self.client.post('/videos', json={'video_prompt':'A dancer.'})
            self.assertEqual(response.status_code, 502)
            self.assertNotIn('test-secret', response.text)

    def test_generate_stops_before_llm_when_config_missing(self):
        with patch.dict(video_model.SETTINGS, {'LTX_MODEL':''}), patch.object(text_model, 'generate_video_prompt', AsyncMock()) as generate:
            self.assertEqual(self.client.post('/generate', json={'prompt':'dance'}).status_code, 503)
            generate.assert_not_awaited()

    def test_generate_connects_prompt_to_video(self):
        prompt = VideoPrompt(video_prompt='A full-body dancer taking side steps.')
        with patch.object(video_model, 'require_video_provider'), patch.object(text_model, 'generate_video_prompt', AsyncMock(return_value=prompt)), patch.object(video_model, 'generate_video', AsyncMock(return_value={'job_id':'job-1','status':'pending'})) as video:
            response = self.client.post('/generate', json={'prompt':'side steps'})
            self.assertEqual(response.status_code, 202)
            self.assertEqual(response.json()['video_prompt'], prompt.video_prompt)
            video.assert_awaited_once_with(prompt)

    def test_timeout_never_retries_paid_request(self):
        with patch.dict(video_model.SETTINGS, {'LTX_API_KEY':'test-secret','LTX_MODEL':'ltx-2-3-fast'}), patch('app.models.video_model.httpx.AsyncClient') as factory:
            request = factory.return_value.__aenter__.return_value.request
            request.side_effect = httpx.ReadTimeout('private upstream details')
            response = self.client.post('/videos', json={'video_prompt':'A dancer.'})
            self.assertEqual(response.status_code, 503)
            request.assert_awaited_once()
            self.assertNotIn('private upstream', response.text)


if __name__ == '__main__':
    unittest.main()
