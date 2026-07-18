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
import { formatSleepDuration, rhrElevated, isLowReadiness } from './readinessRule'
import { MUSCLE_RANGES, weekStartMs } from './volumeTargets'
import catalogJson from './catalog.json'

export const CATALOG: CatalogEntry[] = catalogJson as CatalogEntry[]
export const CATALOG_BY_ID = new Map(CATALOG.map((e) => [e.id, e]))

export interface UserData {
  profile: Profile | null
  cycle: Cycle | null
  readiness: Readiness | null
  /** Last ~7 readiness docs, newest first (may include `readiness` itself). */
  readinessHistory: Readiness[]
  /** Completed workouts, newest first. */
  workouts: Workout[]
  /** Custom user exercises. */
  customExercises: CatalogEntry[]
}

const buildUserCatalog = (custom: CatalogEntry[]) => {
  const map = new Map<string, CatalogEntry>(CATALOG_BY_ID)
  for (const c of custom) map.set(c.id, c)
  return map
}

const exerciseName = (id: string, catalog: Map<string, CatalogEntry>) => catalog.get(id)?.name ?? id

export function describeWorkout(w: Workout, catalog: Map<string, CatalogEntry>): string {
  const date = new Date(w.startedAt).toISOString().slice(0, 10)
  const lines = w.exercises
    .map((we) => `  ${exerciseName(we.exerciseId, catalog)}: ${we.sets.map(formatSet).join(', ') || '(no sets)'}`)
    .join('\n')
  return `${date}${w.cycleDay ? ` [${w.cycleDay} day]` : ''}${w.name ? ` "${w.name}"` : ''}\n${lines}`
}

