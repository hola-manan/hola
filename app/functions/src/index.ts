import { initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { HttpsError, onCall } from 'firebase-functions/v2/https'
import type { CatalogEntry, Cycle, Profile, Readiness, Workout } from './domain'
import { buildContext, CATALOG, describeWorkout, getISOWeek, type UserData } from './context'
import { generateDraft, validateDraft, type WorkoutDraft } from './creator'
import { generateJson, generateText, usingMock } from './model'
import { mockChat, mockReport, mockWeeklySummary } from './mocks'
import { defineSecret } from 'firebase-functions/params'
import { onSchedule } from 'firebase-functions/v2/scheduler'
import { syncZeppForUser, runNightlySync } from './zeppSync'

const zeppEmail = defineSecret('ZEPP_EMAIL')
const zeppPassword = defineSecret('ZEPP_PASSWORD')

initializeApp()
const db = getFirestore()

const SYSTEM = `You are a knowledgeable, encouraging personal strength coach inside a gym tracking app.
Ground every statement in the provided context (workouts, estimated 1RMs, cycle, readiness, profile).
Always respect the MUST-RESPECT NOTES. Weights are in kg. Be concrete and concise; no generic filler.`

async function loadUserData(uid: string): Promise<UserData> {
  const userRef = db.collection('users').doc(uid)
  const today = new Date().toISOString().slice(0, 10)
  const [profileSnap, cycleSnap, readinessSnap, workoutsSnap, customExSnap, readinessHistorySnap] = await Promise.all([
    userRef.collection('meta').doc('profile').get(),
    userRef.collection('meta').doc('cycle').get(),
    userRef.collection('readiness').doc(today).get(),
    userRef.collection('workouts').orderBy('startedAt', 'desc').limit(60).get(),
    userRef.collection('customExercises').get(),
    userRef.collection('readiness').orderBy('date', 'desc').limit(7).get(),
  ])
  return {
    profile: (profileSnap.data() as Profile | undefined) ?? null,
    cycle: (cycleSnap.data() as Cycle | undefined) ?? null,
    readiness: (readinessSnap.data() as Readiness | undefined) ?? null,
    readinessHistory: readinessHistorySnap.docs.map((d) => d.data() as Readiness),
    workouts: workoutsSnap.docs
      .map((d) => d.data() as Workout)
      .filter((w) => w.status === 'completed'),
    customExercises: customExSnap.docs.map((d) => d.data() as CatalogEntry),
  }
}

const requireAuth = (uid: string | undefined): string => {
  if (!uid) throw new HttpsError('unauthenticated', 'Sign in first.')
  return uid
}

/** Post-workout report; stored so the workout detail screen can re-show it. */
export const generateReport = onCall(async (req) => {
  const uid = requireAuth(req.auth?.uid)
  const workoutId = String(req.data?.workoutId ?? '')
  if (!workoutId) throw new HttpsError('invalid-argument', 'workoutId required')

  const snap = await db.doc(`users/${uid}/workouts/${workoutId}`).get()
  const workout = snap.data() as Workout | undefined
  if (!workout || workout.status !== 'completed') {
    throw new HttpsError('not-found', 'completed workout not found')
  }
  const data = await loadUserData(uid)

  const catalogMap = new Map()
  for (const c of CATALOG) catalogMap.set(c.id, c)
  for (const c of data.customExercises) catalogMap.set(c.id, c)

  const text = usingMock
    ? mockReport(data, workout)
    : await generateText(
        SYSTEM,
        `${buildContext(data)}\n\n=== TASK ===\nWrite a post-workout report (max ~180 words) for THIS workout:\n${describeWorkout(
          workout,
          catalogMap
        )}\n\nCover: what improved vs the last comparable (${workout.cycleDay ?? 'similar'}) session, estimated-1RM changes, muscle groups trending up or lagging, a recovery note if readiness data suggests one, and exactly ONE concrete suggestion for next time.`,
      )

  const report = { workoutId, text, createdAt: Date.now() }
  await db.doc(`users/${uid}/reports/${workoutId}`).set(report)
  return report
})

export const generateWeeklySummary = onCall(async (req) => {
  const uid = requireAuth(req.auth?.uid)
  const data = await loadUserData(uid)

  const text = usingMock
    ? mockWeeklySummary(data)
    : await generateText(
        SYSTEM,
        `${buildContext(data)}\n\n=== TASK ===\nWrite this week's training summary (max ~150 words): volume balance across muscle groups vs what the cycle intends, adherence, and any imbalances to flag (call out under-trained muscles by name).`,
      )

  const now = new Date()
  const week = `${now.getFullYear()}-W${String(getISOWeek(now)).padStart(2, '0')}`
  const summary = { week, text, createdAt: Date.now() }
  await db.doc(`users/${uid}/summaries/${week}`).set(summary)
  return summary
})

interface ChatMessage {
  role: 'user' | 'assistant'
  text: string
}

export const coachChat = onCall(async (req) => {
  const uid = requireAuth(req.auth?.uid)
  const messages = (Array.isArray(req.data?.messages) ? req.data.messages : []) as ChatMessage[]
  const trimmed = messages.slice(-12)
  if (!trimmed.length || trimmed[trimmed.length - 1].role !== 'user') {
    throw new HttpsError('invalid-argument', 'messages must end with a user message')
  }
  const data = await loadUserData(uid)

  if (usingMock) {
    return { text: mockChat(data, trimmed[trimmed.length - 1].text) }
  }
  const transcript = trimmed
    .map((m) => `${m.role === 'user' ? 'USER' : 'COACH'}: ${m.text.slice(0, 2000)}`)
    .join('\n')
  const text = await generateText(
    SYSTEM,
    `${buildContext(data)}\n\n=== CONVERSATION ===\n${transcript}\n\nReply as COACH (max ~150 words).`,
  )
  return { text }
})

export const createWorkout = onCall(async (req) => {
  const uid = requireAuth(req.auth?.uid)
  const instruction = String(req.data?.instruction ?? '').slice(0, 500)
  const data = await loadUserData(uid)

  if (usingMock) {
    return generateDraft(data, instruction)
  }

  const catalogList = [
    ...CATALOG,
    ...data.customExercises,
  ].map(
    (e) => `${e.id} | ${e.name} | ${e.primaryMuscles.join('/')} | ${e.equipment}`,
  ).join('\n')
  let draft: WorkoutDraft
  try {
    const raw = await generateJson(
      SYSTEM,
      `${buildContext(data)}\n\n=== EXERCISE CATALOG (id | name | primary muscles | equipment) ===\n${catalogList}\n\n=== TASK ===\nCreate today's complete workout for the user's current cycle day. Progressive overload: nudge weights/reps up where the last comparable session hit its targets; bring up lagging muscle groups; respect MUST-RESPECT NOTES; if readiness is poor, reduce intensity ~10-15%.${
        instruction ? `\nUser instruction for this workout: "${instruction}"` : ''
      }\n\nReturn ONLY JSON: {"name": string, "cycleDay": string, "exercises": [{"exerciseId": catalog id, "rationale": one short sentence, "restSeconds": number, "sets": [{"weightKg": number, "reps": number}]}]} with 4-7 exercises in sensible order (compounds first).`,
    )
    draft = validateDraft(raw, data.workouts)
  } catch (err) {
    // Model unavailable or returned garbage: fall back to the rule-based draft.
    console.error('createWorkout falling back to rule-based draft:', err)
    draft = generateDraft(data, instruction)
  }
  return draft
})

export const syncZepp = onCall(
  { secrets: [zeppEmail, zeppPassword] },
  async (req) => {
    const uid = requireAuth(req.auth?.uid)
    const creds = { email: zeppEmail.value(), password: zeppPassword.value() }
    const days = Number(req.data?.days)
    const result = await syncZeppForUser(db, uid, creds, {
      days: Number.isFinite(days) ? days : undefined,
      debug: !!req.data?.debug,
    })
    if (result.status !== 'ok' && result.status !== 'no_data') {
      throw new HttpsError('internal', `Sync failed: ${result.error}`)
    }
    return result
  }
)

/** Nightly Zepp pull for every wearable-enabled user; two runs absorb late phone syncs. */
export const zeppNightlySync = onSchedule(
  {
    schedule: '30 6,10 * * *',
    timeZone: 'Asia/Kolkata',
    secrets: [zeppEmail, zeppPassword],
    timeoutSeconds: 300,
  },
  async () => {
    await runNightlySync(db, { email: zeppEmail.value(), password: zeppPassword.value() })
  },
)
