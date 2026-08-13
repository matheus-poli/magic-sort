import { useEffect } from 'react'
import { animate, motion, useMotionValue, useTransform } from 'motion/react'

/** How long the climb takes, however far the number has to travel. */
const CLIMB_SECONDS = 0.55

interface CountingNumberProps {
  readonly value: number
}

/**
 * A number that climbs to its new value instead of snapping to it, so points
 * feel earned rather than assigned. The climb runs on motion's own frame loop
 * and writes straight to the DOM, so React re-renders once per change, not
 * once per frame.
 */
export function CountingNumber({ value }: CountingNumberProps) {
  const climbing = useMotionValue(value)
  const shown = useTransform(climbing, Math.round)
  const climbs = !prefersReducedMotion()

  useEffect(() => {
    if (!climbs) return

    const climb = animate(climbing, value, {
      duration: CLIMB_SECONDS,
      ease: 'easeOut'
    })

    return () => climb.stop()
  }, [climbing, climbs, value])

  // Asked for less motion, the number is plain text: no frame loop at all, so
  // there is never a stale digit waiting for the next frame to catch up.
  return <motion.span>{climbs ? shown : value}</motion.span>
}

/*
 * Read when a number changes rather than subscribed to, because that is the
 * only moment it matters: a player who turns the preference on mid-game gets
 * the settled number on their very next point.
 */
function prefersReducedMotion(): boolean {
  if (typeof window.matchMedia !== 'function') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}
