"""The PRD generation graph.

Seven nodes, one per prompt stage, wired START -> 1 -> ... -> 7 -> END. Human
turns (the rough idea and the interview answers) are gathered with LangGraph
``interrupt`` in interactive mode, or synthesized by an LLM "stakeholder" in
auto mode. The draft stage uses real model tool-calling to pull a PRD style from
the prds/ folder; the finalize stage persists the result with the save_prd tool.
"""

from __future__ import annotations

from langchain_core.messages import AIMessage, HumanMessage, SystemMessage, ToolMessage
from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import END, START, StateGraph
from langgraph.types import interrupt

from .llm import get_llm
from .prompts import load_prompt
from .state import PRDState
from .tools import STYLE_TOOLS, read_style, save_prd


# --------------------------------------------------------------------------- #
# Helpers
# --------------------------------------------------------------------------- #
def _text(msg: AIMessage) -> str:
    """Extract plain text from an AIMessage whose content may be blocks."""
    content = msg.content
    if isinstance(content, str):
        return content.strip()
    parts: list[str] = []
    for block in content:
        if isinstance(block, str):
            parts.append(block)
        elif isinstance(block, dict) and block.get("type") == "text":
            parts.append(block.get("text", ""))
    return "\n".join(parts).strip()


def _invoke(system: str, user: str, max_tokens: int = 8000) -> str:
    """Single-shot model call with a system instruction and a user message."""
    llm = get_llm(max_tokens=max_tokens)
    resp = llm.invoke([SystemMessage(content=system), HumanMessage(content=user)])
    return _text(resp)


def _invoke_with_tools(system: str, user: str, tools: list, max_tokens: int = 8000) -> str:
    """Model call that may use tools, looping until it returns a final answer."""
    llm = get_llm(max_tokens=max_tokens).bind_tools(tools)
    tool_map = {t.name: t for t in tools}
    messages: list = [SystemMessage(content=system), HumanMessage(content=user)]
    for _ in range(6):
        resp = llm.invoke(messages)
        messages.append(resp)
        if not getattr(resp, "tool_calls", None):
            return _text(resp)
        for call in resp.tool_calls:
            tool = tool_map.get(call["name"])
            result = tool.invoke(call["args"]) if tool else f"Unknown tool {call['name']}"
            messages.append(ToolMessage(content=str(result), tool_call_id=call["id"]))
    return _text(resp)


def _banner(stage_num: int, title: str) -> None:
    print(f"\n{'=' * 70}\n[{stage_num}/7] {title}\n{'=' * 70}", flush=True)


# --------------------------------------------------------------------------- #
# Nodes
# --------------------------------------------------------------------------- #
def discovery_interview(state: PRDState) -> dict:
    _banner(1, "Discovery interview")
    idea = state.get("idea")
    if not idea:
        if state.get("mode") == "auto":
            idea = "a generic SaaS feature"  # fallback; normally supplied via --idea
        else:
            idea = interrupt({"stage": "idea", "prompt": "Describe your rough product idea (one line):"})

    system = load_prompt("discovery_interview")
    user = f"The idea: {idea}\n\nProduce your interview questions now, following your instructions exactly."
    questions = _invoke(system, user)
    print(questions, flush=True)
    return {"idea": idea, "questions": questions}


def gap_resolution(state: PRDState) -> dict:
    _banner(2, "Answers + gap resolution")
    questions = state["questions"]
    if state.get("mode") == "auto":
        stakeholder_sys = (
            "You are the product manager / stakeholder who proposed this idea. "
            "Answer the interviewer's questions concretely and realistically, keyed to "
            "their numbering. Invent plausible specifics where needed; if something is "
            "genuinely undecided, say 'unknown'."
        )
        answers = _invoke(
            stakeholder_sys,
            f"The idea: {state['idea']}\n\nThe interviewer asked:\n{questions}\n\nAnswer now.",
        )
        print("[auto-stakeholder answers]\n" + answers, flush=True)
    else:
        answers = interrupt({"stage": "answers", "prompt": questions})

    system = load_prompt("gap_resolution")
    user = (
        f"The idea: {state['idea']}\n\nYour earlier questions:\n{questions}\n\n"
        f"Here are my answers:\n{answers}\n\nNow follow your instructions."
    )
    ledger = _invoke(system, user)
    print(ledger, flush=True)
    return {"answers": answers, "decision_ledger": ledger}


