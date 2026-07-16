import { describe, expect, it } from 'vitest'
import { volumeVsTargets, weeklySetCounts, weeklyTargets, weekStartMs } from './targets'
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

describe('weeklyTargets', () => {
  it('gives every trained muscle a target, scaled to a 7-day week', () => {
    const t = weeklyTargets(ppl)
    // Push hits chest once per 4-day cycle → 4 sets × 7/4 = 7
    expect(t.get('chest')).toBe(7)
    expect(t.get('lats')).toBe(7)
    expect(t.get('quads')).toBe(7)
    expect(t.has('abs')).toBe(false) // nothing in PPL hits abs as primary
  })

  it('counts muscles hit by multiple days additively', () => {
    const t = weeklyTargets({ days: ['Push', 'Upper', 'Rest'], pointer: 0, pointerDate: 'x' })
    // chest in Push and Upper: 2 × 4 × 7/3 ≈ 19
    expect(t.get('chest')).toBe(19)
  })
})

describe('weeklySetCounts / volumeVsTargets', () => {
  it('counts working sets per primary muscle since cutoff, excluding warm-ups', () => {
    const now = Date.now()
    const w = workout(now, [set(60, 8), set(60, 8), set(20, 12, 'warmup')])
    const counts = weeklySetCounts([w], exercises, now - 1000)
    expect(counts.get('chest')).toBe(2)
    const old = workout(now - 10 * 86_400_000, [set(60, 8)])
    expect(weeklySetCounts([old], exercises, now - 1000).get('chest')).toBeUndefined()
  })

  it('flags muscles under 75% of target as behind', () => {
    const now = Date.now()
    const rows = volumeVsTargets(ppl, [workout(now, [set(60, 8), set(60, 8)])], exercises, now - 1000)
    const chest = rows.find((r) => r.muscle === 'chest')!
    expect(chest.done).toBe(2)
    expect(chest.target).toBe(7)
    expect(chest.behind).toBe(true)
    const lats = rows.find((r) => r.muscle === 'lats')!
    expect(lats.done).toBe(0)
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
