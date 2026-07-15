import { useEffect, useState } from 'react'

/** Countdown shown after each confirmed set. Skippable, adjustable ±15s. */
export function RestTimer({
  endsAt,
  onDone,
  onAdjust,
}: {
  endsAt: number
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

  const mm = Math.floor(remaining / 60)
  const ss = `${remaining % 60}`.padStart(2, '0')
  return (
    <div className="fixed inset-x-0 bottom-14 z-20 mx-auto flex max-w-lg items-center justify-between bg-warn px-4 py-2.5 font-semibold text-black">
      <span>
        Rest {mm}:{ss}
      </span>
      <span className="flex gap-2">
        <button className="rounded-lg bg-black/10 px-2 py-1 text-sm" onClick={() => onAdjust(-15)}>
          −15s
        </button>
        <button className="rounded-lg bg-black/10 px-2 py-1 text-sm" onClick={() => onAdjust(15)}>
          +15s
        </button>
        <button className="rounded-lg bg-black/10 px-2 py-1 text-sm" onClick={onDone}>
          Skip
        </button>
      </span>
    </div>
  )
}
