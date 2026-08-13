import { useCallback, useEffect, useRef, useState } from 'react'
import { playSound, stopSound } from '../audio/sounds'

/**
 * How long a press has to last. Long enough that it cannot happen by accident,
 * short enough not to feel like a punishment — and the length of the charge
 * sound in scripts/generate-sounds.mjs, which has to run out as the bar fills.
 */
export const HOLD_MS = 900

export interface Hold {
  /** True from the press until it goes through or is let go. */
  readonly isHolding: boolean
  start: () => void
  cancel: () => void
}

/**
 * Turns a press into a deliberate act: nothing happens until it has been held
 * for HOLD_MS, and letting go early takes the charge with it.
 */
export function useHold(onHeld: () => void): Hold {
  const [isHolding, setIsHolding] = useState(false)
  const charging = useRef<number | null>(null)

  const start = useCallback((): void => {
    // A held-down key repeats, and a repeat is the same press.
    if (charging.current !== null) return

    setIsHolding(true)
    playSound('charge')

    charging.current = window.setTimeout(() => {
      charging.current = null
      stopSound('charge')
      playSound('reset')
      setIsHolding(false)
      onHeld()
    }, HOLD_MS)
  }, [onHeld])

  const cancel = useCallback((): void => {
    if (charging.current === null) return

    clearTimeout(charging.current)
    charging.current = null
    stopSound('charge')
    setIsHolding(false)
  }, [])

  // A press outliving the bench it belongs to must not go through behind it.
  useEffect(
    () => () => {
      if (charging.current !== null) clearTimeout(charging.current)
    },
    []
  )

  return { isHolding, start, cancel }
}
