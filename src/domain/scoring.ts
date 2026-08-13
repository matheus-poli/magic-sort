export interface RunProgress {
  readonly completedFlasks: number
  /** How many flasks a sorted bench ends up with: one per elixir. */
  readonly flasksToFill: number
  readonly pours: number
  /** The fewest pours that can sort this bench. */
  readonly minimumPours: number
  readonly solved: boolean
}

const POINTS_FOR_SORTING = 500
const POINTS_FOR_SOLVING = 500

/**
 * Every bench is scored out of the same total, so a score reads the same
 * wherever it was earned: half of it for sorting the elixirs, half for spending
 * no more pours than the bench demands.
 */
export const PERFECT_SCORE = POINTS_FOR_SORTING + POINTS_FOR_SOLVING

/** Exported so the scoreboard can tell the player the price in the same breath. */
export const POINTS_LOST_PER_EXTRA_POUR = 25

/**
 * What throwing a bench away costs the campaign. Restarting is the way out of
 * a mistake, so it is allowed — it just is not free.
 */
export const POINTS_LOST_PER_RESTART = 100

export interface CampaignProgress {
  /** Points from the benches left behind, less what restarts have cost. */
  readonly banked: number
  /** What the bench in front of the apprentice is worth right now. */
  readonly bench: number
}

/**
 * The number on the scoreboard's total. Restarts can cost more than the benches
 * have earned so far, and a campaign in debt reads as zero rather than as a
 * negative score nobody wants to look at.
 */
export function totalScore({ banked, bench }: CampaignProgress): number {
  return Math.max(0, banked + bench)
}

export function scoreFor(progress: RunProgress): number {
  return sortingPoints(progress) + solvingPoints(progress)
}

function sortingPoints({ completedFlasks, flasksToFill }: RunProgress): number {
  return Math.round((POINTS_FOR_SORTING * completedFlasks) / flasksToFill)
}

function solvingPoints(progress: RunProgress): number {
  if (!progress.solved) return 0

  const extraPours = Math.max(0, progress.pours - progress.minimumPours)
  return Math.max(
    0,
    POINTS_FOR_SOLVING - extraPours * POINTS_LOST_PER_EXTRA_POUR
  )
}
