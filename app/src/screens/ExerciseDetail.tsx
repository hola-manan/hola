import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { rmSeries } from '../lib/rm'
import { lastSession } from '../lib/workout'
import { useStore } from '../store'
import { Card, EmptyState, Eyebrow } from '../components/ui'
import { RmChart } from '../components/RmChart'

export function ExerciseDetail() {
  const { id } = useParams()
  const { exercises, workouts } = useStore()
  const [imgIndex, setImgIndex] = useState(0)
  const exercise = id ? exercises.get(id) : undefined

  const completed = useMemo(() => workouts.filter((w) => w.status === 'completed'), [workouts])
  const series = useMemo(() => (id ? rmSeries(completed, id) : []), [completed, id])
  const bestSet = useMemo(() => {
    if (!series.length) return null
    const best = series.reduce((a, b) => (b.bestWeightKg > a.bestWeightKg ? b : a))
    return `${best.bestWeightKg}kg`
  }, [series])
  const last = id ? lastSession(completed, id) : null

  if (!exercise) return <EmptyState>Exercise not found.</EmptyState>

  const current = series.length ? series[series.length - 1] : null
  const sessions = series.length
  const atPct = (pct: number) => Math.round((current!.e1rm * pct) / 0.25) * 0.25

  return (
    <div className="px-5 pt-8">
      {/* media hero */}
      <button
        className="relative mb-4 block h-[200px] w-full overflow-hidden rounded-[12px]"
        onClick={() => exercise.images.length > 1 && setImgIndex((i) => (i + 1) % exercise.images.length)}
        style={{ background: 'repeating-linear-gradient(45deg,#1b1f26 0 6px,#14171c 6px 12px)' }}
      >
        {exercise.images[imgIndex] && (
          <img src={exercise.images[imgIndex]} alt={exercise.name} className="h-full w-full bg-white object-contain" />
        )}
        {exercise.images.length > 1 && (
          <span className="absolute bottom-2 right-2 rounded bg-black/60 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] text-body">
            tap · {imgIndex + 1}/{exercise.images.length}
          </span>
        )}
        {!exercise.images.length && (
          <span className="absolute inset-0 grid place-items-center">
            <span className="grid h-[52px] w-[52px] place-items-center rounded-full border border-lime bg-lime/14 text-lime">
              ▶
            </span>
          </span>
        )}
      </button>

      <h1 className="font-condensed text-[28px] font-bold leading-tight">{exercise.name}</h1>

      <div className="mt-2 flex flex-wrap gap-1.5">
        {exercise.primaryMuscles.map((m) => (
          <span key={m} className="rounded-[6px] bg-teal/12 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.08em] text-teal">
            {m} · primary
          </span>
        ))}
        {exercise.secondaryMuscles.map((m) => (
          <span key={m} className="rounded-[6px] border border-white/10 bg-card px-2 py-1 font-mono text-[10px] uppercase tracking-[0.08em] text-muted">
            {m}
          </span>
        ))}
        <span className="rounded-[6px] border border-white/10 bg-card px-2 py-1 font-mono text-[10px] uppercase tracking-[0.08em] text-muted">
          {exercise.equipment}
        </span>
      </div>

      <div className="mt-4 flex rounded-[10px] border border-white/8 bg-card px-1 py-2.5">
        {[
          { v: current ? current.e1rm.toFixed(1) : '—', l: 'e1RM kg', lime: true },
          { v: bestSet ?? '—', l: 'best set' },
          { v: String(sessions), l: 'sessions' },
          {
            v: current
              ? new Date(current.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }).toUpperCase()
              : '—',
            l: 'last done',
          },
        ].map((s, i) => (
          <div key={s.l} className={`flex-1 px-2.5 ${i > 0 ? 'border-l border-white/7' : ''}`}>
            <div className={`font-mono text-[14px] font-medium ${s.lime ? 'text-lime' : 'text-ink'}`}>{s.v}</div>
            <div className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.1em] text-label">{s.l}</div>
          </div>
        ))}
      </div>

      <Card className="mt-3">
        <Eyebrow className="mb-2">ESTIMATED 1RM · KG</Eyebrow>
        <RmChart points={series} />
        {current && (
          <p className="mt-2 border-t border-white/6 pt-2 font-mono text-[11px] text-muted">
            @ current e1RM: 75% × 10 ≈ {atPct(0.75)} kg · 85% × 5 ≈ {atPct(0.85)} kg
          </p>
        )}
      </Card>

      {last && (
        <Card className="mt-3">
          <Eyebrow className="mb-1">
            LAST SESSION ·{' '}
            {new Date(last.workout.startedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }).toUpperCase()}
          </Eyebrow>
          <div className="font-mono text-[12.5px] text-body">
            {last.sets.map((s) => s.segments.map((seg) => `${seg.weightKg}×${seg.reps}`).join('+')).join(' · ')}
          </div>
        </Card>
      )}

      {exercise.instructions.length > 0 && (
        <Card className="mb-6 mt-3">
          <Eyebrow className="mb-2">HOW TO</Eyebrow>
          <ol className="list-decimal space-y-2 pl-5 text-[13px] leading-relaxed text-body">
            {exercise.instructions.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
        </Card>
      )}
    </div>
  )
}
