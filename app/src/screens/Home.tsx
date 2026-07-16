import { Link, useNavigate } from 'react-router-dom'
import { repo } from '../lib/repo'
import { currentDayLabel, missedDays, shiftToToday, skipDay } from '../lib/cycle'
import { emptyWorkout, workoutFromPreset } from '../lib/workout'
import { volumeVsTargets, weekStartMs } from '../lib/targets'
import { useStore, useUid } from '../store'
import { isRestDay, type Cycle } from '../types'
import { Btn, Card, Eyebrow, ProgressRow, SunkenCard } from '../components/ui'
import { ReadinessCard } from '../components/ReadinessCard'

/** 3-letter mono codes for the cycle strip, per the design (PSH · PLL · LEG …). */
const DAY_CODES: Record<string, string> = {
  push: 'PSH',
  pull: 'PLL',
  legs: 'LEG',
  rest: 'RST',
  upper: 'UPR',
  lower: 'LWR',
  'full body': 'FBD',
  arms: 'ARM',
  back: 'BCK',
  chest: 'CHS',
  shoulders: 'SHO',
}
const codeFor = (label: string) =>
  DAY_CODES[label.trim().toLowerCase()] ?? label.replace(/[^a-z]/gi, '').slice(0, 3).toUpperCase()

function chipDate(cycle: Cycle, index: number): Date {
  const base = new Date(`${cycle.pointerDate}T00:00:00`)
  base.setDate(base.getDate() + (index - cycle.pointer))
  return base
}

