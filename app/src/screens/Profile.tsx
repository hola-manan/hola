import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { signOut } from '../lib/firebase'
import { repo } from '../lib/repo'
import { todayStr } from '../lib/cycle'
import { useStore, useUid, DEFAULT_PROFILE } from '../store'
import { AccentCallout, Btn, Card, Eyebrow, Screen, StatStrip, SunkenCard } from '../components/ui'

export function ProfileScreen() {
  const { profile, user, readinessToday } = useStore()
  const uid = useUid()
  const [goals, setGoals] = useState(profile.goals)
  const [heightCm, setHeightCm] = useState(profile.heightCm?.toString() ?? '')
  const [weight, setWeight] = useState('')
  const [tweak, setTweak] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setGoals(profile.goals)
    setHeightCm(profile.heightCm?.toString() ?? '')
  }, [profile.goals, profile.heightCm])

  const persist = async (patch: Partial<typeof DEFAULT_PROFILE>) => {
    await repo.saveProfile(uid, { ...DEFAULT_PROFILE, ...profile, ...patch })
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  const latestWeight = profile.bodyweight[profile.bodyweight.length - 1]

  return (
    <Screen title="Profile">
      <StatStrip
        className="mb-4"
        stats={[
          { value: profile.heightCm ?? '—', label: 'height cm' },
          { value: latestWeight?.weightKg ?? '—', label: 'weight kg' },
          { value: 'KG', label: 'units · 0.25' },
        ]}
      />

      <Card className="mb-3">
        <Eyebrow className="mb-2">GOALS</Eyebrow>
        <textarea
          placeholder="e.g. Build shoulders and back width, cut to 72 kg by December"
          value={goals}
          onChange={(e) => setGoals(e.target.value)}
          onBlur={() => goals !== profile.goals && persist({ goals })}
          rows={3}
          className="w-full rounded-[9px] border border-white/10 bg-bg p-3 text-[13px] leading-relaxed outline-none placeholder:text-label focus:border-lime/40"
        />
      </Card>

      <Card className="mb-3">
        <Eyebrow className="mb-2">BODY</Eyebrow>
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <label className="mb-1 block font-mono text-[9.5px] uppercase tracking-[0.12em] text-label">
              Height (cm)
            </label>
            <input
              type="number"
              inputMode="numeric"
              value={heightCm}
              onChange={(e) => setHeightCm(e.target.value)}
              onBlur={() => persist({ heightCm: parseFloat(heightCm) || undefined })}
              className="h-11 w-full rounded-[9px] border border-white/10 bg-bg px-3 font-mono text-[13px]"
            />
          </div>
          <div className="flex-[1.4]">
            <label className="mb-1 block font-mono text-[9.5px] uppercase tracking-[0.12em] text-label">
              Bodyweight kg{latestWeight && ` · last ${latestWeight.weightKg} (${latestWeight.date.slice(5)})`}
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                inputMode="decimal"
                placeholder="today"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="h-11 w-full rounded-[9px] border border-white/10 bg-bg px-3 font-mono text-[13px] placeholder:text-label"
              />
              <Btn
                disabled={!parseFloat(weight)}
                onClick={() => {
                  const entry = { date: todayStr(), weightKg: parseFloat(weight) }
                  persist({
                    bodyweight: [...profile.bodyweight.filter((b) => b.date !== entry.date), entry],
                  })
                  setWeight('')
                }}
              >
                Log
              </Btn>
            </div>
          </div>
        </div>
      </Card>

      <div className="mb-1.5 flex items-center justify-between px-1">
        <Eyebrow>TWEAKS · AI ALWAYS RESPECTS THESE</Eyebrow>
      </div>
      {profile.tweaks.map((t, i) => (
        <AccentCallout key={i} tone="teal" className="mb-1.5 !py-2.5">
          <div className="flex items-start justify-between gap-2">
            <p className="text-[13px] leading-snug text-body">“{t}”</p>
            <button
              className="text-faint"
              aria-label="remove tweak"
              onClick={() => persist({ tweaks: profile.tweaks.filter((_, j) => j !== i) })}
            >
              ✕
            </button>
          </div>
          <p className="mt-1 font-mono text-[8.5px] uppercase tracking-[0.1em] text-label">
            USED IN: CREATOR · REPORTS · CHAT
          </p>
        </AccentCallout>
      ))}
      <div className="mb-3 flex gap-2">
        <input
          placeholder="e.g. weak shoulders, left knee pain on deep squats"
          value={tweak}
          onChange={(e) => setTweak(e.target.value)}
          className="h-11 flex-1 rounded-[9px] border border-dashed border-white/18 bg-transparent px-3 text-[12.5px] outline-none placeholder:text-label"
        />
        <button
          className="font-medium text-lime disabled:opacity-40"
          disabled={!tweak.trim()}
          onClick={() => {
            persist({ tweaks: [...profile.tweaks, tweak.trim()] })
            setTweak('')
          }}
        >
          ＋ Add
        </button>
      </div>

      <Eyebrow className="mb-1.5 px-1">DAILY READINESS SOURCE</Eyebrow>
      <div className="mb-1.5 rounded-[10px] border border-lime/40 bg-card p-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[13px] font-medium">Daily check-in (20s)</div>
            <div className="text-[11px] text-label">
              Sleep + energy each morning{readinessToday && ` · today ${readinessToday.sleep}/${readinessToday.energy}`}
            </div>
          </div>
          <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-pos">active</span>
        </div>
      </div>
      <div className="mb-3 rounded-[10px] border border-white/8 bg-card p-3 opacity-70">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[13px] font-medium">Amazfit Balance</div>
            <div className="text-[11px] text-label">Zepp sync — coming later</div>
          </div>
          <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-label">standby</span>
        </div>
      </div>

      <SunkenCard className="mb-3 flex items-center justify-between !py-3">
        <span className="text-[13px] text-body">Offline logging</span>
        <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-pos">PWA · synced</span>
      </SunkenCard>

      <Card className="mb-3">
        <div className="flex items-center justify-between">
          <div>
            <Eyebrow>CYCLE</Eyebrow>
            <p className="mt-0.5 text-[12px] text-label">Edit your training split</p>
          </div>
          <Link to="/cycle">
            <Btn variant="ghost">Open</Btn>
          </Link>
        </div>
      </Card>

      {saved && <p className="mb-2 text-center font-mono text-[10px] uppercase tracking-[0.1em] text-lime">Saved ✓</p>}
      <p className="mb-2 text-center text-[11px] text-label">
        {user?.isAnonymous ? 'Signed in as dev user' : user?.email}
      </p>
      <Btn variant="danger" className="mb-8 w-full" onClick={() => signOut()}>
        Sign out
      </Btn>
    </Screen>
  )
}
