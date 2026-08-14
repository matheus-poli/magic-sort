import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { GameOver } from './GameOver'
import { playSound, warmSound } from '../audio/sounds'

// Audio is a real boundary, and the sound of a run ending is part of what is
// being asked for here.
vi.mock('../audio/sounds', () => ({
  playSound: vi.fn(),
  stopSound: vi.fn(),
  warmSound: vi.fn()
}))

const showCard = (onBeginAgain = vi.fn()) => {
  render(
    <GameOver
      ending={{ kind: 'buried', debt: 3900 }}
      onBeginAgain={onBeginAgain}
    />
  )
  return onBeginAgain
}

const beginAgain = () => screen.getByRole('button', { name: 'Begin a new run' })

beforeEach(() => {
  vi.mocked(playSound).mockClear()
  vi.mocked(warmSound).mockClear()
})

describe('GameOver', () => {
  it('tells the apprentice the run is over and what buried it', () => {
    showCard()

    expect(screen.getByRole('alertdialog')).toHaveTextContent(
      'You owe 3900 points, and no bench in the atelier could pay that back.'
    )
  })

  /*
   * The other way a run ends: the bench itself has run dry of pours, and the
   * restart that would lay it out again costs more than the atelier could pay
   * back. Naming the price is what stops the card reading as a bug.
   */
  it('tells the apprentice stuck on a dry bench what the way out would cost', () => {
    render(
      <GameOver ending={{ kind: 'stuck', price: 500 }} onBeginAgain={vi.fn()} />
    )

    expect(screen.getByRole('alertdialog')).toHaveTextContent(
      'There is no pour left on this bench, and the 500 points it costs to lay it out again would bury you.'
    )
  })

  it('marks the end of the run with a sound of its own', () => {
    showCard()

    expect(vi.mocked(playSound).mock.calls).toEqual([['defeat']])
  })

  /*
   * The rebirth is a recorded track that Howler only fetches when it is first
   * played, so it is asked for while the apprentice is still reading the card.
   */
  it('fetches the rebirth sound while the apprentice takes the news in', () => {
    showCard()

    expect(vi.mocked(warmSound).mock.calls).toEqual([['revive']])
  })

  it('puts the way back into the atelier under the apprentice’s finger', () => {
    showCard()

    expect(beginAgain()).toHaveFocus()
  })

  it('opens a new run when the apprentice asks for one', async () => {
    const user = userEvent.setup()
    const onBeginAgain = showCard()

    await user.click(beginAgain())

    expect(onBeginAgain).toHaveBeenCalledTimes(1)
  })

  it('sounds the rebirth as the new run opens', async () => {
    const user = userEvent.setup()
    showCard()

    await user.click(beginAgain())

    expect(vi.mocked(playSound).mock.calls).toEqual([['defeat'], ['revive']])
  })
})
