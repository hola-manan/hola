// Builds the textual context every AI feature is grounded in
// (spec: history, profile+tweaks, cycle state, readiness).

import {
  e1rmTable,
  formatSet,
  muscleSetCounts,
  type CatalogEntry,
  type Cycle,
  type Profile,
  type Readiness,
  type Workout,
} from './domain'
import catalogJson from './catalog.json'

export const CATALOG: CatalogEntry[] = catalogJson as CatalogEntry[]
export const CATALOG_BY_ID = new Map(CATALOG.map((e) => [e.id, e]))

export interface UserData {
  profile: Profile | null
  cycle: Cycle | null
  readiness: Readiness | null
  /** Completed workouts, newest first. */
  workouts: Workout[]
}

const exerciseName = (id: string) => CATALOG_BY_ID.get(id)?.name ?? id

export function describeWorkout(w: Workout): string {
  const date = new Date(w.startedAt).toISOString().slice(0, 10)
  const lines = w.exercises
    .map((we) => `  ${exerciseName(we.exerciseId)}: ${we.sets.map(formatSet).join(', ') || '(no sets)'}`)
    .join('\n')
  return `${date}${w.cycleDay ? ` [${w.cycleDay} day]` : ''}${w.name ? ` "${w.name}"` : ''}\n${lines}`
}

/** Recent workouts in detail; older ones as weekly per-muscle set counts. */
export function summarizeHistory(workouts: Workout[], detailedCount = 8): string {
  if (!workouts.length) return 'No workouts logged yet.'
  const detailed = workouts.slice(0, detailedCount)
  const older = workouts.slice(detailedCount)
  let out = `RECENT WORKOUTS (newest first, weights in kg, sets as weight×reps, '+' = mid-set weight change):\n`
  out += detailed.map(describeWorkout).join('\n')
  if (older.length) {
    const byWeek = new Map<string, Workout[]>()
    for (const w of older) {
      const d = new Date(w.startedAt)
      const week = `${d.getFullYear()}-W${String(getISOWeek(d)).padStart(2, '0')}`
      byWeek.set(week, [...(byWeek.get(week) ?? []), w])
    }
    out += `\n\nOLDER HISTORY (working sets per muscle group, per week):\n`
    for (const [week, ws] of [...byWeek.entries()].sort().reverse()) {
      const counts = muscleSetCounts(ws, CATALOG_BY_ID)
      const row = [...counts.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([m, n]) => `${m} ${n}`)
        .join(', ')
      out += `  ${week} (${ws.length} workouts): ${row}\n`
    }
  }
  return out
}

export function getISOWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const day = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - day)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7)
}

export function describeProfile(profile: Profile | null): string {
  if (!profile) return 'No profile set.'
  const bw = profile.bodyweight?.length
    ? profile.bodyweight[profile.bodyweight.length - 1]
    : null
  const parts = [
    profile.goals ? `Goals: ${profile.goals}` : null,
    profile.heightCm ? `Height: ${profile.heightCm} cm` : null,
    bw ? `Bodyweight: ${bw.weightKg} kg (${bw.date})` : null,
    profile.tweaks?.length
      ? `MUST-RESPECT NOTES (tweaks/injuries): ${profile.tweaks.join('; ')}`
      : null,
  ].filter(Boolean)
  return parts.length ? parts.join('\n') : 'No profile set.'
}

export function describeCycle(cycle: Cycle | null): string {
  if (!cycle) return 'No training cycle configured.'
  const today = cycle.days[cycle.pointer % cycle.days.length]
  return `Cycle: ${cycle.days.join(' → ')}. Today is ${today} day (position ${
    (cycle.pointer % cycle.days.length) + 1
  }/${cycle.days.length}).`
}

export function describeReadiness(r: Readiness | null): string {
  if (!r) return 'No readiness data for today.'
  return `Today's readiness check-in: sleep ${r.sleep}/5, energy ${r.energy}/5${
    r.note ? `, note: "${r.note}"` : ''
  }.`
}

export function describeE1RMs(workouts: Workout[]): string {
  const table = e1rmTable(workouts)
  if (!table.size) return 'No estimated 1RMs yet.'
  const rows = [...table.entries()]
    .map(([id, rm]) => `  ${exerciseName(id)}: ${rm.toFixed(1)} kg`)
    .join('\n')
  return `CURRENT ESTIMATED 1RMs (Epley):\n${rows}`
}

export function buildContext(data: UserData): string {
  return [
    '=== USER PROFILE ===',
    describeProfile(data.profile),
    '',
    '=== TRAINING CYCLE ===',
    describeCycle(data.cycle),
    '',
    '=== RECOVERY ===',
    describeReadiness(data.readiness),
    '',
    '=== STRENGTH ===',
    describeE1RMs(data.workouts),
    '',
    '=== HISTORY ===',
    summarizeHistory(data.workouts),
  ].join('\n')
}
