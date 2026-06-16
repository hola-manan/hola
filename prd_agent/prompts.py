"""Load the 7-step prompt sequence from the sibling ``prompts/`` folder.

Each prompt file contains a fenced code block (```) holding the actual prompt
text plus a prose rationale. We extract the fenced block so the graph reuses the
authored wording verbatim instead of duplicating it. The stage->file mapping
lives in ``stages.py`` (the single source of truth); this module just resolves
and validates the files.
"""

from __future__ import annotations

import re
from functools import lru_cache
from pathlib import Path

from .stages import STAGES, STAGE_BY_NODE

PROMPTS_DIR = Path(__file__).resolve().parent.parent / "prompts"

_FENCE_RE = re.compile(r"```(?:\w+)?\n(.*?)\n```", re.DOTALL)


@lru_cache(maxsize=None)
def load_prompt(file_stem: str) -> str:
    """Return the fenced prompt text for a prompt file stem.

    Raises FileNotFoundError if the file is missing, or ValueError if it has no
    (or an empty) fenced prompt block — surfaced eagerly via validate_prompts().
    """
    path = PROMPTS_DIR / f"{file_stem}.md"
    if not path.exists():
        raise FileNotFoundError(f"Prompt file not found: {path}")
    match = _FENCE_RE.search(path.read_text(encoding="utf-8"))
    if not match:
        raise ValueError(f"No fenced prompt block found in {path}")
    block = match.group(1).strip()
    if not block:
        raise ValueError(f"Empty prompt block in {path}")
    return block


def get_prompt(node: str) -> str:
    """Return the prompt text for a graph node, via the stage registry."""
    return load_prompt(STAGE_BY_NODE[node].file_stem)


def validate_prompts() -> None:
    """Load every stage's prompt up front, aggregating all failures.

    Called at graph-build / app-startup so a missing or malformed prompt fails
    fast with a clear message instead of mid-run inside a node.
    """
    errors: list[str] = []
    for stage in STAGES:
        try:
            load_prompt(stage.file_stem)
        except (FileNotFoundError, ValueError) as exc:
            errors.append(f"  [{stage.node}] {exc}")
    if errors:
        raise RuntimeError("Prompt validation failed:\n" + "\n".join(errors))
