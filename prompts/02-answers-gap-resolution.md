# Prompt 2 — Answers + gap resolution

```
Here are my answers, keyed to your question numbers:
[paste answers — leave anything genuinely unknown blank or write "unknown"]

Before you draft anything, do the following and show your work:

1. Coverage check: list any of your own questions I left unanswered or
   answered vaguely. Don't guess past them silently.

2. For each unknown/vague item, propose a specific, reasonable default,
   state the assumption explicitly, and rate your confidence (high/med/low).
   Mark anything low-confidence as a blocking open question I must resolve.

3. Conflict check: flag any places where my answers contradict each other,
   are internally inconsistent, or imply scope I didn't state. Quote the
   conflicting answers back to me.

4. Reframe check: in 2-3 sentences, restate the core problem and the single
   most important user in your own words. If your restatement differs from
   what I said, tell me where — this is how I'll know we're aligned.

5. Output a consolidated "decision ledger": a short table of every
   assumption/default you're carrying into the PRD, each tagged
   [confirmed by me] / [your default] / [needs my decision].

Do not write the PRD yet. Stop after the decision ledger and wait for me to
confirm or correct it.
```

## What makes this rigorous
- **Forces an explicit coverage check** — makes the model enumerate what's still missing rather than quietly papering over it.
- **Confidence ratings + blocking flags** — distinguishes a safe default from a genuine unknown that should halt progress, so low-confidence guesses don't get laundered into the PRD as facts.
- **Conflict detection** — catches contradictions in your own answers before they become contradictions in the spec; quoting them back prevents invisible "resolution."
- **Reframe/alignment check** — surfaces misunderstanding now, cheaply, instead of after a full draft.
- **Decision ledger** — one auditable place to see exactly what assumptions the PRD will rest on, tagged by source.
- **Second hard stop** — keeps the interview/drafting boundary intact.
