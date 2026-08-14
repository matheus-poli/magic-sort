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

  it('takes points off the total when a bench is restarted', () => {
    const { result } = renderHook(() => useCampaign(atelier))

    act(() => result.current.chargeForRestart())

    expect(result.current.bankedScore).toBe(-100)
  })

  it('keeps a tally of what restarts have cost, to own up to it', () => {
    const { result } = renderHook(() => useCampaign(atelier))

    act(() => result.current.chargeForRestart())
    act(() => result.current.chargeForRestart())

    expect(result.current).toMatchObject({ forfeited: 200, bankedScore: -200 })
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
    act(() => result.current.startOver())

    expect(result.current).toMatchObject({ level: atelier[0], position: 1 })
  })

  it('charges the atelier behind the apprentice for the rebirth', () => {
    const { result } = renderHook(() => useCampaign(atelier))

    act(() => result.current.advance(1000))
    act(() => result.current.advance(2000))
    act(() => result.current.startOver())

    // Three benches stood behind them, worth 6000 between them.
    expect(result.current.bankedScore).toBe(-3000)
  })

  /*
   * The rule that keeps an apprentice moving forward: walking back to sort the
   * easy benches again costs more than they can possibly pay, so farming them
   * always ends worse than pressing on.
   */
  it('leaves the apprentice who walks back worse off than the one who did not', () => {
    const { result } = renderHook(() => useCampaign(atelier))

    act(() => result.current.advance(1000))
    act(() => result.current.advance(2000))
    const beforeTheWalkBack = result.current.bankedScore

    act(() => result.current.startOver())
    act(() => result.current.advance(1000))
    act(() => result.current.advance(2000))

    expect(result.current.bankedScore).toBeLessThan(beforeTheWalkBack)
  })

  it('counts a rebirth alongside what restarts have cost', () => {
    const { result } = renderHook(() => useCampaign(atelier))

    act(() => result.current.chargeForRestart())
    act(() => result.current.startOver())

    expect(result.current.forfeited).toBe(1100)
  })

  it('opens another atelier to earn for the reborn apprentice', () => {
    const { result } = renderHook(() => useCampaign(atelier))

    act(() => result.current.startOver())

    expect(result.current.perfectTotal).toBe(12000)
  })

  it('lets a rebirth cost more than the apprentice has to their name', () => {
    const { result } = renderHook(() => useCampaign(atelier))

    act(() => result.current.advance(200))
    act(() => result.current.startOver())

    expect(result.current.bankedScore).toBe(-2800)
  })

  /*
   * The campaign keeps the tally and nothing more. Whether a debt has ended
   * the run is a question about the bench as well as the ledger, so it is
   * asked of the domain where both are in view: see endOfRun.
   */
  it('lets the ledger fall into the red rather than holding it at nothing', () => {
    const { result } = renderHook(() => useCampaign(atelier))

    act(() => result.current.chargeForRestart())

    expect(result.current.bankedScore).toBe(-100)
  })

  it('opens a fresh run for the apprentice who begins again', () => {
    const { result } = renderHook(() => useCampaign(atelier))

    act(() => result.current.advance(200))
    act(() => result.current.startOver())
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
    act(() => result.current.chargeForRestart())
    unmount()

    const { result: onReturn } = renderHook(() => useCampaign(atelier))

    expect(onReturn.current).toMatchObject({
      forfeited: 100,
      bankedScore: -100
    })
  })

  it('holds the ceiling a rebirth raised, so the total still reads against it', () => {
    lendStorage()
    const { result, unmount } = renderHook(() => useCampaign(atelier))
    act(() => result.current.startOver())
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
