export type UserId = string

export interface UserProfile {
  id: UserId
  displayName: string
  activeProgramId: string
}

export interface ExerciseTemplate {
  id: string
  name: string
  muscleGroup: string
  defaultSets: number
  defaultReps: string
  restSeconds: number
}

export interface WorkoutDayTemplate {
  id: string
  name: string
  focus: string
  exercises: ExerciseTemplate[]
}

export interface Program {
  id: string
  name: string
  description: string
  daysPerWeek: number
  days: WorkoutDayTemplate[]
}

export interface SetLog {
  setNumber: number
  reps: number
  weightLbs: number
  completed: boolean
}

export interface ExerciseLog {
  exerciseId: string
  exerciseName: string
  sets: SetLog[]
}

export interface WorkoutSession {
  id: string
  userId: UserId
  programId: string
  dayId: string
  dayName: string
  startedAt: string
  completedAt?: string
  exercises: ExerciseLog[]
}

export interface AppState {
  version: 1
  profile: UserProfile
  programs: Program[]
  sessions: WorkoutSession[]
}

export interface ExerciseProgressPoint {
  date: string
  maxWeight: number
  totalVolume: number
}
