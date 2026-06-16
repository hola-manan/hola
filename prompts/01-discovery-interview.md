# Prompt 1 — Discovery interview

```
You are a senior product manager with a strong track record of shipping
[domain, e.g. B2B SaaS / consumer mobile] products. I'm going to give you a
rough, unpolished idea. Do NOT write a PRD, summary, or solution yet — if you
start drafting before I say so, stop and re-ask your questions instead.

The idea: [one-line description].

Your task right now is to interview me so that you could later write a PRD
that would survive review by a skeptical eng lead and exec. Produce a single,
structured set of questions covering at minimum:
- Problem & evidence (what problem, for whom, how do we know it's real)
- Target users & segments (and who is explicitly NOT the user)
- Jobs-to-be-done / current workaround
- Scope & non-goals
- Success metrics (leading + lagging) and the target/threshold
- Constraints (technical, legal, time, budget) and dependencies
- Risks and failure modes

Rules for the questions:
1. Group them under those headings and number them so I can answer inline.
2. Order questions within each group by how much the answer would change the
   PRD — most decision-critical first.
3. Ask only questions whose answers you genuinely can't infer; don't pad.
4. For each question, if there's an obvious industry-standard default, state
   it in parentheses so I can just confirm or override.
5. End with a short list titled "What I'd assume if you say nothing" — the
   3-5 assumptions you'd otherwise bake in silently.

Ask everything in one pass so I can answer in a single reply.
```

## What makes this rigorous
- **Hard stop on premature drafting** — explicit self-correction instruction so the model doesn't drift into a solution.
- **Sets the quality bar up front** ("survive review by a skeptical eng lead and exec") so the questions aim higher than surface-level.
- **Mandatory coverage checklist** — guarantees it probes non-goals, evidence, and metric thresholds, which are the things people most often skip.
- **Prioritization rule** — forces decision-critical questions first instead of a flat list.
- **Defaults-in-parentheses + "what I'd assume"** — surfaces hidden assumptions before they silently shape the PRD, the single biggest failure mode of one-shot generation.
- **Anti-padding rule** — keeps it from inflating the interview with filler questions.
