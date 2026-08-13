import type { Board } from './board'

export interface Level {
  readonly id: string
  readonly name: string
  /** The shortest known solution, used as the yardstick for the solve bonus. */
  readonly par: number
  readonly board: Board
}

export const STARTER_LEVEL: Level = {
  id: 'apprentice-1',
  name: "The Apprentice's Bench",
  par: 14,
  board: [
    ['crimson', 'azure', 'verdant', 'amber'],
    ['azure', 'crimson', 'amber', 'verdant'],
    ['verdant', 'amber', 'crimson', 'azure'],
    ['amber', 'verdant', 'azure', 'crimson'],
    [],
    []
  ]
}
