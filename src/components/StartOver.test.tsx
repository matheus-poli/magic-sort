import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { StartOver } from './StartOver'
import { playSound, warmSound } from '../audio/sounds'

// Audio is a real boundary, and the sound is part of what is being asked for.
vi.mock('../audio/sounds', () => ({
  playSound: vi.fn(),
  stopSound: vi.fn(),
  warmSound: vi.fn()
}))

const showControl = (onStartOver = vi.fn()) => {
  render(
    <StartOver
      position={3}
      levelCount={5}
      total={9000}
      price={6000}
      onStartOver={onStartOver}
    />
  )
  return onStartOver
}

const trigger = () => screen.getByRole('button', { name: 'Start over' })
const confirm = () => screen.getByRole('button', { name: 'Yes, start over' })
const wayOut = () => screen.getByRole('button', { name: 'Keep playing' })

beforeEach(() => {
  vi.mocked(playSound).mockClear()
  vi.mocked(warmSound).mockClear()
})

describe('StartOver', () => {
  it('asks first instead of throwing the run away on a click', async () => {
    const user = userEvent.setup()
    const onStartOver = showControl()

    await user.click(trigger())

    expect(screen.getByRole('alertdialog')).toBeInTheDocument()
    expect(onStartOver).not.toHaveBeenCalled()
  })

  /*
   * The price is the whole reason the dialog exists now. A rebirth keeps the
   * points, so a player who is not told what it costs has no way to weigh it.
   */
  it('spells out what starting over would cost', async () => {
    const user = userEvent.setup()
    showControl()

    await user.click(trigger())

    expect(screen.getByRole('alertdialog')).toHaveTextContent(
      'You are on level 3 of 5 with 9000 points. Starting over puts you back on the first bench and costs 6000 points.'
    )
  })

  it('leaves the way out under the finger, not the destruction', async () => {
    const user = userEvent.setup()
    showControl()

    await user.click(trigger())

    expect(wayOut()).toHaveFocus()
  })

  it('starts the atelier over once it is confirmed', async () => {
    const user = userEvent.setup()
    const onStartOver = showControl()

    await user.click(trigger())
    await user.click(confirm())

    expect(onStartOver).toHaveBeenCalledTimes(1)
    // The dialog fades out, so its absence is something to wait for.
    await waitFor(() =>
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    )
  })

  /*
   * The rebirth is a recorded track, and Howler does not fetch a sound until
   * the first time it is played — so the sound arrived audibly after the
   * button that caused it. Opening the dialog is the player saying they are
   * thinking about it, which is all the warning the fetch needs.
   */
  it('fetches the rebirth sound while the apprentice is still deciding', async () => {
    const user = userEvent.setup()
    showControl()

    await user.click(trigger())

    expect(vi.mocked(warmSound).mock.calls).toEqual([['revive']])
  })

  it('marks the moment with the sound of a life wound back', async () => {
    const user = userEvent.setup()
    showControl()

    await user.click(trigger())
    await user.click(confirm())

    expect(vi.mocked(playSound).mock.calls).toEqual([['revive']])
  })

  it('leaves the run standing when the apprentice keeps playing', async () => {
    const user = userEvent.setup()
    const onStartOver = showControl()

    await user.click(trigger())
    await user.click(wayOut())

    await waitFor(() =>
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    )
    expect(onStartOver).not.toHaveBeenCalled()
  })

  it('takes an escape key as keeping playing', async () => {
    const user = userEvent.setup()
    const onStartOver = showControl()

    await user.click(trigger())
    await user.keyboard('{Escape}')

    await waitFor(() =>
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    )
    expect(onStartOver).not.toHaveBeenCalled()
  })
})
