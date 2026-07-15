// AI workout creator: draft shape, validation of model output, and a
// deterministic rule-based generator (used as the emulator mock and as a
// sanity fallback if the model returns garbage).

import { e1rmTable, type CatalogEntry, type Workout } from './domain'
import { CATALOG, CATALOG_BY_ID, type UserData } from './context'

export interface DraftSet {
  weightKg: number
  reps: number
}
export interface DraftExercise {
  exerciseId: string
  rationale: string
  restSeconds: number
  sets: DraftSet[]
}
export interface WorkoutDraft {
  name: string
  cycleDay?: string
  exercises: DraftExercise[]
}

/** Muscles each cycle-day label is expected to train. */
export const DAY_MUSCLES: Record<string, string[]> = {
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

export function musclesForDay(label: string): string[] {
  return DAY_MUSCLES[label.trim().toLowerCase()] ?? DAY_MUSCLES['full body']
}

const COMPOUND_EQUIPMENT = new Set(['barbell', 'machine'])
const isCompoundish = (e: CatalogEntry) =>
  e.secondaryMuscles.length >= 1 && (COMPOUND_EQUIPMENT.has(e.equipment) || e.equipment === 'bodyweight')

/**
 * Validate and repair a draft coming from the model. Throws when nothing
 * usable survives. Returns a cleaned draft.
 */
export function validateDraft(raw: unknown, history: Workout[]): WorkoutDraft {
  if (typeof raw !== 'object' || raw === null) throw new Error('draft is not an object')
  const d = raw as Record<string, unknown>
  const rms = e1rmTable(history)
  const exercisesIn = Array.isArray(d.exercises) ? d.exercises : []
  const exercises: DraftExercise[] = []
  for (const item of exercisesIn) {
    if (typeof item !== 'object' || item === null) continue
    const e = item as Record<string, unknown>
    const id = String(e.exerciseId ?? '')
    if (!CATALOG_BY_ID.has(id)) continue // unknown exercise: drop
    const setsIn = Array.isArray(e.sets) ? e.sets : []
    const sets: DraftSet[] = []
    for (const s of setsIn) {
      if (typeof s !== 'object' || s === null) continue
      const reps = Math.round(Number((s as Record<string, unknown>).reps))
      let weightKg = Number((s as Record<string, unknown>).weightKg)
      if (!Number.isFinite(reps) || reps < 1 || reps > 30) continue
      if (!Number.isFinite(weightKg) || weightKg < 0) weightKg = 0
      weightKg = Math.round(weightKg / 0.25) * 0.25
      // Guard against hallucinated loads: cap at 115% of known e1RM.
      const rm = rms.get(id)
      if (rm && weightKg > rm * 1.15) weightKg = Math.floor((rm * 1.15) / 0.25) * 0.25
      sets.push({ weightKg, reps })
    }
    if (!sets.length) continue
    const restSeconds = Math.min(360, Math.max(30, Math.round(Number(e.restSeconds) || 120)))
    exercises.push({
      exerciseId: id,
      rationale: String(e.rationale ?? '').slice(0, 200),
      restSeconds,
      sets: sets.slice(0, 8),
    })
  }
  if (!exercises.length) throw new Error('draft contained no valid exercises')
  return {
    name: String(d.name ?? 'AI workout').slice(0, 60),
    ...(d.cycleDay ? { cycleDay: String(d.cycleDay).slice(0, 30) } : {}),
    exercises: exercises.slice(0, 10),
  }
}

/**
 * Deterministic generator: picks exercises for today's muscles, prefers ones
 * with strength history, prescribes weights from e1RM (compounds ~72%×6-8,
 * isolation ~65%×10-12), respects "avoid" words found in tweaks.
 */
export function generateDraft(data: UserData, instruction = ''): WorkoutDraft {
  const dayLabel = data.cycle
    ? data.cycle.days[data.cycle.pointer % data.cycle.days.length]
    : 'Full Body'
  const muscles = musclesForDay(dayLabel)
  const rms = e1rmTable(data.workouts)
  const avoid = (data.profile?.tweaks ?? [])
    .concat(instruction)
    .join(' ')
    .toLowerCase()

  const lowIntensity =
    data.readiness !== null && data.readiness.sleep + data.readiness.energy <= 4
  const pctScale = lowIntensity ? 0.88 : 1

  const candidates = CATALOG.filter(
    (e) =>
      e.primaryMuscles.some((m) => muscles.includes(m)) &&
      !(avoid.includes('no barbell') && e.equipment === 'barbell') &&
      !(avoid.includes('no machine') && e.equipment === 'machine'),
  )

  const picked: CatalogEntry[] = []
  const coveredMuscles = new Set<string>()
  const score = (e: CatalogEntry) =>
    (rms.has(e.id) ? 2 : 0) + // has history → progressive overload possible
    (isCompoundish(e) ? 1 : 0) +
    (e.primaryMuscles.some((m) => !coveredMuscles.has(m)) ? 4 : 0)

  while (picked.length < 6) {
    const remaining = candidates
      .filter((c) => !picked.includes(c))
      .sort((a, b) => score(b) - score(a))
    const next = remaining[0]
    if (!next || (picked.length >= 4 && score(next) < 4)) break
    picked.push(next)
    next.primaryMuscles.forEach((m) => coveredMuscles.add(m))
  }

  const exercises: DraftExercise[] = picked.map((e) => {
    const compound = isCompoundish(e)
    const reps = compound ? 8 : 12
    const setCount = compound ? 4 : 3
    const rm = rms.get(e.id)
    const pct = (compound ? 0.72 : 0.65) * pctScale
    const weightKg = rm
      ? Math.round((rm * pct) / 0.25) * 0.25
      : e.equipment === 'bodyweight'
        ? 0
        : 20
    const why = rm
      ? `~${Math.round(pct * 100)}% of your ${rm.toFixed(0)} kg e1RM`
      : 'no history yet — starting light to find your working weight'
    return {
      exerciseId: e.id,
      rationale: `${e.primaryMuscles[0]} for ${dayLabel} day; ${why}${lowIntensity ? ' (reduced: low readiness)' : ''}`,
      restSeconds: compound ? 150 : 90,
      sets: Array.from({ length: setCount }, () => ({ weightKg, reps })),
    }
  })

  return { name: `${dayLabel} · AI`, cycleDay: dayLabel, exercises }
}
