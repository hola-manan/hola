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

const SETS_PER_MUSCLE_PER_DAY = 4

/**
 * Weekly working-set target per muscle, derived from the cycle: each training
 * day contributes ~4 sets to every primary muscle it hits, scaled to a 7-day
 * week when the cycle is shorter/longer.
 */
export function weeklyTargets(cycle: Cycle): Map<MuscleGroup, number> {
  const targets = new Map<MuscleGroup, number>()
  const scale = 7 / cycle.days.length
  for (const day of cycle.days) {
    if (isRestDay(day)) continue
    for (const m of musclesForDay(day)) {
      targets.set(m, (targets.get(m) ?? 0) + SETS_PER_MUSCLE_PER_DAY * scale)
    }
  }
  for (const [m, v] of targets) targets.set(m, Math.round(v))
  return targets
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

export interface VolumeVsTarget {
  muscle: MuscleGroup
  done: number
  target: number
  pct: number
  behind: boolean
}

/** Rows for the "volume vs cycle target" bars, ordered by design (worst last-ish kept stable). */
export function volumeVsTargets(
  cycle: Cycle,
  workouts: Workout[],
  exercises: Map<string, Exercise>,
  sinceMs: number,
): VolumeVsTarget[] {
  const targets = weeklyTargets(cycle)
  const counts = weeklySetCounts(workouts, exercises, sinceMs)
  const rows: VolumeVsTarget[] = []
  for (const [muscle, target] of targets) {
    if (target <= 0) continue
    const done = counts.get(muscle) ?? 0
    const pct = Math.round((done / target) * 100)
    rows.push({ muscle, done, target, pct, behind: pct < 75 })
  }
  return rows.sort((a, b) => b.target - a.target)
}

/** Start of the current Monday-based training week, ms. */
export function weekStartMs(now = new Date()): number {
  const d = new Date(now)
  d.setHours(0, 0, 0, 0)
  const day = (d.getDay() + 6) % 7 // Mon=0
  d.setDate(d.getDate() - day)
  return d.getTime()
}
