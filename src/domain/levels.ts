import { emptyFlask, filledFlask } from './flask'
import type { Board } from './board'

export interface Level {
  /**
   * A stable handle for the bench, deliberately carrying no position: the order
   * of the atelier is the order of this list, and has already changed once.
   */
  readonly id: string
  readonly name: string
  /**
   * The fewest pours that can sort this bench, which the scoreboard promises
   * the player is the true minimum, and the solve bonus measures them against.
   * A breadth-first search over every reachable bench proves each one in the
   * test suite, so editing a board without re-running it will fail the build.
   */
  readonly minimumPours: number
  readonly board: Board
}

/**
 * The atelier, in the order an apprentice earns it: an opening shelf that
 * teaches the game, and then a shelf per mechanic on top of it.
 *
 * Difficulty comes from three dials: how many elixirs are in play, how many
 * flasks are left spare to pour into, and how many layers the glass holds.
 * Spares are the stronger of the first two by far — a bench with one leaves
 * almost no room to manoeuvre, refusing most pours outright.
 *
 * So a new mechanic buys exactly one roomy bench and no more. Learning what
 * taller glass does is enough to be getting on with; the bench after it is back
 * to a single spare. The atelier used to spend three benches at two spares
 * after the taller glass arrived, and players felt the game go slack for the
 * rest of the shelf — the room it had just spent five benches taking away was
 * handed back all at once. The opening shelf is the one exception, because it
 * is teaching the game itself rather than a mechanic on top of it.
 *
 * Pour count is not a dial, which players proved: they found the five-elixir
 * bench with one spare harder than the six-elixir bench with two, though it
 * needs three fewer pours to sort. It is why the last bench of the atelier is
 * not the longest one to sort, and does not need to be.
 *
 * Mixed glass is the mechanic the last two shelves are built on, and it changes
 * what the puzzle is about: an elixir can only ever be sealed in a glass its
 * layers exactly fill, so the three-layer vials are the only home the short
 * elixirs have. The spare is always full-size glass, because a lone three-layer
 * vial cannot hold a run poured out of a five and leaves almost every bench
 * unsortable — the small glass is a destination, never room to work in.
 */
