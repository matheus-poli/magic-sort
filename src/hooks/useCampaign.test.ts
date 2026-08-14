import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useCampaign } from './useCampaign'
import { benchOfGlass } from '../test/bench'
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

  it('charges for restarts out of what the benches earned', () => {
    const { result } = renderHook(() => useCampaign(atelier))

    act(() => result.current.advance(1000))
    act(() => result.current.chargeForRestart())

    expect(result.current.bankedScore).toBe(900)
  })

  it('scores the atelier out of a flawless run of every bench', () => {
    const { result } = renderHook(() => useCampaign(atelier))

    expect(result.current.perfectTotal).toBe(3000)
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

  it('charges a flawless bench for the rebirth', () => {
    const { result } = renderHook(() => useCampaign(atelier))

    act(() => result.current.advance(1000))
    act(() => result.current.advance(900))
    act(() => result.current.startOver())

    expect(result.current.bankedScore).toBe(900)
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

    expect(result.current.perfectTotal).toBe(6000)
  })

  it('lets a rebirth cost more than the apprentice has to their name', () => {
    const { result } = renderHook(() => useCampaign(atelier))

    act(() => result.current.advance(200))
    act(() => result.current.startOver())

    expect(result.current.bankedScore).toBe(-800)
  })
})
