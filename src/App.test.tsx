import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { App } from './App'
import { LEVELS } from './domain/levels'
import { lendStorage } from './test/storage'

const firstFlask = () => screen.getByRole('button', { name: /^Flask 1/ })

/** The first spare glass on the opening bench, which anything can pour into. */
const spareFlask = () => screen.getByRole('button', { name: /^Flask 5/ })

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('App', () => {
  it('opens the atelier on the first bench of the campaign', () => {
    render(<App />)

    expect(screen.getByText(/level 1 of/i)).toHaveTextContent(
      `Level 1 of ${LEVELS.length}`
    )
  })

  it('scores the whole atelier out of a thousand points a bench', () => {
    render(<App />)

    expect(screen.getByLabelText('Total')).toHaveTextContent(
      `0 / ${LEVELS.length * 1000}`
    )
  })

  it('lays out every flask that first bench holds', () => {
    render(<App />)

    expect(screen.getAllByRole('button', { name: /^Flask/ })).toHaveLength(
      LEVELS[0].board.length
    )
  })

  it('marks the elixirs by shape when the player turns colour-blind mode on', async () => {
    const user = userEvent.setup()
    render(<App />)
    const toggle = screen.getByRole('button', { name: /colour-blind mode/i })

    await user.click(toggle)

    expect({
      pressed: toggle.getAttribute('aria-pressed'),
      marksOnTheFirstFlask: firstFlask().textContent
    }).toEqual({ pressed: 'true', marksOnTheFirstFlask: '▲▼●★' })
  })

  it('leaves the elixirs to their colours until it is asked not to', () => {
    render(<App />)

    expect({
      pressed: screen
        .getByRole('button', { name: /colour-blind mode/i })
        .getAttribute('aria-pressed'),
      marksOnTheFirstFlask: firstFlask().textContent
    }).toEqual({ pressed: 'false', marksOnTheFirstFlask: '' })
  })

  /*
   * The whole point of sealing a run: the apprentice closes the tab mid-pour
   * and comes back to the bench exactly as they left it, pours already spent
   * included. Proving it here proves the wiring, which is what the campaign
   * and the bench cannot each prove on their own.
   */
  it('hands the apprentice back the bench they closed the tab on', async () => {
    lendStorage()
    const user = userEvent.setup()
    const { unmount } = render(<App />)

    await user.click(firstFlask())
    await user.click(spareFlask())
    await waitFor(() =>
      expect(screen.getByLabelText('Pours')).toHaveTextContent('1')
    )
    const leftBehind = spareFlask().getAttribute('aria-label')
    unmount()

    render(<App />)

    expect(screen.getByLabelText('Pours')).toHaveTextContent('1')
    expect(spareFlask()).toHaveAttribute('aria-label', leftBehind)
  })

  it('shows the way back to the blog the game is a project of', () => {
    render(<App />)

    expect(screen.getByRole('link', { name: 'Mat Poli' })).toHaveAttribute(
      'href',
      'https://matpoli.dev/'
    )
  })
})
