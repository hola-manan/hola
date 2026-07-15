import { connectFunctionsEmulator, getFunctions, httpsCallable } from 'firebase/functions'
import { getApp } from 'firebase/app'
import { usingEmulators } from './firebase'
import type { WorkoutDraft } from '../types'

const functions = getFunctions(getApp())
if (usingEmulators) {
  connectFunctionsEmulator(functions, '127.0.0.1', 5001)
}

export interface Report {
  workoutId: string
  text: string
  createdAt: number
}
export interface WeeklySummary {
  week: string
  text: string
  createdAt: number
}
export interface ChatMessage {
  role: 'user' | 'assistant'
  text: string
}

const call =
  <TReq, TRes>(name: string) =>
  async (data: TReq): Promise<TRes> => {
    const fn = httpsCallable(functions, name)
    const res = await fn(data)
    return res.data as TRes
  }

export const ai = {
  generateReport: call<{ workoutId: string }, Report>('generateReport'),
  generateWeeklySummary: call<Record<string, never>, WeeklySummary>('generateWeeklySummary'),
  coachChat: call<{ messages: ChatMessage[] }, { text: string }>('coachChat'),
  createWorkout: call<{ instruction?: string }, WorkoutDraft>('createWorkout'),
}
