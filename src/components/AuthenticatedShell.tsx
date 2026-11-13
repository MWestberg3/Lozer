import { AppProvider } from '../context/AppContext'
import { Layout } from './Layout'
import { ThemeSync } from './ThemeSync'

export function AuthenticatedShell() {
  return (
    <AppProvider>
      <ThemeSync />
      <Layout />
    </AppProvider>
  )
}
