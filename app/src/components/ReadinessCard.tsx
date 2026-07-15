import { useState } from 'react'
import { repo } from '../lib/repo'
import { todayStr } from '../lib/cycle'
import { useStore, useUid } from '../store'
import { Btn, Card } from './ui'

const scale = (label: string, value: number, onPick: (v: number) => void) => (
  <div className="flex items-center justify-between gap-2">
    <span className="w-14 text-xs text-ink-dim">{label}</span>
    <div className="flex flex-1 justify-between gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          onClick={() => onPick(n)}
          className={`h-10 flex-1 rounded-lg text-sm ${
            value === n ? 'bg-accent font-semibold text-accent-ink' : 'bg-surface-2 text-ink-dim'
          }`}
        >
          {n}
        </button>
      ))}
    </div>
  </div>
)

/** 20-second daily check-in feeding the AI's recovery context (spec phase 6 fallback). */
export function ReadinessCard() {
  const { readinessToday } = useStore()
  const uid = useUid()
  const [sleep, setSleep] = useState(0)
  const [energy, setEnergy] = useState(0)
  const [dismissed, setDismissed] = useState(false)

  if (readinessToday || dismissed) return null

  return (
    <Card className="mb-4">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-dim">
          Morning check-in
        </h2>
        <button className="text-xs text-ink-dim" onClick={() => setDismissed(true)}>
          skip
        </button>
      </div>
      <div className="flex flex-col gap-2">
        {scale('Sleep', sleep, setSleep)}
        {scale('Energy', energy, setEnergy)}
      </div>
      <Btn
        className="mt-3 w-full"
        disabled={!sleep || !energy}
        onClick={() => repo.saveReadiness(uid, { date: todayStr(), sleep, energy })}
      >
        Save — the coach factors this in
      </Btn>
    </Card>
  )
}
