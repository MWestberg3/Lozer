import { createDefaultProfile, defaultProgram } from '../data/defaultProgram'
import type { AppState, UserProfile, WorkoutSession } from '../types/workout'

function storageKey(uid: string) {
  return `lozer_app_v1_${uid}`
}

function createDefaultState(uid: string, displayName: string): AppState {
  return {
    version: 1,
    profile: createDefaultProfile(uid, displayName),
    programs: [defaultProgram],
    sessions: [],
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
    const profile: UserProfile = {
      ...parsed.profile,
      id: uid,
      displayName: parsed.profile.displayName || displayName,
    }
    return { ...parsed, profile }
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
