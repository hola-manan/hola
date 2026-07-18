import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'
import { repo } from '../lib/repo'
import { ai } from '../lib/ai'
import { lastSession, presetFromWorkout, uuid } from '../lib/workout'
import { workingSetCount, workoutVolume } from '../lib/volume'
import { useStore, useUid } from '../store'
import type { Exercise, Segment, Workout, WorkoutExercise, WorkoutSet } from '../types'
import { Btn, Card, EmptyState } from '../components/ui'
import { ExercisePicker } from '../components/ExercisePicker'
import { RestTimer } from '../components/RestTimer'

/* Verbatim port of design-refs/1c.html — inline px values are the spec. */

const MONO = "'IBM Plex Mono',monospace"
const GRID: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '36px 1fr 64px 56px 34px',
  gap: 8,
  alignItems: 'center',
}
const numChip = (active = false): CSSProperties => ({
  width: 28,
  height: 28,
  borderRadius: 7,
  background: active ? '#c8f04b' : '#1b1f26',
  color: active ? '#0b0d10' : undefined,
  textAlign: 'center',
  lineHeight: '28px',
  fontFamily: MONO,
  fontSize: 12,
  fontWeight: active ? 600 : undefined,
})
const prevCell: CSSProperties = {
  textAlign: 'center',
  fontFamily: MONO,
  fontSize: 12.5,
  color: '#8b93a0',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
}
const doneCell: CSSProperties = {
  height: 30,
  borderRadius: 7,
  background: '#1b1f26',
  textAlign: 'center',
  lineHeight: '30px',
  fontFamily: MONO,
  fontSize: 13,
}
const inputCellStyle = (limeBorder: boolean): CSSProperties => ({
  height: 32,
  borderRadius: 7,
  background: '#0b0d10',
  border: `1px solid ${limeBorder ? 'rgba(200,240,75,.5)' : 'rgba(255,255,255,.18)'}`,
  textAlign: 'center',
  fontFamily: MONO,
  fontSize: 14,
  color: '#fff',
  width: '100%',
  outline: 'none',
  padding: 0,
})
const actionChip = (tone: 'lime' | 'grey', active = false): CSSProperties => ({
  fontSize: 11,
  whiteSpace: 'nowrap',
  color: tone === 'lime' ? '#c8f04b' : active ? '#c8f04b' : '#8b93a0',
  border:
    tone === 'lime'
      ? '1px dashed rgba(200,240,75,.4)'
      : `1px solid ${active ? 'rgba(200,240,75,.4)' : 'rgba(255,255,255,.12)'}`,
  borderRadius: 6,
  padding: '4px 9px',
  background: 'none',
})
const iconBtn: CSSProperties = {
  width: 30,
  height: 26,
  borderRadius: 7,
  background: '#1b1f26',
  textAlign: 'center',
  lineHeight: '26px',
  fontSize: 11,
  color: '#8b93a0',
  border: 'none',
  padding: 0,
}

const fmtClock = (ms: number) => {
  const s = Math.floor(ms / 1000)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}
const fmtRest = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
const DEFAULT_REST_SECONDS = 120

function RestDivider({ seconds, dim }: { seconds: number; dim?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '7px 0', opacity: dim ? 0.55 : 1 }}>
      <div style={{ flex: 1, height: 2, background: '#1b1f26', borderRadius: 1 }} />
      <span style={{ fontFamily: MONO, fontSize: 11, color: '#57c4cc' }}>{fmtRest(seconds)}</span>
      <div style={{ flex: 1, height: 2, background: '#1b1f26', borderRadius: 1 }} />
    </div>
  )
}

