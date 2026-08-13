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

const showBench = (level: Level, onNextLevel: (() => void) | null = null) =>
  render(
    <Game level={level} position={1} total={5} onNextLevel={onNextLevel} />
  )

const flask = (position: number) =>
  screen.getByRole('button', { name: new RegExp(`^Flask ${position}[,:]`) })

beforeEach(() => {
  vi.mocked(celebrateFlask).mockClear()
  vi.mocked(celebrateLevel).mockClear()
})

describe('Game', () => {
  it('throws confetti over a flask once a pour fills it', async () => {
    const user = userEvent.setup()
    showBench(nearlyFull)

    await user.click(flask(2))
    await user.click(flask(1))

    await waitFor(() => expect(celebrateFlask).toHaveBeenCalled())
  })

  it('leaves the confetti alone while flasks are still unfinished', async () => {
    const user = userEvent.setup()
    showBench(bench)

    await user.click(flask(1))
    await user.click(flask(2))

    expect(celebrateFlask).not.toHaveBeenCalled()
  })

  it('throws confetti over the whole atelier once the level is solved', async () => {
    const user = userEvent.setup()
    showBench(finalPour)

    await user.click(flask(2))
    await user.click(flask(1))

    await waitFor(() => expect(celebrateLevel).toHaveBeenCalled())
  })

  it('shows every flask on the bench with the elixirs it holds', () => {
    showBench(bench)

    expect(flask(1)).toHaveAccessibleName(
      'Flask 1, holding crimson, azure from bottom to top'
    )
    expect(flask(3)).toHaveAccessibleName('Flask 3, empty')
  })

  it('marks a flask as picked up when the apprentice taps it', async () => {
    const user = userEvent.setup()
    showBench(bench)

    await user.click(flask(1))

    expect(flask(1)).toHaveAttribute('aria-pressed', 'true')
  })

  it('pours between two flasks tapped in turn', async () => {
    const user = userEvent.setup()
    showBench(bench)

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
    showBench(bench)

    await user.click(flask(1))
    await user.click(flask(2))

    expect(screen.getByLabelText('Pours')).toHaveTextContent('1')
  })

  it('says in how few pours the bench can be sorted and what going over costs', () => {
    showBench(bench)

    expect(screen.getByText(/can be sorted in/i)).toHaveTextContent(
      'This bench can be sorted in 4 pours. Every pour past that costs 25 points.'
    )
  })

  it('counts out which bench of the atelier this is', () => {
    render(<Game level={bench} position={2} total={5} onNextLevel={null} />)

    expect(screen.getByText(/level 2 of 5/i)).toHaveTextContent(
      'Level 2 of 5 · Test Bench'
    )
  })

  it('offers the next bench once this one is sorted', async () => {
    const user = userEvent.setup()
    const onNextLevel = vi.fn()
    showBench(finalPour, onNextLevel)

    await user.click(flask(2))
    await user.click(flask(1))
    await user.click(screen.getByRole('button', { name: 'Next level' }))

    expect(onNextLevel).toHaveBeenCalled()
  })

  it('closes the atelier out on the last bench rather than offering another', async () => {
    const user = userEvent.setup()
    showBench(finalPour)

    await user.click(flask(2))
    await user.click(flask(1))

    expect(
      screen.queryByRole('button', { name: 'Next level' })
    ).not.toBeInTheDocument()
    expect(screen.getByText(/every bench/i)).toHaveTextContent(
      'Every bench in the atelier is sorted.'
    )
  })

  it('celebrates once every elixir is sorted', async () => {
    const user = userEvent.setup()
    showBench(finalPour)

    await user.click(flask(2))
    await user.click(flask(1))

    // Presence is the behaviour worth asserting here: whether the card has
    // finished fading in is a question only a real browser can answer, and the
    // e2e smoke test asks it there.
    expect(
      screen.getByRole('heading', { name: /elixirs sorted/i })
    ).toBeInTheDocument()
  })

  it('scores every bench out of the same 1000', () => {
    showBench(bench)

    expect(screen.getByLabelText('Score')).toHaveTextContent('0 / 1000')
  })

  it('pays a flawless run the full 1000', async () => {
    const user = userEvent.setup()
    showBench(finalPour)

    await user.click(flask(2))
    await user.click(flask(1))

    expect(screen.getByLabelText('Score')).toHaveTextContent('1000 / 1000')
  })

  it('breaks the final score down against the fewest pours possible', async () => {
    const user = userEvent.setup()
    showBench(finalPour)

    await user.click(flask(2))
    await user.click(flask(1))

    expect(screen.getByText(/final score/i)).toHaveTextContent(
      'Final score 1000 of 1000'
    )
    expect(screen.getByText(/fewest possible/i)).toHaveTextContent(
      'Pours spent: 1 · Fewest possible: 1'
    )
  })

  it('puts the bench back the way it started when asked to restart', async () => {
    const user = userEvent.setup()
    showBench(bench)

    await user.click(flask(1))
    await user.click(flask(2))
    await user.click(screen.getByRole('button', { name: 'Restart level' }))

    expect(flask(1)).toHaveAccessibleName(
      'Flask 1, holding crimson, azure from bottom to top'
    )
    expect(screen.getByLabelText('Pours')).toHaveTextContent('0')
  })
})
