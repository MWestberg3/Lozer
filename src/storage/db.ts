import { createDefaultProfile, defaultProgram } from '../data/defaultProgram'
import { DEFAULT_ENABLED_LIBRARY_EQUIPMENT, enabledEquipmentFromLegacyPreset } from '../lib/equipment'
import { DEFAULT_THEME_COLOR_ID, isThemeColorId } from '../lib/theme'
import { defaultGeneratorSettings } from '../lib/workoutGenerator'
import type { AppState, GeneratorSettings, Program, UserProfile, WorkoutSession } from '../types/workout'

type LegacyGeneratorSettings = GeneratorSettings & { equipment?: 'full_gym' | 'dumbbells' | 'minimal' }

function storageKey(uid: string) {
  return `lozer_app_v1_${uid}`
}

function createDefaultState(uid: string, displayName: string): AppState {
  return {
    version: 1,
    profile: createDefaultProfile(uid, displayName),
    programs: [defaultProgram],
    sessions: [],
    generatorSettings: defaultGeneratorSettings,
    enabledLibraryEquipment: [...DEFAULT_ENABLED_LIBRARY_EQUIPMENT],
    primaryColorId: DEFAULT_THEME_COLOR_ID,
    dislikedExerciseIds: [],
  }
}

function migrateState(parsed: AppState, uid: string, displayName: string): AppState {
  const profile: UserProfile = {
    ...parsed.profile,
    id: uid,
    displayName: parsed.profile.displayName || displayName,
  }
  const programs = parsed.programs?.length ? parsed.programs : [defaultProgram]
  const legacySettings = parsed.generatorSettings as LegacyGeneratorSettings | undefined
  const generatorSettings: GeneratorSettings = legacySettings
    ? {
        goal: legacySettings.goal ?? defaultGeneratorSettings.goal,
        daysPerWeek: legacySettings.daysPerWeek ?? defaultGeneratorSettings.daysPerWeek,
      }
    : defaultGeneratorSettings
  let enabledLibraryEquipment = parsed.enabledLibraryEquipment
  if (!enabledLibraryEquipment?.length) {
    const legacyPreset = legacySettings?.equipment ?? 'full_gym'
    enabledLibraryEquipment = enabledEquipmentFromLegacyPreset(legacyPreset)
  }
  const primaryColorId = isThemeColorId(parsed.primaryColorId ?? '')
    ? parsed.primaryColorId
    : DEFAULT_THEME_COLOR_ID

  return {
    ...parsed,
    profile,
    programs,
    generatorSettings,
    enabledLibraryEquipment,
    primaryColorId,
    dislikedExerciseIds: parsed.dislikedExerciseIds ?? [],
  }
}

export function loadState(uid: string, displayName: string): AppState {
  if (typeof localStorage === 'undefined') {
    return createDefaultState(uid, displayName)
  }

  const raw = localStorage.getItem(storageKey(uid))
  if (!raw) {
    const initial = createDefaultState(uid, displayName)
    saveState(uid, initial)
    return initial
  }

  try {
    const parsed = JSON.parse(raw) as AppState
    if (parsed.version !== 1) {
      return createDefaultState(uid, displayName)
    }
    return migrateState(parsed, uid, displayName)
  } catch {
    return createDefaultState(uid, displayName)
  }
}

export function saveState(uid: string, state: AppState): void {
  localStorage.setItem(storageKey(uid), JSON.stringify(state))
}

export function updateUserProfile(
  uid: string,
  state: AppState,
  patch: Partial<Pick<UserProfile, 'displayName'>>,
): AppState {
  const profile = { ...state.profile, ...patch }
  const next = { ...state, profile }
  saveState(uid, next)
  return next
}

export function appendSession(uid: string, state: AppState, session: WorkoutSession): AppState {
  const next = { ...state, sessions: [session, ...state.sessions] }
  saveState(uid, next)
  return next
}

export function getSessionsForUser(state: AppState): WorkoutSession[] {
  return state.sessions
    .filter((s) => s.completedAt)
    .sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? ''))
}

export function getProgramForUser(state: AppState) {
  return state.programs.find((p) => p.id === state.profile.activeProgramId) ?? state.programs[0]
}

export function updateGeneratorSettings(
  uid: string,
  state: AppState,
  settings: GeneratorSettings,
): AppState {
  const next = { ...state, generatorSettings: settings }
  saveState(uid, next)
  return next
}

export function updateEnabledLibraryEquipment(
  uid: string,
  state: AppState,
  enabledLibraryEquipment: string[],
): AppState {
  const next = { ...state, enabledLibraryEquipment: [...enabledLibraryEquipment] }
  saveState(uid, next)
  return next
}

export function updatePrimaryColorId(
  uid: string,
  state: AppState,
  primaryColorId: AppState['primaryColorId'],
): AppState {
  const next = { ...state, primaryColorId }
  saveState(uid, next)
  return next
}

export function setExerciseDisliked(
  uid: string,
  state: AppState,
  exerciseId: string,
  disliked: boolean,
): AppState {
  const set = new Set(state.dislikedExerciseIds)
  if (disliked) set.add(exerciseId)
  else set.delete(exerciseId)
  const next = { ...state, dislikedExerciseIds: [...set] }
  saveState(uid, next)
  return next
}

export function applyProgram(uid: string, state: AppState, program: Program): AppState {
  const programs = [program, ...state.programs.filter((p) => p.id !== program.id)]
  const profile = { ...state.profile, activeProgramId: program.id }
  const next = { ...state, programs, profile }
  saveState(uid, next)
  return next
}
