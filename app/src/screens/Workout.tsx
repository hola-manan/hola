import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { repo } from '../lib/repo'
import { ai } from '../lib/ai'
import { advance, currentDayLabel } from '../lib/cycle'
import { lastSession, presetFromWorkout, uuid } from '../lib/workout'
import { formatSet } from '../lib/volume'
import { useStore, useUid } from '../store'
import type { Exercise, Segment, SetType, Workout, WorkoutExercise } from '../types'
import { Btn, Card, EmptyState, Stepper } from '../components/ui'
import { ExercisePicker } from '../components/ExercisePicker'
import { RestTimer } from '../components/RestTimer'

const DEFAULT_REST_SECONDS = 120

export function WorkoutScreen() {
  const { activeWorkout, workouts, exercises, presets, cycle } = useStore()
  const uid = useUid()
  const navigate = useNavigate()
  const [picker, setPicker] = useState<null | { swapIndex?: number }>(null)
  const [restEndsAt, setRestEndsAt] = useState<number | null>(null)
  const [finishing, setFinishing] = useState(false)

  const history = useMemo(
    () => workouts.filter((w) => w.status === 'completed'),
    [workouts],
  )

  if (!activeWorkout) {
    return <EmptyState>No workout in progress.</EmptyState>
  }
  const w = activeWorkout
  const save = (next: Workout) => repo.saveWorkout(uid, next)

  const updateExercise = (i: number, we: WorkoutExercise) => {
    const next = { ...w, exercises: w.exercises.map((e, j) => (j === i ? we : e)) }
    save(next)
  }

  const addExercise = (e: Exercise) => {
    if (picker?.swapIndex !== undefined) {
      const i = picker.swapIndex
      updateExercise(i, { ...w.exercises[i], exerciseId: e.id, sets: [] })
    } else {
      save({ ...w, exercises: [...w.exercises, { exerciseId: e.id, sets: [] }] })
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
    // Completing a workout advances the cycle when it was for the current day.
    if (cycle && w.cycleDay && currentDayLabel(cycle).toLowerCase() === w.cycleDay.toLowerCase()) {
      await repo.saveCycle(uid, advance(cycle))
    }
    // Auto post-workout report; fire-and-forget (needs connectivity, logging doesn't).
    ai.generateReport({ workoutId: w.id }).catch(() => {})
    navigate(`/history/${w.id}`, { replace: true })
  }

  return (
    <div className="px-4 pt-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{w.name ?? w.cycleDay ?? 'Workout'}</h1>
          <div className="text-xs text-ink-dim">
            started {new Date(w.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
        <Btn variant="danger" onClick={discard}>
          Discard
        </Btn>
      </div>

      {w.exercises.map((we, i) => (
        <ExerciseCard
          key={`${we.exerciseId}-${i}`}
          we={we}
          exercise={exercises.get(we.exerciseId)}
          history={history}
          onChange={(next) => updateExercise(i, next)}
          onLogged={() => onSetLogged(i)}
          onSwap={() => setPicker({ swapIndex: i })}
          onRemove={() => remove(i)}
          onMoveUp={() => move(i, -1)}
          onMoveDown={() => move(i, 1)}
        />
      ))}

      <Btn variant="ghost" className="mb-3 w-full py-3.5" onClick={() => setPicker({})}>
        ＋ Add exercise
      </Btn>
      <Btn
        className="mb-8 w-full py-3.5 text-base"
        disabled={!w.exercises.some((e) => e.sets.length)}
        onClick={() => (w.presetId ? setFinishing(true) : finish(false))}
      >
        Complete workout
      </Btn>

      {finishing && (
        <div className="fixed inset-0 z-30 grid place-items-center bg-black/70 p-6">
          <Card className="w-full">
            <p className="mb-3 text-sm">
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
          onDone={() => setRestEndsAt(null)}
          onAdjust={(d) => setRestEndsAt((t) => (t ? t + d * 1000 : t))}
        />
      )}
    </div>
  )
}

const SET_TYPES: { key: SetType; label: string }[] = [
  { key: 'working', label: 'Work' },
  { key: 'warmup', label: 'Warm-up' },
  { key: 'drop', label: 'Drop' },
  { key: 'failure', label: 'Failure' },
]

function ExerciseCard({
  we,
  exercise,
  history,
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
  onChange: (we: WorkoutExercise) => void
  onLogged: () => void
  onSwap: () => void
  onRemove: () => void
  onMoveUp: () => void
  onMoveDown: () => void
}) {
  const last = useMemo(() => lastSession(history, we.exerciseId), [history, we.exerciseId])
  const nextTarget = we.targetSets?.[we.sets.length]
  const lastFirst = last?.sets[Math.min(we.sets.length, last.sets.length - 1)]?.segments[0]

  const [menuOpen, setMenuOpen] = useState(false)
  const [weight, setWeight] = useState<number>(
    nextTarget?.weightKg ?? lastFirst?.weightKg ?? 20,
  )
  const [reps, setReps] = useState<number>(nextTarget?.reps ?? lastFirst?.reps ?? 8)
  const [type, setType] = useState<SetType>('working')
  const [rpe, setRpe] = useState<number | null>(null)
  /** Segments already banked for the set currently being performed. */
  const [pendingSegments, setPendingSegments] = useState<Segment[]>([])

  const resetEditor = (setsLogged: number) => {
    const target = we.targetSets?.[setsLogged]
    if (target?.weightKg != null) setWeight(target.weightKg)
    if (target) setReps(target.reps)
    setType('working')
    setRpe(null)
    setPendingSegments([])
  }

  const logSet = () => {
    const segments = [...pendingSegments, { weightKg: weight, reps }]
    const set = {
      id: uuid(),
      segments,
      type,
      ...(rpe !== null ? { rpe } : {}),
      completedAt: Date.now(),
    }
    onChange({ ...we, sets: [...we.sets, set] })
    resetEditor(we.sets.length + 1)
    onLogged()
  }

  const bankSegment = () => {
    setPendingSegments((s) => [...s, { weightKg: weight, reps }])
    // Mid-set weight changes usually go down; leave weight for the user to adjust.
    setReps(Math.max(1, Math.round(reps / 2)))
  }

  const deleteSet = (id: string) =>
    onChange({ ...we, sets: we.sets.filter((s) => s.id !== id) })

  const targetCount = we.targetSets?.length ?? 0

  return (
    <Card className="mb-3">
      <div className="flex items-start justify-between">
        <div>
          <div className="font-semibold">{exercise?.name ?? we.exerciseId}</div>
          <div className="text-xs text-ink-dim">
            {targetCount > 0 && `target ${we.sets.length}/${targetCount} sets`}
            {nextTarget &&
              ` · next ${nextTarget.weightKg != null ? `${nextTarget.weightKg} kg × ` : ''}${nextTarget.reps}`}
          </div>
          {last && (
            <div className="mt-0.5 text-xs text-ink-dim">
              last time ({new Date(last.workout.startedAt).toLocaleDateString()}):{' '}
              {last.sets.map((s) => formatSet(s)).join(' · ')}
            </div>
          )}
        </div>
        <button className="px-2 text-xl text-ink-dim" onClick={() => setMenuOpen((v) => !v)}>
          ⋯
        </button>
      </div>

      {menuOpen && (
        <div className="mt-2 flex flex-wrap gap-2">
          <Btn variant="ghost" onClick={onSwap}>
            Swap
          </Btn>
          <Btn variant="ghost" onClick={onMoveUp}>
            ↑
          </Btn>
          <Btn variant="ghost" onClick={onMoveDown}>
            ↓
          </Btn>
          <Btn variant="danger" onClick={onRemove}>
            Remove
          </Btn>
        </div>
      )}

      {we.sets.length > 0 && (
        <div className="mt-3 flex flex-col gap-1">
          {we.sets.map((s, idx) => (
            <div key={s.id} className="flex items-center justify-between rounded-lg bg-surface-2 px-3 py-1.5 text-sm">
              <span>
                <span className="mr-2 text-ink-dim">{idx + 1}.</span>
                {formatSet(s)}
                {s.type !== 'working' && <span className="ml-2 text-xs text-warn">{s.type}</span>}
                {s.rpe != null && <span className="ml-2 text-xs text-ink-dim">RPE {s.rpe}</span>}
              </span>
              <button className="pl-3 text-ink-dim" onClick={() => deleteSet(s.id)} aria-label="delete set">
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {pendingSegments.length > 0 && (
        <div className="mt-2 rounded-lg border border-warn/40 px-3 py-1.5 text-sm text-warn">
          this set so far: {pendingSegments.map((s) => `${s.weightKg}×${s.reps}`).join(' + ')} + …
        </div>
      )}

      <div className="mt-3 flex items-end justify-center gap-4">
        <Stepper label="kg" value={weight} onChange={setWeight} step={2.5} />
        <Stepper label="reps" value={reps} onChange={setReps} step={1} min={1} />
      </div>

      <div className="mt-2 flex items-center justify-center gap-2">
        {SET_TYPES.map((t) => (
          <button
            key={t.key}
            onClick={() => setType(t.key)}
            className={`rounded-full px-2.5 py-1 text-xs ${
              type === t.key ? 'bg-accent text-accent-ink' : 'bg-surface-2 text-ink-dim'
            }`}
          >
            {t.label}
          </button>
        ))}
        <button
          onClick={() => setRpe(rpe === null ? 8 : null)}
          className={`rounded-full px-2.5 py-1 text-xs ${
            rpe !== null ? 'bg-accent text-accent-ink' : 'bg-surface-2 text-ink-dim'
          }`}
        >
          RPE
        </button>
        {rpe !== null && (
          <input
            type="number"
            inputMode="decimal"
            className="h-8 w-12 rounded-lg bg-surface-2 text-center text-sm"
            value={rpe}
            min={1}
            max={10}
            step={0.5}
            onChange={(e) => setRpe(parseFloat(e.target.value) || 8)}
          />
        )}
      </div>

      <div className="mt-3 flex gap-2">
        <Btn variant="ghost" className="flex-1" onClick={bankSegment}>
          ＋ Weight change
        </Btn>
        <Btn className="flex-[2]" onClick={logSet}>
          Log set{pendingSegments.length > 0 ? ` (${pendingSegments.length + 1} seg)` : ''}
        </Btn>
      </div>
    </Card>
  )
}
