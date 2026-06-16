# prd_agent — the 7-step PRD flow as a LangGraph app

A runnable LangChain/LangGraph implementation of the prompt sequence in
[`../prompts`](../prompts). It runs the whole "clarify → generate → verify" flow
end-to-end with **no UI** (stdin/stdout only) and can target any of the PRD
process styles in [`../prds`](../prds).

## How it maps to the prompts

The graph is a linear `StateGraph` — one node per prompt, START → 1 → … → 7 → END:

| Node | Prompt file | What it does |
|------|-------------|--------------|
| `discovery_interview` | `01-discovery-interview.md` | gets the rough idea, model produces grouped questions |
| `gap_resolution` | `02-answers-gap-resolution.md` | collects answers, builds the decision ledger |
| `draft_generation` | `03-prd-draft-generation.md` | writes the structured first-draft PRD |
| `pressure_test` | `04-adversarial-pressure-test.md` | three-persona adversarial critique |
| `completeness_sweep` | `05-completeness-edge-case-sweep.md` | systematic gap additions |
| `audience_summaries` | `06-audience-tailored-summaries.md` | exec / eng / design summaries |
| `finalization` | `07-finalization.md` | integrates everything, saves the final PRD |

Each node loads its instruction **verbatim** from the corresponding prompt file
(the fenced block), so the authored wording is the single source of truth.

## Human-in-the-loop

The two human turns (the rough idea, and the interview answers) use LangGraph
`interrupt()` with a checkpointer. Two run modes:

- **interactive** (default): the graph pauses and you answer on stdin.
- **`--auto`**: an LLM "stakeholder" answers the interview, so the flow runs
  unattended (handy for demos and CI).

## Tools

Real LangChain tools (in `tools.py`):
- `list_prd_styles` / `get_prd_style` — read the process-style references in
  `../prds`, so the draft stage can target a specific format (the draft node
  exposes these to the model for tool-calling when `--style` is set).
- `save_prd` — writes the final PRD to `output/` (used by the finalize node).

## Install

```bash
python3 -m venv .venv && . .venv/bin/activate
pip install -r ../requirements.txt
```

## Run

```bash
# Interactive — the graph interviews you on stdin
python -m prd_agent.run

# Auto — an LLM answers the interview; runs unattended
python -m prd_agent.run --auto --idea "a Slack bot that summarizes long threads"

# Target a specific PRD process style (keys come from list_prd_styles)
python -m prd_agent.run --auto --idea "..." --style amazon-working-backwards-prfaq

# Choose the output filename
python -m prd_agent.run --auto --idea "..." --out my-feature
```

The final PRD is written to `output/<name>.md`.

## Web UI (Wells Fargo–themed)

A FastAPI backend (`web.py`) wraps the same graph and serves a single-page UI
(`static/`) styled after Wells Fargo (red/gold palette, wordmark, stagecoach
emblem) — an internal demo mockup, not an official Wells Fargo product.

```bash
pip install -r ../requirements.txt
uvicorn prd_agent.web:app          # or: python -m prd_agent.web   (PORT env optional)
# then open http://localhost:8000
```

The page lets you enter an idea, pick a PRD format, choose Auto or Interactive
mode, and watch the seven stages fill in. In Interactive mode the UI surfaces
each `interrupt` (the idea ask, then the generated questions) as an input panel.
The same `PRD_FAKE_LLM=1` switch runs the UI offline.

API: `GET /api/meta`, `GET /api/styles`, `POST /api/start`, `POST /api/resume`.

## Configuration

| Env var | Purpose | Default |
|---------|---------|---------|
| `ANTHROPIC_API_KEY` | Auth for the Anthropic API | (required for real runs) |
| `ANTHROPIC_BASE_URL` | API base URL / gateway | public API |
| `PRD_MODEL` | Model id | `claude-opus-4-8` |
| `PRD_FAKE_LLM` | If set, use a deterministic offline fake model (no network) — for testing the graph wiring end-to-end | unset |

### Offline smoke test

```bash
PRD_FAKE_LLM=1 python -m prd_agent.run --auto --idea "a tool for tracking team OKRs"
```

This exercises all seven stages, the interrupt/resume loop, and file output
without hitting the network — useful where the real API isn't reachable.
