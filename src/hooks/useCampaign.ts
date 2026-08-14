import { useCallback, useEffect, useState } from 'react'
import {
  POINTS_LOST_PER_RESTART,
  POINTS_LOST_PER_START_OVER,
  perfectTotal
} from '../domain/scoring'
import { readSavedRun, rememberCampaign } from '../storage/savedRun'
import type { Level } from '../domain/levels'

export interface Campaign {
  readonly level: Level
  /** One-based, the way the header counts it out for the player. */
  readonly position: number
  readonly levelCount: number
  readonly hasNext: boolean
  /** What the benches left behind earned, less what restarts have cost. */
  readonly bankedScore: number
  /** What restarts and rebirths have cost, to tell the player the price. */
  readonly forfeited: number
  /** The most this campaign could have scored by now, rebirths included. */
  readonly perfectTotal: number
  /**
   * Hands the apprentice the next bench, banking what they scored on this one.
   * Does nothing on the last bench, so a run cannot be banked twice.
   */
  advance: (scoreEarned: number) => void
  /** Charges for throwing a bench away and starting it again. */
  chargeForRestart: () => void
  /** Sends the apprentice back to the first bench, points kept, for a price. */
  startOver: () => void
}

interface Progress {
  readonly reached: number
  readonly earned: number
  readonly forfeited: number
  readonly rebirths: number
}

export function useCampaign(levels: readonly Level[]): Campaign {
  const [progress, setProgress] = useState<Progress>(() =>
    openingProgress(levels)
  )

  // Written down on every change rather than on the way out: a browser tab is
  // closed without warning, and there is no last moment to be told about.
  useEffect(() => {
    rememberCampaign(progress)
  }, [progress])

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

  /*
   * A rebirth rather than a wipe: the apprentice walks back to the first bench
   * carrying every point they earned, and pays a flawless bench for the walk.
   * Wiping the score made this button one nobody could afford to press.
   */
  const startOver = useCallback(() => {
    setProgress((current) => ({
      ...current,
      reached: 0,
      forfeited: current.forfeited + POINTS_LOST_PER_START_OVER,
      rebirths: current.rebirths + 1
    }))
  }, [])

  return {
    level: levels[progress.reached],
    position: progress.reached + 1,
    levelCount: levels.length,
    hasNext: progress.reached < lastPosition,
    bankedScore: progress.earned - progress.forfeited,
    forfeited: progress.forfeited,
    perfectTotal: perfectTotal({
      levelCount: levels.length,
      rebirths: progress.rebirths
    }),
    advance,
    chargeForRestart,
    startOver
  }
}

/** The run the apprentice comes back to, or a fresh one for a first visit. */
function openingProgress(levels: readonly Level[]): Progress {
  const saved = readSavedRun()?.campaign
  if (saved === undefined) {
    return { reached: 0, earned: 0, forfeited: 0, rebirths: 0 }
  }

  return { ...saved, reached: benchWithin(levels, saved.reached) }
}

/*
 * A save outlives the atelier it was written in: benches are reordered and
 * dropped between builds, and a run pointing past the end of the list has to
 * land on a bench that exists rather than on nothing at all.
 */
function benchWithin(levels: readonly Level[], reached: number): number {
  return Math.min(Math.max(0, Math.trunc(reached)), levels.length - 1)
}
