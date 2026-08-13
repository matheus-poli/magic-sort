import { useId } from 'react'
import { motion } from 'motion/react'
import { POINTS_LOST_PER_RESTART } from '../domain/scoring'
import { HOLD_MS, useHold } from '../hooks/useHold'
import type { KeyboardEvent } from 'react'

/** How quickly the bar drains when the apprentice changes their mind. */
const DRAIN_SECONDS = 0.18

interface HoldToRestartProps {
  readonly onRestart: () => void
  /** What restarts have already cost, so the price is never a surprise. */
  readonly forfeited: number
}

/**
 * Restarting throws away a bench in progress and costs the campaign points, so
 * it asks for more than a click: the button has to be held while a bar fills,
 * and letting go calls the whole thing off.
 */
export function HoldToRestart({ onRestart, forfeited }: HoldToRestartProps) {
  const hold = useHold(onRestart)
  const costId = useId()

  return (
    <div className='restart'>
      <button
        type='button'
        className='button hold'
        aria-describedby={costId}
        data-charging={hold.isHolding}
        onPointerDown={hold.start}
        onPointerUp={hold.cancel}
        onPointerLeave={hold.cancel}
        onPointerCancel={hold.cancel}
        onKeyDown={(event) => {
          if (isPress(event) && !event.repeat) hold.start()
        }}
        onKeyUp={(event) => {
          if (isPress(event)) hold.cancel()
        }}
        // Losing the button mid-press is letting go of it.
        onBlur={hold.cancel}
      >
        <span className='hold__label'>Hold to restart</span>

        {/*
         * The bar is driven from the same constant as the press it is measuring,
         * rather than a CSS duration that could drift away from it. It keeps
         * filling under reduced motion on purpose: it is a clock, not decor.
         */}
        <motion.span
          className='hold__fill'
          aria-hidden='true'
          initial={false}
          animate={{ scaleX: hold.isHolding ? 1 : 0 }}
          transition={
            hold.isHolding
              ? { duration: HOLD_MS / 1000, ease: 'linear' }
              : { duration: DRAIN_SECONDS, ease: 'easeOut' }
          }
        />
      </button>

      <p className='restart__cost' id={costId}>
        Restarting costs {POINTS_LOST_PER_RESTART} points.
        {forfeited > 0 && ` Restarts have cost you ${forfeited} so far.`}
      </p>
    </div>
  )
}

function isPress(event: KeyboardEvent<HTMLButtonElement>): boolean {
  return event.key === 'Enter' || event.key === ' '
}
