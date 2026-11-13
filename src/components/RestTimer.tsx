import { useEffect, useState } from 'react'

export function RestTimer({ seconds, running, onDone }: { seconds: number; running: boolean; onDone: () => void }) {
  const [left, setLeft] = useState(seconds)

  useEffect(() => {
    setLeft(seconds)
  }, [seconds])

  useEffect(() => {
    if (!running || left <= 0) return
    const timer = window.setTimeout(() => setLeft((v) => v - 1), 1000)
    return () => window.clearTimeout(timer)
  }, [running, left])

  useEffect(() => {
    if (running && left === 0) onDone()
  }, [running, left, onDone])

  if (!running) return null

  return (
    <div className="card" style={{ marginTop: '0.75rem', textAlign: 'center' }}>
      <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Rest</div>
      <div style={{ fontSize: '2rem', fontWeight: 700 }}>{left}s</div>
    </div>
  )
}
