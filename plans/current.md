# Science-based weekly volume ranges + efficiency % + expandable per-muscle breakdown

**Standing instructions:** Implement this plan exactly. Do not touch anything outside the project directory; if an out-of-project need is discovered mid-run, list it at the end of your response instead of doing it. Do not commit.

## Context

The Home and Summary screens show "volume vs cycle target" bars per muscle group. Today the target is a flat `4 sets × training-days` heuristic (`SETS_PER_MUSCLE_PER_DAY` in `app/src/lib/targets.ts`) and the % is linear `done/target`. This change:

1. Replaces it with **evidence-based weekly set ranges** per muscle (hypertrophy dose-response literature: Schoenfeld meta-analyses, 2024/25 meta-regressions, RP MEV/MAV landmarks) — ranges like 14–22, not single numbers.
2. Replaces the linear % with an **efficiency-curve percentage**: y = training efficiency, x = weekly sets — concave rise below the range (diminishing returns), 100% plateau inside it, decline past it (junk volume). Raw numbers (done / range) are shown alongside the %.
3. Home keeps the coarse group rows (Back, Chest, …) but **each expands on tap** to a per-muscle breakdown (e.g. Back → lats, upper back, traps, lower back), each with its own range/bar/%, so under-trained muscles are visible.
4. The **AI coach also sees it**: a current-week per-muscle "sets vs optimal range" section is added to the AI context builder in functions.

Facts (already verified):
- Every catalog exercise has exactly one primary muscle (`app/src/data/exercises.ts`) — per-muscle counts sum into groups with no double counting.
- Rows are consumed only by `Home.tsx` and `Summary.tsx` via `groupedVolumeRows`; tests in `targets.test.ts`.
- Functions mirror frontend logic by copy (e.g. `readinessRule.ts` in both places).

## Changes

### 1. `app/src/lib/targets.ts` — new target model

Remove `SETS_PER_MUSCLE_PER_DAY`, `weeklyTargets`, `volumeVsTargets` (+ `VolumeVsTarget`). Keep `DAY_MUSCLES`, `musclesForDay`, `weeklySetCounts`, `cycleShortName`, `weekStartMs` unchanged.

**Per-muscle weekly ranges** (direct working sets — sets credit their single primary muscle, matching how the app counts; tunable constants):

```ts
/** Optimal weekly working-set range per muscle (direct sets, primary-muscle counting).
 *  Basis: Schoenfeld dose-response meta-analyses (~10–20 productive zone per group),
 *  2024/25 meta-regressions (diminishing returns past MAV), RP volume landmarks. */
export const MUSCLE_RANGES: Partial<Record<MuscleGroup, [lo: number, hi: number]>> = {
  chest: [12, 20],
  'front delts': [2, 6],   // heavy indirect volume from pressing
  'side delts': [8, 12],
  'rear delts': [4, 8],
  biceps: [8, 14],
  triceps: [8, 12],
  forearms: [2, 6],
  lats: [8, 12],
  'upper back': [6, 10],
  traps: [2, 6],
  'lower back': [2, 6],
  quads: [8, 14],
  hamstrings: [6, 12],
  glutes: [2, 6],          // mostly covered by squats/hinges
  calves: [4, 8],
  abs: [6, 12],
  obliques: [2, 6],
}
```

**Efficiency curve** (exported, unit-tested):

```ts
/** Dose-response efficiency of x weekly sets vs optimal range [lo, hi]:
 *  concave rise (diminishing returns) → 100% plateau in range → junk-volume decline. */
export function efficiencyPct(x: number, lo: number, hi: number): number {
  if (x <= 0) return 0
  if (x < lo) return Math.round(100 * (1 - ((lo - x) / lo) ** 2))
  if (x <= hi) return 100
  return Math.round(Math.max(40, 100 - (60 * (x - hi)) / hi))
}
```

**Row shapes.** Replace the old interfaces with:

