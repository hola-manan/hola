# Prompt 7 — Finalization

```
Now produce the final, clean PRD by integrating everything: the original
draft, the additions from the completeness sweep, and any fixes for the
pressure-test objections I've accepted. This is the version people will
actually read and build from.

Do all of the following:

1. Resolve & integrate
   - Fold in every accepted addition and fix. For each pressure-test
     objection, either resolve it in the body or move it to Open Questions
     with a note on why it's unresolved — never drop one silently.
   - Renumber requirements cleanly (FR-1, FR-2…) so there are no gaps.

2. Surface the decision state at the top
   - Open the doc with a short "Status" block: version/date, owner
     placeholders, and a count of open questions still blocking.
   - List all remaining [TBD] and [needs my decision] items in one place,
     each with a suggested owner placeholder — so nothing unresolved is
     buried mid-document.

3. Final quality gates — run these checks and fix what fails:
   - Consistency: TL;DR, goals, requirements, and metrics all agree (no goal
     without a metric, no P0 requirement without a goal).
   - Testability: every functional requirement is atomic and verifiable;
     every NFR has a concrete number.
   - No fabrication: every metric/number is either sourced from my input or
     marked [TBD] — flag anything that looks invented.
   - Scope discipline: non-goals are explicit; nothing in the body
     contradicts them.

4. Output format
   - The full PRD, clean and reviewer-ready (tables and numbered lists over
     prose).
   - Then a short "Changelog vs. first draft" — bullet list of what changed
     and why, so a reviewer who saw the draft can diff quickly.
   - Then a "Ready-to-build checklist": the conditions that must be true
     before eng starts (e.g., all P0 open questions resolved, metrics
     instrumented, dependencies confirmed), with each item checked or
     unchecked.

Do not introduce new scope, goals, or numbers at this stage — finalization
is integration and verification only, not invention.
```

## What makes this rigorous
- **Forced reconciliation of the critique** — every pressure-test objection must be resolved or explicitly parked in Open Questions; nothing evaporates.
- **Status block + consolidated unresolved list** — puts the decision state at the top so a reader instantly knows whether this is build-ready.
- **Explicit final quality gates** — re-runs consistency / testability / no-fabrication / scope checks, catching drift introduced while integrating edits.
- **Changelog vs. draft** — lets a prior reviewer diff the final quickly.
- **Ready-to-build checklist** — converts "the PRD is done" into a concrete, checkable definition of done.
- **"Integration, not invention" guard** — prevents sneaking in new scope or numbers at the riskiest step.
