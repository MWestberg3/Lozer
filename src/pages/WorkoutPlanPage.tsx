import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppSelect } from '../components/AppSelect'
import { ScrollableChipRow } from '../components/ScrollableChipRow'
import { useApp } from '../context/AppContext'
import { clampCustomRotationWeeks, clampDaysPerWeek, normalizeGeneratorSettings } from '../lib/workoutGenerator'
import { sortedMuscleGroupsFromCatalog } from '../lib/muscleRotation'
import type { CustomRotationWeeks, GeneratorSettings, RotationMode } from '../types/workout'

export function WorkoutPlanPage() {
  const navigate = useNavigate()
  const { state, catalog, catalogLoading, saveGeneratorSettings } = useApp()
  const [generatorSettings, setGeneratorSettings] = useState<GeneratorSettings>(state.generatorSettings)

  useEffect(() => {
    setGeneratorSettings(state.generatorSettings)
  }, [state.generatorSettings])

  const muscleGroups = useMemo(() => sortedMuscleGroupsFromCatalog(catalog), [catalog])

  const savedPlanSettings = state.generatorSettings

  const planSettingsSnapshot = (settings: GeneratorSettings) =>
    JSON.stringify(normalizeGeneratorSettings({}, settings, muscleGroups))

  const planSettingsDirty = useMemo(
    () => planSettingsSnapshot(generatorSettings) !== planSettingsSnapshot(savedPlanSettings),
    [generatorSettings, savedPlanSettings, muscleGroups],
  )

  const updateDraftPlanSettings = (patch: Partial<GeneratorSettings>) => {
    const next = normalizeGeneratorSettings(patch, generatorSettings, muscleGroups)
    setGeneratorSettings(next)
  }

  const handleNext = () => {
    const next = normalizeGeneratorSettings({}, generatorSettings, muscleGroups)
    setGeneratorSettings(next)
    saveGeneratorSettings(next)
    navigate('/plan/build')
  }

  const customRotationMuscles =
    generatorSettings.rotationMode === 'custom' ? (generatorSettings.customRotationMuscles ?? []) : []

  const toggleCustomSlotMuscle = (slotIndex: number, muscle: string) => {
    const nextSlots = customRotationMuscles.map((groups, index) => {
      if (index !== slotIndex) return [...groups]
      const set = new Set(groups)
      if (set.has(muscle)) set.delete(muscle)
      else set.add(muscle)
      return [...set].sort((a, b) => a.localeCompare(b))
    })
    updateDraftPlanSettings({ customRotationMuscles: nextSlots })
  }

  const clearCustomSlotMuscles = (slotIndex: number) => {
    const nextSlots = customRotationMuscles.map((groups, index) => (index === slotIndex ? [] : [...groups]))
    updateDraftPlanSettings({ customRotationMuscles: nextSlots })
  }

  return (
    <section>
      <h1 className="page-title">Workout Plan</h1>
      <p className="subtitle">
        {savedPlanSettings.daysPerWeek} {savedPlanSettings.daysPerWeek === 1 ? 'day' : 'days'} per week
        {savedPlanSettings.rotationMode === 'custom'
          ? ` · ${savedPlanSettings.customRotationWeeks}-week rotation`
          : ' · same split each week'}
        {planSettingsDirty ? ' · unsaved changes' : ''}
      </p>

      <div className="card generator-panel">
        <div className="generator-panel-title">Days per week</div>
        <p className="generator-panel-copy">
          How often you train and how your split rotates. When you’re done, tap Next to build circuits, rest times, and
          movements for each day.
        </p>
        <AppSelect
          id="days-per-week"
          aria-label="Days per week"
          value={generatorSettings.daysPerWeek}
          options={([1, 2, 3, 4, 5, 6, 7] as const).map((days) => ({
            value: days,
            label: `${days} ${days === 1 ? 'day' : 'days'} per week`,
          }))}
          onChange={(days) => updateDraftPlanSettings({ daysPerWeek: clampDaysPerWeek(days) })}
        />

        <div className="generator-panel-title" style={{ marginTop: '1rem' }}>
          Rotation
        </div>
        <p className="generator-panel-copy">
          Same split every week, or map each slot across 1–3 weeks before the pattern repeats. Custom uses library muscle
          groups per day (tap multiple pills, e.g. Chest + Triceps).
        </p>
        <AppSelect
          id="rotation-mode"
          aria-label="Rotation mode"
          value={generatorSettings.rotationMode}
          options={[
            { value: 'default' as RotationMode, label: 'Same split every week' },
            { value: 'custom' as RotationMode, label: 'Multi-week rotation' },
          ]}
          onChange={(mode) => updateDraftPlanSettings({ rotationMode: mode })}
        />

        {generatorSettings.rotationMode === 'custom' ? (
          <>
            <AppSelect
              id="rotation-weeks"
              aria-label="Rotation cycle length in weeks"
              value={generatorSettings.customRotationWeeks}
              options={([1, 2, 3] as const).map((weeks) => ({
                value: weeks as CustomRotationWeeks,
                label: `${weeks} ${weeks === 1 ? 'week' : 'weeks'} before repeat`,
              }))}
              onChange={(weeks) =>
                updateDraftPlanSettings({ customRotationWeeks: clampCustomRotationWeeks(weeks) })
              }
              className="rotation-weeks-select"
            />

            <div className="rotation-slots-grid" role="group" aria-label="Custom rotation by week and day">
              {Array.from({ length: generatorSettings.customRotationWeeks }, (_, weekIndex) => (
                <section key={`rotation-week-${weekIndex + 1}`} className="rotation-week-block">
                  <h3 className="rotation-week-label">Week {weekIndex + 1}</h3>
                  {Array.from({ length: generatorSettings.daysPerWeek }, (_, dayIndex) => {
                    const slotIndex = weekIndex * generatorSettings.daysPerWeek + dayIndex
                    const slotMuscles = new Set(customRotationMuscles[slotIndex] ?? [])
                    return (
                      <div
                        key={`rotation-slot-${slotIndex}`}
                        className="rotation-slot-row"
                        role="group"
                        aria-label={`Week ${weekIndex + 1} day ${dayIndex + 1} muscle groups`}
                      >
                        <div className="rotation-slot-header">
                          <span className="rotation-slot-label">Day {dayIndex + 1}</span>
                          <button
                            type="button"
                            className="rotation-slot-clear"
                            disabled={slotMuscles.size === 0}
                            onClick={() => clearCustomSlotMuscles(slotIndex)}
                          >
                            Deselect all
                          </button>
                        </div>
                        <ScrollableChipRow>
                          {muscleGroups.map((muscle) => {
                            const selected = slotMuscles.has(muscle)
                            return (
                              <button
                                key={muscle}
                                type="button"
                                className={`chip ${selected ? 'active' : ''}`}
                                aria-pressed={selected}
                                disabled={catalogLoading || muscleGroups.length === 0}
                                onClick={() => toggleCustomSlotMuscle(slotIndex, muscle)}
                              >
                                {muscle}
                              </button>
                            )
                          })}
                        </ScrollableChipRow>
                      </div>
                    )
                  })}
                </section>
              ))}
            </div>
          </>
        ) : null}
        <button
          type="button"
          className="btn btn-primary"
          style={{ marginTop: '0.75rem' }}
          onClick={handleNext}
          disabled={catalogLoading}
        >
          Next
        </button>
        {planSettingsDirty ? (
          <p className="library-item-meta" style={{ marginTop: '0.5rem' }}>
            Unsaved split changes will be saved when you continue.
          </p>
        ) : null}
      </div>
    </section>
  )
}