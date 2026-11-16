import type { Program, UserProfile } from '../types/workout'

/** Empty until the user generates a plan in Settings. */
export const defaultProgram: Program = {
  id: 'empty-plan',
  name: 'No plan yet',
  description: 'Plan preferences are in Settings.',
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
