import { render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { CountingNumber } from './CountingNumber'

/** The one boundary here: what the operating system says about motion. */
function askForReducedMotion(): void {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: query.includes('prefers-reduced-motion'),
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false
  }))
}

afterEach(() => vi.unstubAllGlobals())

describe('CountingNumber', () => {
  it('shows the number it was handed to begin with', () => {
    render(<CountingNumber value={250} />)

    expect(screen.getByText('250')).toBeInTheDocument()
  })

  it('holds the old number for a beat rather than snapping to the new one', () => {
    const { rerender } = render(<CountingNumber value={250} />)

    rerender(<CountingNumber value={1000} />)

    expect(screen.getByText('250')).toBeInTheDocument()
  })

  it('climbs all the way to the new number', async () => {
    const { rerender } = render(<CountingNumber value={250} />)

    rerender(<CountingNumber value={1000} />)

    await waitFor(() => expect(screen.getByText('1000')).toBeInTheDocument())
  })

  it('goes straight there for a player who asked for less motion', () => {
    askForReducedMotion()
    const { rerender } = render(<CountingNumber value={250} />)

    rerender(<CountingNumber value={1000} />)

    expect(screen.getByText('1000')).toBeInTheDocument()
  })
})
