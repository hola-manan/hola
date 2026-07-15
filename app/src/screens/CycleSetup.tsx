import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { repo } from '../lib/repo'
import { todayStr } from '../lib/cycle'
import { useStore, useUid } from '../store'
import { Btn, Card, Screen } from '../components/ui'

const TEMPLATES: { name: string; days: string[] }[] = [
  { name: 'Push / Pull / Legs / Rest', days: ['Push', 'Pull', 'Legs', 'Rest'] },
  {
    name: 'PPL + Upper / Lower',
    days: ['Push', 'Pull', 'Legs', 'Rest', 'Upper', 'Lower', 'Rest'],
  },
  { name: 'Upper / Lower', days: ['Upper', 'Lower', 'Rest'] },
  { name: 'Full body every other day', days: ['Full Body', 'Rest'] },
]

export function CycleSetup() {
  const { cycle } = useStore()
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

  return (
    <Screen title="Training cycle">
      <p className="mb-4 text-sm text-ink-dim">
        Define your repeating split once. The app tracks where you are, advances when you complete
        a workout, and auto-skips rest days at midnight.
      </p>

      {!days.length && (
        <>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-ink-dim">
            Start from a template
          </h2>
          {TEMPLATES.map((t) => (
            <Card key={t.name} className="mb-2">
              <button className="w-full text-left" onClick={() => setDays(t.days)}>
                <div className="font-medium">{t.name}</div>
                <div className="text-xs text-ink-dim">{t.days.join(' → ')}</div>
              </button>
            </Card>
          ))}
        </>
      )}

      {days.length > 0 && (
        <Card className="mb-3">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-ink-dim">
            Your cycle — tap a day to mark it as “today”
          </h2>
          {days.map((d, i) => (
            <div key={`${d}-${i}`} className="mb-1 flex items-center gap-2">
              <button
                onClick={() => setPointer(i)}
                className={`flex-1 rounded-xl px-3 py-2.5 text-left ${
                  pointer === i ? 'bg-accent font-semibold text-accent-ink' : 'bg-surface-2'
                }`}
              >
                {i + 1}. {d}
                {pointer === i && ' ← today'}
              </button>
              <button
                className="px-1 text-ink-dim"
                onClick={() => {
                  setDays(days.filter((_, j) => j !== i))
                  if (pointer >= i && pointer > 0) setPointer(pointer - 1)
                }}
                aria-label={`remove ${d}`}
              >
                ✕
              </button>
            </div>
          ))}
          <div className="mt-2 flex gap-2">
            <input
              placeholder="Add day (e.g. Arms, Rest)"
              value={newDay}
              onChange={(e) => setNewDay(e.target.value)}
              className="h-11 flex-1 rounded-xl bg-surface-2 px-3"
            />
            <Btn
              variant="ghost"
              disabled={!newDay.trim()}
              onClick={() => {
                setDays([...days, newDay.trim()])
                setNewDay('')
              }}
            >
              Add
            </Btn>
          </div>
        </Card>
      )}

      <div className="flex gap-2">
        {days.length > 0 && (
          <Btn variant="ghost" onClick={() => setDays([])}>
            Start over
          </Btn>
        )}
        <Btn className="flex-1 py-3" disabled={!days.length} onClick={save}>
          Save cycle
        </Btn>
      </div>
    </Screen>
  )
}
