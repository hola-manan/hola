import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { repo } from '../lib/repo'
import { rmSeries } from '../lib/rm'
import { lastSession } from '../lib/workout'
import { useStore, useUid } from '../store'
import type { Equipment, Exercise, MuscleGroup } from '../types'
import { Sparkline } from '../components/Sparkline'

const MONO = "'IBM Plex Mono',monospace"
const CONDENSED = "'IBM Plex Sans Condensed',sans-serif"
const SANS = "'IBM Plex Sans',system-ui,sans-serif"

export function Exercises() {
  const { exerciseList, workouts } = useStore()
  const uid = useUid()
  const [q, setQ] = useState('')
  const [muscle, setMuscle] = useState('')
  const [adding, setAdding] = useState(false)

  const completed = useMemo(() => workouts.filter((w) => w.status === 'completed'), [workouts])

  const muscles = useMemo(
    () => [...new Set(exerciseList.flatMap((e) => e.primaryMuscles))].sort(),
    [exerciseList],
  )

  const stats = useMemo(() => {
    const map = new Map<string, { series: number[]; e1rm: number | null; lastUsed: number | null }>()
    for (const e of exerciseList) {
      const series = rmSeries(completed, e.id)
      const last = lastSession(completed, e.id)
      map.set(e.id, {
        series: series.slice(-10).map((p) => p.e1rm),
        e1rm: series.length ? series[series.length - 1].e1rm : null,
        lastUsed: last ? last.workout.startedAt : null,
      })
    }
    return map
  }, [exerciseList, completed])

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase()
    const list = exerciseList.filter(
      (e) =>
        (!needle || e.name.toLowerCase().includes(needle)) &&
        (!muscle || e.primaryMuscles.includes(muscle as MuscleGroup)),
    )
    return [...list].sort(
      (a, b) => (stats.get(b.id)?.lastUsed ?? 0) - (stats.get(a.id)?.lastUsed ?? 0),
    )
  }, [exerciseList, q, muscle, stats])

  return (
    <div style={{ minHeight: '100%', background: '#0b0d10', color: '#e9ecef', fontFamily: SANS, boxSizing: 'border-box', padding: '72px 20px 30px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div style={{ fontFamily: CONDENSED, fontWeight: 700, fontSize: 32 }}>Library</div>
        <button onClick={() => setAdding(true)} style={{ fontSize: 12, color: '#c8f04b', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          ＋ Custom
        </button>
      </div>

      <input
        placeholder={`⌕ Search ${exerciseList.length} exercises…`}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        style={{
          marginTop: 12, width: '100%', background: '#14171c', border: '1px solid rgba(255,255,255,.1)',
          borderRadius: 10, padding: '11px 14px', fontSize: 13.5, color: '#e9ecef', boxSizing: 'border-box'
        }}
      />

      <div style={{ display: 'flex', gap: 6, marginTop: 10, overflowX: 'auto', paddingBottom: 4 }}>
        {muscle && (
          <button
            onClick={() => setMuscle('')}
            style={{ fontSize: 12, padding: '6px 12px', borderRadius: 7, background: '#c8f04b', color: '#0b0d10', fontWeight: 600, border: 'none', whiteSpace: 'nowrap' }}
          >
            {muscle} ✕
          </button>
        )}
        {!muscle && (
          <span style={{ fontSize: 12, padding: '6px 12px', borderRadius: 7, background: '#14171c', border: '1px solid rgba(255,255,255,.1)', color: '#8b93a0' }}>
            Muscle ▾
          </span>
        )}
        {muscles.filter(m => m !== muscle).map(m => (
          <button
            key={m}
            onClick={() => setMuscle(m)}
            style={{ fontSize: 12, padding: '6px 12px', borderRadius: 7, background: '#14171c', border: '1px solid rgba(255,255,255,.1)', color: '#8b93a0', whiteSpace: 'nowrap', cursor: 'pointer' }}
          >
            {m}
          </button>
        ))}
      </div>

      <div style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: '.12em', color: '#5a6270', marginTop: 16 }}>
        {muscle ? `${muscle.toUpperCase()} · ` : ''}{results.length} EXERCISES · SORTED BY LAST USED
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', marginTop: 8 }}>
        {results.map((e, i) => {
          const s = stats.get(e.id)
          return (
            <Link key={e.id} to={`/exercises/${e.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 0', borderBottom: i < results.length - 1 ? '1px solid rgba(255,255,255,.06)' : 'none' }}>
                
                {e.images[0] ? (
                  <img src={e.images[0]} alt="" loading="lazy" style={{ width: 44, height: 44, borderRadius: 9, backgroundColor: '#fff', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: 44, height: 44, borderRadius: 9, background: 'repeating-linear-gradient(45deg,#1b1f26,#1b1f26 4px,#14171c 4px,#14171c 8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#5a6270' }}>
                    ▶
                  </div>
                )}
                
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {e.name}
                    {e.isCustom && (
                      <span style={{ fontFamily: MONO, fontSize: 8.5, color: '#c8f04b', border: '1px solid rgba(200,240,75,.4)', borderRadius: 4, padding: '1px 4px', marginLeft: 4 }}>
                        CUSTOM
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: '#5a6270', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {e.primaryMuscles.join(', ')} · {e.equipment}
                    {s?.lastUsed && ` · used ${new Date(s.lastUsed).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}`}
                    {!s?.lastUsed && ` · never used`}
                  </div>
                </div>

                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                  {s && s.series.length >= 2 ? (
                    <>
                      <Sparkline values={s.series} />
                      <div style={{ fontFamily: MONO, fontSize: 10.5, color: '#8b93a0' }}>e1RM {s.e1rm!.toFixed(1)}</div>
                    </>
                  ) : (
                    <div style={{ fontFamily: MONO, fontSize: 10.5, color: '#3d434c', marginTop: 'auto' }}>
                      {s?.lastUsed && s.e1rm ? `e1RM ${s.e1rm.toFixed(1)}` : 'no data'}
                    </div>
                  )}
                </div>
              </div>
            </Link>
          )
        })}
        {!results.length && <div style={{ marginTop: 20, textAlign: 'center', fontSize: 13, color: '#5a6270' }}>No exercises match.</div>}
      </div>

      {adding && (
        <AddCustom
          onCancel={() => setAdding(false)}
          muscles={muscles}
          onAdd={async (name, muscleGroups, equipment) => {
            await repo.saveCustomExercise(uid, {
              id: `custom-${crypto.randomUUID()}`,
              name,
              primaryMuscles: muscleGroups,
              secondaryMuscles: [],
              equipment,
              instructions: [],
              images: [],
              isCustom: true,
            } satisfies Exercise)
            setAdding(false)
          }}
        />
      )}
    </div>
  )
}

function AddCustom({
  onCancel,
  onAdd,
  muscles,
}: {
  onCancel: () => void
  onAdd: (name: string, muscles: MuscleGroup[], equipment: Equipment) => void
  muscles: string[]
}) {
  const [name, setName] = useState('')
  const [selected, setSelected] = useState<string[]>([])
  const [equipment, setEquipment] = useState<Equipment>('machine')
  const equipments: Equipment[] = ['barbell', 'dumbbell', 'machine', 'cable', 'bodyweight', 'kettlebell', 'ez bar', 'band', 'other']

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 30, display: 'grid', placeItems: 'center', background: 'rgba(0,0,0,0.8)', padding: 24 }}>
      <div style={{ background: '#14171c', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 20, width: '100%', maxHeight: '85dvh', overflowY: 'auto' }}>
        <h2 style={{ fontFamily: CONDENSED, fontSize: 20, fontWeight: 700, margin: '0 0 12px' }}>Custom exercise</h2>
        <input
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ marginBottom: 12, height: 44, width: '100%', borderRadius: 9, border: '1px solid rgba(255,255,255,0.1)', background: '#1b1f26', padding: '0 12px', fontSize: 13.5, color: '#fff', boxSizing: 'border-box' }}
        />
        
        <div style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: '.12em', color: '#5a6270', marginBottom: 6 }}>PRIMARY MUSCLES</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
          {muscles.map((m) => (
            <button
              key={m}
              onClick={() => setSelected((s) => (s.includes(m) ? s.filter((x) => x !== m) : [...s, m]))}
              style={{ fontSize: 11.5, padding: '5px 10px', borderRadius: 6, background: selected.includes(m) ? 'rgba(99,208,138,.12)' : 'rgba(139,147,160,.12)', color: selected.includes(m) ? '#63d08a' : '#8b93a0', border: 'none', cursor: 'pointer' }}
            >
              {m}
            </button>
          ))}
        </div>

        <div style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: '.12em', color: '#5a6270', marginBottom: 6 }}>EQUIPMENT</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 24 }}>
          {equipments.map((eq) => (
            <button
              key={eq}
              onClick={() => setEquipment(eq)}
              style={{ fontSize: 11.5, padding: '5px 10px', borderRadius: 6, background: equipment === eq ? 'rgba(99,208,138,.12)' : 'rgba(139,147,160,.12)', color: equipment === eq ? '#63d08a' : '#8b93a0', border: 'none', cursor: 'pointer' }}
            >
              {eq}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onCancel} style={{ flex: 1, padding: '10px 0', fontSize: 13.5, background: 'none', border: '1px solid rgba(255,255,255,.14)', color: '#8b93a0', borderRadius: 8 }}>
            Cancel
          </button>
          <button
            disabled={!name.trim() || !selected.length}
            onClick={() => onAdd(name.trim(), selected as MuscleGroup[], equipment)}
            style={{ flex: 1, padding: '10px 0', fontSize: 13.5, background: (!name.trim() || !selected.length) ? 'rgba(255,255,255,0.1)' : '#c8f04b', color: (!name.trim() || !selected.length) ? '#5a6270' : '#000', border: 'none', borderRadius: 8, fontWeight: 600 }}
          >
            Add
          </button>
        </div>
      </div>
    </div>
  )
}
