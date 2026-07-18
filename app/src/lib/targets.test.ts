import { describe, expect, it } from 'vitest'
import { efficiencyPct, groupedVolumeRows, weeklySetCounts, weekStartMs } from './targets'
import { e1rmDelta } from './rm'
import type { Cycle, Exercise, Workout, WorkoutSet } from '../types'

const ppl: Cycle = { days: ['Push', 'Pull', 'Legs', 'Rest'], pointer: 0, pointerDate: '2026-07-16' }

const bench: Exercise = {
  id: 'bench',
  name: 'Bench',
  primaryMuscles: ['chest'],
  secondaryMuscles: ['triceps'],
  equipment: 'barbell',
  instructions: [],
  images: [],
}
const exercises = new Map([[bench.id, bench]])

const set = (weightKg: number, reps: number, type: WorkoutSet['type'] = 'working'): WorkoutSet => ({
  id: Math.random().toString(36).slice(2),
  segments: [{ weightKg, reps }],
  type,
})

const workout = (startedAt: number, sets: WorkoutSet[]): Workout => ({
  id: `w${startedAt}`,
  status: 'completed',
  startedAt,
  exercises: [{ exerciseId: 'bench', sets }],
})

describe('efficiencyPct', () => {
  it('handles 0 and negative values', () => {
    expect(efficiencyPct(0, 10, 20)).toBe(0)
    expect(efficiencyPct(-5, 10, 20)).toBe(0)
  })

  it('calculates concave rise below the range', () => {
    // lo=8, hi=12
    // x=4 -> 75%
    expect(efficiencyPct(4, 8, 12)).toBe(75)
    // x=2 -> 44% (100 * (1 - (6/8)^2) = 100 * (1 - 0.5625) = 43.75 -> 44)
    expect(efficiencyPct(2, 8, 12)).toBe(44)
  })

  it('returns 100% inside the optimal range', () => {
    expect(efficiencyPct(8, 8, 12)).toBe(100)
    expect(efficiencyPct(10, 8, 12)).toBe(100)
    expect(efficiencyPct(12, 8, 12)).toBe(100)
  })

  it('handles decline past hi with floor 40', () => {
    // lo=8, hi=12
    // x=18 -> 100 - (60 * 6) / 12 = 70
    expect(efficiencyPct(18, 8, 12)).toBe(70)
    // x=24 -> 40
    expect(efficiencyPct(24, 8, 12)).toBe(40)
    // x=36 -> floor 40
    expect(efficiencyPct(36, 8, 12)).toBe(40)
  })
})

describe('weeklySetCounts / groupedVolumeRows', () => {
  it('counts working sets since cutoff, excluding warm-ups', () => {
    const now = Date.now()
    const w = workout(now, [set(60, 8), set(60, 8), set(20, 12, 'warmup')])
    const counts = weeklySetCounts([w], exercises, now - 1000)
    expect(counts.get('chest')).toBe(2)
    const old = workout(now - 10 * 86_400_000, [set(60, 8)])
    expect(weeklySetCounts([old], exercises, now - 1000).get('chest')).toBeUndefined()
  })

  it('groupedVolumeRows aggregates trained muscles in a PPL cycle', () => {
    const now = Date.now()
    // 14 chest sets (optimal range [12, 20])
    const w = workout(now, Array(14).fill(null).map(() => set(60, 8)))
    const rows = groupedVolumeRows(ppl, [w], exercises, now - 1000)

    // Chest group should exist
    const chestGroup = rows.find((r) => r.label === 'Chest')!
    expect(chestGroup).toBeDefined()
    expect(chestGroup.done).toBe(14)
    expect(chestGroup.lo).toBe(12)
    expect(chestGroup.hi).toBe(20)
    expect(chestGroup.pct).toBe(100) // in optimal range
    expect(chestGroup.behind).toBe(false)
    expect(chestGroup.over).toBe(false)

    // Check chest muscle child row
    const chestChild = chestGroup.muscles.find((c) => c.muscle === 'chest')!
    expect(chestChild).toBeDefined()
    expect(chestChild.done).toBe(14)
    expect(chestChild.pct).toBe(100)

    // Shoulders group: front delts, side delts, rear delts.
    // Done is 0. lo = 2 + 8 + 4 = 14. Should be flagged behind.
    const shouldersGroup = rows.find((r) => r.label === 'Shoulders')!
    expect(shouldersGroup).toBeDefined()
    expect(shouldersGroup.done).toBe(0)
    expect(shouldersGroup.lo).toBe(14)
    expect(shouldersGroup.hi).toBe(26)
    expect(shouldersGroup.behind).toBe(true)
  })
})

describe('weekStartMs', () => {
  it('returns the Monday of the current week at midnight', () => {
    const thu = new Date('2026-07-16T15:30:00') // Thursday
    const start = new Date(weekStartMs(thu))
    expect(start.getDay()).toBe(1) // Monday
    expect(start.getDate()).toBe(13)
    expect(start.getHours()).toBe(0)
  })
})

describe('e1rmDelta', () => {
  it('compares the last two sessions', () => {
    const w1 = workout(1000, [set(60, 8)]) // e1RM 76
    const w2 = workout(2000, [set(62.5, 8)]) // e1RM ≈ 79.17
    const d = e1rmDelta([w1, w2], 'bench')!
    expect(d.current).toBeCloseTo(79.17, 1)
    expect(d.deltaPct).toBeCloseTo(4.17, 1)
  })
  it('returns null delta with a single session, null with none', () => {
    expect(e1rmDelta([workout(1000, [set(60, 8)])], 'bench')!.deltaPct).toBeNull()
    expect(e1rmDelta([], 'bench')).toBeNull()
  })
})
