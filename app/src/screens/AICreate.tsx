import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ai } from '../lib/ai'
import { repo } from '../lib/repo'
import { currentE1RM } from '../lib/rm'
import { emptyWorkout, presetFromWorkout } from '../lib/workout'
import { isLowReadiness } from '../lib/readinessRule'
import { useStore, useUid } from '../store'
import type { Workout, WorkoutDraft } from '../types'
import { Btn, Card, EmptyState } from '../components/ui'
import { ExercisePicker } from '../components/ExercisePicker'

/* Verbatim port of design-refs/1f.html. */

const MONO = "'IBM Plex Mono',monospace"
const CONDENSED = "'IBM Plex Sans Condensed',sans-serif"
const fmtRest = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

export function AICreate() {
  const { exercises, activeWorkout, workouts, readinessToday, profile, cycle } = useStore()
  const uid = useUid()
  const navigate = useNavigate()
  const [draft, setDraft] = useState<WorkoutDraft | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [instruction, setInstruction] = useState('')
  const [swapIndex, setSwapIndex] = useState<number | null>(null)
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

  const completed = useMemo(() => workouts.filter((x) => x.status === 'completed'), [workouts])

  /** Exercises not present in the last comparable session get the lime ADDED treatment. */
  const lastComparable = useMemo(() => {
    const day = draft?.cycleDay?.toLowerCase()
    return day ? completed.find((x) => x.cycleDay?.toLowerCase() === day) : undefined
  }, [draft, completed])

  const isAdded = (exerciseId: string) =>
    Boolean(lastComparable) && !lastComparable!.exercises.some((e) => e.exerciseId === exerciseId)

  const updateExercise = (i: number, patch: Partial<WorkoutDraft['exercises'][number]>) => {
    if (!draft) return
    setDraft({ ...draft, exercises: draft.exercises.map((e, j) => (j === i ? { ...e, ...patch } : e)) })
  }

  const moveDown = (i: number) => {
    if (!draft) return
    const list = [...draft.exercises]
    const j = (i + 1) % list.length
    ;[list[i], list[j]] = [list[j], list[i]]
    setDraft({ ...draft, exercises: list })
  }

  const toWorkout = (): Workout => ({
    ...emptyWorkout(draft!.cycleDay),
    name: draft!.name,
    exercises: draft!.exercises.map((e) => ({
      exerciseId: e.exerciseId,
      targetSets: e.sets.map((s) => ({ weightKg: s.weightKg, reps: s.reps })),
      restSeconds: e.restSeconds,
      sets: [],
    })),
  })

  const accept = async () => {
    if (!draft) return
    await repo.saveWorkout(uid, toWorkout())
    navigate('/workout', { replace: true })
  }

  const saveAsPreset = async () => {
    if (!draft) return
    await repo.savePreset(uid, presetFromWorkout(toWorkout(), draft.name))
    navigate('/presets')
  }

  if (activeWorkout) {
    return <EmptyState>Finish or discard the workout in progress first.</EmptyState>
  }

  const prescription = (e: WorkoutDraft['exercises'][number]) => {
    const sets = e.sets
    if (!sets.length) return `REST ${fmtRest(e.restSeconds)}`
    const allSame = sets.every((s) => s.weightKg === sets[0].weightKg && s.reps === sets[0].reps)
    const rm = currentE1RM(completed, e.exerciseId)
    const pct = rm && sets[0].weightKg ? ` · ~${Math.round((sets[0].weightKg / rm) * 100)}% e1RM` : ''
    const base = allSame
      ? `${sets.length} × ${sets[0].reps} @ ${sets[0].weightKg || 'BW'} KG`
      : sets.map((s) => `${s.weightKg || 'BW'}×${s.reps}`).join(' · ')
    return `${base}${pct} · REST ${fmtRest(e.restSeconds)}`
  }

  const builtFrom = [
    `last ${draft?.cycleDay ?? cycle?.days[cycle.pointer % cycle.days.length] ?? 'session'}`,
    'weekly volume',
    readinessToday ? `readiness ${isLowReadiness(readinessToday) ? 'LOW' : 'NORMAL'}` : null,
    profile.tweaks[0] ? `tweak "${profile.tweaks[0].split('—')[0].trim()}"` : null,
    'e1RM table',
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', paddingTop: 62, boxSizing: 'border-box' }}>
      <div style={{ padding: '10px 20px 0' }}>
        {/* header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '.14em', color: '#c8f04b' }}>
              DRAFT · REVIEW BEFORE START
            </div>
            <div style={{ fontFamily: CONDENSED, fontWeight: 700, fontSize: 30, marginTop: 4 }}>
              {draft?.name ?? "Today's workout"}
            </div>
          </div>
          <button
            onClick={() => generate(instruction || undefined)}
            disabled={busy}
            aria-label="regenerate"
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              border: '1px solid rgba(255,255,255,.14)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#8b93a0',
              fontSize: 15,
              background: 'none',
              opacity: busy ? 0.4 : 1,
            }}
          >
            ⟳
          </button>
        </div>
        <div style={{ fontSize: 11, color: '#5a6270', marginTop: 6, lineHeight: 1.5 }}>
          Built from: {builtFrom}
        </div>
      </div>

      <div style={{ padding: '0 20px', flex: 1, minHeight: 0, overflowY: 'auto' }}>
        {busy && <EmptyState>The coach is drafting your workout…</EmptyState>}
        {error && (
          <Card className="mt-3">
            <p className="mb-2 text-[13px]" style={{ color: '#e0596b' }}>
              {error}
            </p>
            <Btn onClick={() => generate(instruction || undefined)}>Try again</Btn>
          </Card>
        )}

        {draft && !busy && (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 14 }}>
              {draft.exercises.map((e, i) => {
                const added = isAdded(e.exerciseId)
                return (
                  <div
                    key={`${e.exerciseId}-${i}`}
                    style={{
                      background: '#14171c',
                      border: `1px solid ${added ? 'rgba(200,240,75,.4)' : 'rgba(255,255,255,.08)'}`,
                      borderRadius: 11,
                      padding: '12px 14px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 600, fontSize: 14 }}>
                        {exercises.get(e.exerciseId)?.name ?? e.exerciseId}
                        {added && (
                          <span
                            style={{
                              fontFamily: MONO,
                              fontSize: 9,
                              color: '#c8f04b',
                              border: '1px solid rgba(200,240,75,.4)',
                              borderRadius: 4,
                              padding: '2px 5px',
                              marginLeft: 4,
                            }}
                          >
                            ADDED
                          </span>
                        )}
                      </span>
                      <span style={{ display: 'flex', gap: 10, color: '#5a6270', fontSize: 13 }}>
                        <button aria-label="swap" style={{ background: 'none', border: 'none', color: 'inherit', padding: 0 }} onClick={() => setSwapIndex(i)}>⇄</button>
                        <button
                          aria-label="remove"
                          style={{ background: 'none', border: 'none', color: 'inherit', padding: 0 }}
                          onClick={() => setDraft({ ...draft, exercises: draft.exercises.filter((_, j) => j !== i) })}
                        >
                          ✕
                        </button>
                        <button aria-label="reorder" style={{ background: 'none', border: 'none', color: 'inherit', padding: 0 }} onClick={() => moveDown(i)}>≡</button>
                      </span>
                    </div>
                    <button
                      onClick={() => setEditing(editing === i ? null : i)}
                      style={{
                        display: 'block',
                        fontFamily: MONO,
                        fontSize: 11.5,
                        color: '#57c4cc',
                        marginTop: 4,
                        background: 'none',
                        border: 'none',
                        padding: 0,
                        textAlign: 'left',
                      }}
                    >
                      {prescription(e)}
                    </button>
                    <div style={{ fontSize: 11, color: added ? '#c8f04b' : '#5a6270', marginTop: 4 }}>
                      {e.rationale}
                    </div>

                    {editing === i && (
                      <div style={{ marginTop: 10, borderTop: '1px solid rgba(255,255,255,.07)', paddingTop: 8 }}>
                        {e.sets.map((s, si) => (
                          <div key={si} style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: si ? 6 : 0 }}>
                            <span style={{ width: 16, fontFamily: MONO, fontSize: 11, color: '#5a6270' }}>{si + 1}</span>
                            <input
                              inputMode="decimal"
                              aria-label="kg"
                              value={s.weightKg}
                              onChange={(ev) =>
                                updateExercise(i, {
                                  sets: e.sets.map((x, xi) => (xi === si ? { ...x, weightKg: parseFloat(ev.target.value) || 0 } : x)),
                                })
                              }
                              style={{ width: 58, height: 30, borderRadius: 7, background: '#0b0d10', border: '1px solid rgba(255,255,255,.18)', textAlign: 'center', fontFamily: MONO, fontSize: 13, color: '#fff' }}
                            />
                            <span style={{ fontFamily: MONO, fontSize: 10, color: '#5a6270' }}>KG ×</span>
                            <input
                              inputMode="numeric"
                              aria-label="reps"
                              value={s.reps}
                              onChange={(ev) =>
                                updateExercise(i, {
                                  sets: e.sets.map((x, xi) => (xi === si ? { ...x, reps: parseInt(ev.target.value, 10) || 1 } : x)),
                                })
                              }
                              style={{ width: 48, height: 30, borderRadius: 7, background: '#0b0d10', border: '1px solid rgba(255,255,255,.18)', textAlign: 'center', fontFamily: MONO, fontSize: 13, color: '#fff' }}
                            />
                            <button
                              aria-label="remove set"
                              onClick={() => updateExercise(i, { sets: e.sets.filter((_, xi) => xi !== si) })}
                              style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#5a6270', fontSize: 12 }}
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                        <button
                          onClick={() =>
                            updateExercise(i, { sets: [...e.sets, e.sets[e.sets.length - 1] ?? { weightKg: 20, reps: 8 }] })
                          }
                          style={{ marginTop: 8, width: '100%', border: '1px dashed rgba(255,255,255,.18)', borderRadius: 7, padding: '5px 0', fontSize: 11, color: '#8b93a0', background: 'none' }}
                        >
                          ＋ set
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}

              <button
                onClick={() => setSwapIndex(-1)}
                style={{
                  border: '1px dashed rgba(255,255,255,.18)',
                  borderRadius: 11,
                  padding: '10px 14px',
                  textAlign: 'center',
                  fontSize: 12.5,
                  color: '#8b93a0',
                  background: 'none',
                }}
              >
                ＋ Add exercise from library
              </button>
            </div>

            {/* regenerate input */}
            <div
              style={{
                display: 'flex',
                gap: 8,
                margin: '12px 0 16px',
                background: '#101318',
                border: '1px solid rgba(255,255,255,.1)',
                borderRadius: 10,
                padding: '10px 12px',
                alignItems: 'center',
              }}
            >
              <input
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !busy && generate(instruction || undefined)}
                placeholder='Regenerate with instruction… "no barbell today"'
                style={{ flex: 1, fontSize: 12.5, color: '#e9ecef', background: 'none', border: 'none', outline: 'none' }}
              />
              <button
                onClick={() => generate(instruction || undefined)}
                disabled={busy}
                aria-label="send instruction"
                style={{ color: '#c8f04b', fontSize: 14, background: 'none', border: 'none', opacity: busy ? 0.4 : 1 }}
              >
                ↥
              </button>
            </div>
          </>
        )}
      </div>

      {/* footer bar */}
      {draft && !busy && (
        <div
          style={{
            display: 'flex',
            gap: 8,
            background: '#101318',
            borderTop: '1px solid rgba(255,255,255,.08)',
            padding: '12px 16px',
          }}
        >
          <button
            onClick={accept}
            disabled={!draft.exercises.length}
            style={{
              flex: 2,
              background: '#c8f04b',
              color: '#0b0d10',
              borderRadius: 10,
              textAlign: 'center',
              padding: '13px 0',
              fontWeight: 600,
              fontSize: 15,
              border: 'none',
              opacity: draft.exercises.length ? 1 : 0.4,
            }}
          >
            Accept & start
          </button>
          <button
            onClick={saveAsPreset}
            style={{
              flex: 1,
              border: '1px solid rgba(255,255,255,.16)',
              borderRadius: 10,
              textAlign: 'center',
              padding: '13px 0',
              fontSize: 13.5,
              color: '#e9ecef',
              background: 'none',
            }}
          >
            Save preset
          </button>
        </div>
      )}

      {swapIndex !== null && draft && (
        <ExercisePicker
          nearMuscles={swapIndex >= 0 ? exercises.get(draft.exercises[swapIndex].exerciseId)?.primaryMuscles : undefined}
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
