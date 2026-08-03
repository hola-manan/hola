import embeddingsJsonRaw from './knowledge-embeddings.json'
import { KNOWLEDGE, KNOWLEDGE_BY_ID } from './knowledge'
import type { KnowledgeCard } from './domain'
import { usingMock, embedText } from './model'

export interface EmbeddingsData {
  model: string
  dim: number
  taskType: string
  vectors: Record<string, number[]>
}

export const embeddingsJson = embeddingsJsonRaw as unknown as EmbeddingsData

export function normalize(v: number[]): number[] {
  const sumOfSquares = v.reduce((sum, val) => sum + val * val, 0)
  const norm = Math.sqrt(sumOfSquares)
  if (norm === 0) return [...v]
  return v.map((val) => val / norm)
}

export function dot(a: number[], b: number[]): number {
  return a.reduce((sum, val, idx) => sum + val * (b[idx] ?? 0), 0)
}

export function rankByVector(
  queryVec: number[],
  k: number,
  minScore: number
): { id: string; score: number }[] {
  const normQuery = normalize(queryVec)
  const results: { id: string; score: number }[] = []

  for (const [id, vec] of Object.entries(embeddingsJson.vectors)) {
    const score = dot(normQuery, vec)
    if (score >= minScore) {
      results.push({ id, score })
    }
  }

  results.sort((a, b) => b.score - a.score)
  return results.slice(0, k)
}

/**
 * Words that clear the 3-character floor but carry no topical signal. Without
 * these excluded, "Why is my bench stalling?" ranked purely on "why" — which
 * appears in most card bodies — and surfaced a leucine card above the deload one.
 */
const STOPWORDS = new Set([
  'the', 'and', 'but', 'not', 'for', 'with', 'from', 'into', 'about', 'over', 'than', 'then',
  'this', 'that', 'these', 'those', 'there', 'here', 'what', 'when', 'where', 'which', 'who',
  'whom', 'why', 'how', 'should', 'would', 'could', 'can', 'will', 'shall', 'may', 'might',
  'must', 'have', 'has', 'had', 'been', 'being', 'are', 'was', 'were', 'does', 'did', 'doing',
  'you', 'your', 'yours', 'our', 'ours', 'their', 'them', 'they', 'its', 'his', 'her', 'hers',
  'mine', 'any', 'all', 'some', 'more', 'most', 'much', 'many', 'few', 'less', 'least', 'each',
  'every', 'other', 'another', 'such', 'same', 'own', 'both', 'get', 'got', 'out', 'off', 'own',
  'just', 'now', 'still', 'also', 'too', 'very', 'really', 'want', 'need', 'like', 'make',
  'made', 'take', 'good', 'bad', 'best', 'worse', 'worst', 'know', 'think', 'feel', 'right',
  'wrong', 'thing', 'things', 'something', 'anything', 'nothing', 'please', 'thanks',
])

/** A title/tag hit is a topical match; a body hit is often incidental. */
const HEAD_WEIGHT = 3
const BODY_WEIGHT = 1

export function keywordRank(
  query: string,
  k: number
): { id: string; score: number }[] {
  const tokens = [
    ...new Set(
      String(query ?? '')
        .toLowerCase()
        .split(/\W+/)
        .filter((t) => t.length >= 3 && !STOPWORDS.has(t))
    ),
  ]

  if (tokens.length === 0) {
    return []
  }

  const results: { id: string; score: number }[] = []

  for (const card of KNOWLEDGE) {
    const head = `${card.title} ${card.tags.join(' ')}`.toLowerCase()
    const body = card.body.toLowerCase()
    let score = 0
    for (const token of tokens) {
      if (head.includes(token)) score += HEAD_WEIGHT
      else if (body.includes(token)) score += BODY_WEIGHT
    }
    if (score > 0) {
      results.push({ id: card.id, score })
    }
  }

  // id tiebreak keeps the emulator's answers stable run to run
  results.sort((a, b) => b.score - a.score || a.id.localeCompare(b.id))
  return results.slice(0, k)
}

export async function retrieveCards(
  query: string,
  opts?: { k?: number; minScore?: number }
): Promise<KnowledgeCard[]> {
  const k = opts?.k ?? 4
  const minScore = opts?.minScore ?? 0.5

  let rankedIds: { id: string; score: number }[] = []

  if (usingMock) {
    // degrade the same way the vector path does — retrieval must never sink a chat
    try {
      rankedIds = keywordRank(query, k)
    } catch (err) {
      console.error('Error in retrieveCards keyword fallback:', err)
      return []
    }
  } else {
    try {
      const queryVec = await embedText(query, {
        taskType: 'RETRIEVAL_QUERY',
        model: embeddingsJson.model,
        dim: embeddingsJson.dim,
      })
      rankedIds = rankByVector(queryVec, k, minScore)
    } catch (err) {
      console.error('Error in retrieveCards embedding query:', err)
      return []
    }
  }

  const cards: KnowledgeCard[] = []
  for (const item of rankedIds) {
    const card = KNOWLEDGE_BY_ID.get(item.id)
    if (card) {
      cards.push(card)
    }
  }

  return cards
}

export function formatScienceBlock(cards: KnowledgeCard[]): string {
  if (cards.length === 0) return ''

  const blocks = cards.map((card, idx) => {
    // Every source, not just the first: card bodies cite inline (e.g. "(Schoenfeld
    // 2017)") and those citations are often backed by sources[1], so showing only
    // sources[0] left the model citing references it had never been given.
    const lines = (card.sources ?? []).map((s) => `  - ${s.ref} — ${s.url}`)
    const sourceStr = lines.length ? `\nSources:\n${lines.join('\n')}` : ''
    return `[S${idx + 1}] ${card.title} (evidence: ${card.evidence})\n${card.body}${sourceStr}`
  })

  return `=== SCIENCE REFERENCES (peer-reviewed; cite when you use one) ===\n${blocks.join('\n\n')}\n`
}
