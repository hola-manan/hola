import { describe, expect, it } from 'vitest'
import { autoAdvanceDaily, currentDayLabel, removeCycleDay } from './cycle'
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

  it('same day → no change', () => {
    expect(autoAdvanceDaily(ppl, '2026-07-10')).toEqual(ppl)
  })

  it('advances one step per elapsed calendar day, training day or not', () => {
    const c = autoAdvanceDaily(ppl, '2026-07-11')
    expect(c.pointer).toBe(1) // Push → Pull, even though Push wasn't trained
    expect(c.pointerDate).toBe('2026-07-11')
  })

  it('multi-day gaps jump and wrap around the rotation', () => {
    const c = autoAdvanceDaily(ppl, '2026-07-15') // 5 days over a 4-day cycle
    expect(c.pointer).toBe(1)
    expect(c.pointerDate).toBe('2026-07-15')
    expect(currentDayLabel(c)).toBe('Pull')
  })

  it('a clock set backwards never rewinds the pointer', () => {
    expect(autoAdvanceDaily(ppl, '2026-07-09')).toEqual(ppl)
  })
})

describe('removeCycleDay', () => {
  it('keeps "today" on the same day when an earlier day is removed', () => {
    // [Push, Pull, Legs, Rest] on Legs; drop Push → pointer must follow Legs to index 1
    const r = removeCycleDay(ppl.days, 2, 0)
    expect(r.days).toEqual(['Pull', 'Legs', 'Rest'])
    expect(r.days[r.pointer]).toBe('Legs')
  })

  it('leaves the pointer alone when a later day is removed', () => {
    const r = removeCycleDay(ppl.days, 1, 3)
    expect(r.days).toEqual(['Push', 'Pull', 'Legs'])
    expect(r.days[r.pointer]).toBe('Pull')
  })

  it('clamps into range when the last day is removed while on it', () => {
    const r = removeCycleDay(ppl.days, 3, 3)
    expect(r.days).toEqual(['Push', 'Pull', 'Legs'])
    expect(r.pointer).toBe(2)
    expect(r.days[r.pointer]).toBe('Legs')
  })

  it('removing the current day slides the pointer onto its successor', () => {
    const r = removeCycleDay(ppl.days, 1, 1)
    expect(r.days).toEqual(['Push', 'Legs', 'Rest'])
    expect(r.days[r.pointer]).toBe('Legs')
  })

  it('emptying the cycle leaves a valid pointer', () => {
    expect(removeCycleDay(['Push'], 0, 0)).toEqual({ days: [], pointer: 0 })
  })
})
