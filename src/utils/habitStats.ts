import type { Habit, HabitCompletions } from '../types'
import { getMonthDays, parseDateKey, todayKey } from './dates'

export function isHabitDone(
  completions: HabitCompletions,
  habitId: string,
  dateKey: string,
): boolean {
  return completions[habitId]?.[dateKey] === true
}

export function toggleHabitDay(
  completions: HabitCompletions,
  habitId: string,
  dateKey: string,
): HabitCompletions {
  const current = completions[habitId]?.[dateKey] === true
  return {
    ...completions,
    [habitId]: {
      ...completions[habitId],
      [dateKey]: !current,
    },
  }
}

export function totalCompleted(
  completions: HabitCompletions,
  habitId: string,
): number {
  const days = completions[habitId]
  if (!days) return 0
  return Object.values(days).filter(Boolean).length
}

export function currentStreak(
  completions: HabitCompletions,
  habitId: string,
): number {
  const days = completions[habitId]
  if (!days) return 0

  let streak = 0
  const cursor = parseDateKey(todayKey())

  while (true) {
    const key = formatFromDate(cursor)
    if (!days[key]) break
    streak++
    cursor.setDate(cursor.getDate() - 1)
  }

  return streak
}

function formatFromDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function monthlySeries(
  completions: HabitCompletions,
  habitId: string,
  year: number,
  month: number,
): number[] {
  const keys = getMonthDays(year, month)
  let cumulative = 0
  return keys.map((key) => {
    if (completions[habitId]?.[key]) cumulative++
    return cumulative
  })
}

export function allActivityDays(
  completions: HabitCompletions,
): string[] {
  const daySet = new Set<string>()
  for (const habitDays of Object.values(completions)) {
    for (const date of Object.keys(habitDays)) {
      daySet.add(date)
    }
  }
  return Array.from(daySet).sort()
}

function offsetDate(dateStr: string, n: number): string {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

export function overallStreaks(completions: HabitCompletions): {
  current: number
  best: number
} {
  const days = allActivityDays(completions)

  if (days.length === 0) return { current: 0, best: 0 }

  // best streak (scan whole array)
  let best = 1
  let run = 1
  for (let i = 1; i < days.length; i++) {
    if (days[i] === offsetDate(days[i - 1], 1)) {
      run++
      if (run > best) best = run
    } else {
      run = 1
    }
  }

  // current streak (walk backwards from most recent day)
  const today = new Date().toISOString().slice(0, 10)
  const yesterday = offsetDate(today, -1)
  const lastDay = days[days.length - 1]

  let current = 0
  if (lastDay === today || lastDay === yesterday) {
    current = 1
    let cursor = lastDay
    for (let i = days.indexOf(lastDay) - 1; i >= 0; i--) {
      if (days[i] === offsetDate(cursor, -1)) {
        current++
        cursor = days[i]
      } else break
    }
  }

  return { current, best }
}

export const HABIT_COLORS: string[] = [
  '#4f6ef7',
  '#10b981',
  '#f59e0b',
  '#ec4899',
  '#8b5cf6',
  '#06b6d4',
  '#ef4444',
  '#84cc16',
  '#f97316',
  '#6366f1',
]

export function nextHabitColor(habits: Habit[]): string {
  const used = new Set(habits.map((h) => h.color))
  return HABIT_COLORS.find((c) => !used.has(c)) ?? HABIT_COLORS[habits.length % HABIT_COLORS.length]
}

/**
 * Computes a single momentum score (0–100) for each day of the month.
 *
 * Active day:  momentum = (habitsCompleted / totalHabits) * 100
 * Idle day:    momentum = previousMomentum * DECAY (0.5 per day)
 *              → after 1 missed day ~50%, 2 days ~25%, 3 days ~12%
 */
export function momentumSeries(
  completions: HabitCompletions,
  habitIds: string[],
  year: number,
  month: number,
): number[] {
  const DECAY = 0.5
  const total = habitIds.length
  if (total === 0) return []

  const keys = getMonthDays(year, month)
  let momentum = 0

  return keys.map((key) => {
    const done = habitIds.filter(
      (id) => completions[id]?.[key] === true,
    ).length

    if (done > 0) {
      momentum = (done / total) * 100
    } else {
      momentum = momentum * DECAY
    }

    return Math.round(momentum)
  })
}