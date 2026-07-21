# Add Chest-Supported Row (Dumbbell) to the shared catalog

**Standing instructions:** Implement this plan exactly. Do not touch anything outside the project directory; if an out-of-project need is discovered mid-run, list it at the end of your response instead of doing it. Do not commit.

## Context

Add the chest-supported dumbbell row (done lying face-down on an incline bench) as a
first-class catalog exercise so it's searchable in the picker and known to the
backend. Follow the exact pattern used for the recently-added
`single-arm-lat-pulldown-cable` etc. — a hand-written entry in
`app/scripts/curate.mjs` (kept across regenerations), a regenerated
`app/src/data/exercises.ts`, and a matching entry in
`app/functions/src/catalog.json`.

## Changes

### 1. `app/scripts/curate.mjs`

In the "Hand-written entries with no good source in the db (kept across regenerations)"
block (the `exercises.push({ ... })` calls near the bottom, right after the existing
`reverse-curl-dumbbell` push), add ONE more `exercises.push({ ... })` entry with this
exact shape:

```js
exercises.push({
  id: 'chest-supported-row-dumbbell',
  name: 'Chest-Supported Row (Dumbbell)',
  primaryMuscles: ['upper back'],
  secondaryMuscles: ['lats', 'rear delts', 'biceps'],
  equipment: 'dumbbell',
  instructions: [
    'Set an incline bench to about 30–45 degrees and lie face-down with your chest against the pad, a dumbbell in each hand hanging straight down.',
    'Let your arms extend fully and your shoulder blades relax at the bottom. This is the starting position.',
    'Row the dumbbells up toward your hips, driving your elbows back and squeezing your shoulder blades together at the top.',
    'Lower the dumbbells under control to the fully stretched position without letting your chest come off the pad, and repeat.',
  ],
  images: [],
})
```

### 2. Regenerate `app/src/data/exercises.ts`

From `app/`, run `node scripts/curate.mjs`. It must complete without the `MISSING:`
error and print a written-exercise count 1 higher than before (was 89 → expect 90).
Confirm `chest-supported-row-dumbbell` appears in the regenerated
`app/src/data/exercises.ts`.

### 3. `app/functions/src/catalog.json`

Add the entry to this JSON array too, using the SAME id / name / primaryMuscles /
secondaryMuscles / equipment. This file's entries carry only those five fields (no
instructions/images) — match the shape of the existing entries exactly. Keep the file
valid JSON.

## Constraints

- Change ONLY `app/scripts/curate.mjs`, `app/src/data/exercises.ts` (via the script),
  and `app/functions/src/catalog.json`. Do not modify other files.
- Do NOT touch anything outside this project directory.
- Do NOT run `firebase deploy`, do NOT commit. Claude handles deploy + commit.

## Verification (run in `app/`)

- `node scripts/curate.mjs` runs clean, count +1 (→ 90).
- `npx tsc --noEmit -p tsconfig.app.json` passes.
- `npx vitest run` passes.
- `npm run build` passes.
- Grep confirms `chest-supported-row-dumbbell` exists in BOTH
  `src/data/exercises.ts` and `functions/src/catalog.json`.
