// Gemini 2.5 Flash via Vertex AI, with a deterministic mock in the emulator
// (no GCP credentials needed for local dev/tests; set MOCK_LLM=0 to force real
// calls even in the emulator once credentials exist).

import { GoogleGenAI } from '@google/genai'

export const usingMock =
  process.env.MOCK_LLM === '1' ||
  (process.env.FUNCTIONS_EMULATOR === 'true' && process.env.MOCK_LLM !== '0')

let client: GoogleGenAI | null = null
function genai(): GoogleGenAI {
  if (!client) {
    client = new GoogleGenAI({
      vertexai: true,
      project: process.env.GCLOUD_PROJECT,
      location: process.env.GEMINI_LOCATION ?? 'global',
    })
  }
  return client
}

const MODEL = process.env.GEMINI_MODEL ?? 'gemini-2.5-flash'

export async function generateText(system: string, user: string): Promise<string> {
  const res = await genai().models.generateContent({
    model: MODEL,
    contents: [{ role: 'user', parts: [{ text: user }] }],
    config: { systemInstruction: system, temperature: 0.6 },
  })
  const text = res.text
  if (!text) throw new Error('empty model response')
  return text
}

/** JSON-mode generation; caller validates/repairs the parsed object. */
export async function generateJson(system: string, user: string): Promise<unknown> {
  const res = await genai().models.generateContent({
    model: MODEL,
    contents: [{ role: 'user', parts: [{ text: user }] }],
    config: {
      systemInstruction: system,
      temperature: 0.4,
      responseMimeType: 'application/json',
    },
  })
  const text = res.text
  if (!text) throw new Error('empty model response')
  return JSON.parse(text)
}

export async function embedText(
  text: string,
  { taskType, model, dim }: { taskType: any; model: string; dim: number }
): Promise<number[]> {
  const res = await genai().models.embedContent({
    model,
    contents: [text],
    config: {
      taskType,
      outputDimensionality: dim,
    },
  })
  const values = res.embeddings?.[0]?.values
  if (!values || !values.length) {
    throw new Error('empty embedding response')
  }
  return values
}

