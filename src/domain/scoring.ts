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
