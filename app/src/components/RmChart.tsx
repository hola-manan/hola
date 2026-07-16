import { useMemo, useRef, useState } from 'react'
import type { RmPoint } from '../lib/rm'

// Design hues (validated: CVD ΔE 23 / normal 24 / contrast ≥3:1 on #14171c;
// the two series are additionally separated by dash pattern + legend, and
// volume lives in its own mini panel — one axis per plot, never dual-scale).
const C_E1RM = '#57c4cc'
const C_E1RM_FILL = 'rgba(87,196,204,.08)'
const C_LIME = '#c8f04b'
const C_GRID = 'rgba(255,255,255,.05)'
const C_AXIS = '#3d434c'
const C_TEXT = '#8b93a0'

export const RANGES: { label: string; days: number | null }[] = [
  { label: '1M', days: 30 },
  { label: '3M', days: 91 },
  { label: '6M', days: 182 },
  { label: '1Y', days: 365 },
  { label: 'All', days: null },
]

const W = 360
const H = 150
const VOL_H = 60
const PAD = { l: 34, r: 10, t: 12, b: 18 }

export function filterRange(points: RmPoint[], days: number | null): RmPoint[] {
  if (days === null) return points
  const cutoff = Date.now() - days * 86_400_000
  return points.filter((p) => p.date >= cutoff)
}

