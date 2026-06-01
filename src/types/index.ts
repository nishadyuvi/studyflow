export type AcademicItemType = 'assignment' | 'exam' | 'task'

export interface AcademicItem {
  id: string
  type: AcademicItemType
  title: string
  dueDate: string
  reminder?: string
  completed: boolean
  createdAt: string
}

export interface DayTask {
  id: string
  title: string
  time?: string
  completed: boolean
  date: string
}

export interface Habit {
  id: string
  name: string
  color: string
}

export type HabitCompletions = Record<string, Record<string, boolean>>
