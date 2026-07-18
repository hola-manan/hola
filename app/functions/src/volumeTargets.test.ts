import { describe, expect, it } from 'vitest'
import { efficiencyPct, weekStartMs } from './volumeTargets'
import { describeWeeklyVolume } from './context'
import type { Workout, CatalogEntry } from './domain'

describe('efficiencyPct (mirrored)', () => {
  it('mirrors efficiency curve math correctly', () => {
    expect(efficiencyPct(0, 8, 12)).toBe(0)
    expect(efficiencyPct(4, 8, 12)).toBe(75)
    expect(efficiencyPct(10, 8, 12)).toBe(100)
    expect(efficiencyPct(18, 8, 12)).toBe(70)
  })
})

describe('describeWeeklyVolume', () => {
  it('correctly categorizes muscles and builds context text', () => {
    // Thursday July 16, 2026
    const mockNow = new Date('2026-07-16T12:00:00Z')
    const mon = weekStartMs(mockNow) // Mon Jul 13, 2026

    const benchCatalog: CatalogEntry = {
      id: 'bench',
      name: 'Bench Press',
      primaryMuscles: ['chest'],
      secondaryMuscles: [],
      equipment: 'barbell',
    }
    const pullupCatalog: CatalogEntry = {
      id: 'pullup',
      name: 'Pull-up',
      primaryMuscles: ['lats'],
      secondaryMuscles: [],
      equipment: 'bodyweight',
    }
    const catalog = new Map<string, CatalogEntry>([
      [benchCatalog.id, benchCatalog],
      [pullupCatalog.id, pullupCatalog],
    ])

    const workouts: Workout[] = [
      {
        id: 'w1',
        status: 'completed',
        startedAt: mon + 12 * 3600 * 1000, // Monday noon
        exercises: [
          {
            exerciseId: 'bench',
            sets: Array(14).fill(null).map((_, i) => ({
              id: `s${i}`,
              segments: [{ weightKg: 100, reps: 5 }],
              type: 'working',
            })),
          },
        ],
      },
      {
        id: 'w2',
        status: 'completed',
        startedAt: mon + 36 * 3600 * 1000, // Tuesday noon
        exercises: [
          {
            exerciseId: 'pullup',
            sets: Array(4).fill(null).map((_, i) => ({
              id: `s_p${i}`,
              segments: [{ weightKg: 0, reps: 8 }],
              type: 'working',
            })),
          },
        ],
      },
      {
        id: 'w3',
        status: 'completed',
        startedAt: mon - 12 * 3600 * 1000, // Sunday before (ignored)
        exercises: [
          {
            exerciseId: 'bench',
            sets: Array(10).fill(null).map((_, i) => ({
              id: `s_old${i}`,
              segments: [{ weightKg: 100, reps: 5 }],
              type: 'working',
            })),
          },
        ],
      },
    ]

    const text = describeWeeklyVolume(workouts, catalog, mockNow)

    expect(text).toContain('chest: 14 sets (optimal 12–20) — in range')
    expect(text).toContain('lats: 4 sets (optimal 8–12) — UNDER')
    expect(text).toContain('side delts: 0 sets (optimal 8–12) — UNTRAINED')
  })
})
