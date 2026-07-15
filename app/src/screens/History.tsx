import { Link } from 'react-router-dom'
import { useStore } from '../store'
import { workoutVolume, workingSetCount } from '../lib/volume'
import { Card, EmptyState, Screen } from '../components/ui'

export function History() {
  const { workouts } = useStore()
  const completed = workouts.filter((w) => w.status === 'completed')

  return (
    <Screen title="History">
      {completed.length ? (
        completed.map((w) => (
          <Link key={w.id} to={`/history/${w.id}`}>
            <Card className="mb-2 flex items-center justify-between">
              <div>
                <div className="font-medium">
                  {w.name ?? w.cycleDay ?? 'Workout'}
                  {w.bulkEntered && <span className="ml-2 text-xs text-ink-dim">(added later)</span>}
                </div>
                <div className="text-xs text-ink-dim">
                  {new Date(w.startedAt).toLocaleDateString(undefined, {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                  })}
                  {' · '}
                  {w.exercises.length} exercises · {workingSetCount(w)} sets ·{' '}
                  {Math.round(workoutVolume(w)).toLocaleString()} kg
                </div>
              </div>
              <span className="text-ink-dim">→</span>
            </Card>
          </Link>
        ))
      ) : (
        <EmptyState>Nothing here yet.</EmptyState>
      )}
    </Screen>
  )
}
