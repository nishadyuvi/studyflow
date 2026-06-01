import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import type { DayTask } from '../../types'
import { formatDisplayDate, todayKey } from '../../utils/dates'
import { EmptyState } from '../ui/EmptyState'
import './DaySchedule.css'

// ─── Types ────────────────────────────────────────────────────────────────────

// Shape of a row coming back from Supabase
interface SupabaseTask {
  id: string
  user_id: string
  title: string
  completed: boolean
  created_at: string
  // your table has no `time` or `date` column, so we store time in title
  // if you want to add those columns later, see the note at the bottom
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function DaySchedule() {
  const [tasks, setTasks] = useState<DayTask[]>([])
  const [title, setTitle] = useState('')
  const [time, setTime] = useState('')
  const [loading, setLoading] = useState<boolean>(true)
  const [saving, setSaving] = useState<boolean>(false)
  const [error, setError] = useState<string>('')

  const today = todayKey() // e.g. "2024-05-28"

  // ── Fetch tasks for today ──────────────────────────────────────────────────
  // Runs once on mount. Fetches only the logged-in user's tasks.
  // RLS on Supabase ensures users never see each other's data.
  const fetchTasks = useCallback(async () => {
    setLoading(true)
    setError('')

    const { data, error: fetchError } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: true })

    if (fetchError) {
      setError('Could not load tasks. Please refresh.')
      setLoading(false)
      return
    }

    // Map Supabase rows → DayTask shape the UI already expects.
    // We encode `time` inside the title as "[HH:MM] actual title"
    // so no schema change is needed. See note at the bottom.
    const mapped: DayTask[] = (data as SupabaseTask[]).map((row) => {
      const timeMatch = row.title.match(/^\[(\d{2}:\d{2})\] (.+)$/)
      return {
        id: row.id,
        title: timeMatch ? timeMatch[2] : row.title,
        time: timeMatch ? timeMatch[1] : undefined,
        completed: row.completed,
        date: today, // all fetched tasks belong to today for now
      }
    })

    setTasks(mapped)
    setLoading(false)
  }, [today])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  // ── Add a task ─────────────────────────────────────────────────────────────
  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = title.trim()
    if (!trimmed) return

    setSaving(true)
    setError('')

    // Encode optional time into title so it survives in a single text column
    const storedTitle = time ? `[${time}] ${trimmed}` : trimmed

   // Get the logged-in user's ID first
const { data: { session } } = await supabase.auth.getSession()
if (!session) {
  setError('You must be logged in to add tasks.')
  setSaving(false)
  return
}

