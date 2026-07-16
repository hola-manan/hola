import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../store'
import { rmSeries } from '../lib/rm'
import { weekStartMs } from '../lib/targets'
import { isRestDay } from '../types'
import { workoutVolume, workingSetCount } from '../lib/volume'
import { Card, EmptyState, Eyebrow, Screen, StatStrip } from '../components/ui'

/** Count of exercises whose e1RM went up in a given workout (PR arrows). */
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

  /** Group by Monday-based week. */
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
    <Screen
      title="History"
      action={<Eyebrow>{completed.length} WORKOUTS</Eyebrow>}
    >
      {completed.length > 0 && (
        <StatStrip
          className="mb-4"
          stats={[
            {
              value: trainingDaysPerWeek ? `${thisWeek.length}/${trainingDaysPerWeek}` : String(thisWeek.length),
              label: 'this week',
            },
            { value: Math.round(weekVolume).toLocaleString(), label: 'kg volume' },
            { value: weekPrs > 0 ? `${weekPrs} ↑` : '0', label: 'e1RM PRs', tone: weekPrs > 0 ? 'pos' : 'ink' },
          ]}
        />
      )}

      {groups.map(([start, ws]) => (
        <div key={start} className="mb-4">
          <Eyebrow className="mb-1.5">
            {weekLabel(start)}
            {weekLabel(start).includes('WEEK') && ` · ${rangeLabel(start)}`}
          </Eyebrow>
          {ws.map((w) => {
            const prs = prCount(seriesById, w)
            const mins = w.completedAt && !w.bulkEntered ? Math.round((w.completedAt - w.startedAt) / 60000) : null
            return (
              <Link key={w.id} to={`/history/${w.id}`}>
                <Card className="mb-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[14px] font-semibold">
                      {w.name ?? w.cycleDay ?? 'Workout'}
                      {w.bulkEntered && (
                        <span className="ml-2 rounded bg-teal/12 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.08em] text-teal">
                          bulk
                        </span>
                      )}
                    </span>
                    <span className="font-mono text-[10.5px] uppercase text-label">
                      {new Date(w.startedAt).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' }).toUpperCase()}
                      {mins !== null && ` · ${mins}M`}
                    </span>
                  </div>
                  <div className="mt-1 flex gap-4 font-mono text-[11px] text-muted">
                    <span>{workingSetCount(w)} SETS</span>
                    <span>{Math.round(workoutVolume(w)).toLocaleString()} KG</span>
                    {prs > 0 && <span className="text-pos">{prs} e1RM ↑</span>}
                  </div>
                </Card>
              </Link>
            )
          })}
        </div>
      ))}
      {!completed.length && <EmptyState>Nothing here yet.</EmptyState>}
    </Screen>
  )
}
