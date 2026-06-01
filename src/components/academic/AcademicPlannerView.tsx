import { useMemo, useState } from 'react'
import type { AcademicItem, AcademicItemType } from '../../types'
import { useLocalStorage } from '../../hooks/useLocalStorage'
import { daysUntil, formatDueDate, todayKey } from '../../utils/dates'
import { EmptyState } from '../ui/EmptyState'
import { StatCard, StatGrid } from '../ui/StatCard'
import './AcademicPlanner.css'

const STORAGE_KEY = 'studyflow-academic'

const TYPE_LABELS: Record<AcademicItemType, string> = {
  assignment: 'Assignment',
  exam: 'Exam',
  task: 'Task',
}

function createId() {
  return crypto.randomUUID()
}

export function AcademicPlannerView() {
  const [items, setItems] = useLocalStorage<AcademicItem[]>(STORAGE_KEY, [])
  const [title, setTitle] = useState('')
  const [type, setType] = useState<AcademicItemType>('assignment')
  const [dueDate, setDueDate] = useState(todayKey())
  const [reminder, setReminder] = useState('')

  const sorted = useMemo(() => {
    return [...items]
      .filter((i) => !i.completed)
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
  }, [items])

  const completed = useMemo(
    () => items.filter((i) => i.completed),
    [items],
  )

  const stats = useMemo(() => {
    const active = items.filter((i) => !i.completed)
    const overdue = active.filter((i) => daysUntil(i.dueDate) < 0).length
    const dueSoon = active.filter((i) => {
      const d = daysUntil(i.dueDate)
      return d >= 0 && d <= 7
    }).length
    return {
      upcoming: active.length,
      dueSoon,
      completed: completed.length,
      overdue,
    }
  }, [items, completed.length])

  function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = title.trim()
    if (!trimmed) return

    setItems((prev) => [
      ...prev,
      {
        id: createId(),
        type,
        title: trimmed,
        dueDate,
        reminder: reminder.trim() || undefined,
        completed: false,
        createdAt: new Date().toISOString(),
      },
    ])
    setTitle('')
    setReminder('')
  }

  function toggleComplete(id: string) {
    setItems((prev) =>
      prev.map((i) =>
        i.id === id ? { ...i, completed: !i.completed } : i,
      ),
    )
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id))
  }

  return (
    <div className="academic">
      <StatGrid>
        <StatCard
          label="Upcoming"
          value={stats.upcoming}
          hint="Active items"
          tone="accent"
        />
        <StatCard
          label="Due this week"
          value={stats.dueSoon}
          hint="Next 7 days"
          tone="warm"
        />
        <StatCard
          label="Completed"
          value={stats.completed}
          hint="Nice work!"
          tone="success"
        />
        <StatCard
          label="Overdue"
          value={stats.overdue}
          hint={stats.overdue > 0 ? 'Needs attention' : 'All clear'}
          tone={stats.overdue > 0 ? 'urgent' : 'default'}
        />
      </StatGrid>

      <section className="card">
        <h2 className="card__title">
          <span className="card__title-icon" aria-hidden="true">
            ➕
          </span>
          Add item
        </h2>
        <form className="form-row" onSubmit={handleAdd}>
          <div className="form-field form-field--grow">
            <label className="form-label" htmlFor="academic-title">
              Title
            </label>
            <input
              id="academic-title"
              className="form-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Linear Algebra midterm"
              required
            />
          </div>
          <div className="form-field">
            <label className="form-label" htmlFor="academic-type">
              Type
            </label>
            <select
              id="academic-type"
              className="form-select"
              value={type}
              onChange={(e) => setType(e.target.value as AcademicItemType)}
            >
              <option value="assignment">Assignment</option>
              <option value="exam">Exam</option>
              <option value="task">Task</option>
            </select>
          </div>
          <div className="form-field">
            <label className="form-label" htmlFor="academic-due">
              Due date
            </label>
            <input
              id="academic-due"
              type="date"
              className="form-input"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              required
            />
          </div>
          <div className="form-field form-field--grow">
            <label className="form-label" htmlFor="academic-reminder">
              Reminder (optional)
            </label>
            <input
              id="academic-reminder"
              className="form-input"
              value={reminder}
              onChange={(e) => setReminder(e.target.value)}
              placeholder="e.g. Review chapters 4–6"
            />
          </div>
          <button type="submit" className="btn btn--primary">
            Add
          </button>
        </form>
      </section>

      <section className="card">
        <h2 className="card__title">
          <span className="card__title-icon" aria-hidden="true">
            📅
          </span>
          Upcoming
        </h2>
        {sorted.length === 0 ? (
          <EmptyState
            icon="🎓"
            title="Your slate is clear"
            description="Add an assignment, exam, or task above to stay ahead of deadlines."
          />
        ) : (
          <ul className="academic-list">
            {sorted.map((item) => (
              <AcademicRow
                key={item.id}
                item={item}
                onToggle={() => toggleComplete(item.id)}
                onDelete={() => removeItem(item.id)}
              />
            ))}
          </ul>
        )}
      </section>

      {completed.length > 0 && (
        <section className="card">
          <h2 className="card__title">
            <span className="card__title-icon" aria-hidden="true">
              ✅
            </span>
            Completed
          </h2>
          <ul className="academic-list academic-list--done">
            {completed.map((item) => (
              <AcademicRow
                key={item.id}
                item={item}
                onToggle={() => toggleComplete(item.id)}
                onDelete={() => removeItem(item.id)}
              />
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

function AcademicRow({
  item,
  onToggle,
  onDelete,
}: {
  item: AcademicItem
  onToggle: () => void
  onDelete: () => void
}) {
  const days = daysUntil(item.dueDate)
  let urgency: 'urgent' | 'soon' | null = null
  if (!item.completed && days < 0) urgency = 'urgent'
  else if (!item.completed && days <= 3) urgency = days === 0 ? 'urgent' : 'soon'

  return (
    <li className={`academic-item${item.completed ? ' academic-item--done' : ''}`}>
      <label className="academic-item__check">
        <input
          type="checkbox"
          checked={item.completed}
          onChange={onToggle}
          aria-label={`Mark ${item.title} complete`}
        />
      </label>
      <div className="academic-item__body">
        <div className="academic-item__top">
          <span className={`badge badge--${item.type}`}>
            {TYPE_LABELS[item.type]}
          </span>
          {urgency && !item.completed && (
            <span className={`badge badge--${urgency}`}>
              {days < 0 ? 'Overdue' : days === 0 ? 'Due today' : `${days}d left`}
            </span>
          )}
        </div>
        <span className="academic-item__title">{item.title}</span>
        <span className="academic-item__meta">
          Due {formatDueDate(item.dueDate)}
        </span>
        {item.reminder && (
          <span className="academic-item__reminder">🔔 {item.reminder}</span>
        )}
      </div>
      <button
        type="button"
        className="btn btn--danger"
        onClick={onDelete}
        aria-label={`Delete ${item.title}`}
      >
        Remove
      </button>
    </li>
  )
}
