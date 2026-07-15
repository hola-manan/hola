import { NavLink } from 'react-router-dom'

const tabs = [
  { to: '/', label: 'Home', icon: '⌂' },
  { to: '/history', label: 'History', icon: '☰' },
  { to: '/coach', label: 'Coach', icon: '✨' },
  { to: '/exercises', label: 'Exercises', icon: '💪' },
  { to: '/profile', label: 'Profile', icon: '◉' },
]

export function TabBar() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-lg border-t border-line bg-surface/95 backdrop-blur">
      <div className="grid grid-cols-5">
        {tabs.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            end={t.to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] text-[11px] ${
                isActive ? 'text-accent' : 'text-ink-dim'
              }`
            }
          >
            <span className="text-lg leading-none">{t.icon}</span>
            {t.label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
