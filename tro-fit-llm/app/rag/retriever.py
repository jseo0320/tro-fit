import asyncio
from pydantic import Field
from langchain_core.documents import Document
from langchain_core.retrievers import BaseRetriever
from ..models.embedding_model import embed
from ..db import vectorstore


class PgVectorRetriever(BaseRetriever):
    """LangChain retriever over the existing pgvector table, without data migration."""
    limit: int = Field(default=5, ge=1, le=10)

    def _get_relevant_documents(self, query: str, *, run_manager):
        return asyncio.run(self._aget_relevant_documents(query, run_manager=None))

    async def _aget_relevant_documents(self, query: str, *, run_manager):
        result = await embed(['Instruct: Retrieve reference passages relevant to movement constraints and choreography.\nQuery: '+query])
        matches = await asyncio.to_thread(vectorstore.search, result['embeddings'][0], self.limit)
        return [Document(page_content=m['content'],
                         metadata={k:v for k,v in m.items() if k != 'content'}) for m in matches]


async def retrieve(query: str, limit: int = 5):
    documents = await PgVectorRetriever(limit=limit).ainvoke(query)
    return [{**doc.metadata, 'content': doc.page_content} for doc in documents]
