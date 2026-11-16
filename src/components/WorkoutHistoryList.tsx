import { useApp } from '../context/AppContext'
import { getSessionsForUser } from '../storage/db'
import { formatDate, sessionStats } from '../lib/progress'

export function WorkoutHistoryList() {
  const { state } = useApp()
  const sessions = getSessionsForUser(state)

  if (sessions.length === 0) {
    return <p className="generator-panel-copy" style={{ margin: 0 }}>No history yet. Finish a workout from Home.</p>
  }

  return (
    <ul className="settings-history-list">
      {sessions.map((session) => {
        const stats = sessionStats(session)
        return (
          <li key={session.id} className="card settings-history-item">
            <strong>{session.dayName}</strong>
            <div className="library-item-meta">{formatDate(session.completedAt!)}</div>
            <p className="library-item-meta" style={{ marginTop: '0.35rem' }}>
              {stats.sets} sets · {stats.volume.toLocaleString()} lb volume · top set {stats.topSet} lb
            </p>
            <details className="settings-history-lifts">
              <summary className="settings-history-lifts-summary">View lifts</summary>
              <ul className="settings-history-lift-list">
                {session.exercises.map((exercise) => {
                  const best = exercise.sets
                    .filter((s) => s.completed)
                    .reduce<{ w: number; r: number } | null>((acc, set) => {
                      if (!acc || set.weightLbs > acc.w) return { w: set.weightLbs, r: set.reps }
                      return acc
                    }, null)
                  return (
                    <li key={exercise.exerciseId}>
                      {exercise.exerciseName}: {best ? `${best.w} lb × ${best.r}` : '—'}
                    </li>
                  )
                })}
              </ul>
            </details>
          </li>
        )
      })}
    </ul>
  )
}