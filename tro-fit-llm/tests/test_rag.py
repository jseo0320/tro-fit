import unittest
from unittest.mock import AsyncMock, patch
from fastapi.testclient import TestClient
from app.main import app
from app.core.errors import ServiceError
from app.db.vectorstore import vector_literal
from app.rag.documents import load_documents
from app.core.config import ROOT
from app.schemas import VideoPrompt


class RagTests(unittest.TestCase):
    def test_dimension_and_nonfinite_rejected(self):
        for v in ([1.0], [0.0]*1024, [float('nan')]*1024):
            with self.assertRaises(ServiceError): vector_literal(v)

    def test_documents_include_sources_skip_images(self):
        chunks,sources,skipped=load_documents(ROOT/'data')
        self.assertTrue(chunks)
        self.assertTrue(all(len(c['content'])<=1200 and c['source'] in sources for c in chunks))
        self.assertEqual(len(chunks),len({c['id'] for c in chunks}))
        self.assertTrue(any(s.endswith('.png') for s in skipped))

    def test_rag_empty_never_calls_llm(self):
        with patch('app.services.generation_service.retrieve',AsyncMock(return_value=[])), patch('app.services.generation_service.text_model.generate_video_prompt',AsyncMock()) as llm:
            response=TestClient(app).post('/prompts',json={'prompt':'dance','use_rag':True})
            self.assertEqual(response.status_code,409)
            llm.assert_not_awaited()

    def test_rag_passages_reach_llm(self):
        matches=[{'id':'1','source':'ref.md','content':'avoid jumps','page':None,'score':0.8}]
        with patch('app.services.generation_service.retrieve',AsyncMock(return_value=matches)), patch('app.services.generation_service.text_model.generate_video_prompt',AsyncMock(return_value=VideoPrompt(video_prompt='Side steps.'))) as llm:
            response=TestClient(app).post('/prompts',json={'prompt':'dance','use_rag':True})
            self.assertEqual(response.status_code,200)
            llm.assert_awaited_once_with('dance',context=matches)