export function WorkoutScreen() {
  const { activeWorkout, workouts, exercises, presets } = useStore()
  const uid = useUid()
  const navigate = useNavigate()
  const [picker, setPicker] = useState<null | { swapIndex?: number }>(null)
  const [restEndsAt, setRestEndsAt] = useState<number | null>(null)
  const [restTotal, setRestTotal] = useState(DEFAULT_REST_SECONDS)
  const [finishing, setFinishing] = useState(false)
  const [focused, setFocused] = useState(0)
  const [, tick] = useState(0)

  useEffect(() => {
    const t = setInterval(() => tick((x) => x + 1), 1000)
    return () => clearInterval(t)
  }, [])

  const history = useMemo(() => workouts.filter((w) => w.status === 'completed'), [workouts])

  if (!activeWorkout) return <EmptyState>No workout in progress.</EmptyState>
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

  const duplicate = (i: number) => {
    const src = w.exercises[i]
    const copy: WorkoutExercise = { ...src, sets: [] }
    save({ ...w, exercises: [...w.exercises.slice(0, i + 1), copy, ...w.exercises.slice(i + 1)] })
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
    ai.generateReport({ workoutId: w.id }).catch(() => {})
    navigate(`/history/${w.id}`, { replace: true })
  }

  const plannedSets = w.exercises.reduce(
    (sum, e) => sum + Math.max(e.targetSets?.length ?? 0, e.sets.length),
    0,
  )

  return (
    <div
      style={{
        height: '100%',
        background: '#0b0d10',
        display: 'flex',
        flexDirection: 'column',
        paddingTop: 18,
        boxSizing: 'border-box',
      }}
    >
      {/* header bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 16px 10px',
          borderBottom: '1px solid rgba(255,255,255,.08)',
        }}
      >
        <button
          onClick={discard}
          aria-label="discard workout"
          style={{
            width: 44,
            height: 34,
            borderRadius: 9,
            background: '#1b1f26',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: 'none',
            color: '#e0596b',
            fontSize: 13,
          }}
        >
          ✕
        </button>
        <div style={{ fontFamily: MONO, fontSize: 15, color: '#8b93a0' }}>
          {fmtClock(Date.now() - w.startedAt)}
        </div>
        <button
          onClick={() => (w.presetId ? setFinishing(true) : finish(false))}
          disabled={!w.exercises.some((e) => e.sets.length)}
          style={{
            background: '#c8f04b',
            color: '#0b0d10',
            fontWeight: 600,
            fontSize: 14,
            padding: '8px 18px',
            borderRadius: 9,
            border: 'none',
            opacity: w.exercises.some((e) => e.sets.length) ? 1 : 0.4,
          }}
        >
          Finish
        </button>
      </div>

      <div style={{ padding: '12px 16px 60px', flex: 1, minHeight: 0, overflowY: 'auto' }}>
        {/* session meta */}
        <div style={{ display: 'flex', gap: 14, fontFamily: MONO, fontSize: 11, color: '#5a6270' }}>
          <span>
            {(w.cycleDay ?? w.name ?? 'WORKOUT').toUpperCase()} ·{' '}
            {new Date(w.startedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }).toUpperCase()}
          </span>
          <span>
            {workingSetCount(w)} / {Math.max(plannedSets, workingSetCount(w))} SETS
          </span>
          <span>VOL {Math.round(workoutVolume(w)).toLocaleString()} KG</span>
        </div>

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
              onDuplicate={() => duplicate(i)}
              onRemove={() => remove(i)}
              onMoveUp={() => move(i, -1)}
              onMoveDown={() => move(i, 1)}
            />
          </div>
        ))}

        <button
          onClick={() => setPicker({})}
          style={{
            marginTop: 16,
            width: '100%',
            background: 'none',
            border: '1px dashed rgba(255,255,255,.18)',
            borderRadius: 9,
            textAlign: 'center',
            padding: '10px 0',
            fontSize: 13,
            fontWeight: 600,
            color: '#8b93a0',
          }}
        >
          ＋ Add exercise
        </button>
        <div style={{ fontSize: 10.5, color: '#5a6270', marginTop: 8, textAlign: 'center' }}>
          Multi-segment set counts as 1 set · volume sums all segments
        </div>
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
        />
      )}
    </div>
  )
}

