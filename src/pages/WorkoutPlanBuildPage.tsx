import { Fragment, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ScrollableChipRow } from '../components/ScrollableChipRow'
import { useApp } from '../context/AppContext'
import { equipmentMatchesUserGear } from '../lib/freeExerciseDb'
import {
  buildManualProgram,
  dayBlocksFromProgram,
  movementFromLibrary,
} from '../lib/planBuilder'
import { listPlanSlots } from '../lib/workoutGenerator'
import type { BlockMovement, LibraryExercise, WorkoutBlock, WorkoutBlockType } from '../types/workout'

const REST_PRESETS = [60, 90, 120, 180] as const
const DEFAULT_BLOCK_BREAK_SEC = 90
const CIRCUIT_DEFAULT_REPS = '10'

function circuitRepsForRounds(movement: BlockMovement, rounds: number): string[] {
  const fallback = movement.reps || CIRCUIT_DEFAULT_REPS
  return Array.from({ length: rounds }, (_, index) => movement.repsPerRound?.[index] ?? fallback)
}

function defaultBreakAfterBlock(block: WorkoutBlock): number {
  if (block.type === 'circuit') return block.restBetweenRoundsSec ?? DEFAULT_BLOCK_BREAK_SEC
  return DEFAULT_BLOCK_BREAK_SEC
}

