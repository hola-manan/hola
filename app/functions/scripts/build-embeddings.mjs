// Precompute Vertex AI embeddings for every knowledge card, so the coach's
// runtime retrieval only has to embed the user's query (41 card vectors are
// bundled). Run from app/functions with GCP ADC available:
//
//   GCLOUD_PROJECT=gymm-fd071 npm run build:embeddings
//
// Output: app/functions/src/knowledge-embeddings.json
//   { model, dim, taskType, builtAt, vectors: { [cardId]: number[] } }
// Vectors are L2-normalized (unit length) so cosine similarity == dot product,
// and because Google recommends normalizing gemini-embedding-001 output when
// outputDimensionality < 3072 (Matryoshka truncation).

import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { GoogleGenAI } from '@google/genai'

const __dirname = dirname(fileURLToPath(import.meta.url))
const KNOWLEDGE = join(__dirname, '..', 'src', 'knowledge.json')
const OUT = join(__dirname, '..', 'src', 'knowledge-embeddings.json')

const MODEL = process.env.EMBED_MODEL ?? 'gemini-embedding-001'
const DIM = Number(process.env.EMBED_DIM ?? 768)
const TASK_TYPE = 'RETRIEVAL_DOCUMENT'
const project = process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT
const location = process.env.GEMINI_LOCATION ?? 'us-central1'

if (!project) {
  console.error('Set GCLOUD_PROJECT (the Vertex project) before running.')
  process.exit(1)
}

/** Text that represents a card for retrieval: its title plus body. */
const cardText = (c) => `${c.title}\n\n${c.body}`

const normalize = (v) => {
  const norm = Math.sqrt(v.reduce((s, x) => s + x * x, 0)) || 1
  return v.map((x) => x / norm)
}

const cards = JSON.parse(readFileSync(KNOWLEDGE, 'utf-8'))
const ai = new GoogleGenAI({ vertexai: true, project, location })

const vectors = {}
for (const c of cards) {
  const res = await ai.models.embedContent({
    model: MODEL,
    contents: [cardText(c)],
    config: { taskType: TASK_TYPE, outputDimensionality: DIM },
  })
  const values = res.embeddings?.[0]?.values
  if (!Array.isArray(values) || values.length !== DIM) {
    console.error(`Bad embedding for ${c.id}: got ${values?.length} dims (want ${DIM})`)
    process.exit(1)
  }
  vectors[c.id] = normalize(values)
  process.stdout.write('.')
}
process.stdout.write('\n')

writeFileSync(
  OUT,
  JSON.stringify({ model: MODEL, dim: DIM, taskType: TASK_TYPE, builtAt: new Date().toISOString(), vectors }, null, 2),
  'utf-8',
)
console.log(`Wrote ${Object.keys(vectors).length} card embeddings (${MODEL}, ${DIM}-dim) to knowledge-embeddings.json`)
