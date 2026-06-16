"""Load the 7-step prompt sequence from the sibling ``prompts/`` folder.

Each prompt file contains a fenced code block (```) holding the actual prompt
text plus a prose rationale. We extract the fenced block so the graph reuses the
authored wording verbatim instead of duplicating it.
"""

from __future__ import annotations

import re
from functools import lru_cache
from pathlib import Path

PROMPTS_DIR = Path(__file__).resolve().parent.parent / "prompts"

# Logical stage name -> filename stem in prompts/
STAGE_FILES = {
    "discovery_interview": "01-discovery-interview",
    "gap_resolution": "02-answers-gap-resolution",
    "draft_generation": "03-prd-draft-generation",
    "pressure_test": "04-adversarial-pressure-test",
    "completeness_sweep": "05-completeness-edge-case-sweep",
    "audience_summaries": "06-audience-tailored-summaries",
    "finalization": "07-finalization",
}

_FENCE_RE = re.compile(r"```(?:\w+)?\n(.*?)\n```", re.DOTALL)


@lru_cache(maxsize=None)
def load_prompt(stage: str) -> str:
    """Return the fenced prompt text for a stage (raises if the file is missing)."""
    stem = STAGE_FILES[stage]
    path = PROMPTS_DIR / f"{stem}.md"
    text = path.read_text(encoding="utf-8")
    match = _FENCE_RE.search(text)
    if not match:
        raise ValueError(f"No fenced prompt block found in {path}")
    return match.group(1).strip()
