from typing import Annotated
from pydantic import BaseModel, ConfigDict, Field, StringConstraints

Text = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=4000)]


class GenerateRequest(BaseModel):
    model_config = ConfigDict(extra='forbid')
    prompt: Text
    use_rag: bool = False


class VideoPrompt(BaseModel):
    model_config = ConfigDict(extra='forbid')
    video_prompt: Text


class EmbedRequest(BaseModel):
    model_config = ConfigDict(extra='forbid')
    texts: list[Text] = Field(min_length=1, max_length=16)


class SearchRequest(BaseModel):
    model_config = ConfigDict(extra='forbid')
    query: Text
    limit: int = Field(default=5, ge=1, le=10)
