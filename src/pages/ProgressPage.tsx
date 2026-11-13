import { useMemo, useState } from 'react'
import { useApp } from '../context/AppContext'
import { getSessionsForUser } from '../storage/db'
import { buildExerciseProgress } from '../lib/progress'

export function ProgressPage() {
  const { state, activeUser, program } = useApp()
  const sessions = getSessionsForUser(state)

  const exercises = useMemo(
    () => program.days.flatMap((day) => day.exercises.map((e) => ({ ...e, dayName: day.name }))),
    [program],
  )

  const [exerciseId, setExerciseId] = useState(exercises[0]?.id ?? '')

  const points = buildExerciseProgress(sessions, exerciseId)
  const maxY = Math.max(...points.map((p) => p.maxWeight), 1)

  const selected = exercises.find((e) => e.id === exerciseId)

  return (
    <section>
      <h1 className="page-title">Progress</h1>
      <p className="subtitle">Heaviest set over time for {activeUser.displayName}</p>

      <label style={{ display: 'block', marginBottom: '0.35rem', color: 'var(--muted)', fontSize: '0.85rem' }}>
        Exercise
      </label>
      <select
        className="field-select"
        value={exerciseId}
        onChange={(e) => setExerciseId(e.target.value)}
      >
        {exercises.map((exercise) => (
          <option key={exercise.id} value={exercise.id}>
            {exercise.name} ({exercise.dayName})
          </option>
        ))}
      </select>

      <div className="card">
        {selected && (
          <div style={{ marginBottom: '0.5rem', color: 'var(--muted)', fontSize: '0.85rem' }}>
            {selected.muscleGroup} · target {selected.defaultReps} reps
          </div>
        )}
        {points.length === 0 ? (
          <p style={{ margin: 0, color: 'var(--muted)' }}>Log workouts to see weight trends.</p>
        ) : (
          <>
            <div style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Max weight per session</div>
            <div className="progress-chart" aria-hidden>
              {points.map((point) => (
                <div
                  key={point.date}
                  className="progress-bar"
                  style={{ height: `${(point.maxWeight / maxY) * 100}%` }}
                  title={`${point.date}: ${point.maxWeight} lb`}
                />
              ))}
            </div>
            <ul style={{ margin: '0.75rem 0 0', paddingLeft: '1.1rem', color: 'var(--muted)', fontSize: '0.85rem' }}>
              {points
                .slice(-5)
                .reverse()
                .map((point) => (
                  <li key={point.date}>
                    {point.date}: {point.maxWeight} lb · {Math.round(point.totalVolume)} lb volume
                  </li>
                ))}
            </ul>
          </>
        )}
      </div>
    </section>
  )
}
