import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { aiSubscriptions, repo } from '../lib/repo'
import { ai, type Report } from '../lib/ai'
import { presetFromWorkout } from '../lib/workout'
import { rmSeries } from '../lib/rm'
import { formatSet, setVolume, workoutVolume, workingSetCount } from '../lib/volume'
import { useStore, useUid } from '../store'
import { AccentCallout, Btn, Card, DeltaChip, EmptyState, Eyebrow, SunkenCard } from '../components/ui'

export function WorkoutDetail() {
  const { id } = useParams()
  const { workouts, exercises } = useStore()
  const uid = useUid()
  const navigate = useNavigate()
  const w = workouts.find((x) => x.id === id)
  const [report, setReport] = useState<Report | null>(null)
  const [reportBusy, setReportBusy] = useState(false)
  const [reportError, setReportError] = useState('')

  useEffect(() => {
    if (id) return aiSubscriptions.report(uid, id, setReport)
  }, [uid, id])

  const completed = useMemo(() => workouts.filter((x) => x.status === 'completed'), [workouts])

  /** e1RM per exercise in this workout vs its previous session (1e's change card). */
  const rmRows = useMemo(() => {
    if (!w) return []
    return w.exercises
      .map((we) => {
        const series = rmSeries(completed, we.exerciseId)
        const idx = series.findIndex((p) => p.date === w.startedAt)
        if (idx < 0) return null
        const cur = series[idx].e1rm
        const prev = idx > 0 ? series[idx - 1].e1rm : null
        return {
          exerciseId: we.exerciseId,
          e1rm: cur,
          deltaPct: prev ? ((cur - prev) / prev) * 100 : null,
        }
      })
      .filter((r): r is NonNullable<typeof r> => r !== null)
  }, [w, completed])

  const prevComparable = useMemo(() => {
    if (!w?.cycleDay) return null
    return (
      completed.find(
        (x) =>
          x.id !== w.id &&
          x.startedAt < w.startedAt &&
          x.cycleDay?.toLowerCase() === w.cycleDay!.toLowerCase(),
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

  const durationMin =
    w.completedAt && !w.bulkEntered ? Math.round((w.completedAt - w.startedAt) / 60000) : null
  const date = new Date(w.startedAt)

  return (
    <div className="px-5 pt-8">
      <Eyebrow>
        REPORT{w.cycleDay ? ` · ${w.cycleDay.toUpperCase()}` : ''} ·{' '}
        {date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }).toUpperCase()}
        {durationMin !== null && ` · ${durationMin} MIN`} · {workingSetCount(w)} SETS
      </Eyebrow>

      <h1 className="mt-2 font-condensed text-[34px] font-bold leading-[1.05]">
        {volDelta !== null
          ? `Volume ${volDelta >= 0 ? '+' : ''}${volDelta.toFixed(1)}% vs last ${w.cycleDay} day`
          : (w.name ?? w.cycleDay ?? 'Workout')}
      </h1>
      <p className="mt-1.5 text-[12.5px] text-muted">
        {Math.round(vol).toLocaleString()} kg total · warm-ups excluded
        {prevComparable &&
          ` · compared to ${new Date(prevComparable.startedAt).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}`}
      </p>

      {rmRows.length > 0 && (
        <Card className="mt-4">
          <Eyebrow className="mb-2">ESTIMATED 1RM · CHANGE</Eyebrow>
          {rmRows.map((r, i) => (
            <div
              key={r.exerciseId}
              className={`flex items-center justify-between py-1.5 ${i > 0 ? 'border-t border-white/6' : ''}`}
            >
              <span className="text-[13px] text-body">
                {exercises.get(r.exerciseId)?.name ?? r.exerciseId}
              </span>
              <span className="flex items-center gap-3">
                <span className="font-mono text-[13px]">{r.e1rm.toFixed(1)}</span>
                <span
                  className={`w-[52px] text-right font-mono text-[12px] ${
                    r.deltaPct === null || Math.abs(r.deltaPct) < 0.05
                      ? 'text-muted'
                      : r.deltaPct > 0
                        ? 'text-pos'
                        : 'text-danger'
                  }`}
                >
                  {r.deltaPct === null ? 'new' : `${r.deltaPct >= 0 ? '+' : ''}${r.deltaPct.toFixed(1)}%`}
                </span>
              </span>
            </div>
          ))}
        </Card>
      )}

      <div className="mt-3">
        {report ? (
          <AccentCallout tone="lime" label="COACH REPORT">
            <p className="text-[13px] leading-relaxed text-body">{report.text}</p>
          </AccentCallout>
        ) : (
          <Card>
            <div className="flex items-center justify-between">
              <Eyebrow>COACH REPORT</Eyebrow>
              <Btn variant="ghost" className="px-3 py-1.5 text-[12px]" disabled={reportBusy} onClick={generateReport}>
                {reportBusy ? 'Thinking…' : 'Generate'}
              </Btn>
            </div>
            {reportBusy && <p className="mt-2 text-[12px] text-muted">The coach is reviewing this workout…</p>}
            {reportError && <p className="mt-2 text-[12px] text-danger">{reportError}</p>}
          </Card>
        )}
      </div>

      <Link to="/coach">
        <SunkenCard className="mt-3 flex items-center justify-between !py-3">
          <span className="text-[13px] text-body">Ask about this workout</span>
          <span className="font-mono text-[12px] text-teal">Open chat →</span>
        </SunkenCard>
      </Link>

      <div className="mt-5">
        {w.exercises.map((we, i) => {
          const ex = exercises.get(we.exerciseId)
          return (
            <Card key={`${we.exerciseId}-${i}`} className="mb-2">
              <Link
                to={`/exercises/${we.exerciseId}`}
                className="text-[14px] font-semibold underline-offset-2 active:underline"
              >
                {ex?.name ?? we.exerciseId}
              </Link>
              <div className="mt-2 flex flex-col">
                {we.sets.map((s, idx) => (
                  <div
                    key={s.id}
                    className={`flex justify-between py-1 font-mono text-[12.5px] ${idx > 0 ? 'border-t border-white/6' : ''}`}
                  >
                    <span>
                      <span className="mr-2 text-label">{idx + 1}</span>
                      {formatSet(s)}
                      {s.type !== 'working' && <span className="ml-2 text-[10px] uppercase text-warn">{s.type}</span>}
                      {s.rpe != null && <span className="ml-2 text-[10px] uppercase text-label">rpe {s.rpe}</span>}
                    </span>
                    <span className="text-label">{Math.round(setVolume(s))} kg</span>
                  </div>
                ))}
              </div>
            </Card>
          )
        })}
      </div>

      <div className="mb-6 mt-3 flex gap-2">
        <Btn variant="ghost" className="flex-1" onClick={saveAsPreset}>
          Save as preset
        </Btn>
        <Btn variant="danger" onClick={remove}>
          Delete
        </Btn>
      </div>
      {w.bulkEntered && (
        <div className="mb-6 -mt-2">
          <DeltaChip tone="flat">BULK ENTERED</DeltaChip>
        </div>
      )}
    </div>
  )
}
