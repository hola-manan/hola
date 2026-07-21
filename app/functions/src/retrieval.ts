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

export function keywordRank(
  query: string,
  k: number
): { id: string; score: number }[] {
  const tokens = query
    .toLowerCase()
    .split(/\W+/)
    .filter((t) => t.length >= 3)

  if (tokens.length === 0) {
    return []
  }

  const results: { id: string; score: number }[] = []

  for (const card of KNOWLEDGE) {
    const content = `${card.title} ${card.tags.join(' ')} ${card.body}`.toLowerCase()
    let score = 0
    for (const token of tokens) {
      if (content.includes(token)) {
        score++
      }
    }
    if (score > 0) {
      results.push({ id: card.id, score })
    }
  }

  results.sort((a, b) => b.score - a.score)
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
    rankedIds = keywordRank(query, k)
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
    const sourceStr =
      card.sources && card.sources[0]
        ? `\nSource: ${card.sources[0].ref} — ${card.sources[0].url}`
        : ''
    return `[S${idx + 1}] ${card.title} (evidence: ${card.evidence})\n${card.body}${sourceStr}`
  })

  return `=== SCIENCE REFERENCES (peer-reviewed; cite when you use one) ===\n${blocks.join('\n\n')}\n`
}
