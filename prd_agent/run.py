"""CLI driver for the PRD generation graph (no UI — stdin/stdout only).

Examples:
    # Interactive: the graph interviews you and you answer on stdin.
    python -m prd_agent.run

    # Auto: an LLM stakeholder answers the interview; runs unattended.
    python -m prd_agent.run --auto --idea "a Slack bot that summarizes threads"

    # Target a specific PRD process style (see prds/ for keys).
    python -m prd_agent.run --auto --idea "..." --style amazon-working-backwards-prfaq
"""

from __future__ import annotations

import argparse
import sys
import uuid

from langgraph.checkpoint.memory import MemorySaver
from langgraph.types import Command

from .graph import build_graph
from .llm import model_name


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Run the 7-step PRD generation flow.")
    parser.add_argument("--auto", action="store_true",
                        help="Auto mode: an LLM answers the interview instead of you.")
    parser.add_argument("--idea", default=None, help="The rough product idea (one line).")
    parser.add_argument("--style", default=None,
                        help="PRD process style key (e.g. amazon-working-backwards-prfaq).")
    parser.add_argument("--out", default=None, help="Output filename for the final PRD.")
    args = parser.parse_args(argv)

    graph = build_graph(checkpointer=MemorySaver())
    config = {"configurable": {"thread_id": str(uuid.uuid4())}}

    init: dict = {"mode": "auto" if args.auto else "interactive"}
    if args.idea:
        init["idea"] = args.idea
    if args.style:
        init["style"] = args.style
    if args.out:
        init["out_path"] = args.out

    print(f"Model: {model_name()} | mode: {init['mode']}", flush=True)

    pending: object = init
    final_state: dict = {}
    while True:
        result = graph.invoke(pending, config)
        interrupts = result.get("__interrupt__")
        if not interrupts:
            final_state = result
            break
        payload = interrupts[0].value
        print("\n" + "-" * 70)
        print(payload.get("prompt", "Input needed:"))
        print("-" * 70)
        try:
            answer = input("\nYour answer:\n> ")
        except EOFError:
            print("\nNo input available; aborting.", file=sys.stderr)
            return 1
        pending = Command(resume=answer)

    print("\n" + "=" * 70)
    print("DONE.")
    if final_state.get("saved_path"):
        print(f"Final PRD: {final_state['saved_path']}")
    print("=" * 70)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
