// Zepp (Huami) cloud client — the API the Zepp phone app itself uses.
// There is no official public API; this follows the community-documented flow
// (huami-token / Gadgetbridge lineage). Everything here is defensive: the
// payload shapes may change under us, so parsers never throw — they return
// whatever they recognized plus a list of problems.

import type { WatchMetrics } from './domain'

export class ZeppAuthError extends Error {}
export class ZeppApiError extends Error {}

export interface ZeppTokens {
  appToken: string
  loginToken: string
  userId: string
  apiHost: string
  obtainedAt: number // epoch ms
}

/** One calendar day of parsed watch data. */
export interface ZeppDay {
  date: string // YYYY-MM-DD
  watch: Partial<WatchMetrics>
  problems: string[]
  raw?: unknown
}

type Fetch = typeof fetch

const APP_NAME = 'com.xiaomi.hm.health'
const APP_VERSION = '6.9.5'
// Stable per-install id; Zepp only requires it to be consistent, not real.
const DEVICE_ID = '02:00:00:00:00:02'
const DEFAULT_API_HOST = 'api-mifit.huami.com'

const form = (fields: Record<string, string>) => new URLSearchParams(fields).toString()

const FORM_HEADERS = {
  'content-type': 'application/x-www-form-urlencoded;charset=UTF-8',
  'user-agent': `MiFit/${APP_VERSION} (Android; 13; Zepp)`,
}

/** Email+password → tokens. Zepp rate-limits logins; callers should cache the result. */
export async function loginWithPassword(
  email: string,
  password: string,
  f: Fetch = fetch,
): Promise<ZeppTokens> {
  // Step 1: exchange credentials for a short-lived access code (arrives in a redirect).
  const res1 = await f(
    `https://api-user.huami.com/registrations/${encodeURIComponent(email)}/tokens`,
    {
      method: 'POST',
      redirect: 'manual',
      headers: FORM_HEADERS,
      body: form({
        state: 'REDIRECTION',
        client_id: 'HuaMi',
        password,
        redirect_uri: 'https://s3-us-west-2.amazonaws.com/hm-registration/successsignin.html',
        region: 'us-west-2',
        token: 'access',
      }),
    },
  )
  const location = res1.headers.get('location') ?? ''
  let access = ''
  let countryCode = ''
  try {
    const q = new URL(location).searchParams
    access = q.get('access') ?? ''
    countryCode = q.get('country_code') ?? ''
    if (q.get('error')) throw new ZeppAuthError(`zepp login rejected: ${q.get('error')}`)
  } catch (e) {
    if (e instanceof ZeppAuthError) throw e
    // fall through to the !access check below
  }
  if (!access) {
    throw new ZeppAuthError(
      `zepp login gave no access code (status ${res1.status}, location ${location.slice(0, 120) || 'missing'})`,
    )
  }

  // Step 2: trade the access code for login/app tokens.
  const res2 = await f('https://account.huami.com/v2/client/login', {
    method: 'POST',
    headers: FORM_HEADERS,
    body: form({
      app_name: APP_NAME,
      app_version: APP_VERSION,
      code: access,
      country_code: countryCode || 'US',
      device_id: DEVICE_ID,
      device_model: 'android_phone',
      grant_type: 'access_token',
      third_name: 'huami',
      allow_registration: 'false',
      dn: 'account.huami.com,api-user.huami.com,api-mifit.huami.com,app-analytics.huami.com',
      source: `${APP_NAME}:${APP_VERSION}:50900`,
      lang: 'en',
      os_version: '1.5.0',
    }),
  })
  if (!res2.ok) throw new ZeppAuthError(`zepp client/login failed: HTTP ${res2.status}`)
  const body = (await res2.json().catch(() => null)) as Record<string, unknown> | null
  const tokenInfo = (body?.token_info ?? null) as Record<string, unknown> | null
  const loginToken = String(tokenInfo?.login_token ?? '')
  const appToken = String(tokenInfo?.app_token ?? '')
  const userId = String(tokenInfo?.user_id ?? '')
  if (!loginToken || !appToken || !userId) {
    throw new ZeppAuthError('zepp client/login response missing token_info')
  }
  return {
    appToken,
    loginToken,
    userId,
    apiHost: resolveApiHost(body),
    obtainedAt: Date.now(),
  }
}

