import { useApp } from '../context/AppContext'
import { getSessionsForUser } from '../storage/db'
import { formatDate, sessionStats } from '../lib/progress'

export function HistoryPage() {
  const { state, activeUser } = useApp()
  const sessions = getSessionsForUser(state)

  return (
    <section>
      <h1 className="page-title">History</h1>
      <p className="subtitle">Completed workouts for {activeUser.displayName}</p>

      {sessions.length === 0 ? (
        <div className="card">No history yet. Finish a workout from the Train tab.</div>
      ) : (
        sessions.map((session) => {
          const stats = sessionStats(session)
          return (
            <article key={session.id} className="card">
              <strong>{session.dayName}</strong>
              <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
                {formatDate(session.completedAt!)}
              </div>
              <p style={{ margin: '0.5rem 0 0', fontSize: '0.9rem' }}>
                {stats.sets} sets · {stats.volume.toLocaleString()} lb volume · top set {stats.topSet} lb
              </p>
              <details style={{ marginTop: '0.35rem' }}>
                <summary style={{ cursor: 'pointer', color: 'var(--accent)' }}>View lifts</summary>
                <ul style={{ margin: '0.5rem 0 0', paddingLeft: '1.1rem', color: 'var(--muted)', fontSize: '0.85rem' }}>
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
            </article>
          )
        })
      )}
    </section>
  )
}
