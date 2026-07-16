import { useMemo, useRef, useState } from 'react'
import type { RmPoint } from '../lib/rm'

const C_E1RM = '#57c4cc'
const C_E1RM_FILL = 'rgba(87,196,204,.08)'
const C_LIME = '#c8f04b'
const C_GRID = 'rgba(255,255,255,.05)'
const C_AXIS = '#3d434c'
const C_TEXT = '#8b93a0'

const MONO = "'IBM Plex Mono',monospace"

export const RANGES: { label: string; days: number | null }[] = [
  { label: '1M', days: 30 },
  { label: '3M', days: 91 },
  { label: '6M', days: 182 },
  { label: '1Y', days: 365 },
  { label: 'ALL', days: null },
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
    return <div style={{ padding: '24px 0', textAlign: 'center', fontSize: 12, color: '#5a6270' }}>Nothing in this range yet.</div>
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
        style={{ width: '100%', touchAction: 'none', userSelect: 'none', marginTop: 8 }}
        onPointerMove={(e) => onMove(e.clientX)}
        onPointerLeave={() => setHover(null)}
      >
        {[yMin, (yMin + yMax) / 2, yMax].map((v) => (
          <g key={v}>
            <line x1={PAD.l} x2={W - PAD.r} y1={y(v)} y2={y(v)} stroke={C_GRID} strokeWidth="1" />
            <text x={PAD.l - 5} y={y(v) + 3} textAnchor="end" fontSize="9" fill={C_AXIS} fontFamily={MONO}>
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
                  fontFamily={MONO}
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

        <text x={PAD.l} y={h - 5} fontSize="9" fill={C_AXIS} fontFamily={MONO}>
          {new Date(points[0].date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }).toUpperCase()}
        </text>
        <text x={W - PAD.r} y={h - 5} fontSize="9" fill={C_AXIS} textAnchor="end" fontFamily={MONO}>
          {new Date(points[points.length - 1].date)
            .toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
            .toUpperCase()}
        </text>
      </svg>

      {hp && (
        <div style={{ marginTop: 4, borderRadius: 8, background: '#1b1f26', padding: '8px 12px', fontFamily: MONO, fontSize: 11 }}>
          <span style={{ color: '#5a6270' }}>
            {new Date(hp.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
          {' · '}
          <span style={{ color: C_E1RM }}>e1RM {hp.e1rm.toFixed(1)} kg</span>
          {hp.actualSingle && <span style={{ color: C_LIME }}> · real single</span>}
          {' · '}
          <span style={{ color: '#5a6270' }}>vol {Math.round(hp.volumeKg)} kg</span>
        </div>
      )}

      {showVolume && (
        <svg viewBox={`0 0 ${W} ${VOL_H}`} style={{ marginTop: 4, width: '100%' }}>
          <text x={PAD.l} y={9} fontSize="8.5" fill={C_AXIS} fontFamily={MONO}>
            SESSION VOLUME · KG (OWN SCALE)
          </text>
          <path d={volLine} fill="none" stroke={C_LIME} strokeWidth="1.5" strokeDasharray="3 3" strokeLinejoin="round" />
          <line x1={PAD.l} x2={W - PAD.r} y1={VOL_H - 8} y2={VOL_H - 8} stroke={C_GRID} />
        </svg>
      )}
    </div>
  )
}

export function RmChart({ points }: { points: RmPoint[] }) {
  const [range, setRange] = useState<number | null>(91)
  const [showVolume, setShowVolume] = useState(false)
  const visible = useMemo(() => filterRange(points, range), [points, range])

  if (!points.length) {
    return <div style={{ padding: '24px 0', textAlign: 'center', fontSize: 12, color: '#5a6270' }}>Log a few sessions to see the trend.</div>
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
        <span style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: '.12em', color: '#5a6270' }}>
          ESTIMATED 1RM · KG
        </span>
        <div style={{ display: 'flex', gap: 4 }}>
          {RANGES.map((r) => {
            const active = range === r.days
            return (
              <button
                key={r.label}
                onClick={() => setRange(r.days)}
                style={{
                  fontSize: 10, fontFamily: MONO, padding: '3px 8px', borderRadius: 5,
                  background: active ? '#c8f04b' : 'transparent',
                  color: active ? '#0b0d10' : '#5a6270',
                  fontWeight: active ? 600 : 400,
                  border: 'none', cursor: 'pointer'
                }}
              >
                {r.label}
              </button>
            )
          })}
        </div>
      </div>
      
      <RmPlot points={visible} showVolume={showVolume} />

      <div style={{ display: 'flex', gap: 6, marginTop: 16 }}>
        <span style={{ fontSize: 10.5, fontFamily: MONO, padding: '4px 9px', borderRadius: 6, border: '1px solid rgba(87,196,204,.4)', color: '#57c4cc' }}>
          e1RM ●
        </span>
        <button
          onClick={() => setShowVolume((v) => !v)}
          style={{ fontSize: 10.5, fontFamily: MONO, padding: '4px 9px', borderRadius: 6, border: showVolume ? '1px solid rgba(200,240,75,.4)' : '1px solid rgba(255,255,255,.1)', color: showVolume ? '#c8f04b' : '#5a6270', background: 'none', cursor: 'pointer' }}
        >
          ＋ volume
        </button>
      </div>
    </div>
  )
}
