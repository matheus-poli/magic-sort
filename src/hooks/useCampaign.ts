import { useCallback, useState } from 'react'
import type { Level } from '../domain/levels'

export interface Campaign {
  readonly level: Level
  /** One-based, the way the header counts it out for the player. */
  readonly position: number
  readonly total: number
  readonly hasNext: boolean
  /** Hands the apprentice the next bench. Does nothing on the last one. */
  advance: () => void
}

export function useCampaign(levels: readonly Level[]): Campaign {
  const [reached, setReached] = useState(0)

  const advance = useCallback(() => {
    setReached((current) => Math.min(current + 1, levels.length - 1))
  }, [levels.length])

  return {
    level: levels[reached],
    position: reached + 1,
    total: levels.length,
    hasNext: reached < levels.length - 1,
    advance
  }
}
