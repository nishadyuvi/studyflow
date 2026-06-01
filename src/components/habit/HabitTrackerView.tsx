import { useMemo, useState, useEffect, useCallback } from 'react'
import type { Habit, HabitCompletions } from '../../types'
import { supabase } from '../../lib/supabase'

import {
  dayOfWeekShort,
  formatDisplayDate,
  getMonthDays,
  isWeekend,
  monthLabel,
  todayKey,
} from '../../utils/dates'

import { HabitDayCheck } from './HabitDayCheck'

import {
  currentStreak,
  isHabitDone,
  momentumSeries,
  monthlySeries,
  nextHabitColor,
  overallStreaks,
  toggleHabitDay,
  totalCompleted,
} from '../../utils/habitStats'

import { LineChart } from '../ui/LineChart'
import { EmptyState } from '../ui/EmptyState'
import { StatCard, StatGrid } from '../ui/StatCard'

import './HabitTracker.css'

const MAX_HABITS = 10

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

interface HabitRow {
  id: string
  user_id: string
  name: string
  color: string
  created_at: string
}

interface HabitEntryRow {
  id: string
  user_id: string
  habit_id: string
  completed: boolean
  date: string
}

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

function buildCompletions(
  entries: HabitEntryRow[],
): HabitCompletions {

  const result: HabitCompletions = {}

  for (const entry of entries) {

    if (!result[entry.habit_id]) {
      result[entry.habit_id] = {}
    }

    result[entry.habit_id][entry.date] = true
  }

  return result
}

// ─────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────

