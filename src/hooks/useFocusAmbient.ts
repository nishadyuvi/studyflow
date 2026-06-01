import { useCallback, useEffect, useRef } from 'react'
import { LofiAmbientSynth } from '../utils/lofiAmbientSynth'
import { useLocalStorage } from './useLocalStorage'

const RAIN_SRC = '/audio/rain.mp3'
const LOFI_SRC = '/audio/lofi-jazz.mp3'

export function useFocusAmbient(sessionActive: boolean) {
  const [enabled, setEnabled] = useLocalStorage('studyflow-focus-ambient', false)
  const rainRef = useRef<HTMLAudioElement | null>(null)
  const musicRef = useRef<HTMLAudioElement | null>(null)
  const synthRef = useRef<LofiAmbientSynth | null>(null)
  const useSynthRef = useRef(false)

  useEffect(() => {
    fetch(LOFI_SRC, { method: 'HEAD' })
      .then((res) => {
        if (!res.ok) useSynthRef.current = true
      })
      .catch(() => {
        useSynthRef.current = true
      })
  }, [])

  const stopAll = useCallback(() => {
    rainRef.current?.pause()
    if (rainRef.current) rainRef.current.currentTime = 0

    musicRef.current?.pause()
    if (musicRef.current) musicRef.current.currentTime = 0

    synthRef.current?.stop()
    synthRef.current = null
  }, [])

  const startAll = useCallback(async () => {
    if (!rainRef.current) {
      rainRef.current = new Audio(RAIN_SRC)
      rainRef.current.loop = true
      rainRef.current.volume = 0.4
    }

    if (!musicRef.current) {
      musicRef.current = new Audio(LOFI_SRC)
      musicRef.current.loop = true
      musicRef.current.volume = 0.35
      musicRef.current.addEventListener('error', () => {
        useSynthRef.current = true
      })
    }

    try {
      await rainRef.current.play()
    } catch {
      /* autoplay blocked until user gesture — toggle is a gesture */
    }

    if (useSynthRef.current) {
      if (!synthRef.current) {
        synthRef.current = new LofiAmbientSynth()
      }
      await synthRef.current.start()
      return
    }

    try {
      await musicRef.current.play()
    } catch {
      useSynthRef.current = true
      if (!synthRef.current) {
        synthRef.current = new LofiAmbientSynth()
      }
      await synthRef.current.start()
    }
  }, [])

  useEffect(() => {
    if (!enabled || !sessionActive) {
      stopAll()
      return
    }
    void startAll()
    return stopAll
  }, [enabled, sessionActive, startAll, stopAll])

  useEffect(() => () => stopAll(), [stopAll])

  const toggle = useCallback(() => {
    setEnabled((prev) => !prev)
  }, [setEnabled])

  return { enabled, setEnabled, toggle, stopAll }
}
