import './EmptyState.css'

export function EmptyState({
  icon,
  title,
  description,
}: {
  icon: string
  title: string
  description: string
}) {
  return (
    <div className="empty-state-rich">
      <span className="empty-state-rich__icon" aria-hidden="true">
        {icon}
      </span>
      <p className="empty-state-rich__title">{title}</p>
      <p className="empty-state-rich__desc">{description}</p>
    </div>
  )
}
