import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { HOLD_MS, useHold } from './useHold'
import { playSound, stopSound } from '../audio/sounds'

// Audio is a real boundary: there is no speaker in a test run.
vi.mock('../audio/sounds', () => ({
  playSound: vi.fn(),
  stopSound: vi.fn()
}))

beforeEach(() => {
  vi.useFakeTimers()
  vi.mocked(playSound).mockClear()
  vi.mocked(stopSound).mockClear()
})

afterEach(() => vi.useRealTimers())

const wait = (ms: number) =>
  act(() => {
    vi.advanceTimersByTime(ms)
  })

describe('useHold', () => {
  it('holds off until the press has run its full course', () => {
    const held = vi.fn()
    const { result } = renderHook(() => useHold(held))

    act(() => result.current.start())
    wait(HOLD_MS - 50)

    expect(held).not.toHaveBeenCalled()
  })

  it('goes through once the press has lasted long enough', () => {
    const held = vi.fn()
    const { result } = renderHook(() => useHold(held))

    act(() => result.current.start())
    wait(HOLD_MS)

    expect(held).toHaveBeenCalledTimes(1)
  })

  it('gives up on a press that is let go too soon', () => {
    const held = vi.fn()
    const { result } = renderHook(() => useHold(held))

    act(() => result.current.start())
    wait(HOLD_MS - 100)
    act(() => result.current.cancel())
    wait(HOLD_MS)

    expect(held).not.toHaveBeenCalled()
  })

  it('reports the press it is in the middle of, so the bar can fill', () => {
    const { result } = renderHook(() => useHold(vi.fn()))

    act(() => result.current.start())

    expect(result.current.isHolding).toBe(true)
  })

  it('is no longer holding once the press has gone through', () => {
    const { result } = renderHook(() => useHold(vi.fn()))

    act(() => result.current.start())
    wait(HOLD_MS)

    expect(result.current.isHolding).toBe(false)
  })

  it('charges audibly on the way down and lands on the reset', () => {
    const { result } = renderHook(() => useHold(vi.fn()))

    act(() => result.current.start())
    expect(vi.mocked(playSound).mock.calls).toEqual([['charge']])

    wait(HOLD_MS)
    expect(vi.mocked(playSound).mock.calls).toEqual([['charge'], ['reset']])
  })

  it('cuts the charge off with the press, so a change of mind falls silent', () => {
    const { result } = renderHook(() => useHold(vi.fn()))

    act(() => result.current.start())
    act(() => result.current.cancel())

    expect(vi.mocked(stopSound).mock.calls).toEqual([['charge']])
  })

  it('ignores a second start, so a held-down key charges once', () => {
    const held = vi.fn()
    const { result } = renderHook(() => useHold(held))

    act(() => result.current.start())
    wait(100)
    act(() => result.current.start())
    wait(HOLD_MS)

    expect(held).toHaveBeenCalledTimes(1)
  })

  it('drops a press still under way when the bench leaves the screen', () => {
    const held = vi.fn()
    const { result, unmount } = renderHook(() => useHold(held))

    act(() => result.current.start())
    unmount()
    wait(HOLD_MS)

    expect(held).not.toHaveBeenCalled()
  })
})
