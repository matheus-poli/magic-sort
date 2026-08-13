import type { Board } from './board'

export interface Level {
  readonly id: string
  readonly name: string
  /**
   * The fewest pours that can sort this bench, which the scoreboard promises
   * the player is the true minimum, and the solve bonus measures them against.
   */
  readonly minimumPours: number
  readonly board: Board
}

export const STARTER_LEVEL: Level = {
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
}
