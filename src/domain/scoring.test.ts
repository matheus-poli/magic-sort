import { describe, expect, it } from 'vitest'
import { scoreFor } from './scoring'
import type { RunProgress } from './scoring'

const unsolvedRun: RunProgress = {
  completedFlasks: 0,
  moves: 0,
  par: 10,
  solved: false
}

describe('scoreFor', () => {
  it('scores nothing before the first flask is finished', () => {
    expect(scoreFor(unsolvedRun)).toBe(0)
  })

  it('awards 100 for every completed flask', () => {
    expect(scoreFor({ ...unsolvedRun, completedFlasks: 3 })).toBe(300)
  })

  it('adds a 500 bonus for solving the level within par', () => {
    expect(
      scoreFor({ completedFlasks: 4, moves: 10, par: 10, solved: true })
    ).toBe(900)
  })

  it('shaves 25 off the bonus for each move spent over par', () => {
    expect(
      scoreFor({ completedFlasks: 4, moves: 12, par: 10, solved: true })
    ).toBe(850)
  })

  it('never lets a long solve drag the bonus below zero', () => {
    expect(
      scoreFor({ completedFlasks: 4, moves: 100, par: 10, solved: true })
    ).toBe(400)
  })

  it('withholds the bonus until the level is actually solved', () => {
    expect(
      scoreFor({ completedFlasks: 4, moves: 3, par: 10, solved: false })
    ).toBe(400)
  })
})