const { data, error: insertError } = await supabase
  .from('tasks')
  .insert({ title: storedTitle, completed: false, user_id: session.user.id })
  .select()
  .single()

    if (insertError || !data) {
      setError('Could not add task. Try again.')
      setSaving(false)
      return
    }

    // Optimistically add to local state — no need to re-fetch
    setTasks((prev) => [
      ...prev,
      {
        id: (data as SupabaseTask).id,
        title: trimmed,
        time: time || undefined,
        completed: false,
        date: today,
      },
    ])

    setTitle('')
    setTime('')
    setSaving(false)
  }

  // ── Toggle completed ───────────────────────────────────────────────────────
  async function toggle(id: string) {
    const task = tasks.find((t) => t.id === id)
    if (!task) return

    const newValue = !task.completed

    // Optimistic update — feels instant to the user
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: newValue } : t)),
    )

    const { error: updateError } = await supabase
      .from('tasks')
      .update({ completed: newValue })
      .eq('id', id)

    if (updateError) {
      // Revert on failure
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, completed: task.completed } : t)),
      )
      setError('Could not update task.')
    }
  }

  // ── Remove a task ──────────────────────────────────────────────────────────
  async function remove(id: string) {
    // Optimistic removal
    setTasks((prev) => prev.filter((t) => t.id !== id))

    const { error: deleteError } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id)

    if (deleteError) {
      setError('Could not delete task. Please refresh.')
      fetchTasks() // re-sync if delete failed
    }
  }

  // ── Progress ───────────────────────────────────────────────────────────────
  const doneCount = tasks.filter((t) => t.completed).length
  const progressPct =
    tasks.length > 0 ? Math.round((doneCount / tasks.length) * 100) : 0

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="day-schedule">
      <p className="day-schedule__date">{formatDisplayDate(today)}</p>

      {/* Error banner */}
      {error && (
        <p style={{
          fontSize: '13px',
          color: '#f87171',
          background: 'rgba(239,68,68,0.08)',
          border: '1px solid rgba(239,68,68,0.2)',
          borderRadius: '10px',
          padding: '10px 14px',
          marginBottom: '12px',
        }}>
          {error}
        </p>
      )}

      {/* Add task form — identical markup to before */}
      <form className="form-row" onSubmit={handleAdd}>
        <div className="form-field form-field--grow">
          <label className="form-label" htmlFor="day-title">
            Activity
          </label>
          <input
            id="day-title"
            className="form-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Review lecture notes"
            required
            disabled={saving}
          />
        </div>
        <div className="form-field">
          <label className="form-label" htmlFor="day-time">
            Time (optional)
          </label>
          <input
            id="day-time"
            type="time"
            className="form-input"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            disabled={saving}
          />
        </div>
        <button type="submit" className="btn btn--primary" disabled={saving}>
          {saving ? '…' : 'Add'}
        </button>
      </form>

      {/* Progress bar — identical markup to before */}
      {tasks.length > 0 && (
        <div className="day-schedule__progress-wrap">
          <div className="day-schedule__progress-header">
            <span className="day-schedule__progress-label">Today&apos;s momentum</span>
            <span className="day-schedule__progress-count">
              {doneCount}/{tasks.length} · {progressPct}%
            </span>
          </div>
          <div
            className="day-schedule__progress-bar"
            role="progressbar"
            aria-valuenow={progressPct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Today's task progress"
          >
            <span
              className="day-schedule__progress-fill"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          {progressPct === 100 && (
            <p className="day-schedule__celebrate">
              🎉 You crushed today&apos;s list — take a well-earned break!
            </p>
          )}
        </div>
      )}

      {/* Task list — identical markup to before */}
      {loading ? (
        <p style={{ textAlign: 'center', color: '#475569', fontSize: '14px', padding: '24px 0' }}>
          Loading tasks…
        </p>
      ) : tasks.length === 0 ? (
        <EmptyState
          icon="☀️"
          title="Plan your day"
          description="Add activities above to build momentum and stay on track."
        />
      ) : (
        <ul className="day-list">
          {tasks
            .sort((a, b) => {
              if (a.time && b.time) return a.time.localeCompare(b.time)
              if (a.time) return -1
              if (b.time) return 1
              return 0
            })
            .map((task) => (
              <li
                key={task.id}
                className={`day-item${task.completed ? ' day-item--done' : ''}`}
              >
                <label className="day-item__check">
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => toggle(task.id)}
                  />
                </label>
                {task.time && (
                  <span className="day-item__time">{task.time}</span>
                )}
                <span className="day-item__title">{task.title}</span>
                <button
                  type="button"
                  className="btn btn--danger"
                  onClick={() => remove(task.id)}
                  aria-label={`Remove ${task.title}`}
                >
                  ×
                </button>
              </li>
            ))}
        </ul>
      )}
    </div>
  )
}

/*
 * ─── NOTE: Adding `time` and `date` columns later ───────────────────────────
 *
 * Right now `time` is encoded inside the title as "[HH:MM] actual title"
 * because your current schema has no `time` or `date` column.
 *
 * When you're ready, run this in Supabase SQL editor:
 *
 *   ALTER TABLE tasks ADD COLUMN time text;
 *   ALTER TABLE tasks ADD COLUMN date text;
 *
 * Then replace the insert call with:
 *   .insert({ title: trimmed, completed: false, time: time || null, date: today })
 *
 * And remove the timeMatch encoding/decoding logic in fetchTasks.
 */