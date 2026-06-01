import { quoteOfDay } from '../../utils/quoteOfDay'
import { getDailySubtitle, getGreeting } from '../../utils/greeting'
import './PageHero.css'

type PageHeroVariant = 'academic' | 'day' | 'habit'

const ICONS: Record<PageHeroVariant, string> = {
  academic: '📚',
  day: '⚡',
  habit: '🔥',
}

export function PageHero({
  title,
  subtitle,
  variant,
}: {
  title: string
  subtitle: string
  variant: PageHeroVariant
}) {
  const quote = quoteOfDay()

  return (
    <header className={`page-hero page-hero--${variant}`}>
      <div className="page-hero__glow" aria-hidden="true" />
      <div className="page-hero__top">
        <span className="page-hero__icon" aria-hidden="true">
          {ICONS[variant]}
        </span>
        <div className="page-hero__intro">
          <p className="page-hero__greeting">
            {getGreeting()} — <span>{getDailySubtitle()}</span>
          </p>
          <h1 className="page-hero__title">{title}</h1>
          <p className="page-hero__subtitle">{subtitle}</p>
        </div>
      </div>
      <blockquote className="page-hero__quote">
        <span className="page-hero__quote-mark" aria-hidden="true">
          “
        </span>
        <p>{quote.text}</p>
        <cite>— {quote.author}</cite>
      </blockquote>
    </header>
  )
}
