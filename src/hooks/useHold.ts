import { useCallback, useEffect, useRef, useState } from 'react'
import { playSound, stopSound, warmSound } from '../audio/sounds'
import type { SoundName } from '../audio/sounds'

export interface Press {
  /**
   * How long the press has to last, and the length of the charge sound: the
   * two are one promise, and the sound has to run out as the bar fills.
   */
  readonly duration: number
  /** Heard for as long as the press is held, and cut off if it is let go. */
  readonly charge: SoundName
  /**
   * Heard the moment the press goes through, or null when what the press lands
   * on has a voice of its own: a press that ends the run must not sound like
   * the thing it usually does.
   */
  readonly done: SoundName | null
  onHeld: () => void
}

export interface Hold {
  /** True from the press until it goes through or is let go. */
  readonly isHolding: boolean
  start: () => void
  cancel: () => void
}

/**
 * Turns a press into a deliberate act: nothing happens until it has been held
 * for its full length, and letting go early takes the charge with it.
 *
 * How long that is belongs to the button rather than to this hook. Throwing a
 * bench away asks for a moment's thought; throwing a whole run away asks for
 * rather more than that.
 */
export function useHold({ duration, charge, done, onHeld }: Press): Hold {
  const [isHolding, setIsHolding] = useState(false)
  const charging = useRef<number | null>(null)

  const start = useCallback((): void => {
    // A held-down key repeats, and a repeat is the same press.
    if (charging.current !== null) return

    setIsHolding(true)
    playSound(charge)
    // The press is long enough to fetch what it lands on, and one of these
    // lands on a recorded track that would otherwise arrive after the deed.
    if (done !== null) warmSound(done)

    charging.current = window.setTimeout(() => {
      charging.current = null
      stopSound(charge)
      if (done !== null) playSound(done)
      setIsHolding(false)
      onHeld()
    }, duration)
  }, [duration, charge, done, onHeld])

  const cancel = useCallback((): void => {
    if (charging.current === null) return

    clearTimeout(charging.current)
    charging.current = null
    stopSound(charge)
    setIsHolding(false)
  }, [charge])

  // A press outliving the bench it belongs to must not go through behind it.
  useEffect(
    () => () => {
      if (charging.current !== null) clearTimeout(charging.current)
    },
    []
  )

  return { isHolding, start, cancel }
}
