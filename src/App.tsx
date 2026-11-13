import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { AuthenticatedShell } from './components/AuthenticatedShell'
import { RequireAuth } from './components/RequireAuth'
import { WhoIsThisPage } from './pages/WhoIsThisPage'
import { HomePage } from './pages/HomePage'
import { WorkoutPage } from './pages/WorkoutPage'
import { ProgressPage } from './pages/ProgressPage'
import { HistoryPage } from './pages/HistoryPage'

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
              <Route path="/progress" element={<ProgressPage />} />
              <Route path="/history" element={<HistoryPage />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
