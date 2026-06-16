# PRD prompt sequence

A rigorous, 7-step "clarify → generate → verify" workflow for producing a PRD
with an AI model (works in ChatPRD or any capable chat model). Run the prompts
**in order, in the same conversation**, so context carries forward.

| # | Prompt | What it does |
|---|--------|--------------|
| 01 | [Discovery interview](01-discovery-interview.md) | Forces the model to interview you before writing anything. |
| 02 | [Answers + gap resolution](02-answers-gap-resolution.md) | You answer; it checks coverage, conflicts, and builds a decision ledger. |
| 03 | [PRD draft generation](03-prd-draft-generation.md) | Generates the first structured, traceable draft. |
| 04 | [Adversarial pressure-test](04-adversarial-pressure-test.md) | A three-persona panel attacks the draft and names kill criteria. |
| 05 | [Completeness & edge-case sweep](05-completeness-edge-case-sweep.md) | Systematic gap hunt across edge cases, errors, scale, ops, etc. |
| 06 | [Audience-tailored summaries](06-audience-tailored-summaries.md) | Self-contained exec / eng / design summaries. |
| 07 | [Finalization](07-finalization.md) | Integrates everything, runs quality gates, produces build-ready PRD. |

## The throughline
Three disciplines repeat across every prompt:
1. **Interview before drafting** — no spec until the model has asked its questions.
2. **Mark `[TBD]` instead of fabricating** — unknowns become open questions, never invented numbers.
3. **Trace every requirement back to a goal** — anything that doesn't is flagged as scope creep.

## Targeting a specific PRD format
In Prompt 3 you can tell the model which structure to use — e.g. "format this as
an Amazon PR/FAQ" or "as a lean one-pager." See the [`../prds`](../prds) folder
for the available process styles.