export function HabitTrackerView() {

  const [habits, setHabits] =
    useState<Habit[]>([])

  const [completions, setCompletions] =
    useState<HabitCompletions>({})

  const [name, setName] =
    useState('')

  const [selectedId, setSelectedId] =
    useState<string | null>(null)

  const [loading, setLoading] =
    useState<boolean>(true)

  const [error, setError] =
    useState<string>('')

  const now = new Date()

  const [viewYear, setViewYear] =
    useState(now.getFullYear())

  const [viewMonth, setViewMonth] =
    useState(now.getMonth())

  // ─────────────────────────────────────────────
  // FETCH ALL DATA
  // ─────────────────────────────────────────────

  const fetchAll = useCallback(async () => {

    setLoading(true)
    setError('')

    const {
      data: habitData,
      error: habitError,
    } = await supabase
      .from('habits')
      .select('*')
      .order('created_at', {
        ascending: true,
      })

    if (habitError) {
      setError('Could not load habits.')
      setLoading(false)
      return
    }

    const {
      data: entryData,
      error: entryError,
    } = await supabase
      .from('habit_entries')
      .select('*')

    if (entryError) {
      setError('Could not load habit entries.')
      setLoading(false)
      return
    }

    setHabits(
      (habitData as HabitRow[]).map((r) => ({
        id: r.id,
        name: r.name,
        color: r.color,
      })),
    )

    setCompletions(
      buildCompletions(
        entryData as HabitEntryRow[],
      ),
    )

    setLoading(false)

  }, [])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  // ─────────────────────────────────────────────
  // DERIVED DATA
  // ─────────────────────────────────────────────

  const monthDays = useMemo(
    () => getMonthDays(viewYear, viewMonth),
    [viewYear, viewMonth],
  )

  const dayLabels = useMemo(
    () => monthDays.map((d) => d.slice(-2)),
    [monthDays],
  )

  const selected = habits.find(
    (h) => h.id === selectedId,
  )

  // ── CHANGED: overallStreaks replaces per-habit bestStreak loop ──
  const habitStats = useMemo(() => {

    if (habits.length === 0) {
      return {
        currentStreak: 0,
        bestStreak: 0,
        totalChecks: 0,
        todayDone: 0,
      }
    }

    const today = todayKey()
    const { current, best } = overallStreaks(completions)

    let totalChecks = 0
    let todayDone = 0

    for (const h of habits) {
      totalChecks += totalCompleted(completions, h.id)
      if (isHabitDone(completions, h.id, today)) todayDone += 1
    }

    return {
      currentStreak: current,
      bestStreak: best,
      totalChecks,
      todayDone,
    }

  }, [habits, completions])

  // ── CHANGED: single momentum line instead of one series per habit ──
  const momentumChartSeries = useMemo(
    () => [
      {
        id: 'momentum',
        label: 'Overall momentum',
        color: '#4f6ef7',
        values: momentumSeries(
          completions,
          habits.map((h) => h.id),
          viewYear,
          viewMonth,
        ),
      },
    ],
    [habits, completions, viewYear, viewMonth],
  )

  // ─────────────────────────────────────────────
  // ADD HABIT
  // ─────────────────────────────────────────────

  async function handleAdd(
    e: React.FormEvent,
  ) {

    e.preventDefault()

    const trimmed = name.trim()

    if (
      !trimmed ||
      habits.length >= MAX_HABITS
    ) return

    const color = nextHabitColor(habits)

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      setError('Not logged in.')
      return
    }

    const {
      data,
      error: insertError,
    } = await supabase
      .from('habits')
      .insert({
        name: trimmed,
        color,
        user_id: session.user.id,
      })
      .select()
      .single()

    if (insertError || !data) {
      setError('Could not add activity.')
      return
    }

    const row = data as HabitRow

    setHabits((prev) => [
      ...prev,
      {
        id: row.id,
        name: row.name,
        color: row.color,
      },
    ])

    setName('')
  }

  // ─────────────────────────────────────────────
  // REMOVE HABIT
  // ─────────────────────────────────────────────

  async function removeHabit(id: string) {

    setHabits((prev) =>
      prev.filter((h) => h.id !== id),
    )

    setCompletions((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })

    if (selectedId === id) {
      setSelectedId(null)
    }

    const {
      error: deleteError,
    } = await supabase
      .from('habits')
      .delete()
      .eq('id', id)

    if (deleteError) {
      setError('Could not remove activity.')
      fetchAll()
    }
  }

  // ─────────────────────────────────────────────
  // TOGGLE DAY
  // ─────────────────────────────────────────────

  async function toggleDay(
    habitId: string,
    dateKey: string,
  ) {

    const alreadyDone = isHabitDone(
      completions,
      habitId,
      dateKey,
    )

    setCompletions((prev) =>
      toggleHabitDay(
        prev,
        habitId,
        dateKey,
      ),
    )

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      setError('Not logged in.')
      return
    }

    if (alreadyDone) {

      const {
        error: deleteError,
      } = await supabase
        .from('habit_entries')
        .delete()
        .eq('habit_id', habitId)
        .eq('date', dateKey)

      if (deleteError) {
        setError('Could not update habit.')
        setCompletions((prev) =>
          toggleHabitDay(prev, habitId, dateKey),
        )
      }

    } else {

      const {
        error: insertError,
      } = await supabase
        .from('habit_entries')
        .insert({
          user_id: session.user.id,
          habit_id: habitId,
          completed: true,
          date: dateKey,
        })

      if (insertError) {
        setError('Could not update habit.')
        setCompletions((prev) =>
          toggleHabitDay(prev, habitId, dateKey),
        )
      }
    }
  }

  // ─────────────────────────────────────────────
  // MONTH NAVIGATION
  // ─────────────────────────────────────────────

  function prevMonth() {
    if (viewMonth === 0) {
      setViewMonth(11)
      setViewYear((y) => y - 1)
    } else {
      setViewMonth((m) => m - 1)
    }
  }

  function nextMonth() {
    if (viewMonth === 11) {
      setViewMonth(0)
      setViewYear((y) => y + 1)
    } else {
      setViewMonth((m) => m + 1)
    }
  }

  // ─────────────────────────────────────────────
  // LOADING
  // ─────────────────────────────────────────────

  if (loading) {
    return (
      <p
        style={{
          textAlign: 'center',
          color: '#475569',
          fontSize: '14px',
          padding: '48px 0',
        }}
      >
        Loading habits…
      </p>
    )
  }

  // ─────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────

  return (
    <div className="habit-tracker">

      {error && (
        <p
          style={{
            fontSize: '13px',
            color: '#f87171',
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: '10px',
            padding: '10px 14px',
            marginBottom: '12px',
          }}
        >
          {error}
        </p>
      )}

      {/* ── CHANGED: 4 stat cards, current + best streak both shown ── */}
      {habits.length > 0 && (
        <StatGrid>

          <StatCard
            label="Current streak"
            value={habitStats.currentStreak}
            hint="Days in a row"
            tone="warm"
          />

          <StatCard
            label="Best streak"
            value={habitStats.bestStreak}
            hint="Your longest run"
            tone="accent"
          />

          <StatCard
            label="Done today"
            value={`${habitStats.todayDone}/${habits.length}`}
            hint="Keep the chain alive"
            tone="success"
          />

          <StatCard
            label="All-time checks"
            value={habitStats.totalChecks}
            hint="Every day counts"
            tone="accent"
          />

        </StatGrid>
      )}

      <section className="card">

        <h2 className="card__title">

          <span
            className="card__title-icon"
            aria-hidden="true"
          >
            ✨
          </span>

          Activities ({habits.length}/{MAX_HABITS})

        </h2>

        <form
          className="form-row"
          onSubmit={handleAdd}
        >

          <div className="form-field form-field--grow">

            <label
              className="form-label"
              htmlFor="habit-name"
            >
              Activity name
            </label>

            <input
              id="habit-name"
              className="form-input"
              value={name}
              onChange={(e) =>
                setName(e.target.value)
              }
              placeholder="e.g. DSA practice, meditation"
              disabled={habits.length >= MAX_HABITS}
              required
            />

          </div>

          <button
            type="submit"
            className="btn btn--primary"
            disabled={habits.length >= MAX_HABITS}
          >
            Add activity
          </button>

        </form>

        {habits.length >= MAX_HABITS && (
          <p className="habit-limit">
            Maximum of {MAX_HABITS} activities reached.
          </p>
        )}

      </section>

      {habits.length > 0 && (
        <>

          <section className="card">

            <div className="habit-month-nav">

              <button
                type="button"
                className="btn btn--ghost"
                onClick={prevMonth}
              >
                ←
              </button>

              <h2 className="card__title habit-month-nav__label">
                {monthLabel(viewYear, viewMonth)}
              </h2>

              <button
                type="button"
                className="btn btn--ghost"
                onClick={nextMonth}
              >
                →
              </button>

            </div>

            <p className="habit-grid-legend">
              Tap a square to mark that day complete for an activity.
            </p>

            <div className="habit-grid-wrap">

              <table className="habit-grid">

                <thead>

                  <tr>

                    <th className="habit-grid__corner">
                      Activity
                    </th>

                    {monthDays.map((day) => {

                      const isToday = day === todayKey()
                      const weekend = isWeekend(day)

                      return (
                        <th
                          key={day}
                          className={`habit-grid__day${isToday ? ' habit-grid__day--today' : ''}${weekend ? ' habit-grid__day--weekend' : ''}`}
                        >
                          <span className="habit-grid__dow">
                            {dayOfWeekShort(day)}
                          </span>
                          <span className="habit-grid__dom">
                            {day.slice(-2)}
                          </span>
                        </th>
                      )
                    })}

                  </tr>

                </thead>

                <tbody>

                  {habits.map((habit) => (

                    <tr
                      key={habit.id}
                      className={`habit-grid__row${selectedId === habit.id ? ' habit-grid__row--selected' : ''}`}
                    >

                      <th
                        scope="row"
                        className="habit-grid__name"
                      >

                        <button
                          type="button"
                          className="habit-name-btn"
                          onClick={() =>
                            setSelectedId((id) =>
                              id === habit.id ? null : habit.id,
                            )
                          }
                        >
                          <span
                            className="habit-color-dot"
                            style={{ background: habit.color }}
                          />
                          {habit.name}
                        </button>

                        <button
                          type="button"
                          className="btn btn--danger habit-remove"
                          onClick={() => removeHabit(habit.id)}
                          aria-label={`Remove ${habit.name}`}
                        >
                          ×
                        </button>

                      </th>

                      {monthDays.map((day) => {

                        const done = isHabitDone(completions, habit.id, day)
                        const isToday = day === todayKey()
                        const weekend = isWeekend(day)

                        return (
                          <td
                            key={day}
                            className={`habit-grid__cell${isToday ? ' habit-grid__cell--today' : ''}${weekend ? ' habit-grid__cell--weekend' : ''}${done ? ' habit-grid__cell--done' : ''}`}
                          >
                            <HabitDayCheck
                              checked={done}
                              onToggle={() => toggleDay(habit.id, day)}
                              color={habit.color}
                              isToday={isToday}
                              label={`${habit.name}, ${formatDisplayDate(day)}${done ? ', completed' : ', not completed'}`}
                            />
                          </td>
                        )
                      })}

                    </tr>
                  ))}

                </tbody>

              </table>

            </div>

          </section>

          {/* ── CHANGED: single momentum line, goes up and decays down ── */}
          <section className="card">

            <h2 className="card__title">
              Monthly momentum
            </h2>

            <LineChart
              series={momentumChartSeries}
              labels={dayLabels}
              momentum={true}
            />

          </section>

          {selected && (

            <section className="card habit-detail">

              <h2 className="card__title">

                <span
                  className="habit-color-dot"
                  style={{ background: selected.color }}
                />

                {selected.name} — Report

              </h2>

              <div className="habit-detail__stats">

                <div className="habit-stat">
                  <span className="habit-stat__value">
                    {currentStreak(completions, selected.id)}
                  </span>
                  <span className="habit-stat__label">
                    Current streak
                  </span>
                </div>

                <div className="habit-stat">
                  <span className="habit-stat__value">
                    {totalCompleted(completions, selected.id)}
                  </span>
                  <span className="habit-stat__label">
                    Total days completed
                  </span>
                </div>

              </div>

              <h3 className="habit-detail__chart-title">
                Progress this month
              </h3>

              {/* ── per-habit detail chart stays as monthlySeries (cumulative) ── */}
              <LineChart
                series={[
                  {
                    id: selected.id,
                    label: selected.name,
                    color: selected.color,
                    values: monthlySeries(
                      completions,
                      selected.id,
                      viewYear,
                      viewMonth,
                    ),
                  },
                ]}
                labels={dayLabels}
              />

              <button
                type="button"
                className="btn btn--ghost habit-detail__close"
                onClick={() => setSelectedId(null)}
              >
                Close report
              </button>

            </section>

          )}

        </>
      )}

      {habits.length === 0 && (
        <section className="card">
          <EmptyState
            icon="🔥"
            title="Build your streak"
            description="Add daily activities like DSA, meditation, or web development to start tracking."
          />
        </section>
      )}

    </div>
  )
}