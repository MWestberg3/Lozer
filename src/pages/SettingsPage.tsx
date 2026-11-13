import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { UserSwitcher } from '../components/UserSwitcher'
import { useAuth } from '../context/AuthContext'
import { useApp } from '../context/AppContext'
import { getSessionsForUser } from '../storage/db'
import {
  DEFAULT_ENABLED_LIBRARY_EQUIPMENT,
  LIBRARY_EQUIPMENT_OPTIONS,
  type LibraryEquipmentId,
} from '../lib/equipment'
import { generateProgram, recentExerciseIdsFromSessions } from '../lib/workoutGenerator'
import { THEME_COLOR_OPTIONS, type ThemeColorId } from '../lib/theme'

export function SettingsPage() {
  const navigate = useNavigate()
  const { signOutUser } = useAuth()
  const { state, catalog, catalogLoading, saveEquipmentPreferences, savePrimaryColor, generatePlan } = useApp()
  const [selected, setSelected] = useState<Set<LibraryEquipmentId>>(
    () => new Set(state.enabledLibraryEquipment as LibraryEquipmentId[]),
  )
  const [status, setStatus] = useState<string | null>(null)

  useEffect(() => {
    setSelected(new Set(state.enabledLibraryEquipment as LibraryEquipmentId[]))
  }, [state.enabledLibraryEquipment])

  const sortedSelection = useMemo(() => {
    const order = LIBRARY_EQUIPMENT_OPTIONS.map((o) => o.id)
    return [...selected].sort((a, b) => order.indexOf(a) - order.indexOf(b))
  }, [selected])

  const toggle = (id: LibraryEquipmentId) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
    setStatus(null)
  }

  const handleSave = () => {
    if (selected.size === 0) {
      setStatus('Pick at least one equipment type so we can build workouts.')
      return
    }
    const ids = sortedSelection
    saveEquipmentPreferences(ids)
    if (catalog.length === 0) {
      setStatus('Equipment saved. Regenerate your plan from Library once the catalog finishes loading.')
      return
    }
    const sessions = getSessionsForUser(state)
    const recent = recentExerciseIdsFromSessions(sessions)
    const nextProgram = generateProgram(
      state.generatorSettings,
      ids,
      recent,
      catalog,
      state.dislikedExerciseIds,
      `gear-${Date.now()}`,
    )
    generatePlan(nextProgram)
    setStatus('Equipment saved — your plan was rebuilt to match.')
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
      <p className="subtitle">Tell Lozer what you actually have access to. The generator only picks exercises you can do.</p>

      <div className="card">
        <div className="generator-panel-title">Accent color</div>
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
            Save &amp; rebuild plan
          </button>
          {status ? (
            <p className="generator-status" role="status">
              {status}
            </p>
          ) : null}
        </div>
      </details>

      <div className="card" style={{ marginTop: '1rem' }}>
        <div className="generator-panel-title">Training preferences</div>
        <p className="generator-panel-copy">
          Goal, days per week, and program refresh live on the{' '}
          <Link to="/library">Library</Link> tab.
        </p>
      </div>
    </section>
  )
}
