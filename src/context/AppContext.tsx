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
  applyProgram,
  getProgramForUser,
  loadStateAsync,
  setExerciseDisliked,
  updateEnabledLibraryEquipment,
  updatePrimaryColorId,
  updateGeneratorSettings,
  updateUserProfile,
} from '../storage/db'
import { fetchExerciseCatalog } from '../data/exerciseLibrary'
import {
  generateProgram,
  recentExerciseIdsFromSessions,
  scrubDislikedFromProgram,
} from '../lib/workoutGenerator'
import type {
  AppState,
  GeneratorSettings,
  LibraryExercise,
  Program,
  ThemeColorId,
  WorkoutSession,
} from '../types/workout'

interface AppContextValue {
  state: AppState
  activeUser: AppState['profile']
  program: ReturnType<typeof getProgramForUser>
  catalog: LibraryExercise[]
  catalogLoading: boolean
  renameUser: (displayName: string) => void
  completeWorkout: (session: WorkoutSession) => void
  generatePlan: (program: Program) => void
  saveGeneratorSettings: (settings: GeneratorSettings) => void
  saveEquipmentPreferences: (enabledLibraryEquipment: string[]) => void
  savePrimaryColor: (colorId: ThemeColorId) => void
  dislikedExerciseIds: string[]
  isExerciseDisliked: (exerciseId: string) => boolean
  setExerciseDislikedPreference: (exerciseId: string, disliked: boolean) => void
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [state, setState] = useState<AppState | null>(null)
  const [stateHydrating, setStateHydrating] = useState(true)
  const [catalog, setCatalog] = useState<LibraryExercise[]>([])
  const [catalogLoading, setCatalogLoading] = useState(true)

  const uid = user?.uid
  const displayName = user?.displayName ?? user?.email ?? 'Athlete'

  useEffect(() => {
    if (!uid) {
      setState(null)
      setStateHydrating(false)
      return
    }
    let cancelled = false
    setStateHydrating(true)
    setState(null)
    void loadStateAsync(uid, displayName).then((loaded) => {
      if (!cancelled) {
        setState(loaded)
        setStateHydrating(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [uid, displayName])

  useEffect(() => {
    let cancelled = false
    setCatalogLoading(true)
    fetchExerciseCatalog()
      .then((items) => {
        if (!cancelled) setCatalog(items)
      })
      .finally(() => {
        if (!cancelled) setCatalogLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!uid || !state || catalog.length === 0) return
    const program = getProgramForUser(state)
    const needsPlan = program.days.length === 0 || program.id === 'pending-catalog'
    if (!needsPlan) return
    const recent = recentExerciseIdsFromSessions(state.sessions)
    const generated = generateProgram(
      state.generatorSettings,
      state.enabledLibraryEquipment,
      recent,
      catalog,
      state.dislikedExerciseIds,
    )
    setState((prev) => (prev ? applyProgram(uid, prev, generated) : prev))
  }, [uid, state, catalog])

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

  const generatePlan = useCallback(
    (nextProgram: Program) => {
      if (!uid || !state) return
      setState((prev) => (prev ? applyProgram(uid, prev, nextProgram) : prev))
    },
    [uid, state],
  )

  const saveGeneratorSettings = useCallback(
    (settings: GeneratorSettings) => {
      if (!uid || !state) return
      setState((prev) => (prev ? updateGeneratorSettings(uid, prev, settings) : prev))
    },
    [uid, state],
  )

  const saveEquipmentPreferences = useCallback(
    (enabledLibraryEquipment: string[]) => {
      if (!uid || !state) return
      setState((prev) => (prev ? updateEnabledLibraryEquipment(uid, prev, enabledLibraryEquipment) : prev))
    },
    [uid, state],
  )

  const savePrimaryColor = useCallback(
    (colorId: ThemeColorId) => {
      if (!uid || !state) return
      setState((prev) => (prev ? updatePrimaryColorId(uid, prev, colorId) : prev))
    },
    [uid, state],
  )

  const setExerciseDislikedPreference = useCallback(
    (exerciseId: string, disliked: boolean) => {
      if (!uid || !state || catalog.length === 0) return
      setState((prev) => {
        if (!prev) return prev
        const withPref = setExerciseDisliked(uid, prev, exerciseId, disliked)
        if (!disliked) return withPref
        const recent = recentExerciseIdsFromSessions(withPref.sessions)
        const scrubbed = scrubDislikedFromProgram(
          getProgramForUser(withPref),
          withPref.dislikedExerciseIds,
          withPref.generatorSettings,
          withPref.enabledLibraryEquipment,
          recent,
          catalog,
        )
        return applyProgram(uid, withPref, scrubbed)
      })
    },
    [uid, state, catalog],
  )

  const isExerciseDisliked = useCallback(
    (exerciseId: string) => state?.dislikedExerciseIds.includes(exerciseId) ?? false,
    [state?.dislikedExerciseIds],
  )

  const value = useMemo(() => {
    if (!state || !activeUser || !program) {
      return null
    }
    return {
      state,
      activeUser,
      program,
      catalog,
      catalogLoading,
      renameUser,
      completeWorkout,
      generatePlan,
      saveGeneratorSettings,
      saveEquipmentPreferences,
      savePrimaryColor,
      dislikedExerciseIds: state.dislikedExerciseIds,
      isExerciseDisliked,
      setExerciseDislikedPreference,
    }
  }, [
    state,
    activeUser,
    program,
    catalog,
    catalogLoading,
    renameUser,
    completeWorkout,
    generatePlan,
    saveGeneratorSettings,
    saveEquipmentPreferences,
    savePrimaryColor,
    isExerciseDisliked,
    setExerciseDislikedPreference,
  ])

  if (!value || stateHydrating) {
    return (
      <div className="landing">
        <p className="landing-subtitle" style={{ textAlign: 'center' }}>
          {stateHydrating ? 'Syncing your account…' : 'Loading your plan…'}
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
