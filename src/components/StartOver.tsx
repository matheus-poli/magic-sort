import { useEffect, useId, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { playSound, warmSound } from '../audio/sounds'
import { POINTS_LOST_PER_START_OVER } from '../domain/scoring'

interface StartOverProps {
  /** Where the apprentice is, so the warning can name what is at stake. */
  readonly position: number
  readonly levelCount: number
  readonly total: number
  readonly onStartOver: () => void
}

/**
 * Sends the apprentice back to the first bench of the atelier with the points
 * they have earned still on them, for the price of a flawless bench. It asks
 * first, in a dialog that names that price — and it is hand rolled rather than
 * a <dialog>, because jsdom has no showModal and this is behaviour the
 * integration tests have to be able to drive.
 */
export function StartOver({
  position,
  levelCount,
  total,
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
    playSound('revive')
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
              <h2 className='confirm__title' id={titleId}>
                Start the whole atelier over?
              </h2>
              <p className='confirm__detail' id={costId}>
                You are on level {position} of {levelCount} with {total} points.
                Starting over puts you back on the first bench and costs{' '}
                {POINTS_LOST_PER_START_OVER} points.
              </p>

              <div className='confirm__actions'>
                <button
                  type='button'
                  className='button button--danger'
                  onClick={startOver}
                >
                  Yes, start over
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