/** Pure plot: teal e1RM line+area, lime diamonds for real singles, hover crosshair. */
export function RmPlot({
  points,
  height = H,
  showVolume = false,
}: {
  points: RmPoint[]
  height?: number
  showVolume?: boolean
}) {
  const [hover, setHover] = useState<number | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const h = height

  const geom = useMemo(() => {
    if (!points.length) return null
    const xs = points.map((p) => p.date)
    const x0 = Math.min(...xs)
    const x1 = Math.max(...xs)
    const values = points.map((p) => p.e1rm)
    const yMin = Math.min(...values)
    const yMax = Math.max(...values)
    const ySpan = yMax - yMin || 1
    const xSpan = x1 - x0 || 1
    const x = (d: number) => PAD.l + ((d - x0) / xSpan) * (W - PAD.l - PAD.r)
    const y = (v: number) =>
      PAD.t + (1 - (v - yMin + ySpan * 0.08) / (ySpan * 1.16)) * (h - PAD.t - PAD.b)
    const vMax = Math.max(...points.map((p) => p.volumeKg), 1)
    const vMin = Math.min(...points.map((p) => p.volumeKg))
    const vSpan = vMax - vMin || 1
    const yVol = (v: number) => 8 + (1 - (v - vMin) / vSpan) * (VOL_H - 22)
    return { x, y, yVol, yMin, yMax }
  }, [points, h])

  if (!points.length || !geom) {
    return <p className="py-6 text-center text-[12px] text-label">Nothing in this range yet.</p>
  }
  const { x, y, yVol, yMin, yMax } = geom

  const line = points
    .map((p, i) => `${i ? 'L' : 'M'}${x(p.date).toFixed(1)},${y(p.e1rm).toFixed(1)}`)
    .join('')
  const area = `${line}L${x(points[points.length - 1].date).toFixed(1)},${h - PAD.b}L${x(points[0].date).toFixed(1)},${h - PAD.b}Z`
  const volLine = points
    .map((p, i) => `${i ? 'L' : 'M'}${x(p.date).toFixed(1)},${yVol(p.volumeKg).toFixed(1)}`)
    .join('')

  const onMove = (clientX: number) => {
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return
    const px = ((clientX - rect.left) / rect.width) * W
    let best = 0
    let bestDist = Infinity
    points.forEach((p, i) => {
      const d = Math.abs(x(p.date) - px)
      if (d < bestDist) {
        bestDist = d
        best = i
      }
    })
    setHover(best)
  }
  const hp = hover !== null ? points[hover] : null
  const firstSingle = points.findIndex((p) => p.actualSingle)

  return (
    <div>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${h}`}
        className="w-full touch-none select-none"
        onPointerMove={(e) => onMove(e.clientX)}
        onPointerLeave={() => setHover(null)}
      >
        {[yMin, (yMin + yMax) / 2, yMax].map((v) => (
          <g key={v}>
            <line x1={PAD.l} x2={W - PAD.r} y1={y(v)} y2={y(v)} stroke={C_GRID} strokeWidth="1" />
            <text x={PAD.l - 5} y={y(v) + 3} textAnchor="end" fontSize="9" fill={C_AXIS} fontFamily="IBM Plex Mono, monospace">
              {Math.round(v)}
            </text>
          </g>
        ))}
        <path d={area} fill={C_E1RM_FILL} />
        <path d={line} fill="none" stroke={C_E1RM} strokeWidth="2" strokeLinejoin="round" />

        {points.map((p, i) =>
          p.actualSingle ? (
            <g key={p.date}>
              <rect
                x={x(p.date) - 4}
                y={y(p.e1rm) - 4}
                width="8"
                height="8"
                transform={`rotate(45 ${x(p.date)} ${y(p.e1rm)})`}
                fill={C_LIME}
                stroke="#14171c"
                strokeWidth="2"
              />
              {i === firstSingle && (
                <text
                  x={Math.min(x(p.date) + 8, W - 60)}
                  y={y(p.e1rm) - 8}
                  fontSize="8.5"
                  fill={C_LIME}
                  fontFamily="IBM Plex Mono, monospace"
                >
                  REAL 1RM · {Math.round(p.e1rm)}
                </text>
              )}
            </g>
          ) : (
            <circle
              key={p.date}
              cx={x(p.date)}
              cy={y(p.e1rm)}
              r={hover === i ? 4.5 : 3}
              fill={C_E1RM}
              stroke="#14171c"
              strokeWidth="2"
            />
          ),
        )}

        {hp && (
          <line
            x1={x(hp.date)}
            x2={x(hp.date)}
            y1={PAD.t}
            y2={h - PAD.b}
            stroke={C_TEXT}
            strokeWidth="1"
            strokeDasharray="3 3"
          />
        )}

        <text x={PAD.l} y={h - 5} fontSize="9" fill={C_AXIS} fontFamily="IBM Plex Mono, monospace">
          {new Date(points[0].date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }).toUpperCase()}
        </text>
        <text x={W - PAD.r} y={h - 5} fontSize="9" fill={C_AXIS} textAnchor="end" fontFamily="IBM Plex Mono, monospace">
          {new Date(points[points.length - 1].date)
            .toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
            .toUpperCase()}
        </text>
      </svg>

      {hp && (
        <div className="mt-1 rounded-[8px] bg-chip px-3 py-2 font-mono text-[11px]">
          <span className="text-label">
            {new Date(hp.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
          {' · '}
          <span style={{ color: C_E1RM }}>e1RM {hp.e1rm.toFixed(1)} kg</span>
          {hp.actualSingle && <span style={{ color: C_LIME }}> · real single</span>}
          {' · '}
          <span className="text-label">vol {Math.round(hp.volumeKg)} kg</span>
        </div>
      )}

      {showVolume && (
        <svg viewBox={`0 0 ${W} ${VOL_H}`} className="mt-1 w-full">
          <text x={PAD.l} y={9} fontSize="8.5" fill={C_AXIS} fontFamily="IBM Plex Mono, monospace">
            SESSION VOLUME · KG (OWN SCALE)
          </text>
          <path d={volLine} fill="none" stroke={C_LIME} strokeWidth="1.5" strokeDasharray="3 3" strokeLinejoin="round" />
          <line x1={PAD.l} x2={W - PAD.r} y1={VOL_H - 8} y2={VOL_H - 8} stroke={C_GRID} />
        </svg>
      )}
    </div>
  )
}

/** Full chart with range chips, series toggles, and an accessible data table. */
export function RmChart({ points }: { points: RmPoint[] }) {
  const [range, setRange] = useState<number | null>(91)
  const [showVolume, setShowVolume] = useState(false)
  const visible = useMemo(() => filterRange(points, range), [points, range])

  if (!points.length) {
    return <p className="py-6 text-center text-[12px] text-label">Log a few sessions to see the trend.</p>
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <div className="flex gap-1">
          {RANGES.map((r) => (
            <button
              key={r.label}
              onClick={() => setRange(r.days)}
              className={`rounded-[6px] px-2 py-1 font-mono text-[10px] uppercase ${
                range === r.days ? 'bg-lime font-semibold text-on-lime' : 'bg-chip text-muted'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          <span className="rounded-[6px] border border-teal/40 px-2 py-1 font-mono text-[10px] text-teal">
            e1RM ●
          </span>
          <button
            onClick={() => setShowVolume((v) => !v)}
            className={`rounded-[6px] border px-2 py-1 font-mono text-[10px] ${
              showVolume ? 'border-lime/40 text-lime' : 'border-white/12 text-label'
            }`}
          >
            ＋ volume ◌
          </button>
        </div>
      </div>
      <div className="mb-1 flex justify-end font-mono text-[9px] uppercase tracking-[0.08em] text-faint">
        ◆ = actual single
      </div>

      <RmPlot points={visible} showVolume={showVolume} />

      <details className="mt-2 text-[11px] text-muted">
        <summary className="font-mono text-[10px] uppercase tracking-[0.1em] text-label">Data table</summary>
        <table className="mt-1 w-full text-left font-mono text-[11px]">
          <thead>
            <tr className="text-label">
              <th className="py-1 font-normal">date</th>
              <th className="font-normal">e1RM</th>
              <th className="font-normal">best kg</th>
              <th className="font-normal">volume</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((p) => (
              <tr key={p.date} className="border-t border-white/6">
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
