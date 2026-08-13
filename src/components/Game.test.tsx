import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Game } from './Game'
import { celebrateFlask, celebrateLevel } from '../effects/confetti'
import type { Level } from '../domain/levels'

// Confetti paints to a canvas, which is a boundary rather than behaviour.
vi.mock('../effects/confetti', () => ({
  celebrateFlask: vi.fn(),
  celebrateLevel: vi.fn()
}))

const bench: Level = {
  id: 'test-bench',
  name: 'Test Bench',
  minimumPours: 4,
  board: [['crimson', 'azure'], ['azure'], []]
}

/** Tapping flask 2 then flask 1 fills flask 1 without finishing the level. */
const nearlyFull: Level = {
  id: 'test-nearly-full',
  name: 'Nearly Full',
  minimumPours: 2,
  board: [
    ['crimson', 'crimson', 'crimson'],
    ['crimson'],
    ['azure', 'azure'],
    ['verdant', 'verdant']
  ]
}

/** Tapping flask 2 then flask 1 finishes this level. */
const finalPour: Level = {
  id: 'test-final-pour',
  name: 'Final Pour',
  minimumPours: 1,
  board: [
    ['crimson', 'crimson', 'crimson'],
    ['crimson'],
    ['azure', 'azure', 'azure', 'azure']
  ]
}

const flask = (position: number) =>
  screen.getByRole('button', { name: new RegExp(`^Flask ${position}[,:]`) })

beforeEach(() => {
  vi.mocked(celebrateFlask).mockClear()
  vi.mocked(celebrateLevel).mockClear()
})

describe('Game', () => {
  it('throws confetti over a flask once a pour fills it', async () => {
    const user = userEvent.setup()
    render(<Game level={nearlyFull} />)

    await user.click(flask(2))
    await user.click(flask(1))

    await waitFor(() => expect(celebrateFlask).toHaveBeenCalled())
  })

  it('leaves the confetti alone while flasks are still unfinished', async () => {
    const user = userEvent.setup()
    render(<Game level={bench} />)

    await user.click(flask(1))
    await user.click(flask(2))

    expect(celebrateFlask).not.toHaveBeenCalled()
  })

  it('throws confetti over the whole atelier once the level is solved', async () => {
    const user = userEvent.setup()
    render(<Game level={finalPour} />)

    await user.click(flask(2))
    await user.click(flask(1))

    await waitFor(() => expect(celebrateLevel).toHaveBeenCalled())
  })

  it('shows every flask on the bench with the elixirs it holds', () => {
    render(<Game level={bench} />)

    expect(flask(1)).toHaveAccessibleName(
      'Flask 1, holding crimson, azure from bottom to top'
    )
    expect(flask(3)).toHaveAccessibleName('Flask 3, empty')
  })

  it('marks a flask as picked up when the apprentice taps it', async () => {
    const user = userEvent.setup()
    render(<Game level={bench} />)

    await user.click(flask(1))

    expect(flask(1)).toHaveAttribute('aria-pressed', 'true')
  })

  it('pours between two flasks tapped in turn', async () => {
    const user = userEvent.setup()
    render(<Game level={bench} />)

    await user.click(flask(1))
    await user.click(flask(2))

    expect(flask(1)).toHaveAccessibleName(
      'Flask 1, holding crimson from bottom to top'
    )
    expect(flask(2)).toHaveAccessibleName(
      'Flask 2, holding azure, azure from bottom to top'
    )
  })

  it('counts the pours the apprentice has spent', async () => {
    const user = userEvent.setup()
    render(<Game level={bench} />)

    await user.click(flask(1))
    await user.click(flask(2))

    expect(screen.getByLabelText('Pours')).toHaveTextContent('1')
  })

  it('says in how few pours the bench can be sorted and what going over costs', () => {
    render(<Game level={bench} />)

    expect(screen.getByText(/can be sorted in/i)).toHaveTextContent(
      'This bench can be sorted in 4 pours. Every pour past that costs 25 points.'
    )
  })

  it('celebrates once every elixir is sorted', async () => {
    const user = userEvent.setup()
    render(<Game level={finalPour} />)

    await user.click(flask(2))
    await user.click(flask(1))

    // Presence is the behaviour worth asserting here: whether the card has
    // finished fading in is a question only a real browser can answer, and the
    // e2e smoke test asks it there.
    expect(
      screen.getByRole('heading', { name: /elixirs sorted/i })
    ).toBeInTheDocument()
  })

  it('awards the solve bonus on top of the completed flasks', async () => {
    const user = userEvent.setup()
    render(<Game level={finalPour} />)

    await user.click(flask(2))
    await user.click(flask(1))

    expect(screen.getByLabelText('Score')).toHaveTextContent('700')
  })

  it('puts the bench back the way it started when asked to restart', async () => {
    const user = userEvent.setup()
    render(<Game level={bench} />)

    await user.click(flask(1))
    await user.click(flask(2))
    await user.click(screen.getByRole('button', { name: 'Restart level' }))

    expect(flask(1)).toHaveAccessibleName(
      'Flask 1, holding crimson, azure from bottom to top'
    )
    expect(screen.getByLabelText('Pours')).toHaveTextContent('0')
  })
})
