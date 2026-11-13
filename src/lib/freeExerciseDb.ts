import type { DayType, Equipment, LibraryExercise } from '../types/workout'
import type { FreeExercise } from '../types/freeExercise'

/** Hosted images per upstream README (Unlicense). */
export const FREE_EXERCISE_IMAGE_BASE =
  'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/'

const STRENGTH_CATEGORIES = new Set(['strength', 'powerlifting', 'olympic weightlifting', 'strongman'])

const EQUIPMENT_MAP: Record<string, Equipment | null> = {
  barbell: 'barbell',
  dumbbell: 'dumbbell',
  cable: 'cable',
  machine: 'machine',
  'body only': 'bodyweight',
  kettlebells: 'kettlebell',
  bands: 'bodyweight',
  'e-z curl bar': 'barbell',
  'medicine ball': 'bodyweight',
  'exercise ball': 'bodyweight',
  'foam roll': null,
  other: null,
}

const MUSCLE_LABEL: Record<string, string> = {
  abdominals: 'Core',
  abductors: 'Glutes',
  adductors: 'Glutes',
  biceps: 'Biceps',
  calves: 'Calves',
  chest: 'Chest',
  forearms: 'Forearms',
  glutes: 'Glutes',
  hamstrings: 'Hamstrings',
  lats: 'Back',
  'lower back': 'Back',
  'middle back': 'Back',
  neck: 'Neck',
  quadriceps: 'Quads',
  shoulders: 'Shoulders',
  traps: 'Back',
  triceps: 'Triceps',
}

function inferDayTypes(exercise: FreeExercise): DayType[] {
  const types = new Set<DayType>()
  const primary = exercise.primaryMuscles[0]

  if (exercise.force === 'push') types.add('push')
  if (exercise.force === 'pull') types.add('pull')

  const pushMuscles = ['chest', 'shoulders', 'triceps']
  const pullMuscles = ['lats', 'middle back', 'lower back', 'traps', 'biceps']
  const legMuscles = ['quadriceps', 'hamstrings', 'glutes', 'calves', 'abductors', 'adductors']

  if (pushMuscles.includes(primary)) types.add('push')
  if (pullMuscles.includes(primary)) types.add('pull')
  if (legMuscles.includes(primary)) types.add('legs')

  if (pushMuscles.includes(primary) || pullMuscles.includes(primary)) types.add('upper')
  if (legMuscles.includes(primary)) types.add('lower')

  if (types.size === 0) types.add('full')
  return [...types]
}

function mapEquipment(raw: string | null): Equipment[] {
  if (!raw) return ['bodyweight']
  const mapped = EQUIPMENT_MAP[raw]
  if (!mapped) return ['bodyweight']
  return [mapped]
}

function swapGroupFor(exercise: FreeExercise): string {
  const primary = exercise.primaryMuscles[0] ?? 'general'
  const mechanic = exercise.mechanic ?? 'compound'
  return `${primary}-${mechanic}`
}

export function mapFreeExercise(exercise: FreeExercise): LibraryExercise | null {
  if (!STRENGTH_CATEGORIES.has(exercise.category)) return null
  if (exercise.equipment === 'foam roll') return null

  const compound = exercise.mechanic === 'compound'
  const heavy = compound && ['barbell', 'machine'].includes(exercise.equipment ?? '')

  return {
    id: exercise.id,
    name: exercise.name,
    muscleGroup: MUSCLE_LABEL[exercise.primaryMuscles[0]] ?? exercise.primaryMuscles[0],
    dayTypes: inferDayTypes(exercise),
    equipment: mapEquipment(exercise.equipment),
    compound,
    defaultSets: compound ? 4 : 3,
    defaultRepsStrength: heavy ? '5-8' : '6-10',
    defaultRepsHypertrophy: compound ? '8-12' : '12-15',
    restSecondsHeavy: heavy ? 120 : 90,
    restSecondsDefault: compound ? 90 : 60,
    swapGroup: swapGroupFor(exercise),
    libraryEquipment: exercise.equipment ?? 'body only',
  }
}

export function equipmentMatchesUserGear(exercise: LibraryExercise, enabledLibraryEquipment: string[]): boolean {
  if (enabledLibraryEquipment.length === 0) return true
  const allowed = new Set(enabledLibraryEquipment)
  const raw = exercise.libraryEquipment || 'body only'
  return allowed.has(raw)
}

export function imageUrlFor(exercise: FreeExercise, index = 0): string | null {
  const path = exercise.images[index]
  if (!path) return null
  return `${FREE_EXERCISE_IMAGE_BASE}${path}`
}
