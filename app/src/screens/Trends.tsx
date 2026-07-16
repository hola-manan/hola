import { useMemo, useState } from 'react'
import { e1rmDelta, rmSeries } from '../lib/rm'
import { lastSession } from '../lib/workout'
import { useStore } from '../store'
import { ExercisePicker } from '../components/ExercisePicker'
import { filterRange, RmPlot } from '../components/RmChart'

const RANGES: { label: string; days: number | null }[] = [
  { label: '1M', days: 30 },
  { label: '3M', days: 91 },
  { label: '1Y', days: 365 },
]

const STORAGE_KEY = 'trends-exercises'

const MONO = "'IBM Plex Mono',monospace"
const SANS = "'IBM Plex Sans',system-ui,sans-serif"
const CONDENSED = "'IBM Plex Sans Condensed',sans-serif"

export function Trends() {
  const { workouts, exercises, profile } = useStore()
  const [range, setRange] = useState<number | null>(91)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [selected, setSelected] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
    } catch {
      return []
    }
  })
  const [volumeFor, setVolumeFor] = useState<Record<string, boolean>>({})

  const completed = useMemo(() => workouts.filter((w) => w.status === 'completed'), [workouts])

  const shown = useMemo(() => {
    const valid = selected.filter((id) => exercises.has(id))
    if (valid.length) return valid
    const seen: string[] = []
    for (const w of completed) {
      for (const we of w.exercises) {
        if (!seen.includes(we.exerciseId) && rmSeries(completed, we.exerciseId).length >= 2) {
          seen.push(we.exerciseId)
        }
        if (seen.length >= 2) return seen
      }
    }
    return seen
  }, [selected, completed, exercises])

  const persist = (ids: string[]) => {
    setSelected(ids)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
  }

  const latestBw = profile.bodyweight[profile.bodyweight.length - 1]
  const prevBw = profile.bodyweight[profile.bodyweight.length - 2]

  return (
    <div style={{ minHeight: '100%', background: '#0b0d10', color: '#e9ecef', fontFamily: SANS, boxSizing: 'border-box', padding: '72px 0 0', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '0 20px', flex: 1, overflow: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <div style={{ fontFamily: CONDENSED, fontWeight: 700, fontSize: 32 }}>Trends</div>
          <div style={{ display: 'flex', gap: 4 }}>
            {RANGES.map((r) => {
              const active = range === r.days
              return (
                <span
                  key={r.label}
                  onClick={() => setRange(r.days)}
                  style={{
                    fontSize: 10, fontFamily: MONO, padding: '3px 8px', borderRadius: 5,
                    background: active ? '#c8f04b' : 'transparent',
                    color: active ? '#0b0d10' : '#5a6270',
                    fontWeight: active ? 600 : 400,
                    cursor: 'pointer'
                  }}
                >
                  {r.label}
                </span>
              )
            })}
          </div>
        </div>
        
        <div
          onClick={() => setPickerOpen(true)}
          style={{ marginTop: 12, background: '#14171c', border: '1px solid rgba(255,255,255,.1)', borderRadius: 10, padding: '11px 14px', fontSize: 13, color: '#5a6270', cursor: 'pointer' }}
        >
          ⌕ Add exercise to compare…
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}>
          {shown.map((id) => {
            const ex = exercises.get(id)
            const series = filterRange(rmSeries(completed, id), range)
            const delta = e1rmDelta(completed, id)
            const last = lastSession(completed, id)
            
            const isNeutral = !delta?.deltaPct || Math.abs(delta.deltaPct) < 0.05
            const isPos = delta && delta.deltaPct && delta.deltaPct > 0
            const deltaColor = isNeutral ? '#5a6270' : isPos ? '#63d08a' : '#e0596b'

            return (
              <div key={id} style={{ background: '#14171c', border: '1px solid rgba(255,255,255,.08)', borderRadius: 12, padding: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 13.5, fontWeight: 600 }}>{ex?.name ?? id}</span>
                    {selected.includes(id) && (
                      <button onClick={() => persist(selected.filter((x) => x !== id))} style={{ color: '#5a6270', fontSize: 13, background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>✕</button>
                    )}
                  </div>
                  {delta && (
                    <span style={{ fontFamily: MONO, fontSize: 12, color: deltaColor }}>
                      {delta.current.toFixed(1)} KG
                      {delta.deltaPct !== null && (
                        <span>
                          {' '}
                          {isNeutral ? '→' : `${delta.deltaPct >= 0 ? '↑' : '↓'}${Math.abs(delta.deltaPct).toFixed(1)}%`}
                        </span>
                      )}
                    </span>
                  )}
                </div>
                
                <div style={{ marginTop: 8 }}>
                  <RmPlot points={series} height={90} showVolume={volumeFor[id] ?? false} />
                </div>
                
                <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                  <span style={{ fontSize: 10.5, fontFamily: MONO, padding: '4px 9px', borderRadius: 6, border: '1px solid rgba(87,196,204,.4)', color: '#57c4cc' }}>
                    e1RM ●
                  </span>
                  <button
                    onClick={() => setVolumeFor((v) => ({ ...v, [id]: !v[id] }))}
                    style={{ fontSize: 10.5, fontFamily: MONO, padding: '4px 9px', borderRadius: 6, border: volumeFor[id] ? '1px solid rgba(200,240,75,.4)' : '1px solid rgba(255,255,255,.1)', color: volumeFor[id] ? '#c8f04b' : '#5a6270', background: 'none', cursor: 'pointer' }}
                  >
                    volume ◌
                  </button>
                </div>
                
                {delta && last && (
                  <div style={{ marginTop: 10, borderTop: '1px solid rgba(255,255,255,.07)', paddingTop: 9, fontSize: 11.5, color: '#8b93a0', lineHeight: 1.5 }}>
                    @ current e1RM: <span style={{ fontFamily: MONO, color: '#e9ecef' }}>75% × 10 ≈ {Math.round((delta.current * 0.75) / 0.25) * 0.25} kg</span> · <span style={{ fontFamily: MONO, color: '#e9ecef' }}>85% × 5 ≈ {Math.round((delta.current * 0.85) / 0.25) * 0.25} kg</span>
                  </div>
                )}
              </div>
            )
          })}

          {!shown.length && (
            <div style={{ textAlign: 'center', color: '#5a6270', fontSize: 13, marginTop: 40 }}>
              Log a few workouts and your strength trends will show up here.
            </div>
          )}
        </div>

        {latestBw && (
          <div style={{ marginTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#101318', border: '1px solid rgba(255,255,255,.08)', borderRadius: 10, padding: '11px 14px' }}>
            <span style={{ fontSize: 12.5, color: '#8b93a0' }}>Bodyweight</span>
            <span style={{ fontFamily: MONO, fontSize: 12, color: '#e9ecef' }}>
              {latestBw.weightKg} KG
              {prevBw && (
                <span style={{ color: latestBw.weightKg <= prevBw.weightKg ? '#63d08a' : '#e0596b' }}>
                  {' '}{latestBw.weightKg <= prevBw.weightKg ? '↓' : '↑'}{Math.abs(latestBw.weightKg - prevBw.weightKg).toFixed(1)}
                </span>
              )}
            </span>
          </div>
        )}
        <div style={{ paddingBottom: 24 }}></div>
      </div>

      {pickerOpen && (
        <ExercisePicker
          onClose={() => setPickerOpen(false)}
          onPick={(e) => {
            if (!shown.includes(e.id)) persist([...(selected.length ? selected : shown), e.id])
            setPickerOpen(false)
          }}
        />
      )}
    </div>
  )
}
