"""Reusable LangChain chat models; no network validation during construction."""
from langchain_ollama import ChatOllama
from ..core.config import OLLAMA_HOST, OLLAMA_MODEL


def _model(num_ctx: int) -> ChatOllama:
    return ChatOllama(
        model=OLLAMA_MODEL, base_url=OLLAMA_HOST, reasoning=False,
        num_ctx=num_ctx, num_predict=512, keep_alive=0,
        client_kwargs={'timeout': 180}, validate_model_on_init=False,
    )


llm = _model(4096)
rag_llm = _model(8192)


async def generate_video_prompt(user_prompt: str, context: list[dict] | None = None):
    # Keep the service's existing interface; chain construction lives separately.
    from ..chains.video_prompt_chain import generate
    return await generate(user_prompt, context)
