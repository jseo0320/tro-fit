"""Split local text documents and text-based PDF pages with traceable IDs."""
import hashlib
from pypdf import PdfReader


def load_documents(root):
    chunks, sources, skipped = [], [], []
    for path in sorted(root.rglob('*')):
        if not path.is_file():
            continue
        source = path.relative_to(root).as_posix()
        if path.suffix.lower() in ('.md', '.txt'):
            pages = [(None, path.read_text(encoding='utf-8'))]
        elif path.suffix.lower() == '.pdf':
            pages = [(i+1, page.extract_text() or '') for i,page in enumerate(PdfReader(path).pages)]
        else:
            skipped.append(source)
            continue
        if not any(text.strip() for _,text in pages):
            skipped.append(source)
            continue
        sources.append(source)
        for page, text in pages:
            text = text.strip()
            for start in range(0,len(text),1000):
                content = text[start:start+1200].strip()
                if not content:
                    continue
                key = f'{source}:{page}:{start}:{content}'
                chunks.append({'id':hashlib.sha256(key.encode()).hexdigest(),
                               'source':source,'page':page,'content':content})
    return chunks, sources, skipped