function ExerciseGrid({
  we,
  exercise,
  history,
  active,
  onChange,
  onLogged,
  onSwap,
  onDuplicate,
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
  onDuplicate: () => void
  onRemove: () => void
  onMoveUp: () => void
  onMoveDown: () => void
}) {
  const last = useMemo(() => lastSession(history, we.exerciseId), [history, we.exerciseId])
  const done = we.sets.length
  const nextTarget = we.targetSets?.[done]
  const restSeconds = we.restSeconds ?? DEFAULT_REST_SECONDS

  const prevFor = (setIndex: number) => {
    const s = last?.sets[Math.min(setIndex, (last?.sets.length ?? 1) - 1)]
    if (!s) return <>—</>
    const [first, ...rest] = s.segments
    return (
      <>
        {first.weightKg} × {first.reps}
        {rest.map((seg, i) => (
          <span key={i} style={{ color: '#5a6270' }}>
            {' '}
            + {seg.weightKg} × {seg.reps}
          </span>
        ))}
      </>
    )
  }

  const [menuOpen, setMenuOpen] = useState(false)
  const [weight, setWeight] = useState<string>(() =>
    String(nextTarget?.weightKg ?? last?.sets[0]?.segments[0]?.weightKg ?? ''),
  )
  const [reps, setReps] = useState<string>(() =>
    String(nextTarget?.reps ?? last?.sets[0]?.segments[0]?.reps ?? ''),
  )
  /** Frozen segments of the in-progress set (mock's main row + ↳ sub-rows). */
  const [frozen, setFrozen] = useState<Segment[]>([])
  const [warmup, setWarmup] = useState(false)
  const [rpe, setRpe] = useState<string>('')
  const [showRpe, setShowRpe] = useState(false)

  const resetEditor = (nextDone: number) => {
    const t = we.targetSets?.[nextDone]
    if (t) {
      setWeight(t.weightKg != null ? String(t.weightKg) : '')
      setReps(String(t.reps))
    }
    setFrozen([])
    setWarmup(false)
    setRpe('')
    setShowRpe(false)
  }

  const liveSegment = (): Segment | null => {
    const wKg = parseFloat(weight)
    const r = parseInt(reps, 10)
    if (!Number.isFinite(r) || r < 1) return null
    return { weightKg: Number.isFinite(wKg) ? wKg : 0, reps: r }
  }

  const bankSegment = () => {
    const seg = liveSegment()
    if (!seg) return
    setFrozen((f) => [...f, seg])
    setReps('')
  }

  const logSet = () => {
    const live = liveSegment()
    const segments = live ? [...frozen, live] : frozen
    if (!segments.length) return
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

  const deleteSet = (id: string) => {
    if (confirm('Delete this set?')) onChange({ ...we, sets: we.sets.filter((s) => s.id !== id) })
  }

  const addNote = () => {
    const note = prompt('Note for this set (saved with the next logged set)')
    if (note) alert('Noted — it will be attached when you log the set.') // simple v1
  }

  const upcoming = (we.targetSets ?? []).slice(done + 1)

  return (
    <div style={{ opacity: active ? 1 : 0.7 }}>
      {/* exercise header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: active ? 16 : 22 }}>
        <span style={{ color: '#c8f04b', fontWeight: 600, fontSize: 16 }}>
          {exercise?.name ?? we.exerciseId}
        </span>
        <div style={{ display: 'flex', gap: 6 }}>
          <button style={iconBtn} aria-label="duplicate exercise" onClick={onDuplicate}>
            ⧉
          </button>
          <button style={iconBtn} aria-label="exercise menu" onClick={() => setMenuOpen((v) => !v)}>
            ···
          </button>
        </div>
      </div>

      {menuOpen && (
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button style={actionChip('grey')} onClick={onSwap}>⇄ swap</button>
          <button style={actionChip('grey')} onClick={onMoveUp}>↑</button>
          <button style={actionChip('grey')} onClick={onMoveDown}>↓</button>
          <button style={{ ...actionChip('grey'), color: '#e0596b' }} onClick={onRemove}>remove</button>
        </div>
      )}

      {/* grid header */}
      <div style={{ ...GRID, marginTop: 10, fontSize: 12, color: '#8b93a0', fontWeight: 600 }}>
        <span>Set</span>
        <span style={{ textAlign: 'center' }}>Previous</span>
        <span style={{ textAlign: 'center' }}>kg</span>
        <span style={{ textAlign: 'center' }}>Reps</span>
        <span style={{ textAlign: 'center' }}>✓</span>
      </div>

      {/* completed sets */}
      {we.sets.map((s, idx) => (
        <div key={s.id}>
          <div style={{ ...GRID, marginTop: 8, opacity: 0.55 }}>
            <span style={numChip()}>{idx + 1}</span>
            <span style={prevCell}>{prevFor(idx)}</span>
            <span style={doneCell}>{s.segments[0].weightKg}</span>
            <span style={doneCell}>{s.segments[0].reps}</span>
            <button
              onClick={() => deleteSet(s.id)}
              aria-label={`set ${idx + 1} logged`}
              style={{ textAlign: 'center', color: '#63d08a', fontSize: 14, background: 'none', border: 'none' }}
            >
              ✓
            </button>
          </div>
          {s.segments.slice(1).map((seg, si) => (
            <div key={si} style={{ ...GRID, marginTop: 7, opacity: 0.55 }}>
              <span style={{ textAlign: 'right', color: '#c8f04b', fontFamily: MONO, fontSize: 13 }}>↳</span>
              <span style={{ textAlign: 'center', fontFamily: MONO, fontSize: 10.5, color: '#5a6270' }}>
                SEGMENT {si + 2}{seg.weightKg < s.segments[si].weightKg ? ' · DROP' : ''}
              </span>
              <span style={doneCell}>{seg.weightKg}</span>
              <span style={doneCell}>{seg.reps}</span>
              <span />
            </div>
          ))}
          {(s.type !== 'working' || s.rpe != null) && (
            <div style={{ paddingLeft: 44, marginTop: 3, fontFamily: MONO, fontSize: 10, color: '#3d434c', textTransform: 'uppercase' }}>
              {s.type !== 'working' ? s.type : ''}
              {s.rpe != null ? ` rpe ${s.rpe}` : ''}
            </div>
          )}
          <RestDivider seconds={restSeconds} dim />
        </div>
      ))}

      {/* active set editor (lime container) */}
      {active && (
        <div
          style={{
            border: '1px solid rgba(200,240,75,.35)',
            borderRadius: 10,
            padding: 8,
            marginTop: 2,
            background: 'rgba(200,240,75,.03)',
          }}
        >
          <div style={GRID}>
            <span style={numChip(true)}>{done + 1}</span>
            <span style={prevCell}>{prevFor(done)}</span>
            {frozen.length ? (
              <>
                <span style={{ ...inputCellStyle(false), lineHeight: '32px' }}>{frozen[0].weightKg}</span>
                <span style={{ ...inputCellStyle(false), lineHeight: '32px' }}>{frozen[0].reps}</span>
              </>
            ) : (
              <>
                <input
                  inputMode="decimal"
                  aria-label="kg"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  style={inputCellStyle(true)}
                />
                <input
                  inputMode="numeric"
                  aria-label="reps"
                  value={reps}
                  onChange={(e) => setReps(e.target.value)}
                  style={inputCellStyle(true)}
                />
              </>
            )}
            <button
              onClick={logSet}
              aria-label="log set"
              style={{ textAlign: 'center', color: '#5a6270', fontSize: 14, background: 'none', border: 'none' }}
            >
              ✓
            </button>
          </div>

          {/* frozen middle segments */}
          {frozen.slice(1).map((seg, si) => (
            <div key={si} style={{ ...GRID, marginTop: 7 }}>
              <span style={{ textAlign: 'right', color: '#c8f04b', fontFamily: MONO, fontSize: 13 }}>↳</span>
              <span style={{ textAlign: 'center', fontFamily: MONO, fontSize: 10.5, color: '#5a6270' }}>
                SEGMENT {si + 2}
              </span>
              <span style={{ ...inputCellStyle(false), lineHeight: '32px' }}>{seg.weightKg}</span>
              <span style={{ ...inputCellStyle(false), lineHeight: '32px' }}>{seg.reps}</span>
              <button
                aria-label="remove segment"
                onClick={() => setFrozen(frozen.filter((_, x) => x !== si + 1))}
                style={{ textAlign: 'center', color: '#e0596b', fontSize: 12, background: 'none', border: 'none' }}
              >
                ✕
              </button>
            </div>
          ))}

          {/* live segment inputs when at least one is frozen */}
          {frozen.length > 0 && (
            <div style={{ ...GRID, marginTop: 7 }}>
              <span style={{ textAlign: 'right', color: '#c8f04b', fontFamily: MONO, fontSize: 13 }}>↳</span>
              <span style={{ textAlign: 'center', fontFamily: MONO, fontSize: 10.5, color: '#5a6270' }}>
                SEGMENT {frozen.length + 1} · DROP
              </span>
              <input
                inputMode="decimal"
                aria-label="kg"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                style={inputCellStyle(false)}
              />
              <input
                inputMode="numeric"
                aria-label="reps"
                value={reps}
                onChange={(e) => setReps(e.target.value)}
                placeholder="–"
                style={inputCellStyle(false)}
              />
              <button
                aria-label="cancel segment"
                onClick={() => {
                  const lastFrozen = frozen[frozen.length - 1]
                  setFrozen(frozen.slice(0, -1))
                  setWeight(String(lastFrozen.weightKg))
                  setReps(String(lastFrozen.reps))
                }}
                style={{ textAlign: 'center', color: '#e0596b', fontSize: 12, background: 'none', border: 'none' }}
              >
                ✕
              </button>
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, marginTop: 8, paddingLeft: 44, alignItems: 'center', flexWrap: 'wrap' }}>
            <button style={actionChip('lime')} onClick={bankSegment}>
              ＋ segment (weight change)
            </button>
            <button style={actionChip('grey', showRpe)} onClick={() => setShowRpe((v) => !v)}>
              RPE
            </button>
            {showRpe && (
              <input
                inputMode="decimal"
                aria-label="rpe"
                value={rpe}
                onChange={(e) => setRpe(e.target.value)}
                placeholder="8"
                style={{ ...inputCellStyle(false), width: 40, height: 24, fontSize: 11 }}
              />
            )}
            <button style={actionChip('grey', warmup)} onClick={() => setWarmup((v) => !v)}>
              {warmup ? 'warm-up ✓' : 'warm-up'}
            </button>
            <button style={actionChip('grey')} onClick={addNote}>
              note
            </button>
          </div>
        </div>
      )}

      {/* upcoming target rows */}
      {active && upcoming.length > 0 && <RestDivider seconds={restSeconds} />}
      {active &&
        upcoming.map((_t, ti) => (
          <div key={ti} style={{ ...GRID, marginTop: ti ? 8 : 0 }}>
            <span style={numChip()}>{done + 2 + ti}</span>
            <span style={prevCell}>{prevFor(done + 1 + ti)}</span>
            <span style={{ height: 30, borderRadius: 7, background: '#1b1f26' }} />
            <span style={{ height: 30, borderRadius: 7, background: '#1b1f26' }} />
            <span style={{ textAlign: 'center', color: '#3d434c', fontSize: 14 }}>✓</span>
          </div>
        ))}

      {active && (
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
          style={{
            marginTop: 10,
            width: '100%',
            background: '#14171c',
            borderRadius: 9,
            textAlign: 'center',
            padding: '10px 0',
            fontSize: 13,
            fontWeight: 600,
            color: '#e9ecef',
            border: 'none',
          }}
        >
          ＋ Add Set ({fmtRest(restSeconds)})
        </button>
      )}

      {/* inactive: show first upcoming row like the mock's next exercise */}
      {!active && we.sets.length === 0 && (
        <div style={{ ...GRID, marginTop: 8 }}>
          <span style={numChip()}>1</span>
          <span style={prevCell}>{prevFor(0)}</span>
          <span style={{ height: 30, borderRadius: 7, background: '#1b1f26' }} />
          <span style={{ height: 30, borderRadius: 7, background: '#1b1f26' }} />
          <span style={{ textAlign: 'center', color: '#3d434c', fontSize: 14 }}>✓</span>
        </div>
      )}
    </div>
  )
}
