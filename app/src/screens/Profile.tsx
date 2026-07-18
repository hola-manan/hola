import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signOut } from '../lib/firebase'
import { importStrongCSV } from '../lib/importStrong'
import { repo } from '../lib/repo'
import { ai } from '../lib/ai'
import { todayStr } from '../lib/cycle'
import { useStore, useUid, DEFAULT_PROFILE } from '../store'

const MONO = "'IBM Plex Mono',monospace"
const SANS = "'IBM Plex Sans',system-ui,sans-serif"
const CONDENSED = "'IBM Plex Sans Condensed',sans-serif"

export function ProfileScreen() {
  const { profile, user, exercises, wearable } = useStore()
  const uid = useUid()
  const navigate = useNavigate()
  const [goals, setGoals] = useState(profile.goals)
  const [heightCm, setHeightCm] = useState(profile.heightCm?.toString() ?? '')
  const [weight, setWeight] = useState('')
  const [tweak, setTweak] = useState('')
  const [importing, setImporting] = useState(false)
  const [syncing, setSyncing] = useState(false)
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
    <div style={{ height: '100%', background: '#0b0d10', color: '#e9ecef', fontFamily: SANS, boxSizing: 'border-box', padding: '72px 0 0', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '0 20px', fontFamily: CONDENSED, fontWeight: 700, fontSize: 32 }}>Profile</div>
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '0 20px 30px', display: 'flex', flexDirection: 'column' }}>

      <div style={{ display: 'flex', gap: 14, marginTop: 12, background: '#14171c', border: '1px solid rgba(255,255,255,.08)', borderRadius: 10, padding: '11px 14px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: MONO, fontSize: 15 }}>{profile.heightCm ?? '—'}</div>
          <div style={{ fontSize: 9.5, color: '#5a6270', marginTop: 1 }}>HEIGHT CM</div>
        </div>
        <div style={{ flex: 1, borderLeft: '1px solid rgba(255,255,255,.07)', paddingLeft: 12 }}>
          <div style={{ fontFamily: MONO, fontSize: 15 }}>{latestWeight?.weightKg ?? '—'}</div>
          <div style={{ fontSize: 9.5, color: '#5a6270', marginTop: 1 }}>WEIGHT KG</div>
        </div>
        <div style={{ flex: 1, borderLeft: '1px solid rgba(255,255,255,.07)', paddingLeft: 12 }}>
          <div style={{ fontFamily: MONO, fontSize: 15 }}>KG</div>
          <div style={{ fontSize: 9.5, color: '#5a6270', marginTop: 1 }}>UNITS · 0.25</div>
        </div>
      </div>

      <div style={{ marginTop: 14, fontFamily: MONO, fontSize: 9.5, letterSpacing: '.12em', color: '#5a6270' }}>GOALS</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
        <textarea
          placeholder="e.g. Build shoulders and back width, cut to 72 kg by December"
          value={goals}
          onChange={(e) => setGoals(e.target.value)}
          onBlur={() => goals !== profile.goals && persist({ goals })}
          rows={3}
          style={{ width: '100%', background: '#14171c', border: '1px solid rgba(255,255,255,.08)', borderRadius: 10, padding: '11px 14px', fontSize: 13, color: '#e9ecef', fontFamily: SANS, outline: 'none', resize: 'vertical' }}
        />
      </div>

      <div style={{ marginTop: 14, fontFamily: MONO, fontSize: 9.5, letterSpacing: '.12em', color: '#5a6270' }}>UPDATE VITALS</div>
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <div style={{ flex: 1, background: '#14171c', border: '1px solid rgba(255,255,255,.1)', borderRadius: 9, padding: '10px 12px' }}>
          <div style={{ fontSize: 9.5, color: '#5a6270', fontFamily: MONO }}>HEIGHT</div>
          <input
            type="number"
            inputMode="numeric"
            value={heightCm}
            onChange={(e) => setHeightCm(e.target.value)}
            onBlur={() => persist({ heightCm: parseFloat(heightCm) || undefined })}
            style={{ fontFamily: MONO, fontSize: 14, marginTop: 2, background: 'transparent', border: 'none', color: '#fff', width: '100%', outline: 'none' }}
          />
        </div>
        <div style={{ flex: 1.4, background: '#14171c', border: '1px solid rgba(255,255,255,.1)', borderRadius: 9, padding: '10px 12px' }}>
          <div style={{ fontSize: 9.5, color: '#5a6270', fontFamily: MONO }}>LOG WEIGHT KG</div>
          <div style={{ display: 'flex', gap: 6, marginTop: 2 }}>
            <input
              type="number"
              inputMode="decimal"
              placeholder="today"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              style={{ flex: 1, fontFamily: MONO, fontSize: 14, background: 'transparent', border: 'none', color: '#fff', width: '100%', outline: 'none' }}
            />
            <button
              disabled={!parseFloat(weight)}
              onClick={() => {
                const entry = { date: todayStr(), weightKg: parseFloat(weight) }
                persist({
                  bodyweight: [...profile.bodyweight.filter((b) => b.date !== entry.date), entry],
                })
                setWeight('')
              }}
              style={{ color: parseFloat(weight) ? '#c8f04b' : '#5a6270', fontSize: 12, fontWeight: 600, background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
            >
              Log
            </button>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: '.12em', color: '#5a6270' }}>TWEAKS · AI ALWAYS RESPECTS THESE</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
        {profile.tweaks.map((t, i) => (
          <div key={i} style={{ background: '#14171c', borderLeft: '2px solid #57c4cc', borderRadius: '0 10px 10px 0', padding: '10px 14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ fontSize: 12.5, color: '#c7ccd4' }}>"{t}"</div>
              <button
                style={{ color: '#5a6270', fontSize: 13, background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                onClick={() => persist({ tweaks: profile.tweaks.filter((_, j) => j !== i) })}
              >✕</button>
            </div>
            <div style={{ fontSize: 10, color: '#5a6270', marginTop: 3, fontFamily: MONO }}>USED IN: CREATOR · REPORTS · CHAT</div>
          </div>
        ))}
        <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
          <input
            placeholder="e.g. weak shoulders"
            value={tweak}
            onChange={(e) => setTweak(e.target.value)}
            style={{ flex: 1, background: 'transparent', border: '1px dashed rgba(255,255,255,.18)', borderRadius: 9, padding: '9px 12px', fontSize: 12.5, color: '#e9ecef', outline: 'none' }}
          />
          <button
            disabled={!tweak.trim()}
            onClick={() => {
              persist({ tweaks: [...profile.tweaks, tweak.trim()] })
              setTweak('')
            }}
            style={{ color: tweak.trim() ? '#c8f04b' : '#5a6270', fontSize: 13, fontWeight: 500, background: 'none', border: 'none', padding: '0 8px', cursor: 'pointer' }}
          >
            ＋ Add
          </button>
        </div>
      </div>

      <div style={{ marginTop: 14, fontFamily: MONO, fontSize: 9.5, letterSpacing: '.12em', color: '#5a6270' }}>DAILY READINESS SOURCE</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#14171c', border: '1px solid rgba(200,240,75,.35)', borderRadius: 10, padding: '11px 14px' }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Daily check-in (20s)</div>
            <div style={{ fontSize: 10.5, color: '#5a6270', marginTop: 1 }}>Sleep + energy each morning</div>
          </div>
          <span style={{ fontFamily: MONO, fontSize: 9.5, color: '#c8f04b', fontWeight: 600 }}>ACTIVE</span>
        </div>
        <div style={{ background: '#101318', border: '1px solid rgba(255,255,255,.08)', borderRadius: 10, padding: '11px 14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: wearable?.enabled ? 600 : 400 }}>Amazfit Balance (Zepp)</div>
              {wearable?.enabled ? (
                <div style={{ fontSize: 10.5, color: '#5a6270', marginTop: 1 }}>
                  {wearable.lastStatus === 'ok' 
                    ? `Last sync ${wearable.lastSyncAt ? new Date(wearable.lastSyncAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'never'} · data through ${wearable.lastDataDate ?? '—'}` 
                    : (wearable.lastError || 'Sync failed')}
                </div>
              ) : (
                <div style={{ fontSize: 10.5, color: '#5a6270', marginTop: 1 }}>Automated nightly sync</div>
              )}
            </div>
            {wearable?.enabled ? (
              <span style={{ fontFamily: MONO, fontSize: 9.5, color: wearable.lastStatus === 'ok' ? '#57c4cc' : '#e0596b', fontWeight: 600 }}>
                {wearable.lastStatus === 'ok' ? 'CONNECTED' : 'ERROR'}
              </span>
            ) : (
              <button
                onClick={() => repo.saveWearable(uid, { enabled: true, provider: 'zepp' })}
                style={{ fontFamily: MONO, fontSize: 10, color: '#c8f04b', background: 'none', border: 'none', fontWeight: 600, padding: 0 }}
              >
                ENABLE
              </button>
            )}
          </div>
          {wearable?.enabled && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,.05)' }}>
              <button
                onClick={() => repo.saveWearable(uid, { enabled: false, provider: 'zepp' })}
                style={{ fontSize: 11, color: '#5a6270', background: 'none', border: 'none', padding: 0 }}
              >
                Disable
              </button>
              <button
                disabled={syncing}
                onClick={async () => {
                  setSyncing(true)
                  try { await ai.syncZepp({}) } catch (e) { alert((e as Error).message) } finally { setSyncing(false) }
                }}
                style={{ fontFamily: MONO, fontSize: 11, color: '#57c4cc', background: 'none', border: 'none', padding: 0, opacity: syncing ? 0.5 : 1 }}
              >
                {syncing ? 'SYNCING...' : 'SYNC NOW'}
              </button>
            </div>
          )}
        </div>
      </div>

      <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#101318', border: '1px solid rgba(255,255,255,.08)', borderRadius: 10, padding: '11px 14px' }}>
        <span style={{ fontSize: 12.5, color: '#8b93a0' }}>Offline logging</span>
        <span style={{ fontFamily: MONO, fontSize: 10, color: '#63d08a' }}>PWA · SYNCED</span>
      </div>

      <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#14171c', border: '1px solid rgba(255,255,255,.08)', borderRadius: 10, padding: '11px 14px' }}>
        <div>
          <div style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: '.12em', color: '#5a6270' }}>CYCLE</div>
          <div style={{ fontSize: 12, color: '#8b93a0', marginTop: 2 }}>Edit your training split</div>
        </div>
        <Link to="/cycle" style={{ textDecoration: 'none' }}>
          <button style={{ color: '#e9ecef', fontSize: 12, fontWeight: 500, background: 'rgba(255,255,255,.1)', border: 'none', padding: '6px 12px', borderRadius: 6, cursor: 'pointer' }}>Open</button>
        </Link>
      </div>

      <div style={{ marginTop: 24, paddingBottom: 24, textAlign: 'center' }}>
        {saved && <div style={{ fontFamily: MONO, fontSize: 10, color: '#c8f04b', letterSpacing: '.1em', marginBottom: 8 }}>SAVED ✓</div>}
        <div style={{ fontSize: 11, color: '#5a6270', marginBottom: 12 }}>
          {user?.isAnonymous ? 'Signed in as dev user' : user?.email}
        </div>
        <button
          disabled={importing}
          onClick={async () => {
            setImporting(true)
            try {
              const count = await importStrongCSV(uid, exercises)
              alert(`Successfully imported ${count} workouts from Strong!`)
            } catch (err: any) {
              alert('Import failed: ' + err.message)
            } finally {
              setImporting(false)
            }
          }}
          style={{ width: '100%', marginBottom: 12, background: 'rgba(87,196,204,.15)', border: '1px solid rgba(87,196,204,.4)', borderRadius: 9, padding: '12px 0', color: '#57c4cc', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}
        >
          {importing ? 'Importing...' : 'Run One-Time Strong CSV Import'}
        </button>
        <button onClick={() => signOut()} style={{ width: '100%', background: 'none', border: '1px solid rgba(224,89,107,.4)', borderRadius: 9, padding: '12px 0', color: '#e0596b', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>
          Sign out
        </button>
        {/* tap toggles the layout probe overlay — no URL bar in the installed PWA */}
        <div
          onClick={() =>
            navigate(window.location.search.includes('probe') ? '/profile' : '/profile?probe')
          }
          style={{ marginTop: 10, textAlign: 'center', fontFamily: MONO, fontSize: 9, letterSpacing: '.12em', color: '#3d434c', cursor: 'pointer' }}
        >
          BUILD {__BUILD_TAG__}
        </div>
      </div>
      </div>
    </div>
  )
}
