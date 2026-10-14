"""LCEL: prompt template | chat model | typed JSON parser."""
import json
import httpx
from ollama import ResponseError
from pydantic import ValidationError
from langchain_core.exceptions import OutputParserException
from langchain_core.output_parsers import PydanticOutputParser
from ..models.text_model import llm, rag_llm
from ..prompts.video_prompt import video_prompt
from ..schemas import VideoPrompt
from ..core.errors import ServiceError

parser = PydanticOutputParser(pydantic_object=VideoPrompt)
schema = VideoPrompt.model_json_schema()
chain = video_prompt | llm.bind(format=schema) | parser
rag_chain = video_prompt | rag_llm.bind(format=schema) | parser


async def generate(user_prompt: str, context: list[dict] | None = None) -> VideoPrompt:
    selected = rag_chain if context else chain
    user_input = (json.dumps({'request': user_prompt, 'reference_passages': context}, ensure_ascii=False)
                  if context else user_prompt)
    try:
        return await selected.ainvoke({'user_input': user_input})
    except ResponseError as exc:
        code = 'model_not_found' if exc.status_code == 404 else 'text_generation_failed'
        raise ServiceError(code, 'Ollama 모델 상태와 설치 버전을 확인하세요.') from None
    except (httpx.HTTPError, ConnectionError):
        raise ServiceError('ollama_unavailable', 'Ollama 서버 연결 실패 또는 시간 초과입니다.', 503) from None
    except (ValidationError, OutputParserException):
        raise ServiceError('invalid_model_output', '모델이 유효한 프롬프트 JSON을 반환하지 않았습니다.') from None
