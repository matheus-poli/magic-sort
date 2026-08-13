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

/**
 * The room a bench leaves: spare flasks to pour into. Two is room to think in,
 * one is barely any, and the difference between them is what a player feels.
 */
const ROOM_TO_LEARN = 2
const MINIMUM_ROOM = 1

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
 * The benches grouped by the mechanic they share, in the order they are played.
 * A new mechanic is new glass, so the size of the glass names the shelf.
 */
function shelvesOf(levels: readonly Level[]): Rung[][] {
  const shelves: Rung[][] = []

  for (const level of levels) {
    const rung = rungOf(level)
    const shelf = shelves.at(-1)

    if (shelf === undefined || shelf[0].capacity !== rung.capacity) {
      shelves.push([])
    }
    shelves[shelves.length - 1].push(rung)
  }

  return shelves
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
      'The Narrow Larder',
      'The Grand Alembic'
    ])
  })

  it('only ever turns a dial up from one bench to the next', () => {
    const ladder = LEVELS.map(rungOf)

    expect(ladder).toEqual([...ladder].sort(byDifficulty))
  })

  /*
   * The fix for the complaint that the atelier goes slack past the fifth bench:
   * a new mechanic used to buy three roomy benches in a row, and players felt
   * the game hand back everything it had just taught them to do without.
   */
  it('gives a new mechanic one roomy bench, then takes the room back', () => {
    const [, ...shelves] = shelvesOf(LEVELS)

    const room = shelves.map((shelf) => ({
      shelf: shelf[0].capacity,
      benches: shelf.map((rung) => `${rung.bench}: ${rung.spares} spare`)
    }))

    expect(room).toEqual(
      shelves.map((shelf) => ({
        shelf: shelf[0].capacity,
        benches: shelf.map(
          (rung, bench) =>
            `${rung.bench}: ${bench === 0 ? ROOM_TO_LEARN : MINIMUM_ROOM} spare`
        )
      }))
    )
  })

  /*
   * The exception, and the only one: the opening shelf is teaching the game
   * itself rather than a mechanic on top of it, so it climbs by the weaker dial
   * before it starts taking flasks away.
   */
  it('lets the opening shelf teach the game before it takes any room away', () => {
    const [onRamp] = shelvesOf(LEVELS)
    const roomy = onRamp.filter((rung) => rung.spares === ROOM_TO_LEARN)

    expect(roomy.map((rung) => rung.bench)).toEqual([
      "The Apprentice's Bench",
      "The Herbalist's Shelf",
      "The Alchemist's Table"
    ])
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