/** Regional API host: env override > login response hint > default. */
function resolveApiHost(loginBody: Record<string, unknown> | null): string {
  if (process.env.ZEPP_API_HOST) return process.env.ZEPP_API_HOST
  // The login response sometimes carries a domains/hosts hint; look for an api-mifit host.
  const scan = (v: unknown): string | null => {
    if (typeof v === 'string' && /^api-mifit[\w-]*\.huami\.com$/.test(v)) return v
    if (Array.isArray(v)) for (const x of v) { const hit = scan(x); if (hit) return hit }
    if (v && typeof v === 'object') for (const x of Object.values(v)) { const hit = scan(x); if (hit) return hit }
    return null
  }
  return scan(loginBody) ?? DEFAULT_API_HOST
}

/** Refresh the app token off the long-lived login token (no password involved). */
export async function renewAppToken(t: ZeppTokens, f: Fetch = fetch): Promise<ZeppTokens> {
  const res = await f(
    `https://account.huami.com/v1/client/app_tokens?app_name=${APP_NAME}` +
      `&dn=api-user.huami.com,api-mifit.huami.com,app-analytics.huami.com` +
      `&login_token=${encodeURIComponent(t.loginToken)}&os_version=1.5.0`,
    { headers: { 'user-agent': FORM_HEADERS['user-agent'] } },
  )
  if (res.status === 401 || res.status === 403) {
    throw new ZeppAuthError(`zepp login token rejected: HTTP ${res.status}`)
  }
  if (!res.ok) throw new ZeppApiError(`zepp app_tokens failed: HTTP ${res.status}`)
  const body = (await res.json().catch(() => null)) as Record<string, unknown> | null
  const tokenInfo = (body?.token_info ?? null) as Record<string, unknown> | null
  const appToken = String(tokenInfo?.app_token ?? '')
  if (!appToken) throw new ZeppAuthError('zepp app_tokens response missing app_token')
  return { ...t, appToken, obtainedAt: Date.now() }
}

// ---------------------------------------------------------------------------
// Data fetching

async function apiGet(t: ZeppTokens, url: string, f: Fetch): Promise<unknown> {
  const res = await f(url, {
    headers: { apptoken: t.appToken, 'user-agent': FORM_HEADERS['user-agent'] },
  })
  if (res.status === 401 || res.status === 403) {
    throw new ZeppAuthError(`zepp app token rejected: HTTP ${res.status} for ${new URL(url).pathname}`)
  }
  if (!res.ok) throw new ZeppApiError(`zepp GET ${new URL(url).pathname} failed: HTTP ${res.status}`)
  return res.json().catch(() => {
    throw new ZeppApiError(`zepp GET ${new URL(url).pathname} returned non-JSON`)
  })
}

/**
 * Pull sleep/RHR/stress/PAI for [fromDate, toDate] (inclusive, YYYY-MM-DD).
 * Throws ZeppAuthError when the token is dead (caller renews and retries);
 * per-day parse trouble never throws — it lands in `problems`.
 */
export async function fetchDays(
  t: ZeppTokens,
  fromDate: string,
  toDate: string,
  f: Fetch = fetch,
  opts?: { debug?: boolean },
): Promise<ZeppDay[]> {
  const fromMs = Date.parse(`${fromDate}T00:00:00Z`) - 86_400_000 // events keyed by sleep start, often the evening before
  const toMs = Date.parse(`${toDate}T23:59:59Z`)
  const eventsUrl = (type: string) =>
    `https://${t.apiHost}/users/${encodeURIComponent(t.userId)}/events` +
    `?eventType=${type}&from=${fromMs}&to=${toMs}&limit=60`

  const [band, sleepEv, stressEv, paiEv] = await Promise.all([
    apiGet(
      t,
      `https://${t.apiHost}/v1/data/band_data.json?query_type=summary&device_type=android_phone` +
        `&userid=${encodeURIComponent(t.userId)}&from_date=${fromDate}&to_date=${toDate}`,
      f,
    ),
    // Balance-era metrics live in the events API; a missing/renamed event type
    // must not sink the whole sync, so these three are individually tolerant.
    apiGet(t, eventsUrl('sleep'), f).catch(rethrowAuth),
    apiGet(t, eventsUrl('all_day_stress'), f).catch(rethrowAuth),
    apiGet(t, eventsUrl('PaiHealthInfo'), f).catch(rethrowAuth),
  ])

  const days = new Map<string, ZeppDay>()
  const day = (date: string): ZeppDay => {
    let d = days.get(date)
    if (!d) {
      d = { date, watch: {}, problems: [] }
      days.set(date, d)
    }
    return d
  }

  for (const item of listOf(band, ['data'])) {
    const date = str(get(item, 'date_time')) ?? str(get(item, 'date'))
    if (!date) continue
    const d = day(date)
    const parsed = parseBandSummary(item)
    Object.assign(d.watch, parsed.watch)
    d.problems.push(...parsed.problems)
  }
  mergeEvents(day, sleepEv, parseSleepEvent)
  mergeEvents(day, stressEv, parseStressEvent)
  mergeEvents(day, paiEv, parsePaiEvent)

  const out = [...days.values()]
    .filter((d) => d.date >= fromDate && d.date <= toDate)
    .sort((a, b) => a.date.localeCompare(b.date))
  if (opts?.debug && out.length) {
    // Attach raw payloads once (on the last day) so field mappings can be fixed against real data.
    out[out.length - 1].raw = { band, sleepEv, stressEv, paiEv }
  } else if (opts?.debug) {
    return [{ date: toDate, watch: {}, problems: ['no days parsed'], raw: { band, sleepEv, stressEv, paiEv } }]
  }
  return out
}

