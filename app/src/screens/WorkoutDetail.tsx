import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { aiSubscriptions, repo } from '../lib/repo'
import { ai, type Report } from '../lib/ai'
import { presetFromWorkout } from '../lib/workout'
import { rmSeries } from '../lib/rm'
import { formatSet, setVolume, workoutVolume, workingSetCount } from '../lib/volume'
import { useStore, useUid } from '../store'
import { currentDayLabel } from '../lib/cycle'
import { Btn, EmptyState } from '../components/ui'

/* Verbatim port of design-refs/1e.html. */

const MONO = "'IBM Plex Mono',monospace"
const CONDENSED = "'IBM Plex Sans Condensed',sans-serif"

export function WorkoutDetail() {
  const { id } = useParams()
  const { workouts, exercises, cycle } = useStore()
  const uid = useUid()
  const navigate = useNavigate()
  const w = workouts.find((x) => x.id === id)
  const [report, setReport] = useState<Report | null>(null)
  const [reportBusy, setReportBusy] = useState(false)
  const [reportError, setReportError] = useState('')
  const [showSets, setShowSets] = useState(false)

  useEffect(() => {
    if (id) return aiSubscriptions.report(uid, id, setReport)
  }, [uid, id])

  const completed = useMemo(() => workouts.filter((x) => x.status === 'completed'), [workouts])

  const rmRows = useMemo(() => {
    if (!w) return []
    return w.exercises
      .map((we) => {
        const series = rmSeries(completed, we.exerciseId)
        const idx = series.findIndex((p) => p.date === w.startedAt)
        if (idx < 0) return null
        const cur = series[idx].e1rm
        const prev = idx > 0 ? series[idx - 1].e1rm : null
        return { exerciseId: we.exerciseId, e1rm: cur, deltaPct: prev ? ((cur - prev) / prev) * 100 : null }
      })
      .filter((r): r is NonNullable<typeof r> => r !== null)
  }, [w, completed])

  /** Muscle delta chips: primary muscle of each exercise, trend by e1RM delta. */
  const muscleChips = useMemo(() => {
    const byMuscle = new Map<string, number[]>()
    for (const r of rmRows) {
      const m = exercises.get(r.exerciseId)?.primaryMuscles[0]
      if (!m || r.deltaPct === null) continue
      byMuscle.set(m, [...(byMuscle.get(m) ?? []), r.deltaPct])
    }
    return [...byMuscle.entries()].map(([m, deltas]) => {
      const avg = deltas.reduce((a, b) => a + b, 0) / deltas.length
      return { muscle: m, dir: avg > 0.05 ? 'up' : avg < -0.05 ? 'down' : 'flat' }
    })
  }, [rmRows, exercises])

  const prevComparable = useMemo(() => {
    if (!w?.cycleDay) return null
    return (
      completed.find(
        (x) => x.id !== w.id && x.startedAt < w.startedAt && x.cycleDay?.toLowerCase() === w.cycleDay!.toLowerCase(),
      ) ?? null
    )
  }, [w, completed])

  if (!w) return <EmptyState>Workout not found.</EmptyState>

  const vol = workoutVolume(w)
  const volDelta = prevComparable
    ? ((vol - workoutVolume(prevComparable)) / Math.max(workoutVolume(prevComparable), 1)) * 100
    : null

  const generateReport = async () => {
    setReportBusy(true)
    setReportError('')
    try {
      await ai.generateReport({ workoutId: w.id })
    } catch (e) {
      setReportError((e as Error).message)
    } finally {
      setReportBusy(false)
    }
  }

  const saveAsPreset = async () => {
    const name = prompt('Preset name', w.name ?? w.cycleDay ?? 'My workout')
    if (!name) return
    await repo.savePreset(uid, presetFromWorkout(w, name))
    navigate('/presets')
  }

  const remove = async () => {
    if (!confirm('Delete this workout from history?')) return
    await repo.deleteWorkout(uid, w.id)
    navigate('/history', { replace: true })
  }

  const durationMin = w.completedAt && !w.bulkEntered ? Math.round((w.completedAt - w.startedAt) / 60000) : null
  const date = new Date(w.startedAt)
  const chipStyle = (tone: 'pos' | 'neg' | 'flat') => ({
    fontSize: 11.5,
    padding: '5px 10px',
    borderRadius: 6,
    fontFamily: MONO,
    background:
      tone === 'pos' ? 'rgba(99,208,138,.12)' : tone === 'neg' ? 'rgba(224,89,107,.12)' : 'rgba(139,147,160,.12)',
    color: tone === 'pos' ? '#63d08a' : tone === 'neg' ? '#e0596b' : '#8b93a0',
  })

  return (
    <div style={{ padding: '62px 20px 24px' }}>
      <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '.14em', color: '#5a6270' }}>
        REPORT{w.cycleDay ? ` · ${w.cycleDay.toUpperCase()}` : ''} ·{' '}
        {date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }).toUpperCase()}
        {durationMin !== null && ` · ${durationMin} MIN`} · {workingSetCount(w)} SETS
      </div>

      <div style={{ fontFamily: CONDENSED, fontWeight: 700, fontSize: 34, lineHeight: 1.05, marginTop: 8 }}>
        {volDelta !== null ? (
          <>
            Volume {volDelta >= 0 ? '+' : ''}
            {volDelta.toFixed(1)}% vs
            <br />
            last {w.cycleDay} day
          </>
        ) : (
          (w.name ?? w.cycleDay ?? 'Workout')
        )}
      </div>
      <div style={{ fontSize: 12.5, color: '#8b93a0', marginTop: 6 }}>
        {Math.round(vol).toLocaleString()} kg total · warm-ups excluded
        {prevComparable &&
          ` · compared to ${new Date(prevComparable.startedAt).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}`}
      </div>

      {rmRows.length > 0 && (
        <div
          style={{
            marginTop: 16,
            background: '#14171c',
            border: '1px solid rgba(255,255,255,.08)',
            borderRadius: 12,
            padding: 14,
          }}
        >
          <div style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: '.12em', color: '#5a6270', marginBottom: 10 }}>
            ESTIMATED 1RM · CHANGE
          </div>
          {rmRows.map((r, i) => (
            <div
              key={r.exerciseId}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '6px 0',
                borderBottom: i < rmRows.length - 1 ? '1px solid rgba(255,255,255,.06)' : 'none',
                fontSize: 12.5,
              }}
            >
              <span>{(exercises.get(r.exerciseId)?.name ?? r.exerciseId).split(' (')[0]}</span>
              <span style={{ fontFamily: MONO, color: '#8b93a0' }}>{r.e1rm.toFixed(1)} kg</span>
              <span
                style={{
                  fontFamily: MONO,
                  width: 52,
                  textAlign: 'right',
                  color:
                    r.deltaPct === null || Math.abs(r.deltaPct) < 0.05
                      ? '#8b93a0'
                      : r.deltaPct > 0
                        ? '#63d08a'
                        : '#e0596b',
                }}
              >
                {r.deltaPct === null ? 'new' : `${r.deltaPct >= 0 ? '+' : '−'}${Math.abs(r.deltaPct).toFixed(1)}%`}
              </span>
            </div>
          ))}
        </div>
      )}

      {muscleChips.length > 0 && (
        <div style={{ marginTop: 12, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {muscleChips.map((c) => (
            <span key={c.muscle} style={chipStyle(c.dir === 'up' ? 'pos' : c.dir === 'down' ? 'neg' : 'flat')}>
              {c.muscle.toUpperCase()} {c.dir === 'up' ? '↑' : c.dir === 'down' ? '↓' : '→'}
            </span>
          ))}
        </div>
      )}

      {/* coach report callout */}
      <div
        style={{
          marginTop: 12,
          background: '#14171c',
          borderLeft: '2px solid #c8f04b',
          borderRadius: '0 10px 10px 0',
          padding: '12px 14px',
        }}
      >
        <div
          style={{
            fontFamily: MONO,
            fontSize: 9.5,
            letterSpacing: '.12em',
            color: '#c8f04b',
            display: 'flex',
            justifyContent: 'space-between',
          }}
        >
          <span>COACH REPORT</span>
          {!report && !reportBusy && (
            <button
              onClick={generateReport}
              style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: '.12em', color: '#c8f04b', background: 'none', border: 'none', padding: 0 }}
            >
              GENERATE →
            </button>
          )}
        </div>
        <div style={{ fontSize: 12.5, color: '#c7ccd4', marginTop: 5, lineHeight: 1.5 }}>
          {report?.text ??
            (reportBusy ? 'The coach is reviewing this workout…' : 'How this went vs last time, and what to do next.')}
          {reportError && <span style={{ color: '#e0596b' }}> {reportError}</span>}
        </div>
      </div>

      <Link to="/coach">
        <div
          style={{
            marginTop: 14,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: '#101318',
            border: '1px solid rgba(255,255,255,.08)',
            borderRadius: 10,
            padding: '11px 14px',
          }}
        >
          <span style={{ fontSize: 12.5, color: '#8b93a0' }}>Ask about this workout</span>
          <span style={{ fontSize: 12, color: '#57c4cc' }}>Open chat →</span>
        </div>
      </Link>

      {cycle && (
        <div style={{ marginTop: 10, textAlign: 'center', fontSize: 11, color: '#3d434c' }}>
          {`Cycle: ${currentDayLabel(cycle)} day (day ${(cycle.pointer % cycle.days.length) + 1} of ${cycle.days.length})`}
        </div>
      )}

      {/* sets (kept functional, below the mock's fold) */}
      <button
        onClick={() => setShowSets((v) => !v)}
        style={{
          marginTop: 16,
          width: '100%',
          border: '1px dashed rgba(255,255,255,.18)',
          borderRadius: 10,
          padding: '9px 0',
          fontSize: 12.5,
          color: '#8b93a0',
          background: 'none',
        }}
      >
        {showSets ? 'Hide sets' : `View all sets (${workingSetCount(w)})`}
      </button>
      {showSets &&
        w.exercises.map((we, i) => (
          <div
            key={`${we.exerciseId}-${i}`}
            style={{
              marginTop: 8,
              background: '#14171c',
              border: '1px solid rgba(255,255,255,.08)',
              borderRadius: 11,
              padding: '12px 14px',
            }}
          >
            <Link to={`/exercises/${we.exerciseId}`} style={{ fontSize: 14, fontWeight: 600 }}>
              {exercises.get(we.exerciseId)?.name ?? we.exerciseId}
            </Link>
            {we.sets.map((s, idx) => (
              <div
                key={s.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '5px 0',
                  borderTop: idx > 0 ? '1px solid rgba(255,255,255,.06)' : 'none',
                  marginTop: idx === 0 ? 8 : 0,
                  fontFamily: MONO,
                  fontSize: 12.5,
                }}
              >
                <span>
                  <span style={{ color: '#5a6270', marginRight: 8 }}>{idx + 1}</span>
                  {formatSet(s)}
                  {s.type !== 'working' && (
                    <span style={{ marginLeft: 8, fontSize: 10, color: '#e8b44c', textTransform: 'uppercase' }}>
                      {s.type}
                    </span>
                  )}
                  {s.rpe != null && (
                    <span style={{ marginLeft: 8, fontSize: 10, color: '#5a6270' }}>RPE {s.rpe}</span>
                  )}
                </span>
                <span style={{ color: '#5a6270' }}>{Math.round(setVolume(s))} kg</span>
              </div>
            ))}
          </div>
        ))}

      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <Btn variant="ghost" className="flex-1" onClick={saveAsPreset}>
          Save as preset
        </Btn>
        <Btn variant="danger" onClick={remove}>
          Delete
        </Btn>
      </div>
    </div>
  )
}
