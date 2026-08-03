import { describe, expect, it } from 'vitest'
import { generateDraft, musclesForDay, validateDraft } from './creator'
import { buildContext, buildUserCatalog, CATALOG_BY_ID, isoWeekId, summarizeHistory } from './context'
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
  readinessHistory: [],
  workouts: [bench(60, 8)],
  customExercises: [],
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

  it('reduces intensity when watch data shows poor sleep despite good energy', () => {
    const good = generateDraft(data())
    const tired = generateDraft(
      data({
        readiness: {
          date: '2026-07-15',
          energy: 4,
          watch: {
            sleepScore: 40,
            sleepMinutes: 300,
            restingHr: 60,
            rhrBaseline7d: 52,
            syncedAt: 0,
          },
        },
      }),
    )
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

  // createWorkout advertises the user's custom exercises in the prompt catalog,
  // so validation has to recognise them coming back.
  it('keeps custom exercises when the caller supplies the user catalog', () => {
    const custom = {
      id: 'custom-sled-push',
      name: 'Sled Push',
      primaryMuscles: ['quads'],
      secondaryMuscles: ['glutes'],
      equipment: 'other',
    }
    const catalog = buildUserCatalog([custom])
    const draft = validateDraft(
      {
        name: 'Legs',
        exercises: [
          { exerciseId: 'custom-sled-push', rationale: 'conditioning finisher', restSeconds: 90, sets: [{ weightKg: 60, reps: 20 }] },
        ],
      },
      history,
      catalog,
    )
    expect(draft.exercises.map((e) => e.exerciseId)).toEqual(['custom-sled-push'])
  })

  it('still drops genuinely unknown ids when a user catalog is supplied', () => {
    const catalog = buildUserCatalog([])
    expect(() =>
      validateDraft(
        { exercises: [{ exerciseId: 'made-up-lift', sets: [{ weightKg: 10, reps: 5 }] }] },
        history,
        catalog,
      ),
    ).toThrow()
  })
})

describe('isoWeekId', () => {
  // The week id keys users/{uid}/summaries/{week}. Pairing an ISO week number
  // with the *calendar* year splits one Mon-based week across two docs and
  // collides with the same-numbered week of the real ISO year.
  it('uses the ISO week-numbering year, not the calendar year', () => {
    // Mon 29 Dec 2025 – Sun 4 Jan 2026 is a single ISO week: 2026-W01.
    expect(isoWeekId(new Date('2025-12-29T12:00:00'))).toBe('2026-W01')
    expect(isoWeekId(new Date('2025-12-31T12:00:00'))).toBe('2026-W01')
    expect(isoWeekId(new Date('2026-01-01T12:00:00'))).toBe('2026-W01')
    expect(isoWeekId(new Date('2026-01-04T12:00:00'))).toBe('2026-W01')
  })

  it('gives one id per Monday-based week across a year boundary', () => {
    // Mon 28 Dec 2026 – Sun 3 Jan 2027 is ISO week 2026-W53 throughout.
    const week = ['2026-12-28', '2026-12-31', '2027-01-01', '2027-01-03'].map((d) =>
      isoWeekId(new Date(`${d}T12:00:00`)),
    )
    expect(new Set(week).size).toBe(1)
    expect(week[0]).toBe('2026-W53')
    // and the next week rolls over cleanly
    expect(isoWeekId(new Date('2027-01-04T12:00:00'))).toBe('2027-W01')
  })

  it('is stable mid-year', () => {
    expect(isoWeekId(new Date('2026-07-16T12:00:00'))).toBe('2026-W29')
  })
})

describe('context', () => {
  it('summarizes older workouts into weekly muscle counts', () => {
    const workouts: Workout[] = Array.from({ length: 12 }, (_, i) => ({
      ...bench(50, 5),
      id: `w${i}`,
      startedAt: Date.parse('2026-07-10T12:00:00Z') - i * 3 * 86_400_000,
    }))
    const text = summarizeHistory(workouts, CATALOG_BY_ID, 8)
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

  it('buildContext surfaces watch metrics and the trim assessment', () => {
    const text = buildContext(
      data({
        readiness: {
          date: '2026-07-15',
          energy: 3,
          watch: {
            sleepScore: 55,
            sleepMinutes: 330,
            deepMin: 40,
            restingHr: 60,
            rhrBaseline7d: 52,
            stressAvg: 44,
            pai: 11,
            syncedAt: 0,
          },
        },
      }),
    )
    expect(text).toContain('Watch data (Amazfit Balance)')
    expect(text).toContain('resting HR 60 bpm (7-day avg 52) — ELEVATED')
    expect(text).toContain('score 55/100')
    expect(text).toContain('LOW readiness')
  })
})
