# hola-gym

Mobile-first PWA gym tracker (React 19 + Vite + TypeScript + Firebase). Tracks workouts, training cycles, readiness (Amazfit watch data), and has AI features (workout creator, coach chat, weekly summaries) served by Firebase Functions.

## Standing rules for the implementing agent
- Implement the plan in `plans/current.md` exactly; do not deviate or add unrequested features.
- Never touch anything outside this project directory. If an out-of-project need appears (package installs beyond `npm i` in this repo, global config, env vars, services), do NOT do it — list it at the end of your response instead.
- Do not commit; leave changes in the working tree.

## Layout
- `app/` — the PWA. Source in `app/src`: `screens/` (one file per route), `components/`, `lib/` (pure domain logic, unit-tested), `data/exercises.ts` (curated catalog, single primary muscle per exercise), `types.ts`, `store.tsx`, `App.tsx` (routes).
- `app/functions/` — Firebase Functions (AI endpoints). Mirrors some frontend logic by copy (e.g. `readinessRule.ts`, and `volumeTargets.ts` mirroring the ranges in `app/src/lib/targets.ts`) because functions cannot import app src.
- `app/functions/src/knowledge/` — hand-authored, cited "principle cards" of training science (domains: `hypertrophy`, `programming`, `recovery`, `nutrition`), one `.md` per card with YAML frontmatter (see the dir's `README.md` for the schema and authoring rules). Source of truth for the knowledge corpus. `app/scripts/build-knowledge.mjs` compiles them into `app/functions/src/knowledge.json` (bundled + validated), exposed typed via `app/functions/src/knowledge.ts` (`KnowledgeCard` type in `domain.ts`).
- **RAG (coach chat):** `app/functions/src/knowledge-embeddings.json` is a precomputed Vertex embedding index (gemini-embedding-001, 768-dim, unit-normalized; one vector per card), built by `app/functions/scripts/build-embeddings.mjs` (needs GCP ADC). `app/functions/src/retrieval.ts` does in-memory cosine retrieval (`retrieveCards`) — real Vertex query embedding in prod, a keyword fallback under `usingMock`, graceful `[]` on any error — and `formatScienceBlock` renders retrieved cards for the prompt. Wired into `coachChat` **only** (`index.ts`): retrieved cards are injected as a cited "SCIENCE REFERENCES" block and the coach cites them inline. `report`/`summary`/`creator` are NOT science-grounded.
- `docs/feature-spec.md` — domain vocabulary and feature spec.

## Conventions
- Screens are verbatim ports of `app/design-refs/*.html` mockups — inline `style={{}}` px values are the spec; fonts IBM Plex Mono / Sans / Sans Condensed; dark palette (#0b0d10 bg, #c8f04b accent, #e8b44c amber warn, #57c4cc teal, #8b93a0 muted).
- Pure logic lives in `app/src/lib` with vitest tests alongside (`*.test.ts`).
- Working sets = sets whose `type !== 'warmup'`; each exercise credits exactly one primary muscle.

## Commands
- App: `cd app` then `npm test` (vitest), `npm run build` (tsc + vite), `npm run lint` (oxlint), `npm run dev`.
- Functions: `cd app/functions` then `npm test`, `npm run build`.
- Knowledge corpus: after editing any card under `functions/src/knowledge/`, regenerate with `cd app && npm run build:knowledge` (validates + rewrites `knowledge.json`); `functions` vitest `knowledge.test.ts` guards the invariants. Then rebuild the embedding index with `cd app/functions && GCLOUD_PROJECT=gymm-fd071 npm run build:embeddings` (needs ADC) so `knowledge-embeddings.json` stays in sync with the cards.
