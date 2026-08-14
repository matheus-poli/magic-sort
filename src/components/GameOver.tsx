import { useEffect, useId } from 'react'
import { motion } from 'motion/react'
import { playSound, warmSound } from '../audio/sounds'

interface GameOverProps {
  /** What the apprentice owes, which no bench left could pay back. */
  readonly debt: number
  /** Opens a run from nothing, which is all there is left to do. */
  readonly onBeginAgain: () => void
}

/**
 * The end of a run: the apprentice owes the atelier more than a flawless bench
 * could ever pay back, so there is nothing left to sort their way out of. It is
 * hand rolled rather than a <dialog>, for the same reason the rebirth's warning
 * is — jsdom has no showModal, and this is behaviour the tests have to drive.
 */
export function GameOver({ debt, onBeginAgain }: GameOverProps) {
  const titleId = useId()
  const debtId = useId()

  useEffect(() => {
    playSound('defeat')
    // The card is read before it is answered, and that is exactly long enough
    // to fetch the recorded track the answer plays.
    warmSound('revive')
  }, [])

  const beginAgain = () => {
    playSound('revive')
    onBeginAgain()
  }

  return (
    <motion.div
      className='veil'
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className='confirm confirm--ruin'
        role='alertdialog'
        aria-modal='true'
        aria-labelledby={titleId}
        aria-describedby={debtId}
        initial={{ scale: 0.92, y: 18 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 24 }}
      >
        <h2 className='confirm__title' id={titleId}>
          Game over
        </h2>
        <p className='confirm__detail' id={debtId}>
          You owe {debt} points, and no bench in the atelier could pay that
          back. The workshop has been swept clean.
        </p>

        <div className='confirm__actions'>
          <button
            type='button'
            className='button button--primary button--wide'
            autoFocus
            onClick={beginAgain}
          >
            Begin a new run
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
