# Build pipeline for the knowledge corpus (RAG groundwork — plumbing only)

**Standing instructions:** Implement this plan exactly. Do not touch anything outside the
project directory; if an out-of-project need is discovered mid-run, list it at the end of
your response instead of doing it. Do not commit. Do NOT edit anything under
`app/functions/src/knowledge/` — those markdown cards are hand-authored source of truth and
are already written; your job is only the build pipeline, type, and test around them.

## Context

`app/functions/src/knowledge/<domain>/*.md` contains 41 hand-authored, cited "principle
cards" (domains: `hypertrophy`, `programming`, `recovery`, `nutrition`) that will later
ground the AI coach via RAG. This task compiles them into a single bundled JSON the Firebase
Functions can import at runtime — mirroring the existing `catalog.json` pattern (imported in
`app/functions/src/context.ts` via `import catalogJson from './catalog.json'`;
`resolveJsonModule` is already enabled). **No embedding or retrieval here** — just build,
type, and validate the corpus.

Each card is a markdown file with YAML-style frontmatter then a markdown body:

```markdown
---
id: volume-dose-response
title: "Weekly volume dose–response for hypertrophy"
domain: hypertrophy
tags: [volume, sets, dose-response, hypertrophy]
muscles: [all]
evidence: strong
sources:
  - ref: "Schoenfeld BJ, ... J Sports Sci 2017;35(11):1073–1082"
    url: "https://pubmed.ncbi.nlm.nih.gov/27433992/"
---
**Claim:** …

**Evidence:** …

**Takeaway:** …
```

Frontmatter facts you can rely on across ALL cards (do not need to handle other shapes):
- Keys always appear in this order: `id`, `title`, `domain`, `tags`, `muscles`, `evidence`,
  `sources`.
- `id`, `domain`, `evidence` are bare tokens (no quotes). `title` is double-quoted and may
  contain colons, en dashes, and parentheses.
- `tags` and `muscles` are single-line bracketed lists: `[a, b, c]` (bare comma-separated
  tokens; `muscles` is always either `[all]` or muscle ids).
- `sources` is a block list of one or more items, each exactly two indented lines:
  `  - ref: "…"` then `    url: "…"`. Both values are double-quoted and may contain colons.
- Files are UTF-8 and contain non-ASCII characters (–, ×, ≥). Read and write as UTF-8.

## Task 1 — `app/scripts/build-knowledge.mjs`

A Node ESM script (mirror the style of `app/scripts/curate.mjs` — dependency-free, uses only
`node:fs`/`node:path`). It must:

1. Glob `app/functions/src/knowledge/*/*.md` (domain subfolders only, so
   `knowledge/README.md` is naturally excluded). Resolve paths relative to the script so it
   works when run from `app/`.
2. For each file, split off the frontmatter (the block between the first two `---` lines) and
   the body (everything after). Parse the frontmatter into `{id, title, domain, tags[],
   muscles[], evidence, sources: [{ref, url}]}` using a small purpose-built parser for the
   fixed shape above (do NOT add a YAML dependency):
   - scalars: strip one pair of surrounding double quotes if present.
   - `tags`/`muscles`: strip the `[` `]`, split on `,`, trim each token.
   - `sources`: iterate the indented `- ref:`/`url:` line pairs.
   - `body`: the trimmed markdown after the closing `---`.
3. Validate every card and **fail loudly** (`console.error` + `process.exit(1)`) on any of:
   duplicate `id`; missing/empty `id`, `title`, `domain`, `evidence`, or `body`; empty
   `sources`, or any source missing `ref` or `url`; `domain` not in
   `['hypertrophy','programming','recovery','nutrition']`; `evidence` not in
   `['strong','moderate','emerging']`; any `muscles` entry that is not `'all'` and not a key
   of `MUSCLE_RANGES` (import the keys from `../functions/src/volumeTargets.ts` — or, if
   importing TS from an .mjs is awkward, hard-code the muscle-key list with a comment saying
   it must stay in sync with `volumeTargets.ts`).
4. Sort cards by `domain` then `id` (stable output), and write
   `app/functions/src/knowledge.json` as UTF-8, pretty-printed (2-space), array of
   `{id, title, domain, tags, muscles, evidence, sources, body}`.
5. Print a summary: total card count and a per-domain breakdown (expected: hypertrophy 12,
   programming 12, recovery 8, nutrition 9 → total 41).

Add an npm script to `app/package.json`: `"build:knowledge": "node scripts/build-knowledge.mjs"`.

## Task 2 — type + accessor

1. In `app/functions/src/domain.ts`, add exported types beside `CatalogEntry`:
   ```ts
   export type KnowledgeDomain = 'hypertrophy' | 'programming' | 'recovery' | 'nutrition'
   export type EvidenceLevel = 'strong' | 'moderate' | 'emerging'
   export interface KnowledgeSource { ref: string; url: string }
   export interface KnowledgeCard {
     id: string
     title: string
     domain: KnowledgeDomain
     tags: string[]
     muscles: string[]
     evidence: EvidenceLevel
     sources: KnowledgeSource[]
     body: string
   }
   ```
2. New file `app/functions/src/knowledge.ts` that imports the built JSON and exposes it typed
   (parallel to how `context.ts` does `CATALOG`/`CATALOG_BY_ID`):
   ```ts
   import knowledgeJson from './knowledge.json'
   import type { KnowledgeCard } from './domain'
   export const KNOWLEDGE: KnowledgeCard[] = knowledgeJson as KnowledgeCard[]
   export const KNOWLEDGE_BY_ID = new Map(KNOWLEDGE.map((c) => [c.id, c]))
   ```
   **Do not** wire this into `context.ts`, the prompts, or any endpoint — retrieval is a
   later step. Just load and export.

## Task 3 — `app/functions/src/knowledge.test.ts`

A vitest test (style like the other `*.test.ts` in `functions/src`) asserting, against the
imported `KNOWLEDGE` array:
- non-empty (≥ 40 cards), and every `id` is unique.
- every card has non-empty `id`, `title`, `body`, and ≥ 1 source, each source having
  non-empty `ref` and `url` (url starts with `http`).
- every `domain` ∈ the four allowed values; every `evidence` ∈ the three allowed values.
- every `muscles` entry is `'all'` or a key of `MUSCLE_RANGES` (import from `./volumeTargets`).

## Constraints

- Create/modify ONLY: `app/scripts/build-knowledge.mjs`, `app/functions/src/knowledge.json`,
  `app/functions/src/knowledge.ts`, `app/functions/src/knowledge.test.ts`,
  `app/functions/src/domain.ts` (add types only), `app/package.json` (add one script).
- Do NOT edit any file under `app/functions/src/knowledge/`. Do NOT add npm dependencies.
- Do NOT touch anything outside this project directory. Do NOT run `firebase deploy`, do NOT
  commit. Claude handles deploy/commit.

## Verification (run these; all must pass)

- From `app/`: `node scripts/build-knowledge.mjs` → exits 0, prints total 41 (12/12/8/9),
  regenerates `functions/src/knowledge.json` as valid JSON.
- From `app/functions/`: `npm run build` (tsc) passes with the new import/types.
- From `app/functions/`: `npm test` (vitest) passes, including the new `knowledge.test.ts`.
- From `app/`: `npm run build` passes; `npm run lint` passes.
