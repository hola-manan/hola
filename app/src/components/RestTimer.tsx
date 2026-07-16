import { useEffect, useState } from 'react'

/** Bottom rest bar (1c): sunken strip, teal progress fill, mono countdown, SKIP. */
export function RestTimer({
  endsAt,
  totalSeconds,
  onDone,
  onAdjust,
}: {
  endsAt: number
  totalSeconds: number
  onDone: () => void
  onAdjust: (deltaSeconds: number) => void
}) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(t)
  }, [])

  const remaining = Math.ceil((endsAt - now) / 1000)
  useEffect(() => {
    if (remaining <= 0) onDone()
  }, [remaining, onDone])
  if (remaining <= 0) return null

  const pct = Math.max(0, Math.min(100, (remaining / Math.max(totalSeconds, 1)) * 100))
  const mm = Math.floor(remaining / 60)
  const ss = `${remaining % 60}`.padStart(2, '0')

  return (
    <div className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-lg border-t border-white/8 bg-sunken pb-[max(0.9rem,env(safe-area-inset-bottom))]">
      <div className="h-[3px] w-full bg-chip">
        <div className="h-full bg-teal transition-[width] duration-300" style={{ width: `${pct}%` }} />
      </div>
      <div className="flex items-center justify-between px-5 pt-2.5">
        <span className="font-mono text-[13px] text-body">
          Rest · <span className="text-teal">{mm}:{ss}</span> left
        </span>
        <span className="flex items-center gap-2">
          <button
            className="rounded-[7px] border border-white/12 px-2.5 py-1 font-mono text-[11px] text-muted active:opacity-70"
            onClick={() => onAdjust(-15)}
          >
            −15s
          </button>
          <button
            className="rounded-[7px] border border-white/12 px-2.5 py-1 font-mono text-[11px] text-muted active:opacity-70"
            onClick={() => onAdjust(15)}
          >
            +15s
          </button>
          <button
            className="rounded-[7px] border border-teal/40 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.08em] text-teal active:opacity-70"
            onClick={onDone}
          >
            Skip
          </button>
        </span>
      </div>
    </div>
  )
}
