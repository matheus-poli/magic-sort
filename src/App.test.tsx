import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { App } from './App'
import { LEVELS } from './domain/levels'

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

  it('shows the way back to the blog the game is a project of', () => {
    render(<App />)

    expect(screen.getByRole('link', { name: 'Mat Poli' })).toHaveAttribute(
      'href',
      'https://matpoli.dev/'
    )
  })
})
