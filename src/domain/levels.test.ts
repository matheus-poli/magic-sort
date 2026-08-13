import { describe, expect, it } from 'vitest'
import { LEVELS } from './levels'
import { FLASK_CAPACITY, isComplete } from './flask'
import { flasksToFill } from './board'
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

/** The two dials a bench is built from, named so a failure says which bench. */
interface Rung {
  readonly bench: string
  readonly elixirs: number
  readonly spares: number
}

function rungOf(level: Level): Rung {
  const elixirs = flasksToFill(level.board)

  return { bench: level.name, elixirs, spares: level.board.length - elixirs }
}

/**
 * Harder means fewer spare flasks first, and only then more elixirs. Spares
 * outrank elixirs because they decide how much room the bench leaves: the
 * five-elixir bench with one spare can only ever be arranged 65 ways, against
 * 3521 for the six-elixir bench with two, and players read that narrowness as
 * difficulty even though it takes fewer pours to sort.
 */
function byDifficulty(first: Rung, second: Rung): number {
  return second.spares - first.spares || first.elixirs - second.elixirs
}

describe('LEVELS', () => {
  it('opens on the apprentice bench and works up through the atelier', () => {
    expect(LEVELS.map((level) => level.name)).toEqual([
      "The Apprentice's Bench",
      "The Herbalist's Shelf",
      "The Alchemist's Table",
      'The Crowded Cupboard',
      "The Archmage's Vault"
    ])
  })

  it('only ever turns a dial up from one bench to the next', () => {
    const ladder = LEVELS.map(rungOf)

    expect(ladder).toEqual([...ladder].sort(byDifficulty))
  })

  it('gives every bench an id of its own to be remembered by', () => {
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
