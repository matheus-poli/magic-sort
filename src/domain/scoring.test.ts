import { describe, expect, it } from 'vitest'
import { PERFECT_SCORE, perfectTotal, scoreFor, totalScore } from './scoring'
import type { RunProgress } from './scoring'

/** A four-elixir bench, nothing sorted yet. */
const openingRun: RunProgress = {
  completedFlasks: 0,
  flasksToFill: 4,
  pours: 0,
  minimumPours: 10,
  solved: false
}

/** Every flask sorted, in the fewest pours the bench allows. */
const flawlessRun = (flasksToFill: number): number =>
  scoreFor({
    completedFlasks: flasksToFill,
    flasksToFill,
    pours: 10,
    minimumPours: 10,
    solved: true
  })

describe('scoreFor', () => {
  it('scores nothing before the first flask is finished', () => {
    expect(scoreFor(openingRun)).toBe(0)
  })

  it('is worth 1000 for a flawless run, however many elixirs the bench holds', () => {
    expect([3, 4, 5, 6].map(flawlessRun)).toEqual([1000, 1000, 1000, 1000])
  })

  it('publishes that ceiling, so the scoreboard can show what it is out of', () => {
    expect(PERFECT_SCORE).toBe(1000)
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

  it('shaves 25 off the solving half for every pour past the fewest possible', () => {
    expect(
      scoreFor({
        completedFlasks: 4,
        flasksToFill: 4,
        pours: 12,
        minimumPours: 10,
        solved: true
      })
    ).toBe(950)
  })

  it('never lets a wasteful solve cost more than the solving half', () => {
    expect(
      scoreFor({
        completedFlasks: 4,
        flasksToFill: 4,
        pours: 100,
        minimumPours: 10,
        solved: true
      })
    ).toBe(500)
  })
})

describe('totalScore', () => {
  it('adds what this bench is worth to what is already banked', () => {
    expect(totalScore({ banked: 1750, bench: 250 })).toBe(2000)
  })

  it('never reads below zero, however much restarting has cost', () => {
    expect(totalScore({ banked: -300, bench: 100 })).toBe(0)
  })
})

describe('perfectTotal', () => {
  it('is every bench of the atelier sorted flawlessly', () => {
    expect(perfectTotal({ levelCount: 14, rebirths: 0 })).toBe(14000)
  })

  /*
   * A reborn apprentice keeps their points and sorts the atelier again, so the
   * ceiling has to make room for the second run of it. Leaving it where it was
   * would put a total of 15000 out of 14000 on the scoreboard.
   */
  it('opens another atelier to earn every time the apprentice is reborn', () => {
    expect(perfectTotal({ levelCount: 14, rebirths: 2 })).toBe(42000)
  })
})
