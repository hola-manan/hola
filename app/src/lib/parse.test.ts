import { describe, expect, it } from 'vitest'
import { parseSetsText, ParseError } from './parse'

describe('parseSetsText', () => {
  it('parses comma-separated simple sets', () => {
    const sets = parseSetsText('30x8, 30x8, 22.5x6')
    expect(sets).toHaveLength(3)
    expect(sets[0].segments).toEqual([{ weightKg: 30, reps: 8 }])
    expect(sets[2].segments).toEqual([{ weightKg: 22.5, reps: 6 }])
    expect(sets.every((s) => s.type === 'working')).toBe(true)
  })

  it('parses mid-set weight changes with +', () => {
    const [s] = parseSetsText('30x8+22.5x4')
    expect(s.segments).toEqual([
      { weightKg: 30, reps: 8 },
      { weightKg: 22.5, reps: 4 },
    ])
  })

  it('supports the × glyph and loose whitespace', () => {
    const [s] = parseSetsText('  30 × 8 +  22.5×4 ')
    expect(s.segments).toHaveLength(2)
  })

  it('marks w-prefixed sets as warm-ups', () => {
    const sets = parseSetsText('w20x12, 60x5')
    expect(sets[0].type).toBe('warmup')
    expect(sets[0].segments).toEqual([{ weightKg: 20, reps: 12 }])
    expect(sets[1].type).toBe('working')
  })

  it('treats bare reps and x-prefixed reps as bodyweight (0 kg)', () => {
    expect(parseSetsText('x12')[0].segments).toEqual([{ weightKg: 0, reps: 12 }])
    expect(parseSetsText('12')[0].segments).toEqual([{ weightKg: 0, reps: 12 }])
  })

  it('rejects garbage with a pointed error', () => {
    expect(() => parseSetsText('30x8, banana')).toThrow(ParseError)
    expect(() => parseSetsText('30x0')).toThrow(ParseError)
  })

  it('ignores empty chunks from trailing commas', () => {
    expect(parseSetsText('30x8,')).toHaveLength(1)
  })
})
