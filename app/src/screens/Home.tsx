import { Link, useNavigate } from 'react-router-dom'
import { repo } from '../lib/repo'
import { currentDayLabel, missedDays, shiftToToday, skipDay } from '../lib/cycle'
import { emptyWorkout, workoutFromPreset } from '../lib/workout'
import { workoutVolume, workingSetCount } from '../lib/volume'
import { useStore, useUid } from '../store'
import { isRestDay } from '../types'
import { Btn, Card, EmptyState, Screen } from '../components/ui'

export function Home() {
  const { cycle, presets, workouts, activeWorkout } = useStore()
  const uid = useUid()
  const navigate = useNavigate()

  const dayLabel = cycle ? currentDayLabel(cycle) : null
  const missed = cycle ? missedDays(cycle) : 0
  const dayPresets = dayLabel
    ? presets.filter((p) => p.cycleDay?.toLowerCase() === dayLabel.toLowerCase())
    : []
  const recent = workouts.filter((w) => w.status === 'completed').slice(0, 3)

  const start = async (presetId?: string) => {
    const preset = presets.find((p) => p.id === presetId)
    const w = preset
      ? workoutFromPreset(preset, workouts)
      : emptyWorkout(dayLabel && !isRestDay(dayLabel) ? dayLabel : undefined)
    await repo.saveWorkout(uid, w)
    navigate('/workout')
  }

  return (
    <Screen title="Hola Gym">
      {cycle && dayLabel ? (
        <Card className="mb-4">
          <div className="text-xs uppercase tracking-wide text-ink-dim">
            Day {(cycle.pointer % cycle.days.length) + 1} of {cycle.days.length} ·{' '}
            <Link to="/cycle" className="underline">
              edit cycle
            </Link>
          </div>
          <div className="mt-1 text-3xl font-bold">
            {isRestDay(dayLabel) ? 'Rest day 😌' : `${dayLabel} day`}
          </div>
          {missed > 1 && !isRestDay(dayLabel) && (
            <div className="mt-3 rounded-xl bg-surface-2 p-3 text-sm">
              <p className="mb-2">
                {dayLabel} has been waiting {missed} days. Do it today, or skip it?
              </p>
              <div className="flex gap-2">
                <Btn onClick={() => repo.saveCycle(uid, shiftToToday(cycle))}>
                  Do {dayLabel} today
                </Btn>
                <Btn variant="ghost" onClick={() => repo.saveCycle(uid, skipDay(cycle))}>
                  Skip it
                </Btn>
              </div>
            </div>
          )}
        </Card>
      ) : (
        <Card className="mb-4">
          <p className="text-sm text-ink-dim">
            No training cycle set up yet. Define your split (e.g. Push / Pull / Legs / Rest) and
            the app will tell you what today is.
          </p>
          <Btn className="mt-3" onClick={() => navigate('/cycle')}>
            Set up cycle
          </Btn>
        </Card>
      )}

      {!activeWorkout && (
        <div className="mb-4 flex flex-col gap-2">
          {dayPresets.map((p) => (
            <Btn key={p.id} onClick={() => start(p.id)} className="py-3.5 text-base">
              Start {p.name}
            </Btn>
          ))}
          <Btn
            variant={dayPresets.length ? 'ghost' : 'primary'}
            className="py-3.5 text-base"
            onClick={() => start()}
          >
            Start empty workout
          </Btn>
          <Btn variant="ghost" onClick={() => navigate('/bulk')}>
            Add past workout
          </Btn>
        </div>
      )}

      <h2 className="mb-2 mt-6 text-sm font-semibold uppercase tracking-wide text-ink-dim">
        Recent workouts
      </h2>
      {recent.length ? (
        recent.map((w) => (
          <Link key={w.id} to={`/history/${w.id}`}>
            <Card className="mb-2 flex items-center justify-between">
              <div>
                <div className="font-medium">
                  {w.name ?? w.cycleDay ?? 'Workout'}
                  {w.cycleDay && w.name ? ` · ${w.cycleDay}` : ''}
                </div>
                <div className="text-xs text-ink-dim">
                  {new Date(w.startedAt).toLocaleDateString()} · {workingSetCount(w)} sets ·{' '}
                  {Math.round(workoutVolume(w)).toLocaleString()} kg
                </div>
              </div>
              <span className="text-ink-dim">→</span>
            </Card>
          </Link>
        ))
      ) : (
        <EmptyState>No workouts yet — start one above.</EmptyState>
      )}
    </Screen>
  )
}