const rethrowAuth = (e: unknown): null => {
  if (e instanceof ZeppAuthError) throw e
  console.warn('zepp events fetch failed (continuing):', e)
  return null
}

function mergeEvents(
  day: (date: string) => ZeppDay,
  payload: unknown,
  parse: (item: unknown) => { date?: string; watch: Partial<WatchMetrics>; problems: string[] },
) {
  for (const item of listOf(payload, ['items', 'data', 'events'])) {
    const parsed = parse(item)
    if (!parsed.date) continue
    const d = day(parsed.date)
    Object.assign(d.watch, parsed.watch)
    d.problems.push(...parsed.problems)
  }
}

// ---------------------------------------------------------------------------
// Tolerant parsers (pure; exported for tests)

/** band_data day item → sleep stages/times (+RHR when present). */
export function parseBandSummary(item: unknown): {
  watch: Partial<WatchMetrics>
  problems: string[]
} {
  const problems: string[] = []
  const watch: Partial<WatchMetrics> = {}
  const summary = decodeSummary(get(item, 'summary'))
  if (!summary) {
    problems.push('band summary missing or undecodable')
    return { watch, problems }
  }
  const slp = get(summary, 'slp')
  if (slp && typeof slp === 'object') {
    const st = num(get(slp, 'st'), 1, 4e12)
    const ed = num(get(slp, 'ed'), 1, 4e12)
    const dp = num(get(slp, 'dp'), 0, 1000)
    const lt = num(get(slp, 'lt'), 0, 1000)
    if (st !== null && ed !== null && ed > st) {
      watch.sleepStart = new Date(st * 1000).toISOString()
      watch.sleepEnd = new Date(ed * 1000).toISOString()
      watch.sleepMinutes = Math.round((ed - st) / 60)
    }
    if (dp !== null) watch.deepMin = dp
    if (lt !== null) watch.lightMin = lt
    // stage minutes beat wall-clock span when both exist
    if (dp !== null && lt !== null && dp + lt > 0) {
      const rem = num(get(slp, 'rem'), 0, 1000) ?? 0
      watch.sleepMinutes = dp + lt + rem
      if (rem > 0) watch.remMin = rem
    }
    const rhr = num(get(slp, 'rhr'), 25, 120) ?? num(get(summary, 'rhr'), 25, 120)
    if (rhr !== null) watch.restingHr = rhr
  } else if (slp !== undefined) {
    problems.push('band summary slp has unexpected shape')
  }
  return { watch, problems }
}

/** events?eventType=sleep item → sleep score (+REM, RHR when present). */
export function parseSleepEvent(item: unknown): {
  date?: string
  watch: Partial<WatchMetrics>
  problems: string[]
} {
  const problems: string[] = []
  const watch: Partial<WatchMetrics> = {}
  const extra = decodeSummary(get(item, 'extra')) ?? item
  const date = eventDate(item, extra)
  if (!date) {
    problems.push('sleep event has no recognizable date')
    return { watch, problems }
  }
  const score = firstNum([get(extra, 'sleep_score'), get(extra, 'sleepScore'), get(extra, 'score')], 0, 100)
  if (score !== null) watch.sleepScore = score
  const rem = firstNum([get(extra, 'rem'), get(extra, 'remTime'), get(extra, 'rem_time')], 0, 1000)
  if (rem !== null) watch.remMin = rem
  const deep = firstNum([get(extra, 'dp'), get(extra, 'deepTime'), get(extra, 'deep_time')], 0, 1000)
  if (deep !== null) watch.deepMin = deep
  const total = firstNum([get(extra, 'totalTime'), get(extra, 'total_time'), get(extra, 'duration')], 30, 1000)
  if (total !== null) watch.sleepMinutes = total
  const rhr = firstNum([get(extra, 'rhr'), get(extra, 'restingHr'), get(extra, 'resting_hr')], 25, 120)
  if (rhr !== null) watch.restingHr = rhr
  if (score === null && rem === null && total === null) problems.push('sleep event had no usable fields')
  return { date, watch, problems }
}

