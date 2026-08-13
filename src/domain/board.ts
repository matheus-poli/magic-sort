import { canPour, isComplete, isEmpty, pour } from './flask'
import type { Flask } from './flask'

/** Every flask on the bench, in the order the apprentice sees them. */
export type Board = readonly Flask[]

export function isSolved(board: Board, capacity: number): boolean {
  return board.every((flask) => isEmpty(flask) || isComplete(flask, capacity))
}

export function completedFlaskCount(board: Board, capacity: number): number {
  return board.filter((flask) => isComplete(flask, capacity)).length
}

/** How many flasks a sorted bench ends up with: one per elixir on it. */
export function flasksToFill(board: Board): number {
  return new Set(board.flat()).size
}

export function canPourBetween(
  board: Board,
  sourceIndex: number,
  targetIndex: number,
  capacity: number
): boolean {
  if (sourceIndex === targetIndex) return false
  return canPour(
    flaskAt(board, sourceIndex),
    flaskAt(board, targetIndex),
    capacity
  )
}

export function pourBetween(
  board: Board,
  sourceIndex: number,
  targetIndex: number,
  capacity: number
): Board {
  if (sourceIndex === targetIndex) {
    throw new Error('Cannot pour a flask into itself')
  }

  const result = pour(
    flaskAt(board, sourceIndex),
    flaskAt(board, targetIndex),
    capacity
  )

  return board.map((flask, index) => {
    if (index === sourceIndex) return result.source
    if (index === targetIndex) return result.target
    return flask
  })
}

function flaskAt(board: Board, index: number): Flask {
  const flask = board[index]
  if (flask === undefined) {
    throw new Error(
      `No flask at position ${index} on a board of ${board.length}`
    )
  }
  return flask
}
