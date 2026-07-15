import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { repo } from '../lib/repo'
import { uuid } from '../lib/workout'
import { useStore, useUid } from '../store'
import type { Preset, PresetExercise } from '../types'
import { Btn, Card, Screen, Stepper } from '../components/ui'
import { ExercisePicker } from '../components/ExercisePicker'

export function PresetEdit() {
  const { id } = useParams()
  const { presets, exercises, cycle } = useStore()
  const uid = useUid()
  const navigate = useNavigate()
  const existing = id !== 'new' ? presets.find((p) => p.id === id) : undefined

  const [name, setName] = useState(existing?.name ?? '')
  const [cycleDay, setCycleDay] = useState(existing?.cycleDay ?? '')
  const [items, setItems] = useState<PresetExercise[]>(existing?.exercises ?? [])
  const [pickerOpen, setPickerOpen] = useState(false)
  const [loaded, setLoaded] = useState(Boolean(existing) || id === 'new')

  // Presets stream in async; hydrate the form once when the doc arrives.
  useEffect(() => {
    if (!loaded && existing) {
      setName(existing.name)
      setCycleDay(existing.cycleDay ?? '')
      setItems(existing.exercises)
      setLoaded(true)
    }
  }, [existing, loaded])

  const save = async () => {
    const now = Date.now()
    const preset: Preset = {
      id: existing?.id ?? uuid(),
      name: name.trim(),
      ...(cycleDay ? { cycleDay } : {}),
      exercises: items,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    }
    await repo.savePreset(uid, preset)
    navigate('/presets')
  }

  const remove = async () => {
    if (!existing || !confirm(`Delete preset "${existing.name}"?`)) return
    await repo.deletePreset(uid, existing.id)
    navigate('/presets')
  }

  const updateItem = (i: number, item: PresetExercise) =>
    setItems(items.map((x, j) => (j === i ? item : x)))

  const cycleDays = cycle ? [...new Set(cycle.days.filter((d) => d.toLowerCase() !== 'rest'))] : []

  return (
    <Screen
      title={existing ? 'Edit preset' : 'New preset'}
      action={
        existing && (
          <Btn variant="danger" onClick={remove}>
            Delete
          </Btn>
        )
      }
    >
      <Card className="mb-3">
        <input
          placeholder="Preset name (e.g. Push A)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mb-3 h-11 w-full rounded-xl bg-surface-2 px-3"
        />
        {cycleDays.length > 0 && (
          <>
            <div className="mb-1 text-xs uppercase tracking-wide text-ink-dim">Cycle day</div>
            <div className="flex flex-wrap gap-2">
              {cycleDays.map((d) => (
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

      {items.map((item, i) => (
        <Card key={`${item.exerciseId}-${i}`} className="mb-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="font-medium">{exercises.get(item.exerciseId)?.name ?? item.exerciseId}</span>
            <button className="text-ink-dim" onClick={() => setItems(items.filter((_, j) => j !== i))}>
              ✕
            </button>
          </div>
          {item.sets.map((s, si) => (
            <div key={si} className="mb-2 flex items-center justify-center gap-3">
              <span className="w-6 text-right text-xs text-ink-dim">{si + 1}.</span>
              <Stepper
                label="kg (0 = last used)"
                value={s.weightKg ?? 0}
                step={2.5}
                onChange={(v) =>
                  updateItem(i, {
                    ...item,
                    sets: item.sets.map((x, xi) => (xi === si ? { ...x, weightKg: v || null } : x)),
                  })
                }
              />
              <Stepper
                label="reps"
                value={s.reps}
                step={1}
                min={1}
                onChange={(v) =>
                  updateItem(i, {
                    ...item,
                    sets: item.sets.map((x, xi) => (xi === si ? { ...x, reps: v } : x)),
                  })
                }
              />
              <button
                className="text-ink-dim"
                onClick={() => updateItem(i, { ...item, sets: item.sets.filter((_, xi) => xi !== si) })}
                aria-label="remove set"
              >
                ✕
              </button>
            </div>
          ))}
          <Btn
            variant="ghost"
            className="w-full"
            onClick={() =>
              updateItem(i, {
                ...item,
                sets: [...item.sets, item.sets[item.sets.length - 1] ?? { weightKg: null, reps: 8 }],
              })
            }
          >
            ＋ Add set
          </Btn>
        </Card>
      ))}

      <Btn variant="ghost" className="mb-3 w-full py-3" onClick={() => setPickerOpen(true)}>
        ＋ Add exercise
      </Btn>
      <Btn className="w-full py-3.5 text-base" disabled={!name.trim() || !items.length} onClick={save}>
        Save preset
      </Btn>

      {pickerOpen && (
        <ExercisePicker
          onPick={(e) => {
            setItems([
              ...items,
              { exerciseId: e.id, sets: [{ weightKg: null, reps: 8 }, { weightKg: null, reps: 8 }, { weightKg: null, reps: 8 }] },
            ])
            setPickerOpen(false)
          }}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </Screen>
  )
}
