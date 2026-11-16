import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserSwitcher } from '../components/UserSwitcher'
import { WorkoutHistoryList } from '../components/WorkoutHistoryList'
import { useAuth } from '../context/AuthContext'
import { useApp } from '../context/AppContext'
import {
  DEFAULT_ENABLED_LIBRARY_EQUIPMENT,
  equipmentLabel,
  LIBRARY_EQUIPMENT_OPTIONS,
  type LibraryEquipmentId,
} from '../lib/equipment'
import { THEME_COLOR_OPTIONS, type ThemeColorId } from '../lib/theme'

export function SettingsPage() {
  const navigate = useNavigate()
  const { signOutUser } = useAuth()
  const {
    state,
    catalogLoading,
    saveEquipmentPreferences,
    savePrimaryColor,
    dislikedExerciseIds,
    setExerciseDislikedPreference,
    catalog,
  } = useApp()
  const [selected, setSelected] = useState<Set<LibraryEquipmentId>>(
    () => new Set(state.enabledLibraryEquipment as LibraryEquipmentId[]),
  )
  const [equipmentStatus, setEquipmentStatus] = useState<string | null>(null)

  useEffect(() => {
    setSelected(new Set(state.enabledLibraryEquipment as LibraryEquipmentId[]))
  }, [state.enabledLibraryEquipment])

  const sortedSelection = useMemo(() => {
    const order = LIBRARY_EQUIPMENT_OPTIONS.map((o) => o.id)
    return [...selected].sort((a, b) => order.indexOf(a) - order.indexOf(b))
  }, [selected])

  const blockedExercises = useMemo(() => {
    const blocked = new Set(dislikedExerciseIds)
    return catalog.filter((exercise) => blocked.has(exercise.id))
  }, [catalog, dislikedExerciseIds])

  const activeThemeLabel = useMemo(
    () => THEME_COLOR_OPTIONS.find((option) => option.id === state.primaryColorId)?.label ?? 'Orange',
    [state.primaryColorId],
  )

  const sessionCount = state.sessions.filter((s) => s.completedAt).length

  const toggle = (id: LibraryEquipmentId) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
    setEquipmentStatus(null)
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
      <p className="subtitle">Accent color, equipment, blocked lifts, and workout history.</p>

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

      <details className="card settings-disclosure" style={{ marginTop: '1rem' }}>
        <summary className="settings-disclosure-summary">
          <span className="settings-disclosure-heading">
            <span className="generator-panel-title">History</span>
            <span className="generator-panel-copy settings-disclosure-meta">
              {sessionCount} {sessionCount === 1 ? 'workout' : 'workouts'}
            </span>
          </span>
          <span className="settings-disclosure-chevron" aria-hidden />
        </summary>
        <div className="settings-disclosure-body">
          <WorkoutHistoryList />
        </div>
      </details>
    </section>
  )
}