// Mirrored at app/functions/src/readinessRule.test.ts — keep both files identical
// (they guard the manually-synced duplicate rule modules).

import { describe, expect, it } from 'vitest'
import type { Readiness, WatchMetrics } from '../types'
import {
  formatSleepDuration,
  isLowReadiness,
  LOW_READINESS_SCALE,
  rhrElevated,
  sleepScoreTo5,
} from './readinessRule'

const watchDoc = (watch: Partial<WatchMetrics>, extra: Partial<Readiness> = {}): Readiness => ({
  date: '2026-07-16',
  watch: { syncedAt: 0, ...watch },
  ...extra,
})

describe('sleepScoreTo5', () => {
  it('maps watch sleep score band edges', () => {
    expect(sleepScoreTo5(watchDoc({ sleepScore: 85 }))).toBe(5)
    expect(sleepScoreTo5(watchDoc({ sleepScore: 84 }))).toBe(4)
    expect(sleepScoreTo5(watchDoc({ sleepScore: 75 }))).toBe(4)
    expect(sleepScoreTo5(watchDoc({ sleepScore: 74 }))).toBe(3)
    expect(sleepScoreTo5(watchDoc({ sleepScore: 60 }))).toBe(3)
    expect(sleepScoreTo5(watchDoc({ sleepScore: 59 }))).toBe(2)
    expect(sleepScoreTo5(watchDoc({ sleepScore: 45 }))).toBe(2)
    expect(sleepScoreTo5(watchDoc({ sleepScore: 44 }))).toBe(1)
  })

  it('falls back to duration bands when no score', () => {
    expect(sleepScoreTo5(watchDoc({ sleepMinutes: 480 }))).toBe(5)
    expect(sleepScoreTo5(watchDoc({ sleepMinutes: 420 }))).toBe(4)
    expect(sleepScoreTo5(watchDoc({ sleepMinutes: 360 }))).toBe(3)
    expect(sleepScoreTo5(watchDoc({ sleepMinutes: 359 }))).toBe(2)
    expect(sleepScoreTo5(watchDoc({ sleepMinutes: 299 }))).toBe(1)
  })

  it('score wins over duration; manual wins only without watch data', () => {
    expect(sleepScoreTo5(watchDoc({ sleepScore: 90, sleepMinutes: 300 }))).toBe(5)
    expect(sleepScoreTo5({ date: 'x', sleep: 2 })).toBe(2)
    expect(sleepScoreTo5(watchDoc({ sleepScore: 90 }, { sleep: 1 }))).toBe(5)
    expect(sleepScoreTo5({ date: 'x' })).toBeNull()
  })
})

describe('rhrElevated', () => {
  it('flags at +5 over baseline, not +4', () => {
    expect(rhrElevated({ restingHr: 57, rhrBaseline7d: 52, syncedAt: 0 })).toBe(true)
    expect(rhrElevated({ restingHr: 56, rhrBaseline7d: 52, syncedAt: 0 })).toBe(false)
  })

  it('never flags without both values', () => {
    expect(rhrElevated({ restingHr: 80, syncedAt: 0 })).toBe(false)
    expect(rhrElevated({ rhrBaseline7d: 50, syncedAt: 0 })).toBe(false)
    expect(rhrElevated(undefined)).toBe(false)
  })
})

describe('isLowReadiness', () => {
  it('matches the legacy manual rule exactly', () => {
    const legacy = (sleep: number, energy: number) =>
      sleep <= 2 || energy <= 2 || sleep + energy <= 4
    for (let sleep = 1; sleep <= 5; sleep++) {
      for (let energy = 1; energy <= 5; energy++) {
        expect(isLowReadiness({ date: 'x', sleep, energy })).toBe(legacy(sleep, energy))
      }
    }
  })

  it('null/undefined/empty → not low', () => {
    expect(isLowReadiness(null)).toBe(false)
    expect(isLowReadiness(undefined)).toBe(false)
    expect(isLowReadiness({ date: 'x' })).toBe(false)
  })

  it('watch-derived sleep triggers low even with good manual energy', () => {
    expect(isLowReadiness(watchDoc({ sleepScore: 40 }, { energy: 5 }))).toBe(true)
    expect(isLowReadiness(watchDoc({ sleepScore: 80 }, { energy: 5 }))).toBe(false)
  })

  it('elevated RHR alone triggers low', () => {
    expect(isLowReadiness(watchDoc({ sleepScore: 90, restingHr: 60, rhrBaseline7d: 52 }))).toBe(true)
  })

  it('low watch readiness score alone triggers low; 60+ does not', () => {
    expect(isLowReadiness(watchDoc({ sleepScore: 90, readinessScore: 59 }))).toBe(true)
    expect(isLowReadiness(watchDoc({ sleepScore: 90, readinessScore: 60 }))).toBe(false)
  })

  it('watch-only doc (no energy yet) uses only the objective signals', () => {
    expect(isLowReadiness(watchDoc({ sleepScore: 40 }))).toBe(true)
    expect(isLowReadiness(watchDoc({ sleepScore: 70 }))).toBe(false)
  })
})

describe('formatSleepDuration', () => {
  it('formats minutes as XhYYm', () => {
    expect(formatSleepDuration(408)).toBe('6h48m')
    expect(formatSleepDuration(480)).toBe('8h00m')
    expect(formatSleepDuration(65)).toBe('1h05m')
  })
})

it('LOW_READINESS_SCALE trims ~12%', () => {
  expect(LOW_READINESS_SCALE).toBe(0.88)
})
