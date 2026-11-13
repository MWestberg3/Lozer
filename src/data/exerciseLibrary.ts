import { mapFreeExercise } from '../lib/freeExerciseDb'
import type { FreeExercise } from '../types/freeExercise'
import type { LibraryExercise } from '../types/workout'

export const EXERCISE_DATA_URL = `${import.meta.env.BASE_URL}data/exercises.json`

export async function fetchExerciseCatalog(): Promise<LibraryExercise[]> {
  const response = await fetch(EXERCISE_DATA_URL)
  if (!response.ok) {
    throw new Error('Failed to load exercise library')
  }
  const raw = (await response.json()) as FreeExercise[]
  const catalog: LibraryExercise[] = []
  for (const item of raw) {
    const mapped = mapFreeExercise(item)
    if (!mapped) continue
    catalog.push({
      ...mapped,
      instructions: item.instructions,
      imageUrl: item.images[0]
        ? `https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/${item.images[0]}`
        : null,
      level: item.level,
      sourceId: item.id,
    })
  }
  return catalog
}
