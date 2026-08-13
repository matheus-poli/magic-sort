import { describe, expect, it } from 'vitest'
import { LEVELS } from './levels'
import { isComplete } from './flask'
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

/** The dials a bench is built from, named so a failure says which bench. */
interface Rung {
  readonly bench: string
  readonly capacity: number
  readonly elixirs: number
  readonly spares: number
}

function rungOf(level: Level): Rung {
  const elixirs = flasksToFill(level.board)

  return {
    bench: level.name,
    capacity: level.capacity,
    elixirs,
    spares: level.board.length - elixirs
  }
}

/**
 * Harder means, in order: taller glass, then fewer spare flasks, then more
 * elixirs.
 *
 * Spares outrank elixirs because they decide how much room a bench leaves. The
 * five-elixir bench with one spare can only ever be arranged 65 ways, against
 * 3521 for the six-elixir bench with two, and players read that narrowness as
 * difficulty even though it takes fewer pours to sort.
 *
 * Taller glass outranks both because it starts a shelf over rather than
 * continuing one: a five-layer flask is a new thing to learn, so the atelier
 * hands back the room it had just taken away before tightening again.
 */
function byDifficulty(first: Rung, second: Rung): number {
  return (
    first.capacity - second.capacity ||
    second.spares - first.spares ||
    first.elixirs - second.elixirs
  )
}

describe('LEVELS', () => {
  it('opens on the apprentice bench and works up through the atelier', () => {
    expect(LEVELS.map((level) => level.name)).toEqual([
      "The Apprentice's Bench",
      "The Herbalist's Shelf",
      "The Alchemist's Table",
      'The Crowded Cupboard',
      "The Archmage's Vault",
      "The Glassblower's Gift",
      "The Distiller's Row",
      "The Apothecary's Wall",
      'The Narrow Larder',
      'The Grand Alembic'
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
      Object.keys(tally).map((elixir) => [elixir, level.capacity])
    )

    expect(tally).toEqual(oneFlaskEach)
  })

  it('opens with no flask sorted for the player already', () => {
    expect(
      level.board.filter((flask) => isComplete(flask, level.capacity))
    ).toEqual([])
  })

  it('can be sorted in the pours it promises, and in no fewer', () => {
    expect(shortestSolution(level.board, level.capacity)).toHaveLength(
      level.minimumPours
    )
  })
})
