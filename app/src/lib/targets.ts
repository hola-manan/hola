import { isRestDay, type Cycle, type Exercise, type MuscleGroup, type Workout } from '../types'

/** Muscles each cycle-day label is expected to train (mirrors functions/src/creator.ts). */
export const DAY_MUSCLES: Record<string, MuscleGroup[]> = {
  push: ['chest', 'front delts', 'side delts', 'triceps'],
  pull: ['lats', 'upper back', 'rear delts', 'biceps', 'traps'],
  legs: ['quads', 'hamstrings', 'glutes', 'calves'],
  upper: ['chest', 'lats', 'upper back', 'front delts', 'side delts', 'biceps', 'triceps'],
  lower: ['quads', 'hamstrings', 'glutes', 'calves', 'abs'],
  'full body': ['chest', 'lats', 'quads', 'hamstrings', 'front delts', 'abs'],
  arms: ['biceps', 'triceps', 'forearms'],
  shoulders: ['front delts', 'side delts', 'rear delts'],
  chest: ['chest', 'triceps'],
  back: ['lats', 'upper back', 'traps', 'rear delts'],
}

export function musclesForDay(label: string): MuscleGroup[] {
  return DAY_MUSCLES[label.trim().toLowerCase()] ?? DAY_MUSCLES['full body']
}

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

/** Dose-response efficiency of x weekly sets vs optimal range [lo, hi]:
 *  concave rise (diminishing returns) → 100% plateau in range → junk-volume decline. */
export function efficiencyPct(x: number, lo: number, hi: number): number {
  if (x <= 0) return 0
  if (x < lo) return Math.round(100 * (1 - ((lo - x) / lo) ** 2))
  if (x <= hi) return 100
  return Math.round(Math.max(40, 100 - (60 * (x - hi)) / hi))
}

/** Working-set counts per primary muscle over completed workouts since `sinceMs`. */
export function weeklySetCounts(
  workouts: Workout[],
  exercises: Map<string, Exercise>,
  sinceMs: number,
): Map<MuscleGroup, number> {
  const counts = new Map<MuscleGroup, number>()
  for (const w of workouts) {
    if (w.status !== 'completed' || w.startedAt < sinceMs) continue
    for (const we of w.exercises) {
      const ex = exercises.get(we.exerciseId)
      if (!ex) continue
      const working = we.sets.filter((s) => s.type !== 'warmup').length
      for (const m of ex.primaryMuscles) {
        counts.set(m, (counts.get(m) ?? 0) + working)
      }
    }
  }
  return counts
}

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

/** Coarse display groups used by Home's volume bars (mock shows Back/Chest/…). */
const DISPLAY_GROUPS: [string, MuscleGroup[]][] = [
  ['Back', ['lats', 'upper back', 'traps', 'lower back']],
  ['Chest', ['chest']],
  ['Shoulders', ['front delts', 'side delts', 'rear delts']],
  ['Arms', ['biceps', 'triceps', 'forearms']],
  ['Legs', ['quads', 'hamstrings', 'glutes', 'calves']],
  ['Core', ['abs', 'obliques']],
]

/** volumeVsTargets aggregated into the design's coarse groups. */
export function groupedVolumeRows(
  cycle: Cycle,
  workouts: Workout[],
  exercises: Map<string, Exercise>,
  sinceMs: number,
): GroupVolumeRow[] {
  const trainedMuscles = new Set<MuscleGroup>()
  for (const day of cycle.days) {
    if (isRestDay(day)) continue
    for (const m of musclesForDay(day)) {
      trainedMuscles.add(m)
    }
  }

  const counts = weeklySetCounts(workouts, exercises, sinceMs)
  const out: GroupVolumeRow[] = []

  for (const [label, members] of DISPLAY_GROUPS) {
    const children: MuscleVolumeRow[] = []
    for (const m of members) {
      if (trainedMuscles.has(m)) {
        const range = MUSCLE_RANGES[m]
        if (range) {
          const [lo, hi] = range
          const done = counts.get(m) ?? 0
          const pct = efficiencyPct(done, lo, hi)
          children.push({
            muscle: m,
            done,
            lo,
            hi,
            pct,
            behind: done < lo,
            over: done > hi,
          })
        }
      }
    }
    if (children.length === 0) continue

    const groupDone = children.reduce((sum, c) => sum + c.done, 0)
    const groupLo = children.reduce((sum, c) => sum + c.lo, 0)
    const groupHi = children.reduce((sum, c) => sum + c.hi, 0)
    
    const groupMid = children.reduce((sum, c) => sum + (c.lo + c.hi) / 2, 0)
    const groupPct = groupMid > 0 
      ? Math.round(children.reduce((sum, c) => sum + c.pct * ((c.lo + c.hi) / 2), 0) / groupMid) 
      : 0

    out.push({
      label,
      done: groupDone,
      lo: groupLo,
      hi: groupHi,
      pct: groupPct,
      behind: groupDone < groupLo,
      over: groupDone > groupHi,
      muscles: children,
    })
  }
  return out
}

/** Compact cycle name like "PPL·UL": initials of day blocks split by rest days. */
export function cycleShortName(cycle: Cycle): string {
  const blocks: string[] = []
  let current = ''
  for (const d of cycle.days) {
    if (isRestDay(d)) {
      if (current) blocks.push(current)
      current = ''
    } else {
      current += d.trim()[0]?.toUpperCase() ?? ''
    }
  }
  if (current) blocks.push(current)
  return blocks.join('·')
}

/** Start of the current Monday-based training week, ms. */
export function weekStartMs(now = new Date()): number {
  const d = new Date(now)
  d.setHours(0, 0, 0, 0)
  const day = (d.getDay() + 6) % 7 // Mon=0
  d.setDate(d.getDate() - day)
  return d.getTime()
}
