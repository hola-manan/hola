import { Link } from 'react-router-dom'
import type { Workout } from '../types'
import { workingSetCount } from '../lib/volume'

export function ActiveWorkoutBanner({ workout }: { workout: Workout }) {
  const mins = Math.floor((Date.now() - workout.startedAt) / 60000)
  return (
    <Link
      to="/workout"
      className="fixed inset-x-0 bottom-[60px] z-20 mx-auto flex max-w-lg items-center justify-between bg-lime px-5 py-2.5 text-[13px] font-semibold text-on-lime"
    >
      <span className="truncate">
        Workout in progress{workout.name ? ` — ${workout.name}` : ''}
        <span className="ml-2 font-mono text-[11px] font-medium opacity-70">
          {mins} MIN · {workingSetCount(workout)} SETS
        </span>
      </span>
      <span>Resume →</span>
    </Link>
  )
}
