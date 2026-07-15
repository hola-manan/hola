import { Link } from 'react-router-dom'
import type { Workout } from '../types'
import { workingSetCount } from '../lib/volume'

export function ActiveWorkoutBanner({ workout }: { workout: Workout }) {
  const mins = Math.floor((Date.now() - workout.startedAt) / 60000)
  return (
    <Link
      to="/workout"
      className="fixed inset-x-0 bottom-14 z-20 mx-auto flex max-w-lg items-center justify-between bg-accent px-4 py-2.5 font-medium text-accent-ink"
    >
      <span>
        Workout in progress{workout.name ? ` — ${workout.name}` : ''} · {mins} min ·{' '}
        {workingSetCount(workout)} sets
      </span>
      <span>Resume →</span>
    </Link>
  )
}
