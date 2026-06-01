export function todayKey(): string {
  return formatDateKey(new Date())
}

export function formatDateKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function formatDisplayDate(key: string): string {
  return parseDateKey(key).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

export function formatDueDate(key: string): string {
  return parseDateKey(key).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

export function getMonthDays(year: number, month: number): string[] {
  const count = daysInMonth(year, month)
  return Array.from({ length: count }, (_, i) => {
    const d = String(i + 1).padStart(2, '0')
    const m = String(month + 1).padStart(2, '0')
    return `${year}-${m}-${d}`
  })
}

export function daysUntil(dueDateKey: string): number {
  const due = parseDateKey(dueDateKey)
  const today = parseDateKey(todayKey())
  due.setHours(0, 0, 0, 0)
  today.setHours(0, 0, 0, 0)
  return Math.round((due.getTime() - today.getTime()) / 86400000)
}

export function monthLabel(year: number, month: number): string {
  return new Date(year, month, 1).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  })
}

export function dayOfWeekShort(key: string): string {
  return parseDateKey(key).toLocaleDateString(undefined, { weekday: 'narrow' })
}

export function isWeekend(key: string): boolean {
  const day = parseDateKey(key).getDay()
  return day === 0 || day === 6
}
