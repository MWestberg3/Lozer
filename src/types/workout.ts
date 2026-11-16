export type UserId = string

export type Equipment = 'barbell' | 'dumbbell' | 'cable' | 'machine' | 'bodyweight' | 'kettlebell'
export type DayType = 'push' | 'pull' | 'legs' | 'upper' | 'lower' | 'full'
export type TrainingGoal = 'strength' | 'hypertrophy'

export type ThemeColorId =
  | 'orange'
  | 'pink'
  | 'red'
  | 'amber'
  | 'green'
  | 'teal'
  | 'blue'
  | 'purple'

export type DaysPerWeek = 1 | 2 | 3 | 4 | 5 | 6 | 7

export type RotationMode = 'default' | 'custom'
export type CustomRotationWeeks = 1 | 2 | 3

export interface GeneratorSettings {
  goal: TrainingGoal
  daysPerWeek: DaysPerWeek
  rotationMode: RotationMode
  customRotationWeeks: CustomRotationWeeks
  /** Week-major order: week 1 days 1…N, week 2 days 1…N, etc. Used when rotationMode is custom. */
  customRotationMuscles?: string[][]
}

export interface UserProfile {
  id: UserId
  displayName: string
  activeProgramId: string
}

export interface LibraryExercise {
  id: string
  name: string
  muscleGroup: string
  dayTypes: DayType[]
  equipment: Equipment[]
  compound: boolean
  defaultSets: number
  defaultRepsStrength: string
  defaultRepsHypertrophy: string
  restSecondsHeavy: number
  restSecondsDefault: number
  swapGroup?: string
  instructions?: string[]
  imageUrl?: string | null
  level?: string
  sourceId?: string
  /** Raw equipment string from the exercise library (used for user equipment filters). */
  libraryEquipment: string
}

export interface ExerciseTemplate {
  id: string
  name: string
  muscleGroup: string
  defaultSets: number
  defaultReps: string
  restSeconds: number
}

export type WorkoutBlockType = 'straight' | 'circuit'

export interface BlockMovement {
  id: string
  exerciseId: string
  name: string
  muscleGroup: string
  sets: number
  reps: string
  restSeconds: number
}

export interface WorkoutBlock {
  id: string
  type: WorkoutBlockType
  label?: string
  rounds?: number
  restBetweenRoundsSec?: number
  restBetweenStationsSec?: number
  /** Rest after this block before the next (defaults to between-rounds on circuits). */
  restAfterBlockSec?: number
  movements: BlockMovement[]
}

export interface WorkoutDayTemplate {
  id: string
  name: string
  focus: string
  exercises: ExerciseTemplate[]
  blocks?: WorkoutBlock[]
  rotationMuscleGroups?: string[]
  rotationWeek?: number
  rotationDayIndex?: number
}

export interface Program {
  id: string
  name: string
  description: string
  daysPerWeek: number
  days: WorkoutDayTemplate[]
  generatedAt?: string
  /** Calendar rotation length in “weeks” of unique training days (1 = standard weekly split). */
  rotationCycleWeeks?: number
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
  generatorSettings: GeneratorSettings
  /** Raw library equipment strings the user has available (`free-exercise-db` values). */
  enabledLibraryEquipment: string[]
  /** UI accent preset (buttons, chips, highlights). */
  primaryColorId: ThemeColorId
  /** Exercise ids the user never wants auto-recommended (per Firebase account). */
  dislikedExerciseIds: string[]
}

export interface ExerciseProgressPoint {
  date: string
  maxWeight: number
  totalVolume: number
}
