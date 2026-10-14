from typing import Literal
from pydantic import BaseModel, ConfigDict, Field


class GenerateRequest(BaseModel):
    model_config = ConfigDict(extra='forbid')
    sessionId: str = Field(min_length=1, max_length=128)
    romResult: dict | None = None  # Backward-compatible input; use server-owned ROM instead.


class FeedbackRequest(BaseModel):
    model_config = ConfigDict(extra='forbid')
    videoId: str = Field(min_length=1, max_length=36)
    feedback: Literal['too_fast', 'just_right', 'too_hard', 'more']
