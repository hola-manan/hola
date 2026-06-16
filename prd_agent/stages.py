"""Single source of truth for the seven PRD stages.

Every part of the backend derives from this registry instead of re-encoding the
stage order, titles, prompt filenames, and output fields:

- ``prompts.py`` resolves each node to its prompt file and validates them.
- ``graph.py`` builds the node list and the linear edges from this order.
- ``web.py`` projects graph state into UI cards using the titles/fields here.

To add, remove, or reorder a stage, edit this list only.
"""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class Stage:
    node: str          # graph node name
    file_stem: str     # prompts/<file_stem>.md (the authored prompt)
    title: str         # human-facing title (UI + CLI banner)
    field: str         # PRDState key holding this stage's output
    human: bool = False  # whether the stage gathers human input (interrupt/auto)


STAGES: list[Stage] = [
    Stage("discovery_interview", "01-discovery-interview", "Discovery interview", "questions", human=True),
    Stage("gap_resolution", "02-answers-gap-resolution", "Answers & gap resolution", "decision_ledger", human=True),
    Stage("draft_generation", "03-prd-draft-generation", "PRD draft", "draft"),
    Stage("pressure_test", "04-adversarial-pressure-test", "Adversarial pressure-test", "critique"),
    Stage("completeness_sweep", "05-completeness-edge-case-sweep", "Completeness sweep", "additions"),
    Stage("audience_summaries", "06-audience-tailored-summaries", "Audience summaries", "summaries"),
    Stage("finalization", "07-finalization", "Final PRD", "final_prd"),
]

STAGE_BY_NODE: dict[str, Stage] = {s.node: s for s in STAGES}
STAGE_NUMBER: dict[str, int] = {s.node: i + 1 for i, s in enumerate(STAGES)}
