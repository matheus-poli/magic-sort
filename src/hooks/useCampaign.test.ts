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
      total: 3,
      hasNext: true
    })
  })

  it('moves on to the next bench once the apprentice has earned it', () => {
    const { result } = renderHook(() => useCampaign(atelier))

    act(() => result.current.advance())

    expect(result.current).toMatchObject({
      level: atelier[1],
      position: 2,
      hasNext: true
    })
  })

  it('has no bench left to offer after the last one', () => {
    const { result } = renderHook(() => useCampaign(atelier))

    act(() => result.current.advance())
    act(() => result.current.advance())

    expect(result.current).toMatchObject({
      level: atelier[2],
      position: 3,
      hasNext: false
    })
  })

  it('stays on the last bench when there is nowhere further to go', () => {
    const { result } = renderHook(() => useCampaign(atelier))

    act(() => result.current.advance())
    act(() => result.current.advance())
    act(() => result.current.advance())

    expect(result.current).toMatchObject({ level: atelier[2], position: 3 })
  })
})
