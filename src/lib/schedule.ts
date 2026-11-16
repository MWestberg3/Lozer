import type { Program, WorkoutDayTemplate, WorkoutSession } from '../types/workout'

export interface DaySlot {
  day: WorkoutDayTemplate
  date: Date
  label: 'today' | 'upcoming'
  completedToday: boolean
}

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
}

export function isSameCalendarDay(a: Date, b: Date): boolean {
  return startOfDay(a) === startOfDay(b)
}

export function formatCalendarDay(date: Date, base = new Date()): string {
  if (isSameCalendarDay(date, base)) return 'Today'
  const tomorrow = new Date(base)
  tomorrow.setDate(tomorrow.getDate() + 1)
  if (isSameCalendarDay(date, tomorrow)) return 'Tomorrow'
  return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
}

export function formatTodayHeading(date = new Date()): string {
  return date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })
}

export function getNextRotationIndex(program: Program, sessions: WorkoutSession[]): number {
  const latest = sessions[0]
  if (!latest) return 0
  const index = program.days.findIndex((d) => d.id === latest.dayId)
  if (index === -1) return 0
  return (index + 1) % program.days.length
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

export function buildDaySchedule(
  program: Program,
  sessions: WorkoutSession[],
  slotCount = 8,
  today = new Date(),
): DaySlot[] {
  if (program.days.length === 0) return []
  const rotationStart = getNextRotationIndex(program, sessions)
  const latest = sessions[0]
  const slots: DaySlot[] = []

  for (let i = 0; i < slotCount; i++) {
    const day = program.days[(rotationStart + i) % program.days.length]
    const date = addDays(today, i)
    const completedToday =
      i === 0 &&
      !!latest?.completedAt &&
      isSameCalendarDay(new Date(latest.completedAt), today) &&
      latest.dayId === day.id

    slots.push({
      day,
      date,
      label: i === 0 ? 'today' : 'upcoming',
      completedToday,
    })
  }

  return slots
}
