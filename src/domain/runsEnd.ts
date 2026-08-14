import { isStuck } from './board'
import {
  benchWorth,
  isRuined,
  priceOfRestart,
  restartWouldRuin,
  totalScore
} from './scoring'
import type { Board } from './board'

/**
 * How a run ended, which is what the card that closes it has to say. The two
 * endings are the same sentence from either side: the apprentice can no longer
 * pay their way to a bench worth sorting.
 */
export type RunsEnd =
  /** Owing more than a flawless bench could ever pay back. */
  | { readonly kind: 'buried'; readonly debt: number }
  /** On a bench with no pour left, and priced out of laying it out again. */
  | { readonly kind: 'stuck'; readonly price: number }

export interface Run {
  /** The bench in front of the apprentice, which may have run dry of pours. */
  readonly board: Board
  /** Points from the benches left behind, less what restarts have cost. */
  readonly banked: number
  /** What the bench in hand has earned so far. */
  readonly bench: number
  /** Which bench of the atelier this is, counted the way a player counts. */
  readonly position: number
}

/**
 * Whether this run is over, and what ended it, or null while there is a way
 * out of it left. It is the whole of the question: the campaign knows what is
 * owed and the bench knows what can still be poured, and neither of them can
 * answer it alone.
 */
export function endOfRun({
  board,
  banked,
  bench,
  position
}: Run): RunsEnd | null {
  if (isRuined({ banked, benchInHand: benchWorth(position) })) {
    return { kind: 'buried', debt: -totalScore({ banked, bench }) }
  }

  if (isStuck(board) && restartWouldRuin({ banked, position })) {
    return { kind: 'stuck', price: priceOfRestart(position) }
  }

  return null
}
