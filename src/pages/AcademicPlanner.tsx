import { AcademicPlannerView } from '../components/academic/AcademicPlannerView'
import { PageHero } from '../components/ui/PageHero'

export function AcademicPlanner() {
  return (
    <div className="page">
      <PageHero
        variant="academic"
        title="Academic Planner"
        subtitle="Track upcoming assignments, exams, and tasks with due dates and reminders."
      />
      <AcademicPlannerView />
    </div>
  )
}
