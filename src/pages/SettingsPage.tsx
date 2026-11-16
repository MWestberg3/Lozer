import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppSelect } from '../components/AppSelect'
import { ScrollableChipRow } from '../components/ScrollableChipRow'
import { UserSwitcher } from '../components/UserSwitcher'
import { useAuth } from '../context/AuthContext'
import { useApp } from '../context/AppContext'
import {
  DEFAULT_ENABLED_LIBRARY_EQUIPMENT,
  equipmentLabel,
  LIBRARY_EQUIPMENT_OPTIONS,
  type LibraryEquipmentId,
} from '../lib/equipment'
import { clampCustomRotationWeeks, clampDaysPerWeek, normalizeGeneratorSettings } from '../lib/workoutGenerator'
import { sortedMuscleGroupsFromCatalog } from '../lib/muscleRotation'
import { THEME_COLOR_OPTIONS, type ThemeColorId } from '../lib/theme'
import type { CustomRotationWeeks, GeneratorSettings, RotationMode } from '../types/workout'

export function SettingsPage() {
  const navigate = useNavigate()
  const { signOutUser } = useAuth()
  const {
    state,
    catalog,
    catalogLoading,
    saveEquipmentPreferences,
    savePrimaryColor,
    saveGeneratorSettings,
    dislikedExerciseIds,
    setExerciseDislikedPreference,
  } = useApp()
  const [selected, setSelected] = useState<Set<LibraryEquipmentId>>(
    () => new Set(state.enabledLibraryEquipment as LibraryEquipmentId[]),
  )
  const [generatorSettings, setGeneratorSettings] = useState<GeneratorSettings>(state.generatorSettings)
  const [equipmentStatus, setEquipmentStatus] = useState<string | null>(null)

  useEffect(() => {
    setGeneratorSettings(state.generatorSettings)
  }, [state.generatorSettings])

  useEffect(() => {
    setSelected(new Set(state.enabledLibraryEquipment as LibraryEquipmentId[]))
  }, [state.enabledLibraryEquipment])

  const sortedSelection = useMemo(() => {
    const order = LIBRARY_EQUIPMENT_OPTIONS.map((o) => o.id)
    return [...selected].sort((a, b) => order.indexOf(a) - order.indexOf(b))
  }, [selected])

  const muscleGroups = useMemo(() => sortedMuscleGroupsFromCatalog(catalog), [catalog])

  const blockedExercises = useMemo(() => {
    const blocked = new Set(dislikedExerciseIds)
    return catalog.filter((exercise) => blocked.has(exercise.id))
  }, [catalog, dislikedExerciseIds])

  const activeThemeLabel = useMemo(
    () => THEME_COLOR_OPTIONS.find((option) => option.id === state.primaryColorId)?.label ?? 'Orange',
    [state.primaryColorId],
  )

  const toggle = (id: LibraryEquipmentId) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
    setEquipmentStatus(null)
  }

  const applyGeneratorSettings = (patch: Partial<GeneratorSettings>) => {
    const next = normalizeGeneratorSettings(patch, generatorSettings, muscleGroups)
    setGeneratorSettings(next)
    saveGeneratorSettings(next)
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
    applyGeneratorSettings({ customRotationMuscles: nextSlots })
  }

  const clearCustomSlotMuscles = (slotIndex: number) => {
    const nextSlots = customRotationMuscles.map((groups, index) => (index === slotIndex ? [] : [...groups]))
    applyGeneratorSettings({ customRotationMuscles: nextSlots })
  }

  const handleSave = () => {
    if (selected.size === 0) {
      setEquipmentStatus('Pick at least one equipment type so we can build workouts.')
      return
    }
    saveEquipmentPreferences(sortedSelection)
    setEquipmentStatus('Equipment saved.')
  }

  const switchAccount = async () => {
    await signOutUser()
    navigate('/')
  }

  return (
    <section>
      <header className="settings-account-header">
        <UserSwitcher />
        <button type="button" className="btn btn-ghost btn-small settings-sign-out" onClick={switchAccount}>
          Sign out
        </button>
      </header>

      <h1 className="page-title">Settings</h1>
      <p className="subtitle">Equipment, plan preferences, and blocked lifts. Changes save as you go.</p>

      <details className="card settings-disclosure">
        <summary className="settings-disclosure-summary">
          <span className="settings-disclosure-heading">
            <span className="generator-panel-title">Accent color</span>
            <span className="generator-panel-copy settings-disclosure-meta">{activeThemeLabel}</span>
          </span>
          <span className="settings-disclosure-chevron" aria-hidden />
        </summary>
        <div className="settings-disclosure-body">
          <div className="theme-color-grid">
            {THEME_COLOR_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                className={`theme-swatch ${state.primaryColorId === option.id ? 'active' : ''}`}
                onClick={() => savePrimaryColor(option.id as ThemeColorId)}
                aria-pressed={state.primaryColorId === option.id}
              >
                <span className="theme-swatch-dot" style={{ background: option.accent }} aria-hidden />
                <span className="theme-swatch-label">{option.label}</span>
              </button>
            ))}
          </div>
        </div>
      </details>

      <details className="card settings-disclosure generator-panel" style={{ marginTop: '1rem' }}>
        <summary className="settings-disclosure-summary">
          <span className="settings-disclosure-heading">
            <span className="generator-panel-title">Workout Plan</span>
            <span className="generator-panel-copy settings-disclosure-meta">
              {generatorSettings.daysPerWeek} {generatorSettings.daysPerWeek === 1 ? 'day' : 'days'} per week
              {generatorSettings.rotationMode === 'custom'
                ? ` · ${generatorSettings.customRotationWeeks}-week rotation`
                : ' · same split each week'}
            </span>
          </span>
          <span className="settings-disclosure-chevron" aria-hidden />
        </summary>
        <div className="settings-disclosure-body">
        <div className="generator-panel-title">Days per week</div>
        <p className="generator-panel-copy">
          How often you train and how your split rotates. Saved for your account—your home plan is not changed here.
        </p>
        <AppSelect
          id="days-per-week"
          aria-label="Days per week"
          value={generatorSettings.daysPerWeek}
          options={([1, 2, 3, 4, 5, 6, 7] as const).map((days) => ({
            value: days,
            label: `${days} ${days === 1 ? 'day' : 'days'} per week`,
          }))}
          onChange={(days) => applyGeneratorSettings({ daysPerWeek: clampDaysPerWeek(days) })}
        />

        <div className="generator-panel-title" style={{ marginTop: '1rem' }}>
          Rotation
        </div>
        <p className="generator-panel-copy">
          Same split every week, or map each slot across 1–3 weeks before the pattern repeats. Custom uses library
          muscle groups per day (tap multiple pills, e.g. Chest + Triceps).
        </p>
        <AppSelect
          id="rotation-mode"
          aria-label="Rotation mode"
          value={generatorSettings.rotationMode}
          options={[
            { value: 'default' as RotationMode, label: 'Same split every week' },
            { value: 'custom' as RotationMode, label: 'Multi-week rotation' },
          ]}
          onChange={(mode) => applyGeneratorSettings({ rotationMode: mode })}
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
              onChange={(weeks) => applyGeneratorSettings({ customRotationWeeks: clampCustomRotationWeeks(weeks) })}
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
        </div>
      </details>

      <details className="card settings-disclosure" style={{ marginTop: '1rem' }}>
        <summary className="settings-disclosure-summary">
          <span className="settings-disclosure-heading">
            <span className="generator-panel-title">My equipment</span>
            <span className="generator-panel-copy settings-disclosure-meta">
              {selected.size} of {LIBRARY_EQUIPMENT_OPTIONS.length} types selected
              {selected.size === DEFAULT_ENABLED_LIBRARY_EQUIPMENT.length ? ' (full gym)' : ''}
            </span>
          </span>
          <span className="settings-disclosure-chevron" aria-hidden />
        </summary>
        <div className="settings-disclosure-body">
          <ul className="settings-equipment-list">
            {LIBRARY_EQUIPMENT_OPTIONS.map((option) => {
              const checked = selected.has(option.id)
              return (
                <li key={option.id}>
                  <label className="settings-equipment-row">
                    <input type="checkbox" checked={checked} onChange={() => toggle(option.id)} />
                    <span className="settings-equipment-label">{option.label}</span>
                  </label>
                </li>
              )
            })}
          </ul>
          <button
            type="button"
            className="btn btn-primary"
            style={{ marginTop: '0.75rem' }}
            onClick={handleSave}
            disabled={catalogLoading}
          >
            Save
          </button>
          {equipmentStatus ? (
            <p className="generator-status" role="status">
              {equipmentStatus}
            </p>
          ) : null}
        </div>
      </details>

      <details className="card settings-disclosure" style={{ marginTop: '1rem' }}>
        <summary className="settings-disclosure-summary">
          <span className="settings-disclosure-heading">
            <span className="generator-panel-title">Blocked</span>
            <span className="generator-panel-copy settings-disclosure-meta">
              {dislikedExerciseIds.length} don&rsquo;t recommend
            </span>
          </span>
          <span className="settings-disclosure-chevron" aria-hidden />
        </summary>
        <div className="settings-disclosure-body">
          {blockedExercises.length === 0 ? (
            <p className="generator-panel-copy" style={{ margin: 0 }}>
              No blocked exercises. Block lifts from the Library with &ldquo;Don&rsquo;t recommend.&rdquo;
            </p>
          ) : (
            <ul className="settings-blocked-list">
              {blockedExercises.map((exercise) => (
                <li key={exercise.id} className="card library-item is-blocked settings-blocked-item">
                  {exercise.imageUrl ? (
                    <img
                      src={exercise.imageUrl}
                      alt=""
                      className="library-thumb"
                      loading="lazy"
                      width={120}
                      height={90}
                    />
                  ) : null}
                  <strong>{exercise.name}</strong>
                  <p className="library-item-meta">
                    {exercise.muscleGroup} · {equipmentLabel(exercise.libraryEquipment)}
                  </p>
                  <button
                    type="button"
                    className="btn btn-ghost btn-small is-blocked-btn"
                    style={{ marginTop: '0.5rem' }}
                    onClick={() => setExerciseDislikedPreference(exercise.id, false)}
                  >
                    Allow again
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </details>
    </section>
  )
}
