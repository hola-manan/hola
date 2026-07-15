import type { ButtonHTMLAttributes, ReactNode } from 'react'

export function Screen({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <div className="px-4 pt-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">{title}</h1>
        {action}
      </div>
      {children}
    </div>
  )
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-2xl bg-surface p-4 ${className}`}>{children}</div>
}

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost' | 'danger'
}

export function Btn({ variant = 'primary', className = '', ...rest }: BtnProps) {
  const styles = {
    primary: 'bg-accent text-accent-ink font-semibold',
    ghost: 'bg-surface-2 text-ink',
    danger: 'bg-surface-2 text-danger',
  }[variant]
  return (
    <button
      className={`rounded-xl px-4 py-2.5 text-sm active:opacity-70 disabled:opacity-40 ${styles} ${className}`}
      {...rest}
    />
  )
}

/** Big-touch-target numeric input with ± steppers, for gym use. */
export function Stepper({
  value,
  onChange,
  step,
  min = 0,
  label,
}: {
  value: number
  onChange: (v: number) => void
  step: number
  min?: number
  label: string
}) {
  const set = (v: number) => onChange(Math.max(min, Math.round(v * 100) / 100))
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-[11px] uppercase tracking-wide text-ink-dim">{label}</span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          aria-label={`decrease ${label}`}
          className="h-11 w-11 rounded-xl bg-surface-2 text-xl active:opacity-70"
          onClick={() => set(value - step)}
        >
          −
        </button>
        <input
          type="number"
          inputMode="decimal"
          aria-label={label}
          className="h-11 w-16 rounded-xl bg-surface-2 text-center text-lg font-semibold outline-none focus:ring-1 focus:ring-accent"
          value={Number.isNaN(value) ? '' : value}
          onChange={(e) => set(parseFloat(e.target.value) || 0)}
        />
        <button
          type="button"
          aria-label={`increase ${label}`}
          className="h-11 w-11 rounded-xl bg-surface-2 text-xl active:opacity-70"
          onClick={() => set(value + step)}
        >
          +
        </button>
      </div>
    </div>
  )
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <div className="py-12 text-center text-sm text-ink-dim">{children}</div>
}
