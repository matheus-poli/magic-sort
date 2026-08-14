import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useCampaign } from './useCampaign'
import {
  readSavedRun,
  rememberBench,
  rememberCampaign
} from '../storage/savedRun'
import { benchOfGlass } from '../test/bench'
import { lendStorage, refuseToRemember } from '../test/storage'
import type { Level } from '../domain/levels'

const bench = (id: string, name: string): Level => ({
  id,
  name,
  minimumPours: 1,
  board: benchOfGlass(4, ['crimson', 'crimson', 'crimson'], ['crimson'])
})

const atelier: readonly Level[] = [
  bench('first', 'First Bench'),
  bench('second', 'Second Bench'),
  bench('third', 'Third Bench')
]

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('useCampaign', () => {
  it('opens on the first bench of the atelier', () => {
    const { result } = renderHook(() => useCampaign(atelier))

    expect(result.current).toMatchObject({
      level: atelier[0],
      position: 1,
      levelCount: 3,
      hasNext: true,
      bankedScore: 0,
      forfeited: 0
    })
  })

  it('moves on to the next bench once the apprentice has earned it', () => {
    const { result } = renderHook(() => useCampaign(atelier))

    act(() => result.current.advance(1000))

    expect(result.current).toMatchObject({
      level: atelier[1],
      position: 2,
      hasNext: true
    })
  })

  it('has no bench left to offer after the last one', () => {
    const { result } = renderHook(() => useCampaign(atelier))

    act(() => result.current.advance(1000))
    act(() => result.current.advance(1000))

    expect(result.current).toMatchObject({
      level: atelier[2],
      position: 3,
      hasNext: false
    })
  })

  it('stays on the last bench when there is nowhere further to go', () => {
    const { result } = renderHook(() => useCampaign(atelier))

    act(() => result.current.advance(1000))
    act(() => result.current.advance(1000))
    act(() => result.current.advance(1000))

    expect(result.current).toMatchObject({ level: atelier[2], position: 3 })
  })

  it('banks what the apprentice earned on the bench they are leaving', () => {
    const { result } = renderHook(() => useCampaign(atelier))

    act(() => result.current.advance(850))

    expect(result.current.bankedScore).toBe(850)
  })

  it('adds up what every bench earned along the way', () => {
    const { result } = renderHook(() => useCampaign(atelier))

    act(() => result.current.advance(850))
    act(() => result.current.advance(1000))

    expect(result.current).toMatchObject({ bankedScore: 1850, position: 3 })
  })

  it('banks nothing more once there is no bench left to leave', () => {
    const { result } = renderHook(() => useCampaign(atelier))

    act(() => result.current.advance(850))
    act(() => result.current.advance(1000))
    act(() => result.current.advance(1000))

    expect(result.current.bankedScore).toBe(1850)
  })

  it('keeps a tally of what restarts have cost, to own up to it', () => {
    const { result } = renderHook(() => useCampaign(atelier))

    act(() => result.current.advance(2000))
    act(() => result.current.chargeForRestart())
    act(() => result.current.chargeForRestart())

    expect(result.current).toMatchObject({ forfeited: 400, bankedScore: 1600 })
  })

  /* A later bench pays more, so throwing one away costs more. */
  it('charges for a restart against the bench being thrown away', () => {
    const { result } = renderHook(() => useCampaign(atelier))

    act(() => result.current.advance(1000))
    act(() => result.current.chargeForRestart())

    expect(result.current.bankedScore).toBe(800)
  })

  it('hands over what the bench in front of the apprentice pays', () => {
    const { result } = renderHook(() => useCampaign(atelier))

    act(() => result.current.advance(1000))

    expect(result.current.worth).toBe(2000)
  })

  it('scores the atelier out of a flawless run of every bench', () => {
    const { result } = renderHook(() => useCampaign(atelier))

    expect(result.current.perfectTotal).toBe(6000)
  })

  /*
   * Starting over is a rebirth rather than a wipe: the apprentice carries their
   * points back to the first bench and pays for the privilege. A wipe would
   * make the whole run worthless, which is why nobody ever pressed it.
   */
  it('carries what the apprentice earned back to the first bench', () => {
    const { result } = renderHook(() => useCampaign(atelier))

    act(() => result.current.advance(1000))
    act(() => result.current.advance(900))
    act(() => result.current.startOver(0))

    expect(result.current).toMatchObject({ level: atelier[0], position: 1 })
  })

  it('charges the atelier behind the apprentice for the rebirth', () => {
    const { result } = renderHook(() => useCampaign(atelier))

    act(() => result.current.advance(6000))
    act(() => result.current.advance(4000))
    act(() => result.current.startOver(0))

    // Three benches stood behind them, worth 6000 between them.
    expect(result.current.bankedScore).toBe(4000)
  })

  /*
   * The bench in hand is banked on the way out, unlike the one a restart throws
   * away: the apprentice is leaving it for good rather than laying it out again,
   * and the price is weighed against the total on the scoreboard.
   */
  it('banks what the bench in hand earned as the apprentice walks away from it', () => {
    const { result } = renderHook(() => useCampaign(atelier))

    act(() => result.current.advance(3000))
    act(() => result.current.startOver(2500))

    // The walk back from the second bench costs the 3000 behind them.
    expect(result.current.bankedScore).toBe(2500)
  })

  /*
   * The rule that keeps an apprentice moving forward: walking back to sort the
   * easy benches again costs more than they can possibly pay, so farming them
   * always ends worse than pressing on.
   */
  it('leaves the apprentice who walks back worse off than the one who did not', () => {
    const { result } = renderHook(() => useCampaign(atelier))

    act(() => result.current.advance(6000))
    act(() => result.current.advance(4000))
    const beforeTheWalkBack = result.current.bankedScore

    act(() => result.current.startOver(0))
    act(() => result.current.advance(1000))
    act(() => result.current.advance(2000))

    expect(result.current.bankedScore).toBeLessThan(beforeTheWalkBack)
  })

  it('counts a rebirth alongside what restarts have cost', () => {
    const { result } = renderHook(() => useCampaign(atelier))

    act(() => result.current.advance(4000))
    act(() => result.current.chargeForRestart())
    act(() => result.current.startOver(0))

    expect(result.current.forfeited).toBe(3200)
  })

  it('opens another atelier to earn for the reborn apprentice', () => {
    const { result } = renderHook(() => useCampaign(atelier))

    act(() => result.current.startOver(1000))

    expect(result.current.perfectTotal).toBe(12000)
  })

  /*
   * Nothing in the atelier is bought on credit, so the ledger has no red in it:
   * a price the apprentice cannot pay ends their run instead, which is asked of
   * the domain where the bench is in view too. This floor is here for the runs
   * saved back when debt was a thing — they read as having nothing left rather
   * than as a debt the game no longer knows how to end.
   */
  it('reads a run saved in the red as one with nothing left', () => {
    lendStorage()
    rememberCampaign({ reached: 1, earned: 500, forfeited: 3000, rebirths: 0 })

    const { result } = renderHook(() => useCampaign(atelier))

    expect(result.current.bankedScore).toBe(0)
  })

  it('opens a fresh run for the apprentice who begins again', () => {
    const { result } = renderHook(() => useCampaign(atelier))

    act(() => result.current.advance(1000))
    act(() => result.current.startOver(0))
    act(() => result.current.beginAgain())

    expect(result.current).toMatchObject({
      level: atelier[0],
      position: 1,
      bankedScore: 0,
      forfeited: 0,
      perfectTotal: 6000
    })
  })

  /*
   * Closing the tab is not a way out of a campaign. Everything the apprentice
   * has earned and everything they owe comes back with them, or the price of
   * a restart would be a page reload away from being no price at all.
   */
  it('picks the campaign back up where the apprentice left it', () => {
    lendStorage()
    const { result, unmount } = renderHook(() => useCampaign(atelier))
    act(() => result.current.advance(850))
    unmount()

    const { result: onReturn } = renderHook(() => useCampaign(atelier))

    expect(onReturn.current).toMatchObject({
      level: atelier[1],
      position: 2,
      bankedScore: 850
    })
  })

  it('brings what restarts have cost back with the apprentice', () => {
    lendStorage()
    const { result, unmount } = renderHook(() => useCampaign(atelier))
    act(() => result.current.advance(1000))
    act(() => result.current.chargeForRestart())
    unmount()

    const { result: onReturn } = renderHook(() => useCampaign(atelier))

    expect(onReturn.current).toMatchObject({
      forfeited: 200,
      bankedScore: 800
    })
  })

  it('holds the ceiling a rebirth raised, so the total still reads against it', () => {
    lendStorage()
    const { result, unmount } = renderHook(() => useCampaign(atelier))
    act(() => result.current.startOver(1000))
    unmount()

    const { result: onReturn } = renderHook(() => useCampaign(atelier))

    expect(onReturn.current.perfectTotal).toBe(12000)
  })

  /*
   * Beginning again is the one way out of a run, and it has to be a clean one:
   * the save is wiped rather than written over, so the half-sorted bench the
   * apprentice walked away from cannot come back with the next reload.
   */
  it('leaves nothing of the old run behind when a new one is begun', () => {
    lendStorage()
    const { result } = renderHook(() => useCampaign(atelier))
    act(() => result.current.advance(850))
    rememberBench({
      levelId: 'second',
      pours: 3,
      board: [{ capacity: 4, contents: ['crimson'] }]
    })

    act(() => result.current.beginAgain())

    expect(readSavedRun()).toEqual({
      campaign: { reached: 0, earned: 0, forfeited: 0, rebirths: 0 },
      bench: null
    })
  })

  it('opens on a bench the atelier still has when a save points past its end', () => {
    lendStorage()
    rememberCampaign({
      reached: 99,
      earned: 4200,
      forfeited: 0,
      rebirths: 0
    })

    const { result } = renderHook(() => useCampaign(atelier))

    expect(result.current).toMatchObject({ level: atelier[2], position: 3 })
  })

  it('opens the atelier fresh where the browser refuses to remember anything', () => {
    refuseToRemember()

    const { result } = renderHook(() => useCampaign(atelier))

    expect(result.current).toMatchObject({ position: 1, bankedScore: 0 })
  })
})
