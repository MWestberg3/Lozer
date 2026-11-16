import { Link } from 'react-router-dom'
import { WorkoutDayCarousel } from '../components/WorkoutDayCarousel'
import { useApp } from '../context/AppContext'
import { getSessionsForUser } from '../storage/db'
import { buildDaySchedule, formatTodayHeading } from '../lib/schedule'
import { formatDate, sessionStats } from '../lib/progress'
export function HomePage() {
  const { state, activeUser, program } = useApp()
  const sessions = getSessionsForUser(state)
  const latest = sessions[0]
  const today = new Date()
  const hasPlan = program.days.length > 0
  const schedule = buildDaySchedule(program, sessions)
  const todaySlot = schedule[0]

  return (
    <section>
      <p className="calendar-today">{formatTodayHeading(today)}</p>
      <h1 className="page-title">Lozer</h1>
      <p className="subtitle">Training plan for {activeUser.displayName}</p>

      {hasPlan && todaySlot ? (
        <>
          <div className={`card today-workout ${todaySlot.completedToday ? 'is-complete' : ''}`}>
            <div className="today-workout-badge">{todaySlot.completedToday ? 'Completed' : 'Today'}</div>
            <strong className="today-workout-name">{todaySlot.day.name}</strong>
            <p className="today-workout-focus">{todaySlot.day.focus}</p>
            <p className="today-workout-meta">
              {todaySlot.day.exercises.length} exercises · {program.name}
            </p>
            <Link
              to={`/workout/preview?day=${encodeURIComponent(todaySlot.day.id)}`}
              className="btn btn-primary"
            >
              Preview workout
            </Link>
          </div>

          <WorkoutDayCarousel slots={schedule} />
        </>
      ) : (
        <div className="card" style={{ marginTop: '0.5rem' }}>
          <strong>No workout plan yet</strong>
          <p className="generator-panel-copy" style={{ marginTop: '0.35rem' }}>
            Your plan will show here once workouts are set up. Adjust plan preferences in Settings anytime.
          </p>
          <Link to="/plan" className="btn btn-primary" style={{ marginTop: '0.75rem' }}>
            Workout Plan
          </Link>
        </div>
      )}

      <div className="stat-grid" style={{ marginTop: '1rem' }}>
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
          <span>
            {program.rotationCycleWeeks && program.rotationCycleWeeks > 1
              ? `${program.daysPerWeek}-day · ${program.rotationCycleWeeks} wk cycle`
              : 'Day split'}
          </span>
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
          No workouts logged yet. Preview today&apos;s workout above to get started.
        </div>
      )}
    </section>
  )
}
