import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { rmSeries } from '../lib/rm'
import { lastSession } from '../lib/workout'
import { useStore } from '../store'
import { RmChart } from '../components/RmChart'

const MONO = "'IBM Plex Mono',monospace"
const CONDENSED = "'IBM Plex Sans Condensed',sans-serif"
const SANS = "'IBM Plex Sans',system-ui,sans-serif"

export function ExerciseDetail() {
  const { id } = useParams()
  const { exercises, workouts } = useStore()
  const [imgIndex, setImgIndex] = useState(0)
  const exercise = id ? exercises.get(id) : undefined

  const completed = useMemo(() => workouts.filter((w) => w.status === 'completed'), [workouts])
  const series = useMemo(() => (id ? rmSeries(completed, id) : []), [completed, id])
  const bestSet = useMemo(() => {
    if (!series.length) return null
    const best = series.reduce((a, b) => (b.bestWeightKg > a.bestWeightKg ? b : a))
    return `${best.bestWeightKg}kg`
  }, [series])
  const last = id ? lastSession(completed, id) : null

  if (!exercise) {
    return <div style={{ padding: '24px', textAlign: 'center', color: '#e0596b' }}>Exercise not found.</div>
  }

  const current = series.length ? series[series.length - 1] : null
  const sessions = series.length

  return (
    <div style={{ minHeight: '100%', background: '#0b0d10', color: '#e9ecef', fontFamily: SANS, boxSizing: 'border-box', padding: '62px 0 30px' }}>
      
      {/* Media Hero */}
      <button
        onClick={() => exercise.images.length > 1 && setImgIndex((i) => (i + 1) % exercise.images.length)}
        style={{
          width: '100%', height: 200, marginTop: 8, background: 'repeating-linear-gradient(45deg,#14171c,#14171c 6px,#101318 6px,#101318 12px)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8,
          borderBottom: '1px solid rgba(255,255,255,.08)', borderTop: 'none', borderLeft: 'none', borderRight: 'none', padding: 0,
          position: 'relative', cursor: 'pointer'
        }}
      >
        {exercise.images[imgIndex] ? (
          <img src={exercise.images[imgIndex]} alt={exercise.name} style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#fff' }} />
        ) : (
          <>
            <div style={{ width: 52, height: 52, borderRadius: 26, background: 'rgba(200,240,75,.14)', border: '1px solid rgba(200,240,75,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c8f04b', fontSize: 18 }}>
              ▶
            </div>
            <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '.12em', color: '#5a6270' }}>FORM VIDEO · PLACEHOLDER</span>
          </>
        )}
        {exercise.images.length > 1 && (
          <span style={{ position: 'absolute', bottom: 8, right: 8, background: 'rgba(0,0,0,0.6)', padding: '2px 8px', borderRadius: 4, fontFamily: MONO, fontSize: 9, letterSpacing: '.1em', color: '#e9ecef', textTransform: 'uppercase' }}>
            tap · {imgIndex + 1}/{exercise.images.length}
          </span>
        )}
      </button>

      <div style={{ padding: '16px 20px 0' }}>
        <div style={{ fontFamily: CONDENSED, fontWeight: 700, fontSize: 28 }}>{exercise.name}</div>
        
        <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
          {exercise.primaryMuscles.map(m => (
            <span key={m} style={{ fontSize: 11, padding: '4px 9px', borderRadius: 6, background: 'rgba(87,196,204,.12)', color: '#57c4cc', fontFamily: MONO, textTransform: 'uppercase' }}>
              {m} · PRIMARY
            </span>
          ))}
          {exercise.secondaryMuscles.map(m => (
            <span key={m} style={{ fontSize: 11, padding: '4px 9px', borderRadius: 6, background: '#14171c', color: '#8b93a0', fontFamily: MONO, textTransform: 'uppercase' }}>
              {m}
            </span>
          ))}
          <span style={{ fontSize: 11, padding: '4px 9px', borderRadius: 6, background: '#14171c', color: '#8b93a0', fontFamily: MONO, textTransform: 'uppercase' }}>
            {exercise.equipment}
          </span>
        </div>

        <div style={{ display: 'flex', marginTop: 16, background: '#14171c', border: '1px solid rgba(255,255,255,.08)', borderRadius: 11, padding: '12px 0' }}>
          <div style={{ flex: 1, textAlign: 'center', borderRight: '1px solid rgba(255,255,255,.07)' }}>
            <div style={{ fontFamily: MONO, fontSize: 16, color: '#c8f04b' }}>{current ? current.e1rm.toFixed(1) : '—'}</div>
            <div style={{ fontSize: 9.5, color: '#5a6270', marginTop: 2 }}>e1RM KG</div>
          </div>
          <div style={{ flex: 1, textAlign: 'center', borderRight: '1px solid rgba(255,255,255,.07)' }}>
            <div style={{ fontFamily: MONO, fontSize: 16 }}>{bestSet ?? '—'}</div>
            <div style={{ fontSize: 9.5, color: '#5a6270', marginTop: 2 }}>BEST SET</div>
          </div>
          <div style={{ flex: 1, textAlign: 'center', borderRight: '1px solid rgba(255,255,255,.07)' }}>
            <div style={{ fontFamily: MONO, fontSize: 16 }}>{sessions}</div>
            <div style={{ fontSize: 9.5, color: '#5a6270', marginTop: 2 }}>SESSIONS</div>
          </div>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontFamily: MONO, fontSize: 16 }}>
              {current ? new Date(current.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }).toUpperCase() : '—'}
            </div>
            <div style={{ fontSize: 9.5, color: '#5a6270', marginTop: 2 }}>LAST DONE</div>
          </div>
        </div>

        <RmChart points={series} />

        {last && (
          <div style={{ marginTop: 24 }}>
            <div style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: '.12em', color: '#5a6270', marginBottom: 6 }}>
              LAST SESSION · {new Date(last.workout.startedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }).toUpperCase()}
            </div>
            <div style={{ fontFamily: MONO, fontSize: 12.5, color: '#e9ecef' }}>
              {last.sets.map((s) => s.segments.map((seg) => `${seg.weightKg}×${seg.reps}`).join('+')).join(' · ')}
            </div>
          </div>
        )}

        {exercise.instructions.length > 0 && (
          <div style={{ marginTop: 24 }}>
            <div style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: '.12em', color: '#5a6270', marginTop: 18 }}>HOW TO</div>
            <div style={{ fontSize: 12.5, color: '#c7ccd4', lineHeight: 1.6, marginTop: 6 }}>
              {exercise.instructions.map((step, i) => (
                <div key={i}>{i + 1} · {step}</div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
