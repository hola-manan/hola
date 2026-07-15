import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { onAuthStateChanged, type User } from 'firebase/auth'
import { auth } from './lib/firebase'
import { aiSubscriptions, repo, subscriptions } from './lib/repo'
import { autoAdvanceRestDays, todayStr } from './lib/cycle'
import { EXERCISES } from './data/exercises'
import type { Cycle, Exercise, Preset, Profile, Readiness, Workout } from './types'

export const DEFAULT_PROFILE: Profile = {
  goals: '',
  bodyweight: [],
  tweaks: [],
  unit: 'kg',
}

interface Store {
  user: User | null
  authReady: boolean
  workouts: Workout[] // newest first
  presets: Preset[]
  cycle: Cycle | null
  profile: Profile
  /** Catalog + user's custom exercises, by id. */
  exercises: Map<string, Exercise>
  exerciseList: Exercise[]
  activeWorkout: Workout | null
  /** Today's readiness check-in, if filled. */
  readinessToday: Readiness | null
}

const StoreContext = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [authReady, setAuthReady] = useState(false)
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [presets, setPresets] = useState<Preset[]>([])
  const [customExercises, setCustomExercises] = useState<Exercise[]>([])
  const [cycle, setCycle] = useState<Cycle | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [readinessToday, setReadinessToday] = useState<Readiness | null>(null)

  useEffect(
    () =>
      onAuthStateChanged(auth, (u) => {
        setUser(u)
        setAuthReady(true)
      }),
    [],
  )

  useEffect(() => {
    if (!user) {
      setWorkouts([])
      setPresets([])
      setCustomExercises([])
      setCycle(null)
      setProfile(null)
      setReadinessToday(null)
      return
    }
    const uid = user.uid
    const unsubs = [
      subscriptions.workouts(uid, setWorkouts),
      subscriptions.presets(uid, setPresets),
      subscriptions.customExercises(uid, setCustomExercises),
      subscriptions.cycle(uid, setCycle),
      subscriptions.profile(uid, setProfile),
      aiSubscriptions.readinessToday(uid, todayStr(), setReadinessToday),
    ]
    return () => unsubs.forEach((u) => u())
  }, [user])

  // Rest days auto-advance at midnight: reconcile whenever cycle loads/changes.
  useEffect(() => {
    if (!user || !cycle) return
    const advanced = autoAdvanceRestDays(cycle)
    if (advanced.pointer !== cycle.pointer || advanced.pointerDate !== cycle.pointerDate) {
      repo.saveCycle(user.uid, advanced)
    }
  }, [user, cycle])

  const value = useMemo<Store>(() => {
    const exerciseList = [...EXERCISES, ...customExercises]
    return {
      user,
      authReady,
      workouts,
      presets,
      cycle,
      profile: profile ?? DEFAULT_PROFILE,
      exercises: new Map(exerciseList.map((e) => [e.id, e])),
      exerciseList,
      activeWorkout: workouts.find((w) => w.status === 'in_progress') ?? null,
      readinessToday,
    }
  }, [user, authReady, workouts, presets, customExercises, cycle, profile, readinessToday])

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore(): Store {
  const store = useContext(StoreContext)
  if (!store) throw new Error('useStore outside StoreProvider')
  return store
}

/** Uid of the signed-in user; screens behind RequireAuth can rely on it. */
export function useUid(): string {
  const { user } = useStore()
  if (!user) throw new Error('useUid outside authenticated tree')
  return user.uid
}