export function Home() {
  const { cycle, presets, workouts, activeWorkout, profile, exercises } = useStore()
  const uid = useUid()
  const navigate = useNavigate()

  const dayLabel = cycle ? currentDayLabel(cycle) : null
  const missed = cycle ? missedDays(cycle) : 0
  const dayPresets = dayLabel
    ? presets.filter((p) => p.cycleDay?.toLowerCase() === dayLabel.toLowerCase())
    : []
  const completed = workouts.filter((w) => w.status === 'completed')
  const lastSameDay = dayLabel
    ? completed.find((w) => w.cycleDay?.toLowerCase() === dayLabel.toLowerCase())
    : undefined
  const latestBw = profile.bodyweight[profile.bodyweight.length - 1]
  const volumeRows = cycle
    ? volumeVsTargets(cycle, completed, exercises, weekStartMs()).slice(0, 5)
    : []

  const start = async (presetId?: string) => {
    const preset = presets.find((p) => p.id === presetId)
    const w = preset
      ? workoutFromPreset(preset, workouts)
      : emptyWorkout(dayLabel && !isRestDay(dayLabel) ? dayLabel : undefined)
    await repo.saveWorkout(uid, w)
    navigate('/workout')
  }

  const today = new Date()
  const eyebrowDate = today
    .toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })
    .toUpperCase()

  return (
    <div className="px-5 pt-8">
      {/* eyebrow row: date · cycle codes | bodyweight + profile */}
      <div className="flex items-center justify-between">
        <Eyebrow>
          {eyebrowDate}
          {cycle && ` · CYCLE ${cycle.days.map(codeFor).filter((c, i, a) => a.indexOf(c) === i).join('·')}`}
        </Eyebrow>
        <Link to="/profile" className="flex items-center gap-2" aria-label="profile">
          {latestBw && (
            <span className="font-mono text-[10px] tracking-[0.12em] text-label">
              {latestBw.weightKg} KG
            </span>
          )}
          <svg viewBox="0 0 20 20" className="h-4 w-4 text-label" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="10" cy="6.5" r="3.2" />
            <path d="M3.5 17 C4.5 13.5 7 12 10 12 C13 12 15.5 13.5 16.5 17" />
          </svg>
        </Link>
      </div>

      {cycle && dayLabel ? (
        <>
          <h1 className="mt-3 font-condensed text-[46px] font-bold leading-none">
            {isRestDay(dayLabel) ? 'Rest Day' : `${dayLabel} Day`}
          </h1>
          <p className="mt-1.5 text-[13px] text-muted">
            Day {(cycle.pointer % cycle.days.length) + 1} of {cycle.days.length}
            {lastSameDay &&
              ` · last ${dayLabel} was ${new Date(lastSameDay.startedAt).toLocaleDateString(undefined, { weekday: 'short' })}, ${Math.max(1, Math.round((Date.now() - lastSameDay.startedAt) / 86_400_000))} days ago`}
          </p>

          {/* cycle strip — tap to edit */}
          <Link to="/cycle" className="mt-4 flex gap-1">
            {cycle.days.map((d, i) => {
              const isToday = i === cycle.pointer % cycle.days.length
              const done = i < cycle.pointer % cycle.days.length
              return (
                <span
                  key={i}
                  className={`flex flex-1 flex-col items-center gap-0.5 rounded-md py-1.5 font-mono text-[10px] ${
                    isToday
                      ? 'bg-lime font-semibold text-on-lime'
                      : 'border border-white/8 bg-card'
                  } ${!isToday && (done ? 'text-pos' : isRestDay(d) ? 'text-faint' : 'text-label')}`}
                >
                  {codeFor(d)}
                  <span className={`text-[8px] tracking-[0.1em] ${isToday ? 'text-on-lime/70' : 'text-faint'}`}>
                    {isToday
                      ? 'TODAY'
                      : done
                        ? '✓'
                        : chipDate(cycle, i).toLocaleDateString(undefined, { weekday: 'short' }).toUpperCase()}
                  </span>
                </span>
              )
            })}
          </Link>
        </>
      ) : (
        <Card className="mt-4">
          <p className="text-[13px] text-muted">
            No training cycle yet. Define your split (e.g. Push / Pull / Legs / Rest) and the app
            will tell you what today is.
          </p>
          <Btn className="mt-3" onClick={() => navigate('/cycle')}>
            Set up cycle
          </Btn>
        </Card>
      )}

      <div className="mt-4">
        <ReadinessCard />
      </div>

      {cycle && dayLabel && missed > 1 && !isRestDay(dayLabel) && (
        <Card className="mt-3">
          <Eyebrow className="mb-1.5">MISSED A DAY?</Eyebrow>
          <p className="mb-2.5 text-[13px] text-body">
            {dayLabel} has been waiting {missed} days.
          </p>
          <div className="flex gap-2">
            <Btn className="flex-1" onClick={() => repo.saveCycle(uid, shiftToToday(cycle))}>
              Shift — do it today
            </Btn>
            <Btn variant="ghost" className="flex-1" onClick={() => repo.saveCycle(uid, skipDay(cycle))}>
              Skip — move on
            </Btn>
          </div>
        </Card>
      )}

      {!activeWorkout && (
        <div className="mt-4 flex flex-col gap-2">
          {dayLabel && !isRestDay(dayLabel) && (
            <button
              onClick={() => navigate('/create')}
              className="flex items-center justify-between rounded-xl bg-lime p-4 text-left active:opacity-80"
            >
              <span>
                <span className="block text-[15px] font-semibold text-on-lime">
                  ✦ Create today's workout
                </span>
                <span className="mt-0.5 block text-[11.5px] text-on-lime/70">
                  AI draft · review before starting
                </span>
              </span>
              <span className="text-on-lime">→</span>
            </button>
          )}
          <div className="flex gap-2">
            {dayPresets.slice(0, 1).map((p) => (
              <Btn key={p.id} variant="ghost" className="flex-1 py-3" onClick={() => start(p.id)}>
                Preset · {p.name}
              </Btn>
            ))}
            <Btn variant="ghost" className="flex-1 py-3" onClick={() => start()}>
              Empty workout
            </Btn>
          </div>
          <div className="flex justify-between px-1">
            <button className="text-[12px] text-muted underline-offset-4 active:underline" onClick={() => navigate('/bulk')}>
              ＋ Add past workout (bulk entry)
            </button>
            <button className="text-[12px] text-muted underline-offset-4 active:underline" onClick={() => navigate('/presets')}>
              Presets →
            </button>
          </div>
        </div>
      )}

      {activeWorkout && (
        <SunkenCard className="mt-4">
          <p className="text-[13px] text-body">Workout in progress — resume from the bar below.</p>
        </SunkenCard>
      )}

      {volumeRows.length > 0 && (
        <div className="mt-6">
          <Eyebrow className="mb-1">VOLUME VS CYCLE TARGET · SETS/WK</Eyebrow>
          {volumeRows.map((r) => (
            <ProgressRow
              key={r.muscle}
              label={r.muscle}
              value={`${r.pct}%`}
              pct={r.pct}
              behind={r.behind}
            />
          ))}
        </div>
      )}
    </div>
  )
}
