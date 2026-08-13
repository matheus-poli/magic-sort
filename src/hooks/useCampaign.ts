import { useCallback, useState } from 'react'
import { POINTS_LOST_PER_RESTART } from '../domain/scoring'
import type { Level } from '../domain/levels'

export interface Campaign {
  readonly level: Level
  /** One-based, the way the header counts it out for the player. */
  readonly position: number
  readonly levelCount: number
  readonly hasNext: boolean
  /** What the benches left behind earned, less what restarts have cost. */
  readonly bankedScore: number
  /** What restarts have cost, so the player can be told the running price. */
  readonly forfeited: number
  /**
   * Hands the apprentice the next bench, banking what they scored on this one.
   * Does nothing on the last bench, so a run cannot be banked twice.
   */
  advance: (scoreEarned: number) => void
  /** Charges for throwing a bench away and starting it again. */
  chargeForRestart: () => void
  /** Throws the whole run away: first bench again, nothing earned or owed. */
  startOver: () => void
}

interface Progress {
  readonly reached: number
  readonly earned: number
  readonly forfeited: number
}

export function useCampaign(levels: readonly Level[]): Campaign {
  const [progress, setProgress] = useState<Progress>({
    reached: 0,
    earned: 0,
    forfeited: 0
  })

  const lastPosition = levels.length - 1

  const advance = useCallback(
    (scoreEarned: number) => {
      setProgress((current) => {
        if (current.reached >= lastPosition) return current

        return {
          ...current,
          reached: current.reached + 1,
          earned: current.earned + scoreEarned
        }
      })
    },
    [lastPosition]
  )

  const chargeForRestart = useCallback(() => {
    setProgress((current) => ({
      ...current,
      forfeited: current.forfeited + POINTS_LOST_PER_RESTART
    }))
  }, [])

  const startOver = useCallback(() => {
    setProgress({ reached: 0, earned: 0, forfeited: 0 })
  }, [])

  return {
    level: levels[progress.reached],
    position: progress.reached + 1,
    levelCount: levels.length,
    hasNext: progress.reached < lastPosition,
    bankedScore: progress.earned - progress.forfeited,
    forfeited: progress.forfeited,
    advance,
    chargeForRestart,
    startOver
  }
}
