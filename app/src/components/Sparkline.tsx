/** 44×16 teal sparkline for library rows — last ~10 e1RM points. */
export function Sparkline({ values }: { values: number[] }) {
  if (values.length < 2) return null
  const w = 44
  const h = 16
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const pts = values
    .map((v, i) => `${((i / (values.length - 1)) * (w - 2) + 1).toFixed(1)},${(h - 2 - ((v - min) / span) * (h - 4)).toFixed(1)}`)
    .join(' ')
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-4 w-11" aria-hidden="true">
      <polyline points={pts} fill="none" stroke="#57c4cc" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  )
}
