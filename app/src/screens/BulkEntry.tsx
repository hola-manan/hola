import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { repo } from '../lib/repo'
import { parseSetsText } from '../lib/parse'
import { advance, currentDayLabel, todayStr } from '../lib/cycle'
import { uuid } from '../lib/workout'
import { setVolume } from '../lib/volume'
import { useStore, useUid } from '../store'
import type { Exercise, Workout } from '../types'
import { Btn, Chip, Eyebrow } from '../components/ui'
import { ExercisePicker } from '../components/ExercisePicker'

interface Row {
  exercise: Exercise
  text: string
}

export function BulkEntry() {
  const { exercises, cycle } = useStore()
  const uid = useUid()
  const navigate = useNavigate()
  const [date, setDate] = useState(todayStr())
  const [time, setTime] = useState('18:00')
  const [lengthMin, setLengthMin] = useState('50')
  const [cycleDay, setCycleDay] = useState('')
  const [rows, setRows] = useState<Row[]>([])
  const [pickerOpen, setPickerOpen] = useState(false)
  const [error, setError] = useState('')

  const rowError = (text: string) => {
    if (!text.trim()) return null
    try {
      parseSetsText(text)
      return null
    } catch (e) {
      return (e as Error).message
    }
  }

  const summary = useMemo(() => {
    let sets = 0
    let vol = 0
    let exCount = 0
    for (const r of rows) {
      if (!r.text.trim() || rowError(r.text)) continue
      const parsed = parseSetsText(r.text)
      exCount++
      sets += parsed.filter((s) => s.type !== 'warmup').length
      vol += parsed.reduce((sum, s) => sum + setVolume(s), 0)
    }
    return { sets, vol, exCount }
  }, [rows])

  const save = async () => {
    try {
      const filled = rows.filter((r) => r.text.trim())
      if (!filled.length) throw new Error('Add at least one exercise with sets.')
      const startedAt = new Date(`${date}T${time || '12:00'}:00`).getTime()
      const mins = parseInt(lengthMin, 10) || 60
      const workout: Workout = {
        id: uuid(),
        status: 'completed',
        startedAt,
        completedAt: startedAt + mins * 60_000,
        ...(cycleDay ? { cycleDay } : {}),
        bulkEntered: true,
        exercises: filled.map((r) => ({
          exerciseId: r.exercise.id,
          sets: parseSetsText(r.text).map((s) => ({ ...s, completedAt: startedAt })),
        })),
      }
      await repo.saveWorkout(uid, workout)
      if (
        cycle &&
        cycleDay &&
        date === todayStr() &&
        currentDayLabel(cycle).toLowerCase() === cycleDay.toLowerCase()
      ) {
        await repo.saveCycle(uid, advance(cycle))
      }
      navigate(`/history/${workout.id}`, { replace: true })
    } catch (e) {
      setError((e as Error).message)
    }
  }

  const canSave = rows.some((r) => r.text.trim() && !rowError(r.text))

  return (
    <div className="flex min-h-dvh flex-col">
      {/* top bar */}
      <div className="flex items-center justify-between border-b border-white/8 px-4 py-3">
        <button className="text-[13px] text-muted active:opacity-70" onClick={() => navigate(-1)}>
          Cancel
        </button>
        <span className="text-[14px] font-semibold">Add past workout</span>
        <Btn className="px-4 py-1.5" disabled={!canSave} onClick={save}>
          Save
        </Btn>
      </div>

      <div className="flex-1 px-5 pt-4">
        {/* meta inputs */}
        <div className="flex gap-2">
          {[
            { label: 'DATE', node: (
              <input type="date" value={date} max={todayStr()} onChange={(e) => setDate(e.target.value)}
                className="w-full bg-transparent font-mono text-[12.5px] outline-none" /> ) },
            { label: 'TIME', node: (
              <input type="time" value={time} onChange={(e) => setTime(e.target.value)}
                className="w-full bg-transparent font-mono text-[12.5px] outline-none" /> ) },
            { label: 'LENGTH·MIN', node: (
              <input inputMode="numeric" value={lengthMin} onChange={(e) => setLengthMin(e.target.value)}
                className="w-full bg-transparent font-mono text-[12.5px] outline-none" /> ) },
          ].map((cell) => (
            <div key={cell.label} className="flex-1 rounded-[9px] border border-white/8 bg-card px-3 py-2">
              <div className="mb-0.5 font-mono text-[8.5px] uppercase tracking-[0.12em] text-label">
                {cell.label}
              </div>
              {cell.node}
            </div>
          ))}
        </div>

        {cycle && (
          <>
            <p className="mb-1.5 mt-4 text-[12.5px] text-muted">
              Which cycle day was this? (advances your cycle if it's today's)
            </p>
            <div className="flex flex-wrap gap-1.5">
              {[...new Set(cycle.days.filter((d) => d.toLowerCase() !== 'rest'))].map((d) => (
                <Chip key={d} active={cycleDay === d} onClick={() => setCycleDay(cycleDay === d ? '' : d)}>
                  {d}
                </Chip>
              ))}
              <Chip active={!cycleDay} onClick={() => setCycleDay('')}>
                NONE
              </Chip>
            </div>
          </>
        )}

        <div className="mt-4">
          {rows.map((row, i) => {
            const err = rowError(row.text)
            return (
              <div key={`${row.exercise.id}-${i}`} className="mb-3 rounded-[11px] border border-white/8 bg-card p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[13.5px] font-semibold text-lime">{row.exercise.name}</span>
                  <button className="text-muted" onClick={() => setRows(rows.filter((_, j) => j !== i))} aria-label="remove exercise">
                    ✕
                  </button>
                </div>
                <input
                  placeholder="30x8, 30x8, 30x7, 26x8"
                  value={row.text}
                  onChange={(e) =>
                    setRows(rows.map((r, j) => (j === i ? { ...r, text: e.target.value } : r)))
                  }
                  className={`h-11 w-full rounded-[8px] border bg-bg px-3 font-mono text-[13px] outline-none ${
                    err ? 'border-danger/60' : row.text ? 'border-lime/40' : 'border-white/12'
                  }`}
                />
                {err ? (
                  <p className="mt-1.5 text-[11px] text-danger">{err}</p>
                ) : (
                  <p className="mt-1.5 font-mono text-[9.5px] uppercase tracking-[0.06em] text-faint">
                    kg×reps per set · mid-set weight change: 30×8+22.5×4 · warm-up: w20×12
                  </p>
                )}
              </div>
            )
          })}

          <Btn variant="dashed" className="mb-3 w-full py-3" onClick={() => setPickerOpen(true)}>
            ＋ Add exercise
          </Btn>
          {error && <p className="mb-2 text-[12px] text-danger">{error}</p>}
        </div>
      </div>

      {/* summary bar */}
      <div className="sticky bottom-0 border-t border-white/8 bg-sunken px-5 pb-[max(0.9rem,env(safe-area-inset-bottom))] pt-2.5">
        <div className="flex items-center justify-between">
          <Eyebrow>
            {summary.sets} SETS · {summary.exCount} EXERCISES
          </Eyebrow>
          <Eyebrow>VOL {Math.round(summary.vol).toLocaleString()} KG</Eyebrow>
        </div>
        <p className="mt-1 font-mono text-[8.5px] uppercase tracking-[0.1em] text-faint">
          Counts as full history — feeds e1RM graphs and AI context
        </p>
      </div>

      {pickerOpen && (
        <ExercisePicker
          onPick={(e) => {
            setRows([...rows, { exercise: exercises.get(e.id)!, text: '' }])
            setPickerOpen(false)
          }}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </div>
  )
}
