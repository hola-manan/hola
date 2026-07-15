# Hola Gym — personal gym tracking & insights

Mobile-first PWA implementing [`docs/feature-spec.md`](../docs/feature-spec.md):
logging (live + bulk), exercise library, presets, cycle tracker, estimated-1RM progress
graphs, and the AI layer — post-workout coach reports, weekly summaries, grounded chat,
and an AI workout creator, all powered by **Gemini 2.5 Flash via Vertex AI** from Cloud
Functions (`functions/`). In the emulators the AI endpoints use a deterministic mock
(no GCP credentials needed); the daily readiness check-in stands in for wearable data.

## Stack

- React 19 + TypeScript + Vite, Tailwind v4, `vite-plugin-pwa` (installable, offline shell)
- Firestore with persistent local cache — sets logged with no reception sync when back online
- Firebase Auth (Google sign-in; anonymous dev sign-in on emulators)

## Develop

```bash
npm install
npm run emulators   # terminal 1: Firestore + Auth emulators (needs Java)
npm run dev         # terminal 2: app at http://localhost:5173
```

With no `VITE_FIREBASE_*` env vars set, the app automatically targets the local emulators with
a demo project — use the "Dev sign-in (emulator)" button.

```bash
npm test            # engine unit tests (RM, parser, cycle, counting rules)
npm run e2e         # Playwright smoke test against dev server + emulators
npm run build       # type-check + production build (dist/)
```

## Go live (real Firebase/GCP project) — one-time checklist

1. Create a Firebase project (this also creates the GCP project). Upgrade it to the
   Blaze plan (required for Cloud Functions + Vertex AI; personal usage stays in/near
   the free tier apart from Gemini calls).
2. In the Firebase console: enable **Firestore**, **Authentication → Google** sign-in,
   and register a **web app**.
3. In the GCP console for the same project: enable the **Vertex AI API**.
4. Put the web app config in `app/.env.local`:
   `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`,
   `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_APP_ID`
5. Point `.firebaserc` at the project id, sign in with `npx firebase login`, then:
   `npm run build && npx firebase deploy` (hosting + rules + functions).
6. Open the hosted URL on your phone → share sheet → **Add to Home Screen**.

Functions env knobs: `GEMINI_MODEL` (default `gemini-2.5-flash`), `GEMINI_LOCATION`
(default `global`), `MOCK_LLM=1` to force the mock even in production.

## Layout

- `src/lib/` — pure engines: `rm.ts` (Epley e1RM), `parse.ts` (bulk-entry text), `cycle.ts`
  (split tracking, shift/skip), `volume.ts` (counting rules), plus Firebase/repo wiring and
  `ai.ts` (callable wrappers)
- `src/screens/` — one file per screen; `src/components/` — shared UI (picker, rest timer, chart)
- `functions/` — Cloud Functions AI backend: `context.ts` (grounding context: profile, cycle,
  readiness, detailed recent + summarized older history, e1RM table), `creator.ts` (draft
  validation with hallucination caps + rule-based generator that doubles as the emulator mock
  and outage fallback), `model.ts` (Vertex AI Gemini 2.5 Flash wrapper), `mocks.ts`
  (deterministic grounded mock coach). `npm test` inside `functions/` covers the pure logic.
- `src/data/exercises.ts` — curated 83-exercise catalog seeded from
  [free-exercise-db](https://github.com/yuhonas/free-exercise-db) (public domain);
  regenerate via `scripts/curate.mjs`
- `firestore.rules` — each user can only touch `users/{uid}/**`

## Domain vocabulary

A **set** is 1..n **segments** (`weight × reps` pairs) — a mid-set weight change like
`8×30kg + 4×22.5kg` is one set with two segments, which also models drop sets. Multi-segment
sets count once toward set counts; tonnage sums all segments; warm-ups are excluded from
stats and RM. Estimated 1RM uses Epley (`weight × (1 + reps/30)`), skipping sets above 12 reps.
