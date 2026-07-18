import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { repo } from '../lib/repo'
import { currentDayLabel, todayStr } from '../lib/cycle'
import { emptyWorkout, workoutFromPreset } from '../lib/workout'
import { cycleShortName, groupedVolumeRows, weekStartMs } from '../lib/targets'
import { useStore, useUid } from '../store'
import { isRestDay, type Cycle } from '../types'
import { ReadinessCard } from '../components/ReadinessCard'

/* Verbatim port of design-refs/1a.html — inline px values are the spec. */

const MONO = "'IBM Plex Mono',monospace"
const CONDENSED = "'IBM Plex Sans Condensed',sans-serif"

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
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const dayLabel = cycle ? currentDayLabel(cycle) : null
  const dayPreset = dayLabel
    ? presets.find((p) => p.cycleDay?.toLowerCase() === dayLabel.toLowerCase())
    : undefined
  const completed = workouts.filter((w) => w.status === 'completed')
  const trainedDates = new Set(completed.map((w) => todayStr(new Date(w.startedAt))))
  const lastSameDay = dayLabel
    ? completed.find((w) => w.cycleDay?.toLowerCase() === dayLabel.toLowerCase())
    : undefined
  const latestBw = profile.bodyweight[profile.bodyweight.length - 1]
  const volumeRows = cycle ? groupedVolumeRows(cycle, completed, exercises, weekStartMs()) : []

  const start = async (presetId?: string) => {
    const preset = presets.find((p) => p.id === presetId)
    const w = preset
      ? workoutFromPreset(preset, workouts)
      : emptyWorkout(dayLabel && !isRestDay(dayLabel) ? dayLabel : undefined)
    await repo.saveWorkout(uid, w)
    navigate('/workout')
  }

  const now = new Date()
  const eyebrowDate = `${now.toLocaleDateString(undefined, { weekday: 'short' })} ${now.getDate()} ${now.toLocaleDateString(undefined, { month: 'short' })}`.toUpperCase()

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', boxSizing: 'border-box', padding: '28px 0 0' }}>
      <div style={{ padding: '0 20px' }}>
      {/* eyebrow row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '.14em', color: '#5a6270', whiteSpace: 'nowrap' }}>
          {eyebrowDate}
          {cycle && ` · CYCLE ${cycleShortName(cycle)}`}
        </span>
        <Link
          to="/profile"
          aria-label="profile"
          style={{ fontFamily: MONO, fontSize: 11, color: '#5a6270', whiteSpace: 'nowrap' }}
        >
          {latestBw ? `${latestBw.weightKg} KG` : '◉'}
        </Link>
      </div>

      {cycle && dayLabel && (
        <>
          <div style={{ fontFamily: CONDENSED, fontWeight: 700, fontSize: 46, lineHeight: 1.02, marginTop: 10 }}>
            {isRestDay(dayLabel) ? 'Rest Day' : `${dayLabel} Day`}
          </div>
          <div style={{ fontSize: 13, color: '#8b93a0', marginTop: 4 }}>
            Day {(cycle.pointer % cycle.days.length) + 1} of {cycle.days.length}
            {lastSameDay &&
              ` · last ${dayLabel} was ${new Date(lastSameDay.startedAt).toLocaleDateString(undefined, { weekday: 'short' })}, ${Math.max(1, Math.round((Date.now() - lastSameDay.startedAt) / 86_400_000))} days ago`}
          </div>
        </>
      )}
      </div>

      {/* content layer scrolls under the pinned header */}
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '0 20px 24px' }}>
      {cycle && dayLabel ? (
        /* cycle strip — tap to edit */
        <Link to="/cycle" style={{ display: 'flex', gap: 5, marginTop: 16 }}>
            {cycle.days.map((d, i) => {
              const pos = cycle.pointer % cycle.days.length
              const isToday = i === pos
              const past = i < pos
              // A past day is "done" if it was trained (or was a rest day); a
              // past training day with no logged workout shows as missed.
              const trained = trainedDates.has(todayStr(chipDate(cycle, i)))
              const missedDay = past && !isRestDay(d) && !trained
              const done = past && !missedDay
              return (
                <span
                  key={i}
                  style={{
                    flex: 1,
                    textAlign: 'center',
                    padding: '7px 0',
                    borderRadius: 7,
                    background: isToday ? '#c8f04b' : '#14171c',
                    border: isToday ? 'none' : '1px solid rgba(255,255,255,.07)',
                  }}
                >
                  <span
                    style={{
                      display: 'block',
                      fontFamily: MONO,
                      fontSize: 10,
                      fontWeight: isToday ? 600 : undefined,
                      color: isToday
                        ? '#0b0d10'
                        : done
                          ? '#63d08a'
                          : missedDay
                            ? '#e8b44c'
                            : isRestDay(d)
                              ? '#5a6270'
                              : '#8b93a0',
                    }}
                  >
                    {codeFor(d)}
                  </span>
                  <span
                    style={{
                      display: 'block',
                      fontSize: 9,
                      color: isToday ? 'rgba(11,13,16,.6)' : '#3d434c',
                      marginTop: 2,
                    }}
                  >
                    {isToday
                      ? 'TODAY'
                      : done
                        ? '✓'
                        : missedDay
                          ? '✗'
                          : chipDate(cycle, i).toLocaleDateString(undefined, { weekday: 'short' }).toUpperCase()}
                  </span>
                </span>
              )
            })}
          </Link>
      ) : (
        <div style={{ background: '#14171c', border: '1px solid rgba(255,255,255,.08)', borderRadius: 12, padding: 14, marginTop: 16 }}>
          <p style={{ fontSize: 13, color: '#8b93a0', margin: 0, lineHeight: 1.4 }}>
            No training cycle yet. Define your split (e.g. Push / Pull / Legs / Rest) and the app
            will tell you what today is.
          </p>
          <button
            onClick={() => navigate('/cycle')}
            style={{
              marginTop: 12,
              width: '100%',
              background: '#20242c',
              color: '#e9ecef',
              borderRadius: 8,
              padding: '10px 0',
              border: 'none',
              fontSize: 13,
              fontWeight: 500,
            }}
          >
            Set up cycle
          </button>
        </div>
      )}

      {/* readiness (check-in or filled stats, 1a card geometry inside) */}
      <div style={{ marginTop: 14 }}>
        <ReadinessCard />
      </div>

      {/* action stack */}
      {!activeWorkout && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 14 }}>
          {dayLabel && !isRestDay(dayLabel) && (
            <button
              onClick={() => navigate('/create')}
              style={{
                background: '#c8f04b',
                color: '#0b0d10',
                borderRadius: 10,
                padding: '14px 16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                border: 'none',
                textAlign: 'left',
              }}
            >
              <span>
                <span style={{ display: 'block', fontWeight: 600, fontSize: 15 }}>
                  Create today's workout
                </span>
                <span style={{ display: 'block', fontSize: 11, opacity: 0.65 }}>
                  AI draft · review before starting
                </span>
              </span>
              <span style={{ fontFamily: MONO, fontSize: 16 }}>✦</span>
            </button>
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            {dayPreset && (
              <button
                onClick={() => start(dayPreset.id)}
                style={{
                  flex: 1,
                  border: '1px solid rgba(255,255,255,.14)',
                  borderRadius: 10,
                  padding: '11px 14px',
                  fontSize: 13,
                  color: '#e9ecef',
                  background: 'none',
                  textAlign: 'left',
                }}
              >
                Preset · <span style={{ color: '#8b93a0' }}>{dayPreset.name}</span>
              </button>
            )}
            <button
              onClick={() => start()}
              style={{
                flex: 1,
                border: '1px solid rgba(255,255,255,.14)',
                borderRadius: 10,
                padding: '11px 14px',
                fontSize: 13,
                color: '#e9ecef',
                background: 'none',
                textAlign: 'left',
              }}
            >
              Empty workout
            </button>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 2px 0' }}>
            <button
              onClick={() => navigate('/bulk')}
              style={{ fontSize: 11.5, color: '#5a6270', background: 'none', border: 'none', padding: 0 }}
            >
              ＋ Add past workout (bulk entry)
            </button>
            <button
              onClick={() => navigate('/presets')}
              style={{ fontSize: 11.5, color: '#5a6270', background: 'none', border: 'none', padding: 0 }}
            >
              Presets →
            </button>
          </div>
        </div>
      )}

      {/* volume vs cycle target */}
      {volumeRows.length > 0 && (
        <div style={{ marginTop: 16, paddingBottom: 16 }}>
          <div style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: '.12em', color: '#5a6270' }}>
            THIS WEEK · SETS VS OPTIMAL RANGE
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginTop: 9 }}>
            {volumeRows.map((r) => {
              const isExpanded = expanded.has(r.label)
              const color = (r.behind || r.over) ? '#e8b44c' : '#57c4cc'
              return (
                <div key={r.label} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <button
                    onClick={() => {
                      const next = new Set(expanded)
                      if (next.has(r.label)) next.delete(r.label)
                      else next.add(r.label)
                      setExpanded(next)
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      width: '100%',
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      margin: 0,
                      cursor: 'pointer',
                      textAlign: 'left',
                      font: 'inherit',
                      color: 'inherit',
                    }}
                  >
                    <span
                      style={{
                        width: 80,
                        fontSize: 11,
                        fontFamily: MONO,
                        color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <span>{r.label}</span>
                      <span style={{ fontSize: 9, marginLeft: 2 }}>{isExpanded ? '▾' : '▸'}</span>
                    </span>
                    <div style={{ flex: 1, height: 5, background: '#1b1f26', borderRadius: 3 }}>
                      <div
                        style={{
                          width: `${Math.min(100, r.pct)}%`,
                          height: 5,
                          background: color,
                          borderRadius: 3,
                        }}
                      />
                    </div>
                    <span
                      style={{
                        width: 56,
                        textAlign: 'right',
                        fontFamily: MONO,
                        fontSize: 10.5,
                        color,
                      }}
                    >
                      {r.done}/{r.lo}–{r.hi}
                    </span>
                    <span
                      style={{
                        width: 34,
                        textAlign: 'right',
                        fontFamily: MONO,
                        fontSize: 10.5,
                        color,
                      }}
                    >
                      {r.pct}%
                    </span>
                  </button>

                  {isExpanded && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, paddingLeft: 10 }}>
                      {r.muscles.map((m) => {
                        const mColor = (m.behind || m.over) ? '#e8b44c' : '#57c4cc'
                        return (
                          <div key={m.muscle} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span
                              style={{
                                width: 70,
                                fontSize: 10,
                                fontFamily: MONO,
                                color: mColor,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {m.muscle}
                            </span>
                            <div style={{ flex: 1, height: 4, background: '#1b1f26', borderRadius: 2 }}>
                              <div
                                style={{
                                  width: `${Math.min(100, m.pct)}%`,
                                  height: 4,
                                  background: mColor,
                                  borderRadius: 2,
                                }}
                              />
                            </div>
                            <span
                              style={{
                                width: 56,
                                textAlign: 'right',
                                fontFamily: MONO,
                                fontSize: 10,
                                color: mColor,
                              }}
                            >
                              {m.done}/{m.lo}–{m.hi}
                            </span>
                            <span
                              style={{
                                width: 34,
                                textAlign: 'right',
                                fontFamily: MONO,
                                fontSize: 10,
                                color: mColor,
                              }}
                            >
                              {m.pct}%
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
      </div>
    </div>
  )
}

