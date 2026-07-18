import { useEffect, useState, type CSSProperties } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { repo } from '../lib/repo'
import { uuid } from '../lib/workout'
import { useStore, useUid } from '../store'
import type { Preset, PresetExercise } from '../types'
import { ExercisePicker } from '../components/ExercisePicker'

const MONO = "'IBM Plex Mono',monospace"
const CONDENSED = "'IBM Plex Sans Condensed',sans-serif"
const SANS = "'IBM Plex Sans',system-ui,sans-serif"

const inputCellStyle: CSSProperties = {
  height: 32,
  borderRadius: 7,
  background: '#0b0d10',
  border: '1px solid rgba(255,255,255,.18)',
  textAlign: 'center',
  fontFamily: MONO,
  fontSize: 14,
  color: '#fff',
  width: '100%',
  outline: 'none',
  padding: 0,
}

export function PresetEdit() {
  const { id } = useParams()
  const { presets, exercises, cycle } = useStore()
  const uid = useUid()
  const navigate = useNavigate()
  const existing = id !== 'new' ? presets.find((p) => p.id === id) : undefined

  const [name, setName] = useState(existing?.name ?? '')
  const [cycleDay, setCycleDay] = useState(existing?.cycleDay ?? '')
  const [items, setItems] = useState<PresetExercise[]>(existing?.exercises ?? [])
  const [pickerOpen, setPickerOpen] = useState(false)
  const [loaded, setLoaded] = useState(Boolean(existing) || id === 'new')

  useEffect(() => {
    if (!loaded && existing) {
      setName(existing.name)
      setCycleDay(existing.cycleDay ?? '')
      setItems(existing.exercises)
      setLoaded(true)
    }
  }, [existing, loaded])

  const save = async () => {
    const now = Date.now()
    const preset: Preset = {
      id: existing?.id ?? uuid(),
      name: name.trim(),
      ...(cycleDay ? { cycleDay } : {}),
      exercises: items,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    }
    await repo.savePreset(uid, preset)
    navigate('/presets')
  }

  const remove = async () => {
    if (!existing || !confirm(`Delete preset "${existing.name}"?`)) return
    await repo.deletePreset(uid, existing.id)
    navigate('/presets')
  }

  const updateItem = (i: number, item: PresetExercise) =>
    setItems(items.map((x, j) => (j === i ? item : x)))

  const cycleDays = cycle ? [...new Set(cycle.days.filter((d) => d.toLowerCase() !== 'rest'))] : []

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', paddingTop: 18, boxSizing: 'border-box' }}>
      <div style={{ padding: '10px 20px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '.14em', color: '#c8f04b' }}>
              {existing ? 'EDIT PRESET' : 'NEW PRESET'}
            </div>
            <div style={{ fontFamily: CONDENSED, fontWeight: 700, fontSize: 30, marginTop: 4 }}>
              {existing ? 'Edit Preset' : 'New Preset'}
            </div>
          </div>
          {existing && (
            <button
              onClick={remove}
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                border: '1px solid rgba(224,89,107,.4)',
                background: 'rgba(224,89,107,.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#e0596b',
                fontSize: 14,
              }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div style={{ padding: '0 20px', flex: 1, minHeight: 0, overflowY: 'auto' }}>
        <div style={{ marginTop: 20, background: '#14171c', border: '1px solid rgba(255,255,255,.08)', borderRadius: 12, padding: 14 }}>
          <input
            placeholder="Preset name (e.g. Push A)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ ...inputCellStyle, height: 44, fontSize: 16, textAlign: 'left', padding: '0 12px', background: '#0b0d10' }}
          />
          {cycleDays.length > 0 && (
            <>
              <div style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: '.12em', color: '#5a6270', marginTop: 14, marginBottom: 8 }}>
                CYCLE DAY
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {cycleDays.map((d) => {
                  const active = cycleDay === d
                  return (
                    <button
                      key={d}
                      onClick={() => setCycleDay(cycleDay === d ? '' : d)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 8,
                        fontSize: 13,
                        fontFamily: SANS,
                        background: active ? '#c8f04b' : '#1b1f26',
                        color: active ? '#0b0d10' : '#8b93a0',
                        fontWeight: active ? 600 : 400,
                        border: 'none',
                      }}
                    >
                      {d}
                    </button>
                  )
                })}
              </div>
            </>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
          {items.map((item, i) => (
            <div key={`${item.exerciseId}-${i}`} style={{ background: '#14171c', border: '1px solid rgba(255,255,255,.08)', borderRadius: 11, padding: '12px 14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontWeight: 600, fontSize: 14 }}>{exercises.get(item.exerciseId)?.name ?? item.exerciseId}</span>
                <button
                  onClick={() => setItems(items.filter((_, j) => j !== i))}
                  style={{ background: 'none', border: 'none', color: '#e0596b', padding: 0, fontSize: 13 }}
                >
                  ✕
                </button>
              </div>
              
              {item.sets.map((s, si) => (
                <div key={si} style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: si ? 6 : 0 }}>
                  <span style={{ width: 16, fontFamily: MONO, fontSize: 11, color: '#5a6270' }}>{si + 1}</span>
                  <input
                    inputMode="decimal"
                    aria-label="kg"
                    value={s.weightKg ?? ''}
                    placeholder="last"
                    onChange={(ev) =>
                      updateItem(i, {
                        ...item,
                        sets: item.sets.map((x, xi) => (xi === si ? { ...x, weightKg: parseFloat(ev.target.value) || null } : x)),
                      })
                    }
                    style={{ ...inputCellStyle, width: 58, height: 30, fontSize: 13 }}
                  />
                  <span style={{ fontFamily: MONO, fontSize: 10, color: '#5a6270' }}>KG ×</span>
                  <input
                    inputMode="numeric"
                    aria-label="reps"
                    value={s.reps}
                    onChange={(ev) =>
                      updateItem(i, {
                        ...item,
                        sets: item.sets.map((x, xi) => (xi === si ? { ...x, reps: parseInt(ev.target.value, 10) || 1 } : x)),
                      })
                    }
                    style={{ ...inputCellStyle, width: 48, height: 30, fontSize: 13 }}
                  />
                  <button
                    aria-label="remove set"
                    onClick={() => updateItem(i, { ...item, sets: item.sets.filter((_, xi) => xi !== si) })}
                    style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#5a6270', fontSize: 12 }}
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button
                onClick={() =>
                  updateItem(i, {
                    ...item,
                    sets: [...item.sets, item.sets[item.sets.length - 1] ?? { weightKg: null, reps: 8 }],
                  })
                }
                style={{ marginTop: 12, width: '100%', border: '1px dashed rgba(255,255,255,.18)', borderRadius: 7, padding: '7px 0', fontSize: 12, color: '#8b93a0', background: 'none' }}
              >
                ＋ Add set
              </button>
            </div>
          ))}

          <button
            onClick={() => setPickerOpen(true)}
            style={{
              border: '1px dashed rgba(255,255,255,.18)',
              borderRadius: 11,
              padding: '10px 14px',
              textAlign: 'center',
              fontSize: 12.5,
              color: '#8b93a0',
              background: 'none',
              marginTop: 4,
            }}
          >
            ＋ Add exercise
          </button>
        </div>
      </div>

      <div
        style={{
          background: '#101318',
          borderTop: '1px solid rgba(255,255,255,.08)',
          padding: '12px 16px',
        }}
      >
        <button
          disabled={!name.trim() || !items.length}
          onClick={save}
          style={{
            width: '100%',
            background: '#c8f04b',
            color: '#0b0d10',
            borderRadius: 10,
            textAlign: 'center',
            padding: '13px 0',
            fontWeight: 600,
            fontSize: 15,
            border: 'none',
            opacity: (!name.trim() || !items.length) ? 0.4 : 1,
          }}
        >
          Save preset
        </button>
      </div>

      {pickerOpen && (
        <ExercisePicker
          onPick={(e) => {
            setItems([
              ...items,
              { exerciseId: e.id, sets: [{ weightKg: null, reps: 8 }, { weightKg: null, reps: 8 }, { weightKg: null, reps: 8 }] },
            ])
            setPickerOpen(false)
          }}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </div>
  )
}

