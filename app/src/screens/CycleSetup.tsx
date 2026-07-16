import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { repo } from '../lib/repo'
import { todayStr } from '../lib/cycle'
import { useStore, useUid } from '../store'
import { isRestDay } from '../types'
import { Btn, Card, Eyebrow, Screen } from '../components/ui'

const TEMPLATES: { name: string; days: string[] }[] = [
  { name: 'Push / Pull / Legs / Rest', days: ['Push', 'Pull', 'Legs', 'Rest'] },
  { name: 'PPL + Upper / Lower', days: ['Push', 'Pull', 'Legs', 'Rest', 'Upper', 'Lower', 'Rest'] },
  { name: 'Upper / Lower', days: ['Upper', 'Lower', 'Rest'] },
  { name: 'Full body every other day', days: ['Full Body', 'Rest'] },
]

export function CycleSetup() {
  const { cycle, presets } = useStore()
  const uid = useUid()
  const navigate = useNavigate()
  const [days, setDays] = useState<string[]>(cycle?.days ?? [])
  const [pointer, setPointer] = useState(cycle?.pointer ?? 0)
  const [newDay, setNewDay] = useState('')

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
    <Screen title="Cycle">
      <p className="-mt-2 mb-4 text-[12.5px] text-muted">
        {days.length ? `${days.length}-day rotation` : 'Define your rotation'} · rest days
        auto-advance at midnight
      </p>

      {!days.length && (
        <>
          <Eyebrow className="mb-2">START FROM A TEMPLATE</Eyebrow>
          {TEMPLATES.map((t) => (
            <Card key={t.name} className="mb-2">
              <button className="w-full text-left" onClick={() => setDays(t.days)}>
                <div className="text-[13.5px] font-medium">{t.name}</div>
                <div className="mt-0.5 font-mono text-[10.5px] uppercase tracking-[0.06em] text-label">
                  {t.days.join(' → ')}
                </div>
              </button>
            </Card>
          ))}
        </>
      )}

      {days.length > 0 && (
        <>
          <Eyebrow className="mb-2">TAP A DAY TO MARK IT AS TODAY</Eyebrow>
          {days.map((d, i) => {
            const isToday = pointer === i
            const rest = isRestDay(d)
            const dayPresets = presetsFor(d)
            return (
              <div key={`${d}-${i}`} className="mb-1.5 flex items-center gap-1.5">
                <div className="flex flex-col text-faint">
                  <button className="px-1 leading-none" aria-label="move up" onClick={() => move(i, -1)}>
                    ▴
                  </button>
                  <button className="px-1 leading-none" aria-label="move down" onClick={() => move(i, 1)}>
                    ▾
                  </button>
                </div>
                <button
                  onClick={() => setPointer(i)}
                  className={`flex flex-1 items-center gap-3 rounded-[10px] px-3 py-2.5 text-left ${
                    isToday
                      ? 'border border-lime/45 bg-lime/6'
                      : rest
                        ? 'border border-dashed border-white/12 bg-sunken'
                        : 'border border-white/8 bg-card'
                  }`}
                >
                  <span className={`font-mono text-[12px] ${isToday ? 'text-lime' : 'text-label'}`}>
                    {i + 1}
                  </span>
                  <span className="flex-1">
                    <span className={`block text-[13.5px] font-medium ${rest ? 'text-muted' : ''}`}>{d}</span>
                    {dayPresets.length > 0 && (
                      <span className="block font-mono text-[10px] uppercase tracking-[0.06em] text-label">
                        {dayPresets.map((p) => p.name).join(' · ')}
                        {dayPresets.length > 1 ? ' — rotating' : ''}
                      </span>
                    )}
                  </span>
                  {isToday && (
                    <span className="rounded bg-lime px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-[0.08em] text-on-lime">
                      today
                    </span>
                  )}
                </button>
                <button
                  className="px-1.5 text-faint"
                  onClick={() => {
                    setDays(days.filter((_, j) => j !== i))
                    if (pointer >= i && pointer > 0) setPointer(pointer - 1)
                  }}
                  aria-label={`remove ${d}`}
                >
                  ✕
                </button>
              </div>
            )
          })}

          <div className="mt-2 flex gap-2">
            <input
              placeholder="Add day (e.g. Arms, Rest)"
              value={newDay}
              onChange={(e) => setNewDay(e.target.value)}
              className="h-11 flex-1 rounded-[10px] border border-dashed border-white/18 bg-transparent px-3 text-[13px] outline-none placeholder:text-label"
            />
            <Btn
              variant="ghost"
              disabled={!newDay.trim()}
              onClick={() => {
                setDays([...days, newDay.trim()])
                setNewDay('')
              }}
            >
              ＋ Add
            </Btn>
          </div>

          <Card className="mt-4">
            <Eyebrow className="mb-2">MISSED A DAY?</Eyebrow>
            <div className="flex gap-2">
              <div className="flex-1 rounded-[9px] border border-lime/40 p-2.5">
                <div className="text-[12.5px] font-medium">Shift</div>
                <div className="text-[11px] text-label">Do it today, everything slides</div>
              </div>
              <div className="flex-1 rounded-[9px] border border-white/12 p-2.5">
                <div className="text-[12.5px] font-medium">Skip</div>
                <div className="text-[11px] text-label">Mark missed, move on</div>
              </div>
            </div>
            <p className="mt-2 font-mono text-[8.5px] uppercase tracking-[0.1em] text-faint">
              Default: ask each time · adherence feeds the AI
            </p>
          </Card>
        </>
      )}

      <div className="mb-6 mt-4 flex gap-2">
        {days.length > 0 && (
          <>
            <Btn variant="ghost" onClick={() => setDays([])}>
              Start over
            </Btn>
            <Btn variant="ghost" onClick={() => navigate('/presets')}>
              Edit presets
            </Btn>
          </>
        )}
        <Btn className="flex-1 py-3" disabled={!days.length} onClick={save}>
          Save cycle
        </Btn>
      </div>
    </Screen>
  )
}
