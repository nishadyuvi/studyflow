import { HabitTrackerView } from '../components/habit/HabitTrackerView'
import { PageHero } from '../components/ui/PageHero'

export function HabitTracker() {
  return (
    <div className="page">
      <PageHero
        variant="habit"
        title="Habit Tracker"
        subtitle="Define habits, check off daily progress, and view streaks and charts. Click an activity name for a detailed report."
      />
      <HabitTrackerView />
    </div>
  )
}
