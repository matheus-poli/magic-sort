import type { Board } from './board'

export interface Level {
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
 * The atelier, in the order an apprentice earns it. Difficulty comes from two
 * dials: how many elixirs are in play, and how many flasks are left spare to
 * pour into. A bench with one spare flask refuses far more pours than one with
 * two, which is why the tight benches come last.
 */
export const LEVELS: readonly Level[] = [
  {
    id: 'apprentice-1',
    name: "The Apprentice's Bench",
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
    id: 'herbalist-2',
    name: "The Herbalist's Shelf",
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
    id: 'cupboard-3',
    name: 'The Crowded Cupboard',
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
    id: 'alchemist-4',
    name: "The Alchemist's Table",
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
    id: 'archmage-5',
    name: "The Archmage's Vault",
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
  }
]
