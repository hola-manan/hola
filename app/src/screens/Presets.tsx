import { Link, useNavigate } from 'react-router-dom'
import { repo } from '../lib/repo'
import { workoutFromPreset } from '../lib/workout'
import { useStore, useUid } from '../store'

const SANS = "'IBM Plex Sans',system-ui,sans-serif"

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
    <div style={{ height: '100%', background: '#0b0d10', color: '#e9ecef', fontFamily: SANS, boxSizing: 'border-box', padding: '62px 20px 30px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <button onClick={() => navigate(-1)} style={{ fontSize: 13, color: '#8b93a0', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>Cancel</button>
        <span style={{ fontWeight: 600, fontSize: 15 }}>Presets</span>
        <button onClick={() => navigate('/presets/new')} style={{ fontSize: 13, color: '#c8f04b', fontWeight: 600, background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>＋ New</button>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
        {presets.length ? (
          presets.map((p) => (
            <div key={p.id} style={{ marginBottom: 10, background: '#14171c', border: '1px solid rgba(255,255,255,.08)', borderRadius: 10, padding: '12px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Link to={`/presets/${p.id}`} style={{ flex: 1, textDecoration: 'none', color: 'inherit' }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: '#5a6270', marginTop: 4 }}>
                    {p.cycleDay ? `${p.cycleDay} day · ` : ''}
                    {p.exercises.map((e) => exercises.get(e.exerciseId)?.name ?? e.exerciseId).join(', ')}
                  </div>
                </Link>
                {!activeWorkout && (
                  <button onClick={() => start(p.id)} style={{ background: '#c8f04b', color: '#0b0d10', fontSize: 12, fontWeight: 600, padding: '6px 12px', borderRadius: 6, border: 'none', cursor: 'pointer' }}>
                    Start
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <div style={{ textAlign: 'center', color: '#5a6270', fontSize: 13, marginTop: 40, lineHeight: 1.5 }}>
            No presets yet. Create one from scratch, or open a finished workout and “Save as preset”.
          </div>
        )}
      </div>
    </div>
  )
}
