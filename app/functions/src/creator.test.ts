import { describe, expect, it } from 'vitest'
import { generateDraft, musclesForDay, validateDraft } from './creator'
import { buildContext, summarizeHistory } from './context'
import type { UserData } from './context'
import type { Workout } from './domain'

const bench = (weightKg: number, reps: number) => ({
  id: 'w1',
  status: 'completed' as const,
  startedAt: Date.parse('2026-07-10T12:00:00Z'),
  cycleDay: 'Push',
  exercises: [
    {
      exerciseId: 'bench-press-barbell',
      sets: [{ id: 's1', segments: [{ weightKg, reps }], type: 'working' as const }],
    },
  ],
})

const data = (overrides: Partial<UserData> = {}): UserData => ({
  profile: { goals: 'build shoulders', tweaks: ['weak shoulders'] },
  cycle: { days: ['Push', 'Pull', 'Legs', 'Rest'], pointer: 0, pointerDate: '2026-07-15' },
  readiness: { date: '2026-07-15', sleep: 4, energy: 4 },
  workouts: [bench(60, 8)],
  ...overrides,
})

describe('generateDraft', () => {
  it('targets the current cycle day muscles with 4-6 exercises', () => {
    const draft = generateDraft(data())
    expect(draft.cycleDay).toBe('Push')
    expect(draft.exercises.length).toBeGreaterThanOrEqual(4)
    expect(draft.exercises.length).toBeLessThanOrEqual(6)
    const pushMuscles = new Set(musclesForDay('Push'))
    expect(pushMuscles.size).toBeGreaterThan(0)
  })

  it('prescribes ~72% e1RM for compounds with history', () => {
    const draft = generateDraft(data())
    const benchEx = draft.exercises.find((e) => e.exerciseId === 'bench-press-barbell')
    expect(benchEx).toBeDefined()
    // e1RM = 60×(1+8/30) = 76; 72% ≈ 54.75 (rounded to 0.25)
    expect(benchEx!.sets[0].weightKg).toBeCloseTo(76 * 0.72, 0)
    expect(benchEx!.rationale).toContain('e1RM')
  })

  it('reduces intensity when readiness is poor', () => {
    const good = generateDraft(data())
    const tired = generateDraft(data({ readiness: { date: 'x', sleep: 2, energy: 2 } }))
    const g = good.exercises.find((e) => e.exerciseId === 'bench-press-barbell')!
    const t = tired.exercises.find((e) => e.exerciseId === 'bench-press-barbell')!
    expect(t.sets[0].weightKg).toBeLessThan(g.sets[0].weightKg)
    expect(t.rationale).toContain('low readiness')
  })

  it('honours "no barbell" instructions', () => {
    const draft = generateDraft(data(), 'no barbell today')
    for (const e of draft.exercises) {
      expect(e.exerciseId).not.toContain('barbell')
    }
  })
})

describe('validateDraft', () => {
  const history: Workout[] = [bench(60, 8)] // bench e1RM 76

  it('accepts a clean draft', () => {
    const draft = validateDraft(
      {
        name: 'Push',
        cycleDay: 'Push',
        exercises: [
          {
            exerciseId: 'bench-press-barbell',
            rationale: 'main press',
            restSeconds: 150,
            sets: [{ weightKg: 55, reps: 8 }],
          },
        ],
      },
      history,
    )
    expect(draft.exercises).toHaveLength(1)
    expect(draft.exercises[0].sets[0]).toEqual({ weightKg: 55, reps: 8 })
  })

  it('drops unknown exercises and rejects an all-invalid draft', () => {
    expect(() =>
      validateDraft({ exercises: [{ exerciseId: 'made-up-lift', sets: [{ weightKg: 10, reps: 5 }] }] }, history),
    ).toThrow()
  })

  it('caps hallucinated loads at 115% of known e1RM and rounds to 0.25', () => {
    const draft = validateDraft(
      {
        exercises: [
          { exerciseId: 'bench-press-barbell', sets: [{ weightKg: 500, reps: 5 }, { weightKg: 41.13, reps: 8 }] },
        ],
      },
      history,
    )
    expect(draft.exercises[0].sets[0].weightKg).toBeLessThanOrEqual(76 * 1.15)
    expect(draft.exercises[0].sets[1].weightKg).toBe(41.25)
  })

  it('discards nonsense reps', () => {
    expect(() =>
      validateDraft(
        { exercises: [{ exerciseId: 'bench-press-barbell', sets: [{ weightKg: 50, reps: 0 }] }] },
        history,
      ),
    ).toThrow()
  })
})

describe('context', () => {
  it('summarizes older workouts into weekly muscle counts', () => {
    const workouts: Workout[] = Array.from({ length: 12 }, (_, i) => ({
      ...bench(50, 5),
      id: `w${i}`,
      startedAt: Date.parse('2026-07-10T12:00:00Z') - i * 3 * 86_400_000,
    }))
    const text = summarizeHistory(workouts, 8)
    expect(text).toContain('RECENT WORKOUTS')
    expect(text).toContain('OLDER HISTORY')
    expect(text).toContain('chest')
  })

  it('buildContext includes must-respect tweaks and readiness', () => {
    const text = buildContext(data())
    expect(text).toContain('MUST-RESPECT NOTES')
    expect(text).toContain('weak shoulders')
    expect(text).toContain('sleep 4/5')
    expect(text).toContain('Today is Push day')
  })
})
