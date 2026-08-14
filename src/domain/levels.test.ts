import { describe, expect, it } from 'vitest'
import { LEVELS } from './levels'
import { isComplete } from './flask'
import { flasksToFill } from './board'
import { possibilitiesOf } from '../test/possibilities'
import { shortestSolution } from '../test/shortestSolution'
import type { Possibilities } from '../test/possibilities'
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
 * Walking a bench's arrangements is the most expensive thing this suite does,
 * and three tests ask about the same fifty benches. Each one is walked once.
 */
const walked = new Map<string, Possibilities>()

function possibilitiesFor(level: Level): Possibilities {
  const known = walked.get(level.id)
  if (known !== undefined) return known

  const measured = possibilitiesOf(level.board)
  walked.set(level.id, measured)
  return measured
}

/** How much of a bench is a trap: the share of its arrangements already lost. */
function lostShare(level: Level): number {
  const { reachable, lost } = possibilitiesFor(level)
  return lost / reachable
}

function describeShare(level: Level): string {
  return `${level.name}: ${Math.round(100 * lostShare(level))}% of its arrangements lost`
}

/**
 * The mechanic a bench is built on: the glass it is laid out in, largest
 * first, and whether the room it leaves is scattered through part-filled glass
 * instead of pooled in flasks standing empty. It is what names a shelf — one
 * size of glass is the plain bench, two sizes is the bench where the small
 * vial is the whole puzzle, and scattered room is the bench with nowhere to
 * pour a run out to.
 */
function mechanicOf(level: Level): string {
  const glass = [...new Set(level.board.map((flask) => flask.capacity))]
    .sort((first, second) => second - first)
    .join('/')

  return hasScatteredRoom(level) ? `${glass} scattered` : glass
}

function hasScatteredRoom(level: Level): boolean {
  return level.board.some(
    (flask) =>
      flask.contents.length > 0 && flask.contents.length < flask.capacity
  )
}

/** The dials a bench is built from, named so a failure says which bench. */
interface Rung {
  readonly bench: string
  readonly mechanic: string
  readonly elixirs: number
  readonly spares: number
  /** How many of this bench's arrangements can no longer be sorted. */
  readonly lost: number
}

/**
 * The room a bench leaves: flasks that end up empty. Two is room to think in,
 * one is barely any, and the difference between them is what a player feels.
 */
const ROOM_TO_LEARN = 2
const MINIMUM_ROOM = 1

/**
 * What a bench with room to think in may cost an apprentice, and what a bench
 * without it has to. Measured as a share of everything the bench can be poured
 * into, so it says the same thing about a bench of any size.
 */
const FORGIVING = 0.1
const MERCILESS = 0.3

function rungOf(level: Level): Rung {
  const elixirs = flasksToFill(level.board)

  return {
    bench: level.name,
    mechanic: mechanicOf(level),
    elixirs,
    spares: level.board.length - elixirs,
    lost: possibilitiesFor(level).lost
  }
}

/**
 * The benches grouped by the mechanic they share, in the order they are played.
 */
function shelvesOf(levels: readonly Level[]): Rung[][] {
  const shelves: Rung[][] = []

  for (const level of levels) {
    const rung = rungOf(level)
    const shelf = shelves.at(-1)

    if (shelf === undefined || shelf[0].mechanic !== rung.mechanic) {
      shelves.push([])
    }
    shelves[shelves.length - 1].push(rung)
  }

  return shelves
}

/**
 * Within a shelf, harder means fewer spare flasks first and more elixirs
 * second. Spares outrank elixirs because they decide how much room a bench
 * leaves: the five-elixir bench with one spare can only ever be arranged 65
 * ways against 3524 for the six-elixir bench with two, and nearly half of
 * those 65 have already lost it.
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
      "The Philosopher's Bench",
      'The Deep Glass',
      "The Cooper's Cellar",
      'The Tallow Counter',
      'The Brimming Chest',
      'The Long Draught',
      "The Glazier's Sample",
      'The Four Measures',
      "The Sorter's Ledger",
      "The Assayer's Balance",
      'The Crowded Sideboard',
      'The Half-Poured Batch',
      'The Spilled Measure',
      'The Uneven Pour',
      'The Careless Hand',
      'The Restless Cellar',
      'The Unfinished Errand',
      'The Crooked Dozen',
      'The Cluttered Scullery',
      'The Midnight Inventory',
      "The Guild's Reckoning",
      "The Master's Decanter",
      'The Deep Cask',
      'The Seven Seals',
      'The Towering Flight',
      "The Vintner's Folly",
      'The Grand Cabinet',
      'The Whole Cellar',
      'The Endless Counter',
      "The Keeper's Inventory",
      "The Master's Ledger",
      'The Last Apprenticeship',
      "The Sorcerer's Draught",
      "The Adept's Trial",
      'The Long Vigil',
      'The Final Distillation',
      'The Magnum Opus'
    ])
  })

  it('teaches one mechanic at a time and never goes back to an earlier one', () => {
    const shelves = shelvesOf(LEVELS).map((shelf) => shelf[0].mechanic)

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
      shelf: shelf[0].mechanic,
      benches: shelf.map((rung) => `${rung.bench}: ${rung.spares} spare`)
    }))

    expect(room).toEqual(
      shelves.map((shelf) => ({
        shelf: shelf[0].mechanic,
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

  /*
   * How hard a bench is has nothing to do with how many pours it takes: the
   * shortest way through the last bench of the atelier is not the longest in
   * it. What a player feels is how much of the bench is a trap, and the spare
   * flask is what decides that — a bench with one can be poured back out of
   * almost anywhere, and a bench without one loses itself at every turn.
   */
  it('makes the spare flask the difference between room to think and a minefield', () => {
    const roomyButRuinous = LEVELS.filter(
      (level) =>
        level.board.length - flasksToFill(level.board) >= ROOM_TO_LEARN &&
        lostShare(level) >= FORGIVING
    )
    const tightButKind = LEVELS.filter(
      (level) =>
        level.board.length - flasksToFill(level.board) === MINIMUM_ROOM &&
        lostShare(level) < MERCILESS
    )

    expect({
      roomyButRuinous: roomyButRuinous.map(describeShare),
      tightButKind: tightButKind.map(describeShare)
    }).toEqual({ roomyButRuinous: [], tightButKind: [] })
  })

  /*
   * The climb itself, measured in possibilities rather than pours: once a shelf
   * has taken the spare flask away, each bench on it opens more ways to lose
   * than the one before. A new mechanic is where the count drops back, which is
   * the roomy bench it arrives on.
   */
  it('opens more ways to lose a bench with every bench on a shelf', () => {
    const tightening = shelvesOf(LEVELS).map((shelf) =>
      shelf
        .filter((rung) => rung.spares === MINIMUM_ROOM)
        .map((rung) => ({ bench: rung.bench, lost: rung.lost }))
    )

    expect(tightening).toEqual(
      tightening.map((shelf) =>
        [...shelf].sort((first, second) => first.lost - second.lost)
      )
    )
  })

  it('saves the bench with the most ways to be lost for last', () => {
    const last = LEVELS[LEVELS.length - 1]
    const asHard = LEVELS.slice(0, -1).filter(
      (level) => possibilitiesFor(level).lost >= possibilitiesFor(last).lost
    )

    expect({
      last: `${last.name}: ${possibilitiesFor(last).lost} lost`,
      benchesThatMatchIt: asHard.map(
        (level) => `${level.name}: ${possibilitiesFor(level).lost} lost`
      )
    }).toEqual({
      last: 'The Magnum Opus: 3001 lost',
      benchesThatMatchIt: []
    })
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
