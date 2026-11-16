import type { DayType, DaysPerWeek, GeneratorSettings, LibraryExercise } from '../types/workout'

export interface MuscleDayBlueprint {
  id: string
  name: string
  focus: string
  type: DayType
  slots: { swapGroup?: string; compound?: boolean; muscle?: string; count?: number }[]
  muscleGroups: string[]
}

const LEG_MUSCLES = new Set(['Quads', 'Hamstrings', 'Glutes', 'Calves'])
const PUSH_MUSCLES = new Set(['Chest', 'Shoulders', 'Triceps'])
const PULL_MUSCLES = new Set(['Back', 'Biceps', 'Forearms'])

export function sortedMuscleGroupsFromCatalog(catalog: LibraryExercise[]): string[] {
  const groups = new Set<string>()
  for (const exercise of catalog) groups.add(exercise.muscleGroup)
  return [...groups].sort((a, b) => a.localeCompare(b))
}

function inferDayType(muscles: string[]): DayType {
  if (muscles.length === 0) return 'full'
  const leg = muscles.some((m) => LEG_MUSCLES.has(m))
  const push = muscles.some((m) => PUSH_MUSCLES.has(m))
  const pull = muscles.some((m) => PULL_MUSCLES.has(m))
  if (leg && !push && !pull) return 'legs'
  if (push && pull && leg) return 'full'
  if (push && pull) return 'upper'
  if (push) return 'push'
  if (pull) return 'pull'
  if (leg) return 'lower'
  return 'upper'
}

export function blueprintFromMuscleGroups(
  muscleGroups: string[],
  dayKey: string,
  displayName?: string,
): MuscleDayBlueprint {
  const muscles = [...new Set(muscleGroups)].filter(Boolean)
  const name = displayName ?? (muscles.length ? muscles.join(' · ') : 'Training')
  const focus = muscles.length ? muscles.join(', ') : 'Full body'
  const type = inferDayType(muscles)

  const slots: MuscleDayBlueprint['slots'] = []
  if (muscles.length === 0) {
    slots.push({ muscle: 'Chest', compound: true }, { muscle: 'Back', compound: true })
  } else {
    for (const muscle of muscles) {
      slots.push({ muscle, compound: true })
    }
    for (const muscle of muscles) {
      if (slots.length >= 6) break
      slots.push({ muscle, compound: false })
    }
  }

  return {
    id: dayKey,
    name,
    focus,
    type,
    slots,
    muscleGroups: muscles,
  }
}

/** Default muscle focus per training day (0-based), aligned with classic splits. */
const DEFAULT_WEEK_MUSCLES: Record<DaysPerWeek, string[][]> = {
  1: [['Chest', 'Back', 'Quads', 'Hamstrings', 'Shoulders']],
  2: [
    ['Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps'],
    ['Quads', 'Hamstrings', 'Glutes', 'Calves'],
  ],
  3: [
    ['Chest', 'Shoulders', 'Triceps'],
    ['Back', 'Biceps'],
    ['Quads', 'Hamstrings', 'Glutes'],
  ],
  4: [
    ['Chest', 'Shoulders', 'Triceps'],
    ['Back', 'Biceps'],
    ['Quads', 'Hamstrings', 'Glutes', 'Calves'],
    ['Chest', 'Back', 'Shoulders', 'Biceps'],
  ],
  5: [
    ['Chest', 'Shoulders', 'Triceps'],
    ['Back', 'Biceps'],
    ['Quads', 'Hamstrings', 'Glutes'],
    ['Chest', 'Back', 'Shoulders'],
    ['Hamstrings', 'Glutes', 'Calves'],
  ],
  6: [
    ['Chest', 'Shoulders', 'Triceps'],
    ['Back', 'Biceps'],
    ['Quads', 'Hamstrings', 'Glutes'],
    ['Chest', 'Back', 'Shoulders'],
    ['Hamstrings', 'Glutes', 'Calves'],
    ['Quads', 'Chest', 'Back'],
  ],
  7: [
    ['Chest', 'Shoulders', 'Triceps'],
    ['Back', 'Biceps'],
    ['Quads', 'Hamstrings', 'Glutes'],
    ['Chest', 'Triceps'],
    ['Back', 'Forearms'],
    ['Glutes', 'Hamstrings', 'Calves'],
    ['Chest', 'Back', 'Shoulders', 'Biceps'],
  ],
}

function slotCount(settings: GeneratorSettings): number {
  return settings.daysPerWeek * settings.customRotationWeeks
}

export function defaultMuscleGroupsForDayIndex(daysPerWeek: DaysPerWeek, dayIndex: number): string[] {
  const week = DEFAULT_WEEK_MUSCLES[daysPerWeek]
  return [...(week[dayIndex % week.length] ?? week[0])]
}

export function defaultCustomRotationMuscles(settings: GeneratorSettings): string[][] {
  const total = slotCount(settings)
  const result: string[][] = []
  for (let i = 0; i < total; i++) {
    const dayIndex = i % settings.daysPerWeek
    result.push(defaultMuscleGroupsForDayIndex(settings.daysPerWeek, dayIndex))
  }
  return result
}

function isKnownMuscle(muscle: string, known: Set<string>): boolean {
  return known.has(muscle)
}

export function normalizeCustomRotationMuscles(
  settings: GeneratorSettings,
  knownMuscles: Set<string> = new Set(),
): string[][] {
  const count = slotCount(settings)
  const defaults = defaultCustomRotationMuscles(settings)
  const existing = settings.customRotationMuscles ?? []
  const next: string[][] = []

  for (let i = 0; i < count; i++) {
    const fallback = defaults[i] ?? defaults[0] ?? ['Chest']
    const raw = existing[i]
    if (raw === undefined) {
      next.push(fallback)
      continue
    }
    if (raw.length === 0) {
      next.push([])
      continue
    }
    const filtered = knownMuscles.size
      ? raw.filter((m) => isKnownMuscle(m, knownMuscles))
      : raw.filter(Boolean)
    next.push(filtered)
  }
  return next
}