import { describe, expect, it } from 'vitest'
import { advance, autoAdvanceRestDays, currentDayLabel, missedDays, shiftToToday, skipDay } from './cycle'
import type { Cycle } from '../types'

const ppl: Cycle = {
  days: ['Push', 'Pull', 'Legs', 'Rest'],
  pointer: 0,
  pointerDate: '2026-07-10',
}

describe('cycle', () => {
  it('reports the current day label', () => {
    expect(currentDayLabel(ppl)).toBe('Push')
    expect(currentDayLabel({ ...ppl, pointer: 3 })).toBe('Rest')
  })

  it('advance moves pointer forward and wraps', () => {
    const c = advance({ ...ppl, pointer: 3 }, '2026-07-11')
    expect(c.pointer).toBe(0)
    expect(c.pointerDate).toBe('2026-07-11')
  })

  it('training days never auto-advance — they accrue missed days', () => {
    const c = autoAdvanceRestDays(ppl, '2026-07-13')
    expect(c.pointer).toBe(0)
    expect(missedDays(c, '2026-07-13')).toBe(3)
  })

  it('rest days auto-advance one step per elapsed day', () => {
    const atRest: Cycle = { ...ppl, pointer: 3, pointerDate: '2026-07-10' }
    const c = autoAdvanceRestDays(atRest, '2026-07-11')
    expect(c.pointer).toBe(0) // Rest → Push
    expect(c.pointerDate).toBe('2026-07-11')
    expect(missedDays(c, '2026-07-11')).toBe(0)
  })

  it('consecutive rest days all auto-advance', () => {
    const c: Cycle = { days: ['Push', 'Rest', 'Rest'], pointer: 1, pointerDate: '2026-07-10' }
    expect(autoAdvanceRestDays(c, '2026-07-12').pointer).toBe(0)
  })

  it('shift keeps the day but re-stamps today; skip moves past it', () => {
    const stale = { ...ppl, pointerDate: '2026-07-10' }
    const shifted = shiftToToday(stale, '2026-07-13')
    expect(shifted.pointer).toBe(0)
    expect(missedDays(shifted, '2026-07-13')).toBe(0)

    const skipped = skipDay(stale, '2026-07-13')
    expect(currentDayLabel(skipped)).toBe('Pull')
    expect(skipped.pointerDate).toBe('2026-07-13')
  })

  it('skip lands past rest days onto the next training day', () => {
    const c: Cycle = { days: ['Legs', 'Rest', 'Upper'], pointer: 0, pointerDate: '2026-07-10' }
    expect(currentDayLabel(skipDay(c, '2026-07-12'))).toBe('Upper')
  })
})
