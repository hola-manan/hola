import { Link, useNavigate, useParams } from 'react-router-dom'
import { repo } from '../lib/repo'
import { presetFromWorkout } from '../lib/workout'
import { formatSet, setVolume, workoutVolume, workingSetCount } from '../lib/volume'
import { useStore, useUid } from '../store'
import { Btn, Card, EmptyState, Screen } from '../components/ui'

export function WorkoutDetail() {
  const { id } = useParams()
  const { workouts, exercises } = useStore()
  const uid = useUid()
  const navigate = useNavigate()
  const w = workouts.find((x) => x.id === id)

  if (!w) return <EmptyState>Workout not found.</EmptyState>

  const saveAsPreset = async () => {
    const name = prompt('Preset name', w.name ?? w.cycleDay ?? 'My workout')
    if (!name) return
    await repo.savePreset(uid, presetFromWorkout(w, name))
    navigate('/presets')
  }

  const remove = async () => {
    if (!confirm('Delete this workout from history?')) return
    await repo.deleteWorkout(uid, w.id)
    navigate('/history', { replace: true })
  }

  const durationMin =
    w.completedAt && !w.bulkEntered ? Math.round((w.completedAt - w.startedAt) / 60000) : null

  return (
    <Screen
      title={w.name ?? w.cycleDay ?? 'Workout'}
      action={
        <Btn variant="danger" onClick={remove}>
          Delete
        </Btn>
      }
    >
      <div className="mb-4 text-sm text-ink-dim">
        {new Date(w.startedAt).toLocaleDateString(undefined, {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
        })}
        {w.cycleDay && ` · ${w.cycleDay} day`}
        {durationMin !== null && ` · ${durationMin} min`}
        {' · '}
        {workingSetCount(w)} sets · {Math.round(workoutVolume(w)).toLocaleString()} kg total
      </div>

      {w.exercises.map((we, i) => {
        const ex = exercises.get(we.exerciseId)
        return (
          <Card key={`${we.exerciseId}-${i}`} className="mb-3">
            <Link to={`/exercises/${we.exerciseId}`} className="font-semibold underline-offset-2 hover:underline">
              {ex?.name ?? we.exerciseId}
            </Link>
            <div className="mt-2 flex flex-col gap-1">
              {we.sets.map((s, idx) => (
                <div key={s.id} className="flex justify-between rounded-lg bg-surface-2 px-3 py-1.5 text-sm">
                  <span>
                    <span className="mr-2 text-ink-dim">{idx + 1}.</span>
                    {formatSet(s)}
                    {s.type !== 'working' && <span className="ml-2 text-xs text-warn">{s.type}</span>}
                    {s.rpe != null && <span className="ml-2 text-xs text-ink-dim">RPE {s.rpe}</span>}
                  </span>
                  <span className="text-xs text-ink-dim">{Math.round(setVolume(s))} kg</span>
                </div>
              ))}
            </div>
          </Card>
        )
      })}

      <Btn variant="ghost" className="w-full py-3" onClick={saveAsPreset}>
        Save as preset
      </Btn>
    </Screen>
  )
}
