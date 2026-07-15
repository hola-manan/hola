import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { repo } from '../lib/repo'
import { parseSetsText } from '../lib/parse'
import { advance, currentDayLabel, todayStr } from '../lib/cycle'
import { uuid } from '../lib/workout'
import { useStore, useUid } from '../store'
import type { Exercise, Workout } from '../types'
import { Btn, Card, Screen } from '../components/ui'
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

  const save = async () => {
    try {
      const filled = rows.filter((r) => r.text.trim())
      if (!filled.length) throw new Error('Add at least one exercise with sets.')
      const workout: Workout = {
        id: uuid(),
        status: 'completed',
        startedAt: new Date(`${date}T12:00:00`).getTime(),
        completedAt: new Date(`${date}T13:00:00`).getTime(),
        ...(cycleDay ? { cycleDay } : {}),
        bulkEntered: true,
        exercises: filled.map((r) => ({
          exerciseId: r.exercise.id,
          sets: parseSetsText(r.text).map((s) => ({ ...s, completedAt: new Date(`${date}T12:00:00`).getTime() })),
        })),
      }
      await repo.saveWorkout(uid, workout)
      // Advance the cycle when this was today's pending day.
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

  return (
    <Screen title="Add past workout">
      <Card className="mb-3">
        <label className="mb-1 block text-xs uppercase tracking-wide text-ink-dim">Date</label>
        <input
          type="date"
          value={date}
          max={todayStr()}
          onChange={(e) => setDate(e.target.value)}
          className="h-11 w-full rounded-xl bg-surface-2 px-3"
        />
        {cycle && (
          <>
            <label className="mb-1 mt-3 block text-xs uppercase tracking-wide text-ink-dim">
              Which cycle day was this?
            </label>
            <div className="flex flex-wrap gap-2">
              {[...new Set(cycle.days.filter((d) => d.toLowerCase() !== 'rest'))].map((d) => (
                <button
                  key={d}
                  onClick={() => setCycleDay(cycleDay === d ? '' : d)}
                  className={`rounded-full px-3 py-1.5 text-sm ${
                    cycleDay === d ? 'bg-accent text-accent-ink' : 'bg-surface-2 text-ink-dim'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </>
        )}
      </Card>

      {rows.map((row, i) => {
        const err = rowError(row.text)
        return (
          <Card key={`${row.exercise.id}-${i}`} className="mb-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-medium">{row.exercise.name}</span>
              <button
                className="text-ink-dim"
                onClick={() => setRows(rows.filter((_, j) => j !== i))}
              >
                ✕
              </button>
            </div>
            <input
              placeholder="30x8, 30x8, 22.5x6  (mid-set change: 30x8+22.5x4, warm-up: w20x12)"
              value={row.text}
              onChange={(e) =>
                setRows(rows.map((r, j) => (j === i ? { ...r, text: e.target.value } : r)))
              }
              className={`h-11 w-full rounded-xl bg-surface-2 px-3 text-sm ${
                err ? 'ring-1 ring-danger' : ''
              }`}
            />
            {err && <p className="mt-1 text-xs text-danger">{err}</p>}
          </Card>
        )
      })}

      <Btn variant="ghost" className="mb-3 w-full py-3" onClick={() => setPickerOpen(true)}>
        ＋ Add exercise
      </Btn>
      {error && <p className="mb-2 text-sm text-danger">{error}</p>}
      <Btn
        className="w-full py-3.5 text-base"
        disabled={!rows.some((r) => r.text.trim() && !rowError(r.text))}
        onClick={save}
      >
        Save workout
      </Btn>

      {pickerOpen && (
        <ExercisePicker
          onPick={(e) => {
            setRows([...rows, { exercise: exercises.get(e.id)!, text: '' }])
            setPickerOpen(false)
          }}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </Screen>
  )
}
