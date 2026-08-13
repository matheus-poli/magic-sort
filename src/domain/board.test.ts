import { describe, expect, it } from 'vitest'
import {
  canPourBetween,
  completedFlaskCount,
  flasksToFill,
  isSolved,
  pourBetween
} from './board'
import type { Board } from './board'

describe('isSolved', () => {
  it('is true once every flask is empty or filled with a single elixir', () => {
    const board: Board = [
      ['crimson', 'crimson', 'crimson', 'crimson'],
      ['azure', 'azure', 'azure', 'azure'],
      []
    ]
    expect(isSolved(board, 4)).toBe(true)
  })

  it('is false while any flask still holds mixed elixirs', () => {
    const board: Board = [
      ['crimson', 'crimson', 'crimson', 'azure'],
      ['azure', 'azure', 'azure', 'crimson'],
      []
    ]
    expect(isSolved(board, 4)).toBe(false)
  })

  it('is false when an elixir is pure but not yet gathered into one flask', () => {
    const board: Board = [['crimson', 'crimson'], ['crimson', 'crimson'], []]
    expect(isSolved(board, 4)).toBe(false)
  })

  it('is false while a taller flask is still a layer short of its brim', () => {
    const board: Board = [['crimson', 'crimson', 'crimson', 'crimson'], []]
    expect(isSolved(board, 5)).toBe(false)
  })
})

describe('completedFlaskCount', () => {
  it('counts the flasks filled to capacity with a single elixir', () => {
    const board: Board = [
      ['crimson', 'crimson', 'crimson', 'crimson'],
      ['azure', 'azure'],
      ['verdant', 'verdant', 'verdant', 'verdant'],
      []
    ]
    expect(completedFlaskCount(board, 4)).toBe(2)
  })

  it('counts only what a bench of taller flasks calls filled', () => {
    const board: Board = [
      ['crimson', 'crimson', 'crimson', 'crimson', 'crimson'],
      ['azure', 'azure', 'azure', 'azure']
    ]
    expect(completedFlaskCount(board, 5)).toBe(1)
  })
})

describe('flasksToFill', () => {
  it('counts one flask for every elixir the bench holds', () => {
    const board: Board = [
      ['crimson', 'azure', 'verdant'],
      ['azure', 'crimson'],
      ['verdant'],
      []
    ]
    expect(flasksToFill(board)).toBe(3)
  })

  it('ignores the empty flasks a sorted bench leaves behind', () => {
    const board: Board = [['crimson', 'crimson', 'crimson', 'crimson'], [], []]
    expect(flasksToFill(board)).toBe(1)
  })
})

describe('canPourBetween', () => {
  const board: Board = [['crimson'], ['crimson', 'azure'], []]

  it('allows a pour the flasks themselves accept', () => {
    expect(canPourBetween(board, 0, 2, 4)).toBe(true)
  })

  it('rejects a pour onto a mismatched top layer', () => {
    expect(canPourBetween(board, 0, 1, 4)).toBe(false)
  })

  it('rejects pouring a flask into itself', () => {
    expect(canPourBetween(board, 0, 0, 4)).toBe(false)
  })
})

describe('pourBetween', () => {
  it('moves the elixir and leaves every other flask untouched', () => {
    const board: Board = [['azure', 'crimson'], ['crimson'], ['verdant']]

    expect(pourBetween(board, 0, 1, 4)).toEqual([
      ['azure'],
      ['crimson', 'crimson'],
      ['verdant']
    ])
  })

  it('returns a new board instead of mutating the one it was given', () => {
    const board: Board = [['crimson'], []]

    pourBetween(board, 0, 1, 4)

    expect(board).toEqual([['crimson'], []])
  })

  it('pours into a flask that only a taller bench still has room in', () => {
    const board: Board = [
      ['crimson'],
      ['crimson', 'crimson', 'crimson', 'crimson']
    ]

    expect(pourBetween(board, 0, 1, 5)).toEqual([
      [],
      ['crimson', 'crimson', 'crimson', 'crimson', 'crimson']
    ])
  })

  it('refuses to pour a flask into itself', () => {
    expect(() => pourBetween([['crimson']], 0, 0, 4)).toThrow(
      'Cannot pour a flask into itself'
    )
  })

  it('refuses a pour onto a mismatched elixir', () => {
    expect(() => pourBetween([['crimson'], ['azure']], 0, 1, 4)).toThrow(
      'Cannot pour crimson onto azure'
    )
  })
})
