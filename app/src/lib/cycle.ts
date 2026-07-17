import { type Cycle } from '../types'

export function todayStr(now = new Date()): string {
  const y = now.getFullYear()
  const m = `${now.getMonth() + 1}`.padStart(2, '0')
  const d = `${now.getDate()}`.padStart(2, '0')
  return `${y}-${m}-${d}`
}

function daysBetween(fromYmd: string, toYmd: string): number {
  const from = new Date(`${fromYmd}T00:00:00`)
  const to = new Date(`${toYmd}T00:00:00`)
  return Math.round((to.getTime() - from.getTime()) / 86_400_000)
}

export function currentDayLabel(cycle: Cycle): string {
  return cycle.days[cycle.pointer % cycle.days.length]
}

/**
 * The cycle is calendar-driven: the pointer moves one step per elapsed day,
 * training day or not. Whether a day was actually trained is shown separately
 * (Home derives ✓/missed from the logged workouts) — finishing a workout never
 * moves the pointer.
 */
export function autoAdvanceDaily(cycle: Cycle, today = todayStr()): Cycle {
  const elapsed = daysBetween(cycle.pointerDate, today)
  if (elapsed <= 0) return cycle
  return {
    ...cycle,
    pointer: (cycle.pointer + elapsed) % cycle.days.length,
    pointerDate: today,
  }
}
