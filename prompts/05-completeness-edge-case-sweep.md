# Prompt 5 — Completeness & edge-case sweep

```
Now do a systematic completeness sweep of the PRD. The goal is to find what's
missing, not to re-critique what's already there (that was the last step).

Work through these categories one by one and, for each, list concrete gaps
specific to THIS product — skip a category only if you can say why it
genuinely doesn't apply:

- Edge cases & boundary conditions (empty/zero/max states, first-run, the
  "unhappy path" for each P0 flow).
- Error & failure handling (what the user sees and what the system does when
  a dependency, network, or input fails).
- State & lifecycle (creation, edit, deletion, undo, concurrency, data
  migration, what happens to existing data/users).
- Permissions & roles (who can do what; admin vs. end user; unauthenticated).
- Privacy, security & compliance (PII handling, consent, audit, retention,
  any regulatory angle).
- Scale & performance limits (what happens at 10x and 100x expected volume).
- Internationalization & accessibility (locale, timezone, a11y standards).
- Dependencies & integrations (upstream/downstream systems, third parties,
  rollout/feature-flag needs).
- Observability & operations (what we log/alert on, how we'd know it's
  broken in production, support/runbook needs).
- Day-2 concerns (analytics instrumentation, experimentation, deprecation/
  rollback plan).

For each gap found:
- State the gap as a concrete missing requirement or decision.
- Propose the specific addition (a new FR-/NFR- line, or an open question).
- Tag it must-have-for-v1 / fast-follow / later.

Then output a single "Additions" block I can paste into the PRD: the new
numbered requirements and open questions, already formatted to match the
existing sections. Do not rewrite the whole PRD — only the deltas.

Do not fabricate; if a gap needs data we don't have, write it as an open
question with [TBD], not an invented answer.
```

## What makes this rigorous
- **Explicit category checklist** — an enumerated taxonomy forces coverage of the categories teams most reliably forget, vs. a shallow open-ended "what am I missing?"
- **"Skip only with justification"** — prevents silently ignoring a category.
- **Concrete-addition output** — each gap becomes a paste-ready FR-/NFR-/open-question line in the existing format.
- **Deltas only** — avoids a full rewrite that churns the doc and hides what changed.
- **Priority tags (v1 / fast-follow / later)** — keeps the sweep from ballooning scope.
- **Anti-fabrication carryover** — unknowns become `[TBD]` open questions, never invented answers.
