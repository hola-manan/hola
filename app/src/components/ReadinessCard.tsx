import { useState } from 'react'
import { repo } from '../lib/repo'
import { todayStr } from '../lib/cycle'
import { useStore, useUid } from '../store'

import { isLowReadiness, sleepScoreTo5, formatSleepDuration, rhrElevated } from '../lib/readinessRule'

/* Readiness card matching 1a's geometry: filled = 17px mono stat columns with
   14px left-padded dividers + amber footer note; unfilled = the 20s check-in. */

const MONO = "'IBM Plex Mono',monospace"
const cardStyle = {
  padding: '12px 14px',
  background: '#14171c',
  border: '1px solid rgba(255,255,255,.08)',
  borderRadius: 10,
} as const

export function ReadinessCard() {
  const { readinessToday } = useStore()
  const uid = useUid()
  const [sleep, setSleep] = useState(0)
  const [energy, setEnergy] = useState(0)
  const [dismissed, setDismissed] = useState(false)

  const r = readinessToday
  const hasWatch = !!r?.watch
  const hasEnergy = typeof r?.energy === 'number'

  if (r && (hasEnergy || (!hasWatch && typeof r.sleep === 'number'))) {
    const low = isLowReadiness(r)
    const slp = sleepScoreTo5(r) ?? '-'
    const slpColor = typeof slp === 'number' && slp <= 2 ? '#e8b44c' : (hasWatch ? '#57c4cc' : '#e9ecef')
    
    const col = (value: string, label: string, color: string, first = false) => (
      <div
        style={{
          flex: 1,
          borderLeft: first ? 'none' : '1px solid rgba(255,255,255,.07)',
          paddingLeft: first ? 0 : 14,
        }}
      >
        <div style={{ fontFamily: MONO, fontSize: 17, color }}>{value}</div>
        <div style={{ fontSize: 10, color: '#5a6270', marginTop: 1 }}>{label}</div>
      </div>
    )
    return (
      <div style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: '.12em', color: '#5a6270' }}>
            DAILY READINESS · CHECK-IN
          </span>
          <span style={{ fontFamily: MONO, fontSize: 9.5, color: '#3d434c' }}>{r.date.slice(5)}</span>
        </div>
        <div style={{ display: 'flex', gap: 0, marginTop: 10 }}>
          {col(`${slp}/5`, 'Sleep', slpColor, true)}
          {col(`${r.energy}/5`, 'Energy', (r.energy ?? 5) <= 2 ? '#e8b44c' : '#e9ecef')}
          {col(low ? 'TRIM' : 'FULL', 'Intensity', low ? '#e8b44c' : '#63d08a')}
        </div>
        {low && (
          <div
            style={{
              marginTop: 10,
              fontSize: 11,
              color: '#e8b44c',
              borderTop: '1px solid rgba(255,255,255,.07)',
              paddingTop: 8,
            }}
          >
            Low readiness — creator will trim intensity ~12% today.
          </div>
        )}
      </div>
    )
  }

  if (dismissed) return null

  const scale = (label: string, value: number, onPick: (v: number) => void) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ width: 52, fontFamily: MONO, fontSize: 9.5, letterSpacing: '.12em', color: '#5a6270' }}>
        {label}
      </span>
      <div style={{ display: 'flex', flex: 1, gap: 4 }}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            onClick={() => onPick(n)}
            style={{
              flex: 1,
              height: 38,
              borderRadius: 7,
              border: 'none',
              fontFamily: MONO,
              fontSize: 13,
              background: value === n ? '#c8f04b' : '#1b1f26',
              color: value === n ? '#0b0d10' : '#8b93a0',
              fontWeight: value === n ? 600 : undefined,
            }}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  )

  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: '.12em', color: '#5a6270' }}>
          MORNING CHECK-IN · 20 SEC
        </span>
        <button
          onClick={() => setDismissed(true)}
          style={{ fontFamily: MONO, fontSize: 9.5, color: '#3d434c', background: 'none', border: 'none' }}
        >
          SKIP
        </button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
        {hasWatch && r?.watch ? (
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <span style={{ width: 52, fontFamily: MONO, fontSize: 9.5, letterSpacing: '.12em', color: '#57c4cc' }}>
              WATCH
            </span>
            <div style={{ flex: 1, fontSize: 12, color: '#e9ecef' }}>
              {r.watch.sleepMinutes ? formatSleepDuration(r.watch.sleepMinutes) : 'Unknown'} sleep
              {r.watch.sleepScore ? ` (score ${r.watch.sleepScore})` : ''}
              {r.watch.restingHr ? `, RHR ${r.watch.restingHr}` : ''}
              {rhrElevated(r.watch) && <span style={{ color: '#e8b44c' }}> (elevated)</span>}
            </div>
          </div>
        ) : (
          scale('SLEEP', sleep, setSleep)
        )}
        {scale('ENERGY', energy, setEnergy)}
      </div>
      <button
        disabled={(!hasWatch && !sleep) || !energy}
        onClick={() => repo.saveReadiness(uid, { date: todayStr(), ...(hasWatch ? {} : { sleep }), energy })}
        style={{
          marginTop: 10,
          width: '100%',
          background: '#c8f04b',
          color: '#0b0d10',
          fontWeight: 600,
          fontSize: 13,
          padding: '10px 0',
          borderRadius: 9,
          border: 'none',
          opacity: ((hasWatch || sleep) && energy) ? 1 : 0.4,
        }}
      >
        Save — the coach factors this in
      </button>
    </div>
  )
}