export const LEVELS: readonly Level[] = [
  {
    id: 'apprentice',
    name: "The Apprentice's Bench",
    minimumPours: 14,
    board: [
      filledFlask(['crimson', 'azure', 'verdant', 'amber']),
      filledFlask(['azure', 'crimson', 'amber', 'verdant']),
      filledFlask(['verdant', 'amber', 'crimson', 'azure']),
      filledFlask(['amber', 'verdant', 'azure', 'crimson']),
      emptyFlask(4),
      emptyFlask(4)
    ]
  },
  {
    id: 'herbalist',
    name: "The Herbalist's Shelf",
    minimumPours: 16,
    board: [
      filledFlask(['amber', 'crimson', 'verdant', 'azure']),
      filledFlask(['violet', 'azure', 'violet', 'amber']),
      filledFlask(['crimson', 'violet', 'crimson', 'verdant']),
      filledFlask(['amber', 'verdant', 'crimson', 'verdant']),
      filledFlask(['amber', 'violet', 'azure', 'azure']),
      emptyFlask(4),
      emptyFlask(4)
    ]
  },
  {
    id: 'alchemist',
    name: "The Alchemist's Table",
    minimumPours: 21,
    board: [
      filledFlask(['crimson', 'verdant', 'violet', 'amber']),
      filledFlask(['pearl', 'amber', 'azure', 'violet']),
      filledFlask(['amber', 'crimson', 'verdant', 'pearl']),
      filledFlask(['azure', 'amber', 'crimson', 'azure']),
      filledFlask(['violet', 'verdant', 'azure', 'violet']),
      filledFlask(['pearl', 'verdant', 'crimson', 'pearl']),
      emptyFlask(4),
      emptyFlask(4)
    ]
  },
  {
    id: 'cupboard',
    name: 'The Crowded Cupboard',
    minimumPours: 18,
    board: [
      filledFlask(['violet', 'amber', 'verdant', 'crimson']),
      filledFlask(['verdant', 'crimson', 'amber', 'azure']),
      filledFlask(['amber', 'violet', 'azure', 'violet']),
      filledFlask(['verdant', 'azure', 'violet', 'crimson']),
      filledFlask(['verdant', 'crimson', 'azure', 'amber']),
      emptyFlask(4)
    ]
  },
  {
    id: 'archmage',
    name: "The Archmage's Vault",
    minimumPours: 22,
    board: [
      filledFlask(['azure', 'crimson', 'pearl', 'crimson']),
      filledFlask(['amber', 'violet', 'pearl', 'violet']),
      filledFlask(['amber', 'verdant', 'pearl', 'verdant']),
      filledFlask(['amber', 'azure', 'amber', 'violet']),
      filledFlask(['verdant', 'violet', 'pearl', 'crimson']),
      filledFlask(['crimson', 'azure', 'verdant', 'azure']),
      emptyFlask(4)
    ]
  },
  {
    id: 'glassblower',
    name: "The Glassblower's Gift",
    minimumPours: 18,
    board: [
      filledFlask(['amber', 'crimson', 'amber', 'azure', 'crimson']),
      filledFlask(['amber', 'verdant', 'amber', 'crimson', 'verdant']),
      filledFlask(['verdant', 'azure', 'verdant', 'azure', 'crimson']),
      filledFlask(['amber', 'crimson', 'azure', 'verdant', 'azure']),
      emptyFlask(5),
      emptyFlask(5)
    ]
  },
  {
    id: 'larder',
    name: 'The Narrow Larder',
    minimumPours: 21,
    board: [
      filledFlask(['verdant', 'crimson', 'verdant', 'crimson', 'amber']),
      filledFlask(['amber', 'crimson', 'violet', 'violet', 'azure']),
      filledFlask(['amber', 'crimson', 'verdant', 'crimson', 'verdant']),
      filledFlask(['violet', 'violet', 'amber', 'verdant', 'azure']),
      filledFlask(['azure', 'amber', 'azure', 'violet', 'azure']),
      emptyFlask(5)
    ]
  },
  {
    id: 'alembic',
    name: 'The Grand Alembic',
    minimumPours: 26,
    board: [
      filledFlask(['violet', 'azure', 'pearl', 'amber', 'verdant']),
      filledFlask(['verdant', 'pearl', 'azure', 'crimson', 'violet']),
      filledFlask(['pearl', 'amber', 'crimson', 'azure', 'pearl']),
      filledFlask(['violet', 'pearl', 'violet', 'verdant', 'crimson']),
      filledFlask(['crimson', 'amber', 'azure', 'amber', 'verdant']),
      filledFlask(['amber', 'crimson', 'violet', 'azure', 'verdant']),
      emptyFlask(5)
    ]
  },
  {
    id: 'vials',
    name: 'The Vial Rack',
    minimumPours: 15,
    board: [
      filledFlask(['verdant', 'azure', 'amber', 'verdant', 'crimson']),
      filledFlask(['amber', 'azure', 'verdant', 'crimson', 'amber']),
      filledFlask(['crimson', 'azure', 'azure']),
      filledFlask(['crimson', 'azure', 'crimson']),
      emptyFlask(5),
      emptyFlask(3)
    ]
  },
  {
    id: 'distiller',
    name: "The Distiller's Row",
    minimumPours: 18,
    board: [
      filledFlask(['violet', 'crimson', 'azure', 'crimson', 'amber']),
      filledFlask(['violet', 'amber', 'azure', 'crimson', 'verdant']),
      filledFlask(['azure', 'crimson', 'verdant', 'verdant', 'amber']),
      filledFlask(['verdant', 'verdant', 'crimson']),
      filledFlask(['azure', 'violet', 'azure']),
      emptyFlask(5)
    ]
  },
  {
    id: 'apothecary',
    name: "The Apothecary's Wall",
    minimumPours: 24,
    board: [
      filledFlask(['amber', 'verdant', 'crimson', 'amber', 'verdant']),
      filledFlask(['verdant', 'crimson', 'azure', 'pearl', 'verdant']),
      filledFlask(['azure', 'violet', 'amber', 'violet', 'violet']),
      filledFlask(['azure', 'crimson', 'pearl']),
      filledFlask(['pearl', 'verdant', 'crimson']),
      filledFlask(['azure', 'crimson', 'azure']),
      emptyFlask(5)
    ]
  },
  {
    id: 'mismatched',
    name: 'The Mismatched Set',
    minimumPours: 16,
    board: [
      filledFlask(['verdant', 'azure', 'amber', 'verdant', 'crimson']),
      filledFlask(['amber', 'azure', 'verdant', 'crimson']),
      filledFlask(['amber', 'crimson', 'azure', 'verdant']),
      filledFlask(['crimson', 'azure', 'crimson']),
      emptyFlask(5),
      emptyFlask(3)
    ]
  },
  {
    id: 'curator',
    name: "The Curator's Cabinet",
    minimumPours: 22,
    board: [
      filledFlask(['amber', 'azure', 'violet', 'crimson', 'amber']),
      filledFlask(['verdant', 'crimson', 'azure', 'verdant', 'violet']),
      filledFlask(['violet', 'amber', 'azure', 'verdant']),
      filledFlask(['azure', 'crimson', 'amber', 'crimson']),
      filledFlask(['verdant', 'crimson', 'azure']),
      emptyFlask(5)
    ]
  },
  {
    id: 'philosopher',
    name: "The Philosopher's Bench",
    minimumPours: 24,
    board: [
      filledFlask(['violet', 'verdant', 'violet', 'amber', 'verdant']),
      filledFlask(['pearl', 'amber', 'azure', 'amber', 'crimson']),
      filledFlask(['azure', 'crimson', 'amber', 'crimson']),
      filledFlask(['verdant', 'pearl', 'azure', 'verdant']),
      filledFlask(['crimson', 'azure', 'crimson']),
      filledFlask(['violet', 'pearl', 'azure']),
      emptyFlask(5)
    ]
  }
]
