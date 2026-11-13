import type { ExerciseProgressPoint, WorkoutSession } from '../types/workout'

export function buildExerciseProgress(
  sessions: WorkoutSession[],
  exerciseId: string,
): ExerciseProgressPoint[] {
  const points: ExerciseProgressPoint[] = []

  for (const session of sessions) {
    if (!session.completedAt) continue
    const log = session.exercises.find((e) => e.exerciseId === exerciseId)
    if (!log) continue

    const completedSets = log.sets.filter((s) => s.completed)
    if (completedSets.length === 0) continue

    const maxWeight = Math.max(...completedSets.map((s) => s.weightLbs))
    const totalVolume = completedSets.reduce((sum, s) => sum + s.reps * s.weightLbs, 0)

    points.push({
      date: session.completedAt.slice(0, 10),
      maxWeight,
      totalVolume,
    })
  }

  return points.sort((a, b) => a.date.localeCompare(b.date))
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

export function sessionStats(session: WorkoutSession) {
  const completedSets = session.exercises.flatMap((e) => e.sets.filter((s) => s.completed))
  const volume = completedSets.reduce((sum, s) => sum + s.reps * s.weightLbs, 0)
  const topSet = completedSets.reduce((max, s) => Math.max(max, s.weightLbs), 0)
  return { sets: completedSets.length, volume, topSet }
}

export function lastPerformance(
  sessions: WorkoutSession[],
  exerciseId: string,
): { weightLbs: number; reps: number } | null {
  for (const session of sessions) {
      const log = session.exercises.find((e) => e.exerciseId === exerciseId)
    if (!log) continue
    const completed = [...log.sets].reverse().find((s) => s.completed)
    if (completed) {
      return { weightLbs: completed.weightLbs, reps: completed.reps }
    }
  }
  return null
}
