# Hola Gym — personal gym tracking & insights

Mobile-first PWA implementing phases 1–3 of [`docs/feature-spec.md`](../docs/feature-spec.md):
logging (live + bulk), exercise library, presets, cycle tracker, and estimated-1RM progress
graphs. Firebase (Firestore + Auth) backend; AI phases (Vertex AI Gemini 2.5 Flash) come next.

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

## Deploy (real Firebase project)

1. Create a Firebase project, enable Firestore + Google auth, register a web app.
2. Put its config in `.env.local`:
   `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`,
   `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_APP_ID`
3. Point `.firebaserc` at the project, then:
   `npm run build && npx firebase deploy --only hosting,firestore:rules`

## Layout

- `src/lib/` — pure engines: `rm.ts` (Epley e1RM), `parse.ts` (bulk-entry text), `cycle.ts`
  (split tracking, shift/skip), `volume.ts` (counting rules), plus Firebase/repo wiring
- `src/screens/` — one file per screen; `src/components/` — shared UI (picker, rest timer, chart)
- `src/data/exercises.ts` — curated 83-exercise catalog seeded from
  [free-exercise-db](https://github.com/yuhonas/free-exercise-db) (public domain);
  regenerate via `scripts/curate.mjs`
- `firestore.rules` — each user can only touch `users/{uid}/**`

## Domain vocabulary

A **set** is 1..n **segments** (`weight × reps` pairs) — a mid-set weight change like
`8×30kg + 4×22.5kg` is one set with two segments, which also models drop sets. Multi-segment
sets count once toward set counts; tonnage sums all segments; warm-ups are excluded from
stats and RM. Estimated 1RM uses Epley (`weight × (1 + reps/30)`), skipping sets above 12 reps.
