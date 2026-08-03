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

  // Without stopword filtering, "why"/"what"/"should"/"this" matched almost every
  // card body and drove the ranking — a bench question surfaced a leucine card.
  it('ignores stopwords so ranking is driven by topical terms', () => {
    const results = keywordRank('Why is my bench stalling?', 4)
    expect(results.length).toBeGreaterThan(0)
    // "stalling" is the only topical term; the deload card owns it
    expect(results[0].id).toBe('deload-planned')
    expect(results.map((r) => r.id)).not.toContain('leucine-threshold-per-meal')
  })

  it('returns nothing for a query made entirely of stopwords', () => {
    expect(keywordRank('what should I do about this', 4)).toEqual([])
    expect(keywordRank('hi there', 4)).toEqual([])
  })

  it('weights a title/tag hit above an incidental body mention', () => {
    const results = keywordRank('deload', 5)
    expect(results[0].id).toBe('deload-planned')
  })

  it('never throws on a non-string query', () => {
    expect(() => keywordRank(undefined as unknown as string, 4)).not.toThrow()
    expect(() => keywordRank(42 as unknown as string, 4)).not.toThrow()
    expect(keywordRank(undefined as unknown as string, 4)).toEqual([])
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

  it('non-empty call formats properly with [S1] and sources', () => {
    const dummyCard = KNOWLEDGE[0]
    const output = formatScienceBlock([dummyCard])
    expect(output).toContain('[S1]')
    expect(output).toContain(dummyCard.title)
    expect(output).toContain(`(evidence: ${dummyCard.evidence})`)
    expect(output).toContain(dummyCard.body)
    expect(output).toContain('Sources:')
    expect(output).toContain(dummyCard.sources[0].ref)
    expect(output).toContain(dummyCard.sources[0].url)
  })

  // 19 of 41 cards carry two sources; the prompt forbids citing anything not
  // shown, so dropping sources[1..] made those references uncitable.
  it('emits every source of a multi-source card, not just the first', () => {
    const multi = KNOWLEDGE.find((c) => c.sources.length > 1)
    expect(multi).toBeDefined()
    const output = formatScienceBlock([multi!])
    for (const src of multi!.sources) {
      expect(output).toContain(src.ref)
      expect(output).toContain(src.url)
    }
  })

  // Card bodies carry their own inline citations, e.g. progressive-overload says
  // "(Schoenfeld 2017)" — but that ref is sources[1], so the sources[0]-only
  // block left the model citing a reference it had never been shown, against an
  // instruction that forbids exactly that.
  it('backs an inline body citation that sources[0] does not cover', () => {
    const card = KNOWLEDGE.find((c) => c.id === 'progressive-overload')
    expect(card).toBeDefined()
    expect(card!.body).toContain('(Schoenfeld 2017)')
    expect(card!.sources[0].ref).not.toContain('Schoenfeld')

    const output = formatScienceBlock([card!])
    const sources = output.slice(output.indexOf('Sources:'))
    expect(sources).toContain('Schoenfeld BJ, Ogborn D, Krieger JW')
  })

  it('every inline citation in every card body is backed by a rendered source', () => {
    // the corpus abbreviates this one author in body text
    const alias: Record<string, string> = { ACSM: 'American College of Sports Medicine' }
    const CITE = /\(([A-Z][A-Za-z]+) (\d{4})\)/g

    for (const card of KNOWLEDGE) {
      const cites = [...new Set(card.body.match(CITE) ?? [])]
      if (!cites.length) continue
      const output = formatScienceBlock([card])
      const sources = output.slice(output.indexOf('Sources:'))

      for (const cite of cites) {
        const [, name, year] = /\(([A-Z][A-Za-z]+) (\d{4})\)/.exec(cite)!
        const needle = alias[name] ?? name
        const backing = card.sources.find((s) => s.ref.includes(needle) && s.ref.includes(year))
        expect(backing, `${card.id}: body cites ${cite} with no matching source`).toBeDefined()
        expect(sources, `${card.id}: ${cite} not rendered in the block`).toContain(backing!.ref)
      }
    }
  })
})
