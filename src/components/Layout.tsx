import { Outlet, useNavigate } from 'react-router-dom'
import { BottomNav } from './BottomNav'
import { UserSwitcher } from './UserSwitcher'
import { useAuth } from '../context/AuthContext'

export function Layout() {
  const navigate = useNavigate()
  const { signOutUser } = useAuth()

  const switchAccount = async () => {
    await signOutUser()
    navigate('/')
  }

  return (
    <div className="app-shell">
      <header style={{ paddingTop: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
          <UserSwitcher />
          <button type="button" className="btn btn-ghost btn-small" onClick={switchAccount}>
            Sign out
          </button>
        </div>
      </header>
      <main style={{ flex: 1 }}>
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}
