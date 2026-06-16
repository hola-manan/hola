"""A deterministic offline chat model for testing the graph without network access.

Enabled via PRD_FAKE_LLM=1. It inspects the system instruction to figure out
which stage is calling and returns a short, stage-appropriate placeholder. This
exists purely so the end-to-end wiring (interrupts, auto-stakeholder, tool loop,
file output) can be verified where the real Anthropic API is unreachable.
"""

from __future__ import annotations

from typing import Any

from langchain_core.callbacks import CallbackManagerForLLMRun
from langchain_core.language_models.chat_models import BaseChatModel
from langchain_core.messages import AIMessage, BaseMessage
from langchain_core.outputs import ChatGeneration, ChatResult


def _stage_reply(system: str, user: str) -> str:
    low = system.lower()
    if "interview me" in low:
        return ("Problem & evidence\n1. What problem, for whom, and how do we know it's real?\n"
                "Target users\n2. Who is the primary user, and who is explicitly not?\n"
                "Success metrics\n3. What leading/lagging metric defines success, and the target?")
    if "product manager" in low and "answer" in low:  # auto-stakeholder
        return ("1. SMB operations teams lose time chasing status updates; 3 customer interviews confirm it.\n"
                "2. Primary: ops leads at 50-500 person companies. Not: individual consumers.\n"
                "3. Reduce status-chasing time by 30% within a quarter (baseline unknown).")
    if "decision ledger" in low:
        return ("Decision ledger\n| Assumption | Source |\n|---|---|\n"
                "| Primary user = SMB ops lead | confirmed |\n"
                "| Target = -30% status time | your default |\n"
                "| Baseline status time | needs my decision [TBD] |")
    # Finalization must be checked before the completeness branch: prompt 7's text
    # mentions "the additions from the completeness sweep".
    if "final, clean prd" in low or "ready-to-build checklist" in low:
        return ("# Final PRD\n## Status\nv0.1 — owner: TBD — open questions: 2 blocking\n"
                "## 1. TL;DR\nCut SMB ops status-chasing time ~30%.\n"
                "## Open Questions\n- Baseline status time [TBD]\n- Data retention [TBD]\n"
                "## Functional Requirements\nFR-1 Aggregate status. FR-2 Handle auth failure.\n"
                "## Changelog vs first draft\n- Added FR-2, NFR-1; surfaced baseline as blocking.\n"
                "## Ready-to-build checklist\n[ ] Resolve baseline metric\n[ ] Confirm integrations")
    if "first complete draft" in low or "exact headings" in low:
        return ("# PRD (draft)\n## 1. TL;DR\nA tool that cuts status-chasing time for SMB ops.\n"
                "## 3. Goals & Non-Goals\nGoal: -30% status time. Non-goal: replacing the PM tool.\n"
                "## 6. Functional Requirements\nFR-1 Aggregate status from connected tools.\n"
                "## 8. Success Metrics\n-30% status time (baseline [TBD]).")
    if "review panel" in low or "attack this prd" in low:
        return ("Staff engineer: FR-1 under-specifies which tools integrate [major].\n"
                "Exec: baseline metric is [TBD], so success is unmeasurable [blocker].\n"
                "Kill criteria: none identified.")
    if "completeness sweep" in low:
        return ("Additions block\nFR-2 Handle integration auth failure with a retry + user alert [v1].\n"
                "NFR-1 p95 dashboard load < 2s at 10x volume [v1].\n"
                "Open question: data retention period [TBD].")
    if "three standalone summaries" in low:
        return ("Leadership: cut SMB ops status time ~30%; need a baseline-measurement decision.\n"
                "Engineering: P0 is FR-1/FR-2; key risk is integration auth + p95<2s at scale.\n"
                "Design: primary user is the ops lead; happy path is the status dashboard.")
    return f"[fake-llm] stageless reply for: {user[:80]}"


class FakeChatModel(BaseChatModel):
    """Minimal offline chat model. Ignores tools (returns no tool calls)."""

    @property
    def _llm_type(self) -> str:
        return "fake-prd"

    def _generate(
        self,
        messages: list[BaseMessage],
        stop: list[str] | None = None,
        run_manager: CallbackManagerForLLMRun | None = None,
        **kwargs: Any,
    ) -> ChatResult:
        system = next((str(m.content) for m in messages if m.type == "system"), "")
        user = next((str(m.content) for m in reversed(messages) if m.type == "human"), "")
        text = _stage_reply(system, user)
        return ChatResult(generations=[ChatGeneration(message=AIMessage(content=text))])

    def bind_tools(self, tools: Any, **kwargs: Any) -> "FakeChatModel":  # noqa: D401
        # Fake model doesn't emit tool calls; the real tools are tested separately.
        return self
