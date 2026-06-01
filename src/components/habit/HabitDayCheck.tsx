import './HabitDayCheck.css'

export function HabitDayCheck({
  checked,
  onToggle,
  color,
  isToday,
  label,
}: {
  checked: boolean
  onToggle: () => void
  color: string
  isToday?: boolean
  label: string
}) {
  return (
    <label
      className={`habit-check${checked ? ' habit-check--done' : ''}${isToday ? ' habit-check--today' : ''}`}
      style={{ '--habit-color': color } as React.CSSProperties}
    >
      <input
        type="checkbox"
        className="habit-check__input"
        checked={checked}
        onChange={onToggle}
        aria-label={label}
      />
      <span className="habit-check__box" aria-hidden="true">
        {checked && (
          <svg
            className="habit-check__icon"
            viewBox="0 0 12 12"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M2 6.5L4.5 9L10 3"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </span>
    </label>
  )
}
