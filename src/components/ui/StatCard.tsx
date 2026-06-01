import './StatCard.css'

export function StatCard({
  label,
  value,
  hint,
  tone = 'default',
}: {
  label: string
  value: string | number
  hint?: string
  tone?: 'default' | 'accent' | 'warm' | 'success' | 'urgent'
}) {
  return (
    <div className={`stat-card stat-card--${tone}`}>
      <span className="stat-card__value">{value}</span>
      <span className="stat-card__label">{label}</span>
      {hint && <span className="stat-card__hint">{hint}</span>}
    </div>
  )
}

export function StatGrid({ children }: { children: React.ReactNode }) {
  return <div className="stat-grid">{children}</div>
}
