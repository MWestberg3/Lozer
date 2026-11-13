import { useEffect } from 'react'
import { useApp } from '../context/AppContext'
import { applyTheme, clearAppliedTheme, DEFAULT_THEME_COLOR_ID, isThemeColorId } from '../lib/theme'

export function ThemeSync() {
  const { state } = useApp()

  useEffect(() => {
    const id = isThemeColorId(state.primaryColorId) ? state.primaryColorId : DEFAULT_THEME_COLOR_ID
    applyTheme(id)
    return () => clearAppliedTheme()
  }, [state.primaryColorId])

  return null
}
