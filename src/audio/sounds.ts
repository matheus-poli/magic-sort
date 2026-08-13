import { Howl } from 'howler'
import completeUrl from './complete.wav'
import pickupUrl from './pickup.wav'
import pourUrl from './pour.wav'
import refusedUrl from './refused.wav'
import victoryUrl from './victory.wav'

export type SoundName = 'pickup' | 'pour' | 'refused' | 'complete' | 'victory'

const sources: Record<SoundName, string> = {
  pickup: pickupUrl,
  pour: pourUrl,
  refused: refusedUrl,
  complete: completeUrl,
  victory: victoryUrl
}

const isAudioAvailable =
  typeof window !== 'undefined' && 'AudioContext' in window

const loaded = new Map<SoundName, Howl>()

export function playSound(name: SoundName): void {
  if (!isAudioAvailable) return
  soundFor(name).play()
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
