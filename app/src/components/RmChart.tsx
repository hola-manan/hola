import { useMemo, useRef, useState } from 'react'
import type { RmPoint } from '../lib/rm'

// Series hues validated with the dataviz palette checker against #171717:
// aqua = e1RM, blue = best set weight. Volume lives in its own panel (own scale).
const C_E1RM = '#199e70'
const C_WEIGHT = '#3987e5'
const C_VOLUME = '#8a8a85'
const C_GRID = '#2e2e2e'
const C_TEXT = '#a3a3a3'

const RANGES: { label: string; days: number | null }[] = [
  { label: '1M', days: 30 },
  { label: '3M', days: 91 },
  { label: '6M', days: 182 },
  { label: '1Y', days: 365 },
  { label: 'All', days: null },
]

const W = 360
const H = 180
const VOL_H = 90
const PAD = { l: 34, r: 10, t: 10, b: 20 }

export function RmChart({ points }: { points: RmPoint[] }) {
  const [range, setRange] = useState<number | null>(91)
  const [showWeight, setShowWeight] = useState(false)
  const [showVolume, setShowVolume] = useState(false)
  const [hover, setHover] = useState<number | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  const visible = useMemo(() => {
    if (range === null) return points
    const cutoff = Date.now() - range * 86_400_000
    return points.filter((p) => p.date >= cutoff)
  }, [points, range])

  const geom = useMemo(() => {
    if (!visible.length) return null
    const xs = visible.map((p) => p.date)
    const x0 = Math.min(...xs)
    const x1 = Math.max(...xs)
    const values = visible.map((p) => p.e1rm).concat(showWeight ? visible.map((p) => p.bestWeightKg) : [])
    const yMin = Math.min(...values)
    const yMax = Math.max(...values)
    const ySpan = yMax - yMin || 1
    const xSpan = x1 - x0 || 1
    const x = (d: number) => PAD.l + ((d - x0) / xSpan) * (W - PAD.l - PAD.r)
    const y = (v: number) => PAD.t + (1 - (v - yMin - (ySpan * -0.08)) / (ySpan * 1.16)) * (H - PAD.t - PAD.b)
    const vMax = Math.max(...visible.map((p) => p.volumeKg), 1)
    const yVol = (v: number) => 10 + (1 - v / vMax) * (VOL_H - 30)
    return { x, y, yVol, yMin, yMax }
  }, [visible, showWeight])

  if (!points.length) {
    return <p className="py-8 text-center text-sm text-ink-dim">Log a few sessions to see the trend.</p>
  }
  if (!geom) {
    return <p className="py-8 text-center text-sm text-ink-dim">Nothing in this range yet.</p>
  }

  const { x, y, yVol, yMin, yMax } = geom
  const line = (get: (p: RmPoint) => number) =>
    visible.map((p, i) => `${i ? 'L' : 'M'}${x(p.date).toFixed(1)},${y(get(p)).toFixed(1)}`).join('')

  const onMove = (clientX: number) => {
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return
    const px = ((clientX - rect.left) / rect.width) * W
    let best = 0
    let bestDist = Infinity
    visible.forEach((p, i) => {
      const d = Math.abs(x(p.date) - px)
      if (d < bestDist) {
        bestDist = d
        best = i
      }
    })
    setHover(best)
  }

  const hp = hover !== null ? visible[hover] : null
  const gridVals = [yMin, (yMin + yMax) / 2, yMax]

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <div className="flex gap-1">
          {RANGES.map((r) => (
            <button
              key={r.label}
              onClick={() => setRange(r.days)}
              className={`rounded-full px-2.5 py-1 text-xs ${
                range === r.days ? 'bg-accent text-accent-ink' : 'bg-surface-2 text-ink-dim'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => setShowWeight((v) => !v)}
            className={`rounded-full px-2.5 py-1 text-xs ${showWeight ? 'text-ink' : 'text-ink-dim'} bg-surface-2`}
          >
            <span style={{ color: C_WEIGHT }}>●</span> weight
          </button>
          <button
            onClick={() => setShowVolume((v) => !v)}
            className={`rounded-full px-2.5 py-1 text-xs ${showVolume ? 'text-ink' : 'text-ink-dim'} bg-surface-2`}
          >
            <span style={{ color: C_VOLUME }}>▮</span> volume
          </button>
        </div>
      </div>

      {/* legend (2 series max on this axis) */}
      <div className="mb-1 flex gap-3 text-xs text-ink-dim">
        <span>
          <span style={{ color: C_E1RM }}>●</span> est. 1RM (kg)
        </span>
        {showWeight && (
          <span>
            <span style={{ color: C_WEIGHT }}>●</span> best set weight (kg)
          </span>
        )}
        <span className="ml-auto">◆ = actual single</span>
      </div>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="w-full touch-none select-none"
        onPointerMove={(e) => onMove(e.clientX)}
        onPointerLeave={() => setHover(null)}
      >
        {gridVals.map((v) => (
          <g key={v}>
            <line x1={PAD.l} x2={W - PAD.r} y1={y(v)} y2={y(v)} stroke={C_GRID} strokeWidth="1" />
            <text x={PAD.l - 4} y={y(v) + 3} textAnchor="end" fontSize="9" fill={C_TEXT}>
              {Math.round(v)}
            </text>
          </g>
        ))}

        {showWeight && (
          <path d={line((p) => p.bestWeightKg)} fill="none" stroke={C_WEIGHT} strokeWidth="2" strokeLinejoin="round" />
        )}
        <path d={line((p) => p.e1rm)} fill="none" stroke={C_E1RM} strokeWidth="2" strokeLinejoin="round" />

        {visible.map((p, i) => (
          <g key={p.date}>
            {p.actualSingle ? (
              <rect
                x={x(p.date) - 4}
                y={y(p.e1rm) - 4}
                width="8"
                height="8"
                transform={`rotate(45 ${x(p.date)} ${y(p.e1rm)})`}
                fill={C_E1RM}
                stroke="#171717"
                strokeWidth="2"
              />
            ) : (
              <circle
                cx={x(p.date)}
                cy={y(p.e1rm)}
                r={hover === i ? 5 : 3.5}
                fill={C_E1RM}
                stroke="#171717"
                strokeWidth="2"
              />
            )}
          </g>
        ))}

        {hp && (
          <line x1={x(hp.date)} x2={x(hp.date)} y1={PAD.t} y2={H - PAD.b} stroke={C_TEXT} strokeWidth="1" strokeDasharray="3 3" />
        )}

        {/* x labels: first + last */}
        <text x={PAD.l} y={H - 6} fontSize="9" fill={C_TEXT}>
          {new Date(visible[0].date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
        </text>
        <text x={W - PAD.r} y={H - 6} fontSize="9" fill={C_TEXT} textAnchor="end">
          {new Date(visible[visible.length - 1].date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
        </text>
      </svg>

      {hp && (
        <div className="mt-1 rounded-lg bg-surface-2 px-3 py-2 text-xs">
          <span className="text-ink-dim">
            {new Date(hp.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
          {' · '}
          <span style={{ color: C_E1RM }}>e1RM {hp.e1rm.toFixed(1)} kg</span>
          {hp.actualSingle && ' (actual single)'}
          {showWeight && (
            <>
              {' · '}
              <span style={{ color: C_WEIGHT }}>best {hp.bestWeightKg} kg</span>
            </>
          )}
          {' · '}
          <span className="text-ink-dim">vol {Math.round(hp.volumeKg)} kg</span>
        </div>
      )}

      {showVolume && (
        <svg viewBox={`0 0 ${W} ${VOL_H}`} className="mt-2 w-full">
          <text x={PAD.l} y={10} fontSize="9" fill={C_TEXT}>
            session volume (kg)
          </text>
          {visible.map((p) => {
            const bw = Math.max(4, Math.min(14, (W - PAD.l - PAD.r) / visible.length - 2))
            return (
              <rect
                key={p.date}
                x={x(p.date) - bw / 2}
                y={yVol(p.volumeKg)}
                width={bw}
                height={VOL_H - 20 - yVol(p.volumeKg) + 10}
                rx="2"
                fill={C_VOLUME}
              />
            )
          })}
          <line x1={PAD.l} x2={W - PAD.r} y1={VOL_H - 10} y2={VOL_H - 10} stroke={C_GRID} />
        </svg>
      )}

      <details className="mt-2 text-xs text-ink-dim">
        <summary>Data table</summary>
        <table className="mt-1 w-full text-left">
          <thead>
            <tr>
              <th className="py-1 font-normal">date</th>
              <th className="font-normal">e1RM</th>
              <th className="font-normal">best kg</th>
              <th className="font-normal">volume</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((p) => (
              <tr key={p.date} className="border-t border-line">
                <td className="py-1">{new Date(p.date).toLocaleDateString()}</td>
                <td>{p.e1rm.toFixed(1)}</td>
                <td>{p.bestWeightKg}</td>
                <td>{Math.round(p.volumeKg)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  )
}
