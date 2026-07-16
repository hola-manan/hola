import type { ReactElement } from 'react'
import { NavLink } from 'react-router-dom'

/* Verbatim port of the design's tab bar (1a/2b/2d/3b): exact icon paths. */
const icons: Record<string, ReactElement> = {
  today: <path d="M3 10 L10 3 L17 10 M5 9 V17 H15 V9" />,
  history: (
    <>
      <circle cx="10" cy="10" r="7" />
      <path d="M10 6 V10 L13 12" />
    </>
  ),
  library: <path d="M4 6 H16 M4 10 H16 M4 14 H11" />,
  trends: <path d="M3 15 L8 9 L12 12 L17 5" />,
  coach: <path d="M4 4 H16 V13 H9 L5 16 V13 H4 Z" />,
}

const tabs = [
  { to: '/', label: 'Today', icon: 'today' },
  { to: '/history', label: 'History', icon: 'history' },
  { to: '/exercises', label: 'Library', icon: 'library' },
  { to: '/trends', label: 'Trends', icon: 'trends' },
  { to: '/coach', label: 'Coach', icon: 'coach' },
]

export function TabBar() {
  return (
    <nav
      style={{
        display: 'flex',
        borderTop: '1px solid rgba(255,255,255,.08)',
        background: '#101318',
        padding: '10px 8px max(26px, env(safe-area-inset-bottom))',
      }}
    >
      {tabs.map((t) => (
        <NavLink key={t.to} to={t.to} end={t.to === '/'} style={{ flex: 1, textAlign: 'center' }}>
          {({ isActive }) => (
            <>
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                stroke={isActive ? '#c8f04b' : '#5a6270'}
                strokeWidth="1.6"
                style={{ display: 'inline-block' }}
              >
                {icons[t.icon]}
              </svg>
              <div style={{ fontSize: 9.5, color: isActive ? '#c8f04b' : '#5a6270', marginTop: 2 }}>
                {t.label}
              </div>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
