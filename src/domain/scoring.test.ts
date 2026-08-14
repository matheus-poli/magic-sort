import { describe, expect, it } from 'vitest'
import {
  benchWorth,
  canPayForRebirth,
  canPayForRestart,
  perfectTotal,
  priceOfRebirth,
  priceOfRestart,
  scoreFor,
  totalScore
} from './scoring'
import type { RunProgress } from './scoring'

/** A four-elixir opening bench, nothing sorted yet, on the first shelf. */
const openingRun: RunProgress = {
  completedFlasks: 0,
  flasksToFill: 4,
  pours: 0,
  minimumPours: 10,
  worth: benchWorth(1),
  solved: false
}

/** Every flask sorted, in the fewest pours the bench allows. */
const flawlessRun = (worth: number): number =>
  scoreFor({
    completedFlasks: 4,
    flasksToFill: 4,
    pours: 10,
    minimumPours: 10,
    worth,
    solved: true
  })

describe('benchWorth', () => {
  it('pays the first bench a thousand points', () => {
    expect(benchWorth(1)).toBe(1000)
  })

  /*
   * The rule the whole economy hangs off: an apprentice who pushes on into the
   * harder benches must out-earn one who keeps sorting the easy ones.
   */
  it('pays every bench more than the one before it', () => {
    expect([1, 2, 3, 4].map(benchWorth)).toEqual([1000, 2000, 3000, 4000])
  })

  it('pays the last bench of the atelier fifty times the first', () => {
    expect(benchWorth(50)).toBe(50000)
  })
})

describe('scoreFor', () => {
  it('scores nothing before the first flask is finished', () => {
    expect(scoreFor(openingRun)).toBe(0)
  })

  it('pays a flawless run everything the bench is worth', () => {
    expect([1000, 2000, 50000].map(flawlessRun)).toEqual([1000, 2000, 50000])
  })

  it('gives half the points for sorting, shared out across the flasks to fill', () => {
    expect(scoreFor({ ...openingRun, completedFlasks: 2 })).toBe(250)
  })

  it('shares the sorting half out on a bench that does not divide evenly', () => {
    expect(
      scoreFor({ ...openingRun, flasksToFill: 6, completedFlasks: 5 })
    ).toBe(417)
  })

  it('withholds the other half until the bench is actually sorted', () => {
    expect(scoreFor({ ...openingRun, completedFlasks: 3, pours: 8 })).toBe(375)
  })

  it('shaves a fortieth of the bench off for every pour past the fewest', () => {
    expect(
      scoreFor({
        completedFlasks: 4,
        flasksToFill: 4,
        pours: 12,
        minimumPours: 10,
        worth: benchWorth(1),
        solved: true
      })
    ).toBe(950)
  })

  /* A late bench is worth more, so wasting a pour on one costs more. */
  it('makes a wasted pour cost more on a bench that pays more', () => {
    expect(
      scoreFor({
        completedFlasks: 4,
        flasksToFill: 4,
        pours: 12,
        minimumPours: 10,
        worth: benchWorth(10),
        solved: true
      })
    ).toBe(9500)
  })

  it('never lets a wasteful solve cost more than the solving half', () => {
    expect(
      scoreFor({
        completedFlasks: 4,
        flasksToFill: 4,
        pours: 100,
        minimumPours: 10,
        worth: benchWorth(1),
        solved: true
      })
    ).toBe(500)
  })
})

describe('priceOfRestart', () => {
  it('charges a tenth of the bench being thrown away', () => {
    expect(priceOfRestart(1)).toBe(100)
  })

  it('charges more for throwing away a bench that pays more', () => {
    expect([1, 2, 50].map(priceOfRestart)).toEqual([100, 200, 5000])
  })
})

describe('priceOfRebirth', () => {
  it('costs a flawless first bench to walk back from the first bench', () => {
    expect(priceOfRebirth(1)).toBe(1000)
  })

  /*
   * The whole of the anti-farming rule: an apprentice who walks back to sort
   * the easy benches again pays more for the walk than those benches can
   * possibly pay them, so the only way to earn is to press on.
   */
  it('costs more than every bench behind the apprentice could pay back', () => {
    const behind = [1, 2, 3, 4].map(benchWorth).reduce((a, b) => a + b, 0)

    expect(priceOfRebirth(5)).toBeGreaterThan(behind)
  })

  it('costs the whole atelier behind the apprentice, and the bench they stand on', () => {
    expect([1, 2, 3].map(priceOfRebirth)).toEqual([1000, 3000, 6000])
  })
})

describe('totalScore', () => {
  it('adds what this bench is worth to what is already banked', () => {
    expect(totalScore({ banked: 1750, bench: 250 })).toBe(2000)
  })
})

describe('perfectTotal', () => {
  it('is every bench of the atelier sorted flawlessly', () => {
    expect(perfectTotal({ levelCount: 3, rebirths: 0 })).toBe(6000)
  })

  /*
   * A reborn apprentice keeps their points and sorts the atelier again, so the
   * ceiling has to make room for the second run of it.
   */
  it('opens another atelier to earn every time the apprentice is reborn', () => {
    expect(perfectTotal({ levelCount: 3, rebirths: 2 })).toBe(18000)
  })
})

describe('canPayForRestart', () => {
  it('lets an apprentice who has banked the price lay the bench out again', () => {
    expect(canPayForRestart({ banked: 100, position: 1 })).toBe(true)
  })

  /*
   * Nothing in the atelier is bought on credit: an apprentice who cannot cover
   * the price of throwing a bench away is at the end of their run rather than
   * in debt over it.
   */
  it('refuses the apprentice who has not banked what a restart costs', () => {
    expect(canPayForRestart({ banked: 99, position: 1 })).toBe(false)
  })

  /*
   * Only banked points can pay for a restart. Whatever the bench in hand has
   * earned is poured back out with it, so it is not asked about here — and a
   * bench that could pay for its own second chance would let an apprentice
   * bank the same flasks over and over.
   */
  it('asks more of an apprentice throwing away a bench that pays more', () => {
    expect(canPayForRestart({ banked: 400, position: 5 })).toBe(false)
  })
})

describe('canPayForRebirth', () => {
  it('leaves a well-off apprentice free to walk back to the first bench', () => {
    expect(canPayForRebirth({ total: 40000, position: 5 })).toBe(true)
  })

  /*
   * The warning the rebirth dialog gives, and the end of the run if it is
   * pressed all the same: deep into a run the walk back costs more than the
   * apprentice has, and walking into that unwarned would make the game-over
   * card an ambush rather than a decision.
   */
  it('refuses the walk back to an apprentice who cannot cover the atelier behind them', () => {
    expect(canPayForRebirth({ total: 2000, position: 9 })).toBe(false)
  })

  /*
   * Weighed against the whole total, the bench in hand included: the walk banks
   * that bench on the way out, and a price weighed against any number other
   * than the one on the scoreboard would read as a bug.
   */
  it('lets the price be paid out to the very last point', () => {
    expect(canPayForRebirth({ total: priceOfRebirth(3), position: 3 })).toBe(
      true
    )
  })
})
