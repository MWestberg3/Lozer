import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppSelect } from '../components/AppSelect'
import { UserSwitcher } from '../components/UserSwitcher'
import { useAuth } from '../context/AuthContext'
import { useApp } from '../context/AppContext'
import { getSessionsForUser } from '../storage/db'
import {
  DEFAULT_ENABLED_LIBRARY_EQUIPMENT,
  LIBRARY_EQUIPMENT_OPTIONS,
  type LibraryEquipmentId,
} from '../lib/equipment'
import { clampDaysPerWeek, generateProgram, recentExerciseIdsFromSessions } from '../lib/workoutGenerator'
import { THEME_COLOR_OPTIONS, type ThemeColorId } from '../lib/theme'
import type { GeneratorSettings } from '../types/workout'

export function SettingsPage() {
  const navigate = useNavigate()
  const { signOutUser } = useAuth()
  const {
    state,
    program,
    catalog,
    catalogLoading,
    saveEquipmentPreferences,
    savePrimaryColor,
    saveGeneratorSettings,
    generatePlan,
  } = useApp()
  const [selected, setSelected] = useState<Set<LibraryEquipmentId>>(
    () => new Set(state.enabledLibraryEquipment as LibraryEquipmentId[]),
  )
  const [generatorSettings, setGeneratorSettings] = useState<GeneratorSettings>(state.generatorSettings)
  const [equipmentStatus, setEquipmentStatus] = useState<string | null>(null)
  const [planStatus, setPlanStatus] = useState<string | null>(null)

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
    const next = { ...generatorSettings, ...patch }
    setGeneratorSettings(next)
    saveGeneratorSettings(next)
    setPlanStatus(null)
  }

  const handleGenerate = () => {
    const sessions = getSessionsForUser(state)
    const recent = recentExerciseIdsFromSessions(sessions)
    if (catalog.length === 0) {
      setPlanStatus('Exercise library is still loading.')
      return
    }
    const nextProgram = generateProgram(
      generatorSettings,
      state.enabledLibraryEquipment,
      recent,
      catalog,
      state.dislikedExerciseIds,
      `regen-${Date.now()}`,
    )
    generatePlan(nextProgram)
    setPlanStatus('New plan ready — home updated.')
  }

  const handleSave = () => {
    if (selected.size === 0) {
      setEquipmentStatus('Pick at least one equipment type so we can build workouts.')
      return
    }
    const ids = sortedSelection
    saveEquipmentPreferences(ids)
    if (catalog.length === 0) {
      setEquipmentStatus('Equipment saved. Generate a new program below once the catalog finishes loading.')
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
    setEquipmentStatus('Equipment saved — your plan was rebuilt to match.')
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

      <div className="card generator-panel">
        <div className="generator-panel-title">Days per week</div>
        <p className="generator-panel-copy">
          Lozer picks compounds first, respects your equipment below, and swaps lifts you did recently. Weights still
          prefill from your history when you train.
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
        <button
          type="button"
          className="btn btn-primary"
          style={{ marginTop: '0.75rem' }}
          onClick={handleGenerate}
          disabled={catalogLoading}
        >
          {catalogLoading ? 'Loading library…' : 'Generate new program'}
        </button>
        {planStatus ? (
          <p className="generator-status" role="status">
            {planStatus}
          </p>
        ) : null}
        {program.generatedAt ? (
          <p className="generator-panel-copy" style={{ marginBottom: 0, marginTop: '0.75rem' }}>
            updated {new Date(program.generatedAt).toLocaleDateString()}
          </p>
        ) : null}
      </div>

      <div className="card" style={{ marginTop: '1rem' }}>
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
          {equipmentStatus ? (
            <p className="generator-status" role="status">
              {equipmentStatus}
            </p>
          ) : null}
        </div>
      </details>
    </section>
  )
}
