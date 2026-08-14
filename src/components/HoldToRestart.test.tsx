import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { HoldToRestart } from './HoldToRestart'
import { playSound, stopSound } from '../audio/sounds'

// Audio is a real boundary: there is no speaker in a test run. It is also the
// feedback under test here — the charge is something the player hears.
vi.mock('../audio/sounds', () => ({
  playSound: vi.fn(),
  stopSound: vi.fn(),
  warmSound: vi.fn()
}))

/*
 * These run on the real clock. Vitest's fake timers and user-event deadlock in
 * this setup — every interaction hangs, even with `delay: null` — and how long
 * a press has to last is settled in useHold's own tests. What is left to prove
 * here is the wiring: which gestures start the charge, and which call it off.
 */
const holdButton = () => screen.getByRole('button', { name: 'Hold to restart' })

interface Press {
  readonly onRestart?: () => void
  readonly price?: number
  readonly forfeited?: number
  readonly wouldEndTheRun?: boolean
}

/** Renders the button and hands back the restart it is wired to. */
const showButton = (press: Press = {}) => {
  const onRestart = press.onRestart ?? vi.fn()
  render(
    <HoldToRestart
      onRestart={onRestart}
      price={press.price ?? 100}
      forfeited={press.forfeited ?? 0}
      wouldEndTheRun={press.wouldEndTheRun ?? false}
    />
  )
  return onRestart
}

beforeEach(() => {
  vi.mocked(playSound).mockClear()
  vi.mocked(stopSound).mockClear()
})

describe('HoldToRestart', () => {
  it('charges up audibly while the button is held down', async () => {
    const user = userEvent.setup()
    showButton()

    await user.pointer({ keys: '[MouseLeft>]', target: holdButton() })

    expect(vi.mocked(playSound).mock.calls).toEqual([['charge']])
  })

  it('calls the charge off on a plain click, leaving the bench alone', async () => {
    const user = userEvent.setup()
    const restart = showButton()

    await user.click(holdButton())

    expect(vi.mocked(stopSound).mock.calls).toEqual([['charge']])
    expect(restart).not.toHaveBeenCalled()
  })

  it('calls it off when the pointer slides off the button', async () => {
    const user = userEvent.setup()
    showButton()

    await user.pointer([
      { keys: '[MouseLeft>]', target: holdButton() },
      { target: document.body }
    ])

    expect(vi.mocked(stopSound).mock.calls).toEqual([['charge']])
  })

  it('charges from a key held down on the keyboard just the same', async () => {
    const user = userEvent.setup()
    showButton()

    await user.tab()
    await user.keyboard('{Enter>}')

    expect(vi.mocked(playSound).mock.calls).toEqual([['charge']])
  })

  it('calls it off when the key is let go', async () => {
    const user = userEvent.setup()
    showButton()

    await user.tab()
    await user.keyboard('{Enter>}')
    await user.keyboard('{/Enter}')

    expect(vi.mocked(stopSound).mock.calls).toEqual([['charge']])
  })

  it('restarts once the press has lasted long enough', async () => {
    const user = userEvent.setup()
    const restart = showButton()

    await user.pointer({ keys: '[MouseLeft>]', target: holdButton() })

    await waitFor(() => expect(restart).toHaveBeenCalledTimes(1), {
      timeout: 3000
    })
  })

  it('says what a restart will cost before anyone holds it', () => {
    showButton()

    expect(holdButton()).toHaveAccessibleDescription(
      'Restarting costs 100 points.'
    )
  })

  /* A later bench pays more, so throwing one away costs more. */
  it('names the price of the bench actually being thrown away', () => {
    showButton({ price: 2600 })

    expect(holdButton()).toHaveAccessibleDescription(
      'Restarting costs 2600 points.'
    )
  })

  /*
   * What has been given up, not what restarts have given up: a rebirth is
   * charged to the same tally, and naming restarts alone would have this line
   * telling an apprentice who has never restarted that restarts cost them a
   * thousand points.
   */
  it('owns up to what the campaign has given up so far', () => {
    showButton({ forfeited: 200 })

    expect(holdButton()).toHaveAccessibleDescription(
      'Restarting costs 100 points. You have given up 200 points so far.'
    )
  })

  /*
   * A restart is paid for out of banked points, and on the first bench of a
   * fresh run there are none: holding this is the end of the run. Saying so
   * before it is held is what makes it a decision rather than an ambush.
   */
  it('warns the apprentice whose restart would end their run', () => {
    showButton({ wouldEndTheRun: true })

    expect(holdButton()).toHaveAccessibleDescription(
      'Restarting costs 100 points. That is more than you have: it would end your run.'
    )
  })

  /* The end of a run has a voice of its own, and a bench being poured back
     out is not it: the card that closes the run is what announces it. */
  it('lands silently when the press is the end of the run', async () => {
    const user = userEvent.setup()
    const restart = showButton({ wouldEndTheRun: true })

    await user.pointer({ keys: '[MouseLeft>]', target: holdButton() })
    await waitFor(() => expect(restart).toHaveBeenCalledTimes(1), {
      timeout: 3000
    })

    expect(vi.mocked(playSound).mock.calls).toEqual([['charge']])
  })
})
