import { initializeApp } from 'firebase/app'
import {
  connectAuthEmulator,
  getAuth,
  GoogleAuthProvider,
  signInAnonymously,
  signInWithPopup,
  signOut as fbSignOut,
} from 'firebase/auth'
import {
  connectFirestoreEmulator,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore'

// Real project config comes from Vite env (.env.local / hosting env).
// Without one we run against the local emulators with a demo project,
// which is how the app is developed and tested.
const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined
export const usingEmulators = !projectId

const app = initializeApp(
  usingEmulators
    ? { apiKey: 'demo', authDomain: 'demo-hola-gym.firebaseapp.com', projectId: 'demo-hola-gym' }
    : {
        apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
        authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
        projectId,
        storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
        appId: import.meta.env.VITE_FIREBASE_APP_ID,
      },
)

// Offline-first: gyms have bad reception. Firestore keeps every write locally
// and syncs when the network returns; multi-tab safe.
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
})

export const auth = getAuth(app)

if (usingEmulators) {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
  connectFirestoreEmulator(db, '127.0.0.1', 8080)
}

export function signInWithGoogle() {
  return signInWithPopup(auth, new GoogleAuthProvider())
}

/** Emulator-only convenience login so the app is usable without a Google account. */
export function devSignIn() {
  return signInAnonymously(auth)
}

export function signOut() {
  return fbSignOut(auth)
}
