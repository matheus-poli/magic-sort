import { useCallback, useEffect, useRef } from 'react'

/** Where the mark leads: the blog this game is a project of. */
const BLOG_URL = 'https://matpoli.dev/'

/**
 * The blog's own wordmark, hand-drawn on a modular grid rather than set in a
 * font. Copied here rather than shared: the game builds to static files with
 * nothing fetched from anywhere, so the mark has to travel with it.
 */
const GLYPHS = [
  'M60.88,151.06l-42.67-56.26,11.25-8.53,8.53,11.25,11.25-8.53,8.53,11.25,11.25-8.53,8.53,11.25-11.25,8.53-8.53-11.25-11.25,8.53,25.6,33.76-11.25,8.53ZM105.88,116.92l-25.6-33.76-11.25,8.53-8.53-11.25,11.25-8.53-8.53-11.25,11.25-8.53,42.67,56.26-11.25,8.53Z',
  'M135.67,102.17l-7.34-56.01,14-1.84-1.84-14,28-3.67,1.84,14,14-1.84,7.34,56.01-14,1.84-3.67-28-28,3.67,3.67,28-14,1.84ZM144.16,58.32l28-3.67-1.76-13.44-28,3.67,1.76,13.44Z',
  'M226.19,102.16l14.9-54.49-13.62-3.73,3.73-13.62,40.86,11.18-3.73,13.62-13.62-3.73-14.9,54.49-13.62-3.73Z',
  'M232.38,271.47l3.72-70.51,42.31,2.23-.74,14.1,14.1.74-.74,14.1-14.1-.74-.74,14.1-28.2-1.49-1.49,28.2-14.1-.74ZM248.72,229.91l27.64,1.46.74-14.1-27.64-1.46-.74,14.1Z',
  'M347.76,263.71l-4.16-13.5-13.5,4.16-12.48-40.49,13.49-4.16-4.16-13.5,26.99-8.32,4.16,13.5,13.5-4.16,12.48,40.49-13.5,4.16,4.16,13.5-26.99,8.32ZM343.43,249.68l26.99-8.32-12.15-39.41-26.99,8.32,12.15,39.41Z',
  'M423.43,234.66l-34.67-61.51,12.3-6.93,27.74,49.21,24.6-13.87,6.93,12.3-36.91,20.8Z',
  'M488.17,194.98l-41.24-57.31,11.46-8.25,41.24,57.31-11.46,8.25Z'
]

/** The height the drop was tuned at on the blog; everything scales from it. */
const TUNED_HEIGHT = 80
const DURATIONS_MS = [620, 720, 580, 760, 660, 700, 600, 680]
const TRAVEL_PX = [22, -18, 24, -16, 20, -22, 18, -20]
const STAGGER_MS = 110

/**
 * The mark the blog wears, animated the way the blog animates it: every glyph
 * falls in from a different height, overshoots twice and settles, on a shuffled
 * stagger, so no two arrivals are quite the same. It plays on arrival and again
 * whenever the pointer comes back to it.
 */
export function Wordmark() {
  const mark = useRef<SVGSVGElement>(null)

  const play = useCallback(() => {
    const svg = mark.current
    if (svg === null || prefersReducedMotion()) return

    const glyphs = Array.from(svg.querySelectorAll('path'))
    if (glyphs.length === 0 || !canAnimate(glyphs[0])) return

    const drawnAt = svg.getBoundingClientRect().height
    const scale = (drawnAt === 0 ? TUNED_HEIGHT : drawnAt) / TUNED_HEIGHT
    const durations = shuffled(DURATIONS_MS)
    const travels = shuffled(TRAVEL_PX)
    const delays = shuffled(glyphs.map((_, glyph) => glyph * STAGGER_MS))

    glyphs.forEach((glyph, index) => {
      glyph.getAnimations().forEach((running) => running.cancel())

      const fall = glyph.animate(drop(travels[index] * scale, scale), {
        duration: durations[index],
        delay: delays[index],
        fill: 'forwards',
        easing: 'ease-out'
      })

      // Held frames pile up on a mark that replays; let each go once it lands.
      fall.finished.then(() => fall.cancel()).catch(() => {})
    })
  }, [])

  useEffect(() => {
    play()
  }, [play])

  return (
    <a
      className='wordmark'
      href={BLOG_URL}
      title='Mat Poli — the blog this game came from'
      onMouseEnter={play}
    >
      <svg
        ref={mark}
        className='wordmark__mark'
        xmlns='http://www.w3.org/2000/svg'
        viewBox='0 0 528.56 289.13'
        fill='currentColor'
        role='img'
        aria-label='Mat Poli'
      >
        {GLYPHS.map((glyph, index) => (
          <path key={index} d={glyph} />
        ))}
      </svg>
    </a>
  )
}

/** In from off its place, two shrinking overshoots, then still. */
function drop(travel: number, scale: number): Keyframe[] {
  const back = travel > 0 ? 1 : -1
  const overshoot = (units: number, least: number) =>
    Math.max(least, Math.round(units * scale))

  return [
    { transform: `translateY(${Math.round(travel)}px)`, opacity: 0, offset: 0 },
    {
      transform: `translateY(${-back * overshoot(9, 2)}px)`,
      opacity: 1,
      offset: 0.5
    },
    {
      transform: `translateY(${back * overshoot(5, 1)}px)`,
      opacity: 1,
      offset: 0.72
    },
    {
      transform: `translateY(${-back * overshoot(2, 1)}px)`,
      opacity: 1,
      offset: 0.88
    },
    { transform: 'translateY(0)', opacity: 1, offset: 1 }
  ]
}

function shuffled<T>(values: readonly T[]): T[] {
  const deck = [...values]

  for (let index = deck.length - 1; index > 0; index--) {
    const swap = Math.floor(Math.random() * (index + 1))
    ;[deck[index], deck[swap]] = [deck[swap], deck[index]]
  }
  return deck
}

/**
 * A browser without the Web Animations API simply shows the mark where it
 * belongs — the same bargain the confetti and the sound effects make.
 */
function canAnimate(glyph: SVGPathElement): boolean {
  return (
    typeof glyph.animate === 'function' &&
    typeof glyph.getAnimations === 'function'
  )
}

/*
 * Read when the mark plays rather than subscribed to, because that is the only
 * moment it matters.
 */
function prefersReducedMotion(): boolean {
  if (typeof window.matchMedia !== 'function') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}
