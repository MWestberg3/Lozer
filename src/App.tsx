import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { AuthenticatedShell } from './components/AuthenticatedShell'
import { RequireAuth } from './components/RequireAuth'
import { WhoIsThisPage } from './pages/WhoIsThisPage'
import { HomePage } from './pages/HomePage'
import { WorkoutPage } from './pages/WorkoutPage'
import { WorkoutPreviewPage } from './pages/WorkoutPreviewPage'
import { ProgressPage } from './pages/ProgressPage'
import { LibraryPage } from './pages/LibraryPage'
import { SettingsPage } from './pages/SettingsPage'
import { WorkoutPlanPage } from './pages/WorkoutPlanPage'
import { WorkoutPlanBuildPage } from './pages/WorkoutPlanBuildPage'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter basename="/Lozer">
        <Routes>
          <Route path="/" element={<WhoIsThisPage />} />
          <Route element={<RequireAuth />}>
            <Route element={<AuthenticatedShell />}>
              <Route path="/home" element={<HomePage />} />
              <Route path="/workout" element={<WorkoutPage />} />
              <Route path="/workout/preview" element={<WorkoutPreviewPage />} />
              <Route path="/library" element={<LibraryPage />} />
              <Route path="/progress" element={<ProgressPage />} />
              <Route path="/plan" element={<WorkoutPlanPage />} />
              <Route path="/plan/build" element={<WorkoutPlanBuildPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/history" element={<Navigate to="/settings" replace />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
