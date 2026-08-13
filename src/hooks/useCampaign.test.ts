import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useCampaign } from './useCampaign'
import type { Level } from '../domain/levels'

const bench = (id: string, name: string): Level => ({
  id,
  name,
  minimumPours: 1,
  board: [['crimson', 'crimson', 'crimson'], ['crimson']]
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
      bankedScore: 0
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
})
