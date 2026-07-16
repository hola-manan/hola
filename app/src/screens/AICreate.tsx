import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ai } from '../lib/ai'
import { repo } from '../lib/repo'
import { currentE1RM } from '../lib/rm'
import { emptyWorkout, presetFromWorkout } from '../lib/workout'
import { useStore, useUid } from '../store'
import type { Workout, WorkoutDraft } from '../types'
import { Btn, Card, EmptyState, Eyebrow } from '../components/ui'
import { ExercisePicker } from '../components/ExercisePicker'

const fmtRest = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

export function AICreate() {
  const { exercises, activeWorkout, workouts, readinessToday, profile } = useStore()
  const uid = useUid()
  const navigate = useNavigate()
  const [draft, setDraft] = useState<WorkoutDraft | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [instruction, setInstruction] = useState('')
  const [swapIndex, setSwapIndex] = useState<number | null>(null)
  const [savePreset, setSavePreset] = useState(false)
  const [editing, setEditing] = useState<number | null>(null)
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

  const moveExercise = (i: number, dir: -1 | 1) => {
    if (!draft) return
    const list = [...draft.exercises]
    const j = i + dir
    if (j < 0 || j >= list.length) return
    ;[list[i], list[j]] = [list[j], list[i]]
    setDraft({ ...draft, exercises: list })
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

  const completed = workouts.filter((x) => x.status === 'completed')

  const prescription = (e: WorkoutDraft['exercises'][number]) => {
    const sets = e.sets
    const allSame = sets.every((s) => s.weightKg === sets[0].weightKg && s.reps === sets[0].reps)
    const rm = currentE1RM(completed, e.exerciseId)
    const pct = rm && sets[0].weightKg ? Math.round((sets[0].weightKg / rm) * 100) : null
    const base = allSame
      ? `${sets.length} × ${sets[0].reps} @ ${sets[0].weightKg || 'BW'} KG`
      : sets.map((s) => `${s.weightKg || 'BW'}×${s.reps}`).join(' · ')
    return `${base}${pct ? ` · ~${pct}% e1RM` : ''} · REST ${fmtRest(e.restSeconds)}`
  }

  return (
    <div className="flex min-h-dvh flex-col px-5 pt-8">
      <div className="flex items-start justify-between">
        <div>
          <Eyebrow className="!text-lime">DRAFT · REVIEW BEFORE START</Eyebrow>
          <h1 className="mt-1.5 font-condensed text-[30px] font-bold leading-none">
            {draft?.name ?? "Today's workout"}
          </h1>
        </div>
        <button
          onClick={() => generate(instruction || undefined)}
          disabled={busy}
          aria-label="regenerate"
          className="grid h-9 w-9 place-items-center rounded-[9px] border border-white/14 text-[16px] text-ink active:opacity-70 disabled:opacity-40"
        >
          ⟳
        </button>
      </div>
      <p className="mt-1.5 text-[11.5px] text-label">
        Built from: last {draft?.cycleDay ?? 'session'} · weekly volume
        {readinessToday && ` · readiness ${readinessToday.sleep + readinessToday.energy}/10`}
        {profile.tweaks[0] && ` · tweak "${profile.tweaks[0]}"`} · e1RM table
      </p>

      <div className="mt-4 flex-1">
        {busy && <EmptyState>The coach is drafting your workout…</EmptyState>}
        {error && (
          <Card className="mb-3">
            <p className="mb-2 text-[13px] text-danger">{error}</p>
            <Btn onClick={() => generate(instruction || undefined)}>Try again</Btn>
          </Card>
        )}

        {draft && !busy && (
          <>
            {draft.exercises.map((e, i) => (
              <Card key={`${e.exerciseId}-${i}`} className="mb-2">
                <div className="flex items-start justify-between">
                  <span className="text-[14px] font-semibold">
                    {exercises.get(e.exerciseId)?.name ?? e.exerciseId}
                  </span>
                  <span className="flex gap-1.5 text-muted">
                    <button className="px-1" aria-label="swap" onClick={() => setSwapIndex(i)}>⇄</button>
                    <button className="px-1" aria-label="move up" onClick={() => moveExercise(i, -1)}>↑</button>
                    <button className="px-1" aria-label="move down" onClick={() => moveExercise(i, 1)}>↓</button>
                    <button
                      className="px-1 text-danger"
                      aria-label="remove"
                      onClick={() =>
                        setDraft({ ...draft, exercises: draft.exercises.filter((_, j) => j !== i) })
                      }
                    >
                      ✕
                    </button>
                  </span>
                </div>
                <button
                  className="mt-1 block text-left font-mono text-[12px] uppercase tracking-[0.04em] text-teal"
                  onClick={() => setEditing(editing === i ? null : i)}
                >
                  {prescription(e)}
                </button>
                <p className="mt-1 text-[11.5px] leading-snug text-label">{e.rationale}</p>

                {editing === i && (
                  <div className="mt-2 flex flex-col gap-1.5 border-t border-white/6 pt-2">
                    {e.sets.map((s, si) => (
                      <div key={si} className="flex items-center gap-2">
                        <span className="w-5 font-mono text-[11px] text-label">{si + 1}</span>
                        <input
                          inputMode="decimal"
                          aria-label="kg"
                          value={s.weightKg}
                          onChange={(ev) =>
                            updateExercise(i, {
                              sets: e.sets.map((x, xi) =>
                                xi === si ? { ...x, weightKg: parseFloat(ev.target.value) || 0 } : x,
                              ),
                            })
                          }
                          className="h-9 w-16 rounded-[7px] border border-white/12 bg-bg text-center font-mono text-[13px]"
                        />
                        <span className="font-mono text-[10px] text-label">KG ×</span>
                        <input
                          inputMode="numeric"
                          aria-label="reps"
                          value={s.reps}
                          onChange={(ev) =>
                            updateExercise(i, {
                              sets: e.sets.map((x, xi) =>
                                xi === si ? { ...x, reps: parseInt(ev.target.value, 10) || 1 } : x,
                              ),
                            })
                          }
                          className="h-9 w-14 rounded-[7px] border border-white/12 bg-bg text-center font-mono text-[13px]"
                        />
                        <button
                          className="ml-auto px-2 text-muted"
                          aria-label="remove set"
                          onClick={() =>
                            updateExercise(i, { sets: e.sets.filter((_, xi) => xi !== si) })
                          }
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    <button
                      className="mt-1 rounded-[7px] border border-dashed border-white/18 py-1.5 font-mono text-[10px] uppercase tracking-[0.08em] text-muted"
                      onClick={() =>
                        updateExercise(i, {
                          sets: [...e.sets, e.sets[e.sets.length - 1] ?? { weightKg: 20, reps: 8 }],
                        })
                      }
                    >
                      ＋ set
                    </button>
                  </div>
                )}
              </Card>
            ))}

            <Btn variant="dashed" className="mb-3 w-full py-3" onClick={() => setSwapIndex(-1)}>
              ＋ Add exercise from library
            </Btn>

            <div className="mb-3 flex items-center gap-2 rounded-[11px] bg-sunken p-2">
              <input
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !busy && generate(instruction || undefined)}
                placeholder='Regenerate with instruction… "no barbell today"'
                className="h-9 flex-1 bg-transparent px-2 text-[13px] outline-none placeholder:text-label"
              />
              <button
                onClick={() => generate(instruction || undefined)}
                disabled={busy}
                aria-label="send instruction"
                className="grid h-9 w-9 place-items-center rounded-[8px] bg-lime text-on-lime disabled:opacity-40"
              >
                ↥
              </button>
            </div>

            <label className="mb-3 flex items-center gap-2 px-1 text-[12.5px] text-muted">
              <input
                type="checkbox"
                checked={savePreset}
                onChange={(e) => setSavePreset(e.target.checked)}
                className="h-4 w-4 accent-(--color-lime)"
              />
              Also save as a preset
            </label>
          </>
        )}
      </div>

      {draft && !busy && (
        <div className="sticky bottom-0 -mx-5 flex gap-2 border-t border-white/8 bg-bg/95 px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur">
          <Btn className="flex-[2] py-3" disabled={!draft.exercises.length} onClick={accept}>
            Accept & start
          </Btn>
          <Btn
            variant="ghost"
            className="flex-1 py-3"
            onClick={async () => {
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
              await repo.savePreset(uid, presetFromWorkout(workout, draft.name))
              navigate('/presets')
            }}
          >
            Save preset
          </Btn>
        </div>
      )}

      {swapIndex !== null && draft && (
        <ExercisePicker
          nearMuscles={
            swapIndex >= 0
              ? exercises.get(draft.exercises[swapIndex].exerciseId)?.primaryMuscles
              : undefined
          }
          onClose={() => setSwapIndex(null)}
          onPick={(picked) => {
            if (swapIndex >= 0) {
              updateExercise(swapIndex, { exerciseId: picked.id })
            } else {
              setDraft({
                ...draft,
                exercises: [
                  ...draft.exercises,
                  {
                    exerciseId: picked.id,
                    rationale: 'added by you',
                    restSeconds: 120,
                    sets: [
                      { weightKg: 20, reps: 10 },
                      { weightKg: 20, reps: 10 },
                      { weightKg: 20, reps: 10 },
                    ],
                  },
                ],
              })
            }
            setSwapIndex(null)
          }}
        />
      )}
    </div>
  )
}
