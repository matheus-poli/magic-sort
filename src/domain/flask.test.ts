import { describe, expect, it } from 'vitest'
import {
  FLASK_CAPACITY,
  canPour,
  isComplete,
  isEmpty,
  pour,
  topElixir
} from './flask'
import type { Flask } from './flask'

const empty: Flask = []

describe('topElixir', () => {
  it('reads the last layer poured in, which sits on top', () => {
    expect(topElixir(['crimson', 'azure'])).toBe('azure')
  })

  it('reports no elixir for an empty flask', () => {
    expect(topElixir(empty)).toBeNull()
  })
})

describe('isEmpty', () => {
  it('is true for a flask holding no layers', () => {
    expect(isEmpty(empty)).toBe(true)
  })

  it('is false while any layer remains', () => {
    expect(isEmpty(['crimson'])).toBe(false)
  })
})

describe('isComplete', () => {
  it('is true for a flask filled to capacity with a single elixir', () => {
    expect(isComplete(['azure', 'azure', 'azure', 'azure'])).toBe(true)
  })

  it('is false for a pure but partially filled flask', () => {
    expect(isComplete(['azure', 'azure'])).toBe(false)
  })

  it('is false for a full flask holding mixed elixirs', () => {
    expect(isComplete(['azure', 'azure', 'azure', 'crimson'])).toBe(false)
  })

  it('is false for an empty flask, which is not an achievement', () => {
    expect(isComplete(empty)).toBe(false)
  })
})

describe('canPour', () => {
  it('allows pouring onto a matching top layer', () => {
    expect(canPour(['crimson'], ['azure', 'crimson'])).toBe(true)
  })

  it('allows pouring into an empty flask', () => {
    expect(canPour(['crimson'], empty)).toBe(true)
  })

  it('rejects pouring onto a different elixir', () => {
    expect(canPour(['crimson'], ['azure'])).toBe(false)
  })

  it('rejects pouring out of an empty flask', () => {
    expect(canPour(empty, ['crimson'])).toBe(false)
  })

  it('rejects pouring into a flask filled to capacity', () => {
    const full: Flask = ['crimson', 'crimson', 'crimson', 'crimson']
    expect(canPour(['crimson'], full)).toBe(false)
  })

  it('rejects pouring a flask into itself', () => {
    const flask: Flask = ['crimson']
    expect(canPour(flask, flask)).toBe(false)
  })
})

describe('pour', () => {
  it('moves the whole top run of matching layers in one go', () => {
    expect(pour(['azure', 'crimson', 'crimson'], ['crimson'])).toEqual({
      source: ['azure'],
      target: ['crimson', 'crimson', 'crimson']
    })
  })

  it('moves only what fits when the target runs out of room', () => {
    expect(
      pour(['crimson', 'crimson', 'crimson'], ['azure', 'azure', 'crimson'])
    ).toEqual({
      source: ['crimson', 'crimson'],
      target: ['azure', 'azure', 'crimson', 'crimson']
    })
  })

  it('leaves the original flasks untouched', () => {
    const source: Flask = ['crimson']
    const target: Flask = []

    pour(source, target)

    expect({ source, target }).toEqual({ source: ['crimson'], target: [] })
  })

  it('refuses an illegal pour instead of silently doing nothing', () => {
    expect(() => pour(['crimson'], ['azure'])).toThrow(
      'Cannot pour crimson onto azure'
    )
  })
})

describe('FLASK_CAPACITY', () => {
  it('holds four layers, matching the level design', () => {
    expect(FLASK_CAPACITY).toBe(4)
  })
})
