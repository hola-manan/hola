import { describe, expect, it } from 'vitest'
import { autoAdvanceDaily, currentDayLabel } from './cycle'
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
