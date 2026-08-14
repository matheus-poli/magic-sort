import { motion } from 'motion/react'
import { useHold } from '../hooks/useHold'
import type { KeyboardEvent } from 'react'

/**
 * How long the press has to last, and the length of the charge sound in
 * scripts/generate-sounds.mjs. Five seconds is a great deal longer than the
 * restart asks for, and deliberately so: this is the one press in the game
 * that cannot be taken back, and it has to be long enough that nobody arrives
 * at the end of it by accident.
 */
export const ERASE_HOLD_MS = 5000

/** How quickly the dial empties when the apprentice changes their mind. */
const DRAIN_SECONDS = 0.3

interface HoldToEraseProps {
  /** Throws the whole run away: every point, every bench, and the save. */
  readonly onErase: () => void
}

/**
 * The way out of a run that has gone wrong, in the corner where a player looks
 * for the thing they are not supposed to press. Held rather than clicked, and
 * held for a long time, with a dial filling to say how much longer.
 */
export function HoldToErase({ onErase }: HoldToEraseProps) {
  const hold = useHold({
    duration: ERASE_HOLD_MS,
    charge: 'wipeCharge',
    done: 'wipe',
    onHeld: onErase
  })

  return (
    <button
      type='button'
      className='erase'
      title='Erasing throws away every point and every bench of this run. It cannot be undone.'
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
      {/*
       * A wedge sweeping round rather than a bar filling: five seconds is long
       * enough that the dial has to read as a clock running down. It is drawn
       * as a circle stroked to its own centre, so that one animated length
       * sweeps the whole face. Like the restart's bar it keeps filling under
       * reduced motion, because it is the press made visible.
       */}
      <svg className='erase__dial' viewBox='0 0 32 32' aria-hidden='true'>
        <circle className='erase__face' cx='16' cy='16' r='15' />
        <motion.circle
          className='erase__wedge'
          cx='16'
          cy='16'
          r='8'
          strokeWidth='16'
          transform='rotate(-90 16 16)'
          initial={false}
          animate={{ pathLength: hold.isHolding ? 1 : 0 }}
          transition={
            hold.isHolding
              ? { duration: ERASE_HOLD_MS / 1000, ease: 'linear' }
              : { duration: DRAIN_SECONDS, ease: 'easeOut' }
          }
        />
      </svg>

      <span className='erase__label'>Hold to erase this run</span>
    </button>
  )
}

function isPress(event: KeyboardEvent<HTMLButtonElement>): boolean {
  return event.key === 'Enter' || event.key === ' '
}
