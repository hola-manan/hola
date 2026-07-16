import { describe, expect, it } from 'vitest'
import {
  decodeSummary,
  fetchDays,
  loginWithPassword,
  num,
  parseBandSummary,
  parsePaiEvent,
  parseSleepEvent,
  parseStressEvent,
  renewAppToken,
  ZeppAuthError,
  type ZeppTokens,
} from './zepp'

const b64 = (o: unknown) => Buffer.from(JSON.stringify(o)).toString('base64')

// 23:30 → 06:18 UTC = 408 min wall clock
const SLP = { st: 1752622200, ed: 1752646680, dp: 95, lt: 260, rem: 53 }

describe('parseBandSummary', () => {
  it('parses a plain-JSON summary with sleep stages and RHR', () => {
    const { watch, problems } = parseBandSummary({
      date_time: '2026-07-16',
      summary: JSON.stringify({ v: 6, slp: { ...SLP, rhr: 52 } }),
    })
    expect(problems).toEqual([])
    expect(watch.deepMin).toBe(95)
    expect(watch.lightMin).toBe(260)
    expect(watch.remMin).toBe(53)
    expect(watch.sleepMinutes).toBe(95 + 260 + 53) // stage minutes beat wall clock
    expect(watch.sleepStart).toBe(new Date(SLP.st * 1000).toISOString())
    expect(watch.restingHr).toBe(52)
  })

  it('parses a base64-wrapped summary', () => {
    const { watch, problems } = parseBandSummary({
      date_time: '2026-07-16',
      summary: b64({ slp: SLP }),
    })
    expect(problems).toEqual([])
    expect(watch.sleepMinutes).toBe(408)
  })

  it('garbled summary → problem, never throws', () => {
    const { watch, problems } = parseBandSummary({ date_time: '2026-07-16', summary: '%%%not-json%%%' })
    expect(watch).toEqual({})
    expect(problems).toHaveLength(1)
  })

  it('rejects out-of-range values instead of storing garbage', () => {
    const { watch } = parseBandSummary({
      date_time: '2026-07-16',
      summary: JSON.stringify({ slp: { ...SLP, rhr: 300, dp: -5 } }),
    })
    expect(watch.restingHr).toBeUndefined()
    expect(watch.deepMin).toBeUndefined()
    expect(watch.sleepMinutes).toBeGreaterThan(0) // rest still parsed
  })
})

describe('event parsers', () => {
  it('sleep event: score and REM from base64 extra, date from field', () => {
    const r = parseSleepEvent({ date: '2026-07-16', extra: b64({ sleep_score: 72, rem: 78 }) })
    expect(r.date).toBe('2026-07-16')
    expect(r.watch.sleepScore).toBe(72)
    expect(r.watch.remMin).toBe(78)
  })

  it('sleep event: date derived from a ms timestamp when no date field', () => {
    const r = parseSleepEvent({ timestamp: Date.parse('2026-07-16T06:00:00Z'), extra: { score: 61 } })
    expect(r.date).toBe('2026-07-16')
    expect(r.watch.sleepScore).toBe(61)
  })

  it('stress event avg/max', () => {
    const r = parseStressEvent({ date: '2026-07-16', extra: { avgStress: 31, maxStress: 74 } })
    expect(r.watch.stressAvg).toBe(31)
    expect(r.watch.stressMax).toBe(74)
  })

  it('PAI event daily value', () => {
    const r = parsePaiEvent({ date: '2026-07-16', extra: { dailyPai: 12.5 } })
    expect(r.watch.pai).toBe(12.5)
  })

  it('unknown shapes → problems, no throw', () => {
    expect(parseSleepEvent({ date: '2026-07-16', extra: {} }).problems).toHaveLength(1)
    expect(parseStressEvent({ foo: 1 }).problems).toHaveLength(1)
    expect(parsePaiEvent({ date: '2026-07-16' }).problems).toHaveLength(1)
  })
})

