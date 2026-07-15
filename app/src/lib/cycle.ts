import { isRestDay, type Cycle } from '../types'

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
 * Rest days auto-advance: walk the pointer forward one step per elapsed
 * calendar day, but ONLY while the pointer sits on a rest day. Training days
 * never auto-advance — missing one becomes a shift/skip question for the user.
 */
export function autoAdvanceRestDays(cycle: Cycle, today = todayStr()): Cycle {
  let { pointer, pointerDate } = cycle
  while (
    daysBetween(pointerDate, today) > 0 &&
    isRestDay(cycle.days[pointer % cycle.days.length])
  ) {
    pointer = (pointer + 1) % cycle.days.length
    pointerDate = addDays(pointerDate, 1)
  }
  return { ...cycle, pointer, pointerDate }
}

function addDays(ymd: string, n: number): string {
  const d = new Date(`${ymd}T00:00:00`)
  d.setDate(d.getDate() + n)
  return todayStr(d)
}

/** Days the current (training) day has been pending. 0 = it's for today. */
export function missedDays(cycle: Cycle, today = todayStr()): number {
  return Math.max(0, daysBetween(cycle.pointerDate, today))
}

/** Completing a workout advances the pointer to the next day, stamped today. */
export function advance(cycle: Cycle, today = todayStr()): Cycle {
  return { ...cycle, pointer: (cycle.pointer + 1) % cycle.days.length, pointerDate: today }
}

/** "Shift": do the pending day today; the whole cycle slides. */
export function shiftToToday(cycle: Cycle, today = todayStr()): Cycle {
  return { ...cycle, pointerDate: today }
}

/** "Skip": mark the pending day missed and move on to the next TRAINING day —
 * the user skipping wants to know what to train today, not be told to rest. */
export function skipDay(cycle: Cycle, today = todayStr()): Cycle {
  let next = advance(cycle, today)
  let guard = 0
  while (isRestDay(currentDayLabel(next)) && guard++ < next.days.length) {
    next = advance(next, today)
  }
  return next
}
