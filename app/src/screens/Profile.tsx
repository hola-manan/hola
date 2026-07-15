import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { signOut } from '../lib/firebase'
import { repo } from '../lib/repo'
import { todayStr } from '../lib/cycle'
import { useStore, useUid, DEFAULT_PROFILE } from '../store'
import { Btn, Card, Screen } from '../components/ui'

export function ProfileScreen() {
  const { profile, user } = useStore()
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
      <Card className="mb-3">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-ink-dim">Goals</h2>
        <textarea
          placeholder="e.g. Build shoulders and back width, cut to 72 kg by December"
          value={goals}
          onChange={(e) => setGoals(e.target.value)}
          onBlur={() => goals !== profile.goals && persist({ goals })}
          rows={3}
          className="w-full rounded-xl bg-surface-2 p-3 text-sm"
        />
      </Card>

      <Card className="mb-3">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-ink-dim">Body</h2>
        <div className="mb-3 flex items-end gap-3">
          <div className="flex-1">
            <label className="mb-1 block text-xs text-ink-dim">Height (cm)</label>
            <input
              type="number"
              inputMode="numeric"
              value={heightCm}
              onChange={(e) => setHeightCm(e.target.value)}
              onBlur={() => persist({ heightCm: parseFloat(heightCm) || undefined })}
              className="h-11 w-full rounded-xl bg-surface-2 px-3"
            />
          </div>
          <div className="flex-1">
            <label className="mb-1 block text-xs text-ink-dim">
              Bodyweight (kg){latestWeight && ` — last: ${latestWeight.weightKg} on ${latestWeight.date}`}
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                inputMode="decimal"
                placeholder="today"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="h-11 w-full rounded-xl bg-surface-2 px-3"
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

      <Card className="mb-3">
        <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-ink-dim">Tweaks</h2>
        <p className="mb-2 text-xs text-ink-dim">
          Persistent notes the AI coach will always respect — weak points, injuries, preferences.
        </p>
        {profile.tweaks.map((t, i) => (
          <div key={i} className="mb-1 flex items-center justify-between rounded-lg bg-surface-2 px-3 py-2 text-sm">
            <span>{t}</span>
            <button
              className="text-ink-dim"
              onClick={() => persist({ tweaks: profile.tweaks.filter((_, j) => j !== i) })}
            >
              ✕
            </button>
          </div>
        ))}
        <div className="mt-2 flex gap-2">
          <input
            placeholder="e.g. weak shoulders, left knee pain on deep squats"
            value={tweak}
            onChange={(e) => setTweak(e.target.value)}
            className="h-11 flex-1 rounded-xl bg-surface-2 px-3 text-sm"
          />
          <Btn
            variant="ghost"
            disabled={!tweak.trim()}
            onClick={() => {
              persist({ tweaks: [...profile.tweaks, tweak.trim()] })
              setTweak('')
            }}
          >
            Add
          </Btn>
        </div>
      </Card>

      <Card className="mb-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-dim">Cycle</h2>
            <p className="text-xs text-ink-dim">Edit your training split</p>
          </div>
          <Link to="/cycle">
            <Btn variant="ghost">Open</Btn>
          </Link>
        </div>
      </Card>

      {saved && <p className="mb-2 text-center text-xs text-accent">Saved ✓</p>}
      <p className="mb-2 text-center text-xs text-ink-dim">
        {user?.isAnonymous ? 'Signed in as dev user' : user?.email}
      </p>
      <Btn variant="danger" className="w-full" onClick={() => signOut()}>
        Sign out
      </Btn>
    </Screen>
  )
}
