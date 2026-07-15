import type { Segment, WorkoutSet } from '../types'

/**
 * Parse compact bulk-entry text for one exercise into sets.
 *
 * Grammar (whitespace-tolerant, case-insensitive):
 *   sets are separated by commas:            "30x8, 30x8, 22.5x6"
 *   segments within a set are joined by '+': "30x8+22.5x4"
 *   'x' or '×' separates weight and reps
 *   a leading 'w' marks a warm-up set:       "w20x12, 60x5"
 *   bare reps (no weight) = bodyweight/0kg:  "x12" or "12"
 */
export function parseSetsText(text: string): WorkoutSet[] {
  const sets: WorkoutSet[] = []
  const chunks = text
    .split(',')
    .map((c) => c.trim())
    .filter(Boolean)

  for (const chunk of chunks) {
    let body = chunk
    let type: WorkoutSet['type'] = 'working'
    if (/^w\s*/i.test(body) && !/^w\s*$/i.test(body)) {
      type = 'warmup'
      body = body.replace(/^w\s*/i, '')
    }
    const segTexts = body
      .split('+')
      .map((s) => s.trim())
      .filter(Boolean)
    if (segTexts.length === 0) throw new ParseError(chunk)

    const segments: Segment[] = segTexts.map((segText) => {
      const m = segText.match(/^(?:(\d+(?:\.\d+)?)\s*)?[x×]\s*(\d+)$/i) // "30x8" or "x12"
      if (m) return { weightKg: m[1] ? parseFloat(m[1]) : 0, reps: parseInt(m[2], 10) }
      const bare = segText.match(/^(\d+)$/) // bare reps: "12"
      if (bare) return { weightKg: 0, reps: parseInt(bare[1], 10) }
      throw new ParseError(segText)
    })
    if (segments.some((s) => s.reps <= 0)) throw new ParseError(chunk)
    sets.push({ id: crypto.randomUUID(), segments, type })
  }
  return sets
}

export class ParseError extends Error {
  readonly fragment: string
  constructor(fragment: string) {
    super(`Couldn't read "${fragment}" — use formats like 30x8, 22.5x6 or 30x8+22.5x4`)
    this.fragment = fragment
  }
}
