import { AppProvider } from '../context/AppContext'
import { Layout } from './Layout'

export function AuthenticatedShell() {
  return (
    <AppProvider>
      <Layout />
    </AppProvider>
  )
}
