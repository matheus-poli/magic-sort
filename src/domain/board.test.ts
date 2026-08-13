import { describe, expect, it } from 'vitest'
import {
  canPourBetween,
  completedFlaskCount,
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
    expect(isSolved(board)).toBe(true)
  })

  it('is false while any flask still holds mixed elixirs', () => {
    const board: Board = [
      ['crimson', 'crimson', 'crimson', 'azure'],
      ['azure', 'azure', 'azure', 'crimson'],
      []
    ]
    expect(isSolved(board)).toBe(false)
  })

  it('is false when an elixir is pure but not yet gathered into one flask', () => {
    const board: Board = [['crimson', 'crimson'], ['crimson', 'crimson'], []]
    expect(isSolved(board)).toBe(false)
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
    expect(completedFlaskCount(board)).toBe(2)
  })
})

describe('canPourBetween', () => {
  const board: Board = [['crimson'], ['crimson', 'azure'], []]

  it('allows a pour the flasks themselves accept', () => {
    expect(canPourBetween(board, 0, 2)).toBe(true)
  })

  it('rejects a pour onto a mismatched top layer', () => {
    expect(canPourBetween(board, 0, 1)).toBe(false)
  })

  it('rejects pouring a flask into itself', () => {
    expect(canPourBetween(board, 0, 0)).toBe(false)
  })
})

describe('pourBetween', () => {
  it('moves the elixir and leaves every other flask untouched', () => {
    const board: Board = [['azure', 'crimson'], ['crimson'], ['verdant']]

    expect(pourBetween(board, 0, 1)).toEqual([
      ['azure'],
      ['crimson', 'crimson'],
      ['verdant']
    ])
  })

  it('returns a new board instead of mutating the one it was given', () => {
    const board: Board = [['crimson'], []]

    pourBetween(board, 0, 1)

    expect(board).toEqual([['crimson'], []])
  })

  it('refuses to pour a flask into itself', () => {
    expect(() => pourBetween([['crimson']], 0, 0)).toThrow(
      'Cannot pour a flask into itself'
    )
  })

  it('refuses a pour onto a mismatched elixir', () => {
    expect(() => pourBetween([['crimson'], ['azure']], 0, 1)).toThrow(
      'Cannot pour crimson onto azure'
    )
  })
})
