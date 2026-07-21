# Knowledge corpus (RAG groundwork)

Curated, cited, evidence-based "principle cards" that ground the AI coach's claims about
training science. This directory is the **source of truth**; a build step
(`app/scripts/build-knowledge.mjs`) compiles every card into
`app/functions/src/knowledge.json`, which Functions import at runtime — the same pattern as
`catalog.json`. The RAG layer that embeds and retrieves these cards is a **separate, later
step**; this corpus only surfaces and validates the content.

## Layout

One markdown file per card (1 file = 1 future embedding chunk), grouped by domain:

- `hypertrophy/` — muscle-growth & strength mechanics
- `programming/` — periodization, split design, session structure
- `recovery/` — sleep, readiness, fatigue management
- `nutrition/` — protein, energy balance, supplements

The build parser globs `knowledge/*/*.md` (domain subfolders only), so this README is
ignored.

## Card schema

```markdown
---
id: volume-dose-response          # stable kebab-case, globally unique
title: "Weekly volume dose–response"
domain: hypertrophy               # hypertrophy | programming | recovery | nutrition
tags: [volume, sets, growth]
muscles: [all]                    # "all" or ids that are keys of MUSCLE_RANGES
evidence: strong                  # strong | moderate | emerging
sources:
  - ref: "Schoenfeld BJ, Ogborn D, Krieger JW. J Sports Sci 2017;35(11):1073–1082"
    url: "https://pubmed.ncbi.nlm.nih.gov/27433992/"
---
**Claim:** …

**Evidence:** …

**Takeaway:** …
```

## Authoring rules

1. **Every card cites at least one real, web-verified source.** No fabricated DOIs,
   PMIDs, authors, or journals. If a claim can't be backed by a findable source, downgrade
   `evidence:` or drop the card.
2. **Never contradict the science already encoded in code.** Cards on volume must agree
   with `MUSCLE_RANGES` (`functions/src/volumeTargets.ts`), the e1RM card with Epley
   (`rm.ts`), and readiness cards with `isLowReadiness` (`readinessRule.ts`). Where a card
   overlaps the code, it says so explicitly.
3. `evidence:` reflects the strength of the underlying literature: `strong` = multiple
   meta-analyses / position stands agree; `moderate` = consistent but thinner or
   single-study; `emerging` = plausible mechanism, limited direct RCT evidence.
4. Keep bodies tight (~120–220 words), self-contained, and practical — each card must make
   sense retrieved alone, with no dependence on its neighbours.
