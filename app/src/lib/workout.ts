import type { Preset, Workout, WorkoutExercise, WorkoutSet } from '../types'

export const uuid = () => crypto.randomUUID()

/** Most recent completed workout containing the exercise, newest-first input. */
export function lastSession(
  workouts: Workout[],
  exerciseId: string,
): { workout: Workout; sets: WorkoutSet[] } | null {
  for (const w of workouts) {
    if (w.status !== 'completed') continue
    const we = w.exercises.find((e) => e.exerciseId === exerciseId)
    if (we && we.sets.length) return { workout: w, sets: we.sets }
  }
  return null
}

/** Heaviest working-segment weight from the most recent session of this exercise. */
export function lastUsedWeight(workouts: Workout[], exerciseId: string): number | null {
  const last = lastSession(workouts, exerciseId)
  if (!last) return null
  let best: number | null = null
  for (const set of last.sets) {
    if (set.type === 'warmup') continue
    for (const seg of set.segments) {
      if (best === null || seg.weightKg > best) best = seg.weightKg
    }
  }
  return best
}

export function emptyWorkout(cycleDay?: string): Workout {
  return {
    id: uuid(),
    status: 'in_progress',
    startedAt: Date.now(),
    ...(cycleDay ? { cycleDay } : {}),
    exercises: [],
  }
}

/** Copy a preset into a session; null target weights resolve to "last used". */
export function workoutFromPreset(preset: Preset, history: Workout[]): Workout {
  const exercises: WorkoutExercise[] = preset.exercises.map((pe) => ({
    exerciseId: pe.exerciseId,
    targetSets: pe.sets.map((s) => ({
      weightKg: s.weightKg ?? lastUsedWeight(history, pe.exerciseId),
      reps: s.reps,
    })),
    ...(pe.restSeconds ? { restSeconds: pe.restSeconds } : {}),
    sets: [],
  }))
  return {
    ...emptyWorkout(preset.cycleDay),
    presetId: preset.id,
    name: preset.name,
    exercises,
  }
}

/** Convert a (possibly edited) session back into preset targets. */
export function presetFromWorkout(workout: Workout, name: string, existing?: Preset): Preset {
  const now = Date.now()
  return {
    id: existing?.id ?? uuid(),
    name,
    ...(workout.cycleDay ? { cycleDay: workout.cycleDay } : {}),
    exercises: workout.exercises.map((we) => ({
      exerciseId: we.exerciseId,
      sets: we.sets.length
        ? we.sets
            .filter((s) => s.type !== 'warmup')
            .map((s) => ({ weightKg: s.segments[0].weightKg, reps: s.segments[0].reps }))
        : (we.targetSets ?? []).map((t) => ({ weightKg: t.weightKg, reps: t.reps })),
      ...(we.restSeconds ? { restSeconds: we.restSeconds } : {}),
    })),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  }
}
