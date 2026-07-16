import { useState } from 'react'
import { devSignIn, signInWithGoogle, usingEmulators } from '../lib/firebase'

export function SignIn() {
  const [error, setError] = useState('')
  const run = (fn: () => Promise<unknown>) => () =>
    fn().catch((e: Error) => setError(e.message))

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col items-center justify-center gap-6 px-8 text-ink">
      <div className="text-center">
        <svg viewBox="0 0 64 64" className="mx-auto h-14 w-14">
          <g fill="#c8f04b">
            <rect x="10" y="22" width="8" height="20" rx="2" />
            <rect x="46" y="22" width="8" height="20" rx="2" />
            <rect x="16" y="17" width="7" height="30" rx="2" />
            <rect x="41" y="17" width="7" height="30" rx="2" />
          </g>
          <rect x="23" y="29" width="18" height="6" rx="2" fill="#57c4cc" />
        </svg>
        <h1 className="mt-4 font-condensed text-[38px] font-bold leading-none">Hola Gym</h1>
        <p className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-label">
          Personal gym tracking · insights
        </p>
      </div>
      <button
        onClick={run(signInWithGoogle)}
        className="w-full rounded-[10px] bg-lime py-3 font-semibold text-on-lime active:opacity-70"
      >
        Continue with Google
      </button>
      {usingEmulators && (
        <button
          onClick={run(devSignIn)}
          className="w-full rounded-[10px] border border-white/14 py-3 text-ink active:opacity-70"
        >
          Dev sign-in (emulator)
        </button>
      )}
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  )
}
