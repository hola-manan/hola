import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../store'
import { rmSeries } from '../lib/rm'
import { weekStartMs } from '../lib/targets'
import { isRestDay } from '../types'
import { workoutVolume, workingSetCount } from '../lib/volume'

const MONO = "'IBM Plex Mono',monospace"
const SANS = "'IBM Plex Sans',system-ui,sans-serif"
const CONDENSED = "'IBM Plex Sans Condensed',sans-serif"

function prCount(all: ReturnType<typeof rmSeriesCache>, w: { id: string; startedAt: number; exercises: { exerciseId: string }[] }): number {
  let count = 0
  for (const we of w.exercises) {
    const series = all.get(we.exerciseId)
    if (!series) continue
    const idx = series.findIndex((p) => p.date === w.startedAt)
    if (idx > 0 && series[idx].e1rm > series[idx - 1].e1rm + 0.01) count++
  }
  return count
}

const rmSeriesCache = (workouts: Parameters<typeof rmSeries>[0], ids: string[]) =>
  new Map(ids.map((id) => [id, rmSeries(workouts, id)]))

export function History() {
  const { workouts, cycle } = useStore()
  const completed = useMemo(() => workouts.filter((w) => w.status === 'completed'), [workouts])

  const seriesById = useMemo(() => {
    const ids = [...new Set(completed.flatMap((w) => w.exercises.map((e) => e.exerciseId)))]
    return rmSeriesCache(completed, ids)
  }, [completed])

  const weekStart = weekStartMs()
  const thisWeek = completed.filter((w) => w.startedAt >= weekStart)
  const weekVolume = thisWeek.reduce((s, w) => s + workoutVolume(w), 0)
  const trainingDaysPerWeek = cycle
    ? Math.round((cycle.days.filter((d) => !isRestDay(d)).length * 7) / cycle.days.length)
    : null
  const weekPrs = thisWeek.reduce((s, w) => s + prCount(seriesById, w), 0)

  const groups = useMemo(() => {
    const map = new Map<number, typeof completed>()
    for (const w of completed) {
      const d = new Date(w.startedAt)
      d.setHours(0, 0, 0, 0)
      d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
      const key = d.getTime()
      map.set(key, [...(map.get(key) ?? []), w])
    }
    return [...map.entries()].sort((a, b) => b[0] - a[0])
  }, [completed])

  const weekLabel = (start: number) => {
    if (start === weekStart) return 'THIS WEEK'
    if (start === weekStart - 7 * 86_400_000) return 'LAST WEEK'
    const s = new Date(start)
    const e = new Date(start + 6 * 86_400_000)
    return `${s.getDate()}–${e.getDate()} ${e.toLocaleDateString(undefined, { month: 'short' }).toUpperCase()}`
  }

  const rangeLabel = (start: number) => {
    const s = new Date(start)
    const e = new Date(start + 6 * 86_400_000)
    return `${s.getDate()}–${e.getDate()} ${e.toLocaleDateString(undefined, { month: 'short' }).toUpperCase()}`
  }

  return (
    <div style={{ height: '100%', background: '#0b0d10', color: '#e9ecef', fontFamily: SANS, boxSizing: 'border-box', padding: '28px 0 0', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '0 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div style={{ fontFamily: CONDENSED, fontWeight: 700, fontSize: 32 }}>History</div>
        <span style={{ fontFamily: MONO, fontSize: 10.5, color: '#5a6270' }}>{completed.length} WORKOUTS</span>
      </div>
      <div style={{ padding: '0 20px 30px', flex: 1, minHeight: 0, overflow: 'auto' }}>

        {completed.length > 0 && (
          <div style={{ display: 'flex', gap: 14, marginTop: 12, background: '#14171c', border: '1px solid rgba(255,255,255,.08)', borderRadius: 10, padding: '11px 14px' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: MONO, fontSize: 15 }}>
                {trainingDaysPerWeek ? `${thisWeek.length}/${trainingDaysPerWeek}` : thisWeek.length}
              </div>
              <div style={{ fontSize: 9.5, color: '#5a6270', marginTop: 1 }}>THIS WEEK</div>
            </div>
            <div style={{ flex: 1, borderLeft: '1px solid rgba(255,255,255,.07)', paddingLeft: 12 }}>
              <div style={{ fontFamily: MONO, fontSize: 15 }}>{Math.round(weekVolume).toLocaleString()}</div>
              <div style={{ fontSize: 9.5, color: '#5a6270', marginTop: 1 }}>KG VOLUME</div>
            </div>
            <div style={{ flex: 1, borderLeft: '1px solid rgba(255,255,255,.07)', paddingLeft: 12 }}>
              <div style={{ fontFamily: MONO, fontSize: 15, color: weekPrs > 0 ? '#63d08a' : 'inherit' }}>{weekPrs > 0 ? `${weekPrs} ↑` : '0'}</div>
              <div style={{ fontSize: 9.5, color: '#5a6270', marginTop: 1 }}>e1RM PRs</div>
            </div>
          </div>
        )}

        {!completed.length && (
          <div style={{ textAlign: 'center', color: '#5a6270', fontSize: 13, marginTop: 40 }}>
            Nothing here yet.
          </div>
        )}

        {groups.map(([start, ws]) => {
          const isThisOrLastWeek = start === weekStart || start === weekStart - 7 * 86_400_000
          const headerText = isThisOrLastWeek ? `${weekLabel(start)} · ${rangeLabel(start)}` : weekLabel(start)
          
          return (
            <div key={start} style={{ marginTop: 16 }}>
              <div style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: '.12em', color: '#5a6270', marginTop: 14 }}>
                {headerText}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                {ws.map((w) => {
                  const prs = prCount(seriesById, w)
                  const mins = w.completedAt && !w.bulkEntered ? Math.round((w.completedAt - w.startedAt) / 60000) : null
                  const dateStr = new Date(w.startedAt).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' }).toUpperCase()
                  
                  return (
                    <Link key={w.id} to={`/history/${w.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                      <div style={{ background: '#14171c', border: '1px solid rgba(255,255,255,.08)', borderRadius: 10, padding: '12px 14px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                          <span style={{ fontSize: 14, fontWeight: 600 }}>
                            {w.name ?? w.cycleDay ?? 'Workout'}
                            {w.bulkEntered && (
                              <span style={{ fontFamily: MONO, fontSize: 8.5, color: '#57c4cc', border: '1px solid rgba(87,196,204,.4)', borderRadius: 4, padding: '1px 5px', marginLeft: 4 }}>
                                BULK
                              </span>
                            )}
                          </span>
                          <span style={{ fontFamily: MONO, fontSize: 10.5, color: '#5a6270' }}>
                            {dateStr}{mins !== null ? ` · ~${mins}M` : ''}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: 12, fontFamily: MONO, fontSize: 11, color: '#8b93a0', marginTop: 5 }}>
                          <span>{workingSetCount(w)} SETS</span>
                          <span>{Math.round(workoutVolume(w)).toLocaleString()} KG</span>
                          {prs > 0 ? <span style={{ color: '#63d08a' }}>{prs} e1RM ↑</span> : <span>—</span>}
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          )
        })}
        <div style={{ paddingBottom: 24 }}></div>
      </div>
    </div>
  )
}
