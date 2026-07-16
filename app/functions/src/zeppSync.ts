// Orchestration for the Zepp pull: token caching in Firestore, per-day merge
// into users/{uid}/readiness/{date}, and the meta/wearable status doc.
// A Zepp failure must never break anything else — every entry point degrades
// to a recorded error status.

import { FieldValue, type Firestore } from 'firebase-admin/firestore'
import type { Readiness, WatchMetrics, WearableStatus } from './domain'
import {
  fetchDays,
  loginWithPassword,
  renewAppToken,
  ZeppAuthError,
  type ZeppDay,
  type ZeppTokens,
} from './zepp'

const TOKENS_DOC = 'system/zeppAuth' // outside users/** → invisible to clients
const TZ = 'Asia/Kolkata'

export interface ZeppCreds {
  email: string
  password: string
}

export interface SyncResult {
  status: NonNullable<WearableStatus['lastStatus']>
  dates: string[] // days that received watch data
  problems: string[]
  error?: string
  raw?: unknown // debug mode only
}

/** YYYY-MM-DD in the user's timezone, offset days back from now. */
export function localDate(offsetDays = 0, now = Date.now()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(
    new Date(now - offsetDays * 86_400_000),
  )
}

const clean = <T extends object>(o: T): T => {
  const out = {} as Record<string, unknown>
  for (const [k, v] of Object.entries(o)) if (v !== undefined) out[k] = v
  return out as T
}

/** Cached-token fetch with the renew → full-login recovery chain. */
async function fetchWithAuth(
  db: Firestore,
  creds: ZeppCreds,
  fromDate: string,
  toDate: string,
  debug: boolean,
): Promise<ZeppDay[]> {
  const ref = db.doc(TOKENS_DOC)
  const cached = (await ref.get()).data() as ZeppTokens | undefined
  let tokens = cached?.appToken ? cached : null
  let refreshed = false

  if (!tokens) {
    tokens = await loginWithPassword(creds.email, creds.password)
    refreshed = true
  }
  try {
    for (;;) {
      try {
        const days = await fetchDays(tokens, fromDate, toDate, fetch, { debug })
        if (refreshed) await ref.set(clean(tokens))
        return days
      } catch (e) {
        if (!(e instanceof ZeppAuthError) || refreshed) throw e
        // Dead app token: renew off the login token; if that's dead too, log in fresh.
        try {
          tokens = await renewAppToken(tokens)
        } catch (e2) {
          if (!(e2 instanceof ZeppAuthError)) throw e2
          tokens = await loginWithPassword(creds.email, creds.password)
        }
        refreshed = true
      }
    }
  } catch (e) {
    if (refreshed) await ref.set(clean(tokens)).catch(() => {})
    throw e
  }
}

/**
 * Resting-HR baselines: mean of up to 7 prior days' restingHr, drawing from
 * both already-stored readiness docs and earlier days in this same batch.
 */
function withBaselines(days: ZeppDay[], stored: Map<string, number>): ZeppDay[] {
  const known = new Map(stored)
  for (const d of days) {
    if (d.watch.restingHr !== undefined) {
      const prior = [...known.entries()]
        .filter(([date]) => date < d.date)
        .sort(([a], [b]) => b.localeCompare(a))
        .slice(0, 7)
        .map(([, rhr]) => rhr)
      if (prior.length) {
        d.watch.rhrBaseline7d = Math.round((prior.reduce((s, x) => s + x, 0) / prior.length) * 10) / 10
      }
      known.set(d.date, d.watch.restingHr)
    }
  }
  return days
}

export async function syncZeppForUser(
  db: Firestore,
  uid: string,
  creds: ZeppCreds,
  opts?: { days?: number; debug?: boolean },
): Promise<SyncResult> {
  const span = Math.min(Math.max(opts?.days ?? 3, 1), 14)
  const debug = opts?.debug ?? false
  const fromDate = localDate(span - 1)
  const toDate = localDate(0)
  const userRef = db.collection('users').doc(uid)

  const result: SyncResult = { status: 'no_data', dates: [], problems: [] }
  try {
    const days = await fetchWithAuth(db, creds, fromDate, toDate, debug)

    if (debug) result.raw = days.map((d) => d.raw).find((r) => r !== undefined)

    // Prior resting HRs from stored readiness docs (for the 7-day baseline).
    const priorSnap = await userRef
      .collection('readiness')
      .where('date', '<', fromDate)
      .orderBy('date', 'desc')
      .limit(10)
      .get()
    const priorRhr = new Map<string, number>()
    for (const doc of priorSnap.docs) {
      const r = doc.data() as Readiness
      if (r.watch?.restingHr !== undefined) priorRhr.set(r.date, r.watch.restingHr)
    }

    for (const d of withBaselines(days, priorRhr)) {
      result.problems.push(...d.problems.map((p) => `${d.date}: ${p}`))
      if (!Object.keys(clean(d.watch)).length) continue
      const watch: WatchMetrics = { ...clean(d.watch), syncedAt: Date.now() }
      await userRef
        .collection('readiness')
        .doc(d.date)
        .set({ date: d.date, watch }, { merge: true })
      result.dates.push(d.date)
    }
    result.status = result.dates.length ? 'ok' : 'no_data'
  } catch (e) {
    result.status = e instanceof ZeppAuthError ? 'auth_error' : 'api_error'
    result.error = (e as Error).message?.slice(0, 300) ?? String(e)
    console.error(`zepp sync failed for ${uid}:`, e)
  }

  await userRef
    .collection('meta')
    .doc('wearable')
    .set(
      {
        lastSyncAt: Date.now(),
        lastStatus: result.status,
        lastError: result.error ?? FieldValue.delete(),
        ...(result.dates.length ? { lastDataDate: result.dates[result.dates.length - 1] } : {}),
      },
      { merge: true },
    )
    .catch((e) => console.error('zepp status write failed:', e))

  return result
}

/** Nightly entry point: sync every user that enabled the wearable. Never throws. */
export async function runNightlySync(db: Firestore, creds: ZeppCreds): Promise<void> {
  let userRefs
  try {
    userRefs = await db.collection('users').listDocuments()
  } catch (e) {
    console.error('zepp nightly: user listing failed:', e)
    return
  }
  for (const ref of userRefs) {
    try {
      const wearable = (await ref.collection('meta').doc('wearable').get()).data() as
        | WearableStatus
        | undefined
      if (!wearable?.enabled || wearable.provider !== 'zepp') continue
      const res = await syncZeppForUser(db, ref.id, creds)
      console.log(`zepp nightly ${ref.id}: ${res.status} (${res.dates.join(',') || 'no days'})`)
    } catch (e) {
      console.error(`zepp nightly ${ref.id} crashed:`, e)
    }
  }
}
