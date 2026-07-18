import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { type CoachThread } from '../lib/ai'
import { aiSubscriptions, repo } from '../lib/repo'
import { useUid } from '../store'
import { EmptyState } from '../components/ui'

const MONO = "'IBM Plex Mono',monospace"
const SANS = "'IBM Plex Sans',system-ui,sans-serif"
const CONDENSED = "'IBM Plex Sans Condensed',sans-serif"

function relativeDate(ms: number): string {
  const d = new Date(ms)
  const today = new Date()
  if (d.toDateString() === today.toDateString()) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }
  return d.toLocaleDateString([], { day: 'numeric', month: 'short' }).toUpperCase()
}

export function CoachThreads() {
  const uid = useUid()
  const navigate = useNavigate()
  const [threads, setThreads] = useState<CoachThread[] | null>(null)

  useEffect(() => aiSubscriptions.coachThreads(uid, setThreads), [uid])

  return (
    <div style={{ height: '100%', background: '#0b0d10', color: '#e9ecef', fontFamily: SANS, boxSizing: 'border-box', padding: '28px 0 0', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '0 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div style={{ fontFamily: CONDENSED, fontWeight: 700, fontSize: 32 }}>Coach threads</div>
        <Link to="/summary" style={{ fontFamily: MONO, fontSize: 10, color: '#57c4cc', letterSpacing: '.12em' }}>
          WEEKLY →
        </Link>
      </div>
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '0 20px 30px' }}>

      <button
        onClick={() => navigate('/coach/new')}
        style={{ width: '100%', marginTop: 14, fontSize: 13, fontWeight: 600, color: '#0b0d10', background: '#c8f04b', borderRadius: 9, padding: '11px 0', border: 'none', cursor: 'pointer' }}
      >
        ＋ New chat
      </button>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 14 }}>
        {threads?.map((t) => (
          <div
            key={t.id}
            onClick={() => navigate(`/coach/${t.id}`)}
            style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#14171c', border: '1px solid rgba(255,255,255,.08)', borderRadius: 12, padding: '13px 14px', cursor: 'pointer' }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13.5, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {t.title || 'Untitled chat'}
              </div>
              <div style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: '.1em', color: '#5a6270', marginTop: 3 }}>
                {t.messages.length} MSGS · {relativeDate(t.updatedAt)}
              </div>
            </div>
            <button
              aria-label={`delete thread ${t.title}`}
              onClick={(e) => {
                e.stopPropagation()
                if (window.confirm(`Delete "${t.title}"?`)) repo.deleteCoachThread(uid, t.id)
              }}
              style={{ color: '#5a6270', fontSize: 14, background: 'none', border: 'none', padding: '4px 6px', cursor: 'pointer' }}
            >
              ✕
            </button>
          </div>
        ))}

        {threads !== null && !threads.length && (
          <EmptyState>No conversations yet — start one and it sticks around.</EmptyState>
        )}
      </div>
      </div>
    </div>
  )
}
