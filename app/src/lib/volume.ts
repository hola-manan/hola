import type { Workout, WorkoutSet } from '../types'

/** Tonnage of one set: sum of weight × reps over all segments. Warm-ups = 0 by default. */
export function setVolume(set: WorkoutSet, includeWarmups = false): number {
  if (set.type === 'warmup' && !includeWarmups) return 0
  return set.segments.reduce((sum, s) => sum + s.weightKg * s.reps, 0)
}

export function workoutVolume(workout: Workout, includeWarmups = false): number {
  return workout.exercises.reduce(
    (sum, we) => sum + we.sets.reduce((s, set) => s + setVolume(set, includeWarmups), 0),
    0,
  )
}

/** Working (non-warmup) set count. A multi-segment set counts as ONE set. */
export function workingSetCount(workout: Workout): number {
  return workout.exercises.reduce(
    (sum, we) => sum + we.sets.filter((s) => s.type !== 'warmup').length,
    0,
  )
}

export function totalReps(set: WorkoutSet): number {
  return set.segments.reduce((sum, s) => sum + s.reps, 0)
}

/** Compact display like "30×8 + 22.5×4". */
export function formatSet(set: WorkoutSet, unit: 'kg' | 'lb' = 'kg'): string {
  return set.segments.map((s) => `${formatWeight(s.weightKg, unit)}×${s.reps}`).join(' + ')
}

export const KG_PER_LB = 0.45359237

export function formatWeight(weightKg: number, unit: 'kg' | 'lb' = 'kg'): string {
  const v = unit === 'kg' ? weightKg : weightKg / KG_PER_LB
  const rounded = Math.round(v * 100) / 100
  return `${rounded}`
}
