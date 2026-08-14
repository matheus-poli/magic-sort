import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { App } from './App'
import { LEVELS } from './domain/levels'
import { rememberCampaign } from './storage/savedRun'
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

  /*
   * A thousand for the first bench and another thousand for every bench after
   * it, which is what fifty benches add up to. The ladder is the reason to
   * press on rather than sort the easy benches over and over.
   */
  it('scores the whole atelier out of what its fifty benches pay', () => {
    render(<App />)

    expect(screen.getByLabelText('Total')).toHaveTextContent('0 / 1275000')
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

  /*
   * The end of a run, wired up: the campaign works out that the debt has
   * outgrown the atelier, and the card that says so is the only thing the
   * apprentice can reach. Seeded through storage because getting there by
   * playing would mean holding the restart button eleven times over.
   */
  it('closes down a run the apprentice can no longer pay their way out of', () => {
    lendStorage()
    rememberCampaign({
      reached: 0,
      earned: 500,
      forfeited: 3000,
      rebirths: 1
    })

    render(<App />)

    expect(screen.getByRole('alertdialog')).toHaveTextContent(
      'You owe 2500 points, and no bench in the atelier could pay that back.'
    )
  })

  it('hands a ruined apprentice a clean bench and an empty ledger', async () => {
    lendStorage()
    rememberCampaign({
      reached: 0,
      earned: 500,
      forfeited: 3000,
      rebirths: 1
    })
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'Begin a new run' }))

    await waitFor(() =>
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    )
    // Awaited because the debt climbs back to nothing rather than vanishing.
    await waitFor(() =>
      expect(screen.getByLabelText('Total')).toHaveTextContent('0 / 1275000')
    )
    expect(screen.getByText(/level 1 of/i)).toBeInTheDocument()
  })

  /*
   * The one control that reaches past the campaign to the save itself, held
   * here for its full length on purpose: what is being proved runs from a
   * button in the corner of the screen all the way down to the storage, and
   * no lower layer can prove that on its own.
   */
  it('erases a run outright when the corner button is held long enough', async () => {
    lendStorage()
    rememberCampaign({ reached: 4, earned: 9000, forfeited: 0, rebirths: 0 })
    const user = userEvent.setup()
    render(<App />)
    expect(screen.getByText(/level 5 of/i)).toBeInTheDocument()

    await user.pointer({
      keys: '[MouseLeft>]',
      target: screen.getByRole('button', { name: 'Hold to erase this run' })
    })

    await waitFor(
      () => expect(screen.getByText(/level 1 of/i)).toBeInTheDocument(),
      { timeout: 8000 }
    )
    await waitFor(() =>
      expect(screen.getByLabelText('Total')).toHaveTextContent('0 / 1275000')
    )
  }, 12000)

  it('shows the way back to the blog the game is a project of', () => {
    render(<App />)

    expect(screen.getByRole('link', { name: 'Mat Poli' })).toHaveAttribute(
      'href',
      'https://matpoli.dev/'
    )
  })
})
