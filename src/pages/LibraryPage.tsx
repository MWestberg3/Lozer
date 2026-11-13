import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ScrollableChipRow } from '../components/ScrollableChipRow'
import { useApp } from '../context/AppContext'
import { equipmentLabel, LIBRARY_EQUIPMENT_OPTIONS } from '../lib/equipment'
import { getSessionsForUser } from '../storage/db'
import { generateProgram, recentExerciseIdsFromSessions } from '../lib/workoutGenerator'
import type { GeneratorSettings, TrainingGoal } from '../types/workout'

export function LibraryPage() {
  const {
    state,
    program,
    catalog,
    catalogLoading,
    generatePlan,
    saveGeneratorSettings,
    dislikedExerciseIds,
    isExerciseDisliked,
    setExerciseDislikedPreference,
  } = useApp()
  const [settings, setSettings] = useState<GeneratorSettings>(state.generatorSettings)
  const [selectedEquipment, setSelectedEquipment] = useState<Set<string>>(() => new Set())
  const [selectedMuscles, setSelectedMuscles] = useState<Set<string>>(() => new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [status, setStatus] = useState<string | null>(null)

  const toggleEquipment = (id: string) => {
    setSelectedEquipment((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleMuscle = (item: string) => {
    setSelectedMuscles((prev) => {
      const next = new Set(prev)
      if (next.has(item)) next.delete(item)
      else next.add(item)
      return next
    })
  }

  const equipmentFilters = useMemo(() => {
    const present = new Set(catalog.map((exercise) => exercise.libraryEquipment))
    return LIBRARY_EQUIPMENT_OPTIONS.filter((option) => present.has(option.id))
  }, [catalog])

  const muscleFilters = useMemo(() => {
    const groups = new Set<string>()
    for (const exercise of catalog) groups.add(exercise.muscleGroup)
    const sorted = [...groups].sort((a, b) => a.localeCompare(b))
    return [...sorted, 'Blocked']
  }, [catalog])

  const searchNormalized = searchQuery.trim().toLowerCase()
  const filtersActive =
    selectedEquipment.size > 0 || selectedMuscles.size > 0 || searchNormalized.length > 0

  const filtered = useMemo(() => {
    if (!filtersActive) return []
    const showBlocked = selectedMuscles.has('Blocked')
    const muscleGroups = [...selectedMuscles].filter((item) => item !== 'Blocked')
    return catalog.filter((exercise) => {
      const equipmentMatch =
        selectedEquipment.size === 0 || selectedEquipment.has(exercise.libraryEquipment)
      const blockedMatch = showBlocked && isExerciseDisliked(exercise.id)
      const groupMatch = muscleGroups.length > 0 && muscleGroups.includes(exercise.muscleGroup)
      const muscleMatch = selectedMuscles.size === 0 || blockedMatch || groupMatch
      const searchMatch =
        searchNormalized.length === 0 ||
        exercise.name.toLowerCase().includes(searchNormalized) ||
        exercise.muscleGroup.toLowerCase().includes(searchNormalized) ||
        equipmentLabel(exercise.libraryEquipment).toLowerCase().includes(searchNormalized)
      return equipmentMatch && muscleMatch && searchMatch
    })
  }, [
    catalog,
    selectedEquipment,
    selectedMuscles,
    filtersActive,
    searchNormalized,
    isExerciseDisliked,
  ])

  const applySettings = (patch: Partial<GeneratorSettings>) => {
    const next = { ...settings, ...patch }
    setSettings(next)
    saveGeneratorSettings(next)
  }

  const handleGenerate = () => {
    const sessions = getSessionsForUser(state)
    const recent = recentExerciseIdsFromSessions(sessions)
    if (catalog.length === 0) {
      setStatus('Exercise library is still loading.')
      return
    }
    const nextProgram = generateProgram(
      settings,
      state.enabledLibraryEquipment,
      recent,
      catalog,
      state.dislikedExerciseIds,
      `regen-${Date.now()}`,
    )
    generatePlan(nextProgram)
    setStatus('New plan ready — home and train tabs updated.')
  }

  return (
    <section>
      <h1 className="page-title">Library</h1>
      <p className="subtitle">Exercise catalog and auto-generated programs like Shred.</p>

      <div className="card generator-panel">
        <div className="generator-panel-title">Build my plan</div>
        <p className="generator-panel-copy">
          Lozer picks compounds first, respects your{' '}
          <Link to="/settings">equipment settings</Link>, and swaps lifts you did recently. Weights still prefill from
          your history when you train.
        </p>

        <label className="field-label">Goal</label>
        <div className="chip-row">
          {(['hypertrophy', 'strength'] as TrainingGoal[]).map((goal) => (
            <button
              key={goal}
              type="button"
              className={`chip ${settings.goal === goal ? 'active' : ''}`}
              onClick={() => applySettings({ goal })}
            >
              {goal === 'hypertrophy' ? 'Muscle' : 'Strength'}
            </button>
          ))}
        </div>

        <label className="field-label">Days per week</label>
        <div className="chip-row">
          {([3, 4, 5] as const).map((days) => (
            <button
              key={days}
              type="button"
              className={`chip ${settings.daysPerWeek === days ? 'active' : ''}`}
              onClick={() => applySettings({ daysPerWeek: days })}
            >
              {days} days
            </button>
          ))}
        </div>

        <button
          type="button"
          className="btn btn-primary"
          style={{ marginTop: '0.75rem' }}
          onClick={handleGenerate}
          disabled={catalogLoading}
        >
          {catalogLoading ? 'Loading library…' : 'Generate new program'}
        </button>
        {status && (
          <p className="generator-status" role="status">
            {status}
          </p>
        )}
        <p className="generator-panel-copy" style={{ marginBottom: 0, marginTop: '0.75rem' }}>
          Active: <strong>{program.name}</strong>
          {program.generatedAt ? ` · updated ${new Date(program.generatedAt).toLocaleDateString()}` : ''}
        </p>
      </div>

      <h2 className="section-heading">
        Exercise library ({catalog.length}) · {dislikedExerciseIds.length} blocked
      </h2>

      <label className="library-search-field">
        <span className="sr-only">Search exercises</span>
        <svg
          className="library-search-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <input
          id="library-search"
          type="search"
          className="library-search"
          placeholder="Search by name, muscle, or equipment"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          autoComplete="off"
          enterKeyHint="search"
        />
      </label>

      <label className="field-label library-filter-label">Muscle group</label>
      <ScrollableChipRow>
        {muscleFilters.map((item) => (
          <button
            key={item}
            type="button"
            className={`chip ${selectedMuscles.has(item) ? 'active' : ''}`}
            onClick={() => toggleMuscle(item)}
            aria-pressed={selectedMuscles.has(item)}
          >
            {item}
          </button>
        ))}
      </ScrollableChipRow>

      <label className="field-label library-filter-label">Machine</label>
      <ScrollableChipRow>
        {equipmentFilters.map((option) => (
          <button
            key={option.id}
            type="button"
            className={`chip ${selectedEquipment.has(option.id) ? 'active' : ''}`}
            onClick={() => toggleEquipment(option.id)}
            aria-pressed={selectedEquipment.has(option.id)}
          >
            {option.label}
          </button>
        ))}
      </ScrollableChipRow>

      <div className="library-list">
        {filtered.map((exercise) => (
          <article
            key={exercise.id}
            className={`card library-item ${isExerciseDisliked(exercise.id) ? 'is-blocked' : ''}`}
          >
            {exercise.imageUrl && (
              <img
                src={exercise.imageUrl}
                alt=""
                className="library-thumb"
                loading="lazy"
                width={120}
                height={90}
              />
            )}
            <strong>{exercise.name}</strong>
            <p className="library-item-meta">
              {exercise.muscleGroup} · {exercise.compound ? 'Compound' : 'Isolation'} ·{' '}
              {equipmentLabel(exercise.libraryEquipment)}
              {exercise.level ? ` · ${exercise.level}` : ''}
            </p>
            <p className="library-item-meta">
              {exercise.defaultSets} sets · {exercise.defaultRepsHypertrophy} (muscle) /{' '}
              {exercise.defaultRepsStrength} (strength)
            </p>
            {exercise.instructions?.[0] && (
              <p className="library-item-instruction">{exercise.instructions[0]}</p>
            )}
            <button
              type="button"
              className={`btn btn-ghost btn-small ${isExerciseDisliked(exercise.id) ? 'is-blocked-btn' : ''}`}
              style={{ marginTop: '0.5rem' }}
              onClick={() => setExerciseDislikedPreference(exercise.id, !isExerciseDisliked(exercise.id))}
            >
              {isExerciseDisliked(exercise.id) ? 'Allow again' : "Don't recommend"}
            </button>
          </article>
        ))}
      </div>
    </section>
  )
}
