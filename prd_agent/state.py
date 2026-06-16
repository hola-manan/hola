"""Shared state for the PRD generation graph."""

from __future__ import annotations

from typing import TypedDict


class PRDState(TypedDict, total=False):
    """State threaded through every node of the PRD graph.

    Each field is produced by the stage named after the corresponding prompt.
    Fields are optional (total=False) because they're filled in progressively.
    """

    # Run configuration
    mode: str          # "interactive" | "auto"
    style: str         # optional PRD process style key (see prds/), e.g. "amazon-working-backwards-prfaq"
    out_path: str      # where the final PRD is written

    # Stage 1 — discovery interview
    idea: str          # the rough one-line idea
    questions: str     # grouped interview questions produced by the model

    # Stage 2 — answers + gap resolution
    answers: str       # the user's (or auto-stakeholder's) answers
    decision_ledger: str

    # Stage 3 — draft
    draft: str

    # Stage 4 — adversarial pressure-test
    critique: str

    # Stage 5 — completeness sweep
    additions: str

    # Stage 6 — audience summaries
    summaries: str

    # Stage 7 — finalization
    final_prd: str
    saved_path: str
