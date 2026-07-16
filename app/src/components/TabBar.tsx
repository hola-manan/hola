import { NavLink } from 'react-router-dom'

/* 20×20 stroked line icons per the design: house, clock, list, zigzag, speech bubble. */
const icons: Record<string, string> = {
  today: 'M3 10 L10 3 L17 10 M5 8.5 V16 H15 V8.5',
  history: 'M10 2 A8 8 0 1 0 10 18 A8 8 0 1 0 10 2 M10 6 V10 L13 12',
  library: 'M4 5 H16 M4 10 H16 M4 15 H11',
  trends: 'M3 15 L8 9 L12 12 L17 5',
  coach: 'M4 4 H16 V13 H9 L5 16 V13 H4 Z',
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
    <nav className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-lg border-t border-white/8 bg-sunken/95 backdrop-blur">
      <div className="grid grid-cols-5 px-2 pb-[max(1.1rem,env(safe-area-inset-bottom))] pt-2.5">
        {tabs.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            end={t.to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 text-[9.5px] ${isActive ? 'text-lime' : 'text-label'}`
            }
          >
            <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d={icons[t.icon]} />
            </svg>
            {t.label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
