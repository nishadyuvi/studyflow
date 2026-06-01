import './FocusAmbientToggle.css'

export function FocusAmbientToggle({
  enabled,
  onToggle,
  disabled,
  compact,
}: {
  enabled: boolean
  onToggle: () => void
  disabled?: boolean
  compact?: boolean
}) {
  return (
    <button
      type="button"
      className={`focus-ambient${enabled ? ' focus-ambient--on' : ''}${compact ? ' focus-ambient--compact' : ''}`}
      onClick={onToggle}
      disabled={disabled}
      aria-pressed={enabled}
      aria-label={
        enabled
          ? 'Turn off lofi jazz and rain sounds'
          : 'Turn on lofi jazz and rain sounds'
      }
      title="Jazz lofi + rain ambience"
    >
      <span className="focus-ambient__icon" aria-hidden="true">
        {enabled ? '🎧' : '🌧️'}
      </span>
      <span className="focus-ambient__label">
        {enabled ? 'Sound on' : 'Lofi + rain'}
      </span>
    </button>
  )
}
