import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useColourBlindMode } from './useColourBlindMode'
import { lendStorage, refuseToRemember } from '../test/storage'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('useColourBlindMode', () => {
  it('leaves the atelier in its own colours until it is asked not to', () => {
    lendStorage()

    const { result } = renderHook(() => useColourBlindMode())

    expect(result.current.enabled).toBe(false)
  })

  it('turns on when the player asks for it', () => {
    lendStorage()
    const { result } = renderHook(() => useColourBlindMode())

    act(() => result.current.toggle())

    expect(result.current.enabled).toBe(true)
  })

  it('is still on when the player comes back to the game', () => {
    lendStorage()
    const { result, unmount } = renderHook(() => useColourBlindMode())
    act(() => result.current.toggle())
    unmount()

    const { result: onReturn } = renderHook(() => useColourBlindMode())

    expect(onReturn.current.enabled).toBe(true)
  })

  it('still turns on where the browser refuses to remember anything', () => {
    refuseToRemember()
    const { result } = renderHook(() => useColourBlindMode())

    act(() => result.current.toggle())

    expect(result.current.enabled).toBe(true)
  })
})
