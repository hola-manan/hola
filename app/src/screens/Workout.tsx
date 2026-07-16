import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { repo } from '../lib/repo'
import { ai } from '../lib/ai'
import { advance, currentDayLabel } from '../lib/cycle'
import { lastSession, presetFromWorkout, uuid } from '../lib/workout'
import { formatSet, workingSetCount, workoutVolume } from '../lib/volume'
import { useStore, useUid } from '../store'
import type { Exercise, Segment, Workout, WorkoutExercise, WorkoutSet } from '../types'
import { Btn, Card, EmptyState, Eyebrow } from '../components/ui'
import { ExercisePicker } from '../components/ExercisePicker'
import { RestTimer } from '../components/RestTimer'

const DEFAULT_REST_SECONDS = 120

const fmtClock = (ms: number) => {
  const s = Math.floor(ms / 1000)
  const m = Math.floor(s / 60)
  return `${m}:${String(s % 60).padStart(2, '0')}`
}
const fmtRest = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

export function WorkoutScreen() {
  const { activeWorkout, workouts, exercises, presets, cycle } = useStore()
  const uid = useUid()
  const navigate = useNavigate()
  const [picker, setPicker] = useState<null | { swapIndex?: number }>(null)
  const [restEndsAt, setRestEndsAt] = useState<number | null>(null)
  const [restTotal, setRestTotal] = useState(DEFAULT_REST_SECONDS)
  const [finishing, setFinishing] = useState(false)
  const [focused, setFocused] = useState(0)
  const [, tick] = useState(0)

  useEffect(() => {
    const t = setInterval(() => tick((n) => n + 1), 1000)
    return () => clearInterval(t)
  }, [])

  const history = useMemo(() => workouts.filter((w) => w.status === 'completed'), [workouts])

  if (!activeWorkout) {
    return <EmptyState>No workout in progress.</EmptyState>
  }
  const w = activeWorkout
  const save = (next: Workout) => repo.saveWorkout(uid, next)

  const updateExercise = (i: number, we: WorkoutExercise) =>
    save({ ...w, exercises: w.exercises.map((e, j) => (j === i ? we : e)) })

  const addExercise = (e: Exercise) => {
    if (picker?.swapIndex !== undefined) {
      const i = picker.swapIndex
      updateExercise(i, { ...w.exercises[i], exerciseId: e.id, sets: [] })
    } else {
      save({ ...w, exercises: [...w.exercises, { exerciseId: e.id, sets: [] }] })
      setFocused(w.exercises.length)
    }
    setPicker(null)
  }

  const move = (i: number, dir: -1 | 1) => {
    const list = [...w.exercises]
    const j = i + dir
    if (j < 0 || j >= list.length) return
    ;[list[i], list[j]] = [list[j], list[i]]
    save({ ...w, exercises: list })
  }

  const remove = (i: number) => save({ ...w, exercises: w.exercises.filter((_, j) => j !== i) })

  const onSetLogged = (i: number) => {
    const rest = w.exercises[i].restSeconds ?? DEFAULT_REST_SECONDS
    setRestTotal(rest)
    setRestEndsAt(Date.now() + rest * 1000)
  }

  const discard = async () => {
    if (!confirm('Discard this workout? Logged sets will be lost.')) return
    await repo.deleteWorkout(uid, w.id)
    navigate('/')
  }

  const finish = async (saveBackToPreset: boolean) => {
    const completed: Workout = { ...w, status: 'completed', completedAt: Date.now() }
    await save(completed)
    if (saveBackToPreset && w.presetId) {
      const preset = presets.find((p) => p.id === w.presetId)
      if (preset) await repo.savePreset(uid, presetFromWorkout(completed, preset.name, preset))
    }
    if (cycle && w.cycleDay && currentDayLabel(cycle).toLowerCase() === w.cycleDay.toLowerCase()) {
      await repo.saveCycle(uid, advance(cycle))
    }
    ai.generateReport({ workoutId: w.id }).catch(() => {})
    navigate(`/history/${w.id}`, { replace: true })
  }

  const plannedSets = w.exercises.reduce(
    (sum, e) => sum + Math.max(e.targetSets?.length ?? 0, e.sets.length),
    0,
  )

  return (
    <div className="pb-16">
      {/* header bar */}
      <div className="flex items-center justify-between border-b border-white/8 px-4 py-2.5">
        <button
          onClick={discard}
          aria-label="discard workout"
          className="grid h-[34px] w-11 place-items-center rounded-[9px] bg-chip text-danger"
        >
          ✕
        </button>
        <span className="font-mono text-[13px] text-body">{fmtClock(Date.now() - w.startedAt)}</span>
        <Btn
          className="px-5 py-1.5"
          disabled={!w.exercises.some((e) => e.sets.length)}
          onClick={() => (w.presetId ? setFinishing(true) : finish(false))}
        >
          Finish
        </Btn>
      </div>

      {/* session meta */}
      <div className="flex items-center justify-between px-5 py-2.5">
        <Eyebrow>
          {(w.cycleDay ?? w.name ?? 'workout').toUpperCase()} ·{' '}
          {new Date(w.startedAt)
            .toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
            .toUpperCase()}
        </Eyebrow>
        <Eyebrow>
          {workingSetCount(w)} / {Math.max(plannedSets, workingSetCount(w))} SETS · VOL{' '}
          {Math.round(workoutVolume(w)).toLocaleString()} KG
        </Eyebrow>
      </div>

      <div className="px-4">
        {w.exercises.map((we, i) => (
          <div key={`${we.exerciseId}-${i}`} onClick={() => setFocused(i)}>
            <ExerciseGrid
              we={we}
              exercise={exercises.get(we.exerciseId)}
              history={history}
              active={focused === i}
              onChange={(next) => updateExercise(i, next)}
              onLogged={() => onSetLogged(i)}
              onSwap={() => setPicker({ swapIndex: i })}
              onRemove={() => remove(i)}
              onMoveUp={() => move(i, -1)}
              onMoveDown={() => move(i, 1)}
            />
          </div>
        ))}

        <Btn variant="dashed" className="mb-2 mt-1 w-full py-3" onClick={() => setPicker({})}>
          ＋ Add exercise
        </Btn>
        <p className="mb-6 text-center font-mono text-[9.5px] uppercase tracking-[0.1em] text-faint">
          Multi-segment set counts as 1 set · volume sums all segments
        </p>
      </div>

      {finishing && (
        <div className="fixed inset-0 z-30 grid place-items-center bg-black/70 p-6">
          <Card className="w-full">
            <p className="mb-3 text-[13px] text-body">
              You tweaked things mid-workout. Save the changes back to the preset, or keep the
              preset as it was?
            </p>
            <div className="flex flex-col gap-2">
              <Btn onClick={() => finish(false)}>Keep preset as-is</Btn>
              <Btn variant="ghost" onClick={() => finish(true)}>
                Save changes to preset
              </Btn>
            </div>
          </Card>
        </div>
      )}

      {picker && (
        <ExercisePicker
          onPick={addExercise}
          onClose={() => setPicker(null)}
          nearMuscles={
            picker.swapIndex !== undefined
              ? exercises.get(w.exercises[picker.swapIndex].exerciseId)?.primaryMuscles
              : undefined
          }
        />
      )}
      {restEndsAt && (
        <RestTimer
          endsAt={restEndsAt}
          totalSeconds={restTotal}
          onDone={() => setRestEndsAt(null)}
          onAdjust={(d) => setRestEndsAt((t) => (t ? t + d * 1000 : t))}
        />
      )}
    </div>
  )
}

