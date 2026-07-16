import { useMemo, useState } from 'react'
import { useStore } from '../store'
import type { Exercise, MuscleGroup } from '../types'
import { EmptyState } from './ui'

/**
 * Full-screen exercise picker used everywhere an exercise is chosen.
 * `nearMuscles` (e.g. when swapping) floats same-muscle alternatives to the top.
 */
export function ExercisePicker({
  onPick,
  onClose,
  nearMuscles,
}: {
  onPick: (e: Exercise) => void
  onClose: () => void
  nearMuscles?: MuscleGroup[]
}) {
  const { exerciseList } = useStore()
  const [q, setQ] = useState('')
  const [muscle, setMuscle] = useState<string>('')

  const muscles = useMemo(
    () => [...new Set(exerciseList.flatMap((e) => e.primaryMuscles))].sort(),
    [exerciseList],
  )

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase()
    let list = exerciseList.filter(
      (e) =>
        (!needle || e.name.toLowerCase().includes(needle)) &&
        (!muscle || e.primaryMuscles.includes(muscle as MuscleGroup)),
    )
    if (nearMuscles?.length && !needle && !muscle) {
      const score = (e: Exercise) =>
        e.primaryMuscles.some((m) => nearMuscles.includes(m)) ? 0 : 1
      list = [...list].sort((a, b) => score(a) - score(b))
    }
    return list
  }, [exerciseList, q, muscle, nearMuscles])

  return (
    // fixed overlay escapes #root's safe-area padding — re-apply the top inset
    <div className="fixed inset-0 z-30 mx-auto flex max-w-lg flex-col bg-bg pt-[env(safe-area-inset-top)]">
      <div className="flex items-center gap-2 border-b border-line p-3">
        <input
          autoFocus
          placeholder="Search exercises…"
          className="h-11 flex-1 rounded-xl bg-surface-2 px-3 outline-none"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button className="px-2 py-2 text-ink-dim" onClick={onClose}>
          Cancel
        </button>
      </div>
      <div className="flex gap-2 overflow-x-auto p-3 pb-1">
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
      <div className="flex-1 overflow-y-auto p-3">
        {results.map((e) => (
          <button
            key={e.id}
            onClick={() => onPick(e)}
            className="mb-2 flex w-full items-center gap-3 rounded-2xl bg-surface p-3 text-left active:opacity-70"
          >
            {e.images[0] ? (
              <img
                src={e.images[0]}
                alt=""
                loading="lazy"
                className="h-12 w-12 rounded-lg bg-white object-cover"
              />
            ) : (
              <div className="grid h-12 w-12 place-items-center rounded-lg bg-surface-2 text-lg">💪</div>
            )}
            <div>
              <div className="font-medium">{e.name}</div>
              <div className="text-xs text-ink-dim">
                {e.primaryMuscles.join(', ')} · {e.equipment}
              </div>
            </div>
          </button>
        ))}
        {!results.length && <EmptyState>No exercises match.</EmptyState>}
      </div>
    </div>
  )
}
