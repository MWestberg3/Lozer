import { equipmentLabel, LIBRARY_EQUIPMENT_OPTIONS } from './equipment'
import { equipmentMatchesUserGear } from './freeExerciseDb'
import type {
  DayType,
  ExerciseTemplate,
  GeneratorSettings,
  LibraryExercise,
  Program,
  TrainingGoal,
  WorkoutDayTemplate,
} from '../types/workout'

export const defaultGeneratorSettings: GeneratorSettings = {
  goal: 'hypertrophy',
  daysPerWeek: 4,
}

interface DayBlueprint {
  id: string
  name: string
  focus: string
  type: DayType
  slots: { swapGroup?: string; compound?: boolean; muscle?: string; count?: number }[]
}

const BLUEPRINTS: Record<3 | 4 | 5, DayBlueprint[]> = {
  4: [
    {
      id: 'push',
      name: 'Push',
      focus: 'Chest, shoulders, triceps',
      type: 'push',
      slots: [
        { swapGroup: 'chest-compound', compound: true },
        { swapGroup: 'shoulder-press', compound: true },
        { muscle: 'Chest', compound: false },
        { muscle: 'Shoulders', compound: false },
        { swapGroup: 'triceps' },
      ],
    },
    {
      id: 'pull',
      name: 'Pull',
      focus: 'Back and biceps',
      type: 'pull',
      slots: [
        { swapGroup: 'hinge', compound: true },
        { swapGroup: 'vertical-pull', compound: true },
        { swapGroup: 'horizontal-row', compound: true },
        { muscle: 'Rear delts' },
        { swapGroup: 'biceps' },
      ],
    },
    {
      id: 'legs',
      name: 'Legs',
      focus: 'Quads, hamstrings, glutes',
      type: 'legs',
      slots: [
        { swapGroup: 'squat', compound: true },
        { swapGroup: 'hinge', compound: true },
        { swapGroup: 'squat', compound: true },
        { muscle: 'Hamstrings' },
        { muscle: 'Calves' },
      ],
    },
    {
      id: 'upper',
      name: 'Upper',
      focus: 'Full upper volume',
      type: 'upper',
      slots: [
        { swapGroup: 'horizontal-row', compound: true },
        { swapGroup: 'shoulder-press', compound: true },
        { swapGroup: 'chest-compound', compound: true },
        { swapGroup: 'vertical-pull', compound: true },
        { swapGroup: 'biceps' },
      ],
    },
  ],
  3: [
    {
      id: 'push',
      name: 'Push',
      focus: 'Chest, shoulders, triceps',
      type: 'push',
      slots: [
        { swapGroup: 'chest-compound', compound: true },
        { swapGroup: 'shoulder-press', compound: true },
        { swapGroup: 'triceps' },
      ],
    },
    {
      id: 'pull',
      name: 'Pull',
      focus: 'Back and biceps',
      type: 'pull',
      slots: [
        { swapGroup: 'vertical-pull', compound: true },
        { swapGroup: 'horizontal-row', compound: true },
        { swapGroup: 'biceps' },
      ],
    },
    {
      id: 'legs',
      name: 'Legs',
      focus: 'Quads, hamstrings, glutes',
      type: 'legs',
      slots: [
        { swapGroup: 'squat', compound: true },
        { swapGroup: 'hinge', compound: true },
        { muscle: 'Calves' },
      ],
    },
  ],
  5: [
    {
      id: 'push',
      name: 'Push',
      focus: 'Chest, shoulders, triceps',
      type: 'push',
      slots: [
        { swapGroup: 'chest-compound', compound: true },
        { swapGroup: 'shoulder-press', compound: true },
        { swapGroup: 'triceps' },
      ],
    },
    {
      id: 'pull',
      name: 'Pull',
      focus: 'Back and biceps',
      type: 'pull',
      slots: [
        { swapGroup: 'hinge', compound: true },
        { swapGroup: 'vertical-pull', compound: true },
        { swapGroup: 'biceps' },
      ],
    },
    {
      id: 'legs',
      name: 'Legs',
      focus: 'Quad focus',
      type: 'legs',
      slots: [
        { swapGroup: 'squat', compound: true },
        { swapGroup: 'squat', compound: true },
        { muscle: 'Calves' },
      ],
    },
    {
      id: 'upper',
      name: 'Upper',
      focus: 'Upper pump',
      type: 'upper',
      slots: [
        { swapGroup: 'horizontal-row', compound: true },
        { swapGroup: 'chest-compound', compound: true },
        { swapGroup: 'biceps' },
      ],
    },
    {
      id: 'lower',
      name: 'Lower',
      focus: 'Posterior chain',
      type: 'lower',
      slots: [
        { swapGroup: 'hinge', compound: true },
        { muscle: 'Hamstrings' },
        { muscle: 'Glutes' },
      ],
    },
  ],
}


