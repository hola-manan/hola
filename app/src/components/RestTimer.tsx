import { useEffect, useState } from 'react'

/* Verbatim port of 1c's bottom rest bar: sunken strip, 4px teal fill, SKIP chip. */
export function RestTimer({
  endsAt,
  totalSeconds,
  onDone,
}: {
  endsAt: number
  totalSeconds: number
  onDone: () => void
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
    <div
      className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-lg"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        background: '#101318',
        borderTop: '1px solid rgba(255,255,255,.08)',
        padding: '10px 16px 30px',
      }}
    >
      <div style={{ flex: 1 }}>
        <div style={{ height: 4, background: '#1b1f26', borderRadius: 2 }}>
          <div
            style={{
              width: `${pct}%`,
              height: 4,
              background: '#57c4cc',
              borderRadius: 2,
              transition: 'width .3s linear',
            }}
          />
        </div>
        <div style={{ fontSize: 10, color: '#5a6270', marginTop: 4 }}>
          Rest · {mm}:{ss} left
        </div>
      </div>
      <button
        onClick={onDone}
        style={{
          fontFamily: "'IBM Plex Mono',monospace",
          fontSize: 12,
          color: '#57c4cc',
          border: '1px solid rgba(87,196,204,.35)',
          borderRadius: 7,
          padding: '5px 10px',
          background: 'none',
        }}
      >
        SKIP
      </button>
    </div>
  )
}
