export type ThemeColorId = 'orange' | 'pink' | 'red' | 'amber' | 'green' | 'teal' | 'blue' | 'purple'

export interface ThemeColorOption {
  id: ThemeColorId
  label: string
  accent: string
  dim: string
  deep: string
}

export const DEFAULT_THEME_COLOR_ID: ThemeColorId = 'orange'

export const THEME_COLOR_OPTIONS: ThemeColorOption[] = [
  { id: 'orange', label: 'Orange', accent: '#ff6b35', dim: '#c94f24', deep: '#7a3518' },
  { id: 'pink', label: 'Pink', accent: '#ff4d8d', dim: '#db2777', deep: '#9d174d' },
  { id: 'red', label: 'Red', accent: '#ef4444', dim: '#dc2626', deep: '#991b1b' },
  { id: 'amber', label: 'Amber', accent: '#f59e0b', dim: '#d97706', deep: '#92400e' },
  { id: 'green', label: 'Green', accent: '#22c55e', dim: '#16a34a', deep: '#166534' },
  { id: 'teal', label: 'Teal', accent: '#14b8a6', dim: '#0d9488', deep: '#115e59' },
  { id: 'blue', label: 'Blue', accent: '#3b82f6', dim: '#2563eb', deep: '#1e3a8a' },
  { id: 'purple', label: 'Purple', accent: '#a855f7', dim: '#7c3aed', deep: '#5b21b6' },
]

const THEME_BY_ID = Object.fromEntries(THEME_COLOR_OPTIONS.map((t) => [t.id, t])) as Record<
  ThemeColorId,
  ThemeColorOption
>

export function isThemeColorId(value: string): value is ThemeColorId {
  return value in THEME_BY_ID
}

export function applyTheme(colorId: ThemeColorId): void {
  const theme = THEME_BY_ID[colorId] ?? THEME_BY_ID[DEFAULT_THEME_COLOR_ID]
  const root = document.documentElement
  root.style.setProperty('--accent', theme.accent)
  root.style.setProperty('--accent-dim', theme.dim)
  root.style.setProperty('--accent-deep', theme.deep)
}

export function clearAppliedTheme(): void {
  const root = document.documentElement
  root.style.removeProperty('--accent')
  root.style.removeProperty('--accent-dim')
  root.style.removeProperty('--accent-deep')
}
