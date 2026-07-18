import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ai, type WeeklySummary } from '../lib/ai'
import { aiSubscriptions } from '../lib/repo'
import { e1rmDelta } from '../lib/rm'
import { groupedVolumeRows, weekStartMs } from '../lib/targets'
import { workoutVolume } from '../lib/volume'
import { isRestDay } from '../types'
import { useStore, useUid } from '../store'
import { EmptyState } from '../components/ui'

/* Verbatim port of design-refs/3a.html — inline px values are the spec. */

const MONO = "'IBM Plex Mono',monospace"
const CONDENSED = "'IBM Plex Sans Condensed',sans-serif"
const SANS = "'IBM Plex Sans',system-ui,sans-serif"

function isoWeek(d: Date): number {
  const u = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  const day = u.getUTCDay() || 7
  u.setUTCDate(u.getUTCDate() + 4 - day)
  const start = new Date(Date.UTC(u.getUTCFullYear(), 0, 1))
  return Math.ceil(((u.getTime() - start.getTime()) / 86_400_000 + 1) / 7)
}

export function Summary() {
  const { workouts, cycle, exercises } = useStore()
  const uid = useUid()
  const navigate = useNavigate()
  const [summaries, setSummaries] = useState<WeeklySummary[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => aiSubscriptions.summaries(uid, setSummaries), [uid])

  const completed = useMemo(() => workouts.filter((w) => w.status === 'completed'), [workouts])
  const weekStart = weekStartMs()
  const prevWeekStart = weekStart - 7 * 86_400_000

  const thisWeek = completed.filter((w) => w.startedAt >= weekStart)
  const prevWeek = completed.filter((w) => w.startedAt >= prevWeekStart && w.startedAt < weekStart)
  const vol = thisWeek.reduce((s, w) => s + workoutVolume(w), 0)
  const prevVol = prevWeek.reduce((s, w) => s + workoutVolume(w), 0)
  const volDelta = prevVol > 0 ? ((vol - prevVol) / prevVol) * 100 : null

  const trainingDays = cycle
    ? Math.round((cycle.days.filter((d) => !isRestDay(d)).length * 7) / cycle.days.length)
    : null

  const rows = cycle ? groupedVolumeRows(cycle, completed, exercises, weekStart) : []
  const flagged = rows.filter((r) => r.behind || r.over)

  const deltaChips = useMemo(() => {
    const ids = [...new Set(thisWeek.flatMap((w) => w.exercises.map((e) => e.exerciseId)))]
    return ids
      .map((id) => ({ id, d: e1rmDelta(completed, id) }))
      .filter((x): x is { id: string; d: NonNullable<ReturnType<typeof e1rmDelta>> } => x.d !== null)
      .slice(0, 6)
  }, [thisWeek, completed])

  const refresh = async () => {
    setBusy(true)
    setError('')
    try {
      await ai.generateWeeklySummary({})
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const now = new Date()
  const weekEnd = new Date(weekStart + 6 * 86_400_000)
  const latest = summaries[0]

  if (!completed.length) {
    return <EmptyState>Log some workouts first — then the weekly summary has something to say.</EmptyState>
  }

  const formatDateRange = () => {
    const startStr = new Date(weekStart).getDate()
    const endStr = `${weekEnd.getDate()} ${weekEnd.toLocaleDateString(undefined, { month: 'short' }).toUpperCase()}`
    return `${startStr}–${endStr}`
  }

  return (
    <div style={{ height: '100%', background: '#0b0d10', color: '#e9ecef', fontFamily: SANS, boxSizing: 'border-box', padding: '28px 0 0', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '0 20px' }}>
      <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '.14em', color: '#5a6270' }}>
        WEEKLY SUMMARY · WK {isoWeek(now)} · {formatDateRange()}
      </div>
      <div style={{ fontFamily: CONDENSED, fontWeight: 700, fontSize: 34, lineHeight: 1.05, marginTop: 8 }}>
        {!thisWeek.length ? (
          <>Nothing logged<br />yet this week</>
        ) : flagged.length ? (
          <>On target,<br />except {flagged[0].label.toLowerCase()}</>
        ) : (
          'On target this week'
        )}
      </div>
      </div>
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '0 20px 30px' }}>
      <div style={{ display: 'flex', gap: 14, marginTop: 12, background: '#14171c', border: '1px solid rgba(255,255,255,.08)', borderRadius: 10, padding: '11px 14px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: MONO, fontSize: 15 }}>{trainingDays ? `${thisWeek.length}/${trainingDays}` : String(thisWeek.length)}</div>
          <div style={{ fontSize: 9.5, color: '#5a6270', marginTop: 1 }}>ADHERENCE</div>
        </div>
        <div style={{ flex: 1, borderLeft: '1px solid rgba(255,255,255,.07)', paddingLeft: 12 }}>
          <div style={{ fontFamily: MONO, fontSize: 15 }}>{Math.round(vol).toLocaleString()}</div>
          <div style={{ fontSize: 9.5, color: '#5a6270', marginTop: 1 }}>KG VOLUME</div>
        </div>
        <div style={{ flex: 1, borderLeft: '1px solid rgba(255,255,255,.07)', paddingLeft: 12 }}>
          <div style={{ fontFamily: MONO, fontSize: 15, color: volDelta !== null && volDelta >= 0 ? '#63d08a' : '#e9ecef' }}>
            {volDelta === null ? '—' : `${volDelta >= 0 ? '+' : ''}${volDelta.toFixed(1)}%`}
          </div>
          <div style={{ fontSize: 9.5, color: '#5a6270', marginTop: 1 }}>VS WK {isoWeek(new Date(prevWeekStart))}</div>
        </div>
      </div>

      {rows.length > 0 && (
        <div style={{ marginTop: 14, background: '#14171c', border: '1px solid rgba(255,255,255,.08)', borderRadius: 12, padding: 14 }}>
          <div style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: '.12em', color: '#5a6270', marginBottom: 10 }}>
            SETS/WK VS OPTIMAL RANGE
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {rows.map((r) => {
              const color = (r.behind || r.over) ? '#e8b44c' : '#57c4cc'
              const bg = '#1b1f26'
              return (
                <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ width: 70, fontSize: 11, color }}>{r.label}</span>
                  <div style={{ flex: 1, height: 6, background: bg, borderRadius: 3 }}>
                    <div style={{ width: `${Math.min(100, r.pct)}%`, height: 6, background: color, borderRadius: 3 }}></div>
                  </div>
                  <span style={{ width: 56, textAlign: 'right', fontFamily: MONO, fontSize: 10.5, color }}>
                    {r.done}/{r.lo}–{r.hi}
                  </span>
                  <span style={{ width: 34, textAlign: 'right', fontFamily: MONO, fontSize: 10.5, color }}>
                    {r.pct}%
                  </span>
                </div>
              )
            })}
          </div>
          <div style={{ fontSize: 10, color: '#3d434c', marginTop: 9 }}>
            optimal weekly range from research · warm-ups excluded
          </div>
        </div>
      )}

      {latest ? (
        <div style={{ marginTop: 12, background: '#14171c', borderLeft: '2px solid #e8b44c', borderRadius: '0 10px 10px 0', padding: '12px 14px' }}>
          <div style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: '.12em', color: '#e8b44c' }}>
            FLAGGED IMBALANCE
          </div>
          <div style={{ fontSize: 12.5, color: '#c7ccd4', marginTop: 5, lineHeight: 1.5 }}>
            {latest.text}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <button onClick={() => navigate('/create')} style={{ fontSize: 12, color: '#0b0d10', background: '#c8f04b', borderRadius: 7, padding: '7px 12px', fontWeight: 600, border: 'none' }}>
              Fix in next draft
            </button>
            <button onClick={() => navigate('/coach')} style={{ fontSize: 12, color: '#8b93a0', border: '1px solid rgba(255,255,255,.14)', borderRadius: 7, padding: '7px 12px', background: 'none' }}>
              Ask coach
            </button>
            <button onClick={refresh} disabled={busy} style={{ fontSize: 12, color: '#8b93a0', border: '1px solid rgba(255,255,255,.14)', borderRadius: 7, padding: '7px 12px', background: 'none', marginLeft: 'auto' }}>
              {busy ? '…' : '⟳'}
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={refresh}
          disabled={busy}
          style={{ width: '100%', marginTop: 12, fontSize: 12, color: '#0b0d10', background: '#c8f04b', borderRadius: 7, padding: '10px 12px', fontWeight: 600, border: 'none' }}
        >
          {busy ? 'Thinking…' : 'Generate coach summary'}
        </button>
      )}
      {error && <div style={{ marginTop: 8, fontSize: 12, color: '#e0596b' }}>{error}</div>}

      {deltaChips.length > 0 && (
        <div style={{ marginTop: 12, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {deltaChips.map(({ id, d }) => {
            const name = (exercises.get(id)?.name ?? id).split(' (')[0].toUpperCase()
            const tone = d.deltaPct === null || Math.abs(d.deltaPct) < 0.05 ? 'flat' : d.deltaPct > 0 ? 'pos' : 'neg'
            const arrow = tone === 'pos' ? '↑' : tone === 'neg' ? '↓' : '→'
            
            let bg, color
            if (tone === 'pos') { bg = 'rgba(99,208,138,.12)'; color = '#63d08a' }
            else if (tone === 'neg') { bg = 'rgba(224,89,107,.12)'; color = '#e0596b' }
            else { bg = 'rgba(139,147,160,.12)'; color = '#8b93a0' }

            const label = d.deltaPct !== null && Math.abs(d.deltaPct) >= 0.05 
              ? `${name} ${arrow} ${Math.abs(d.deltaPct).toFixed(1)}%`
              : `${name} ${arrow}`

            return (
              <span key={id} style={{ fontSize: 11.5, padding: '5px 10px', borderRadius: 6, background: bg, color: color, fontFamily: MONO }}>
                {label}
              </span>
            )
          })}
        </div>
      )}
      </div>
    </div>
  )
}
