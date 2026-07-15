import { Link, useNavigate } from 'react-router-dom'
import { repo } from '../lib/repo'
import { workoutFromPreset } from '../lib/workout'
import { useStore, useUid } from '../store'
import { Btn, Card, EmptyState, Screen } from '../components/ui'

export function Presets() {
  const { presets, exercises, workouts, activeWorkout } = useStore()
  const uid = useUid()
  const navigate = useNavigate()

  const start = async (presetId: string) => {
    const preset = presets.find((p) => p.id === presetId)
    if (!preset) return
    await repo.saveWorkout(uid, workoutFromPreset(preset, workouts))
    navigate('/workout')
  }

  return (
    <Screen
      title="Presets"
      action={
        <Btn variant="ghost" onClick={() => navigate('/presets/new')}>
          ＋ New
        </Btn>
      }
    >
      {presets.length ? (
        presets.map((p) => (
          <Card key={p.id} className="mb-3">
            <div className="flex items-center justify-between">
              <Link to={`/presets/${p.id}`} className="flex-1">
                <div className="font-semibold">{p.name}</div>
                <div className="text-xs text-ink-dim">
                  {p.cycleDay ? `${p.cycleDay} day · ` : ''}
                  {p.exercises.map((e) => exercises.get(e.exerciseId)?.name ?? e.exerciseId).join(', ')}
                </div>
              </Link>
              {!activeWorkout && <Btn onClick={() => start(p.id)}>Start</Btn>}
            </div>
          </Card>
        ))
      ) : (
        <EmptyState>
          No presets yet. Create one from scratch, or open a finished workout and “Save as preset”.
        </EmptyState>
      )}
    </Screen>
  )
}
