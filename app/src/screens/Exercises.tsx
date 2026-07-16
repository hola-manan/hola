import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { repo } from '../lib/repo'
import { rmSeries } from '../lib/rm'
import { lastSession } from '../lib/workout'
import { useStore, useUid } from '../store'
import type { Equipment, Exercise, MuscleGroup } from '../types'
import { Btn, Card, Chip, EmptyState, Eyebrow, Screen } from '../components/ui'
import { Sparkline } from '../components/Sparkline'

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
    // design: sorted by last used, unused after
    return [...list].sort(
      (a, b) => (stats.get(b.id)?.lastUsed ?? 0) - (stats.get(a.id)?.lastUsed ?? 0),
    )
  }, [exerciseList, q, muscle, stats])

  return (
    <Screen
      title="Library"
      action={
        <button className="text-[13px] font-medium text-lime active:opacity-70" onClick={() => setAdding(true)}>
          ＋ Custom
        </button>
      }
    >
      <input
        placeholder={`⌕ Search ${exerciseList.length} exercises…`}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="mb-3 h-11 w-full rounded-[10px] border border-white/8 bg-card px-3.5 text-[13.5px] outline-none placeholder:text-label focus:border-lime/40"
      />
      <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
        {muscle && (
          <Chip active onClick={() => setMuscle('')}>
            {muscle} ✕
          </Chip>
        )}
        {muscles
          .filter((m) => m !== muscle)
          .map((m) => (
            <Chip key={m} onClick={() => setMuscle(m)}>
              {m}
            </Chip>
          ))}
      </div>

      <Eyebrow className="mb-1">
        {muscle ? `${muscle.toUpperCase()} · ` : ''}
        {results.length} EXERCISES · SORTED BY LAST USED
      </Eyebrow>

      {results.map((e, i) => {
        const s = stats.get(e.id)
        return (
          <Link key={e.id} to={`/exercises/${e.id}`}>
            <div className={`flex items-center gap-3 py-2.5 ${i > 0 ? 'border-t border-white/6' : ''}`}>
              {e.images[0] ? (
                <img src={e.images[0]} alt="" loading="lazy" className="h-11 w-11 rounded-[8px] bg-white object-cover" />
              ) : (
                <div
                  className="grid h-11 w-11 place-items-center rounded-[8px] text-[11px] text-label"
                  style={{
                    background: 'repeating-linear-gradient(45deg,#1b1f26 0 4px,#14171c 4px 8px)',
                  }}
                >
                  ▶
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="truncate text-[14px] font-medium">
                  {e.name}
                  {e.isCustom && (
                    <span className="ml-2 rounded bg-lime/12 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.08em] text-lime">
                      custom
                    </span>
                  )}
                </div>
                <div className="truncate text-[11.5px] text-label">
                  {e.primaryMuscles.join(', ')} · {e.equipment}
                  {s?.lastUsed &&
                    ` · used ${new Date(s.lastUsed).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}`}
                </div>
              </div>
              <div className="flex flex-col items-end gap-0.5">
                {s && s.series.length >= 2 ? (
                  <>
                    <Sparkline values={s.series} />
                    <span className="font-mono text-[10px] text-muted">e1RM {s.e1rm!.toFixed(1)}</span>
                  </>
                ) : (
                  <span className="font-mono text-[10px] text-faint">
                    {s?.lastUsed ? `e1RM ${s.e1rm?.toFixed(1) ?? '—'}` : 'no data'}
                  </span>
                )}
              </div>
            </div>
          </Link>
        )
      })}
      {!results.length && <EmptyState>No exercises match.</EmptyState>}

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
    </Screen>
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
    <div className="fixed inset-0 z-30 grid place-items-center bg-black/70 p-6">
      <Card className="max-h-[85dvh] w-full overflow-y-auto">
        <h2 className="mb-3 font-condensed text-xl font-bold">Custom exercise</h2>
        <input
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mb-3 h-11 w-full rounded-[9px] border border-white/10 bg-chip px-3 text-[13.5px]"
        />
        <Eyebrow className="mb-1.5">PRIMARY MUSCLES</Eyebrow>
        <div className="mb-3 flex flex-wrap gap-1.5">
          {muscles.map((m) => (
            <Chip
              key={m}
              active={selected.includes(m)}
              onClick={() => setSelected((s) => (s.includes(m) ? s.filter((x) => x !== m) : [...s, m]))}
            >
              {m}
            </Chip>
          ))}
        </div>
        <Eyebrow className="mb-1.5">EQUIPMENT</Eyebrow>
        <div className="mb-4 flex flex-wrap gap-1.5">
          {equipments.map((eq) => (
            <Chip key={eq} active={equipment === eq} onClick={() => setEquipment(eq)}>
              {eq}
            </Chip>
          ))}
        </div>
        <div className="flex gap-2">
          <Btn variant="ghost" className="flex-1" onClick={onCancel}>
            Cancel
          </Btn>
          <Btn
            className="flex-1"
            disabled={!name.trim() || !selected.length}
            onClick={() => onAdd(name.trim(), selected as MuscleGroup[], equipment)}
          >
            Add
          </Btn>
        </div>
      </Card>
    </div>
  )
}
