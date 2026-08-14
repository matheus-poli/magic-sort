import { useEffect, useId, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { playSound, warmSound } from '../audio/sounds'

interface StartOverProps {
  /** Where the apprentice is, so the warning can name what is at stake. */
  readonly position: number
  readonly levelCount: number
  readonly total: number
  /** What the walk back to the first bench costs from where they stand. */
  readonly price: number
  /** Whether that price is more than the apprentice has to pay it with. */
  readonly wouldEndTheRun: boolean
  readonly onStartOver: () => void
}

/**
 * Sends the apprentice back to the first bench of the atelier with the points
 * they have earned still on them, for the price of the atelier behind them. It
 * asks first, in a dialog that names that price — and it is hand rolled rather
 * than a <dialog>, because jsdom has no showModal and this is behaviour the
 * integration tests have to be able to drive.
 *
 * An apprentice who cannot pay is being offered the end of their run rather
 * than a walk back, and the dialog says so both ways round: in what it warns
 * and in what the answer is called.
 */
export function StartOver({
  position,
  levelCount,
  total,
  price,
  wouldEndTheRun,
  onStartOver
}: StartOverProps) {
  const [isAsking, setIsAsking] = useState(false)
  const titleId = useId()
  const costId = useId()

  useEffect(() => {
    if (!isAsking) return

    const keepPlaying = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsAsking(false)
    }

    window.addEventListener('keydown', keepPlaying)
    return () => window.removeEventListener('keydown', keepPlaying)
  }, [isAsking])

  const startOver = () => {
    setIsAsking(false)
    // A walk back nobody comes back from is not a rebirth, and must not sound
    // like one: the ruin that follows has a voice of its own.
    if (!wouldEndTheRun) playSound('revive')
    onStartOver()
  }

  return (
    <>
      <button
        type='button'
        className='button button--quiet'
        onClick={() => {
          // The dialog is a decision that takes a moment, and that moment is
          // exactly long enough to fetch the sound the answer plays.
          warmSound('revive')
          setIsAsking(true)
        }}
      >
        Start over
      </button>

      <AnimatePresence>
        {isAsking && (
          <motion.div
            className='veil'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className='confirm'
              role='alertdialog'
              aria-modal='true'
              aria-labelledby={titleId}
              aria-describedby={costId}
              initial={{ scale: 0.92, y: 18 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 24 }}
            >
              {/* The question has to be the one being answered: an apprentice
                  who cannot pay for the walk back is being asked about the end
                  of their run, not about the atelier. */}
              <h2 className='confirm__title' id={titleId}>
                {wouldEndTheRun
                  ? 'End this run?'
                  : 'Start the whole atelier over?'}
              </h2>
              <p className='confirm__detail' id={costId}>
                You are on level {position} of {levelCount} with {total} points.
                Starting over puts you back on the first bench and costs {price}{' '}
                points.
                {wouldEndTheRun &&
                  ' That is more than you have: it would end your run.'}
              </p>

              <div className='confirm__actions'>
                {/* The answer names what it actually does: an apprentice who
                    cannot pay for the walk back is not starting anything over,
                    they are ending the run. */}
                <button
                  type='button'
                  className='button button--danger'
                  onClick={startOver}
                >
                  {wouldEndTheRun ? 'Yes, end my run' : 'Yes, start over'}
                </button>
                {/* The way out takes the focus: this dialog opens on a
                    destructive question, and the answer should not be armed. */}
                <button
                  type='button'
                  className='button'
                  autoFocus
                  onClick={() => setIsAsking(false)}
                >
                  Keep playing
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
