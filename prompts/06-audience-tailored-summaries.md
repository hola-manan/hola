# Prompt 6 — Audience-tailored summaries

```
Now produce three standalone summaries of the current PRD (after the
additions from the last step). Each must be self-contained — readable by
someone who has NOT seen the full PRD — and written in the language and
priorities of its audience.

1. Leadership / exec (target: ~150 words)
   - Lead with the outcome and "why now," not the feature.
   - State the problem, the expected business impact, and the one headline
     success metric with its target.
   - Name the top risk and what we need from leadership (a decision, budget,
     headcount, or just awareness).
   - No implementation detail. No jargon.

2. Engineering (target: ~250 words + a short list)
   - Scope in terms of P0 requirements and the key technical implications,
     dependencies, and integration points.
   - Call out the hardest/riskiest technical unknowns and the NFR targets
     that will drive design (scale, latency, security).
   - List the open questions that block engineering specifically.

3. Design (target: ~200 words + a short list)
   - The primary user, their job-to-be-done, and the key flows (happy path
     + the most important unhappy path).
   - The user-facing decisions still open and any constraints that shape UX.

Rules for all three:
- Every claim must be consistent with the PRD — do not introduce any goal,
  metric, scope, or number that isn't already in it. If a summary needs
  something the PRD lacks, flag it as a gap rather than inventing it.
- Tailor emphasis, not facts: the three summaries must not contradict each
  other.
- End each summary with a one-line "What I need from you" call to action
  specific to that audience.
```

## What makes this rigorous
- **"Self-contained" requirement** — real summaries get forwarded alone, so each must stand on its own.
- **Length + shape targets per audience** — prevents three near-identical blurbs; forces genuine re-prioritization (exec = outcome, eng = scope/risk, design = flows).
- **Consistency guardrail** — forbids introducing any goal/metric/number not in the PRD, and requires the three summaries not to contradict each other.
- **"Flag, don't invent"** — if a summary exposes a missing piece, that surfaces as a gap rather than getting silently filled in.
- **Per-audience call to action** — turns each summary into something that drives a decision.
