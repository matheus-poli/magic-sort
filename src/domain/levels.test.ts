import { describe, expect, it } from 'vitest'
import { STARTER_LEVEL } from './levels'
import { isSolved } from './board'
import { FLASK_CAPACITY } from './flask'
import type { Elixir } from './flask'

function countByElixir(level: typeof STARTER_LEVEL): Record<string, number> {
  const tally: Record<string, number> = {}
  for (const flask of level.board) {
    for (const elixir of flask) {
      tally[elixir] = (tally[elixir] ?? 0) + 1
    }
  }
  return tally
}

describe('STARTER_LEVEL', () => {
  it('holds exactly one flask worth of every elixir it uses', () => {
    const expected: Record<Elixir, number> = {
      crimson: FLASK_CAPACITY,
      azure: FLASK_CAPACITY,
      verdant: FLASK_CAPACITY,
      amber: FLASK_CAPACITY
    }
    expect(countByElixir(STARTER_LEVEL)).toEqual(expected)
  })

  it('offers two empty flasks to pour into', () => {
    const emptyFlasks = STARTER_LEVEL.board.filter(
      (flask) => flask.length === 0
    )
    expect(emptyFlasks).toHaveLength(2)
  })

  it('does not start already solved', () => {
    expect(isSolved(STARTER_LEVEL.board)).toBe(false)
  })

  it('sets par to the shortest known solution', () => {
    expect(STARTER_LEVEL.par).toBe(14)
  })
})
