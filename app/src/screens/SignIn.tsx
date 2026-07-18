import { useState } from 'react'
import { devSignIn, signInWithGoogle, usingEmulators } from '../lib/firebase'

const MONO = "'IBM Plex Mono',monospace"
const SANS = "'IBM Plex Sans',system-ui,sans-serif"
const CONDENSED = "'IBM Plex Sans Condensed',sans-serif"

export function SignIn() {
  const [error, setError] = useState('')
  const run = (fn: () => Promise<unknown>) => () =>
    fn().catch((e: Error) => setError(e.message))

  return (
    <div style={{ minHeight: '100%', background: '#0b0d10', color: '#e9ecef', fontFamily: SANS, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32, boxSizing: 'border-box' }}>
      <div style={{ textAlign: 'center' }}>
        <svg viewBox="0 0 64 64" style={{ height: 56, width: 56, margin: '0 auto' }}>
          <g fill="#c8f04b">
            <rect x="10" y="22" width="8" height="20" rx="2" />
            <rect x="46" y="22" width="8" height="20" rx="2" />
            <rect x="16" y="17" width="7" height="30" rx="2" />
            <rect x="41" y="17" width="7" height="30" rx="2" />
          </g>
          <rect x="23" y="29" width="18" height="6" rx="2" fill="#57c4cc" />
        </svg>
        <div style={{ marginTop: 16, fontFamily: CONDENSED, fontSize: 38, fontWeight: 700, lineHeight: 1 }}>Hola Gym</div>
        <div style={{ marginTop: 6, fontFamily: MONO, fontSize: 10, textTransform: 'uppercase', letterSpacing: '.14em', color: '#5a6270' }}>
          Personal gym tracking · insights
        </div>
      </div>
      
      <div style={{ width: '100%', maxWidth: 300, marginTop: 40, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <button
          onClick={run(signInWithGoogle)}
          style={{ width: '100%', background: '#c8f04b', color: '#0b0d10', borderRadius: 10, padding: '14px 16px', fontSize: 15, fontWeight: 600, border: 'none', cursor: 'pointer' }}
        >
          Continue with Google
        </button>
        
        {usingEmulators && (
          <button
            onClick={run(devSignIn)}
            style={{ width: '100%', background: 'transparent', border: '1px solid rgba(255,255,255,.14)', color: '#e9ecef', borderRadius: 10, padding: '14px 16px', fontSize: 15, fontWeight: 500, cursor: 'pointer' }}
          >
            Dev sign-in (emulator)
          </button>
        )}
        
        {error && <div style={{ fontSize: 13, color: '#e0596b', textAlign: 'center', marginTop: 8 }}>{error}</div>}
      </div>
      <div style={{ position: 'fixed', bottom: 10, left: 0, right: 0, textAlign: 'center', fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, letterSpacing: '.12em', color: '#3d434c' }}>
        BUILD {__BUILD_TAG__}
      </div>
    </div>
  )
}
