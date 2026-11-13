import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { getSessionsForUser } from '../storage/db'
import { formatDate, sessionStats } from '../lib/progress'

export function HomePage() {
  const { state, activeUser, program } = useApp()
  const sessions = getSessionsForUser(state)
  const latest = sessions[0]

  return (
    <section>
      <h1 className="page-title">Lozer</h1>
      <p className="subtitle">Training plan for {activeUser.displayName}</p>

      <div className="card">
        <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>Active program</div>
        <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{program.name}</div>
        <p style={{ margin: '0.5rem 0 0', color: 'var(--muted)', fontSize: '0.9rem' }}>
          {program.description}
        </p>
        <p style={{ margin: '0.75rem 0 0', fontSize: '0.85rem' }}>
          {program.daysPerWeek} days / week · {program.days.length} workouts in rotation
        </p>
      </div>

      <div className="stat-grid" style={{ marginTop: '0.75rem' }}>
        <div className="stat">
          <strong>{sessions.length}</strong>
          <span>Workouts</span>
        </div>
        <div className="stat">
          <strong>
            {sessions.filter((s) => {
              const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
              return new Date(s.completedAt ?? 0).getTime() >= weekAgo
            }).length}
          </strong>
          <span>This week</span>
        </div>
        <div className="stat">
          <strong>{program.days.length}</strong>
          <span>Day split</span>
        </div>
      </div>

      {latest ? (
        <div className="card" style={{ marginTop: '0.75rem' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>Last session</div>
          <strong>{latest.dayName}</strong> · {formatDate(latest.completedAt!)}
          <p style={{ margin: '0.35rem 0 0', color: 'var(--muted)', fontSize: '0.85rem' }}>
            {sessionStats(latest).sets} working sets · {sessionStats(latest).volume.toLocaleString()} lb
            volume
          </p>
        </div>
      ) : (
        <div className="card" style={{ marginTop: '0.75rem' }}>
          No workouts logged yet for this profile. Start your first session.
        </div>
      )}

      <Link to="/workout" className="btn btn-primary" style={{ marginTop: '1rem' }}>
        Start training
      </Link>
    </section>
  )
}
