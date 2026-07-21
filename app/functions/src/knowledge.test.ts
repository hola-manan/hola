import { describe, expect, it } from 'vitest'
import { KNOWLEDGE } from './knowledge'
import { MUSCLE_RANGES } from './volumeTargets'

describe('knowledge corpus integrity', () => {
  it('has at least 40 cards and all IDs are unique', () => {
    expect(KNOWLEDGE.length).toBeGreaterThanOrEqual(40)

    const ids = KNOWLEDGE.map(card => card.id)
    const uniqueIds = new Set(ids)
    expect(uniqueIds.size).toBe(ids.length)
  })

  it('has valid card structure and fields', () => {
    const allowedDomains = new Set(['hypertrophy', 'programming', 'recovery', 'nutrition'])
    const allowedEvidence = new Set(['strong', 'moderate', 'emerging'])
    const muscleKeys = Object.keys(MUSCLE_RANGES)

    for (const card of KNOWLEDGE) {
      expect(card.id).toBeTruthy()
      expect(card.id.trim()).toBe(card.id)

      expect(card.title).toBeTruthy()
      expect(card.title.trim()).toBe(card.title)

      expect(card.body).toBeTruthy()
      expect(card.body.trim()).toBe(card.body)

      expect(allowedDomains.has(card.domain)).toBe(true)
      expect(allowedEvidence.has(card.evidence)).toBe(true)

      // Sources validation
      expect(card.sources.length).toBeGreaterThanOrEqual(1)
      for (const src of card.sources) {
        expect(src.ref).toBeTruthy()
        expect(src.ref.trim()).toBe(src.ref)

        expect(src.url).toBeTruthy()
        expect(src.url.trim()).toBe(src.url)
        expect(src.url.startsWith('http')).toBe(true)
      }

      // Muscles validation
      for (const m of card.muscles) {
        if (m !== 'all') {
          expect(muscleKeys.includes(m)).toBe(true)
        }
      }
    }
  })
})
