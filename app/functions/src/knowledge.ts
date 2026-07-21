import knowledgeJson from './knowledge.json'
import type { KnowledgeCard } from './domain'

export const KNOWLEDGE: KnowledgeCard[] = knowledgeJson as KnowledgeCard[]
export const KNOWLEDGE_BY_ID = new Map(KNOWLEDGE.map((c) => [c.id, c]))
