import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { RestTimer } from '../components/RestTimer'
import { useApp } from '../context/AppContext'
import { getSessionsForUser } from '../storage/db'
import { lastPerformance } from '../lib/progress'
import type { ExerciseLog, SetLog, WorkoutDayTemplate, WorkoutSession } from '../types/workout'

function createSets(templateSets: number, prior?: { weightLbs: number; reps: number }): SetLog[] {
  return Array.from({ length: templateSets }, (_, i) => ({
    setNumber: i + 1,
    reps: prior?.reps ?? 10,
    weightLbs: prior?.weightLbs ?? 0,
    completed: false,
  }))
}

function buildExerciseLogs(day: WorkoutDayTemplate, priorSessions: WorkoutSession[]): ExerciseLog[] {
  return day.exercises.map((exercise) => {
    const prior = lastPerformance(priorSessions, exercise.id)
    return {
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      sets: createSets(exercise.defaultSets, prior ?? undefined),
    }
  })
}

export function WorkoutPage() {
  const navigate = useNavigate()
  const { state, activeUser, program, completeWorkout } = useApp()
  const priorSessions = getSessionsForUser(state)

  const [dayId, setDayId] = useState(program.days[0]?.id ?? '')
  const selectedDay = program.days.find((d) => d.id === dayId) ?? program.days[0]

  const [exerciseLogs, setExerciseLogs] = useState<ExerciseLog[]>(() =>
    selectedDay ? buildExerciseLogs(selectedDay, priorSessions) : [],
  )
  const [activeExerciseIndex, setActiveExerciseIndex] = useState(0)
  const [restRunning, setRestRunning] = useState(false)
  const [restSeconds, setRestSeconds] = useState(90)
  const [startedAt] = useState(() => new Date().toISOString())
  const [inSession, setInSession] = useState(false)

  const activeExercise = useMemo(() => {
    if (!selectedDay) return null
    return selectedDay.exercises[activeExerciseIndex] ?? null
  }, [selectedDay, activeExerciseIndex])

  const resetForDay = (nextDayId: string) => {
    const day = program.days.find((d) => d.id === nextDayId)
    if (!day) return
    setDayId(nextDayId)
    setExerciseLogs(buildExerciseLogs(day, priorSessions))
    setActiveExerciseIndex(0)
    setInSession(false)
    setRestRunning(false)
  }

  const updateSet = (exerciseIndex: number, setIndex: number, patch: Partial<SetLog>) => {
    setExerciseLogs((rows) =>
      rows.map((row, i) =>
        i !== exerciseIndex
          ? row
          : {
              ...row,
              sets: row.sets.map((set, j) => (j === setIndex ? { ...set, ...patch } : set)),
            },
      ),
    )
  }

  const toggleSet = (exerciseIndex: number, setIndex: number) => {
    const exercise = selectedDay.exercises[exerciseIndex]
    const set = exerciseLogs[exerciseIndex].sets[setIndex]
    const completed = !set.completed
    updateSet(exerciseIndex, setIndex, { completed })
    if (completed) {
      setRestSeconds(exercise.restSeconds)
      setRestRunning(true)
    }
  }

  const finishWorkout = () => {
    if (!selectedDay) return
    const completedAt = new Date().toISOString()
    const session: WorkoutSession = {
      id: crypto.randomUUID(),
      userId: activeUser.id,
      programId: program.id,
      dayId: selectedDay.id,
      dayName: selectedDay.name,
      startedAt,
      completedAt,
      exercises: exerciseLogs,
    }
    completeWorkout(session)
    navigate('/history')
  }

  if (!selectedDay) {
    return <p>No workouts configured.</p>
  }

  if (!inSession) {
    return (
      <section>
        <h1 className="page-title">Train</h1>
        <p className="subtitle">Pick today&apos;s workout from {program.name}</p>
        {program.days.map((day) => (
          <button
            key={day.id}
            type="button"
            className="card"
            style={{
              width: '100%',
              textAlign: 'left',
              cursor: 'pointer',
              borderColor: day.id === dayId ? 'var(--accent)' : undefined,
            }}
            onClick={() => resetForDay(day.id)}
          >
            <strong>{day.name}</strong>
            <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{day.focus}</div>
            <div style={{ marginTop: '0.35rem', fontSize: '0.85rem' }}>
              {day.exercises.length} exercises
            </div>
          </button>
        ))}
        <button type="button" className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => setInSession(true)}>
          Begin {selectedDay.name}
        </button>
      </section>
    )
  }

  return (
    <section>
      <h1 className="page-title">{selectedDay.name}</h1>
      <p className="subtitle">
        Exercise {activeExerciseIndex + 1} of {selectedDay.exercises.length}
      </p>

      {activeExercise && (
        <div className="card">
          <strong>{activeExercise.name}</strong>
          <div style={{ color: 'var(--muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
            Target {activeExercise.defaultSets} × {activeExercise.defaultReps} · {activeExercise.muscleGroup}
          </div>
        </div>
      )}

      {exerciseLogs[activeExerciseIndex]?.sets.map((set, setIndex) => (
        <div key={set.setNumber} className={`set-row ${set.completed ? 'done' : ''}`} style={{ marginTop: '0.75rem' }}>
          <span style={{ color: 'var(--muted)' }}>{set.setNumber}</span>
          <input
            type="number"
            min={0}
            aria-label="Weight in pounds"
            value={set.weightLbs}
            onChange={(e) =>
              updateSet(activeExerciseIndex, setIndex, { weightLbs: Number(e.target.value) })
            }
          />
          <input
            type="number"
            min={0}
            aria-label="Reps"
            value={set.reps}
            onChange={(e) => updateSet(activeExerciseIndex, setIndex, { reps: Number(e.target.value) })}
          />
          <button
            type="button"
            className={`check ${set.completed ? 'is-on' : ''}`}
            aria-label={set.completed ? 'Mark set incomplete' : 'Mark set complete'}
            onClick={() => toggleSet(activeExerciseIndex, setIndex)}
          >
            {set.completed ? '✓' : ''}
          </button>
        </div>
      ))}

      <RestTimer seconds={restSeconds} running={restRunning} onDone={() => setRestRunning(false)} />

      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
        <button
          type="button"
          className="btn btn-ghost"
          disabled={activeExerciseIndex === 0}
          onClick={() => setActiveExerciseIndex((i) => Math.max(0, i - 1))}
        >
          Prev
        </button>
        {activeExerciseIndex < selectedDay.exercises.length - 1 ? (
          <button
            type="button"
            className="btn btn-primary"
            style={{ flex: 1 }}
            onClick={() => {
              setActiveExerciseIndex((i) => i + 1)
              setRestRunning(false)
            }}
          >
            Next exercise
          </button>
        ) : (
          <button type="button" className="btn btn-primary" style={{ flex: 1 }} onClick={finishWorkout}>
            Finish workout
          </button>
        )}
      </div>
    </section>
  )
}