const GRID = 'grid grid-cols-[36px_1fr_64px_56px_34px] items-center gap-2'

/** One exercise as the 1c grid: Set / Previous / kg / Reps / ✓, with inline segments. */
function ExerciseGrid({
  we,
  exercise,
  history,
  active,
  onChange,
  onLogged,
  onSwap,
  onRemove,
  onMoveUp,
  onMoveDown,
}: {
  we: WorkoutExercise
  exercise: Exercise | undefined
  history: Workout[]
  active: boolean
  onChange: (we: WorkoutExercise) => void
  onLogged: () => void
  onSwap: () => void
  onRemove: () => void
  onMoveUp: () => void
  onMoveDown: () => void
}) {
  const last = useMemo(() => lastSession(history, we.exerciseId), [history, we.exerciseId])
  const done = we.sets.length
  const nextTarget = we.targetSets?.[done]
  const prevFor = (setIndex: number): string => {
    const s = last?.sets[Math.min(setIndex, (last?.sets.length ?? 1) - 1)]
    return s ? formatSet(s).replace(/×/g, ' × ') : '—'
  }

  const [menuOpen, setMenuOpen] = useState(false)
  const [weight, setWeight] = useState<string>(() =>
    String(nextTarget?.weightKg ?? last?.sets[0]?.segments[0]?.weightKg ?? ''),
  )
  const [reps, setReps] = useState<string>(() =>
    String(nextTarget?.reps ?? last?.sets[0]?.segments[0]?.reps ?? ''),
  )
  const [warmup, setWarmup] = useState(false)
  const [rpe, setRpe] = useState<string>('')
  const [showRpe, setShowRpe] = useState(false)
  const [pendingSegments, setPendingSegments] = useState<Segment[]>([])

  const resetEditor = (nextDone: number) => {
    const t = we.targetSets?.[nextDone]
    if (t) {
      setWeight(t.weightKg != null ? String(t.weightKg) : '')
      setReps(String(t.reps))
    }
    setWarmup(false)
    setRpe('')
    setShowRpe(false)
    setPendingSegments([])
  }

  const logSet = () => {
    const wKg = parseFloat(weight)
    const r = parseInt(reps, 10)
    if (!Number.isFinite(r) || r < 1) return
    const segments = [...pendingSegments, { weightKg: Number.isFinite(wKg) ? wKg : 0, reps: r }]
    const set: WorkoutSet = {
      id: uuid(),
      segments,
      type: warmup ? 'warmup' : 'working',
      ...(rpe && parseFloat(rpe) ? { rpe: parseFloat(rpe) } : {}),
      completedAt: Date.now(),
    }
    onChange({ ...we, sets: [...we.sets, set] })
    resetEditor(we.sets.length + 1)
    onLogged()
  }

  const bankSegment = () => {
    const wKg = parseFloat(weight)
    const r = parseInt(reps, 10)
    if (!Number.isFinite(r) || r < 1) return
    setPendingSegments((s) => [...s, { weightKg: Number.isFinite(wKg) ? wKg : 0, reps: r }])
    setReps('')
  }

  const deleteSet = (id: string) => {
    if (confirm('Delete this set?')) onChange({ ...we, sets: we.sets.filter((s) => s.id !== id) })
  }

  const targetCount = Math.max(we.targetSets?.length ?? 0, done + 1)
  const restSeconds = we.restSeconds ?? DEFAULT_REST_SECONDS

  const inputCell = (
    value: string,
    onValue: (v: string) => void,
    label: string,
  ) => (
    <input
      inputMode="decimal"
      aria-label={label}
      value={value}
      onChange={(e) => onValue(e.target.value)}
      className="h-9 w-full rounded-[7px] border border-lime/50 bg-bg text-center font-mono text-[14px] font-medium text-white outline-none focus:border-lime"
    />
  )

  return (
    <div className={`mb-4 ${active ? '' : 'opacity-70'}`}>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-[15px] font-semibold text-lime">{exercise?.name ?? we.exerciseId}</span>
        <button
          className="grid h-[30px] w-9 place-items-center rounded-[7px] bg-chip text-muted"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="exercise menu"
        >
          ···
        </button>
      </div>
      {last && (
        <Eyebrow className="mb-2">
          LAST {new Date(last.workout.startedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }).toUpperCase()}
          {' · '}
          {last.sets.map((s) => formatSet(s)).join('  ')}
        </Eyebrow>
      )}

      {menuOpen && (
        <div className="mb-2 flex gap-2">
          <Btn variant="ghost" className="px-3 py-1.5 text-[12px]" onClick={onSwap}>
            ⇄ Swap
          </Btn>
          <Btn variant="ghost" className="px-3 py-1.5 text-[12px]" onClick={onMoveUp}>
            ↑
          </Btn>
          <Btn variant="ghost" className="px-3 py-1.5 text-[12px]" onClick={onMoveDown}>
            ↓
          </Btn>
          <Btn variant="danger" className="px-3 py-1.5 text-[12px]" onClick={onRemove}>
            Remove
          </Btn>
        </div>
      )}

      {/* grid header */}
      <div className={`${GRID} mb-1`}>
        {['SET', 'PREVIOUS', 'KG', 'REPS', ''].map((h, i) => (
          <span key={i} className="font-mono text-[9.5px] uppercase tracking-[0.1em] text-label">
            {h}
          </span>
        ))}
      </div>

      {/* completed sets */}
      {we.sets.map((s, idx) => (
        <div key={s.id}>
          <div className={`${GRID} py-1 opacity-55`}>
            <span className="grid h-7 w-7 place-items-center rounded-[6px] bg-chip font-mono text-[12px]">
              {idx + 1}
            </span>
            <span className="font-mono text-[12px] text-muted">{prevFor(idx)}</span>
            <span className="text-center font-mono text-[13px]">{s.segments[0].weightKg}</span>
            <span className="text-center font-mono text-[13px]">{s.segments[0].reps}</span>
            <button className="text-center text-pos" onClick={() => deleteSet(s.id)} aria-label={`set ${idx + 1} done`}>
              ✓
            </button>
          </div>
          {s.segments.slice(1).map((seg, si) => (
            <div key={si} className={`${GRID} py-0.5 opacity-55`}>
              <span className="text-right font-mono text-[12px] text-lime">↳</span>
              <span className="font-mono text-[9.5px] uppercase tracking-[0.1em] text-label">
                SEGMENT {si + 2}{s.type === 'warmup' ? '' : ' · DROP'}
              </span>
              <span className="text-center font-mono text-[13px]">{seg.weightKg}</span>
              <span className="text-center font-mono text-[13px]">{seg.reps}</span>
              <span />
            </div>
          ))}
          {(s.type !== 'working' || s.rpe != null) && (
            <div className="pb-1 pl-11 font-mono text-[9.5px] uppercase tracking-[0.1em] text-faint">
              {s.type !== 'working' && s.type}
              {s.rpe != null && ` rpe ${s.rpe}`}
            </div>
          )}
          {idx < we.sets.length - 1 && <RestDivider seconds={restSeconds} />}
        </div>
      ))}

      {/* active set editor */}
      {active && (
        <>
          {done > 0 && <RestDivider seconds={restSeconds} />}
          <div className="rounded-[10px] border border-lime/35 bg-lime/3 p-1.5">
            <div className={GRID}>
              <span className="grid h-7 w-7 place-items-center rounded-[6px] bg-lime font-mono text-[12px] font-semibold text-on-lime">
                {done + 1}
              </span>
              <span className="font-mono text-[12px] text-muted">{prevFor(done)}</span>
              {inputCell(weight, setWeight, 'kg')}
              {inputCell(reps, setReps, 'reps')}
              <button
                onClick={logSet}
                aria-label="log set"
                className="grid h-9 w-8 place-items-center rounded-[7px] bg-lime text-[15px] font-bold text-on-lime active:opacity-70"
              >
                ✓
              </button>
            </div>
            {pendingSegments.map((seg, si) => (
              <div key={si} className={`${GRID} mt-1`}>
                <span className="text-right font-mono text-[12px] text-lime">↳</span>
                <span className="font-mono text-[9.5px] uppercase tracking-[0.1em] text-label">
                  SEGMENT {si + 1}
                </span>
                <span className="text-center font-mono text-[13px]">{seg.weightKg}</span>
                <span className="text-center font-mono text-[13px]">{seg.reps}</span>
                <button
                  className="text-center text-danger"
                  aria-label="remove segment"
                  onClick={() => setPendingSegments(pendingSegments.filter((_, x) => x !== si))}
                >
                  ✕
                </button>
              </div>
            ))}
            <div className="mt-2 flex items-center gap-2 pl-9">
              <button
                onClick={bankSegment}
                className="rounded-[7px] border border-dashed border-lime/40 px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.08em] text-lime active:opacity-70"
              >
                ＋ segment (weight change)
              </button>
              <button
                onClick={() => setShowRpe((v) => !v)}
                className={`rounded-[7px] border px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.08em] ${showRpe ? 'border-lime/40 text-lime' : 'border-white/12 text-muted'}`}
              >
                RPE
              </button>
              {showRpe && (
                <input
                  inputMode="decimal"
                  aria-label="rpe"
                  value={rpe}
                  onChange={(e) => setRpe(e.target.value)}
                  placeholder="8"
                  className="h-7 w-11 rounded-[7px] border border-white/12 bg-bg text-center font-mono text-[12px]"
                />
              )}
              <button
                onClick={() => setWarmup((v) => !v)}
                className={`rounded-[7px] border px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.08em] ${warmup ? 'border-warn/50 text-warn' : 'border-white/12 text-muted'}`}
              >
                warm-up
              </button>
            </div>
          </div>

          {/* upcoming target rows */}
          {(we.targetSets ?? []).slice(done + 1).map((t, ti) => (
            <div key={ti} className={`${GRID} py-1 opacity-45`}>
              <span className="grid h-7 w-7 place-items-center rounded-[6px] bg-chip font-mono text-[12px]">
                {done + 2 + ti}
              </span>
              <span className="font-mono text-[12px] text-muted">{prevFor(done + 1 + ti)}</span>
              <span className="text-center font-mono text-[13px] text-faint">{t.weightKg ?? '—'}</span>
              <span className="text-center font-mono text-[13px] text-faint">{t.reps}</span>
              <span className="text-center text-faint">✓</span>
            </div>
          ))}

          <button
            onClick={() =>
              onChange({
                ...we,
                targetSets: [
                  ...(we.targetSets ?? []),
                  we.targetSets?.[we.targetSets.length - 1] ?? {
                    weightKg: parseFloat(weight) || null,
                    reps: parseInt(reps, 10) || 8,
                  },
                ],
              })
            }
            className="mt-2 w-full rounded-[9px] border border-white/8 bg-card py-2 text-[12.5px] text-muted active:opacity-70"
          >
            ＋ Add set ({fmtRest(restSeconds)})
          </button>
        </>
      )}
      <div className="mt-3 border-b border-white/6" />
      <span className="sr-only">{targetCount}</span>
    </div>
  )
}

function RestDivider({ seconds }: { seconds: number }) {
  return (
    <div className="my-1 flex items-center gap-2 pl-9">
      <div className="h-[2px] flex-1 rounded bg-chip" />
      <span className="font-mono text-[10px] text-teal">{fmtRest(seconds)}</span>
      <div className="h-[2px] flex-1 rounded bg-chip" />
    </div>
  )
}