function hash(seed: string): number {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h << 5) - h + seed.charCodeAt(i)
  return Math.abs(h)
}

function pickFromPool(
  pool: LibraryExercise[],
  used: Set<string>,
  swapGroupsUsed: Set<string>,
  disliked: Set<string>,
  seed: string,
): LibraryExercise | null {
  const available = pool.filter((exercise) => {
    if (disliked.has(exercise.id)) return false
    if (used.has(exercise.id)) return false
    if (exercise.swapGroup && swapGroupsUsed.has(exercise.swapGroup)) return false
    return true
  })
  if (available.length === 0) return null

  const grouped = new Map<string, LibraryExercise[]>()
  for (const exercise of available) {
    const key = exercise.swapGroup ?? exercise.id
    const list = grouped.get(key) ?? []
    list.push(exercise)
    grouped.set(key, list)
  }

  const keys = [...grouped.keys()]
  const key = keys[hash(seed) % keys.length]
  const variants = grouped.get(key) ?? available
  return variants[hash(`${seed}-${key}`) % variants.length]
}

function toTemplate(exercise: LibraryExercise, goal: TrainingGoal): ExerciseTemplate {
  const reps = goal === 'strength' ? exercise.defaultRepsStrength : exercise.defaultRepsHypertrophy
  const rest = goal === 'strength' ? exercise.restSecondsHeavy : exercise.restSecondsDefault
  return {
    id: exercise.id,
    name: exercise.name,
    muscleGroup: exercise.muscleGroup,
    defaultSets: exercise.defaultSets,
    defaultReps: reps,
    restSeconds: rest,
  }
}

function buildDay(
  blueprint: DayBlueprint,
  settings: GeneratorSettings,
  enabledLibraryEquipment: string[],
  recentExerciseIds: string[],
  dislikedExerciseIds: string[],
  variationSeed: string,
  catalog: LibraryExercise[],
): WorkoutDayTemplate {
  const disliked = new Set(dislikedExerciseIds)
  const used = new Set<string>()
  const swapGroupsUsed = new Set<string>()
  const exercises: ExerciseTemplate[] = []

  const basePool = catalog.filter(
    (exercise) =>
      !disliked.has(exercise.id) &&
      exercise.dayTypes.includes(blueprint.type) &&
      equipmentMatchesUserGear(exercise, enabledLibraryEquipment),
  )

  for (let i = 0; i < blueprint.slots.length; i++) {
    const slot = blueprint.slots[i]
    let pool = basePool
    if (slot.swapGroup) {
      pool = pool.filter((e) => e.swapGroup === slot.swapGroup)
    } else if (slot.muscle) {
      pool = pool.filter((e) => e.muscleGroup === slot.muscle)
    }
    if (slot.compound === true) pool = pool.filter((e) => e.compound)
    if (slot.compound === false) pool = pool.filter((e) => !e.compound)

    pool = pool.sort((a, b) => {
      const aRecent = recentExerciseIds.includes(a.id) ? 1 : 0
      const bRecent = recentExerciseIds.includes(b.id) ? 1 : 0
      if (aRecent !== bRecent) return aRecent - bRecent
      return 0
    })

    const pick = pickFromPool(pool, used, swapGroupsUsed, disliked, `${variationSeed}-${blueprint.id}-${i}`)
    if (!pick) continue
    used.add(pick.id)
    if (pick.swapGroup) swapGroupsUsed.add(pick.swapGroup)
    exercises.push(toTemplate(pick, settings.goal))
  }

  return {
    id: blueprint.id,
    name: blueprint.name,
    focus: blueprint.focus,
    exercises,
  }
}

