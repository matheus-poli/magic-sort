import { Howl } from 'howler'
import chargeUrl from './charge.wav'
import completeUrl from './complete.wav'
import pickupUrl from './pickup.wav'
import pourUrl from './pour.wav'
import refusedUrl from './refused.wav'
import resetUrl from './reset.wav'
import reviveUrl from './revive.wav'
import victoryUrl from './victory.wav'

export type SoundName =
  | 'pickup'
  | 'pour'
  | 'refused'
  | 'complete'
  | 'charge'
  | 'reset'
  | 'revive'
  | 'victory'

const sources: Record<SoundName, string> = {
  pickup: pickupUrl,
  pour: pourUrl,
  refused: refusedUrl,
  complete: completeUrl,
  charge: chargeUrl,
  reset: resetUrl,
  revive: reviveUrl,
  victory: victoryUrl
}

const isAudioAvailable =
  typeof window !== 'undefined' && 'AudioContext' in window

const loaded = new Map<SoundName, Howl>()

export function playSound(name: SoundName): void {
  if (!isAudioAvailable) return
  soundFor(name).play()
}

/**
 * Cuts a sound off mid-play, for the one that is not an event but a state: the
 * restart charging up, which has to fall silent the moment the hold is let go.
 */
export function stopSound(name: SoundName): void {
  loaded.get(name)?.stop()
}

// Loading on first play keeps the initial page weight down and sidesteps
// browsers that only allow audio after a user gesture.
function soundFor(name: SoundName): Howl {
  const existing = loaded.get(name)
  if (existing !== undefined) return existing

  const howl = new Howl({ src: [sources[name]], volume: 0.55 })
  loaded.set(name, howl)
  return howl
}
