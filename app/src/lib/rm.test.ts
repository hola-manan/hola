import { describe, expect, it } from 'vitest'
import { currentE1RM, epley1RM, rmSeries, setE1RM, weightForReps } from './rm'
import { setVolume, workingSetCount, workoutVolume, formatSet } from './volume'
import type { Workout, WorkoutSet } from '../types'

const set = (segments: [number, number][], type: WorkoutSet['type'] = 'working'): WorkoutSet => ({
  id: Math.random().toString(36).slice(2),
  segments: segments.map(([weightKg, reps]) => ({ weightKg, reps })),
  type,
})

const workout = (startedAt: number, sets: WorkoutSet[], exerciseId = 'bench'): Workout => ({
  id: `w${startedAt}`,
  status: 'completed',
  startedAt,
  completedAt: startedAt + 3_600_000,
  exercises: [{ exerciseId, sets }],
})

describe('epley1RM', () => {
  it('returns the weight itself for a true single', () => {
    expect(epley1RM(100, 1)).toBe(100)
  })
  it('estimates via weight × (1 + reps/30)', () => {
    expect(epley1RM(100, 10)).toBeCloseTo(133.33, 1)
    expect(epley1RM(60, 5)).toBeCloseTo(70, 1)
  })
  it('rejects high-rep and nonsense inputs', () => {
    expect(epley1RM(100, 13)).toBeNull()
    expect(epley1RM(0, 5)).toBeNull()
    expect(epley1RM(100, 0)).toBeNull()
  })
})

describe('setE1RM', () => {
  it('uses the best segment of a multi-segment set', () => {
    const s = set([
      [30, 8], // e1RM 38
      [22.5, 4], // e1RM 25.5
    ])
    expect(setE1RM(s)).toBeCloseTo(30 * (1 + 8 / 30), 5)
  })
  it('ignores warm-up sets entirely', () => {
    expect(setE1RM(set([[100, 5]], 'warmup'))).toBeNull()
  })
  it('skips only the >12-rep segment, not the whole set', () => {
    const s = set([
      [20, 20], // excluded from RM
      [30, 5],
    ])
    expect(setE1RM(s)).toBeCloseTo(35, 5)
  })
})

describe('rmSeries / currentE1RM', () => {
  it('produces one point per session using the best set, sorted by date', () => {
    const w1 = workout(1000, [set([[50, 5]]), set([[55, 3]])])
    const w2 = workout(2000, [set([[60, 5]])])
    const series = rmSeries([w2, w1], 'bench')
    expect(series.map((p) => p.date)).toEqual([1000, 2000])
    expect(series[0].e1rm).toBeCloseTo(60.5, 1) // 55×(1+3/30)
    expect(currentE1RM([w1, w2], 'bench')).toBeCloseTo(70, 1)
  })
  it('flags days with an actual single and tracks volume/best weight', () => {
    const w = workout(1000, [set([[100, 1]]), set([[80, 5]], 'working'), set([[40, 10]], 'warmup')])
    const [p] = rmSeries([w], 'bench')
    expect(p.actualSingle).toBe(true)
    expect(p.bestWeightKg).toBe(100)
    expect(p.volumeKg).toBe(100 + 400) // warm-up excluded
  })
  it('skips in-progress workouts and other exercises', () => {
    const w: Workout = { ...workout(1000, [set([[50, 5]])]), status: 'in_progress' }
    expect(rmSeries([w], 'bench')).toHaveLength(0)
    expect(rmSeries([workout(1000, [set([[50, 5]])], 'squat')], 'bench')).toHaveLength(0)
  })
})

describe('weightForReps', () => {
  it('inverts Epley and rounds to 0.25 kg', () => {
    // e1RM 100, 10 reps @ 100% → 75
    expect(weightForReps(100, 10)).toBe(75)
    expect(weightForReps(100, 10, 0.9)).toBeCloseTo(67.5, 2)
  })
})

describe('counting rules', () => {
  it('multi-segment set counts once but sums volume across segments', () => {
    const w = workout(1000, [set([[30, 8], [22.5, 4]]), set([[30, 8]])])
    expect(workingSetCount(w)).toBe(2)
    expect(workoutVolume(w)).toBe(30 * 8 + 22.5 * 4 + 30 * 8)
  })
  it('excludes warm-ups from volume by default, includes on demand', () => {
    const s = set([[20, 10]], 'warmup')
    expect(setVolume(s)).toBe(0)
    expect(setVolume(s, true)).toBe(200)
  })
  it('formats segments compactly', () => {
    expect(formatSet(set([[30, 8], [22.5, 4]]))).toBe('30×8 + 22.5×4')
  })
})
