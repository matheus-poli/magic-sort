import { useCallback, useMemo, useState } from 'react'
import {
  canPourBetween,
  completedFlaskCount,
  flasksToFill,
  isSolved,
  pourBetween
} from '../domain/board'
import { isComplete, isEmpty } from '../domain/flask'
import { scoreFor } from '../domain/scoring'
import type { Board } from '../domain/board'
import type { Level } from '../domain/levels'

export type TapOutcome =
  'ignored' | 'picked-up' | 'put-down' | 'poured' | 'refused'

export interface LastTap {
  readonly outcome: TapOutcome
  /** Rises on every tap, so repeats of the same outcome still re-fire effects. */
  readonly sequence: number
  /** The flask this tap filled to the brim, if it filled one. */
  readonly completedFlaskIndex: number | null
  /** The flask that turned this pour away, if one did. */
  readonly refusedFlaskIndex: number | null
}

export interface Game {
  readonly board: Board
  readonly selectedIndex: number | null
  readonly pours: number
  readonly score: number
  readonly isSolved: boolean
  readonly lastTap: LastTap
  /** The one gesture the game understands: pick a flask up, or pour it out. */
  tapFlask: (index: number) => void
  restart: () => void
}

interface Bench {
  readonly board: Board
  readonly selectedIndex: number | null
  readonly pours: number
  readonly lastTap: LastTap
}

export function useGame(level: Level): Game {
  const openingBench = useMemo(() => benchFor(level), [level])
  const [bench, setBench] = useState(openingBench)

  const tapFlask = useCallback((index: number) => {
    setBench((current) => tap(current, index))
  }, [])

  const restart = useCallback(() => {
    setBench(openingBench)
  }, [openingBench])

  const solved = isSolved(bench.board)
  const score = scoreFor({
    completedFlasks: completedFlaskCount(bench.board),
    flasksToFill: flasksToFill(bench.board),
    pours: bench.pours,
    minimumPours: level.minimumPours,
    solved
  })

  return {
    board: bench.board,
    selectedIndex: bench.selectedIndex,
    pours: bench.pours,
    score,
    isSolved: solved,
    lastTap: bench.lastTap,
    tapFlask,
    restart
  }
}

function benchFor(level: Level): Bench {
  return {
    board: level.board,
    selectedIndex: null,
    pours: 0,
    lastTap: {
      outcome: 'ignored',
      sequence: 0,
      completedFlaskIndex: null,
      refusedFlaskIndex: null
    }
  }
}

function tap(bench: Bench, index: number): Bench {
  const sequence = bench.lastTap.sequence + 1
  const quietTap = {
    sequence,
    completedFlaskIndex: null,
    refusedFlaskIndex: null
  }

  if (bench.selectedIndex === null) {
    const picked = pickUp(bench.board, index)
    return {
      ...bench,
      selectedIndex: picked,
      lastTap: {
        ...quietTap,
        outcome: picked === null ? 'ignored' : 'picked-up'
      }
    }
  }

  if (bench.selectedIndex === index) {
    return {
      ...bench,
      selectedIndex: null,
      lastTap: { ...quietTap, outcome: 'put-down' }
    }
  }

  if (!canPourBetween(bench.board, bench.selectedIndex, index)) {
    return {
      ...bench,
      selectedIndex: null,
      lastTap: { ...quietTap, outcome: 'refused', refusedFlaskIndex: index }
    }
  }

  const board = pourBetween(bench.board, bench.selectedIndex, index)

  return {
    board,
    selectedIndex: null,
    pours: bench.pours + 1,
    lastTap: {
      ...quietTap,
      outcome: 'poured',
      // Only the flask receiving the pour can have just been filled.
      completedFlaskIndex: isComplete(board[index]) ? index : null
    }
  }
}

function pickUp(board: Board, index: number): number | null {
  const flask = board[index]
  if (flask === undefined || isEmpty(flask)) return null
  return index
}
