import { useCallback, useEffect, useState } from 'react'

const REMEMBERED_AS = 'magic-sort:colour-blind'

export interface ColourBlindMode {
  readonly enabled: boolean
  toggle: () => void
}

/**
 * Whether the atelier is showing its elixirs the accessible way: a palette
 * tuned for dichromacy, and a sigil on every layer for the players no palette
 * can serve.
 *
 * The choice is remembered, because an accessibility setting that has to be
 * found again on every visit is barely a setting at all. Storage is the one
 * thing here that can be switched off entirely — private windows and hardened
 * browsers throw rather than decline — and the mode works either way, it just
 * forgets.
 */
export function useColourBlindMode(): ColourBlindMode {
  const [enabled, setEnabled] = useState(wasAskedForBefore)

  const toggle = useCallback(() => {
    setEnabled((on) => !on)
  }, [])

  useEffect(() => {
    try {
      window.localStorage.setItem(REMEMBERED_AS, enabled ? 'on' : 'off')
    } catch {
      // Nothing to do: the mode is on for this visit and forgotten by the next.
    }
  }, [enabled])

  return { enabled, toggle }
}

function wasAskedForBefore(): boolean {
  try {
    return window.localStorage.getItem(REMEMBERED_AS) === 'on'
  } catch {
    return false
  }
}
