# Wire RAG retrieval into the coach chat (science-grounded answers)

**Standing instructions:** Implement this plan exactly. Do not touch anything outside the
project directory; if an out-of-project need is discovered mid-run, list it at the end of
your response instead of doing it. Do not commit. Do NOT edit the knowledge cards
(`app/functions/src/knowledge/**`), `knowledge.json`, or `knowledge-embeddings.json` — those
are generated/authored artifacts already in the repo. Do NOT call any external service or
run the embedding build; the embedding index already exists and Claude will run any real
Vertex calls during verification.

## Context

The knowledge corpus (41 cited cards) is built and exposed via
`app/functions/src/knowledge.ts` (`KNOWLEDGE`, `KNOWLEDGE_BY_ID`), and a precomputed Vertex
embedding index sits at `app/functions/src/knowledge-embeddings.json`:
```json
{ "model": "gemini-embedding-001", "dim": 768, "taskType": "RETRIEVAL_DOCUMENT",
  "builtAt": "…", "vectors": { "<cardId>": [ …768 unit-normalized floats… ] } }
```
Every card has exactly one vector; vectors are L2-normalized (so cosine similarity is just a
dot product). The coach endpoints live in `app/functions/src/index.ts`; the LLM wrapper is
`app/functions/src/model.ts` (Gemini via Vertex, with `usingMock` for the emulator/tests);
deterministic mocks are in `app/functions/src/mocks.ts`.

**Goal:** at chat time, retrieve the few most relevant cards for the user's question and
inject them into the prompt so the coach grounds physiology claims in real, cited science and
shows the sources. **Scope is coach chat only** — do NOT touch `generateReport`,
`generateWeeklySummary`, or `createWorkout`.

## Task 1 — `model.ts`: add a query-embedding helper

Add an exported async `embedText(text, { taskType, model, dim })` that calls
`genai().models.embedContent({ model, contents: [text], config: { taskType,
outputDimensionality: dim } })` and returns `res.embeddings?.[0]?.values` (throw on empty).
This mirrors the existing `generateText`/`generateJson` style and reuses the same `genai()`
client. Do not add mock handling here — callers handle `usingMock`.

## Task 2 — new file `app/functions/src/retrieval.ts`

Pure, well-tested retrieval over the bundled index. Exports:

1. `import embeddingsJson from './knowledge-embeddings.json'` cast to a typed shape
   `{ model: string; dim: number; taskType: string; vectors: Record<string, number[]> }`
   (parallel to how `knowledge.ts` casts `knowledge.json`).
2. Helpers (all exported for tests, pure/sync):
   - `normalize(v: number[]): number[]` — L2-normalize (guard zero norm).
   - `dot(a: number[], b: number[]): number`.
   - `rankByVector(queryVec: number[], k, minScore): { id, score }[]` — normalize the query,
     dot against every card vector in `embeddingsJson.vectors`, sort desc, keep score ≥
     `minScore`, take top `k`. (Card vectors are already normalized.)
   - `keywordRank(query: string, k): { id, score }[]` — fallback used in mock mode: tokenize
     the query (lowercase, split on non-word, drop tokens < 3 chars), score each card by count
     of tokens appearing in its `title + tags + body` (case-insensitive), return top `k` with
     score > 0.
3. `async function retrieveCards(query: string, opts?: { k?: number; minScore?: number }):
   Promise<KnowledgeCard[]>` (defaults `k = 4`, `minScore = 0.5`):
   - If `usingMock` (import from `./model`): use `keywordRank(query, k)`.
   - Else: `embedText(query, { taskType: 'RETRIEVAL_QUERY', model: embeddingsJson.model, dim:
     embeddingsJson.dim })`, then `rankByVector`. Wrap the embed call in try/catch — on ANY
     error, `console.error(...)` and return `[]` (the coach must still work with zero cards).
   - Map result ids → `KNOWLEDGE_BY_ID` cards (drop any missing), preserve ranked order.
