// Pure domain logic mirrored from the client engines (app/src/lib).
// Kept dependency-free so it is unit-testable and shared by mock + validation.

export interface Segment {
  weightKg: number
  reps: number
}
export type SetType = 'warmup' | 'working' | 'drop' | 'failure'
export interface WorkoutSet {
  id: string
  segments: Segment[]
  type: SetType
  rpe?: number
  completedAt?: number
}
export interface WorkoutExercise {
  exerciseId: string
  sets: WorkoutSet[]
}
export interface Workout {
  id: string
  status: 'in_progress' | 'completed'
  startedAt: number
  completedAt?: number
  cycleDay?: string
  name?: string
  exercises: WorkoutExercise[]
}
export interface CatalogEntry {
  id: string
  name: string
  primaryMuscles: string[]
  secondaryMuscles: string[]
  equipment: string
}
export interface Cycle {
  days: string[]
  pointer: number
  pointerDate: string
}
export interface Profile {
  goals?: string
  heightCm?: number
  bodyweight?: { date: string; weightKg: number }[]
  tweaks?: string[]
}
export interface Readiness {
  date: string
  sleep: number // 1-5
  energy: number // 1-5
  note?: string
}

export const MAX_REPS_FOR_RM = 12

export function epley1RM(weightKg: number, reps: number): number | null {
  if (weightKg <= 0 || reps <= 0 || reps > MAX_REPS_FOR_RM) return null
  if (reps === 1) return weightKg
  return weightKg * (1 + reps / 30)
}

/** Latest best-set e1RM per exercise across completed workouts (newest first). */
export function e1rmTable(workouts: Workout[]): Map<string, number> {
  const table = new Map<string, number>()
  for (const w of workouts) {
    if (w.status !== 'completed') continue
    for (const we of w.exercises) {
      if (table.has(we.exerciseId)) continue // newest-first input wins
      let best: number | null = null
      for (const set of we.sets) {
        if (set.type === 'warmup') continue
        for (const seg of set.segments) {
          const rm = epley1RM(seg.weightKg, seg.reps)
          if (rm !== null && (best === null || rm > best)) best = rm
        }
      }
      if (best !== null) table.set(we.exerciseId, best)
    }
  }
  return table
}

/** Inverse Epley, rounded to 0.25 kg. */
export function weightForReps(e1rm: number, reps: number, pct = 1): number {
  const target = (e1rm * pct) / (1 + reps / 30)
  return Math.round(target / 0.25) * 0.25
}

export function formatSet(set: WorkoutSet): string {
  return set.segments.map((s) => `${s.weightKg}×${s.reps}`).join('+')
}

/** Working-set counts per muscle group over a span of workouts. */
export function muscleSetCounts(
  workouts: Workout[],
  catalog: Map<string, CatalogEntry>,
): Map<string, number> {
  const counts = new Map<string, number>()
  for (const w of workouts) {
    if (w.status !== 'completed') continue
    for (const we of w.exercises) {
      const entry = catalog.get(we.exerciseId)
      if (!entry) continue
      const workingSets = we.sets.filter((s) => s.type !== 'warmup').length
      for (const m of entry.primaryMuscles) {
        counts.set(m, (counts.get(m) ?? 0) + workingSets)
      }
    }
  }
  return counts
}
