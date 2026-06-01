import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useFocusAmbient } from '../../hooks/useFocusAmbient'
import { randomQuote } from '../../utils/quotes'
import { FocusAmbientToggle } from './FocusAmbientToggle'
import './FocusMode.css'

const DEFAULT_WORK_MINUTES = 25
const DEFAULT_BREAK_MINUTES = 5
const BREAK_SECONDS = DEFAULT_BREAK_MINUTES * 60

type Phase = 'work' | 'break' | 'idle'

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function phaseLabel(phase: Phase) {
  if (phase === 'idle') return 'Ready'
  if (phase === 'work') return 'Focus session'
  return 'Short break'
}

function FocusTimerRing({
  secondsLeft,
  phase,
  progress,
  size = 'default',
}: {
  secondsLeft: number
  phase: Phase
  progress: number
  size?: 'default' | 'large'
}) {
  return (
    <div
      className={`focus-mode__ring${size === 'large' ? ' focus-mode__ring--large' : ''}`}
      style={{ '--progress': `${progress}%` } as React.CSSProperties}
    >
      <span className="focus-mode__time">{formatTime(secondsLeft)}</span>
      <span className="focus-mode__phase">{phaseLabel(phase)}</span>
    </div>
  )
}

export function FocusMode() {
  const [phase, setPhase] = useState<Phase>('idle')
  const [workMinutes, setWorkMinutes] = useState(DEFAULT_WORK_MINUTES)
  const [secondsLeft, setSecondsLeft] = useState(
    DEFAULT_WORK_MINUTES * 60,
  )
  const [running, setRunning] = useState(false)
  const [maximized, setMaximized] = useState(false)
  const [quote] = useState(randomQuote)
  const intervalRef = useRef<number | null>(null)

  const workSeconds = workMinutes * 60
  const totalSeconds = phase === 'break' ? BREAK_SECONDS : workSeconds
  const progress =
    phase === 'idle' ? 0 : ((totalSeconds - secondsLeft) / totalSeconds) * 100
  const sessionActive = phase !== 'idle'
  const { enabled: ambientOn, toggle: toggleAmbient } =
    useFocusAmbient(sessionActive)

  const tick = useCallback(() => {
    setSecondsLeft((prev) => {
      if (prev <= 1) {
        if (phase === 'work') {
          setPhase('break')
          setRunning(true)
          return BREAK_SECONDS
        }
        setPhase('idle')
        setRunning(false)
        return workSeconds
      }
      return prev - 1
    })
  }, [phase, workSeconds])

  useEffect(() => {
    if (phase === 'idle') {
      setSecondsLeft(workSeconds)
      setMaximized(false)
    }
  }, [phase, workSeconds])

  useEffect(() => {
    if (!running) {
      if (intervalRef.current) clearInterval(intervalRef.current)
      return
    }
    intervalRef.current = window.setInterval(tick, 1000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [running, tick])

  useEffect(() => {
    if (!maximized) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [maximized])

  useEffect(() => {
    if (!maximized) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setMaximized(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [maximized])

  function startWork() {
    setPhase('work')
    setSecondsLeft(workSeconds)
    setRunning(true)
    setMaximized(true)
  }

  function pause() {
    setRunning(false)
  }

  function resume() {
    if (phase !== 'idle') setRunning(true)
  }

  function reset() {
    setRunning(false)
    setPhase('idle')
    setSecondsLeft(workSeconds)
    setMaximized(false)
  }

  const sessionControls = (
    <>
      {running && (
        <button type="button" className="btn btn--ghost" onClick={pause}>
          Pause
        </button>
      )}
      {!running && (
        <button type="button" className="btn btn--primary" onClick={resume}>
          Resume
        </button>
      )}
      <button type="button" className="btn btn--ghost" onClick={reset}>
        Reset
      </button>
    </>
  )

  const maximizedOverlay =
    maximized &&
    sessionActive &&
    createPortal(
      <div
        className="focus-max"
        role="dialog"
        aria-modal="true"
        aria-label="Focus mode — maximized"
      >
        <div className="focus-max__inner">
          <button
            type="button"
            className="focus-max__minimize btn btn--ghost"
            onClick={() => setMaximized(false)}
            aria-label="Exit maximized view"
          >
            Minimize ↙
          </button>

          <blockquote className="focus-max__quote">
            <p>&ldquo;{quote.text}&rdquo;</p>
            <cite>— {quote.author}</cite>
          </blockquote>

          <FocusTimerRing
            secondsLeft={secondsLeft}
            phase={phase}
            progress={progress}
            size="large"
          />

          <div className="focus-max__ambient">
            <FocusAmbientToggle enabled={ambientOn} onToggle={toggleAmbient} />
          </div>

          <div className="focus-max__actions">{sessionControls}</div>

          <p className="focus-max__hint">Press Esc to minimize · Stay in the zone</p>
        </div>
      </div>,
      document.body,
    )

  return (
    <>
      <div
        className={`focus-mode${running ? ' focus-mode--active' : ''}${maximized && sessionActive ? ' focus-mode--maximized-hidden' : ''}`}
      >
        <blockquote className="focus-mode__quote">
          <p>&ldquo;{quote.text}&rdquo;</p>
          <cite>— {quote.author}</cite>
        </blockquote>

        <div className="focus-mode__settings" aria-label="Focus settings">
          <div className="focus-mode__setting">
            <label className="focus-mode__setting-label" htmlFor="focus-minutes">
              Focus (minutes)
            </label>
            <input
              id="focus-minutes"
              className="focus-mode__setting-input"
              type="number"
              min={1}
              max={90}
              step={1}
              value={workMinutes}
              onChange={(e) => {
                const next = Number(e.target.value)
                if (Number.isFinite(next) && next >= 1 && next <= 90) {
                  setWorkMinutes(next)
                }
              }}
              disabled={phase !== 'idle'}
            />
          </div>
        </div>

        <FocusTimerRing
          secondsLeft={secondsLeft}
          phase={phase}
          progress={progress}
        />

        <div className="focus-mode__actions">
          {phase === 'idle' && (
            <button
              type="button"
              className="btn btn--primary"
              onClick={startWork}
            >
              Start Focus ({workMinutes} min)
            </button>
          )}
          {sessionActive && (
            <>
              <FocusAmbientToggle
                enabled={ambientOn}
                onToggle={toggleAmbient}
              />
              {sessionControls}
              <button
                type="button"
                className="btn btn--primary focus-mode__maximize-btn"
                onClick={() => setMaximized(true)}
                aria-label="Maximize focus timer"
              >
                Maximize ⛶
              </button>
            </>
          )}
        </div>
        <p className="focus-mode__hint">
          {workMinutes}-minute sessions · {DEFAULT_BREAK_MINUTES}-minute breaks
          {sessionActive && ' · Maximize for distraction-free focus'}
        </p>
      </div>

      {maximizedOverlay}
    </>
  )
}
