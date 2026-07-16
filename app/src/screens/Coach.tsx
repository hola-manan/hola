import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ai, type ChatMessage } from '../lib/ai'
import { useStore } from '../store'

const SUGGESTED = [
  'Why is my bench stalling?',
  'Am I neglecting any muscles?',
  'What should I focus on this month?',
]

const MONO = "'IBM Plex Mono',monospace"
const SANS = "'IBM Plex Sans',system-ui,sans-serif"

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
    <div style={{ minHeight: '100%', background: '#0b0d10', color: '#e9ecef', fontFamily: SANS, boxSizing: 'border-box', padding: '62px 0 0', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '10px 20px', borderBottom: '1px solid rgba(255,255,255,.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={{ fontWeight: 600, fontSize: 15 }}>Coach</span>
        <span style={{ display: 'flex', gap: 14, alignItems: 'baseline' }}>
          <span style={{ fontFamily: MONO, fontSize: 10, color: '#5a6270', letterSpacing: '.12em' }}>GROUNDED IN {completedCount} WORKOUTS</span>
          <Link to="/summary" style={{ fontFamily: MONO, fontSize: 10, color: '#57c4cc', letterSpacing: '.12em' }}>
            WEEKLY →
          </Link>
        </span>
      </div>
      
      <div style={{ flex: 1, overflow: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {messages.length === 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
            {SUGGESTED.map((q) => (
              <button
                key={q}
                onClick={() => send(q)}
                style={{ borderRadius: 16, border: '1px solid rgba(255,255,255,.1)', background: '#14171c', padding: '6px 12px', fontSize: 12, color: '#8b93a0', cursor: 'pointer' }}
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {messages.map((m, i) => {
          const isUser = m.role === 'user'
          return (
            <div
              key={i}
              style={{
                alignSelf: isUser ? 'flex-end' : 'flex-start',
                maxWidth: isUser ? '75%' : '88%',
                background: isUser ? '#c8f04b' : '#14171c',
                color: isUser ? '#0b0d10' : '#c7ccd4',
                border: isUser ? 'none' : '1px solid rgba(255,255,255,.08)',
                borderRadius: isUser ? '12px 12px 3px 12px' : '12px 12px 12px 3px',
                padding: '11px 13px',
                fontSize: 13.5,
                lineHeight: 1.55,
                whiteSpace: 'pre-wrap'
              }}
            >
              {m.text}
            </div>
          )
        })}

        {busy && (
          <div style={{ alignSelf: 'flex-start', maxWidth: '88%', background: '#14171c', border: '1px solid rgba(255,255,255,.08)', borderRadius: '12px 12px 12px 3px', padding: '11px 13px', fontSize: 13.5, color: '#5a6270' }}>
            …
          </div>
        )}
        
        {error && <div style={{ fontSize: 12, color: '#e0596b', textAlign: 'center', marginTop: 8 }}>{error}</div>}
        
        <div ref={endRef} />
      </div>

      <div style={{ padding: '10px 16px 8px', borderTop: '1px solid rgba(255,255,255,.08)', background: '#101318' }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', background: '#14171c', border: '1px solid rgba(255,255,255,.12)', borderRadius: 10, padding: '2px 12px' }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
            placeholder="Ask about your training…"
            style={{ flex: 1, height: 40, background: 'transparent', border: 'none', color: '#e9ecef', fontSize: 13, outline: 'none' }}
          />
          <button
            onClick={() => send()}
            disabled={!input.trim() || busy}
            style={{ color: (!input.trim() || busy) ? '#5a6270' : '#c8f04b', fontSize: 18, background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
          >
            ↥
          </button>
        </div>
      </div>
    </div>
  )
}
