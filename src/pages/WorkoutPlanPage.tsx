import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppSelect } from '../components/AppSelect'
import { ScrollableChipRow } from '../components/ScrollableChipRow'
import { useApp } from '../context/AppContext'
import { clampCustomRotationWeeks, clampDaysPerWeek, normalizeGeneratorSettings } from '../lib/workoutGenerator'
import { rotationSlotCount, sortedMuscleGroupsFromCatalog } from '../lib/muscleRotation'
import type { CustomRotationWeeks, GeneratorSettings, RotationMode } from '../types/workout'

export function WorkoutPlanPage() {
  const navigate = useNavigate()
  const { state, catalog, catalogLoading, saveGeneratorSettings } = useApp()
  const muscleGroups = useMemo(() => sortedMuscleGroupsFromCatalog(catalog), [catalog])
  const [generatorSettings, setGeneratorSettings] = useState<GeneratorSettings>(() =>
    normalizeGeneratorSettings({}, state.generatorSettings, sortedMuscleGroupsFromCatalog(catalog)),
  )

  const savedSettingsKey = useMemo(
    () => JSON.stringify(state.generatorSettings),
    [state.generatorSettings],
  )
  const lastSavedKeyRef = useRef(savedSettingsKey)

  useEffect(() => {
    if (savedSettingsKey !== lastSavedKeyRef.current) {
      lastSavedKeyRef.current = savedSettingsKey
      setGeneratorSettings(normalizeGeneratorSettings({}, state.generatorSettings, muscleGroups))
      return
    }
    setGeneratorSettings((draft) => normalizeGeneratorSettings({}, draft, muscleGroups))
  }, [savedSettingsKey, state.generatorSettings, muscleGroups])

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
    saveGeneratorSettings(next)
    lastSavedKeyRef.current = JSON.stringify(next)
  }

  const handleNext = () => {
    const next = normalizeGeneratorSettings({}, generatorSettings, muscleGroups)
    setGeneratorSettings(next)
    saveGeneratorSettings(next)
    navigate('/plan/build')
  }

  const rotationMuscles = generatorSettings.customRotationMuscles ?? []

  const muscleFocusComplete = useMemo(() => {
    const slots = rotationSlotCount(generatorSettings)
    for (let i = 0; i < slots; i++) {
      if ((rotationMuscles[i]?.length ?? 0) === 0) return false
    }
    return slots > 0
  }, [generatorSettings, rotationMuscles])

  const renderMuscleSlot = (slotIndex: number, dayLabel: string, ariaWeek?: number) => {
    const slotMuscles = new Set(rotationMuscles[slotIndex] ?? [])
    const weekLabel = ariaWeek !== undefined ? `Week ${ariaWeek} ` : ''
    return (
      <div
        key={`rotation-slot-${slotIndex}`}
        className="rotation-slot-row"
        role="group"
        aria-label={`${weekLabel}${dayLabel} muscle groups`}
      >
        <div className="rotation-slot-header">
          <span className="rotation-slot-label">{dayLabel}</span>
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
  }

  const toggleCustomSlotMuscle = (slotIndex: number, muscle: string) => {
    const nextSlots = rotationMuscles.map((groups, index) => {
      if (index !== slotIndex) return [...groups]
      const set = new Set(groups)
      if (set.has(muscle)) set.delete(muscle)
      else set.add(muscle)
      return [...set].sort((a, b) => a.localeCompare(b))
    })
    updateDraftPlanSettings({ customRotationMuscles: nextSlots })
  }

  const clearCustomSlotMuscles = (slotIndex: number) => {
    const nextSlots = rotationMuscles.map((groups, index) => (index === slotIndex ? [] : [...groups]))
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
          Same split every week repeats one weekly template; multi-week rotation lets each week differ before the pattern
          repeats. Pick muscle focus for each day below — nothing is auto-built until you add movements on the next step.
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
        ) : null}

        <div className="generator-panel-title" style={{ marginTop: '1rem' }}>
          Muscle focus
        </div>
        <p className="generator-panel-copy">
          Tap one or more groups per day (e.g. Chest + Triceps). Days start empty until you pick muscles.
        </p>

        <div className="rotation-slots-grid" role="group" aria-label="Muscle focus by training day">
          {generatorSettings.rotationMode === 'custom'
            ? Array.from({ length: generatorSettings.customRotationWeeks }, (_, weekIndex) => (
                <section key={`rotation-week-${weekIndex + 1}`} className="rotation-week-block">
                  <h3 className="rotation-week-label">Week {weekIndex + 1}</h3>
                  {Array.from({ length: generatorSettings.daysPerWeek }, (_, dayIndex) => {
                    const slotIndex = weekIndex * generatorSettings.daysPerWeek + dayIndex
                    return renderMuscleSlot(slotIndex, `Day ${dayIndex + 1}`, weekIndex + 1)
                  })}
                </section>
              ))
            : Array.from({ length: generatorSettings.daysPerWeek }, (_, dayIndex) =>
                renderMuscleSlot(dayIndex, `Day ${dayIndex + 1}`),
              )}
        </div>
        <button
          type="button"
          className="btn btn-primary"
          style={{ marginTop: '0.75rem' }}
          onClick={handleNext}
          disabled={catalogLoading || !muscleFocusComplete}
        >
          Next
        </button>
        {!muscleFocusComplete ? (
          <p className="library-item-meta" style={{ marginTop: '0.5rem' }}>
            Pick at least one muscle for every day before continuing.
          </p>
        ) : planSettingsDirty ? (
          <p className="library-item-meta" style={{ marginTop: '0.5rem' }}>
            Unsaved split changes will be saved when you continue.
          </p>
        ) : null}
      </div>
    </section>
  )
}