import { describe, expect, it } from 'vitest'
import { LEVELS } from './levels'
import { FLASK_CAPACITY, isComplete } from './flask'
import { shortestSolution } from '../test/shortestSolution'
import type { Level } from './levels'

function elixirTally(level: Level): Record<string, number> {
  const tally: Record<string, number> = {}
  for (const flask of level.board) {
    for (const elixir of flask) {
      tally[elixir] = (tally[elixir] ?? 0) + 1
    }
  }
  return tally
}

describe('LEVELS', () => {
  it('opens on the apprentice bench and works up through the atelier', () => {
    expect(LEVELS.map((level) => level.name)).toEqual([
      "The Apprentice's Bench",
      "The Herbalist's Shelf",
      'The Crowded Cupboard',
      "The Alchemist's Table",
      "The Archmage's Vault"
    ])
  })

  it('never asks for fewer pours than the bench before it', () => {
    const minima = LEVELS.map((level) => level.minimumPours)

    expect(minima).toEqual([...minima].sort((first, second) => first - second))
  })

  it('gives every bench an id of its own, which React keys the board on', () => {
    const ids = LEVELS.map((level) => level.id)

    expect(ids).toEqual([...new Set(ids)])
  })
})

describe.each(LEVELS)('$name', (level: Level) => {
  it('holds exactly one flask worth of every elixir it uses', () => {
    const tally = elixirTally(level)
    const oneFlaskEach = Object.fromEntries(
      Object.keys(tally).map((elixir) => [elixir, FLASK_CAPACITY])
    )

    expect(tally).toEqual(oneFlaskEach)
  })

  it('opens with no flask sorted for the player already', () => {
    expect(level.board.filter(isComplete)).toEqual([])
  })

  it('can be sorted in the pours it promises, and in no fewer', () => {
    expect(shortestSolution(level.board)).toHaveLength(level.minimumPours)
  })
})