export function generateProgram(
  settings: GeneratorSettings,
  enabledLibraryEquipment: string[],
  recentExerciseIds: string[],
  catalog: LibraryExercise[],
  dislikedExerciseIds: string[] = [],
  variationSeed = new Date().toISOString().slice(0, 10),
): Program {
  if (catalog.length === 0) {
    throw new Error('Exercise catalog not loaded')
  }
  const blueprint = BLUEPRINTS[settings.daysPerWeek]
  const goalLabel = settings.goal === 'strength' ? 'Strength' : 'Hypertrophy'
  const gearSummary =
    enabledLibraryEquipment.length >= LIBRARY_EQUIPMENT_OPTIONS.length
      ? 'your full equipment list'
      : enabledLibraryEquipment.map((id) => equipmentLabel(id).toLowerCase()).join(', ') || 'your equipment'

  return {
    id: `generated-${settings.daysPerWeek}-${settings.goal}-${Date.now()}`,
    name: `${goalLabel} · ${settings.daysPerWeek}-day`,
    description: `Auto-built ${settings.daysPerWeek}-day ${settings.goal} split for ${gearSummary}. Refresh to swap exercises and keep progressive overload from your logs.`,
    daysPerWeek: settings.daysPerWeek,
    generatedAt: new Date().toISOString(),
    days: blueprint.map((day) =>
      buildDay(
        day,
        settings,
        enabledLibraryEquipment,
        recentExerciseIds,
        dislikedExerciseIds,
        `${variationSeed}-${day.id}`,
        catalog,
      ),
    ),
  }
}

export function regenerateDay(
  program: Program,
  dayId: string,
  settings: GeneratorSettings,
  enabledLibraryEquipment: string[],
  recentExerciseIds: string[],
  catalog: LibraryExercise[],
  dislikedExerciseIds: string[] = [],
  variationSeed = `${Date.now()}`,
): Program {
  const blueprint = BLUEPRINTS[settings.daysPerWeek].find((d) => d.id === dayId)
  if (!blueprint || catalog.length === 0) return program
  const nextDay = buildDay(
    blueprint,
    settings,
    enabledLibraryEquipment,
    recentExerciseIds,
    dislikedExerciseIds,
    variationSeed,
    catalog,
  )
  return {
    ...program,
    days: program.days.map((day) => (day.id === dayId ? nextDay : day)),
    generatedAt: new Date().toISOString(),
  }
}

export function scrubDislikedFromProgram(
  program: Program,
  dislikedExerciseIds: string[],
  settings: GeneratorSettings,
  enabledLibraryEquipment: string[],
  recentExerciseIds: string[],
  catalog: LibraryExercise[],
): Program {
  let next = program
  for (const day of program.days) {
    const contains = day.exercises.some((exercise) => dislikedExerciseIds.includes(exercise.id))
    if (contains) {
      next = regenerateDay(
        next,
        day.id,
        settings,
        enabledLibraryEquipment,
        recentExerciseIds,
        catalog,
        dislikedExerciseIds,
        `scrub-${day.id}`,
      )
    }
  }
  return next
}

export function recentExerciseIdsFromSessions(sessions: { exercises: { exerciseId: string }[] }[]): string[] {
  const ids = new Set<string>()
  for (const session of sessions.slice(0, 8)) {
    for (const exercise of session.exercises) {
      ids.add(exercise.exerciseId)
    }
  }
  return [...ids]
}