/** events?eventType=all_day_stress item → avg/max stress. */
export function parseStressEvent(item: unknown): {
  date?: string
  watch: Partial<WatchMetrics>
  problems: string[]
} {
  const problems: string[] = []
  const watch: Partial<WatchMetrics> = {}
  const extra = decodeSummary(get(item, 'extra')) ?? item
  const date = eventDate(item, extra)
  if (!date) {
    problems.push('stress event has no recognizable date')
    return { watch, problems }
  }
  const avg = firstNum([get(extra, 'avgStress'), get(extra, 'avg_stress'), get(extra, 'avg')], 0, 100)
  const max = firstNum([get(extra, 'maxStress'), get(extra, 'max_stress'), get(extra, 'max')], 0, 100)
  if (avg !== null) watch.stressAvg = avg
  if (max !== null) watch.stressMax = max
  if (avg === null && max === null) problems.push('stress event had no usable fields')
  return { date, watch, problems }
}

/** events?eventType=PaiHealthInfo item → daily PAI. */
export function parsePaiEvent(item: unknown): {
  date?: string
  watch: Partial<WatchMetrics>
  problems: string[]
} {
  const problems: string[] = []
  const watch: Partial<WatchMetrics> = {}
  const extra = decodeSummary(get(item, 'extra')) ?? item
  const date = eventDate(item, extra)
  if (!date) {
    problems.push('PAI event has no recognizable date')
    return { watch, problems }
  }
  const pai = firstNum(
    [get(extra, 'dailyPai'), get(extra, 'daily_pai'), get(extra, 'activityScore'), get(extra, 'pai')],
    0,
    200,
  )
  if (pai !== null) watch.pai = pai
  else problems.push('PAI event had no usable fields')
  return { date, watch, problems }
}

// ---------------------------------------------------------------------------
// Small helpers

const get = (o: unknown, k: string): unknown =>
  o && typeof o === 'object' ? (o as Record<string, unknown>)[k] : undefined

const str = (v: unknown): string | null => (typeof v === 'string' && v ? v : null)

/** Finite number within [min, max], else null. Accepts numeric strings. */
export function num(v: unknown, min: number, max: number): number | null {
  const n = typeof v === 'string' && v.trim() !== '' ? Number(v) : v
  if (typeof n !== 'number' || !Number.isFinite(n)) return null
  return n >= min && n <= max ? n : null
}

const firstNum = (vs: unknown[], min: number, max: number): number | null => {
  for (const v of vs) {
    const n = num(v, min, max)
    if (n !== null) return n
  }
  return null
}

/** `summary`/`extra` fields arrive as objects, JSON strings, or base64-wrapped JSON. */
export function decodeSummary(v: unknown): Record<string, unknown> | null {
  if (v && typeof v === 'object' && !Array.isArray(v)) return v as Record<string, unknown>
  if (typeof v !== 'string' || !v) return null
  try {
    const parsed = JSON.parse(v)
    return parsed && typeof parsed === 'object' ? parsed : null
  } catch {
    try {
      const parsed = JSON.parse(Buffer.from(v, 'base64').toString('utf8'))
      return parsed && typeof parsed === 'object' ? parsed : null
    } catch {
      return null
    }
  }
}

function listOf(payload: unknown, keys: string[]): unknown[] {
  if (Array.isArray(payload)) return payload
  for (const k of keys) {
    const v = get(payload, k)
    if (Array.isArray(v)) return v
  }
  return []
}

/** A day key from an event item: explicit date field, else its timestamp (ms or s). */
function eventDate(item: unknown, extra: unknown): string | undefined {
  for (const src of [item, extra]) {
    const d = str(get(src, 'date')) ?? str(get(src, 'date_time')) ?? str(get(src, 'day'))
    if (d && /^\d{4}-\d{2}-\d{2}/.test(d)) return d.slice(0, 10)
  }
  for (const src of [item, extra]) {
    for (const k of ['timestamp', 'generatedTime', 'time', 'end', 'ed']) {
      const raw = num(get(src, k), 1e9, 4e12)
      if (raw !== null) {
        const ms = raw > 1e11 ? raw : raw * 1000
        return new Date(ms).toISOString().slice(0, 10)
      }
    }
  }
  return undefined
}

// ---------------------------------------------------------------------------