function newBlockId() {
  return `block-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function createBlock(type: WorkoutBlockType): WorkoutBlock {
  if (type === 'circuit') {
    return {
      id: newBlockId(),
      type,
      label: 'Circuit',
      rounds: 3,
      restBetweenRoundsSec: 90,
      restBetweenStationsSec: 45,
      movements: [],
    }
  }
  return {
    id: newBlockId(),
    type,
    label: 'Straight sets',
    movements: [],
  }
}

export function WorkoutPlanBuildPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const {
    state,
    program,
    catalog,
    catalogLoading,
    generatePlan,
    dislikedExerciseIds,
  } = useApp()

  const slots = useMemo(
    () => listPlanSlots(state.generatorSettings, catalog),
    [state.generatorSettings, catalog],
  )

  const slotFromQuery = searchParams.get('day')
  const defaultSlotId = slots[0]?.id ?? ''
  const activeSlotId =
    slotFromQuery && slots.some((s) => s.id === slotFromQuery) ? slotFromQuery : defaultSlotId
  const activeSlot = slots.find((s) => s.id === activeSlotId) ?? slots[0]

  const [dayBlocks, setDayBlocks] = useState<Record<string, WorkoutBlock[]>>(() =>
    dayBlocksFromProgram(program.days),
  )
  const [pickerBlockId, setPickerBlockId] = useState<string | null>(null)

  const activeBlocks = activeSlot ? (dayBlocks[activeSlot.id] ?? []) : []

  const focusMuscles = useMemo(() => new Set(activeSlot?.muscleGroups ?? []), [activeSlot?.muscleGroups])

  const pickerExercises = useMemo(() => {
    if (!activeSlot || !pickerBlockId) return []
    const blocked = new Set(dislikedExerciseIds)
    return catalog.filter((exercise) => {
      if (blocked.has(exercise.id)) return false
      if (!equipmentMatchesUserGear(exercise, state.enabledLibraryEquipment)) return false
      if (focusMuscles.size > 0 && !focusMuscles.has(exercise.muscleGroup)) return false
      return true
    })
  }, [
    activeSlot,
    pickerBlockId,
    catalog,
    dislikedExerciseIds,
    focusMuscles,
    state.enabledLibraryEquipment,
  ])

  const builtDayCount = useMemo(
  () =>
      slots.filter((slot) => (dayBlocks[slot.id]?.some((b) => b.movements.length > 0) ?? false)).length,
    [slots, dayBlocks],
  )

  const selectSlot = (id: string) => {
    setPickerBlockId(null)
    setSearchParams({ day: id }, { replace: true })
  }

  const setBlocksForActiveDay = (blocks: WorkoutBlock[]) => {
    if (!activeSlot) return
    setDayBlocks((prev) => ({ ...prev, [activeSlot.id]: blocks }))
  }

  const addBlock = (type: WorkoutBlockType) => {
    setBlocksForActiveDay([...activeBlocks, createBlock(type)])
  }

  const updateBlock = (blockId: string, patch: Partial<WorkoutBlock>) => {
    setBlocksForActiveDay(
      activeBlocks.map((block) => {
        if (block.id !== blockId) return block
        const next: WorkoutBlock = { ...block, ...patch }
        if (block.type === 'circuit' && patch.rounds != null && patch.rounds !== block.rounds) {
          const rounds = patch.rounds
          next.movements = next.movements.map((movement) => {
            const nextPerRound = circuitRepsForRounds(movement, rounds)
            return { ...movement, reps: nextPerRound[0] ?? CIRCUIT_DEFAULT_REPS, repsPerRound: nextPerRound }
          })
        }
        return next
      }),
    )
  }

  const removeBlock = (blockId: string) => {
    setBlocksForActiveDay(activeBlocks.filter((block) => block.id !== blockId))
    if (pickerBlockId === blockId) setPickerBlockId(null)
  }

  const addMovement = (blockId: string, exercise: LibraryExercise) => {
    const block = activeBlocks.find((b) => b.id === blockId)
    const movement = movementFromLibrary(exercise, state.generatorSettings.goal)
    if (block?.type === 'circuit') {
      const rounds = block.rounds ?? 3
      movement.sets = 1
      movement.reps = CIRCUIT_DEFAULT_REPS
      movement.repsPerRound = Array.from({ length: rounds }, () => CIRCUIT_DEFAULT_REPS)
    }
    setBlocksForActiveDay(
      activeBlocks.map((block) =>
        block.id === blockId ? { ...block, movements: [...block.movements, movement] } : block,
      ),
    )
    setPickerBlockId(null)
  }

  const updateMovement = (blockId: string, movementId: string, patch: Partial<BlockMovement>) => {
    setBlocksForActiveDay(
      activeBlocks.map((block) =>
        block.id === blockId
          ? {
              ...block,
              movements: block.movements.map((m) => (m.id === movementId ? { ...m, ...patch } : m)),
            }
          : block,
      ),
    )
  }

  const removeMovement = (blockId: string, movementId: string) => {
    setBlocksForActiveDay(
      activeBlocks.map((block) =>
        block.id === blockId
          ? { ...block, movements: block.movements.filter((m) => m.id !== movementId) }
          : block,
      ),
    )
  }

  const handleSavePlan = () => {
    const nextProgram = buildManualProgram(slots, dayBlocks, state.generatorSettings, program)
    generatePlan(nextProgram)
    navigate('/plan')
  }

  if (slots.length === 0) {
    return (
      <section>
        <Link to="/plan/setup" className="text-link workout-preview-back">
          ← Split setup
        </Link>
        <p className="generator-panel-copy">Set days and rotation first, then come back to build workouts.</p>
      </section>
    )
  }

  return (
    <section className="plan-build">
      <Link to="/plan" className="text-link workout-preview-back">
        ← Current plan
      </Link>

      <h1 className="page-title" style={{ marginTop: '0.75rem' }}>
        Build workouts
      </h1>
      <p className="subtitle">
        {builtDayCount}/{slots.length} days with movements · add blocks, rest, and library movements per day
      </p>

      <div className="plan-build-day-chips">
        <ScrollableChipRow>
        {slots.map((slot) => {
          const hasContent = dayBlocks[slot.id]?.some((b) => b.movements.length > 0) ?? false
          return (
            <button
              key={slot.id}
              type="button"
              className={`chip ${slot.id === activeSlotId ? 'active' : ''} ${hasContent ? 'has-dot' : ''}`}
              aria-pressed={slot.id === activeSlotId}
              onClick={() => selectSlot(slot.id)}
            >
              {slot.chipLabel}
            </button>
          )
        })}
        </ScrollableChipRow>
      </div>

      {activeSlot ? (
        <div className="card plan-build-day-header">
          <strong>{activeSlot.name}</strong>
          <ScrollableChipRow>
            {(activeSlot.muscleGroups.length ? activeSlot.muscleGroups : ['Any']).map((muscle) => (
              <span key={muscle} className="chip chip-readonly">
                {muscle}
              </span>
            ))}
          </ScrollableChipRow>
        </div>
      ) : null}

      {activeBlocks.length === 0 ? (
        <p className="generator-panel-copy plan-build-empty">
          No blocks yet. Add straight sets or a circuit, then pick movements from your library (filtered to today’s
          muscles and your equipment).
        </p>
      ) : null}

      <div className="plan-build-blocks">
        {activeBlocks.map((block, blockIndex) => (
          <Fragment key={block.id}>
          <article className="card plan-build-block">
            <header className="plan-build-block-header">
              <div>
                <span className="generator-panel-title">
                  Block {blockIndex + 1} · {block.type === 'circuit' ? 'Circuit' : 'Straight'}
                </span>
                {block.type === 'circuit' ? (
                  <p className="library-item-meta" style={{ marginTop: '0.25rem' }}>
                    {block.rounds ?? 3} rounds · {block.restBetweenStationsSec ?? 45}s between sets ·{' '}
                    {block.restBetweenRoundsSec ?? 90}s between rounds
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-small"
                onClick={() => removeBlock(block.id)}
                aria-label="Remove block"
              >
                Remove
              </button>
            </header>

            {block.type === 'circuit' ? (
              <div className="plan-build-rest-grid">
                <label className="plan-build-field">
                  <span className="plan-build-field-label">Rounds</span>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={block.rounds ?? 3}
                    onChange={(e) =>
                      updateBlock(block.id, { rounds: Math.max(1, Number(e.target.value) || 1) })
                    }
                  />
                </label>
                <label className="plan-build-field">
                  <span className="plan-build-field-label">Between sets (s)</span>
                  <input
                    type="number"
                    min={0}
                    step={15}
                    value={block.restBetweenStationsSec ?? 45}
                    onChange={(e) =>
                      updateBlock(block.id, { restBetweenStationsSec: Math.max(0, Number(e.target.value) || 0) })
                    }
                  />
                </label>
                <label className="plan-build-field">
                  <span className="plan-build-field-label">Between rounds (s)</span>
                  <input
                    type="number"
                    min={0}
                    step={15}
                    value={block.restBetweenRoundsSec ?? 90}
                    onChange={(e) =>
                      updateBlock(block.id, { restBetweenRoundsSec: Math.max(0, Number(e.target.value) || 0) })
                    }
                  />
                </label>
              </div>
            ) : null}

            <ul className="plan-build-movements">
              {block.movements.map((movement, movementIndex) => (
                <li key={movement.id} className="plan-build-movement">
                  <div className="plan-build-movement-head">
                    <strong>
                      {movementIndex + 1}. {movement.name}
                    </strong>
                    <button
                      type="button"
                      className="btn btn-ghost btn-small"
                      onClick={() => removeMovement(block.id, movement.id)}
                    >
                      Remove
                    </button>
                  </div>
                  <p className="library-item-meta">{movement.muscleGroup}</p>
                  <div className="plan-build-movement-controls">
                    {block.type === 'straight' ? (
                      <label className="plan-build-field plan-build-field-inline">
                        <span className="plan-build-field-label">Sets</span>
                        <input
                          type="number"
                          min={1}
                          max={12}
                          value={movement.sets}
                          onChange={(e) =>
                            updateMovement(block.id, movement.id, {
                              sets: Math.max(1, Number(e.target.value) || 1),
                            })
                          }
                        />
                      </label>
                    ) : null}
                    {block.type === 'circuit' ? (
                      <div className="plan-build-circuit-reps">
                        <div className="plan-build-reps-rounds">
                          {Array.from({ length: block.rounds ?? 3 }, (_, roundIndex) => {
                            const rounds = block.rounds ?? 3
                            const roundReps = circuitRepsForRounds(movement, rounds)
                            return (
                              <label
                                key={`${movement.id}-round-${roundIndex}`}
                                className="plan-build-field plan-build-field-inline"
                              >
                                <span className="plan-build-field-label">R{roundIndex + 1}</span>
                                <input
                                  type="text"
                                  value={roundReps[roundIndex]}
                                  onChange={(e) => {
                                    const next = [...roundReps]
                                    next[roundIndex] = e.target.value
                                    updateMovement(block.id, movement.id, {
                                      repsPerRound: next,
                                      reps: next[0] ?? CIRCUIT_DEFAULT_REPS,
                                    })
                                  }}
                                />
                              </label>
                            )
                          })}
                        </div>
                      </div>
                    ) : (
                      <label className="plan-build-field plan-build-field-inline">
                        <span className="plan-build-field-label">Reps</span>
                        <input
                          type="text"
                          value={movement.reps}
                          onChange={(e) => updateMovement(block.id, movement.id, { reps: e.target.value })}
                        />
                      </label>
                    )}
                  </div>
                  {block.type === 'straight' ? (
                    <div className="plan-build-rest-row">
                      <span className="plan-build-field-label">Rest after</span>
                      <div className="chip-row">
                        {REST_PRESETS.map((sec) => (
                          <button
                            key={sec}
                            type="button"
                            className={`chip ${movement.restSeconds === sec ? 'active' : ''}`}
                            onClick={() => updateMovement(block.id, movement.id, { restSeconds: sec })}
                          >
                            {sec}s
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>

            {pickerBlockId === block.id ? (
              <div className="plan-build-picker">
                <p className="generator-panel-title">Add movement</p>
                {catalogLoading ? (
                  <p className="library-item-meta">Loading library…</p>
                ) : pickerExercises.length === 0 ? (
                  <p className="library-item-meta">
                    No matches for this day’s muscles and your equipment. Adjust equipment in Settings or broaden muscle
                    focus on split setup.
                  </p>
                ) : (
                  <ul className="plan-build-picker-list">
                    {pickerExercises.slice(0, 40).map((exercise) => (
                      <li key={exercise.id}>
                        <button
                          type="button"
                          className="plan-build-picker-item"
                          onClick={() => addMovement(block.id, exercise)}
                        >
                          <strong>{exercise.name}</strong>
                          <span className="library-item-meta">{exercise.muscleGroup}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                <button
                  type="button"
                  className="btn btn-ghost btn-small"
                  style={{ marginTop: '0.5rem' }}
                  onClick={() => setPickerBlockId(null)}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="btn btn-ghost btn-small"
                style={{ marginTop: '0.5rem' }}
                disabled={catalogLoading}
                onClick={() => setPickerBlockId(block.id)}
              >
                + Add movement
              </button>
            )}
          </article>
          {blockIndex < activeBlocks.length - 1 ? (
            <div className="plan-build-break">
              <span className="plan-build-field-label plan-build-break-label">BREAK (s)</span>
              <span className="plan-build-break-line plan-build-break-line--left" aria-hidden />
              <input
                type="number"
                min={0}
                step={15}
                className="plan-build-break-input"
                aria-label={`Break after block ${blockIndex + 1} before block ${blockIndex + 2}`}
                value={block.restAfterBlockSec ?? defaultBreakAfterBlock(block)}
                onChange={(e) =>
                  updateBlock(block.id, {
                    restAfterBlockSec: Math.max(0, Number(e.target.value) || 0),
                  })
                }
              />
              <span className="plan-build-break-line plan-build-break-line--right" aria-hidden />
            </div>
          ) : null}
          </Fragment>
        ))}
      </div>

      <div className="plan-build-add-block">
        <button type="button" className="btn btn-ghost" onClick={() => addBlock('straight')}>
          + Straight block
        </button>
        <button type="button" className="btn btn-ghost" onClick={() => addBlock('circuit')}>
          + Circuit block
        </button>
      </div>

      <button type="button" className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={handleSavePlan}>
        Save plan
      </button>
    </section>
  )
}