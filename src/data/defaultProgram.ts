import type { Program, UserProfile } from '../types/workout'

const exercise = (
  id: string,
  name: string,
  muscleGroup: string,
  defaultSets: number,
  defaultReps: string,
  restSeconds = 90,
) => ({
  id,
  name,
  muscleGroup,
  defaultSets,
  defaultReps,
  restSeconds,
})

export const defaultProgram: Program = {
  id: 'bulk-split',
  name: 'Strength Split',
  description:
    'Four-day progressive strength plan inspired by structured gym splits: push, pull, legs, and upper accessories.',
  daysPerWeek: 4,
  days: [
    {
      id: 'push',
      name: 'Push',
      focus: 'Chest, shoulders, triceps',
      exercises: [
        exercise('bench-press', 'Barbell Bench Press', 'Chest', 4, '6-8', 120),
        exercise('ohp', 'Overhead Press', 'Shoulders', 3, '8-10'),
        exercise('incline-db', 'Incline Dumbbell Press', 'Chest', 3, '10-12'),
        exercise('lateral-raise', 'Lateral Raise', 'Shoulders', 3, '12-15', 60),
        exercise('tricep-pushdown', 'Tricep Pushdown', 'Triceps', 3, '12-15', 60),
      ],
    },
    {
      id: 'pull',
      name: 'Pull',
      focus: 'Back and biceps',
      exercises: [
        exercise('deadlift', 'Conventional Deadlift', 'Back', 4, '5-6', 150),
        exercise('pull-up', 'Pull-Up / Lat Pulldown', 'Back', 4, '8-10'),
        exercise('cable-row', 'Seated Cable Row', 'Back', 3, '10-12'),
        exercise('face-pull', 'Face Pull', 'Rear delts', 3, '15-20', 60),
        exercise('curl', 'Dumbbell Curl', 'Biceps', 3, '10-12', 60),
      ],
    },
    {
      id: 'legs',
      name: 'Legs',
      focus: 'Quads, hamstrings, glutes',
      exercises: [
        exercise('squat', 'Back Squat', 'Quads', 4, '6-8', 150),
        exercise('rdl', 'Romanian Deadlift', 'Hamstrings', 3, '8-10'),
        exercise('leg-press', 'Leg Press', 'Quads', 3, '12-15'),
        exercise('leg-curl', 'Leg Curl', 'Hamstrings', 3, '12-15', 60),
        exercise('calf-raise', 'Standing Calf Raise', 'Calves', 4, '12-15', 60),
      ],
    },
    {
      id: 'upper',
      name: 'Upper',
      focus: 'Full upper body volume',
      exercises: [
        exercise('row', 'Barbell Row', 'Back', 4, '8-10'),
        exercise('db-press', 'Dumbbell Shoulder Press', 'Shoulders', 3, '10-12'),
        exercise('dip', 'Weighted Dip', 'Chest / triceps', 3, '8-12'),
        exercise('lat-pulldown', 'Lat Pulldown', 'Back', 3, '10-12'),
        exercise('hammer-curl', 'Hammer Curl', 'Biceps', 3, '12-15', 60),
      ],
    },
  ],
}

export function createDefaultProfile(uid: string, displayName: string): UserProfile {
  return {
    id: uid,
    displayName,
    activeProgramId: defaultProgram.id,
  }
}
