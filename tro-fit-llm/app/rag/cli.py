"""python -m app.rag.cli init-db | ingest | search QUERY"""
import argparse
import asyncio
import json
from ..core.config import ROOT
from ..core.errors import ServiceError
from ..db import vectorstore
from ..models.embedding_model import embed
from .documents import load_documents
from .retriever import retrieve


async def ingest():
    chunks, sources, skipped = load_documents(ROOT / 'data')
    embeddings = []
    for i in range(0,len(chunks),8):
        result = await embed([c['content'] for c in chunks[i:i+8]])
        embeddings.extend(result['embeddings'])
        print(f'Embedded {len(embeddings)}/{len(chunks)}', flush=True)
    # Do not alter the database until all documents are parsed and embedded.
    if chunks:
        await asyncio.to_thread(vectorstore.replace_sources, chunks, embeddings, sources)
    print(json.dumps({'indexed':len(chunks),'sources':len(sources),'skipped':skipped},ensure_ascii=False))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('command', choices=['init-db','ingest','search'])
    parser.add_argument('query', nargs='?')
    args = parser.parse_args()
    if args.command == 'search' and not args.query:
        parser.error('search requires a query')
    try:
        if args.command == 'init-db':
            vectorstore.initialize()
            print('pgvector table ready')
        elif args.command == 'ingest':
            asyncio.run(ingest())
        else:
            print(json.dumps(asyncio.run(retrieve(args.query)), ensure_ascii=False,indent=2))
    except ServiceError as exc:
        parser.exit(1, f'{exc.code}: {exc.message}\n')


if __name__ == '__main__':
    main()
