import { describe, expect, it } from 'vitest'
import {
  benchWorth,
  isRuined,
  perfectTotal,
  priceOfRebirth,
  priceOfRestart,
  rebirthWouldRuin,
  restartWouldRuin,
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

  /*
   * Debt used to read as zero, which was kind until an apprentice could be
   * ruined by it: a player who cannot see what they owe cannot see it coming.
   */
  it('reads out the debt when restarts have cost more than the benches paid', () => {
    expect(totalScore({ banked: -300, bench: 100 })).toBe(-200)
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

describe('rebirthWouldRuin', () => {
  it('leaves a well-off apprentice free to walk back to the first bench', () => {
    expect(rebirthWouldRuin({ banked: 40000, position: 5 })).toBe(false)
  })

  /*
   * The warning the rebirth dialog gives: deep into a run the walk back costs
   * more than most apprentices have, and pressing it unwarned would make the
   * game-over card an ambush rather than a decision.
   */
  it('warns the apprentice whose walk back would bury them', () => {
    expect(rebirthWouldRuin({ banked: 2000, position: 9 })).toBe(true)
  })
})

describe('restartWouldRuin', () => {
  /*
   * A restart is the way out of a bench that cannot be sorted from where it
   * stands, and an apprentice with nothing banked has to be able to take it:
   * the bench they are handed back pays ten times what throwing it away costs.
   */
  it('leaves an apprentice with nothing to their name free to start again', () => {
    expect(restartWouldRuin({ banked: 0, position: 1 })).toBe(false)
  })

  it('is not ruin while the bench handed back could still clear the debt', () => {
    expect(restartWouldRuin({ banked: -4500, position: 5 })).toBe(false)
  })

  it('is ruin once the price and the debt outgrow the bench handed back', () => {
    expect(restartWouldRuin({ banked: -4800, position: 5 })).toBe(true)
  })
})

describe('isRuined', () => {
  it('leaves an apprentice who owes nothing to get on with the bench', () => {
    expect(isRuined({ banked: 2400, benchInHand: benchWorth(3) })).toBe(false)
  })

  it('is not ruin while the bench in hand could still cover the debt', () => {
    expect(isRuined({ banked: -900, benchInHand: benchWorth(1) })).toBe(false)
  })

  it('is ruin once not even a flawless bench could clear what is owed', () => {
    expect(isRuined({ banked: -1200, benchInHand: benchWorth(1) })).toBe(true)
  })
})
