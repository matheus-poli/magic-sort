import { vi } from 'vitest'

/*
 * Storage is a boundary the tests have to lend, because this environment has
 * none: Node ships a Web Storage of its own that is switched off unless it is
 * given a file, and it shadows the one jsdom would otherwise have provided.
 */

/**
 * A storage that works, handing back what it is holding so that a test can
 * play the part of a player editing the save behind the game's back.
 */
export function lendStorage(): Map<string, string> {
  const kept = new Map<string, string>()
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => kept.get(key) ?? null,
    setItem: (key: string, value: string) => kept.set(key, value),
    removeItem: (key: string) => kept.delete(key)
  })
  return kept
}

/** A storage that throws, which is what a private or hardened browser does. */
export function refuseToRemember(): void {
  vi.stubGlobal('localStorage', {
    getItem: () => {
      throw new Error('Storage is disabled')
    },
    setItem: () => {
      throw new Error('Storage is disabled')
    },
    removeItem: () => {
      throw new Error('Storage is disabled')
    }
  })
}
