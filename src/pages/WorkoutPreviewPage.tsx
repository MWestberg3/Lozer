import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { getSessionsForUser } from '../storage/db'
import { buildDaySchedule, formatCalendarDay } from '../lib/schedule'
import { recentExerciseIdsFromSessions, regenerateDay } from '../lib/workoutGenerator'

export function WorkoutPreviewPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { state, program, catalog, catalogLoading, generatePlan } = useApp()

  const dayFromQuery = searchParams.get('day')
  const defaultDayId = program.days[0]?.id ?? ''
  const dayId =
    dayFromQuery && program.days.some((d) => d.id === dayFromQuery) ? dayFromQuery : defaultDayId
  const day = program.days.find((d) => d.id === dayId)

  if (!day) {
    return <Navigate to="/home" replace />
  }

  const schedule = buildDaySchedule(program, getSessionsForUser(state))
  const todaySlot = schedule[0]
  const isToday = todaySlot.day.id === day.id
  const slotForDay = schedule.find((s) => s.day.id === day.id)
  const dateLabel = slotForDay ? formatCalendarDay(slotForDay.date) : day.name

  const shuffleDay = () => {
    if (catalog.length === 0) return
    const sessions = getSessionsForUser(state)
    const recent = recentExerciseIdsFromSessions(sessions)
    const merged = regenerateDay(
      program,
      day.id,
      state.generatorSettings,
      state.enabledLibraryEquipment,
      recent,
      catalog,
      state.dislikedExerciseIds,
      `shuffle-${Date.now()}`,
    )
    generatePlan(merged)
  }

  const startHref = `/workout?day=${encodeURIComponent(day.id)}&start=1`
  const completedToday = isToday && todaySlot.completedToday

  return (
    <section>
      <Link to="/home" className="text-link workout-preview-back">
        ← Home
      </Link>

      <p className="calendar-today" style={{ marginTop: '0.75rem' }}>
        {dateLabel}
      </p>
      <h1 className="page-title">{day.name}</h1>
      <p className="subtitle">{day.focus}</p>
      <p className="today-workout-meta" style={{ marginBottom: '1rem' }}>
        {day.exercises.length} exercises · {program.name}
      </p>

      <ol className="workout-preview-list">
        {day.exercises.map((exercise, index) => (
          <li key={exercise.id} className="card workout-preview-item">
            <span className="workout-preview-index">{index + 1}</span>
            <div className="workout-preview-item-body">
              <strong>{exercise.name}</strong>
              <p className="library-item-meta">
                {exercise.muscleGroup} · {exercise.defaultSets} sets · {exercise.defaultReps} reps ·{' '}
                {exercise.restSeconds}s rest
              </p>
            </div>
          </li>
        ))}
      </ol>

      <div className="home-plan-links" style={{ marginTop: '1rem' }}>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={shuffleDay}
          disabled={catalogLoading || catalog.length === 0}
        >
          Shuffle exercises
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => navigate(startHref)}
        >
          {completedToday ? 'Train again' : 'Start workout'}
        </button>
      </div>
    </section>
  )
}
