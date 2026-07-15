import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ai, type ChatMessage, type WeeklySummary } from '../lib/ai'
import { aiSubscriptions } from '../lib/repo'
import { useStore, useUid } from '../store'
import { Btn, Card, Screen } from '../components/ui'

export function Coach() {
  const uid = useUid()
  const { workouts } = useStore()
  const navigate = useNavigate()
  const [summaries, setSummaries] = useState<WeeklySummary[]>([])
  const [summaryBusy, setSummaryBusy] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [chatBusy, setChatBusy] = useState(false)
  const [error, setError] = useState('')
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => aiSubscriptions.summaries(uid, setSummaries), [uid])
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, chatBusy])

  const refreshSummary = async () => {
    setSummaryBusy(true)
    setError('')
    try {
      await ai.generateWeeklySummary({})
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSummaryBusy(false)
    }
  }

  const send = async () => {
    const text = input.trim()
    if (!text || chatBusy) return
    const next: ChatMessage[] = [...messages, { role: 'user', text }]
    setMessages(next)
    setInput('')
    setChatBusy(true)
    setError('')
    try {
      const res = await ai.coachChat({ messages: next })
      setMessages([...next, { role: 'assistant', text: res.text }])
    } catch (e) {
      setError((e as Error).message)
      setMessages(messages) // roll back so the user can retry
      setInput(text)
    } finally {
      setChatBusy(false)
    }
  }

  const latest = summaries[0]
  const hasHistory = workouts.some((w) => w.status === 'completed')

  return (
    <Screen title="Coach">
      <Card className="mb-3">
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-dim">
            This week
          </h2>
          <Btn variant="ghost" disabled={summaryBusy || !hasHistory} onClick={refreshSummary}>
            {summaryBusy ? 'Thinking…' : latest ? 'Refresh' : 'Generate'}
          </Btn>
        </div>
        {latest ? (
          <p className="text-sm leading-relaxed">{latest.text}</p>
        ) : (
          <p className="text-sm text-ink-dim">
            {hasHistory
              ? 'Get a weekly balance check across your muscle groups.'
              : 'Log some workouts first, then the coach has something to say.'}
          </p>
        )}
      </Card>

      <Card className="mb-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-dim">
              AI workout
            </h2>
            <p className="text-xs text-ink-dim">Draft today's session for you</p>
          </div>
          <Btn onClick={() => navigate('/create')}>Create</Btn>
        </div>
      </Card>

      <h2 className="mb-2 mt-5 text-sm font-semibold uppercase tracking-wide text-ink-dim">
        Ask the coach
      </h2>
      <div className="mb-3 flex flex-col gap-2">
        {messages.length === 0 && (
          <div className="flex flex-wrap gap-2">
            {['Why is my bench stalling?', 'Am I neglecting any muscles?', 'What should I focus on this month?'].map(
              (q) => (
                <button
                  key={q}
                  className="rounded-full bg-surface-2 px-3 py-1.5 text-xs text-ink-dim"
                  onClick={() => setInput(q)}
                >
                  {q}
                </button>
              ),
            )}
          </div>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
              m.role === 'user' ? 'self-end bg-accent text-accent-ink' : 'self-start bg-surface'
            }`}
          >
            {m.text}
          </div>
        ))}
        {chatBusy && <div className="self-start rounded-2xl bg-surface px-3 py-2 text-sm text-ink-dim">…</div>}
        <div ref={endRef} />
      </div>
      {error && <p className="mb-2 text-xs text-danger">{error}</p>}
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder="Ask anything about your training…"
          className="h-11 flex-1 rounded-xl bg-surface-2 px-3 text-sm outline-none focus:ring-1 focus:ring-accent"
        />
        <Btn disabled={!input.trim() || chatBusy} onClick={send}>
          Send
        </Btn>
      </div>
    </Screen>
  )
}
