import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { repo } from '../lib/repo'
import { useStore, useUid } from '../store'
import type { Equipment, MuscleGroup } from '../types'
import { Btn, Card, EmptyState, Screen } from '../components/ui'

export function Exercises() {
  const { exerciseList } = useStore()
  const uid = useUid()
  const [q, setQ] = useState('')
  const [muscle, setMuscle] = useState('')
  const [adding, setAdding] = useState(false)

  const muscles = useMemo(
    () => [...new Set(exerciseList.flatMap((e) => e.primaryMuscles))].sort(),
    [exerciseList],
  )
  const results = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return exerciseList.filter(
      (e) =>
        (!needle || e.name.toLowerCase().includes(needle)) &&
        (!muscle || e.primaryMuscles.includes(muscle as MuscleGroup)),
    )
  }, [exerciseList, q, muscle])

  const addCustom = async (name: string, muscleGroups: MuscleGroup[], equipment: Equipment) => {
    await repo.saveCustomExercise(uid, {
      id: `custom-${crypto.randomUUID()}`,
      name,
      primaryMuscles: muscleGroups,
      secondaryMuscles: [],
      equipment,
      instructions: [],
      images: [],
      isCustom: true,
    })
    setAdding(false)
  }

  return (
    <Screen
      title="Exercises"
      action={
        <Btn variant="ghost" onClick={() => setAdding(true)}>
          ＋ Custom
        </Btn>
      }
    >
      <input
        placeholder="Search…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="mb-3 h-11 w-full rounded-xl bg-surface-2 px-3 outline-none"
      />
      <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
        {['', ...muscles].map((m) => (
          <button
            key={m || 'all'}
            onClick={() => setMuscle(m)}
            className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs ${
              muscle === m ? 'bg-accent text-accent-ink' : 'bg-surface-2 text-ink-dim'
            }`}
          >
            {m || 'all'}
          </button>
        ))}
      </div>

      {results.map((e) => (
        <Link key={e.id} to={`/exercises/${e.id}`}>
          <Card className="mb-2 flex items-center gap-3">
            {e.images[0] ? (
              <img src={e.images[0]} alt="" loading="lazy" className="h-12 w-12 rounded-lg bg-white object-cover" />
            ) : (
              <div className="grid h-12 w-12 place-items-center rounded-lg bg-surface-2">💪</div>
            )}
            <div className="flex-1">
              <div className="font-medium">
                {e.name}
                {e.isCustom && <span className="ml-2 text-xs text-ink-dim">(custom)</span>}
              </div>
              <div className="text-xs text-ink-dim">
                {e.primaryMuscles.join(', ')} · {e.equipment}
              </div>
            </div>
            <span className="text-ink-dim">→</span>
          </Card>
        </Link>
      ))}
      {!results.length && <EmptyState>No exercises match.</EmptyState>}

      {adding && <AddCustom onCancel={() => setAdding(false)} onAdd={addCustom} muscles={muscles} />}
    </Screen>
  )
}

function AddCustom({
  onCancel,
  onAdd,
  muscles,
}: {
  onCancel: () => void
  onAdd: (name: string, muscles: MuscleGroup[], equipment: Equipment) => void
  muscles: string[]
}) {
  const [name, setName] = useState('')
  const [selected, setSelected] = useState<string[]>([])
  const [equipment, setEquipment] = useState<Equipment>('machine')
  const equipments: Equipment[] = ['barbell', 'dumbbell', 'machine', 'cable', 'bodyweight', 'kettlebell', 'ez bar', 'band', 'other']

  return (
    <div className="fixed inset-0 z-30 grid place-items-center bg-black/70 p-6">
      <Card className="max-h-[85dvh] w-full overflow-y-auto">
        <h2 className="mb-3 text-lg font-semibold">Custom exercise</h2>
        <input
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mb-3 h-11 w-full rounded-xl bg-surface-2 px-3"
        />
        <div className="mb-1 text-xs uppercase tracking-wide text-ink-dim">Primary muscles</div>
        <div className="mb-3 flex flex-wrap gap-2">
          {muscles.map((m) => (
            <button
              key={m}
              onClick={() =>
                setSelected((s) => (s.includes(m) ? s.filter((x) => x !== m) : [...s, m]))
              }
              className={`rounded-full px-3 py-1.5 text-xs ${
                selected.includes(m) ? 'bg-accent text-accent-ink' : 'bg-surface-2 text-ink-dim'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
        <div className="mb-1 text-xs uppercase tracking-wide text-ink-dim">Equipment</div>
        <div className="mb-4 flex flex-wrap gap-2">
          {equipments.map((eq) => (
            <button
              key={eq}
              onClick={() => setEquipment(eq)}
              className={`rounded-full px-3 py-1.5 text-xs ${
                equipment === eq ? 'bg-accent text-accent-ink' : 'bg-surface-2 text-ink-dim'
              }`}
            >
              {eq}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <Btn variant="ghost" className="flex-1" onClick={onCancel}>
            Cancel
          </Btn>
          <Btn
            className="flex-1"
            disabled={!name.trim() || !selected.length}
            onClick={() => onAdd(name.trim(), selected as MuscleGroup[], equipment)}
          >
            Add
          </Btn>
        </div>
      </Card>
    </div>
  )
}
