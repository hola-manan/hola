# Prompt 4 — Adversarial pressure-test

```
Now switch roles and attack this PRD. You are no longer the author — you are
a review panel of three skeptics, and you must give each one a turn:

1. A skeptical staff engineer — looking for under-specified requirements,
   hidden complexity, unrealistic NFR targets, and dependencies we're
   hand-waving.
2. A pragmatic exec / budget owner — looking for weak problem evidence,
   unclear ROI, scope that's too big for the stated timeline, and metrics
   that won't actually prove success.
3. A user advocate / designer — looking for flows that break for real users,
   edge cases, accessibility gaps, and places we've assumed ideal behavior.

For each reviewer, output their 3-5 sharpest objections. For every objection:
- Quote the specific section/requirement it targets (cite the FR-/section).
- Explain why it's a problem and the realistic consequence if unaddressed.
- Rate severity: blocker / major / minor.

Then consolidate:
- "Weakest assumptions" — rank the top 5 assumptions this PRD depends on,
  most load-bearing first, and note what breaks if each is wrong.
- "Kill criteria" — name any single objection that, if true, means we
  shouldn't build this at all.

Rules:
- Be specific and harsh; do not soften, hedge, or pre-defend the PRD.
- Do NOT fix anything yet. Critique only. Each objection must be concrete
  enough that I could act on it — no generic "consider edge cases" advice.
```

## What makes this rigorous
- **Three named adversarial personas** instead of one generic critic — engineering, business, and user lenses surface different failure classes.
- **Citation requirement** — each objection points at a specific FR/section, so the critique is actionable.
- **Severity + consequence** — separates "blocker" from "nice to fix," so you triage instead of drowning in equal-weight notes.
- **Ranked weakest assumptions + "what breaks if wrong"** — turns the critique into a risk model.
- **"Kill criteria"** — forces the model to name conditions under which the project shouldn't proceed, which a self-flattering draft never volunteers.
- **Critique-only, no-softening rule** — keeps the model from quietly fixing problems or pulling punches; bans generic advice.
