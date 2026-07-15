import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { currentE1RM, rmSeries, weightForReps } from '../lib/rm'
import { lastSession } from '../lib/workout'
import { formatSet } from '../lib/volume'
import { useStore } from '../store'
import { Card, EmptyState, Screen } from '../components/ui'
import { RmChart } from '../components/RmChart'

export function ExerciseDetail() {
  const { id } = useParams()
  const { exercises, workouts } = useStore()
  const [imgIndex, setImgIndex] = useState(0)
  const exercise = id ? exercises.get(id) : undefined

  const completed = useMemo(() => workouts.filter((w) => w.status === 'completed'), [workouts])
  const series = useMemo(() => (id ? rmSeries(completed, id) : []), [completed, id])
  const e1rm = id ? currentE1RM(completed, id) : null
  const last = id ? lastSession(completed, id) : null

  if (!exercise) return <EmptyState>Exercise not found.</EmptyState>

  return (
    <Screen title={exercise.name}>
      <div className="mb-4 text-sm text-ink-dim">
        {exercise.primaryMuscles.join(', ')}
        {exercise.secondaryMuscles.length > 0 && ` (+ ${exercise.secondaryMuscles.join(', ')})`}
        {' · '}
        {exercise.equipment}
      </div>

      {exercise.images.length > 0 && (
        <button
          className="mb-4 block w-full"
          onClick={() => setImgIndex((i) => (i + 1) % exercise.images.length)}
        >
          <img
            src={exercise.images[imgIndex]}
            alt={exercise.name}
            className="w-full rounded-2xl bg-white"
          />
          {exercise.images.length > 1 && (
            <span className="mt-1 block text-center text-xs text-ink-dim">
              tap for {imgIndex === 0 ? 'end' : 'start'} position ({imgIndex + 1}/{exercise.images.length})
            </span>
          )}
        </button>
      )}

      <Card className="mb-3">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-ink-dim">Progress</h2>
        {e1rm && (
          <div className="mb-3">
            <div className="text-3xl font-bold">
              {e1rm.toFixed(1)} <span className="text-base font-normal text-ink-dim">kg est. 1RM</span>
            </div>
            <div className="mt-1 text-xs text-ink-dim">
              ≈ {weightForReps(e1rm, 5)} kg × 5 · {weightForReps(e1rm, 8)} kg × 8 ·{' '}
              {weightForReps(e1rm, 10)} kg × 10
            </div>
          </div>
        )}
        <RmChart points={series} />
      </Card>

      {last && (
        <Card className="mb-3">
          <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-ink-dim">
            Last session · {new Date(last.workout.startedAt).toLocaleDateString()}
          </h2>
          <div className="text-sm">{last.sets.map((s) => formatSet(s)).join(' · ')}</div>
        </Card>
      )}

      {exercise.instructions.length > 0 && (
        <Card>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-ink-dim">
            How to do it
          </h2>
          <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed">
            {exercise.instructions.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
        </Card>
      )}
    </Screen>
  )
}
