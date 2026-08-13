import { useEffect } from 'react'
import { AnimatePresence, motion, useAnimate } from 'motion/react'
import { isComplete } from '../domain/flask'
import { celebrateFlask } from '../effects/confetti'
import type { CSSProperties } from 'react'
import type { Flask as FlaskContents } from '../domain/flask'

/**
 * How long poured elixir takes to settle. The confetti and the wobble wait for
 * it, and the golden seal is held back by the same delay in CSS: celebrating
 * while the last layer is still on its way is what made the pour look late.
 */
const SETTLE_MS = 190

interface FlaskProps {
  /** What the player sees on the label: flasks are numbered from one. */
  readonly position: number
  readonly contents: FlaskContents
  /** Layers this bench's glass holds when full, which sets how tall it is. */
  readonly capacity: number
  readonly isSelected: boolean
  /** Tap sequence of the pour this flask just refused, or null. */
  readonly refusedAt: number | null
  readonly onTap: () => void
}

export function Flask({
  position,
  contents,
  capacity,
  isSelected,
  refusedAt,
  onTap
}: FlaskProps) {
  const [scope, animate] = useAnimate()
  const [glassScope, animateGlass] = useAnimate()
  const sealed = isComplete(contents, capacity)
  const layerHeight = `${100 / capacity}%`

  useEffect(() => {
    if (refusedAt === null) return
    animate(
      scope.current,
      { x: [0, -9, 9, -6, 6, 0] },
      { duration: 0.36, ease: 'easeInOut' }
    )
  }, [refusedAt, animate, scope])

  useEffect(() => {
    if (!sealed) return

    const settling = setTimeout(() => {
      celebrateFlask(scope.current)
      animateGlass(
        glassScope.current,
        { rotate: [0, -7, 6, -4, 2, 0], scale: [1, 1.07, 1.02, 1] },
        { duration: 0.7, ease: 'easeOut' }
      )
    }, SETTLE_MS)

    return () => clearTimeout(settling)
  }, [sealed, animateGlass, glassScope, scope])

  return (
    <motion.button
      ref={scope}
      type='button'
      className='flask'
      /* The bottle grows with the bench, so a layer is the same thickness on
         every one of them: taller glass reads as taller glass rather than as
         thinner elixir. The cast is what a custom property costs in TSX. */
      style={{ '--layers': capacity } as CSSProperties}
      data-selected={isSelected}
      data-sealed={sealed}
      aria-pressed={isSelected}
      aria-label={describeFlask(position, contents)}
      onClick={onTap}
      animate={{ y: isSelected ? -22 : 0 }}
      whileHover={{ y: isSelected ? -26 : -6 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 420, damping: 26 }}
    >
      <span ref={glassScope} className='flask__bottle'>
        <span className='flask__cork' aria-hidden='true' />
        <span className='flask__neck' aria-hidden='true' />
        <span className='flask__shoulder' aria-hidden='true' />
        <span className='flask__body'>
          <AnimatePresence initial={false}>
            {contents.map((elixir, layer) => (
              <motion.span
                key={`${layer}-${elixir}`}
                className='flask__layer'
                data-elixir={elixir}
                initial={{ height: 0 }}
                animate={{ height: layerHeight }}
                exit={{ height: 0 }}
                transition={{ duration: 0.19, ease: [0.3, 0.9, 0.4, 1] }}
              />
            ))}
          </AnimatePresence>
        </span>
        <span className='flask__shine' aria-hidden='true' />
      </span>
    </motion.button>
  )
}

function describeFlask(position: number, contents: FlaskContents): string {
  if (contents.length === 0) return `Flask ${position}, empty`
  return `Flask ${position}, holding ${contents.join(', ')} from bottom to top`
}
