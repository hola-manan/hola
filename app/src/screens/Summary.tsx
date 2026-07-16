import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ai, type WeeklySummary } from '../lib/ai'
import { aiSubscriptions } from '../lib/repo'
import { e1rmDelta } from '../lib/rm'
import { volumeVsTargets, weekStartMs } from '../lib/targets'
import { workoutVolume } from '../lib/volume'
import { isRestDay } from '../types'
import { useStore, useUid } from '../store'
import { AccentCallout, Btn, DeltaChip, EmptyState, Eyebrow, ProgressRow, StatStrip } from '../components/ui'

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

  const rows = cycle ? volumeVsTargets(cycle, completed, exercises, weekStart) : []
  const flagged = rows.filter((r) => r.behind)

  /** e1RM movement chips for the exercises trained this week. */
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

  return (
    <div className="px-5 pb-8 pt-8">
      <Eyebrow>
        WEEKLY SUMMARY · WK {isoWeek(now)} · {new Date(weekStart).getDate()}–{weekEnd.getDate()}{' '}
        {weekEnd.toLocaleDateString(undefined, { month: 'short' }).toUpperCase()}
      </Eyebrow>
      <h1 className="mt-2 font-condensed text-[34px] font-bold leading-[1.05]">
        {flagged.length
          ? `On target, except ${flagged[0].muscle}`
          : thisWeek.length
            ? 'On target this week'
            : 'Nothing logged yet this week'}
      </h1>

      <StatStrip
        className="mt-4"
        stats={[
          {
            value: trainingDays ? `${thisWeek.length}/${trainingDays}` : String(thisWeek.length),
            label: 'adherence',
          },
          { value: Math.round(vol).toLocaleString(), label: 'kg volume' },
          {
            value: volDelta === null ? '—' : `${volDelta >= 0 ? '+' : ''}${volDelta.toFixed(1)}%`,
            label: 'vs last wk',
            tone: volDelta !== null && volDelta >= 0 ? 'pos' : 'ink',
          },
        ]}
      />

      {rows.length > 0 && (
        <div className="mt-4 rounded-[11px] border border-white/8 bg-card p-3.5">
          <Eyebrow className="mb-1">VOLUME VS CYCLE INTENT · SETS/WK</Eyebrow>
          {rows.map((r) => (
            <ProgressRow
              key={r.muscle}
              label={r.muscle}
              value={`${r.done}/${r.target}`}
              pct={r.pct * 0.85}
              behind={r.behind}
              tickPct={85}
            />
          ))}
          <p className="mt-1 font-mono text-[8.5px] uppercase tracking-[0.1em] text-faint">
            │ = cycle target · warm-ups excluded
          </p>
        </div>
      )}

      <div className="mt-3">
        {latest ? (
          <AccentCallout tone="warn" label={`COACH · ${latest.week.toUpperCase()}`}>
            <p className="text-[13px] leading-relaxed text-body">{latest.text}</p>
            <div className="mt-3 flex gap-2">
              <Btn className="px-3 py-2 text-[12.5px]" onClick={() => navigate('/create')}>
                Fix in next draft
              </Btn>
              <Btn variant="ghost" className="px-3 py-2 text-[12.5px]" onClick={() => navigate('/coach')}>
                Ask coach
              </Btn>
              <Btn variant="ghost" className="ml-auto px-3 py-2 text-[12.5px]" disabled={busy} onClick={refresh}>
                {busy ? '…' : '⟳'}
              </Btn>
            </div>
          </AccentCallout>
        ) : (
          <Btn variant="ghost" className="w-full py-3" disabled={busy} onClick={refresh}>
            {busy ? 'Thinking…' : 'Generate coach summary'}
          </Btn>
        )}
        {error && <p className="mt-2 text-[12px] text-danger">{error}</p>}
      </div>

      {deltaChips.length > 0 && (
        <div className="mt-4">
          <Eyebrow className="mb-2">e1RM · THIS WEEK'S LIFTS</Eyebrow>
          <div className="flex flex-wrap gap-1.5">
            {deltaChips.map(({ id, d }) => {
              const name = (exercises.get(id)?.name ?? id).split(' (')[0]
              const tone =
                d.deltaPct === null || Math.abs(d.deltaPct) < 0.05
                  ? 'flat'
                  : d.deltaPct > 0
                    ? 'pos'
                    : 'neg'
              const arrow = tone === 'pos' ? '↑' : tone === 'neg' ? '↓' : '→'
              return (
                <DeltaChip key={id} tone={tone}>
                  {name} {arrow}
                  {d.deltaPct !== null && Math.abs(d.deltaPct) >= 0.05 && ` ${Math.abs(d.deltaPct).toFixed(1)}%`}
                </DeltaChip>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
