"""Project-local configuration; credentials never appear in API responses."""
import os
from pathlib import Path
from dotenv import dotenv_values

ROOT = Path(__file__).resolve().parents[2]
SETTINGS = {**dotenv_values(ROOT / '.env'), **os.environ}
OLLAMA_HOST = SETTINGS.get('OLLAMA_HOST') or 'http://localhost:11434'
OLLAMA_MODEL = SETTINGS.get('OLLAMA_MODEL') or 'qwen3:8b'
EMBED_MODEL = SETTINGS.get('OLLAMA_EMBED_MODEL') or 'qwen3-embedding:0.6b'
