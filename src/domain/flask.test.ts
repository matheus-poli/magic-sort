import { describe, expect, it } from 'vitest'
import {
  canPour,
  emptyFlask,
  filledFlask,
  isComplete,
  isEmpty,
  pour,
  topElixir
} from './flask'
import type { Elixir, Flask } from './flask'

/** A glass of a given size, holding whatever has been poured into it so far. */
function glass(capacity: number, ...contents: Elixir[]): Flask {
  return { capacity, contents }
}

describe('filledFlask', () => {
  it('sizes the glass to the layers it is laid out holding', () => {
    expect(filledFlask(['crimson', 'azure', 'verdant'])).toEqual(
      glass(3, 'crimson', 'azure', 'verdant')
    )
  })
})

describe('emptyFlask', () => {
  it('is a spare glass of the size asked for', () => {
    expect(emptyFlask(5)).toEqual(glass(5))
  })
})

describe('topElixir', () => {
  it('reads the last layer poured in, which sits on top', () => {
    expect(topElixir(glass(4, 'crimson', 'azure'))).toBe('azure')
  })

  it('reports no elixir for an empty flask', () => {
    expect(topElixir(emptyFlask(4))).toBeNull()
  })
})

describe('isEmpty', () => {
  it('is true for a flask holding no layers', () => {
    expect(isEmpty(emptyFlask(4))).toBe(true)
  })

  it('is false while any layer remains', () => {
    expect(isEmpty(glass(4, 'crimson'))).toBe(false)
  })
})

describe('isComplete', () => {
  it('is true for a flask filled to its brim with a single elixir', () => {
    expect(isComplete(glass(4, 'azure', 'azure', 'azure', 'azure'))).toBe(true)
  })

  it('is false for a pure but partially filled flask', () => {
    expect(isComplete(glass(4, 'azure', 'azure'))).toBe(false)
  })

  it('is false for a full flask holding mixed elixirs', () => {
    expect(isComplete(glass(4, 'azure', 'azure', 'azure', 'crimson'))).toBe(
      false
    )
  })

  it('is false for an empty flask, which is not an achievement', () => {
    expect(isComplete(emptyFlask(4))).toBe(false)
  })

  it('measures each flask against its own glass, not its neighbours', () => {
    const four: Elixir[] = ['azure', 'azure', 'azure', 'azure']

    expect({
      inTallGlass: isComplete(glass(5, ...four)),
      inShortGlass: isComplete(glass(4, ...four))
    }).toEqual({ inTallGlass: false, inShortGlass: true })
  })
})

describe('canPour', () => {
  it('allows pouring onto a matching top layer', () => {
    expect(canPour(glass(4, 'crimson'), glass(4, 'azure', 'crimson'))).toBe(
      true
    )
  })

  it('allows pouring into an empty flask', () => {
    expect(canPour(glass(4, 'crimson'), emptyFlask(4))).toBe(true)
  })

  it('rejects pouring onto a different elixir', () => {
    expect(canPour(glass(4, 'crimson'), glass(4, 'azure'))).toBe(false)
  })

  it('rejects pouring out of an empty flask', () => {
    expect(canPour(emptyFlask(4), glass(4, 'crimson'))).toBe(false)
  })

  it('rejects pouring into a flask filled to its own brim', () => {
    const full = glass(4, 'crimson', 'crimson', 'crimson', 'crimson')

    expect(canPour(glass(4, 'crimson'), full)).toBe(false)
  })

  it('rejects pouring a flask into itself', () => {
    const flask = glass(4, 'crimson')

    expect(canPour(flask, flask)).toBe(false)
  })

  it('asks the target how much room it has, not the flask pouring', () => {
    const four: Elixir[] = ['crimson', 'crimson', 'crimson', 'crimson']

    expect({
      intoTallGlass: canPour(glass(5, 'crimson'), glass(5, ...four)),
      intoShortGlass: canPour(glass(5, 'crimson'), glass(4, ...four))
    }).toEqual({ intoTallGlass: true, intoShortGlass: false })
  })
})

describe('pour', () => {
  it('moves the whole top run of matching layers in one go', () => {
    expect(
      pour(glass(4, 'azure', 'crimson', 'crimson'), glass(4, 'crimson'))
    ).toEqual({
      source: glass(4, 'azure'),
      target: glass(4, 'crimson', 'crimson', 'crimson')
    })
  })

  it('moves only what fits when the target runs out of room', () => {
    expect(
      pour(
        glass(4, 'crimson', 'crimson', 'crimson'),
        glass(4, 'azure', 'azure', 'crimson')
      )
    ).toEqual({
      source: glass(4, 'crimson', 'crimson'),
      target: glass(4, 'azure', 'azure', 'crimson', 'crimson')
    })
  })

  it('leaves the rest behind when the target is the smaller glass', () => {
    expect(
      pour(glass(5, 'crimson', 'crimson', 'crimson'), glass(3, 'crimson'))
    ).toEqual({
      source: glass(5, 'crimson'),
      target: glass(3, 'crimson', 'crimson', 'crimson')
    })
  })

  it('leaves the original flasks untouched', () => {
    const source = glass(4, 'crimson')
    const target = emptyFlask(4)

    pour(source, target)

    expect({ source, target }).toEqual({
      source: glass(4, 'crimson'),
      target: emptyFlask(4)
    })
  })

  it('refuses an illegal pour instead of silently doing nothing', () => {
    expect(() => pour(glass(4, 'crimson'), glass(4, 'azure'))).toThrow(
      'Cannot pour crimson onto azure'
    )
  })

  it('fills a taller flask to the brim its own glass sets', () => {
    const nearlyFull = glass(5, 'crimson', 'crimson', 'crimson', 'crimson')

    expect(pour(glass(4, 'azure', 'crimson'), nearlyFull)).toEqual({
      source: glass(4, 'azure'),
      target: glass(5, 'crimson', 'crimson', 'crimson', 'crimson', 'crimson')
    })
  })
})
