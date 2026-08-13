import { describe, expect, it } from 'vitest'
import { canPour, isComplete, isEmpty, pour, topElixir } from './flask'
import type { Flask } from './flask'

const empty: Flask = []

/*
 * The capacity every call passes is the bench's, not the flask's: four layers
 * on most of the atelier's benches, five on the taller ones.
 */

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
    expect(isComplete(['azure', 'azure', 'azure', 'azure'], 4)).toBe(true)
  })

  it('is false for a pure but partially filled flask', () => {
    expect(isComplete(['azure', 'azure'], 4)).toBe(false)
  })

  it('is false for a full flask holding mixed elixirs', () => {
    expect(isComplete(['azure', 'azure', 'azure', 'crimson'], 4)).toBe(false)
  })

  it('is false for an empty flask, which is not an achievement', () => {
    expect(isComplete(empty, 4)).toBe(false)
  })

  it('holds out for the taller brim on a bench of taller flasks', () => {
    const four: Flask = ['azure', 'azure', 'azure', 'azure']

    expect({
      atFour: isComplete(four, 5),
      atFive: isComplete([...four, 'azure'], 5)
    }).toEqual({ atFour: false, atFive: true })
  })
})

describe('canPour', () => {
  it('allows pouring onto a matching top layer', () => {
    expect(canPour(['crimson'], ['azure', 'crimson'], 4)).toBe(true)
  })

  it('allows pouring into an empty flask', () => {
    expect(canPour(['crimson'], empty, 4)).toBe(true)
  })

  it('rejects pouring onto a different elixir', () => {
    expect(canPour(['crimson'], ['azure'], 4)).toBe(false)
  })

  it('rejects pouring out of an empty flask', () => {
    expect(canPour(empty, ['crimson'], 4)).toBe(false)
  })

  it('rejects pouring into a flask filled to capacity', () => {
    const full: Flask = ['crimson', 'crimson', 'crimson', 'crimson']
    expect(canPour(['crimson'], full, 4)).toBe(false)
  })

  it('rejects pouring a flask into itself', () => {
    const flask: Flask = ['crimson']
    expect(canPour(flask, flask, 4)).toBe(false)
  })

  it('finds room in a four-layer flask on a bench that pours five', () => {
    const four: Flask = ['crimson', 'crimson', 'crimson', 'crimson']

    expect(canPour(['crimson'], four, 5)).toBe(true)
  })
})

describe('pour', () => {
  it('moves the whole top run of matching layers in one go', () => {
    expect(pour(['azure', 'crimson', 'crimson'], ['crimson'], 4)).toEqual({
      source: ['azure'],
      target: ['crimson', 'crimson', 'crimson']
    })
  })

  it('moves only what fits when the target runs out of room', () => {
    expect(
      pour(['crimson', 'crimson', 'crimson'], ['azure', 'azure', 'crimson'], 4)
    ).toEqual({
      source: ['crimson', 'crimson'],
      target: ['azure', 'azure', 'crimson', 'crimson']
    })
  })

  it('leaves the original flasks untouched', () => {
    const source: Flask = ['crimson']
    const target: Flask = []

    pour(source, target, 4)

    expect({ source, target }).toEqual({ source: ['crimson'], target: [] })
  })

  it('refuses an illegal pour instead of silently doing nothing', () => {
    expect(() => pour(['crimson'], ['azure'], 4)).toThrow(
      'Cannot pour crimson onto azure'
    )
  })

  it('fills a taller flask to the brim its own bench sets', () => {
    const nearlyFull: Flask = ['crimson', 'crimson', 'crimson', 'crimson']

    expect(pour(['azure', 'crimson'], nearlyFull, 5)).toEqual({
      source: ['azure'],
      target: ['crimson', 'crimson', 'crimson', 'crimson', 'crimson']
    })
  })
})
