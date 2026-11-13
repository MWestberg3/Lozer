import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useAuth } from './AuthContext'
import {
  appendSession,
  getProgramForUser,
  loadState,
  updateUserProfile,
} from '../storage/db'
import type { AppState, WorkoutSession } from '../types/workout'

interface AppContextValue {
  state: AppState
  activeUser: AppState['profile']
  program: ReturnType<typeof getProgramForUser>
  renameUser: (displayName: string) => void
  completeWorkout: (session: WorkoutSession) => void
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [state, setState] = useState<AppState | null>(null)

  const uid = user?.uid
  const displayName = user?.displayName ?? user?.email ?? 'Athlete'

  useEffect(() => {
    if (!uid) {
      setState(null)
      return
    }
    setState(loadState(uid, displayName))
  }, [uid, displayName])

  const activeUser = state?.profile
  const program = state ? getProgramForUser(state) : undefined

  const renameUser = useCallback(
    (name: string) => {
      if (!uid || !state) return
      setState((prev) => (prev ? updateUserProfile(uid, prev, { displayName: name }) : prev))
    },
    [uid, state],
  )

  const completeWorkout = useCallback(
    (session: WorkoutSession) => {
      if (!uid || !state) return
      setState((prev) => (prev ? appendSession(uid, prev, session) : prev))
    },
    [uid, state],
  )

  const value = useMemo(() => {
    if (!state || !activeUser || !program) {
      return null
    }
    return {
      state,
      activeUser,
      program,
      renameUser,
      completeWorkout,
    }
  }, [state, activeUser, program, renameUser, completeWorkout])

  if (!value) {
    return (
      <div className="landing">
        <p className="landing-subtitle" style={{ textAlign: 'center' }}>
          Loading your plan…
        </p>
      </div>
    )
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) {
    throw new Error('useApp must be used within AppProvider')
  }
  return ctx
}
