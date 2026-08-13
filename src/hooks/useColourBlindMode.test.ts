import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useColourBlindMode } from './useColourBlindMode'

/*
 * Storage is the boundary here, and this environment has none: Node ships a
 * Web Storage of its own that is switched off unless it is given a file, and
 * it shadows the one jsdom would have provided. So the tests lend the hook a
 * storage that works, and one test lends it one that throws — which is what a
 * private window or a hardened browser does.
 */
function lendStorage(): void {
  const kept = new Map<string, string>()
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => kept.get(key) ?? null,
    setItem: (key: string, value: string) => kept.set(key, value)
  })
}

function refuseToRemember(): void {
  vi.stubGlobal('localStorage', {
    getItem: () => {
      throw new Error('Storage is disabled')
    },
    setItem: () => {
      throw new Error('Storage is disabled')
    }
  })
}

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
