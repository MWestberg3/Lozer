import type { Program, UserProfile } from '../types/workout'

/** Replaced when the free-exercise-db catalog finishes loading. */
export const defaultProgram: Program = {
  id: 'pending-catalog',
  name: 'Your plan',
  description: 'Loading exercise library…',
  daysPerWeek: 4,
  days: [],
}

export function createDefaultProfile(uid: string, displayName: string): UserProfile {
  return {
    id: uid,
    displayName,
    activeProgramId: defaultProgram.id,
  }
}
