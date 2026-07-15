import { useState } from 'react'
import { devSignIn, signInWithGoogle, usingEmulators } from '../lib/firebase'

export function SignIn() {
  const [error, setError] = useState('')
  const run = (fn: () => Promise<unknown>) => () =>
    fn().catch((e: Error) => setError(e.message))

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col items-center justify-center gap-6 px-8 text-ink">
      <div className="text-center">
        <div className="text-5xl">🏋️</div>
        <h1 className="mt-3 text-3xl font-bold">Hola Gym</h1>
        <p className="mt-1 text-sm text-ink-dim">Personal gym tracking & insights</p>
      </div>
      <button
        onClick={run(signInWithGoogle)}
        className="w-full rounded-xl bg-accent py-3 font-semibold text-accent-ink active:opacity-70"
      >
        Continue with Google
      </button>
      {usingEmulators && (
        <button
          onClick={run(devSignIn)}
          className="w-full rounded-xl bg-surface-2 py-3 text-ink active:opacity-70"
        >
          Dev sign-in (emulator)
        </button>
      )}
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  )
}
