import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { repo } from '../lib/repo'
import { parseSetsText } from '../lib/parse'
import { advance, currentDayLabel, todayStr } from '../lib/cycle'
import { uuid } from '../lib/workout'
import { setVolume } from '../lib/volume'
import { useStore, useUid } from '../store'
import type { Exercise, Workout } from '../types'
import { ExercisePicker } from '../components/ExercisePicker'

interface Row {
  exercise: Exercise
  text: string
}

const MONO = "'IBM Plex Mono',monospace"
const SANS = "'IBM Plex Sans',system-ui,sans-serif"

export function BulkEntry() {
  const { exercises, cycle } = useStore()
  const uid = useUid()
  const navigate = useNavigate()
  const [date, setDate] = useState(todayStr())
  const [time, setTime] = useState('18:30')
  const [lengthMin, setLengthMin] = useState('50')
  const [cycleDay, setCycleDay] = useState('')
  const [rows, setRows] = useState<Row[]>([])
  const [pickerOpen, setPickerOpen] = useState(false)
  const [error, setError] = useState('')

  const rowError = (text: string) => {
    if (!text.trim()) return null
    try {
      parseSetsText(text)
      return null
    } catch (e) {
      return (e as Error).message
    }
  }

  const summary = useMemo(() => {
    let sets = 0
    let vol = 0
    let exCount = 0
    for (const r of rows) {
      if (!r.text.trim() || rowError(r.text)) continue
      const parsed = parseSetsText(r.text)
      exCount++
      sets += parsed.filter((s) => s.type !== 'warmup').length
      vol += parsed.reduce((sum, s) => sum + setVolume(s), 0)
    }
    return { sets, vol, exCount }
  }, [rows])

  const save = async () => {
    try {
      const filled = rows.filter((r) => r.text.trim())
      if (!filled.length) throw new Error('Add at least one exercise with sets.')
      const startedAt = new Date(`${date}T${time || '12:00'}:00`).getTime()
      const mins = parseInt(lengthMin, 10) || 60
      const workout: Workout = {
        id: uuid(),
        status: 'completed',
        startedAt,
        completedAt: startedAt + mins * 60_000,
        ...(cycleDay ? { cycleDay } : {}),
        bulkEntered: true,
        exercises: filled.map((r) => ({
          exerciseId: r.exercise.id,
          sets: parseSetsText(r.text).map((s) => ({ ...s, completedAt: startedAt })),
        })),
      }
      await repo.saveWorkout(uid, workout)
      if (
        cycle &&
        cycleDay &&
        date === todayStr() &&
        currentDayLabel(cycle).toLowerCase() === cycleDay.toLowerCase()
      ) {
        await repo.saveCycle(uid, advance(cycle))
      }
      navigate(`/history/${workout.id}`, { replace: true })
    } catch (e) {
      setError((e as Error).message)
    }
  }

  const canSave = rows.some((r) => r.text.trim() && !rowError(r.text))

  const handleAppend = (i: number, token: string) => {
    setRows(rows.map((r, j) => {
      if (j !== i) return r
      const text = r.text
      const append = text.length > 0 && !text.endsWith(' ') && !text.endsWith(',') ? `, ${token}` : token
      return { ...r, text: text + append }
    }))
  }

  return (
    <div style={{ minHeight: '100%', background: '#0b0d10', color: '#e9ecef', fontFamily: SANS, boxSizing: 'border-box', padding: '62px 0 0', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 20px', borderBottom: '1px solid rgba(255,255,255,.08)' }}>
        <button onClick={() => navigate(-1)} style={{ fontSize: 13, color: '#8b93a0', background: 'none', border: 'none', padding: 0 }}>Cancel</button>
        <span style={{ fontWeight: 600, fontSize: 15 }}>Add past workout</span>
        <button onClick={save} disabled={!canSave} style={{ fontSize: 13, color: canSave ? '#c8f04b' : '#5a6270', fontWeight: 600, background: 'none', border: 'none', padding: 0 }}>Save</button>
      </div>

      <div style={{ padding: '14px 20px', flex: 1, overflow: 'auto' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ flex: 1.4, background: '#14171c', border: '1px solid rgba(255,255,255,.1)', borderRadius: 9, padding: '10px 12px' }}>
            <div style={{ fontSize: 9.5, color: '#5a6270', fontFamily: MONO }}>DATE</div>
            <input type="date" value={date} max={todayStr()} onChange={(e) => setDate(e.target.value)} style={{ fontFamily: MONO, fontSize: 14, marginTop: 2, background: 'transparent', border: 'none', color: '#fff', width: '100%', outline: 'none' }} />
          </div>
          <div style={{ flex: 1, background: '#14171c', border: '1px solid rgba(255,255,255,.1)', borderRadius: 9, padding: '10px 12px' }}>
            <div style={{ fontSize: 9.5, color: '#5a6270', fontFamily: MONO }}>TIME</div>
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} style={{ fontFamily: MONO, fontSize: 14, marginTop: 2, background: 'transparent', border: 'none', color: '#fff', width: '100%', outline: 'none' }} />
          </div>
          <div style={{ flex: 1, background: '#14171c', border: '1px solid rgba(255,255,255,.1)', borderRadius: 9, padding: '10px 12px' }}>
            <div style={{ fontSize: 9.5, color: '#5a6270', fontFamily: MONO }}>LENGTH</div>
            <div style={{ display: 'flex', alignItems: 'center', marginTop: 2 }}>
              <span style={{ fontFamily: MONO, fontSize: 14, color: '#8b93a0' }}>~</span>
              <input inputMode="numeric" value={lengthMin} onChange={(e) => setLengthMin(e.target.value)} style={{ fontFamily: MONO, fontSize: 14, background: 'transparent', border: 'none', color: '#fff', width: '100%', outline: 'none' }} />
              <span style={{ fontFamily: MONO, fontSize: 14, color: '#8b93a0' }}>m</span>
            </div>
          </div>
        </div>

        {cycle && (
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 11, color: '#8b93a0' }}>
              Which cycle day was this? <span style={{ color: '#5a6270' }}>(advances your cycle)</span>
            </div>
            <div style={{ display: 'flex', gap: 5, marginTop: 7, flexWrap: 'wrap' }}>
              {[...new Set(cycle.days.filter((d) => d.toLowerCase() !== 'rest'))].map((d) => {
                const active = cycleDay === d
                return (
                  <button
                    key={d}
                    onClick={() => setCycleDay(active ? '' : d)}
                    style={{
                      fontSize: 11.5, fontFamily: MONO, padding: '5px 10px', borderRadius: 6,
                      background: active ? '#c8f04b' : '#14171c',
                      border: active ? '1px solid transparent' : '1px solid rgba(255,255,255,.1)',
                      color: active ? '#0b0d10' : '#8b93a0',
                      fontWeight: active ? 600 : 400
                    }}
                  >
                    {d}
                  </button>
                )
              })}
              <button
                onClick={() => setCycleDay('')}
                style={{
                  fontSize: 11.5, fontFamily: MONO, padding: '5px 10px', borderRadius: 6,
                  background: !cycleDay ? '#c8f04b' : '#14171c',
                  border: !cycleDay ? '1px solid transparent' : '1px solid rgba(255,255,255,.1)',
                  color: !cycleDay ? '#0b0d10' : '#8b93a0',
                  fontWeight: !cycleDay ? 600 : 400
                }}
              >
                NONE
              </button>
            </div>
          </div>
        )}

        <div style={{ marginTop: 16 }}>
          {rows.map((row, i) => {
            const err = rowError(row.text)
            return (
              <div key={`${row.exercise.id}-${i}`} style={{ marginTop: i === 0 ? 0 : 8, background: '#14171c', border: '1px solid rgba(255,255,255,.08)', borderRadius: 11, padding: '12px 14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 600, fontSize: 14, color: '#c8f04b' }}>{row.exercise.name}</span>
                  <button onClick={() => setRows(rows.filter((_, j) => j !== i))} style={{ color: '#5a6270', fontSize: 13, background: 'none', border: 'none', padding: 0 }}>✕</button>
                </div>
                
                <div style={{ marginTop: 8, background: '#0b0d10', border: err ? '1px solid rgba(224,89,107,.4)' : row.text ? '1px solid rgba(200,240,75,.4)' : '1px solid rgba(255,255,255,.14)', borderRadius: 8, padding: '10px 12px' }}>
                  <input
                    placeholder="30x8, 30x8, 30x7, 26x8"
                    value={row.text}
                    onChange={(e) => setRows(rows.map((r, j) => (j === i ? { ...r, text: e.target.value } : r)))}
                    style={{ width: '100%', background: 'transparent', border: 'none', fontFamily: MONO, fontSize: 14, color: '#e9ecef', outline: 'none' }}
                  />
                </div>
                
                {err ? (
                  <div style={{ fontSize: 10, color: '#e0596b', marginTop: 5 }}>{err}</div>
                ) : (
                  <div style={{ fontSize: 10, color: '#5a6270', marginTop: 5 }}>
                    kg×reps per set · mid-set weight change: <span style={{ fontFamily: MONO, color: '#8b93a0' }}>30×8+22.5×4</span>
                  </div>
                )}
                
                <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                  <button onClick={() => handleAppend(i, '+')} style={{ fontSize: 11, color: '#c8f04b', border: '1px dashed rgba(200,240,75,.4)', borderRadius: 6, padding: '4px 9px', background: 'none', cursor: 'pointer' }}>
                    ＋ segment
                  </button>
                  <button onClick={() => handleAppend(i, 'w')} style={{ fontSize: 11, color: '#8b93a0', border: '1px solid rgba(255,255,255,.12)', borderRadius: 6, padding: '4px 9px', background: 'none', cursor: 'pointer' }}>
                    warm-up
                  </button>
                </div>
              </div>
            )
          })}
          
          <button onClick={() => setPickerOpen(true)} style={{ marginTop: 8, width: '100%', border: '1px dashed rgba(255,255,255,.18)', borderRadius: 11, padding: '11px 14px', textAlign: 'center', fontSize: 12.5, color: '#8b93a0', background: 'none', cursor: 'pointer' }}>
            ＋ Add exercise
          </button>
          
          {error && <div style={{ marginTop: 8, fontSize: 12, color: '#e0596b' }}>{error}</div>}

          {rows.length > 0 && (
            <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', fontFamily: MONO, fontSize: 11, color: '#5a6270', background: '#101318', borderRadius: 8, padding: '9px 12px' }}>
              <span>{summary.sets} SETS · {summary.exCount} EXERCISES</span>
              <span>VOL {Math.round(summary.vol).toLocaleString()} KG</span>
            </div>
          )}
          <div style={{ fontSize: 10.5, color: '#3d434c', marginTop: 8, textAlign: 'center', paddingBottom: 24 }}>
            Counts as full history — feeds e1RM graphs and AI context.
          </div>
        </div>
      </div>

      {pickerOpen && (
        <ExercisePicker
          onPick={(e) => {
            setRows([...rows, { exercise: exercises.get(e.id)!, text: '' }])
            setPickerOpen(false)
          }}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </div>
  )
}
