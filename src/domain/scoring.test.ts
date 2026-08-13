import { describe, expect, it } from 'vitest'
import { scoreFor } from './scoring'
import type { RunProgress } from './scoring'

const unsolvedRun: RunProgress = {
  completedFlasks: 0,
  pours: 0,
  minimumPours: 10,
  solved: false
}

describe('scoreFor', () => {
  it('scores nothing before the first flask is finished', () => {
    expect(scoreFor(unsolvedRun)).toBe(0)
  })

  it('awards 100 for every completed flask', () => {
    expect(scoreFor({ ...unsolvedRun, completedFlasks: 3 })).toBe(300)
  })

  it('adds a 500 bonus for solving the level in the fewest pours possible', () => {
    expect(
      scoreFor({
        completedFlasks: 4,
        pours: 10,
        minimumPours: 10,
        solved: true
      })
    ).toBe(900)
  })

  it('shaves 25 off the bonus for every pour past the fewest possible', () => {
    expect(
      scoreFor({
        completedFlasks: 4,
        pours: 12,
        minimumPours: 10,
        solved: true
      })
    ).toBe(850)
  })

  it('never lets a long solve drag the bonus below zero', () => {
    expect(
      scoreFor({
        completedFlasks: 4,
        pours: 100,
        minimumPours: 10,
        solved: true
      })
    ).toBe(400)
  })

  it('withholds the bonus until the level is actually solved', () => {
    expect(
      scoreFor({
        completedFlasks: 4,
        pours: 3,
        minimumPours: 10,
        solved: false
      })
    ).toBe(400)
  })
})
