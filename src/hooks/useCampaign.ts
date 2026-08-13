import { useCallback, useState } from 'react'
import type { Level } from '../domain/levels'

export interface Campaign {
  readonly level: Level
  /** One-based, the way the header counts it out for the player. */
  readonly position: number
  readonly levelCount: number
  readonly hasNext: boolean
  /** Points earned on the benches already behind the apprentice. */
  readonly bankedScore: number
  /**
   * Hands the apprentice the next bench, banking what they scored on this one.
   * Does nothing on the last bench, so a run cannot be banked twice.
   */
  advance: (scoreEarned: number) => void
}

interface Progress {
  readonly reached: number
  readonly bankedScore: number
}

export function useCampaign(levels: readonly Level[]): Campaign {
  const [progress, setProgress] = useState<Progress>({
    reached: 0,
    bankedScore: 0
  })

  const lastPosition = levels.length - 1

  const advance = useCallback(
    (scoreEarned: number) => {
      setProgress((current) => {
        if (current.reached >= lastPosition) return current

        return {
          reached: current.reached + 1,
          bankedScore: current.bankedScore + scoreEarned
        }
      })
    },
    [lastPosition]
  )

  return {
    level: levels[progress.reached],
    position: progress.reached + 1,
    levelCount: levels.length,
    hasNext: progress.reached < lastPosition,
    bankedScore: progress.bankedScore,
    advance
  }
}
