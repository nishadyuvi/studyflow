export function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

const SUBTITLES = [
  'Every small step moves you closer to your goals.',
  'Consistency beats intensity — show up today.',
  'Your future self will thank you for this session.',
  'Progress, not perfection. Keep building.',
  'Focus on what you can control right now.',
  'One focused hour can change your week.',
  'You are capable of more than you think.',
]

export function getDailySubtitle(): string {
  const key = new Date().toISOString().slice(0, 10)
  let hash = 0
  for (let i = 0; i < key.length; i++) {
    hash = (hash + key.charCodeAt(i) * (i + 1)) % SUBTITLES.length
  }
  return SUBTITLES[hash]
}
