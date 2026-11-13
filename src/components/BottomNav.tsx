import { NavLink } from 'react-router-dom'

const links = [
  { to: '/home', label: 'Home' },
  { to: '/workout', label: 'Train' },
  { to: '/progress', label: 'Progress' },
  { to: '/history', label: 'History' },
]

export function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="Main">
      {links.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          className={({ isActive }) => (isActive ? 'active' : undefined)}
          end={link.to === '/home'}
        >
          {link.label}
        </NavLink>
      ))}
    </nav>
  )
}
