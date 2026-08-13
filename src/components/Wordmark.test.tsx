import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Wordmark } from './Wordmark'

/** The mark is drawn from seven glyphs: m, a, t, p, o, l, i. */
const GLYPHS = 7

/*
 * The Web Animations API is the boundary here. jsdom has none of it, which is
 * also how a browser too old for it looks, so the tests lend one and watch what
 * the mark asks of it.
 */
const animate = vi.fn(
  (_keyframes: Keyframe[], _timing: KeyframeAnimationOptions) => ({
    finished: Promise.resolve(),
    cancel: () => {}
  })
)

function lendAnAnimator(): void {
  Object.defineProperty(Element.prototype, 'animate', {
    value: animate,
    configurable: true
  })
  Object.defineProperty(Element.prototype, 'getAnimations', {
    value: () => [],
    configurable: true
  })
}

function takeItBack(): void {
  Reflect.deleteProperty(Element.prototype, 'animate')
  Reflect.deleteProperty(Element.prototype, 'getAnimations')
}

function askForReducedMotion(): void {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: query.includes('prefers-reduced-motion'),
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false
  }))
}

beforeEach(() => {
  animate.mockClear()
  lendAnAnimator()
})

afterEach(() => {
  takeItBack()
  vi.unstubAllGlobals()
})

describe('Wordmark', () => {
  it('is the way back to the blog this game belongs to', () => {
    render(<Wordmark />)

    expect(screen.getByRole('link', { name: 'Mat Poli' })).toHaveAttribute(
      'href',
      'https://matpoli.dev/'
    )
  })

  it('drops every glyph of the mark in as it arrives', () => {
    render(<Wordmark />)

    expect(animate).toHaveBeenCalledTimes(GLYPHS)
  })

  it('leaves every glyph at rest and fully there once it lands', () => {
    render(<Wordmark />)

    const [keyframes] = animate.mock.calls[0]
    expect(keyframes.at(-1)).toEqual({
      transform: 'translateY(0)',
      opacity: 1,
      offset: 1
    })
  })

  it('plays again when the pointer comes back over it', async () => {
    const user = userEvent.setup()
    render(<Wordmark />)

    await user.hover(screen.getByRole('link', { name: 'Mat Poli' }))

    expect(animate).toHaveBeenCalledTimes(GLYPHS * 2)
  })

  it('holds the mark still for a player who asked for less motion', () => {
    askForReducedMotion()

    render(<Wordmark />)

    expect(animate).not.toHaveBeenCalled()
  })
})
