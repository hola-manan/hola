import { useMemo, useState } from 'react'
import { e1rmDelta, rmSeries } from '../lib/rm'
import { lastSession } from '../lib/workout'
import { useStore } from '../store'
import { Card, EmptyState, SunkenCard } from '../components/ui'
import { ExercisePicker } from '../components/ExercisePicker'
import { filterRange, RmPlot } from '../components/RmChart'

const RANGES: { label: string; days: number | null }[] = [
  { label: '1M', days: 30 },
  { label: '3M', days: 91 },
  { label: '1Y', days: 365 },
]

const STORAGE_KEY = 'trends-exercises'

export function Trends() {
  const { workouts, exercises, profile } = useStore()
  const [range, setRange] = useState<number | null>(91)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [selected, setSelected] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
    } catch {
      return []
    }
  })
  const [volumeFor, setVolumeFor] = useState<Record<string, boolean>>({})

  const completed = useMemo(() => workouts.filter((w) => w.status === 'completed'), [workouts])

  /** Default: the two most recently trained exercises with enough data. */
  const shown = useMemo(() => {
    const valid = selected.filter((id) => exercises.has(id))
    if (valid.length) return valid
    const seen: string[] = []
    for (const w of completed) {
      for (const we of w.exercises) {
        if (!seen.includes(we.exerciseId) && rmSeries(completed, we.exerciseId).length >= 2) {
          seen.push(we.exerciseId)
        }
        if (seen.length >= 2) return seen
      }
    }
    return seen
  }, [selected, completed, exercises])

  const persist = (ids: string[]) => {
    setSelected(ids)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
  }

  const latestBw = profile.bodyweight[profile.bodyweight.length - 1]
  const prevBw = profile.bodyweight[profile.bodyweight.length - 2]

  return (
    <div className="px-5 pt-8">
      <div className="flex items-end justify-between">
        <h1 className="font-condensed text-[32px] font-bold leading-none">Trends</h1>
        <div className="flex gap-1">
          {RANGES.map((r) => (
            <button
              key={r.label}
              onClick={() => setRange(r.days)}
              className={`rounded-[6px] px-2.5 py-1 font-mono text-[10px] uppercase ${
                range === r.days ? 'bg-lime font-semibold text-on-lime' : 'bg-chip text-muted'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={() => setPickerOpen(true)}
        className="mt-4 h-11 w-full rounded-[10px] border border-white/8 bg-card px-3.5 text-left text-[13.5px] text-label active:opacity-70"
      >
        ⌕ Add exercise to compare…
      </button>

      <div className="mt-3 flex flex-col gap-3">
        {shown.map((id) => {
          const ex = exercises.get(id)
          const series = filterRange(rmSeries(completed, id), range)
          const delta = e1rmDelta(completed, id)
          const last = lastSession(completed, id)
          const tone =
            delta?.deltaPct == null || Math.abs(delta.deltaPct) < 0.05
              ? 'text-muted'
              : delta.deltaPct > 0
                ? 'text-pos'
                : 'text-danger'
          return (
            <Card key={id}>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-[13.5px] font-semibold">{ex?.name ?? id}</span>
                <span className="flex items-center gap-2">
                  {delta && (
                    <span className={`font-mono text-[12px] ${tone}`}>
                      {delta.current.toFixed(1)} KG
                      {delta.deltaPct !== null &&
                        ` ${delta.deltaPct >= 0 ? '↑' : '↓'}${Math.abs(delta.deltaPct).toFixed(1)}%`}
                    </span>
                  )}
                  {selected.includes(id) && (
                    <button
                      className="text-faint"
                      aria-label="remove chart"
                      onClick={() => persist(selected.filter((x) => x !== id))}
                    >
                      ✕
                    </button>
                  )}
                </span>
              </div>
              <RmPlot points={series} height={110} showVolume={volumeFor[id] ?? false} />
              <div className="mt-1.5 flex gap-1">
                <span className="rounded-[6px] border border-teal/40 px-2 py-1 font-mono text-[10px] text-teal">
                  e1RM ●
                </span>
                <button
                  onClick={() => setVolumeFor((v) => ({ ...v, [id]: !v[id] }))}
                  className={`rounded-[6px] border px-2 py-1 font-mono text-[10px] ${
                    volumeFor[id] ? 'border-lime/40 text-lime' : 'border-white/12 text-label'
                  }`}
                >
                  volume ◌
                </button>
              </div>
              {delta && last && (
                <p className="mt-2 border-t border-white/6 pt-2 font-mono text-[10.5px] text-muted">
                  @ current e1RM: 75% × 10 ≈ {Math.round((delta.current * 0.75) / 0.25) * 0.25} kg ·
                  85% × 5 ≈ {Math.round((delta.current * 0.85) / 0.25) * 0.25} kg
                </p>
              )}
            </Card>
          )
        })}
        {!shown.length && (
          <EmptyState>Log a few workouts and your strength trends will show up here.</EmptyState>
        )}
      </div>

      {latestBw && (
        <SunkenCard className="mt-3 flex items-center justify-between !py-3">
          <span className="text-[13px] text-body">Bodyweight</span>
          <span className="font-mono text-[12px]">
            {latestBw.weightKg} KG
            {prevBw && (
              <span className={latestBw.weightKg <= prevBw.weightKg ? 'text-pos' : 'text-warn'}>
                {' '}
                {latestBw.weightKg <= prevBw.weightKg ? '↓' : '↑'}
                {Math.abs(latestBw.weightKg - prevBw.weightKg).toFixed(1)}
              </span>
            )}
          </span>
        </SunkenCard>
      )}

      {pickerOpen && (
        <ExercisePicker
          onClose={() => setPickerOpen(false)}
          onPick={(e) => {
            if (!shown.includes(e.id)) persist([...(selected.length ? selected : shown), e.id])
            setPickerOpen(false)
          }}
        />
      )}
    </div>
  )
}
