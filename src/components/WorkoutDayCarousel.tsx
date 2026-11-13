import { Link } from 'react-router-dom'
import type { DaySlot } from '../lib/schedule'
import { formatCalendarDay } from '../lib/schedule'

interface WorkoutDayCarouselProps {
  slots: DaySlot[]
}

export function WorkoutDayCarousel({ slots }: WorkoutDayCarouselProps) {
  const [, ...upcoming] = slots

  return (
    <section className="day-carousel-section">
      <h2 className="section-heading">Coming up</h2>
      <div className="day-carousel" role="list">
        {upcoming.map((slot) => (
          <Link
            key={`${slot.day.id}-${slot.date.toISOString()}`}
            to={`/workout/preview?day=${encodeURIComponent(slot.day.id)}`}
            className="day-carousel-card card"
            role="listitem"
          >
            <span className="day-carousel-date">{formatCalendarDay(slot.date)}</span>
            <strong className="day-carousel-name">{slot.day.name}</strong>
            <span className="day-carousel-focus">{slot.day.focus}</span>
            <span className="day-carousel-meta">{slot.day.exercises.length} exercises</span>
          </Link>
        ))}
      </div>
    </section>
  )
}
