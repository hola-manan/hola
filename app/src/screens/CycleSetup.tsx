import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { repo } from '../lib/repo'
import { todayStr } from '../lib/cycle'
import { useStore, useUid } from '../store'
import { isRestDay } from '../types'

const TEMPLATES: { name: string; days: string[] }[] = [
  { name: 'Push / Pull / Legs / Rest', days: ['Push', 'Pull', 'Legs', 'Rest'] },
  { name: 'PPL + Upper / Lower', days: ['Push', 'Pull', 'Legs', 'Rest', 'Upper', 'Lower', 'Rest'] },
  { name: 'Upper / Lower', days: ['Upper', 'Lower', 'Rest'] },
  { name: 'Full body every other day', days: ['Full Body', 'Rest'] },
]

const MONO = "'IBM Plex Mono',monospace"
const SANS = "'IBM Plex Sans',system-ui,sans-serif"
const CONDENSED = "'IBM Plex Sans Condensed',sans-serif"

export function CycleSetup() {
  const { cycle, presets } = useStore()
  const uid = useUid()
  const navigate = useNavigate()
  const [days, setDays] = useState<string[]>(cycle?.days ?? [])
  const [pointer, setPointer] = useState(cycle?.pointer ?? 0)

  const save = async () => {
    await repo.saveCycle(uid, {
      days,
      pointer: Math.min(pointer, days.length - 1),
      pointerDate: todayStr(),
    })
    navigate('/')
  }

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir
    if (j < 0 || j >= days.length) return
    const next = [...days]
    ;[next[i], next[j]] = [next[j], next[i]]
    setDays(next)
    if (pointer === i) setPointer(j)
    else if (pointer === j) setPointer(i)
  }

  const presetsFor = (day: string) =>
    presets.filter((p) => p.cycleDay?.toLowerCase() === day.toLowerCase())

  return (
    <div style={{ height: '100%', background: '#0b0d10', color: '#e9ecef', fontFamily: SANS, boxSizing: 'border-box', padding: '72px 0 0', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '0 20px' }}>
        <div style={{ fontFamily: CONDENSED, fontWeight: 700, fontSize: 32 }}>Cycle</div>
        <div style={{ fontSize: 12, color: '#8b93a0', marginTop: 4 }}>
          {days.length ? `${days.length}-day rotation` : 'Define your rotation'} · advances daily at midnight
        </div>
      </div>
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '0 20px 30px' }}>

      {!days.length && (
        <div style={{ marginTop: 24 }}>
          <div style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: '.12em', color: '#5a6270', marginBottom: 12 }}>START FROM A TEMPLATE</div>
          {TEMPLATES.map((t) => (
            <div key={t.name} onClick={() => setDays(t.days)} style={{ marginBottom: 8, background: '#14171c', border: '1px solid rgba(255,255,255,.08)', borderRadius: 10, padding: '12px 14px', cursor: 'pointer' }}>
              <div style={{ fontSize: 13.5, fontWeight: 600 }}>{t.name}</div>
              <div style={{ marginTop: 4, fontFamily: MONO, fontSize: 10.5, letterSpacing: '.06em', color: '#5a6270', textTransform: 'uppercase' }}>
                {t.days.join(' → ')}
              </div>
            </div>
          ))}
        </div>
      )}

      {days.length > 0 && (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 14 }}>
            {days.map((d, i) => {
              const isToday = pointer === i
              const rest = isRestDay(d)
              const dayPresets = presetsFor(d)
              
              const isDone = pointer > i // very naive 'done' logic for UI sake

              return (
                <div key={`${d}-${i}`} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  background: isToday ? 'rgba(200,240,75,.06)' : rest ? '#101318' : '#14171c',
                  border: isToday ? '1px solid rgba(200,240,75,.45)' : rest ? '1px dashed rgba(255,255,255,.12)' : '1px solid rgba(255,255,255,.08)',
                  borderRadius: 10, padding: '11px 14px',
                  opacity: (isDone && !isToday) ? 0.55 : 1
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <button onClick={() => move(i, -1)} style={{ color: '#3d434c', fontSize: 13, background: 'none', border: 'none', padding: 0, lineHeight: 1 }}>▴</button>
                    <button onClick={() => move(i, 1)} style={{ color: '#3d434c', fontSize: 13, background: 'none', border: 'none', padding: 0, lineHeight: 1 }}>▾</button>
                  </div>
                  
                  <span style={{ fontFamily: MONO, fontSize: 10, color: isToday ? '#c8f04b' : '#5a6270', width: 14 }}>{i + 1}</span>
                  
                  <div style={{ flex: 1 }} onClick={() => setPointer(i)}>
                    <div style={{ fontSize: 14, fontWeight: rest ? 400 : 600, color: rest ? '#8b93a0' : '#e9ecef' }}>{d}</div>
                    {!rest && (
                      <div style={{ fontSize: 10.5, color: isToday ? '#8b93a0' : '#5a6270' }}>
                        {dayPresets.length > 0 ? (
                          <>
                            {dayPresets.map((p) => p.name).join(' · ')}
                            {dayPresets.length > 1 ? ' — rotating' : ''}
                          </>
                        ) : 'No presets'}
                      </div>
                    )}
                  </div>

                  <button onClick={() => setDays(days.filter((_, j) => j !== i))} style={{ color: '#5a6270', fontSize: 12, background: 'none', border: 'none', padding: '0 4px', cursor: 'pointer' }}>✕</button>

                  {isToday && (
                    <span style={{ fontFamily: MONO, fontSize: 9.5, color: '#0b0d10', background: '#c8f04b', borderRadius: 4, padding: '2px 6px', fontWeight: 600 }}>TODAY</span>
                  )}
                </div>
              )
            })}
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <input
              placeholder="＋ Add day"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const val = e.currentTarget.value.trim()
                  if (val) {
                    setDays([...days, val])
                    e.currentTarget.value = ''
                  }
                }
              }}
              style={{ flex: 1, border: '1px dashed rgba(255,255,255,.18)', borderRadius: 9, textAlign: 'center', padding: '9px 0', fontSize: 12, color: '#e9ecef', background: 'transparent', outline: 'none' }}
            />
            <button onClick={() => navigate('/presets')} style={{ flex: 1, border: '1px solid rgba(255,255,255,.12)', borderRadius: 9, textAlign: 'center', padding: '9px 0', fontSize: 12, color: '#8b93a0', background: 'none', cursor: 'pointer' }}>
              Edit presets
            </button>
          </div>

          <div style={{ marginTop: 16, background: '#14171c', border: '1px solid rgba(255,255,255,.08)', borderRadius: 11, padding: '13px 14px' }}>
            <div style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: '.12em', color: '#5a6270' }}>MISSED A DAY?</div>
            <div style={{ display: 'flex', gap: 8, marginTop: 9 }}>
              <div style={{ flex: 1, background: '#1b1f26', border: '1px solid rgba(200,240,75,.4)', borderRadius: 8, padding: '9px 11px' }}>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: '#c8f04b' }}>Shift</div>
                <div style={{ fontSize: 10.5, color: '#8b93a0', marginTop: 2 }}>Do it today, everything slides</div>
              </div>
              <div style={{ flex: 1, background: '#1b1f26', border: '1px solid rgba(255,255,255,.08)', borderRadius: 8, padding: '9px 11px' }}>
                <div style={{ fontSize: 12.5, fontWeight: 600 }}>Skip</div>
                <div style={{ fontSize: 10.5, color: '#8b93a0', marginTop: 2 }}>Mark missed, move on</div>
              </div>
            </div>
            <div style={{ fontSize: 10.5, color: '#5a6270', marginTop: 8 }}>Default: ask each time · adherence feeds the AI</div>
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 24 }}>
            <button onClick={() => setDays([])} style={{ flex: 1, border: '1px solid rgba(255,255,255,.12)', borderRadius: 9, textAlign: 'center', padding: '12px 0', fontSize: 14, color: '#8b93a0', background: 'none', cursor: 'pointer' }}>
              Start over
            </button>
            <button onClick={save} style={{ flex: 1, background: '#c8f04b', borderRadius: 9, textAlign: 'center', padding: '12px 0', fontSize: 14, fontWeight: 600, color: '#0b0d10', border: 'none', cursor: 'pointer' }}>
              Save cycle
            </button>
          </div>
        </>
      )}
      </div>
    </div>
  )
}
