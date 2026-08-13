import { useCallback, useRef, useState } from 'react'
import { animate } from 'motion/react'
import { canPourBetween } from '../domain/board'
import { topElixir } from '../domain/flask'
import type { AnimationPlaybackControls } from 'motion/react'
import type { RefObject } from 'react'
import type { Board } from '../domain/board'
import type { Elixir, Flask } from '../domain/flask'

/**
 * The elixir falling out of a tipped flask, placed against the bench it falls
 * onto rather than against the page.
 */
export interface Stream {
  readonly elixir: Elixir
  readonly left: number
  readonly top: number
  readonly height: number
}

/*
 * The choreography, in the order a player watches it: the flask lifts out of
 * its place and swings over the mouth of the one it is filling, tips, and the
 * elixir falls. The bench changes at the moment the stream appears, so the
 * layers leave one flask and arrive in the other while the elixir is visibly
 * between them.
 */
const LIFT_SECONDS = 0.26
const STREAM_SECONDS = 0.15
const DRAIN_SECONDS = 0.1
const RETURN_SECONDS = 0.24
const TILT_DEGREES = 104
/** How far above the target's mouth the tipped flask hangs, in pixels. */
const POURING_HEIGHT = 26

interface Flight {
  readonly x: number
  readonly y: number
  readonly rotate: number
  readonly stream: Stream
}

interface PourFlightProps {
  readonly board: Board
  readonly selectedIndex: number | null
  /** The bench, which the stream is positioned against. */
  readonly bench: RefObject<HTMLElement | null>
  /** Each flask's place on the bench, which is what flies rather than the
   *  flask itself: the flask is already animating its own selection. */
  readonly slots: RefObject<(HTMLElement | null)[]>
  /** Hands the tap on to the game once the elixir has somewhere to land. */
  readonly onTap: (index: number) => void
}

export function usePourFlight({
  board,
  selectedIndex,
  bench,
  slots,
  onTap
}: PourFlightProps) {
  const [stream, setStream] = useState<Stream | null>(null)
  const inFlight = useRef<Pouring | null>(null)

  const tapFlask = useCallback(
    (index: number) => {
      /*
       * A player chaining pours is never made to wait for the animation: a tap
       * arriving mid-flight lands the elixir at once and puts the flask back.
       * The tap that interrupted is then read against the bench as it now
       * stands, not against the one this render was drawn from.
       */
      if (inFlight.current !== null) {
        inFlight.current.cutShort()
        inFlight.current = null
        onTap(index)
        return
      }

      const source = selectedIndex
      const isPour =
        source !== null &&
        source !== index &&
        canPourBetween(board, source, index)

      if (!isPour) {
        onTap(index)
        return
      }

      const flask = slots.current?.[source]
      const filling = slots.current?.[index]
      const flight =
        flask && filling
          ? flightBetween(bench.current, flask, filling, board[source])
          : null

      if (!flask || flight === null) {
        onTap(index)
        return
      }

      const pouring = pourOver(flask, flight, setStream, () => onTap(index))
      inFlight.current = pouring

      // Nothing waits on the choreography: the tap is over, and the bench is
      // told about the pour from inside it.
      pouring.finished.then(() => {
        if (inFlight.current === pouring) inFlight.current = null
      })
    },
    [board, selectedIndex, bench, slots, onTap]
  )

  return { tapFlask, stream }
}

interface Pouring {
  readonly finished: Promise<void>
  /** Lands the elixir now and puts the flask straight back on the bench. */
  readonly cutShort: () => void
}

function pourOver(
  flask: HTMLElement,
  flight: Flight,
  showStream: (stream: Stream | null) => void,
  settle: () => void
): Pouring {
  let travelling: AnimationPlaybackControls | null = null
  let landed = false
  let cut = false

  // The bench takes the pour exactly once, whether the elixir got there by
  // falling or by the player cutting the fall short.
  const land = () => {
    if (landed) return
    landed = true
    settle()
  }

  const putBack = () => {
    showStream(null)
    /*
     * Back through motion rather than by clearing the inline style: motion owns
     * the transform it wrote, and a flask whose style is wiped out from under
     * it is left hanging over the bench where it was cut off.
     */
    animate(flask, { x: 0, y: 0, rotate: 0 }, { duration: 0 })
    flask.style.zIndex = ''
    flask.style.pointerEvents = ''
  }

  const fall = async () => {
    // Above every other flask for as long as it is over one of them, and deaf
    // to taps for just as long: a flask crossing the bench passes over the ones
    // the player is reaching for, and must not catch a tap meant for them.
    flask.style.zIndex = '5'
    flask.style.pointerEvents = 'none'

    travelling = animate(
      flask,
      { x: flight.x, y: flight.y, rotate: flight.rotate },
      { duration: LIFT_SECONDS, ease: [0.32, 0.72, 0.35, 1] }
    )
    await travelling.finished
    if (cut) return

    land()
    showStream(flight.stream)
    await wait(STREAM_SECONDS + DRAIN_SECONDS)
    if (cut) return
    showStream(null)

    travelling = animate(
      flask,
      { x: 0, y: 0, rotate: 0 },
      { duration: RETURN_SECONDS, ease: [0.32, 0.72, 0.35, 1] }
    )
    await travelling.finished
    if (cut) return

    flask.style.zIndex = ''
    flask.style.pointerEvents = ''
  }

  return {
    finished: fall(),
    cutShort: () => {
      cut = true
      travelling?.stop()
      land()
      putBack()
    }
  }
}

function wait(seconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, seconds * 1000))
}

/**
 * Where the flask has to travel to hang over the mouth it is filling, or null
 * when there is nothing to watch: a player who asked for less motion, or a
 * bench that has not been laid out yet and has no positions to fly between.
 */
function flightBetween(
  bench: HTMLElement | null,
  source: HTMLElement,
  target: HTMLElement,
  poured: Flask
): Flight | null {
  const elixir = topElixir(poured)
  if (prefersReducedMotion()) return null
  if (bench === null || elixir === null) return null

  const benchAt = bench.getBoundingClientRect()
  const from = source.getBoundingClientRect()
  const onto = target.getBoundingClientRect()

  /*
   * The flask parks beside the one it is filling and tips its mouth over it, so
   * it leans towards the target and never away: coming from the left it turns
   * clockwise, and coming from the right it turns back the other way.
   */
  const fromTheRight = from.left > onto.left
  const lip = fromTheRight ? onto.right : onto.left

  return {
    x: lip - from.left - (fromTheRight ? 0 : from.width),
    y: onto.top - from.top - POURING_HEIGHT,
    rotate: fromTheRight ? -TILT_DEGREES : TILT_DEGREES,
    stream: {
      elixir,
      left: onto.left + onto.width / 2 - benchAt.left,
      top: onto.top - benchAt.top,
      height: onto.height * 0.6
    }
  }
}

/*
 * Read at the moment a pour starts rather than subscribed to, which is the same
 * bargain the climbing score makes: the preference takes effect on the very
 * next pour, and nothing has to be torn down when it changes.
 */
function prefersReducedMotion(): boolean {
  if (typeof window.matchMedia !== 'function') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}
