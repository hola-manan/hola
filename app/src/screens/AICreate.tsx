import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ai } from '../lib/ai'
import { repo } from '../lib/repo'
import { emptyWorkout, presetFromWorkout } from '../lib/workout'
import { useStore, useUid } from '../store'
import type { Workout, WorkoutDraft } from '../types'
import { Btn, Card, EmptyState, Screen, Stepper } from '../components/ui'
import { ExercisePicker } from '../components/ExercisePicker'

export function AICreate() {
  const { exercises, activeWorkout } = useStore()
  const uid = useUid()
  const navigate = useNavigate()
  const [draft, setDraft] = useState<WorkoutDraft | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [instruction, setInstruction] = useState('')
  const [swapIndex, setSwapIndex] = useState<number | null>(null)
  const [savePreset, setSavePreset] = useState(false)
  const requested = useRef(false)

  const generate = async (instr?: string) => {
    setBusy(true)
    setError('')
    try {
      setDraft(await ai.createWorkout({ instruction: instr }))
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    if (!requested.current) {
      requested.current = true
      generate()
    }
  }, [])

  const updateExercise = (i: number, patch: Partial<WorkoutDraft['exercises'][number]>) => {
    if (!draft) return
    setDraft({
      ...draft,
      exercises: draft.exercises.map((e, j) => (j === i ? { ...e, ...patch } : e)),
    })
  }

  const accept = async () => {
    if (!draft) return
    const workout: Workout = {
      ...emptyWorkout(draft.cycleDay),
      name: draft.name,
      exercises: draft.exercises.map((e) => ({
        exerciseId: e.exerciseId,
        targetSets: e.sets.map((s) => ({ weightKg: s.weightKg, reps: s.reps })),
        restSeconds: e.restSeconds,
        sets: [],
      })),
    }
    if (savePreset) {
      await repo.savePreset(uid, presetFromWorkout(workout, draft.name))
    }
    await repo.saveWorkout(uid, workout)
    navigate('/workout', { replace: true })
  }

  if (activeWorkout) {
    return <EmptyState>Finish or discard the workout in progress first.</EmptyState>
  }

  return (
    <Screen title="AI workout">
      {busy && <EmptyState>The coach is drafting your workout…</EmptyState>}
      {error && (
        <Card className="mb-3">
          <p className="mb-2 text-sm text-danger">{error}</p>
          <Btn onClick={() => generate(instruction || undefined)}>Try again</Btn>
        </Card>
      )}

      {draft && !busy && (
        <>
          <div className="mb-3 text-sm text-ink-dim">
            {draft.name}
            {draft.cycleDay ? ` · for your ${draft.cycleDay} day` : ''} — review, tweak, then start.
          </div>

          {draft.exercises.map((e, i) => (
            <Card key={`${e.exerciseId}-${i}`} className="mb-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-semibold">{exercises.get(e.exerciseId)?.name ?? e.exerciseId}</div>
                  <div className="mt-0.5 text-xs italic text-ink-dim">{e.rationale}</div>
                </div>
                <button
                  className="pl-2 text-ink-dim"
                  onClick={() =>
                    setDraft({ ...draft, exercises: draft.exercises.filter((_, j) => j !== i) })
                  }
                  aria-label="remove exercise"
                >
                  ✕
                </button>
              </div>

              <div className="mt-2 flex flex-col gap-2">
                {e.sets.map((s, si) => (
                  <div key={si} className="flex items-center justify-center gap-3">
                    <span className="w-6 text-right text-xs text-ink-dim">{si + 1}.</span>
                    <Stepper
                      label="kg"
                      value={s.weightKg}
                      step={2.5}
                      onChange={(v) =>
                        updateExercise(i, {
                          sets: e.sets.map((x, xi) => (xi === si ? { ...x, weightKg: v } : x)),
                        })
                      }
                    />
                    <Stepper
                      label="reps"
                      value={s.reps}
                      step={1}
                      min={1}
                      onChange={(v) =>
                        updateExercise(i, {
                          sets: e.sets.map((x, xi) => (xi === si ? { ...x, reps: v } : x)),
                        })
                      }
                    />
                    <button
                      className="text-ink-dim"
                      onClick={() => updateExercise(i, { sets: e.sets.filter((_, xi) => xi !== si) })}
                      aria-label="remove set"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
              <div className="mt-2 flex gap-2">
                <Btn variant="ghost" className="flex-1" onClick={() => setSwapIndex(i)}>
                  Swap
                </Btn>
                <Btn
                  variant="ghost"
                  className="flex-1"
                  onClick={() =>
                    updateExercise(i, { sets: [...e.sets, e.sets[e.sets.length - 1] ?? { weightKg: 20, reps: 8 }] })
                  }
                >
                  ＋ Set
                </Btn>
              </div>
            </Card>
          ))}

          <Card className="mb-3">
            <label className="mb-1 block text-xs uppercase tracking-wide text-ink-dim">
              Regenerate with an instruction
            </label>
            <div className="flex gap-2">
              <input
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                placeholder='e.g. "no barbell today, gym is packed"'
                className="h-11 flex-1 rounded-xl bg-surface-2 px-3 text-sm"
              />
              <Btn variant="ghost" disabled={busy} onClick={() => generate(instruction || undefined)}>
                Redo
              </Btn>
            </div>
          </Card>

          <label className="mb-3 flex items-center gap-2 px-1 text-sm text-ink-dim">
            <input
              type="checkbox"
              checked={savePreset}
              onChange={(e) => setSavePreset(e.target.checked)}
              className="h-4 w-4 accent-(--color-accent)"
            />
            Also save as a preset
          </label>

          <Btn
            className="w-full py-3.5 text-base"
            disabled={!draft.exercises.length}
            onClick={accept}
          >
            Start this workout
          </Btn>
        </>
      )}

      {swapIndex !== null && draft && (
        <ExercisePicker
          nearMuscles={exercises.get(draft.exercises[swapIndex].exerciseId)?.primaryMuscles}
          onClose={() => setSwapIndex(null)}
          onPick={(picked) => {
            updateExercise(swapIndex, { exerciseId: picked.id })
            setSwapIndex(null)
          }}
        />
      )}
    </Screen>
  )
}
