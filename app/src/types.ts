// Core domain types. Vocabulary matches docs/feature-spec.md.

export type MuscleGroup =
  | 'chest'
  | 'front delts'
  | 'side delts'
  | 'rear delts'
  | 'triceps'
  | 'biceps'
  | 'forearms'
  | 'lats'
  | 'upper back'
  | 'traps'
  | 'lower back'
  | 'quads'
  | 'hamstrings'
  | 'glutes'
  | 'calves'
  | 'abs'
  | 'obliques'
  | 'neck'
  | 'full body'
  | 'cardio'

export type Equipment =
  | 'barbell'
  | 'dumbbell'
  | 'machine'
  | 'cable'
  | 'bodyweight'
  | 'kettlebell'
  | 'ez bar'
  | 'smith machine'
  | 'band'
  | 'other'

export interface Exercise {
  id: string
  name: string
  primaryMuscles: MuscleGroup[]
  secondaryMuscles: MuscleGroup[]
  equipment: Equipment
  instructions: string[]
  /** Image URLs (first = cover). Empty for media-less custom exercises. */
  images: string[]
  isCustom?: boolean
}

/** One (weight × reps) pair inside a set. A normal set has exactly one. */
export interface Segment {
  weightKg: number
  reps: number
}

export type SetType = 'warmup' | 'working' | 'drop' | 'failure'

/** One performed set: 1..n segments (mid-set weight changes / drop sets). */
export interface WorkoutSet {
  id: string
  segments: Segment[]
  type: SetType
  rpe?: number
  note?: string
  completedAt?: number // epoch ms; unset while still a planned target
}

export interface WorkoutExercise {
  exerciseId: string
  /** Planned targets shown while logging; sets move to `sets` as they're done. */
  targetSets?: { weightKg: number | null; reps: number }[]
  restSeconds?: number
  sets: WorkoutSet[]
  note?: string
}

export type WorkoutStatus = 'in_progress' | 'completed'

export interface Workout {
  id: string
  status: WorkoutStatus
  startedAt: number // epoch ms
  completedAt?: number
  /** Cycle day label this workout was for (e.g. "Push"), if any. */
  cycleDay?: string
  /** Preset this session was started from, if any. */
  presetId?: string
  name?: string
  exercises: WorkoutExercise[]
  /** True when entered via bulk "add past workout" mode. */
  bulkEntered?: boolean
}

export interface PresetExercise {
  exerciseId: string
  /** Targets. weightKg null = "use last used weight". */
  sets: { weightKg: number | null; reps: number }[]
  restSeconds?: number
}

export interface Preset {
  id: string
  name: string
  /** Cycle day label this preset belongs to (e.g. "Push"), optional. */
  cycleDay?: string
  exercises: PresetExercise[]
  createdAt: number
  updatedAt: number
}

/** The user's repeating split, e.g. ["Push","Pull","Legs","Rest"]. */
export interface Cycle {
  days: string[] // day labels; "Rest" (case-insensitive) = rest day
  /** Index into `days` for "today". */
  pointer: number
  /** YYYY-MM-DD the pointer was last moved/confirmed, for missed-day detection. */
  pointerDate: string
}

export interface BodyweightEntry {
  date: string // YYYY-MM-DD
  weightKg: number
}

export interface Profile {
  goals: string
  heightCm?: number
  bodyweight: BodyweightEntry[]
  /** Persistent free-text notes the AI must always respect ("weak shoulders"). */
  tweaks: string[]
  unit: 'kg' | 'lb'
}

export const isRestDay = (label: string) => label.trim().toLowerCase() === 'rest'