def draft_generation(state: PRDState) -> dict:
    _banner(3, "PRD draft generation")
    system = load_prompt("draft_generation")
    style = state.get("style")
    style_note = ""
    tools_used = False
    if style:
        # Demonstrate genuine tool-calling: let the model fetch the style spec.
        style_note = (
            f"\n\nFormat this PRD in the '{style}' process style. Use the list_prd_styles "
            "and get_prd_style tools to retrieve the exact structure before drafting."
        )
        tools_used = True

    user = (
        f"The idea: {state['idea']}\n\nDecision ledger (confirmed):\n{state['decision_ledger']}\n\n"
        f"Answers:\n{state['answers']}\n\nWrite the first-draft PRD now.{style_note}"
    )
    if tools_used:
        draft = _invoke_with_tools(system, user, STYLE_TOOLS, max_tokens=12000)
    else:
        draft = _invoke(system, user, max_tokens=12000)
    print(draft, flush=True)
    return {"draft": draft}


def pressure_test(state: PRDState) -> dict:
    _banner(4, "Adversarial pressure-test")
    system = load_prompt("pressure_test")
    user = f"Here is the PRD draft to attack:\n\n{state['draft']}"
    critique = _invoke(system, user)
    print(critique, flush=True)
    return {"critique": critique}


def completeness_sweep(state: PRDState) -> dict:
    _banner(5, "Completeness & edge-case sweep")
    system = load_prompt("completeness_sweep")
    user = (
        f"Here is the current PRD:\n\n{state['draft']}\n\n"
        f"(Pressure-test findings for context, do not merely repeat them:\n{state['critique']})"
    )
    additions = _invoke(system, user)
    print(additions, flush=True)
    return {"additions": additions}


def audience_summaries(state: PRDState) -> dict:
    _banner(6, "Audience-tailored summaries")
    system = load_prompt("audience_summaries")
    user = (
        f"Current PRD:\n\n{state['draft']}\n\nAdditions from the completeness sweep:\n"
        f"{state['additions']}\n\nProduce the three summaries now."
    )
    summaries = _invoke(system, user)
    print(summaries, flush=True)
    return {"summaries": summaries}


def finalization(state: PRDState) -> dict:
    _banner(7, "Finalization")
    system = load_prompt("finalization")
    user = (
        "Integrate everything into the final PRD.\n\n"
        f"=== DRAFT ===\n{state['draft']}\n\n"
        f"=== PRESSURE-TEST OBJECTIONS ===\n{state['critique']}\n\n"
        f"=== COMPLETENESS ADDITIONS ===\n{state['additions']}\n\n"
        "Apply your finalization instructions and output the final PRD."
    )
    final = _invoke(system, user, max_tokens=12000)

    # Persist using the real save_prd tool.
    slug = "".join(c if c.isalnum() else "-" for c in state.get("idea", "prd").lower())[:48].strip("-")
    out = state.get("out_path") or f"{slug or 'prd'}.md"
    saved_path = save_prd.invoke({"content": final, "filename": out})
    print(f"\nFinal PRD saved to: {saved_path}", flush=True)
    return {"final_prd": final, "saved_path": saved_path}


# --------------------------------------------------------------------------- #
# Graph assembly
# --------------------------------------------------------------------------- #
def build_graph(checkpointer=None):
    """Build and compile the PRD graph. A checkpointer is required for interrupts."""
    g = StateGraph(PRDState)
    g.add_node("discovery_interview", discovery_interview)
    g.add_node("gap_resolution", gap_resolution)
    g.add_node("draft_generation", draft_generation)
    g.add_node("pressure_test", pressure_test)
    g.add_node("completeness_sweep", completeness_sweep)
    g.add_node("audience_summaries", audience_summaries)
    g.add_node("finalization", finalization)

    g.add_edge(START, "discovery_interview")
    g.add_edge("discovery_interview", "gap_resolution")
    g.add_edge("gap_resolution", "draft_generation")
    g.add_edge("draft_generation", "pressure_test")
    g.add_edge("pressure_test", "completeness_sweep")
    g.add_edge("completeness_sweep", "audience_summaries")
    g.add_edge("audience_summaries", "finalization")
    g.add_edge("finalization", END)

    return g.compile(checkpointer=checkpointer or MemorySaver())