/** Recent workouts in detail; older ones as weekly per-muscle set counts. */
export function summarizeHistory(workouts: Workout[], catalog: Map<string, CatalogEntry>, detailedCount = 8): string {
  if (!workouts.length) return 'No workouts logged yet.'
  const detailed = workouts.slice(0, detailedCount)
  const older = workouts.slice(detailedCount)
  let out = `RECENT WORKOUTS (newest first, weights in kg, sets as weight×reps, '+' = mid-set weight change):\n`
  out += detailed.map((w) => describeWorkout(w, catalog)).join('\n')
  if (older.length) {
    const byWeek = new Map<string, Workout[]>()
    for (const w of older) {
      const d = new Date(w.startedAt)
      const week = `${d.getFullYear()}-W${String(getISOWeek(d)).padStart(2, '0')}`
      byWeek.set(week, [...(byWeek.get(week) ?? []), w])
    }
    out += `\n\nOLDER HISTORY (working sets per muscle group, per week):\n`
    for (const [week, ws] of [...byWeek.entries()].sort().reverse()) {
      const counts = muscleSetCounts(ws, catalog)
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

export function describeReadiness(r: Readiness | null, history: Readiness[] = []): string {
  const lines: string[] = []
  if (!r) {
    lines.push('No readiness data for today.')
  } else if (r.watch) {
    const w = r.watch
    const parts: string[] = []
    if (w.sleepMinutes !== undefined) {
      const stages = [
        w.deepMin !== undefined ? `deep ${w.deepMin}m` : null,
        w.remMin !== undefined ? `REM ${w.remMin}m` : null,
      ].filter(Boolean)
      parts.push(
        `sleep ${formatSleepDuration(w.sleepMinutes)}${
          w.sleepScore !== undefined ? `, score ${w.sleepScore}/100` : ''
        }${stages.length ? ` (${stages.join(', ')})` : ''}`,
      )
    } else if (w.sleepScore !== undefined) {
      parts.push(`sleep score ${w.sleepScore}/100`)
    }
    if (w.readinessScore !== undefined) parts.push(`watch readiness score ${w.readinessScore}/100`)
    if (w.hrv !== undefined) parts.push(`overnight HRV ${w.hrv} ms`)
    if (w.restingHr !== undefined) {
      parts.push(
        `resting HR ${w.restingHr} bpm${
          w.rhrBaseline7d !== undefined ? ` (7-day avg ${w.rhrBaseline7d})` : ''
        }${rhrElevated(w) ? ' — ELEVATED' : ''}`,
      )
    }
    if (w.stressAvg !== undefined) parts.push(`stress avg ${w.stressAvg}/100`)
    if (w.pai !== undefined) parts.push(`PAI ${w.pai}`)
    lines.push(`Watch data (Amazfit Balance): ${parts.join(', ')}.`)
    lines.push(
      `Manual energy check-in: ${r.energy !== undefined ? `${r.energy}/5` : 'not entered yet'}${
        r.note ? `, note: "${r.note}"` : ''
      }.`,
    )
    lines.push(
      isLowReadiness(r)
        ? 'Assessment: LOW readiness — reduce intensity ~12% today.'
        : 'Assessment: normal readiness.',
    )
  } else {
    lines.push(
      `Today's readiness check-in: sleep ${r.sleep ?? '?'}/5, energy ${r.energy ?? '?'}/5${
        r.note ? `, note: "${r.note}"` : ''
      }.`,
    )
  }

  const past = history.filter((h) => h.watch && h.date !== r?.date)
  if (past.length >= 3) {
    const avg = (xs: number[]) => xs.reduce((s, x) => s + x, 0) / xs.length
    const sleeps = past.map((h) => h.watch?.sleepMinutes).filter((x): x is number => x !== undefined)
    const rhrs = past.map((h) => h.watch?.restingHr).filter((x): x is number => x !== undefined)
    const bits = [
      sleeps.length ? `sleep avg ${formatSleepDuration(avg(sleeps))}` : null,
      rhrs.length ? `resting HR avg ${Math.round(avg(rhrs))} bpm` : null,
    ].filter(Boolean)
    if (bits.length) lines.push(`Past ${past.length}-day trend: ${bits.join(', ')}.`)
  }
  return lines.join('\n')
}

export function describeE1RMs(workouts: Workout[], catalog: Map<string, CatalogEntry>): string {
  const table = e1rmTable(workouts)
  if (!table.size) return 'No estimated 1RMs yet.'
  const rows = [...table.entries()]
    .map(([id, rm]) => `  ${exerciseName(id, catalog)}: ${rm.toFixed(1)} kg`)
    .join('\n')
  return `CURRENT ESTIMATED 1RMs (Epley):\n${rows}`
}

export function describeWeeklyVolume(
  workouts: Workout[],
  catalog: Map<string, CatalogEntry>,
  now = new Date(),
): string {
  const startMs = weekStartMs(now)
  const weeklyWorkouts = workouts.filter((w) => w.status === 'completed' && w.startedAt >= startMs)
  const counts = muscleSetCounts(weeklyWorkouts, catalog)

  const lines: string[] = []
  for (const [m, range] of Object.entries(MUSCLE_RANGES)) {
    const [lo, hi] = range
    const done = counts.get(m) ?? 0
    if (done > 0 || done < lo) {
      let tag = ''
      if (done === 0) {
        tag = 'UNTRAINED'
      } else if (done < lo) {
        tag = 'UNDER'
      } else if (done > hi) {
        tag = 'OVER'
      } else {
        tag = 'in range'
      }
      lines.push(`${m}: ${done} sets (optimal ${lo}–${hi}) — ${tag}`)
    }
  }

  return [
    "=== THIS WEEK'S VOLUME VS OPTIMAL (working sets per muscle, Mon-based week) ===",
    ...lines,
  ].join('\n')
}

export function buildContext(data: UserData): string {
  const catalog = buildUserCatalog(data.customExercises)
  return [
    '=== USER PROFILE ===',
    describeProfile(data.profile),
    '',
    '=== TRAINING CYCLE ===',
    describeCycle(data.cycle),
    '',
    '=== RECOVERY ===',
    describeReadiness(data.readiness, data.readinessHistory),
    '',
    '=== STRENGTH ===',
    describeE1RMs(data.workouts, catalog),
    '',
    describeWeeklyVolume(data.workouts, catalog),
    '',
    '=== HISTORY ===',
    summarizeHistory(data.workouts, catalog),
  ].join('\n')
}
