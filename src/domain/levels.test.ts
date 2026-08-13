import { describe, expect, it } from 'vitest'
import { LEVELS } from './levels'
import { isComplete } from './flask'
import { flasksToFill } from './board'
import { shortestSolution } from '../test/shortestSolution'
import type { Level } from './levels'

function elixirTally(level: Level): Record<string, number> {
  const tally: Record<string, number> = {}
  for (const flask of level.board) {
    for (const elixir of flask.contents) {
      tally[elixir] = (tally[elixir] ?? 0) + 1
    }
  }
  return tally
}

/**
 * The glass a bench is laid out in, largest first. It is what names the bench's
 * mechanic: one size is the plain bench, two sizes is the bench where the small
 * vial is the whole puzzle.
 */
function glassOf(level: Level): string {
  const sizes = [...new Set(level.board.map((flask) => flask.capacity))]
  return sizes.sort((first, second) => second - first).join('/')
}

/** The dials a bench is built from, named so a failure says which bench. */
interface Rung {
  readonly bench: string
  readonly glass: string
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
    glass: glassOf(level),
    elixirs,
    spares: level.board.length - elixirs
  }
}

/**
 * The benches grouped by the mechanic they share, in the order they are played.
 * A new mechanic is new glass on the bench, so the glass names the shelf.
 */
function shelvesOf(levels: readonly Level[]): Rung[][] {
  const shelves: Rung[][] = []

  for (const level of levels) {
    const rung = rungOf(level)
    const shelf = shelves.at(-1)

    if (shelf === undefined || shelf[0].glass !== rung.glass) shelves.push([])
    shelves[shelves.length - 1].push(rung)
  }

  return shelves
}

/**
 * Within a shelf, harder means fewer spare flasks first and more elixirs
 * second. Spares outrank elixirs because they decide how much room a bench
 * leaves: the five-elixir bench with one spare can only ever be arranged 65
 * ways, against 3521 for the six-elixir bench with two, and players read that
 * narrowness as difficulty even though it takes fewer pours to sort.
 */
function byDifficulty(first: Rung, second: Rung): number {
  return second.spares - first.spares || first.elixirs - second.elixirs
}

/**
 * Every elixir has to end up sealed in a glass its layers exactly fill, so the
 * layer counts on a bench must match its glass sizes one for one. On a bench of
 * mixed glass that is the rule the player is really solving around: the elixir
 * with three layers has only the three-layer vials to end in.
 */
function elixirsWithNoGlassToFill(level: Level): string[] {
  const glasses = level.board.map((flask) => flask.capacity)
  const unmatched: string[] = []

  for (const [elixir, layers] of Object.entries(elixirTally(level))) {
    const glass = glasses.indexOf(layers)
    if (glass === -1) unmatched.push(`${elixir} fills ${layers} layers`)
    else glasses.splice(glass, 1)
  }

  return unmatched
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
      'The Grand Alembic',
      'The Vial Rack',
      "The Distiller's Row",
      "The Apothecary's Wall",
      'The Mismatched Set',
      "The Curator's Cabinet",
      "The Philosopher's Bench"
    ])
  })

  it('teaches one mechanic at a time and never goes back to an earlier one', () => {
    const shelves = shelvesOf(LEVELS).map((shelf) => shelf[0].glass)

    expect(shelves).toEqual([...new Set(shelves)])
  })

  it('only ever turns a dial up from one bench to the next on a shelf', () => {
    const shelves = shelvesOf(LEVELS)

    expect(shelves).toEqual(
      shelves.map((shelf) => [...shelf].sort(byDifficulty))
    )
  })

  /*
   * The fix for the complaint that the atelier goes slack past the fifth bench:
   * a new mechanic used to buy three roomy benches in a row, and players felt
   * the game hand back everything it had just taught them to do without.
   */
  it('gives a new mechanic one roomy bench, then takes the room back', () => {
    const [, ...shelves] = shelvesOf(LEVELS)

    const room = shelves.map((shelf) => ({
      shelf: shelf[0].glass,
      benches: shelf.map((rung) => `${rung.bench}: ${rung.spares} spare`)
    }))

    expect(room).toEqual(
      shelves.map((shelf) => ({
        shelf: shelf[0].glass,
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
  it('has a glass that exactly fits every elixir it holds', () => {
    expect(elixirsWithNoGlassToFill(level)).toEqual([])
  })

  it('opens with no flask sorted for the player already', () => {
    expect(level.board.filter(isComplete)).toEqual([])
  })

  it('can be sorted in the pours it promises, and in no fewer', () => {
    expect(shortestSolution(level.board)).toHaveLength(level.minimumPours)
  })
})
