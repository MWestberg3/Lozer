import { createDefaultProfile, defaultProgram } from '../data/defaultProgram'
import { DEFAULT_ENABLED_LIBRARY_EQUIPMENT, enabledEquipmentFromLegacyPreset } from '../lib/equipment'
import { DEFAULT_THEME_COLOR_ID, isThemeColorId } from '../lib/theme'
import { clampDaysPerWeek, defaultGeneratorSettings } from '../lib/workoutGenerator'
import { fetchRemoteAppState, writeRemoteAppState } from './firestoreAppState'
import type { AppState, GeneratorSettings, Program, UserProfile, WorkoutSession } from '../types/workout'

type LegacyGeneratorSettings = GeneratorSettings & { equipment?: 'full_gym' | 'dumbbells' | 'minimal' }

interface LocalEnvelope {
  state: AppState
  syncedAt: string
}

function storageKey(uid: string) {
  return `lozer_app_v1_${uid}`
}

const firestoreSaveTimers = new Map<string, ReturnType<typeof setTimeout>>()

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

export function migrateState(parsed: AppState, uid: string, displayName: string): AppState {
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
        daysPerWeek: clampDaysPerWeek(legacySettings.daysPerWeek ?? defaultGeneratorSettings.daysPerWeek),
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

function readLocalEnvelope(uid: string): LocalEnvelope | null {
  if (typeof localStorage === 'undefined') return null
  const raw = localStorage.getItem(storageKey(uid))
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as LocalEnvelope | AppState
    if (parsed && typeof parsed === 'object' && 'state' in parsed && 'syncedAt' in parsed) {
      return parsed as LocalEnvelope
    }
    if (parsed && typeof parsed === 'object' && (parsed as AppState).version === 1) {
      return { state: parsed as AppState, syncedAt: '1970-01-01T00:00:00.000Z' }
    }
  } catch {
    return null
  }
  return null
}

function writeLocalEnvelope(uid: string, state: AppState, syncedAt: string): void {
  if (typeof localStorage === 'undefined') return
  const envelope: LocalEnvelope = { state, syncedAt }
  localStorage.setItem(storageKey(uid), JSON.stringify(envelope))
}

function scheduleFirestoreSave(uid: string, state: AppState, syncedAt: string): void {
  const existing = firestoreSaveTimers.get(uid)
  if (existing) clearTimeout(existing)
  const timer = setTimeout(() => {
    firestoreSaveTimers.delete(uid)
    void writeRemoteAppState(uid, state, syncedAt).catch((err) => {
      console.warn('Firestore sync failed (data kept locally):', err)
    })
  }, 450)
  firestoreSaveTimers.set(uid, timer)
}

export function saveState(uid: string, state: AppState): void {
  const syncedAt = new Date().toISOString()
  writeLocalEnvelope(uid, state, syncedAt)
  scheduleFirestoreSave(uid, state, syncedAt)
}

export async function flushRemoteState(uid: string): Promise<void> {
  const pending = firestoreSaveTimers.get(uid)
  if (pending) {
    clearTimeout(pending)
    firestoreSaveTimers.delete(uid)
  }
  const envelope = readLocalEnvelope(uid)
  if (!envelope) return
  await writeRemoteAppState(uid, envelope.state, envelope.syncedAt)
}

/** Load app state: merge Firestore + local by `syncedAt`; upload when local is newer or missing remotely. */
export async function loadStateAsync(uid: string, displayName: string): Promise<AppState> {
  const local = readLocalEnvelope(uid)
  let remoteRaw: Awaited<ReturnType<typeof fetchRemoteAppState>> = null
  try {
    remoteRaw = await fetchRemoteAppState(uid)
  } catch (err) {
    console.warn('Could not load from Firestore, using local cache:', err)
  }

  let remoteState: AppState | null = null
  let remoteSyncedAt: string | null = null
  if (remoteRaw) {
    const { _syncedAt, ...rest } = remoteRaw
    remoteSyncedAt = _syncedAt
    remoteState = migrateState(rest as AppState, uid, displayName)
  }

  const localState = local ? migrateState(local.state, uid, displayName) : null
  const localSyncedAt = local?.syncedAt ?? null

  let winner: AppState
  let winnerSyncedAt: string

  if (localState && remoteState && localSyncedAt && remoteSyncedAt) {
    if (localSyncedAt > remoteSyncedAt) {
      winner = localState
      winnerSyncedAt = localSyncedAt
    } else {
      winner = remoteState
      winnerSyncedAt = remoteSyncedAt
    }
  } else if (remoteState && remoteSyncedAt) {
    winner = remoteState
    winnerSyncedAt = remoteSyncedAt
  } else if (localState && localSyncedAt) {
    winner = localState
    winnerSyncedAt = localSyncedAt
  } else {
    winner = createDefaultState(uid, displayName)
    winnerSyncedAt = new Date().toISOString()
  }

  writeLocalEnvelope(uid, winner, winnerSyncedAt)

  const needsRemoteUpload =
    !remoteRaw ||
    (localSyncedAt != null &&
      winnerSyncedAt === localSyncedAt &&
      (!remoteSyncedAt || localSyncedAt > remoteSyncedAt))

  if (needsRemoteUpload) {
    scheduleFirestoreSave(uid, winner, winnerSyncedAt)
  }

  return winner
}

/** @deprecated Use loadStateAsync. Sync read for tests only. */
export function loadState(uid: string, displayName: string): AppState {
  const local = readLocalEnvelope(uid)
  if (local) {
    return migrateState(local.state, uid, displayName)
  }
  const initial = createDefaultState(uid, displayName)
  saveState(uid, initial)
  return initial
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