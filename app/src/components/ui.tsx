import type { ButtonHTMLAttributes, ReactNode } from 'react'

/* Shared primitives for the "instrument panel" design language:
   cards on a graphite scale, mono micro-labels, lime = action/today,
   teal = data, green = positive, amber = behind/warn. */

export function Screen({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <div className="px-5 pt-8">
      <div className="mb-4 flex items-end justify-between">
        <h1 className="font-condensed text-[32px] font-bold leading-none">{title}</h1>
        {action}
      </div>
      {children}
    </div>
  )
}

/** Mono uppercase micro-label — the design's ubiquitous eyebrow. */
export function Eyebrow({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`font-mono text-[10px] uppercase tracking-[0.12em] text-label ${className}`}>
      {children}
    </div>
  )
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-[11px] border border-white/8 bg-card p-3.5 ${className}`}>
      {children}
    </div>
  )
}

export function SunkenCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-[11px] bg-sunken p-3.5 ${className}`}>{children}</div>
}

/** 2px accent-left callout: amber = warn/imbalance, lime = next action, teal = tweak. */
export function AccentCallout({
  tone,
  label,
  children,
  className = '',
}: {
  tone: 'warn' | 'lime' | 'teal'
  label?: string
  children: ReactNode
  className?: string
}) {
  const border = { warn: 'border-l-warn', lime: 'border-l-lime', teal: 'border-l-teal' }[tone]
  const labelColor = { warn: 'text-warn', lime: 'text-lime', teal: 'text-teal' }[tone]
  return (
    <div className={`rounded-r-[10px] border-l-2 bg-card p-3.5 ${border} ${className}`}>
      {label && (
        <div className={`mb-1.5 font-mono text-[10px] uppercase tracking-[0.12em] ${labelColor}`}>
          {label}
        </div>
      )}
      {children}
    </div>
  )
}

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost' | 'dashed' | 'danger'
}

export function Btn({ variant = 'primary', className = '', ...rest }: BtnProps) {
  const styles = {
    primary: 'bg-lime text-on-lime font-semibold',
    ghost: 'border border-white/14 text-ink',
    dashed: 'border border-dashed border-white/18 text-muted',
    danger: 'border border-white/14 text-danger',
  }[variant]
  return (
    <button
      className={`rounded-[10px] px-4 py-2.5 text-sm active:opacity-70 disabled:opacity-40 ${styles} ${className}`}
      {...rest}
    />
  )
}

/** Mono chip: active = lime fill; inactive = card + border. */
export function Chip({
  active = false,
  className = '',
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      className={`whitespace-nowrap rounded-md px-2.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.08em] active:opacity-70 ${
        active
          ? 'bg-lime font-semibold text-on-lime'
          : 'border border-white/10 bg-card text-muted'
      } ${className}`}
      {...rest}
    />
  )
}

/** Tinted status chip for deltas: ↑ green, ↓ red, → grey, behind amber. */
export function DeltaChip({ tone, children }: { tone: 'pos' | 'neg' | 'flat' | 'warn'; children: ReactNode }) {
  const styles = {
    pos: 'bg-pos/12 text-pos',
    neg: 'bg-danger/12 text-danger',
    flat: 'bg-white/6 text-muted',
    warn: 'bg-warn/12 text-warn',
  }[tone]
  return (
    <span className={`rounded-md px-2 py-1 font-mono text-[10.5px] uppercase tracking-[0.06em] ${styles}`}>
      {children}
    </span>
  )
}

/** Horizontal stat strip: mono value over mono label, hairline column dividers. */
export function StatStrip({
  stats,
  className = '',
}: {
  stats: { value: ReactNode; label: string; tone?: 'ink' | 'lime' | 'pos' | 'warn' | 'teal' }[]
  className?: string
}) {
  const tones = { ink: 'text-ink', lime: 'text-lime', pos: 'text-pos', warn: 'text-warn', teal: 'text-teal' }
  return (
    <div className={`flex rounded-[10px] border border-white/8 bg-card px-1 py-2.5 ${className}`}>
      {stats.map((s, i) => (
        <div key={i} className={`flex-1 px-3 ${i > 0 ? 'border-l border-white/7' : ''}`}>
          <div className={`font-mono text-[15px] font-medium ${tones[s.tone ?? 'ink']}`}>{s.value}</div>
          <div className="mt-0.5 font-mono text-[9.5px] uppercase tracking-[0.12em] text-label">
            {s.label}
          </div>
        </div>
      ))}
    </div>
  )
}

/** 5px progress bar; teal on-target / amber behind; optional cycle-target tick. */
export function ProgressRow({
  label,
  value,
  pct,
  behind = false,
  tickPct,
}: {
  label: string
  value: ReactNode
  pct: number
  behind?: boolean
  tickPct?: number
}) {
  return (
    <div className="flex items-center gap-3 py-1.5">
      <span className={`w-20 shrink-0 text-[12.5px] ${behind ? 'text-warn' : 'text-body'}`}>{label}</span>
      <div className="relative h-[5px] flex-1 rounded-[3px] bg-chip">
        <div
          className={`h-full rounded-[3px] ${behind ? 'bg-warn' : 'bg-teal'}`}
          style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
        />
        {tickPct !== undefined && (
          <div
            className="absolute top-[-2px] h-[9px] w-[2px] bg-white/25"
            style={{ left: `${Math.min(100, tickPct)}%` }}
          />
        )}
      </div>
      <span className={`w-12 shrink-0 text-right font-mono text-[11px] ${behind ? 'text-warn' : 'text-muted'}`}>
        {value}
      </span>
    </div>
  )
}

/** Big-touch-target numeric input with ± steppers (kept for preset editing). */
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
      <span className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-label">{label}</span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          aria-label={`decrease ${label}`}
          className="h-11 w-11 rounded-[9px] bg-chip text-xl active:opacity-70"
          onClick={() => set(value - step)}
        >
          −
        </button>
        <input
          type="number"
          inputMode="decimal"
          aria-label={label}
          className="h-11 w-16 rounded-[9px] bg-chip text-center font-mono text-lg font-medium outline-none focus:ring-1 focus:ring-lime"
          value={Number.isNaN(value) ? '' : value}
          onChange={(e) => set(parseFloat(e.target.value) || 0)}
        />
        <button
          type="button"
          aria-label={`increase ${label}`}
          className="h-11 w-11 rounded-[9px] bg-chip text-xl active:opacity-70"
          onClick={() => set(value + step)}
        >
          +
        </button>
      </div>
    </div>
  )
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <div className="py-12 text-center text-sm text-muted">{children}</div>
}