```ts
export interface MuscleVolumeRow {
  muscle: MuscleGroup
  done: number
  lo: number
  hi: number
  pct: number      // efficiencyPct(done, lo, hi)
  behind: boolean  // done < lo
  over: boolean    // done > hi
}
export interface GroupVolumeRow {
  label: string    // 'Back' | 'Chest' | ...
  done: number     // sum of children done
  lo: number       // sum of children lo
  hi: number       // sum of children hi
  pct: number
  behind: boolean
  over: boolean
  muscles: MuscleVolumeRow[]  // the expandable breakdown
}
```

Rework `groupedVolumeRows(cycle, workouts, exercises, sinceMs)`:
- Trained-muscle set = union of `musclesForDay(day)` over the cycle's non-rest days.
- For each `DISPLAY_GROUPS` entry, children = member muscles that are in the trained set **and** have a `MUSCLE_RANGES` entry; skip the group if no children.
- Child `done` from `weeklySetCounts`; child pct/behind/over from `efficiencyPct` and its own [lo,hi]. Group lo/hi/done = sums over children; group pct/flags computed from the summed values.

### 2. `app/src/screens/Home.tsx` — numbers + %, expandable rows

Section header → `THIS WEEK · SETS VS OPTIMAL RANGE`. Convert the volume block (currently lines ~274–310) into a small local component with `useState<Set<string>>` for expanded groups; the group row becomes a `<button>` (tap toggles; keep it unstyled/dark like the rest — no default button chrome).

- Group row: label (+ small `▸/▾` chevron) | bar (fill = `min(100, r.pct)%`) | `` `${done}/${lo}–${hi}` `` | `` `${pct}%` `` — mono font, right column widened (~56px + 34px), same 1a design sizes/colors.
- Color: amber `#e8b44c` when `behind || over`, else teal `#57c4cc`; label color follows.
- Expanded: children render beneath, indented (~10px), slightly smaller (fontSize 10, bar height 4), same bar/number/% layout per muscle.

### 3. `app/src/screens/Summary.tsx` — same numbers, group level only

In the volume card (lines ~121–149): header → `SETS/WK VS OPTIMAL RANGE`; text `{r.done}/{r.lo}–{r.hi}` plus `{r.pct}%` (widen right span); bar fill = `min(100, r.pct)`; **remove** the `* 0.85` hack and the fixed 85% tick; footnote → `optimal weekly range from research · warm-ups excluded`. `flagged` (headline "On target, except X") = rows where `behind || over`.

### 4. Coach context — `app/functions/src/context.ts` (+ mirror of ranges)

Mirror `MUSCLE_RANGES` and `efficiencyPct` into a new `app/functions/src/volumeTargets.ts` (following the `readinessRule.ts` mirroring convention — functions cannot import app src), plus a Mon-based `weekStartMs` helper. Add a section to `buildContext` between STRENGTH and HISTORY:

```
=== THIS WEEK'S VOLUME VS OPTIMAL (working sets per muscle, Mon-based week) ===
lats: 4 sets (optimal 8–12) — UNDER
chest: 14 sets (optimal 12–20) — in range
side delts: 0 sets (optimal 8–12) — UNTRAINED
```

Implemented as `describeWeeklyVolume(workouts, catalog)`: filter completed workouts started since Monday 00:00, count non-warmup sets per primary muscle (reuse `muscleSetCounts` from `domain.ts` if it fits, else equivalent), and list every muscle in `MUSCLE_RANGES` that is either trained this week or below `lo`, tagged `UNDER` / `in range` / `OVER` / `UNTRAINED`. This lets the coach call out weak/less-trained muscles.

### 5. Tests

- `app/src/lib/targets.test.ts`: drop `weeklyTargets`/`volumeVsTargets` tests; add `efficiencyPct` curve pins (`0→0`; concave rise, e.g. `efficiencyPct(4,8,12)=75`; in-range→100; decline past hi; floor 40); `groupedVolumeRows` tests — a PPL cycle yields expected groups with children, correct sums, behind/over flags.
- Functions: add a small test for `describeWeeklyVolume` / mirrored `efficiencyPct` alongside the existing `functions/src/*.test.ts`.

## Verification (run these before finishing)

1. `cd app && npm test` — green.
2. `cd app/functions && npm test` — green.
3. `cd app && npm run build` — typechecks.
