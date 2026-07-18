import { useEffect, useState } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useStore } from './store'
import { SignIn } from './screens/SignIn'
import { Home } from './screens/Home'
import { WorkoutScreen } from './screens/Workout'
import { BulkEntry } from './screens/BulkEntry'
import { History } from './screens/History'
import { WorkoutDetail } from './screens/WorkoutDetail'
import { Exercises } from './screens/Exercises'
import { ExerciseDetail } from './screens/ExerciseDetail'
import { Presets } from './screens/Presets'
import { PresetEdit } from './screens/PresetEdit'
import { Coach, CoachEntry } from './screens/Coach'
import { CoachThreads } from './screens/CoachThreads'
import { AICreate } from './screens/AICreate'
import { Trends } from './screens/Trends'
import { Summary } from './screens/Summary'
import { CycleSetup } from './screens/CycleSetup'
import { ProfileScreen } from './screens/Profile'
import { TabBar } from './components/TabBar'
import { ActiveWorkoutBanner } from './components/ActiveWorkoutBanner'

/** Layout diagnostics overlay — open the app with `?probe` to read real
 *  safe-area/viewport numbers off a device. */
function InsetProbe() {
  const [info, setInfo] = useState('')
  useEffect(() => {
    const probe = document.createElement('div')
    probe.style.cssText =
      'position:fixed;visibility:hidden;padding-top:env(safe-area-inset-top);padding-bottom:env(safe-area-inset-bottom)'
    document.body.appendChild(probe)
    const update = () => {
      const cs = getComputedStyle(probe)
      const root = document.getElementById('root')
      setInfo(
        [
          `build ${__BUILD_TAG__}`,
          `inset-top ${cs.paddingTop}`,
          `inset-bottom ${cs.paddingBottom}`,
          `innerH ${window.innerHeight}`,
          `clientH ${document.documentElement.clientHeight}`,
          `rootH ${root?.offsetHeight ?? '?'}`,
          `visualH ${Math.round(window.visualViewport?.height ?? 0)}`,
          `scrollY ${window.scrollY}`,
        ].join('\n'),
      )
    }
    update()
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('resize', update)
      probe.remove()
    }
  }, [])
  return (
    <pre
      style={{
        position: 'fixed',
        top: 70,
        left: 8,
        zIndex: 99,
        margin: 0,
        background: 'rgba(0,0,0,.85)',
        color: '#c8f04b',
        fontSize: 11,
        lineHeight: 1.5,
        padding: 10,
        borderRadius: 8,
        fontFamily: "'IBM Plex Mono',monospace",
        pointerEvents: 'none',
      }}
    >
      {info}
    </pre>
  )
}

export default function App() {
  const { user, authReady, activeWorkout } = useStore()
  const location = useLocation()
  const probing = window.location.search.includes('probe')

  if (!authReady) {
    return <div className="grid min-h-dvh place-items-center text-muted">Loading…</div>
  }
  if (!user)
    return (
      <>
        <SignIn />
        {probing && <InsetProbe />}
      </>
    )

  const onWorkoutScreen = location.pathname === '/workout'

  return (
    <div className="mx-auto flex h-full max-w-lg flex-col">
      <main style={{ flex: 1, minHeight: 0, position: 'relative' }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/workout" element={<WorkoutScreen />} />
          <Route path="/bulk" element={<BulkEntry />} />
          <Route path="/history" element={<History />} />
          <Route path="/history/:id" element={<WorkoutDetail />} />
          <Route path="/exercises" element={<Exercises />} />
          <Route path="/exercises/:id" element={<ExerciseDetail />} />
          <Route path="/presets" element={<Presets />} />
          <Route path="/presets/:id" element={<PresetEdit />} />
          <Route path="/coach" element={<CoachEntry />} />
          <Route path="/coach/new" element={<Coach />} />
          <Route path="/coach/threads" element={<CoachThreads />} />
          <Route path="/coach/:id" element={<Coach />} />
          <Route path="/create" element={<AICreate />} />
          <Route path="/trends" element={<Trends />} />
          <Route path="/summary" element={<Summary />} />
          <Route path="/cycle" element={<CycleSetup />} />
          <Route path="/profile" element={<ProfileScreen />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      {activeWorkout && !onWorkoutScreen && <ActiveWorkoutBanner workout={activeWorkout} />}
      <TabBar />
      {probing && <InsetProbe />}
    </div>
  )
}