describe('helpers', () => {
  it('num: finite, in range, accepts numeric strings', () => {
    expect(num('52', 25, 120)).toBe(52)
    expect(num(300, 25, 120)).toBeNull()
    expect(num(NaN, 0, 10)).toBeNull()
    expect(num('', 0, 10)).toBeNull()
  })

  it('decodeSummary: object, JSON string, base64, garbage', () => {
    expect(decodeSummary({ a: 1 })).toEqual({ a: 1 })
    expect(decodeSummary('{"a":1}')).toEqual({ a: 1 })
    expect(decodeSummary(b64({ a: 1 }))).toEqual({ a: 1 })
    expect(decodeSummary('!!!')).toBeNull()
    expect(decodeSummary(undefined)).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// Auth flow with an injected fake fetch

const fakeResponse = (init: {
  status?: number
  ok?: boolean
  location?: string | null
  json?: unknown
}) =>
  ({
    status: init.status ?? 200,
    ok: init.ok ?? ((init.status ?? 200) >= 200 && (init.status ?? 200) < 300),
    headers: { get: (k: string) => (k.toLowerCase() === 'location' ? (init.location ?? null) : null) },
    json: async () => {
      if (init.json === undefined) throw new Error('no json')
      return init.json
    },
  }) as unknown as Response

describe('loginWithPassword', () => {
  it('parses access code from the redirect and trades it for tokens', async () => {
    const calls: string[] = []
    const f = (async (url: RequestInfo | URL) => {
      const u = String(url)
      calls.push(u)
      if (u.includes('/registrations/')) {
        return fakeResponse({
          status: 303,
          location:
            'https://s3-us-west-2.amazonaws.com/hm-registration/successsignin.html?access=AC123&country_code=IN',
        })
      }
      return fakeResponse({
        json: {
          token_info: { login_token: 'LT', app_token: 'AT', user_id: 'U1' },
          domains: ['api-mifit-in2.huami.com'],
        },
      })
    }) as typeof fetch
    const t = await loginWithPassword('a@b.c', 'pw', f)
    expect(t).toMatchObject({ loginToken: 'LT', appToken: 'AT', userId: 'U1' })
    expect(t.apiHost).toBe('api-mifit-in2.huami.com')
    expect(calls[0]).toContain(encodeURIComponent('a@b.c'))
  })

  it('missing access code → ZeppAuthError', async () => {
    const f = (async () =>
      fakeResponse({ status: 303, location: 'https://x.example/?error=invalid' })) as typeof fetch
    await expect(loginWithPassword('a@b.c', 'bad', f)).rejects.toBeInstanceOf(ZeppAuthError)
  })
})

const tokens: ZeppTokens = {
  appToken: 'AT',
  loginToken: 'LT',
  userId: 'U1',
  apiHost: 'api-mifit.huami.com',
  obtainedAt: 0,
}

describe('renewAppToken', () => {
  it('returns refreshed token', async () => {
    const f = (async () => fakeResponse({ json: { token_info: { app_token: 'AT2' } } })) as typeof fetch
    const t = await renewAppToken(tokens, f)
    expect(t.appToken).toBe('AT2')
    expect(t.loginToken).toBe('LT')
  })

  it('401 → ZeppAuthError (caller does a full login)', async () => {
    const f = (async () => fakeResponse({ status: 401, ok: false })) as typeof fetch
    await expect(renewAppToken(tokens, f)).rejects.toBeInstanceOf(ZeppAuthError)
  })
})

describe('fetchDays', () => {
  it('merges band + event payloads per date; dead token → ZeppAuthError', async () => {
    const f = (async (url: RequestInfo | URL) => {
      const u = String(url)
      if (u.includes('band_data'))
        return fakeResponse({
          json: { data: [{ date_time: '2026-07-16', summary: JSON.stringify({ slp: SLP }) }] },
        })
      if (u.includes('eventType=sleep'))
        return fakeResponse({ json: { items: [{ date: '2026-07-16', extra: { sleep_score: 72 } }] } })
      if (u.includes('eventType=all_day_stress'))
        return fakeResponse({ json: { items: [{ date: '2026-07-16', extra: { avgStress: 30 } }] } })
      return fakeResponse({ json: { items: [] } })
    }) as typeof fetch
    const days = await fetchDays(tokens, '2026-07-14', '2026-07-16', f)
    expect(days).toHaveLength(1)
    expect(days[0].date).toBe('2026-07-16')
    expect(days[0].watch.sleepScore).toBe(72)
    expect(days[0].watch.sleepMinutes).toBe(408)
    expect(days[0].watch.stressAvg).toBe(30)

    const dead = (async () => fakeResponse({ status: 401, ok: false })) as typeof fetch
    await expect(fetchDays(tokens, '2026-07-14', '2026-07-16', dead)).rejects.toBeInstanceOf(
      ZeppAuthError,
    )
  })
})