4. `formatScienceBlock(cards: KnowledgeCard[]): string` — returns `''` for an empty array,
   else a prompt section. Number the cards `[S1]`, `[S2]`, … and for each include title,
   evidence level, body, and the first source's `ref` + `url`. Wrap in clear delimiters, e.g.:
   ```
   === SCIENCE REFERENCES (peer-reviewed; cite when you use one) ===
   [S1] <title> (evidence: <evidence>)
   <body>
   Source: <sources[0].ref> — <sources[0].url>

   [S2] …
   ```

## Task 3 — wire into `coachChat` (`index.ts`)

In `coachChat`, after `loadUserData` and computing the last user message
(`trimmed[trimmed.length - 1].text`):
- `const cards = await retrieveCards(lastUserText)`.
- **Real branch:** build the prompt as today but insert `formatScienceBlock(cards)` between
  the user-data context and the `=== CONVERSATION ===` transcript (only when non-empty).
  Extend the chat instruction so the coach uses and cites them, e.g. append to the task line:
  *"Where a SCIENCE REFERENCE supports a claim, ground your answer in it and cite it inline
  like (Schoenfeld 2017); if you list sources, use only the provided references — never invent
  citations or cite a reference you didn't use."* Also add one sentence to the shared `SYSTEM`
  constant: *"When SCIENCE REFERENCES are provided, prefer them for exercise-science claims and
  cite them; never fabricate citations."*
- **Mock branch:** call `mockChat(data, lastUserText, cards)` (extended signature below) so the
  wiring is exercised deterministically in the emulator/tests.

## Task 4 — `mocks.ts`: make the mock cite retrieved cards

Extend `mockChat(data, lastMessage, cards: KnowledgeCard[] = [])`: keep the existing reply
logic, and when `cards.length`, append a deterministic footer:
`\nSources: ` + the retrieved cards' `sources[0].ref` joined by `; `. Import the
`KnowledgeCard` type from `./domain`. (Existing callers pass no cards → unchanged behavior.)

## Task 5 — `app/functions/src/retrieval.test.ts` (vitest)

Cover, without any network/Vertex call:
- `normalize` produces a unit vector; `dot` of a normalized vector with itself ≈ 1.
- `rankByVector`: construct a query vector equal to a known card's stored vector → that card
  ranks first with score ≈ 1; `minScore` filters low scores; `k` caps the count.
- `keywordRank`: a query like "how much protein on a cut" returns nutrition card ids
  (e.g. contains `protein-in-deficit-muscle-retention` or `cutting-deficit-rate`).
- Index integrity: `embeddingsJson.vectors` has exactly one entry per `KNOWLEDGE` id, every
  vector length === `embeddingsJson.dim`, and each is unit-normalized (norm ≈ 1 within 1e-3).
- `formatScienceBlock([])` === '' and a non-empty call includes `[S1]` and a `Source:` line.

## Constraints

- Create/modify ONLY: `app/functions/src/model.ts`, `app/functions/src/retrieval.ts` (new),
  `app/functions/src/index.ts` (coachChat only), `app/functions/src/mocks.ts`,
  `app/functions/src/retrieval.test.ts` (new).
- Do NOT modify other endpoints, the knowledge cards, `knowledge.json`,
  `knowledge-embeddings.json`, `knowledge.ts`, or `domain.ts`.
- Do NOT add npm dependencies. Do NOT call Vertex / run the embedding build. Do NOT deploy or
  commit.

## Verification (all must pass; Claude will additionally run a real-embedding check)

- `cd app/functions && npm run build` (tsc) passes with the new files/imports.
- `cd app/functions && npm test` passes, including `retrieval.test.ts`.
- `cd app && npm run build` and `npm run lint` pass.
- Confirm (grep) that `generateReport`, `generateWeeklySummary`, and `createWorkout` are
  unchanged.
