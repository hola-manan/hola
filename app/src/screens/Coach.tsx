import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ai, type ChatMessage } from '../lib/ai'
import { useStore } from '../store'
import { Eyebrow } from '../components/ui'

const SUGGESTED = [
  'Why is my bench stalling?',
  'Am I neglecting any muscles?',
  'What should I focus on this month?',
]

export function Coach() {
  const { workouts } = useStore()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, busy])

  const completedCount = workouts.filter((w) => w.status === 'completed').length

  const send = async (text0?: string) => {
    const text = (text0 ?? input).trim()
    if (!text || busy) return
    const next: ChatMessage[] = [...messages, { role: 'user', text }]
    setMessages(next)
    setInput('')
    setBusy(true)
    setError('')
    try {
      const res = await ai.coachChat({ messages: next })
      setMessages([...next, { role: 'assistant', text: res.text }])
    } catch (e) {
      setError((e as Error).message)
      setMessages(messages)
      setInput(text)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-dvh flex-col px-5 pb-32 pt-8">
      <div className="flex items-end justify-between">
        <h1 className="font-condensed text-[32px] font-bold leading-none">Coach</h1>
        <Link to="/summary" className="font-mono text-[11px] uppercase tracking-[0.08em] text-teal">
          Weekly summary →
        </Link>
      </div>
      <Eyebrow className="mt-1.5">GROUNDED IN {completedCount} WORKOUTS</Eyebrow>

      <div className="mt-5 flex flex-1 flex-col gap-2">
        {messages.length === 0 && (
          <div className="flex flex-wrap gap-1.5">
            {SUGGESTED.map((q) => (
              <button
                key={q}
                className="rounded-full border border-white/10 bg-card px-3 py-1.5 text-[12px] text-muted active:opacity-70"
                onClick={() => send(q)}
              >
                {q}
              </button>
            ))}
          </div>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`max-w-[85%] px-3.5 py-2.5 text-[13px] leading-relaxed ${
              m.role === 'user'
                ? 'self-end rounded-[12px_12px_3px_12px] bg-lime text-on-lime'
                : 'self-start rounded-[12px_12px_12px_3px] border border-white/8 bg-card text-body'
            }`}
          >
            {m.text}
          </div>
        ))}
        {busy && (
          <div className="self-start rounded-[12px_12px_12px_3px] border border-white/8 bg-card px-3.5 py-2.5 font-mono text-[13px] text-label">
            …
          </div>
        )}
        <div ref={endRef} />
      </div>

      {error && <p className="mt-2 text-[12px] text-danger">{error}</p>}

      <div className="fixed inset-x-0 bottom-14 z-10 mx-auto max-w-lg border-t border-white/8 bg-sunken px-4 pb-3 pt-2.5">
        <div className="flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
            placeholder="Ask about your training…"
            className="h-10 flex-1 rounded-[9px] border border-white/10 bg-card px-3 text-[13px] outline-none placeholder:text-label focus:border-lime/40"
          />
          <button
            onClick={() => send()}
            disabled={!input.trim() || busy}
            aria-label="send"
            className="grid h-10 w-10 place-items-center rounded-[9px] bg-lime text-on-lime disabled:opacity-40"
          >
            ↥
          </button>
        </div>
      </div>
    </div>
  )
}
