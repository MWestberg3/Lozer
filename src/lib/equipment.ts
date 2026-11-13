/** Raw `equipment` values from [yuhonas/free-exercise-db](https://github.com/yuhonas/free-exercise-db). */
export type LibraryEquipmentId =
  | 'barbell'
  | 'dumbbell'
  | 'cable'
  | 'machine'
  | 'body only'
  | 'kettlebells'
  | 'bands'
  | 'e-z curl bar'
  | 'medicine ball'
  | 'exercise ball'
  | 'other'

export interface LibraryEquipmentOption {
  id: LibraryEquipmentId
  label: string
  description?: string
}

/** Every strength-relevant equipment type in the synced library (excludes foam roll). */
export const LIBRARY_EQUIPMENT_OPTIONS: LibraryEquipmentOption[] = [
  { id: 'barbell', label: 'Barbell' },
  { id: 'e-z curl bar', label: 'EZ curl bar' },
  { id: 'dumbbell', label: 'Dumbbells' },
  { id: 'cable', label: 'Cables' },
  { id: 'machine', label: 'Machines' },
  { id: 'kettlebells', label: 'Kettlebells' },
  { id: 'body only', label: 'Bodyweight' },
  { id: 'bands', label: 'Resistance bands' },
  { id: 'medicine ball', label: 'Medicine ball' },
  { id: 'exercise ball', label: 'Exercise ball' },
  { id: 'other', label: 'Other / misc' },
]

export const DEFAULT_ENABLED_LIBRARY_EQUIPMENT: LibraryEquipmentId[] = LIBRARY_EQUIPMENT_OPTIONS.map((o) => o.id)

export const EQUIPMENT_PRESETS: Record<string, { label: string; ids: LibraryEquipmentId[] }> = {
  full_gym: {
    label: 'Full gym',
    ids: [...DEFAULT_ENABLED_LIBRARY_EQUIPMENT],
  },
  dumbbells_home: {
    label: 'Dumbbells + bench',
    ids: ['dumbbell', 'body only', 'kettlebells', 'bands', 'medicine ball', 'exercise ball', 'e-z curl bar'],
  },
  minimal: {
    label: 'Minimal / bodyweight',
    ids: ['body only', 'bands', 'medicine ball', 'exercise ball'],
  },
}

export function equipmentLabel(id: string): string {
  return LIBRARY_EQUIPMENT_OPTIONS.find((o) => o.id === id)?.label ?? id
}

export function enabledEquipmentFromLegacyPreset(
  preset: 'full_gym' | 'dumbbells' | 'minimal',
): LibraryEquipmentId[] {
  if (preset === 'full_gym') return [...DEFAULT_ENABLED_LIBRARY_EQUIPMENT]
  if (preset === 'dumbbells') return [...EQUIPMENT_PRESETS.dumbbells_home.ids]
  return [...EQUIPMENT_PRESETS.minimal.ids]
}
