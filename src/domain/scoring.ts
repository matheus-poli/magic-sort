export interface RunProgress {
  readonly completedFlasks: number
  readonly moves: number
  /** The move count the level was designed around. */
  readonly par: number
  readonly solved: boolean
}

const POINTS_PER_COMPLETED_FLASK = 100
const SOLVE_BONUS = 500
const BONUS_LOST_PER_MOVE_OVER_PAR = 25

export function scoreFor(progress: RunProgress): number {
  return (
    progress.completedFlasks * POINTS_PER_COMPLETED_FLASK + solveBonus(progress)
  )
}

function solveBonus(progress: RunProgress): number {
  if (!progress.solved) return 0

  const movesOverPar = Math.max(0, progress.moves - progress.par)
  return Math.max(0, SOLVE_BONUS - movesOverPar * BONUS_LOST_PER_MOVE_OVER_PAR)
}
