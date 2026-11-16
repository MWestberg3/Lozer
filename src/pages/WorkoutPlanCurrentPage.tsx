import { Link } from 'react-router-dom'
import { ScrollableChipRow } from '../components/ScrollableChipRow'
import { useApp } from '../context/AppContext'
import { formatCircuitMovementReps } from '../lib/planBuilder'
import { listPlanSlots } from '../lib/workoutGenerator'
import type { Program, WorkoutBlock, WorkoutDayTemplate } from '../types/workout'

export function programHasBuiltWorkouts(program: Program): boolean {
  return program.days.some(
    (day) =>
      (day.blocks?.some((block) => block.movements.length > 0) ?? false) || day.exercises.length > 0,
  )
}

function blocksForDisplay(day: WorkoutDayTemplate): WorkoutBlock[] {
  if (day.blocks?.length) return day.blocks
  if (day.exercises.length === 0) return []
  return [
    {
      id: `${day.id}-straight`,
      type: 'straight',
      label: 'Straight sets',
      movements: day.exercises.map((exercise) => ({
        id: exercise.id,
        exerciseId: exercise.id,
        name: exercise.name,
        muscleGroup: exercise.muscleGroup,
        sets: exercise.defaultSets,
        reps: exercise.defaultReps,
        restSeconds: exercise.restSeconds,
      })),
    },
  ]
}

function movementCount(day: WorkoutDayTemplate): number {
  const blocks = blocksForDisplay(day)
  return blocks.reduce((sum, block) => sum + block.movements.length, 0)
}

export function WorkoutPlanCurrentPage() {
  const { state, program, catalog } = useApp()
  const settings = state.generatorSettings
  const slots = listPlanSlots(settings, catalog)
  const hasWorkouts = programHasBuiltWorkouts(program)

  const builtDays = program.days.filter((day) => movementCount(day) > 0).length
  const rotationLabel =
    settings.rotationMode === 'custom'
      ? `${settings.customRotationWeeks}-week rotation`
      : 'same split each week'

  if (!hasWorkouts) {
    return (
      <section className="plan-current">
        <h1 className="page-title">Current plan</h1>
        <p className="subtitle">No workouts in your plan yet.</p>
        <div className="card" style={{ marginTop: '0.5rem' }}>
          <p className="generator-panel-copy" style={{ margin: 0 }}>
            Set your split and muscle focus, then add blocks and movements for each training day.
          </p>
          <Link to="/plan/setup" className="btn btn-primary" style={{ marginTop: '0.75rem' }}>
            Set up split
          </Link>
        </div>
      </section>
    )
  }

  const dayById = new Map(program.days.map((day) => [day.id, day]))

  return (
    <section className="plan-current">
      <h1 className="page-title">Current plan</h1>
      <p className="subtitle">
        {program.name} · {settings.daysPerWeek} {settings.daysPerWeek === 1 ? 'day' : 'days'} per week ·{' '}
        {rotationLabel}
        {builtDays > 0 ? ` · ${builtDays}/${program.days.length} days built` : ''}
      </p>

      <div className="home-plan-links plan-current-actions">
        <Link to="/plan/setup" className="btn btn-ghost">
          Edit split
        </Link>
      </div>

      <div className="plan-current-days">
        {slots.map((slot) => {
          const day = dayById.get(slot.id)
          if (!day) return null
          const blocks = blocksForDisplay(day)
          const muscles = slot.muscleGroups

          return (
            <article key={slot.id} className="card plan-current-day">
              <header className="plan-current-day-header">
                <div>
                  <strong className="plan-current-day-title">{day.name}</strong>
                  <p className="library-item-meta" style={{ marginTop: '0.25rem' }}>
                    {slot.chipLabel}
                    {muscles.length ? ` · ${muscles.join(', ')}` : ''}
                  </p>
                </div>
                <Link
                  to={`/plan/build?day=${encodeURIComponent(slot.id)}`}
                  className="btn btn-ghost btn-small"
                >
                  Edit
                </Link>
              </header>

              {blocks.length === 0 ? (
                <p className="generator-panel-copy plan-current-empty-day">
                  No blocks yet.{' '}
                  <Link to={`/plan/build?day=${encodeURIComponent(slot.id)}`} className="text-link">
                    Add workouts
                  </Link>
                </p>
              ) : (
                <div className="plan-current-blocks">
                  {blocks.map((block, blockIndex) => (
                    <section key={block.id} className="plan-current-block">
                      <p className="plan-current-block-title">
                        Block {blockIndex + 1} · {block.type === 'circuit' ? 'Circuit' : 'Straight'}
                        {block.type === 'circuit' ? (
                          <span className="library-item-meta">
                            {' '}
                            · {block.rounds ?? 3} rounds · {block.restBetweenStationsSec ?? 45}s between sets ·{' '}
                            {block.restBetweenRoundsSec ?? 90}s between rounds
                          </span>
                        ) : null}
                      </p>
                      {block.movements.length === 0 ? (
                        <p className="library-item-meta">No movements</p>
                      ) : (
                        <ol className="plan-current-movements">
                          {block.movements.map((movement) => (
                            <li key={movement.id}>
                              <strong>{movement.name}</strong>
                              <span className="library-item-meta">
                                {' '}
                                ·{' '}
                                {block.type === 'circuit'
                                  ? formatCircuitMovementReps(movement)
                                  : `${movement.sets}×${movement.reps}`}
                                {block.type === 'straight' ? ` · ${movement.restSeconds}s rest` : ''}
                              </span>
                            </li>
                          ))}
                        </ol>
                      )}
                      {block.restAfterBlockSec != null ? (
                        <p className="library-item-meta plan-current-break">
                          Break before next block: {block.restAfterBlockSec}s
                        </p>
                      ) : null}
                    </section>
                  ))}
                </div>
              )}

              {muscles.length > 0 ? (
                <div className="plan-current-day-tags">
                  <ScrollableChipRow>
                    {muscles.map((muscle) => (
                      <span key={muscle} className="chip chip-readonly">
                        {muscle}
                      </span>
                    ))}
                  </ScrollableChipRow>
                </div>
              ) : null}
            </article>
          )
        })}
      </div>
    </section>
  )
}