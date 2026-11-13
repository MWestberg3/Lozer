import { useLayoutEffect, useRef, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  IconHistory,
  IconHome,
  IconLibrary,
  IconProgress,
  IconSettings,
  IconTrain,
} from './BottomNavIcons'
import type { ReactNode } from 'react'

const links: { to: string; label: string; icon: ReactNode }[] = [
  { to: '/home', label: 'Home', icon: <IconHome /> },
  { to: '/workout', label: 'Train', icon: <IconTrain /> },
  { to: '/library', label: 'Library', icon: <IconLibrary /> },
  { to: '/progress', label: 'Progress', icon: <IconProgress /> },
  { to: '/history', label: 'History', icon: <IconHistory /> },
  { to: '/settings', label: 'Settings', icon: <IconSettings /> },
]

interface SliderRect {
  x: number
  y: number
  width: number
  height: number
}

export function BottomNav() {
  const navRef = useRef<HTMLElement>(null)
  const location = useLocation()
  const [slider, setSlider] = useState<SliderRect | null>(null)

  useLayoutEffect(() => {
    const nav = navRef.current
    if (!nav) return

    const syncSlider = () => {
      const active = nav.querySelector<HTMLElement>('a.active')
      if (!active) return
      const navRect = nav.getBoundingClientRect()
      const linkRect = active.getBoundingClientRect()
      setSlider({
        x: linkRect.left - navRect.left,
        y: linkRect.top - navRect.top,
        width: linkRect.width,
        height: linkRect.height,
      })
    }

    syncSlider()
    window.addEventListener('resize', syncSlider)
    return () => window.removeEventListener('resize', syncSlider)
  }, [location.pathname])

  return (
    <nav ref={navRef} className="bottom-nav" aria-label="Main">
      {slider ? (
        <span
          className="bottom-nav-slider"
          style={{
            width: slider.width,
            height: slider.height,
            transform: `translate3d(${slider.x}px, ${slider.y}px, 0)`,
          }}
          aria-hidden
        />
      ) : null}
      {links.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          className={({ isActive }) => (isActive ? 'active' : undefined)}
          end={link.to === '/home'}
          aria-label={link.label}
          title={link.label}
        >
          {link.icon}
        </NavLink>
      ))}
    </nav>
  )
}
