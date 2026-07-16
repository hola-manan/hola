import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  setDoc,
  orderBy,
  type DocumentData,
} from 'firebase/firestore'
import { db } from './firebase'
import type { Cycle, Exercise, Preset, Profile, Readiness, Workout, WearableStatus } from '../types'
import type { Report, WeeklySummary } from './ai'

// Firestore layout (single user):
//   users/{uid}/workouts/{id}
//   users/{uid}/presets/{id}
//   users/{uid}/customExercises/{id}
//   users/{uid}/meta/cycle
//   users/{uid}/meta/profile

const userDoc = (uid: string, ...path: string[]) => doc(db, 'users', uid, ...path)
const userCol = (uid: string, name: string) => collection(db, 'users', uid, name)

/** Firestore rejects `undefined` — strip it (deep) before writing. */
export function stripUndefined<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

export const repo = {
  saveWorkout: (uid: string, w: Workout) =>
    setDoc(userDoc(uid, 'workouts', w.id), stripUndefined(w)),
  deleteWorkout: (uid: string, id: string) => deleteDoc(userDoc(uid, 'workouts', id)),

  savePreset: (uid: string, p: Preset) => setDoc(userDoc(uid, 'presets', p.id), stripUndefined(p)),
  deletePreset: (uid: string, id: string) => deleteDoc(userDoc(uid, 'presets', id)),

  saveCustomExercise: (uid: string, e: Exercise) =>
    setDoc(userDoc(uid, 'customExercises', e.id), stripUndefined(e)),

  saveCycle: (uid: string, c: Cycle) => setDoc(userDoc(uid, 'meta', 'cycle'), stripUndefined(c)),
  clearCycle: (uid: string) => deleteDoc(userDoc(uid, 'meta', 'cycle')),
  saveProfile: (uid: string, p: Profile) =>
    setDoc(userDoc(uid, 'meta', 'profile'), stripUndefined(p)),
  saveWearable: (uid: string, w: Partial<WearableStatus>) =>
    setDoc(userDoc(uid, 'meta', 'wearable'), stripUndefined(w), { merge: true }),

  saveReadiness: (uid: string, r: Partial<Readiness> & { date: string }) =>
    setDoc(userDoc(uid, 'readiness', r.date), stripUndefined(r), { merge: true }),
}

export interface Subscriptions {
  workouts: (uid: string, cb: (w: Workout[]) => void) => () => void
  presets: (uid: string, cb: (p: Preset[]) => void) => () => void
  customExercises: (uid: string, cb: (e: Exercise[]) => void) => () => void
  cycle: (uid: string, cb: (c: Cycle | null) => void) => () => void
  profile: (uid: string, cb: (p: Profile | null) => void) => () => void
  wearable: (uid: string, cb: (w: WearableStatus | null) => void) => () => void
}

const colData = <T>(uid: string, name: string, order: string | null, cb: (items: T[]) => void) => {
  const base = userCol(uid, name)
  const q = order ? query(base, orderBy(order, 'desc')) : base
  return onSnapshot(q, (snap) => cb(snap.docs.map((d) => d.data() as T)))
}

const docData = <T>(uid: string, path: string[], cb: (item: T | null) => void) =>
  onSnapshot(userDoc(uid, ...path), (snap) =>
    cb(snap.exists() ? ((snap.data() as DocumentData) as T) : null),
  )

export const subscriptions: Subscriptions = {
  workouts: (uid, cb) => colData<Workout>(uid, 'workouts', 'startedAt', cb),
  presets: (uid, cb) => colData<Preset>(uid, 'presets', 'updatedAt', cb),
  customExercises: (uid, cb) => colData<Exercise>(uid, 'customExercises', null, cb),
  cycle: (uid, cb) => docData<Cycle>(uid, ['meta', 'cycle'], cb),
  profile: (uid, cb) => docData<Profile>(uid, ['meta', 'profile'], cb),
  wearable: (uid, cb) => docData<WearableStatus>(uid, ['meta', 'wearable'], cb),
}

export const aiSubscriptions = {
  report: (uid: string, workoutId: string, cb: (r: Report | null) => void) =>
    docData<Report>(uid, ['reports', workoutId], cb),
  summaries: (uid: string, cb: (s: WeeklySummary[]) => void) =>
    colData<WeeklySummary>(uid, 'summaries', 'createdAt', cb),
  readinessToday: (uid: string, date: string, cb: (r: Readiness | null) => void) =>
    docData<Readiness>(uid, ['readiness', date], cb),
}
