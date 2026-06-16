"""ChatAnthropic factory.

Defaults to claude-opus-4-8 (override with PRD_MODEL). Honors ANTHROPIC_BASE_URL
and ANTHROPIC_API_KEY from the environment, the way the Anthropic SDK does.
"""

from __future__ import annotations

import os
from functools import lru_cache

from langchain_anthropic import ChatAnthropic

DEFAULT_MODEL = "claude-opus-4-8"


@lru_cache(maxsize=4)
def get_llm(max_tokens: int = 8000):
    """Return a configured chat model.

    Normally a ChatAnthropic client (model from PRD_MODEL, default claude-opus-4-8;
    honoring ANTHROPIC_BASE_URL). If PRD_FAKE_LLM is set, returns a deterministic
    offline fake so the full graph can be exercised without network access.
    """
    if os.environ.get("PRD_FAKE_LLM"):
        from .fake_llm import FakeChatModel
        return FakeChatModel()

    model = os.environ.get("PRD_MODEL", DEFAULT_MODEL)
    kwargs: dict = {
        "model": model,
        "max_tokens": max_tokens,
        "timeout": 600,
        "max_retries": 3,
    }
    base_url = os.environ.get("ANTHROPIC_BASE_URL")
    if base_url:
        kwargs["base_url"] = base_url
    # ChatAnthropic requires a non-empty key; a gateway may not check it.
    kwargs["api_key"] = os.environ.get("ANTHROPIC_API_KEY", "placeholder-key")
    return ChatAnthropic(**kwargs)


def model_name() -> str:
    return os.environ.get("PRD_MODEL", DEFAULT_MODEL)
