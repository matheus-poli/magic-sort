import { describe, expect, it } from 'vitest'
import { shortestSolution } from './shortestSolution'
import { pourBetween } from '../domain/board'
import { isComplete, isEmpty } from '../domain/flask'
import type { Board } from '../domain/board'

/** Two elixirs and one spare flask, which takes five pours to sort. */
const twoElixirs: Board = [
  ['crimson', 'azure', 'azure', 'crimson'],
  ['azure', 'crimson', 'crimson', 'azure'],
  []
]

describe('shortestSolution', () => {
  it('sorts a nearly finished bench in the single pour it has left', () => {
    const board: Board = [
      ['crimson', 'crimson', 'crimson'],
      ['crimson'],
      ['azure', 'azure', 'azure', 'azure']
    ]

    expect(shortestSolution(board)).toHaveLength(1)
  })

  it('measures the shortest route, not the first one it stumbles on', () => {
    expect(shortestSolution(twoElixirs)).toHaveLength(5)
  })

  it('returns a route the bench accepts, with nothing left mixed at the end', () => {
    const route = shortestSolution(twoElixirs) ?? []

    // pourBetween throws on a pour the flasks would refuse, so replaying the
    // route is itself the check that every step of it is legal.
    const finished = route.reduce<Board>(
      (bench, [source, target]) => pourBetween(bench, source, target),
      twoElixirs
    )

    expect(
      finished.filter((flask) => !isEmpty(flask) && !isComplete(flask))
    ).toEqual([])
  })

  it('has nothing to pour on a bench that is already sorted', () => {
    const board: Board = [['crimson', 'crimson', 'crimson', 'crimson'], []]

    expect(shortestSolution(board)).toEqual([])
  })

  it('reports a bench that no sequence of pours can sort', () => {
    const board: Board = [
      ['crimson', 'azure', 'crimson', 'azure'],
      ['azure', 'crimson', 'azure', 'crimson']
    ]

    expect(shortestSolution(board)).toBeNull()
  })
})
