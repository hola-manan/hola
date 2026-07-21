import { describe, expect, it } from 'vitest'
import {
  normalize,
  dot,
  rankByVector,
  keywordRank,
  embeddingsJson,
  formatScienceBlock,
} from './retrieval'
import { KNOWLEDGE } from './knowledge'

describe('vector helpers', () => {
  it('normalize produces a unit vector and dot with itself is ≈ 1', () => {
    const v = [3, 4, 0, -12]
    const normV = normalize(v)
    const sumOfSquares = normV.reduce((s, val) => s + val * val, 0)
    expect(sumOfSquares).toBeCloseTo(1, 5)

    const selfDot = dot(normV, normV)
    expect(selfDot).toBeCloseTo(1, 5)
  })

  it('normalize handles zero vector without crashing', () => {
    const v = [0, 0, 0]
    const normV = normalize(v)
    expect(normV).toEqual([0, 0, 0])
  })
})

describe('rankByVector', () => {
  it('known card vector ranks first with score ≈ 1, minScore filters, and k caps count', () => {
    const cardIds = Object.keys(embeddingsJson.vectors)
    expect(cardIds.length).toBeGreaterThan(0)
    const targetId = cardIds[0]
    const targetVec = embeddingsJson.vectors[targetId]

    const results = rankByVector(targetVec, 5, 0.5)
    expect(results.length).toBeGreaterThan(0)
    expect(results[0].id).toBe(targetId)
    expect(results[0].score).toBeCloseTo(1, 4)

    const highMinResults = rankByVector(targetVec, 5, 0.999)
    expect(highMinResults.length).toBe(1)
    expect(highMinResults[0].id).toBe(targetId)

    const impossiblyHighResults = rankByVector(targetVec, 5, 1.01)
    expect(impossiblyHighResults.length).toBe(0)

    const kCappedResults = rankByVector(targetVec, 2, 0.1)
    expect(kCappedResults.length).toBeLessThanOrEqual(2)
  })
})

describe('keywordRank', () => {
  it('a query like "how much protein on a cut" returns nutrition card ids', () => {
    const results = keywordRank('how much protein on a cut', 5)
    expect(results.length).toBeGreaterThan(0)
    const ids = results.map((r) => r.id)
    const expectedMatch = ids.some(
      (id) => id.includes('protein') || id.includes('cut') || id.includes('deficit')
    )
    expect(expectedMatch).toBe(true)
  })
})

describe('Index integrity', () => {
  it('embeddingsJson.vectors has exactly one entry per KNOWLEDGE id', () => {
    const cardIds = KNOWLEDGE.map((c) => c.id)
    const vectorIds = Object.keys(embeddingsJson.vectors)

    expect(vectorIds.length).toBe(cardIds.length)
    for (const id of cardIds) {
      expect(embeddingsJson.vectors[id]).toBeDefined()
    }
  })

  it('every vector length matches embeddingsJson.dim and is unit-normalized within 1e-3', () => {
    const dim = embeddingsJson.dim
    expect(dim).toBe(768)
    for (const vec of Object.values(embeddingsJson.vectors)) {
      expect(vec.length).toBe(dim)
      const sumOfSquares = vec.reduce((s, val) => s + val * val, 0)
      expect(sumOfSquares).toBeCloseTo(1, 3) // within 1e-3
    }
  })
})

describe('formatScienceBlock', () => {
  it('formatScienceBlock([]) is empty string', () => {
    expect(formatScienceBlock([])).toBe('')
  })

  it('non-empty call formats properly with [S1] and Source:', () => {
    const dummyCard = KNOWLEDGE[0]
    const output = formatScienceBlock([dummyCard])
    expect(output).toContain('[S1]')
    expect(output).toContain(dummyCard.title)
    expect(output).toContain(`(evidence: ${dummyCard.evidence})`)
    expect(output).toContain(dummyCard.body)
    expect(output).toContain('Source:')
    expect(output).toContain(dummyCard.sources[0].ref)
    expect(output).toContain(dummyCard.sources[0].url)
  })
})
