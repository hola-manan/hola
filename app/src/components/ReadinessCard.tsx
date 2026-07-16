import { useState } from 'react'
import { repo } from '../lib/repo'
import { todayStr } from '../lib/cycle'
import { useStore, useUid } from '../store'
import { Btn, Card, Eyebrow } from './ui'

const scale = (label: string, value: number, onPick: (v: number) => void) => (
  <div className="flex items-center justify-between gap-2">
    <span className="w-14 font-mono text-[10px] uppercase tracking-[0.12em] text-label">{label}</span>
    <div className="flex flex-1 justify-between gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          onClick={() => onPick(n)}
          className={`h-10 flex-1 rounded-md font-mono text-sm ${
            value === n ? 'bg-lime font-semibold text-on-lime' : 'bg-chip text-muted'
          }`}
        >
          {n}
        </button>
      ))}
    </div>
  </div>
)

/** Daily readiness: filled → 1a's stat layout; unfilled → the 20-second check-in. */
export function ReadinessCard() {
  const { readinessToday } = useStore()
  const uid = useUid()
  const [sleep, setSleep] = useState(0)
  const [energy, setEnergy] = useState(0)
  const [dismissed, setDismissed] = useState(false)

  if (readinessToday) {
    const r = readinessToday
    const low = r.sleep + r.energy <= 4
    const stat = (value: string, label: string, warn: boolean) => (
      <div className="flex-1 border-l border-white/7 px-3 first:border-l-0 first:pl-0">
        <div className={`font-mono text-[17px] font-medium ${warn ? 'text-warn' : 'text-ink'}`}>{value}</div>
        <div className="mt-0.5 font-mono text-[9.5px] uppercase tracking-[0.12em] text-label">{label}</div>
      </div>
    )
    return (
      <Card>
        <div className="mb-2.5 flex items-center justify-between">
          <Eyebrow>DAILY READINESS · CHECK-IN</Eyebrow>
          <span className="font-mono text-[10px] text-faint">{r.date.slice(5)}</span>
        </div>
        <div className="flex">
          {stat(`${r.sleep}/5`, 'Sleep', r.sleep <= 2)}
          {stat(`${r.energy}/5`, 'Energy', r.energy <= 2)}
          {stat(low ? 'TRIM' : 'FULL', 'Intensity', low)}
        </div>
        {low && (
          <p className="mt-2.5 text-[11.5px] text-warn">
            Low readiness — the creator will trim intensity ~12% today.
          </p>
        )}
      </Card>
    )
  }

  if (dismissed) return null

  return (
    <Card>
      <div className="mb-2.5 flex items-center justify-between">
        <Eyebrow>MORNING CHECK-IN · 20 SEC</Eyebrow>
        <button className="font-mono text-[10px] uppercase tracking-[0.1em] text-faint" onClick={() => setDismissed(true)}>
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
