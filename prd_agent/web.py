"""FastAPI web UI for the PRD generation graph.

Wraps the existing LangGraph flow (graph.build_graph) and drives its
interrupt/resume loop over HTTP. Serves a Wells Fargo-themed single-page UI from
``static/``. Run with::

    uvicorn prd_agent.web:app --reload
    # or: python -m prd_agent.web

Set PRD_FAKE_LLM=1 to exercise the whole thing offline.
"""

from __future__ import annotations

import os
import uuid
from pathlib import Path

from fastapi import FastAPI
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from langgraph.checkpoint.memory import MemorySaver
from langgraph.types import Command
from pydantic import BaseModel

from .graph import build_graph
from .llm import model_name
from .stages import STAGES
from .tools import available_styles

STATIC_DIR = Path(__file__).resolve().parent / "static"

# One compiled graph for the process; per-run isolation is via thread_id.
# build_graph() validates every prompt, so a bad prompt fails app startup.
_GRAPH = build_graph(checkpointer=MemorySaver())

# Ordered (state key, title) pairs for the UI, straight from the stage registry.
STAGE_TITLES: list[tuple[str, str]] = [(s.field, s.title) for s in STAGES]

app = FastAPI(title="PRD Studio")


class StartReq(BaseModel):
    idea: str = ""
    style: str | None = None
    mode: str = "auto"  # "auto" | "interactive"
    out: str | None = None


class ResumeReq(BaseModel):
    thread_id: str
    answer: str


def _stages(values: dict) -> list[dict]:
    """Project graph state into ordered stage cards for the UI."""
    out = []
    for key, title in STAGE_TITLES:
        content = values.get(key)
        out.append({"key": key, "title": title, "content": content or "", "done": bool(content)})
    return out


def _run_segment(thread_id: str, payload) -> dict:
    """Invoke the graph until it interrupts or finishes; return a UI payload."""
    config = {"configurable": {"thread_id": thread_id}}
    result = _GRAPH.invoke(payload, config)
    values = _GRAPH.get_state(config).values
    interrupts = result.get("__interrupt__") if isinstance(result, dict) else None
    response = {
        "thread_id": thread_id,
        "stages": _stages(values),
        "idea": values.get("idea", ""),
    }
    if interrupts:
        payload_val = interrupts[0].value
        response["status"] = "interrupt"
        response["interrupt_stage"] = payload_val.get("stage", "")
        response["prompt"] = payload_val.get("prompt", "Input needed")
    else:
        response["status"] = "done"
        response["saved_path"] = values.get("saved_path", "")
    return response


@app.get("/api/meta")
def meta() -> dict:
    return {"model": model_name(), "fake": bool(os.environ.get("PRD_FAKE_LLM"))}


@app.get("/api/styles")
def styles() -> list[dict]:
    return available_styles()


@app.get("/api/stages")
def stages_list() -> list[dict]:
    """The ordered stage titles, so the UI doesn't hardcode them."""
    return [{"title": s.title, "field": s.field} for s in STAGES]


@app.post("/api/start")
def start(req: StartReq) -> JSONResponse:
    thread_id = str(uuid.uuid4())
    init: dict = {"mode": req.mode}
    if req.idea:
        init["idea"] = req.idea
    if req.style:
        init["style"] = req.style
    if req.out:
        init["out_path"] = req.out
    return JSONResponse(_run_segment(thread_id, init))


@app.post("/api/resume")
def resume(req: ResumeReq) -> JSONResponse:
    return JSONResponse(_run_segment(req.thread_id, Command(resume=req.answer)))


@app.get("/")
def index() -> FileResponse:
    return FileResponse(STATIC_DIR / "index.html")


app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")


def main() -> None:
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=int(os.environ.get("PORT", "8000")))


if __name__ == "__main__":
    main()
