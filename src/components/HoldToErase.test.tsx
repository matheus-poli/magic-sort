import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ERASE_HOLD_MS, HoldToErase } from './HoldToErase'
import { playSound, stopSound } from '../audio/sounds'

// Audio is a real boundary: there is no speaker in a test run. It is also part
// of what is being asked for here — the erasing is something the player hears.
vi.mock('../audio/sounds', () => ({
  playSound: vi.fn(),
  stopSound: vi.fn(),
  warmSound: vi.fn()
}))

/*
 * These run on the real clock, as the restart's do: Vitest's fake timers and
 * user-event deadlock in this setup, whether the clock is handed over or the
 * delay switched off. How long a press has to last is settled in useHold's own
 * tests on a fake clock, so only one test here pays for the full five seconds.
 */
const eraseButton = () =>
  screen.getByRole('button', { name: 'Hold to erase this run' })

beforeEach(() => {
  vi.mocked(playSound).mockClear()
  vi.mocked(stopSound).mockClear()
})

describe('HoldToErase', () => {
  it('owns up to what erasing a run costs before anyone holds it', () => {
    render(<HoldToErase onErase={vi.fn()} />)

    expect(eraseButton()).toHaveAccessibleDescription(
      'Erasing throws away every point and every bench of this run. It cannot be undone.'
    )
  })

  it('charges up audibly while the button is held down', async () => {
    const user = userEvent.setup()
    render(<HoldToErase onErase={vi.fn()} />)

    await user.pointer({ keys: '[MouseLeft>]', target: eraseButton() })

    expect(vi.mocked(playSound).mock.calls).toEqual([['wipeCharge']])
  })

  it('charges from a key held down on the keyboard just the same', async () => {
    const user = userEvent.setup()
    render(<HoldToErase onErase={vi.fn()} />)

    await user.tab()
    await user.keyboard('{Enter>}')

    expect(vi.mocked(playSound).mock.calls).toEqual([['wipeCharge']])
  })

  it('calls the charge off on a plain click, leaving the run alone', async () => {
    const user = userEvent.setup()
    const onErase = vi.fn()
    render(<HoldToErase onErase={onErase} />)

    await user.click(eraseButton())

    expect(vi.mocked(stopSound).mock.calls).toEqual([['wipeCharge']])
    expect(onErase).not.toHaveBeenCalled()
  })

  it('calls it off when the pointer slides off the button', async () => {
    const user = userEvent.setup()
    const onErase = vi.fn()
    render(<HoldToErase onErase={onErase} />)

    await user.pointer([
      { keys: '[MouseLeft>]', target: eraseButton() },
      { target: document.body }
    ])

    expect(vi.mocked(stopSound).mock.calls).toEqual([['wipeCharge']])
    expect(onErase).not.toHaveBeenCalled()
  })

  /*
   * The one test that sits through the whole press. It is worth the five
   * seconds: it is the only place that proves this button is wired to erasing
   * the run rather than to something else that takes five seconds to hold.
   */
  it('erases the run once the press has lasted its full length', async () => {
    const user = userEvent.setup()
    const onErase = vi.fn()
    render(<HoldToErase onErase={onErase} />)

    await user.pointer({ keys: '[MouseLeft>]', target: eraseButton() })

    await waitFor(() => expect(onErase).toHaveBeenCalledTimes(1), {
      timeout: ERASE_HOLD_MS + 2000
    })
    expect(vi.mocked(playSound).mock.calls).toEqual([['wipeCharge'], ['wipe']])
  }, 10000)
})
