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
import { Coach } from './screens/Coach'
import { AICreate } from './screens/AICreate'
import { Trends } from './screens/Trends'
import { Summary } from './screens/Summary'
import { CycleSetup } from './screens/CycleSetup'
import { ProfileScreen } from './screens/Profile'
import { TabBar } from './components/TabBar'
import { ActiveWorkoutBanner } from './components/ActiveWorkoutBanner'

export default function App() {
  const { user, authReady, activeWorkout } = useStore()
  const location = useLocation()

  if (!authReady) {
    return <div className="grid min-h-dvh place-items-center text-muted">Loading…</div>
  }
  if (!user) return <SignIn />

  const onWorkoutScreen = location.pathname === '/workout'

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col">
      <main style={{ flex: 1, paddingBottom: 112, position: 'relative' }}>
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
          <Route path="/coach" element={<Coach />} />
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
    </div>
  )
}
