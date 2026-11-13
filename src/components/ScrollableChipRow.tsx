import { useCallback, useEffect, useRef, type ReactNode } from 'react'

const HIDE_DELAY_MS = 700

export function ScrollableChipRow({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const revealScrollbar = useCallback(() => {
    const el = ref.current
    if (!el) return
    el.classList.add('is-scrolling')
    if (hideTimer.current) clearTimeout(hideTimer.current)
    hideTimer.current = setTimeout(() => {
      el.classList.remove('is-scrolling')
      hideTimer.current = null
    }, HIDE_DELAY_MS)
  }, [])

  useEffect(() => {
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current)
    }
  }, [])

  return (
    <div
      ref={ref}
      className="chip-row chip-row-scroll"
      onScroll={revealScrollbar}
      onPointerDown={revealScrollbar}
      onTouchStart={revealScrollbar}
    >
      {children}
    </div>
  )
}
