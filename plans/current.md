# Add 3 missing exercises to the shared catalog

**Standing instructions:** Implement this plan exactly. Do not touch anything outside the project directory; if an out-of-project need is discovered mid-run, list it at the end of your response instead of doing it. Do not commit.

## Context

Three movements the user trains have no catalog entry, so they could only be logged
as unmapped custom exercises. Promote them to the shared catalog so they are
first-class (searchable in the picker, known to the backend AI context). Follow the
exact pattern already used for `bulgarian-split-squat-bodyweight` — a hand-written
entry in `app/scripts/curate.mjs` that is kept across regenerations, plus a matching
entry in `app/functions/src/catalog.json`.

## Changes

### 1. `app/scripts/curate.mjs`

In the "Hand-written entries with no good source in the db (kept across regenerations)"
block (the `exercises.push({ ... })` calls near the bottom, right after the existing
`bulgarian-split-squat-bodyweight` push), add THREE more `exercises.push({ ... })`
entries with this exact shape (id, name, primaryMuscles, secondaryMuscles, equipment,
instructions, images). Use valid `MuscleGroup` string values and `images: []`:

```js
exercises.push({
  id: 'single-arm-lat-pulldown-cable',
  name: 'Lat Pulldown (Single Arm)',
  primaryMuscles: ['lats'],
  secondaryMuscles: ['biceps', 'upper back', 'front delts'],
  equipment: 'cable',
  instructions: [
    'Attach a single handle to the high pulley of a lat pulldown or cable station and sit or kneel facing it.',
    'Grip the handle with one hand, arm fully extended overhead, and brace your core.',
    'Pull the handle down toward the side of your chest, driving your elbow down and back and squeezing the lat.',
    'Control the handle back to the fully stretched overhead position. Complete all reps, then switch arms.',
  ],
  images: [],
})

exercises.push({
  id: 'iso-lateral-chest-press-machine',
  name: 'Iso-Lateral Chest Press (Machine)',
  primaryMuscles: ['chest'],
  secondaryMuscles: ['front delts', 'triceps'],
  equipment: 'machine',
  instructions: [
    'Sit in the iso-lateral chest press machine with your back flat against the pad and grip the handles at chest level.',
    'Press the handles forward until your arms are nearly straight, keeping your shoulders down.',
    'Squeeze your chest at the top, then control the handles back to the starting position without letting the weight rest.',
  ],
  images: [],
})

exercises.push({
  id: 'reverse-curl-dumbbell',
  name: 'Reverse Curl (Dumbbell)',
  primaryMuscles: ['forearms'],
  secondaryMuscles: ['biceps'],
  equipment: 'dumbbell',
  instructions: [
    'Stand holding a dumbbell in each hand with a pronated (palms-down) grip, arms hanging at your sides.',
    'Keeping your upper arms pinned to your sides, curl the dumbbells up by flexing at the elbow.',
    'Squeeze the forearms and brachialis at the top, then lower under control to the start.',
  ],
  images: [],
})
```

### 2. Regenerate `app/src/data/exercises.ts`

From `app/`, run `node scripts/curate.mjs`. It must complete without the `MISSING:`
error and print a written-exercise count 3 higher than before. Confirm the three new
ids appear in the regenerated `app/src/data/exercises.ts`.

### 3. `app/functions/src/catalog.json`

Add the three entries to this JSON array as well, using the SAME id / name /
primaryMuscles / secondaryMuscles / equipment as above. This file's entries carry
only those five fields (no instructions/images) — match the shape of the existing
entries in the file exactly. Keep the file valid JSON.

## Constraints

- Change ONLY `app/scripts/curate.mjs`, `app/src/data/exercises.ts` (via the script),
  and `app/functions/src/catalog.json`. Do not modify other files.
- Do NOT touch anything outside this project directory.
- Do NOT run `firebase deploy`, do NOT commit. Claude handles deploy + commit.

## Verification (run in `app/`)

- `node scripts/curate.mjs` runs clean, count +3.
- `npx tsc --noEmit -p tsconfig.app.json` passes.
- `npx vitest run` passes.
- `npm run build` passes.
- Grep confirms all three ids exist in BOTH `src/data/exercises.ts` and
  `functions/src/catalog.json`.
