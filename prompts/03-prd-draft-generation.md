# Prompt 3 — PRD draft generation

```
The decision ledger is confirmed (with these corrections: [none / list them]).
Now write the first complete draft of the PRD.

Structure (use these exact headings):
1. TL;DR — 3 sentences max: what we're building, for whom, and the one
   metric that defines success.
2. Problem & Context — the problem, the evidence it's real, and why now.
3. Goals & Non-Goals — goals as measurable outcomes, not features.
   Non-goals must be explicit (what we are deliberately NOT doing).
4. Target Users — primary user first; note segments excluded.
5. User Stories / Key Flows — written as "As a [user], I want [x] so that
   [outcome]," each tagged P0/P1/P2.
6. Functional Requirements — numbered (FR-1, FR-2…), each atomic and
   testable. No requirement should bundle two behaviors.
7. Non-Functional Requirements — performance, scale, security/privacy,
   accessibility, with concrete targets (numbers, not adjectives).
8. Success Metrics — each metric paired with a baseline (or "unknown"),
   a target, and how it's measured.
9. Open Questions — carry over every [needs my decision] item from the
   ledger, with an owner placeholder.
10. Risks & Mitigations — top risks, likelihood/impact, and the mitigation.

Hard rules:
- Every requirement must trace to a goal or user story. If you write a
  requirement that doesn't, delete it or flag it as scope creep.
- Use precise, verifiable language. Replace any "fast / easy / intuitive /
  robust" with a measurable criterion or mark it [TBD: define].
- Do not invent facts, numbers, or research. If a number is needed and we
  don't have it, write [TBD] — never fabricate a plausible-looking metric.
- Keep it reviewable: prefer tables and numbered lists over prose paragraphs.

After the draft, append a "Traceability check": a short table mapping each
P0 requirement to the goal it serves. If any P0 requirement has no goal,
list it under "Unjustified — review."
```

## What makes this rigorous
- **Locked structure with naming conventions** (FR-1, P0/P1/P2) — makes the PRD referenceable; downstream tickets can cite requirement IDs.
- **"Goals as outcomes, not features" + mandatory non-goals** — attacks the two most common PRD weaknesses: vague goals and unbounded scope.
- **Atomic, testable requirements rule** — prevents the un-QA-able compound requirement.
- **Numbers-not-adjectives constraint** — bans "fast/intuitive/robust" and forces measurable targets or an honest `[TBD]`.
- **Anti-fabrication rule** — must write `[TBD]` rather than invent a credible-sounding metric or research finding.
- **Traceability check** — forces every P0 requirement to justify itself against a goal, catching scope creep mechanically.
