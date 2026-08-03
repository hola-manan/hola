import { describe, expect, it } from 'vitest'
import { appendSetToken, parseSetsText, ParseError } from './parse'

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

describe('appendSetToken', () => {
  it("'+' joins a segment onto the current set rather than starting a new one", () => {
    expect(appendSetToken('30x8', '+')).toBe('30x8+')
    const [s] = parseSetsText(appendSetToken('30x8', '+') + '22.5x4')
    expect(s.segments).toEqual([
      { weightKg: 30, reps: 8 },
      { weightKg: 22.5, reps: 4 },
    ])
  })

  it("'w' starts a new warm-up set, comma-separated", () => {
    expect(appendSetToken('30x8', 'w')).toBe('30x8, w')
    expect(appendSetToken('', 'w')).toBe('w')
    const sets = parseSetsText(appendSetToken('60x5', 'w') + '20x12')
    expect(sets).toHaveLength(2)
    expect(sets[1].type).toBe('warmup')
  })

  it("never emits a dangling '+' that the parser would reject", () => {
    expect(appendSetToken('', '+')).toBe('')
    expect(appendSetToken('30x8+', '+')).toBe('30x8+')
    expect(() => parseSetsText(appendSetToken('30x8', '+') || '30x8')).not.toThrow()
  })

  it('does not double up separators', () => {
    expect(appendSetToken('30x8, ', 'w')).toBe('30x8, w')
    expect(appendSetToken('30x8,', 'w')).toBe('30x8,w')
  })
})
