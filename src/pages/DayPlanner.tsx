import { DaySchedule } from '../components/day/DaySchedule'
import { FocusMode } from '../components/day/FocusMode'
import { PageHero } from '../components/ui/PageHero'

export function DayPlanner() {
  return (
    <div className="page">
      <PageHero
        variant="day"
        title="Day Planner"
        subtitle="Plan your day and use Focus Mode for timed study sessions with breaks."
      />

      <section className="card">
        <h2 className="card__title">
          <span className="card__title-icon" aria-hidden="true">
            📋
          </span>
          Today&apos;s schedule
        </h2>
        <DaySchedule />
      </section>

      <section className="card card--focus">
        <h2 className="card__title">
          <span className="card__title-icon" aria-hidden="true">
            🎯
          </span>
          Focus Mode
        </h2>
        <FocusMode />
      </section>
    </div>
  )
}
