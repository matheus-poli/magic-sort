export interface RunProgress {
  readonly completedFlasks: number
  readonly pours: number
  /** The fewest pours that can sort this bench. */
  readonly minimumPours: number
  readonly solved: boolean
}

const POINTS_PER_COMPLETED_FLASK = 100
const SOLVE_BONUS = 500
/** Exported so the scoreboard can tell the player the price in the same breath. */
export const POINTS_LOST_PER_EXTRA_POUR = 25

export function scoreFor(progress: RunProgress): number {
  return (
    progress.completedFlasks * POINTS_PER_COMPLETED_FLASK + solveBonus(progress)
  )
}

function solveBonus(progress: RunProgress): number {
  if (!progress.solved) return 0

  const extraPours = Math.max(0, progress.pours - progress.minimumPours)
  return Math.max(0, SOLVE_BONUS - extraPours * POINTS_LOST_PER_EXTRA_POUR)
}
