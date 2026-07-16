import type { Workout, WorkoutSet } from '../types'

/**
 * Epley estimated 1RM. Reliable in the 1-10 rep range; sets with more than
 * MAX_REPS_FOR_RM reps return null (they still count for volume).
 */
export const MAX_REPS_FOR_RM = 12

export function epley1RM(weightKg: number, reps: number): number | null {
  if (weightKg <= 0 || reps <= 0 || reps > MAX_REPS_FOR_RM) return null
  if (reps === 1) return weightKg
  return weightKg * (1 + reps / 30)
}

/** Best e1RM across a set's segments (each segment estimated independently). */
export function setE1RM(set: WorkoutSet): number | null {
  if (set.type === 'warmup') return null
  let best: number | null = null
  for (const seg of set.segments) {
    const rm = epley1RM(seg.weightKg, seg.reps)
    if (rm !== null && (best === null || rm > best)) best = rm
  }
  return best
}

export interface RmPoint {
  date: number // epoch ms (workout start)
  e1rm: number
  /** Weight of the heaviest working segment that day. */
  bestWeightKg: number
  /** Tonnage for this exercise that day (all non-warmup segments). */
  volumeKg: number
  /** True if an actual 1-rep set was performed (real max, not estimate). */
  actualSingle: boolean
}

/** One point per completed workout containing the exercise: best-set e1RM. */
export function rmSeries(workouts: Workout[], exerciseId: string): RmPoint[] {
  const points: RmPoint[] = []
  for (const w of workouts) {
    if (w.status !== 'completed') continue
    let e1rm: number | null = null
    let bestWeight = 0
    let volume = 0
    let actualSingle = false
    for (const we of w.exercises) {
      if (we.exerciseId !== exerciseId) continue
      for (const set of we.sets) {
        const rm = setE1RM(set)
        if (rm !== null && (e1rm === null || rm > e1rm)) e1rm = rm
        if (set.type === 'warmup') continue
        for (const seg of set.segments) {
          volume += seg.weightKg * seg.reps
          if (seg.weightKg > bestWeight) bestWeight = seg.weightKg
          if (seg.reps === 1) actualSingle = true
        }
      }
    }
    if (e1rm !== null) {
      points.push({ date: w.startedAt, e1rm, bestWeightKg: bestWeight, volumeKg: volume, actualSingle })
    }
  }
  return points.sort((a, b) => a.date - b.date)
}

/** Latest e1RM for an exercise, used for "what X reps should feel like". */
export function currentE1RM(workouts: Workout[], exerciseId: string): number | null {
  const series = rmSeries(workouts, exerciseId)
  return series.length ? series[series.length - 1].e1rm : null
}

/** Inverse Epley: weight that makes `reps` reps land at `pct` of e1RM. */
export function weightForReps(e1rm: number, reps: number, pct = 1): number {
  const target = (e1rm * pct) / (1 + reps / 30)
  return Math.round(target / 0.25) * 0.25
}

/** Latest session e1RM vs the previous session's, as a % change. */
export function e1rmDelta(
  workouts: Workout[],
  exerciseId: string,
): { current: number; deltaPct: number | null } | null {
  const series = rmSeries(workouts, exerciseId)
  if (!series.length) return null
  const current = series[series.length - 1].e1rm
  if (series.length < 2) return { current, deltaPct: null }
  const prev = series[series.length - 2].e1rm
  return { current, deltaPct: ((current - prev) / prev) * 100 }
}
