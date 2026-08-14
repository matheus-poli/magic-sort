import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useHold } from './useHold'
import { playSound, stopSound, warmSound } from '../audio/sounds'

// Audio is a real boundary: there is no speaker in a test run.
vi.mock('../audio/sounds', () => ({
  playSound: vi.fn(),
  stopSound: vi.fn(),
  warmSound: vi.fn()
}))

/** A press of any length, since how long is the caller's to decide. */
const PRESS_MS = 900

const press = (onHeld: () => void = vi.fn()) => ({
  duration: PRESS_MS,
  charge: 'charge' as const,
  done: 'reset' as const,
  onHeld
})

beforeEach(() => {
  vi.useFakeTimers()
  vi.mocked(playSound).mockClear()
  vi.mocked(stopSound).mockClear()
  vi.mocked(warmSound).mockClear()
})

afterEach(() => vi.useRealTimers())

const wait = (ms: number) =>
  act(() => {
    vi.advanceTimersByTime(ms)
  })

describe('useHold', () => {
  it('holds off until the press has run its full course', () => {
    const held = vi.fn()
    const { result } = renderHook(() => useHold(press(held)))

    act(() => result.current.start())
    wait(PRESS_MS - 50)

    expect(held).not.toHaveBeenCalled()
  })

  it('goes through once the press has lasted long enough', () => {
    const held = vi.fn()
    const { result } = renderHook(() => useHold(press(held)))

    act(() => result.current.start())
    wait(PRESS_MS)

    expect(held).toHaveBeenCalledTimes(1)
  })

  /* Some presses are asked to last far longer than others, and how long is
     the caller's to say: it is the button's promise, not the hook's. */
  it('holds a longer press for as long as it was asked to', () => {
    const held = vi.fn()
    const { result } = renderHook(() =>
      useHold({ ...press(held), duration: 5000 })
    )

    act(() => result.current.start())
    wait(PRESS_MS)
    expect(held).not.toHaveBeenCalled()

    wait(5000 - PRESS_MS)
    expect(held).toHaveBeenCalledTimes(1)
  })

  it('gives up on a press that is let go too soon', () => {
    const held = vi.fn()
    const { result } = renderHook(() => useHold(press(held)))

    act(() => result.current.start())
    wait(PRESS_MS - 100)
    act(() => result.current.cancel())
    wait(PRESS_MS)

    expect(held).not.toHaveBeenCalled()
  })

  it('reports the press it is in the middle of, so the bar can fill', () => {
    const { result } = renderHook(() => useHold(press()))

    act(() => result.current.start())

    expect(result.current.isHolding).toBe(true)
  })

  it('is no longer holding once the press has gone through', () => {
    const { result } = renderHook(() => useHold(press()))

    act(() => result.current.start())
    wait(PRESS_MS)

    expect(result.current.isHolding).toBe(false)
  })

  it('charges audibly on the way down and lands on the sound it was given', () => {
    const { result } = renderHook(() => useHold(press()))

    act(() => result.current.start())
    expect(vi.mocked(playSound).mock.calls).toEqual([['charge']])

    wait(PRESS_MS)
    expect(vi.mocked(playSound).mock.calls).toEqual([['charge'], ['reset']])
  })

  /*
   * A press is long enough to fetch what it lands on, and one of these lands
   * on a recorded track: asking for it at the moment the press goes through
   * would put the sound audibly behind the thing it is marking.
   */
  it('fetches the sound it will land on while the press is still charging', () => {
    const { result } = renderHook(() => useHold(press()))

    act(() => result.current.start())

    expect(vi.mocked(warmSound).mock.calls).toEqual([['reset']])
  })

  it('cuts the charge off with the press, so a change of mind falls silent', () => {
    const { result } = renderHook(() => useHold(press()))

    act(() => result.current.start())
    act(() => result.current.cancel())

    expect(vi.mocked(stopSound).mock.calls).toEqual([['charge']])
  })

  it('ignores a second start, so a held-down key charges once', () => {
    const held = vi.fn()
    const { result } = renderHook(() => useHold(press(held)))

    act(() => result.current.start())
    wait(100)
    act(() => result.current.start())
    wait(PRESS_MS)

    expect(held).toHaveBeenCalledTimes(1)
  })

  it('drops a press still under way when the bench leaves the screen', () => {
    const held = vi.fn()
    const { result, unmount } = renderHook(() => useHold(press(held)))

    act(() => result.current.start())
    unmount()
    wait(PRESS_MS)

    expect(held).not.toHaveBeenCalled()
  })
})
