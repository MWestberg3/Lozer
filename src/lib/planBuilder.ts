import type {
  BlockMovement,
  ExerciseTemplate,
  GeneratorSettings,
  LibraryExercise,
  Program,
  WorkoutBlock,
  WorkoutDayTemplate,
} from '../types/workout'
import type { PlanSlotInfo } from './workoutGenerator'

export function blocksToExercises(blocks: WorkoutBlock[]): ExerciseTemplate[] {
  const out: ExerciseTemplate[] = []
  for (const block of blocks) {
    for (const movement of block.movements) {
      out.push({
        id: movement.id,
        name: movement.name,
        muscleGroup: movement.muscleGroup,
        defaultSets: movement.sets,
        defaultReps: movement.reps,
        restSeconds: movement.restSeconds,
      })
    }
  }
  return out
}

export function movementFromLibrary(exercise: LibraryExercise, goal: GeneratorSettings['goal']): BlockMovement {
  const reps = goal === 'strength' ? exercise.defaultRepsStrength : exercise.defaultRepsHypertrophy
  const restSeconds =
    exercise.compound || goal === 'strength' ? exercise.restSecondsHeavy : exercise.restSecondsDefault
  return {
    id: `mv-${exercise.id}-${Date.now()}`,
    exerciseId: exercise.id,
    name: exercise.name,
    muscleGroup: exercise.muscleGroup,
    sets: exercise.defaultSets,
    reps,
    restSeconds,
  }
}

export function buildManualProgram(
  slots: PlanSlotInfo[],
  dayBlocks: Record<string, WorkoutBlock[]>,
  settings: GeneratorSettings,
  existingProgram: Program,
): Program {
  const days: WorkoutDayTemplate[] = slots.map((slot) => {
    const blocks = dayBlocks[slot.id] ?? []
    return {
      id: slot.id,
      name: slot.name,
      focus: slot.muscleGroups.length ? slot.muscleGroups.join(', ') : slot.focus,
      exercises: blocksToExercises(blocks),
      blocks,
      rotationMuscleGroups: slot.muscleGroups,
      rotationWeek: slot.rotationWeek,
      rotationDayIndex: slot.rotationDayIndex,
    }
  })

  const builtCount = days.filter((day) => (day.blocks?.length ?? 0) > 0).length

  return {
    id: existingProgram.id === 'empty-plan' ? 'manual-plan' : existingProgram.id,
    name: builtCount > 0 ? 'My plan' : existingProgram.name,
    description: 'Built in Plan',
    daysPerWeek: settings.daysPerWeek,
    days,
    rotationCycleWeeks: settings.rotationMode === 'custom' ? settings.customRotationWeeks : 1,
  }
}

export function dayBlocksFromProgram(days: WorkoutDayTemplate[]): Record<string, WorkoutBlock[]> {
  const map: Record<string, WorkoutBlock[]> = {}
  for (const day of days) {
    if (day.blocks?.length) {
      map[day.id] = day.blocks.map((block) => ({
        ...block,
        movements: block.movements.map((m) => ({ ...m })),
      }))
    }
  }
  return map
}