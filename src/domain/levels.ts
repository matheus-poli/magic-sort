import type { Board } from './board'

export interface Level {
  /**
   * A stable handle for the bench, deliberately carrying no position: the order
   * of the atelier is the order of this list, and has already changed once.
   */
  readonly id: string
  readonly name: string
  /** How many layers every flask on this bench holds when it is full. */
  readonly capacity: number
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
 * needs three fewer pours to sort.
 */
export const LEVELS: readonly Level[] = [
  {
    id: 'apprentice',
    name: "The Apprentice's Bench",
    capacity: 4,
    minimumPours: 14,
    board: [
      ['crimson', 'azure', 'verdant', 'amber'],
      ['azure', 'crimson', 'amber', 'verdant'],
      ['verdant', 'amber', 'crimson', 'azure'],
      ['amber', 'verdant', 'azure', 'crimson'],
      [],
      []
    ]
  },
  {
    id: 'herbalist',
    name: "The Herbalist's Shelf",
    capacity: 4,
    minimumPours: 16,
    board: [
      ['amber', 'crimson', 'verdant', 'azure'],
      ['violet', 'azure', 'violet', 'amber'],
      ['crimson', 'violet', 'crimson', 'verdant'],
      ['amber', 'verdant', 'crimson', 'verdant'],
      ['amber', 'violet', 'azure', 'azure'],
      [],
      []
    ]
  },
  {
    id: 'alchemist',
    name: "The Alchemist's Table",
    capacity: 4,
    minimumPours: 21,
    board: [
      ['crimson', 'verdant', 'violet', 'amber'],
      ['pearl', 'amber', 'azure', 'violet'],
      ['amber', 'crimson', 'verdant', 'pearl'],
      ['azure', 'amber', 'crimson', 'azure'],
      ['violet', 'verdant', 'azure', 'violet'],
      ['pearl', 'verdant', 'crimson', 'pearl'],
      [],
      []
    ]
  },
  {
    id: 'cupboard',
    name: 'The Crowded Cupboard',
    capacity: 4,
    minimumPours: 18,
    board: [
      ['violet', 'amber', 'verdant', 'crimson'],
      ['verdant', 'crimson', 'amber', 'azure'],
      ['amber', 'violet', 'azure', 'violet'],
      ['verdant', 'azure', 'violet', 'crimson'],
      ['verdant', 'crimson', 'azure', 'amber'],
      []
    ]
  },
  {
    id: 'archmage',
    name: "The Archmage's Vault",
    capacity: 4,
    minimumPours: 22,
    board: [
      ['azure', 'crimson', 'pearl', 'crimson'],
      ['amber', 'violet', 'pearl', 'violet'],
      ['amber', 'verdant', 'pearl', 'verdant'],
      ['amber', 'azure', 'amber', 'violet'],
      ['verdant', 'violet', 'pearl', 'crimson'],
      ['crimson', 'azure', 'verdant', 'azure'],
      []
    ]
  },
  {
    id: 'glassblower',
    name: "The Glassblower's Gift",
    capacity: 5,
    minimumPours: 18,
    board: [
      ['amber', 'crimson', 'amber', 'azure', 'crimson'],
      ['amber', 'verdant', 'amber', 'crimson', 'verdant'],
      ['verdant', 'azure', 'verdant', 'azure', 'crimson'],
      ['amber', 'crimson', 'azure', 'verdant', 'azure'],
      [],
      []
    ]
  },
  {
    id: 'larder',
    name: 'The Narrow Larder',
    capacity: 5,
    minimumPours: 21,
    board: [
      ['verdant', 'crimson', 'verdant', 'crimson', 'amber'],
      ['amber', 'crimson', 'violet', 'violet', 'azure'],
      ['amber', 'crimson', 'verdant', 'crimson', 'verdant'],
      ['violet', 'violet', 'amber', 'verdant', 'azure'],
      ['azure', 'amber', 'azure', 'violet', 'azure'],
      []
    ]
  },
  {
    id: 'alembic',
    name: 'The Grand Alembic',
    capacity: 5,
    minimumPours: 26,
    board: [
      ['violet', 'azure', 'pearl', 'amber', 'verdant'],
      ['verdant', 'pearl', 'azure', 'crimson', 'violet'],
      ['pearl', 'amber', 'crimson', 'azure', 'pearl'],
      ['violet', 'pearl', 'violet', 'verdant', 'crimson'],
      ['crimson', 'amber', 'azure', 'amber', 'verdant'],
      ['amber', 'crimson', 'violet', 'azure', 'verdant'],
      []
    ]
  }
]
