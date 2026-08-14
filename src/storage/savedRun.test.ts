import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  forgetSavedRun,
  readSavedRun,
  rememberBench,
  rememberCampaign
} from './savedRun'
import { seal } from '../domain/vault'
import { lendStorage, refuseToRemember } from '../test/storage'
import type { SavedBench, SavedCampaign } from './savedRun'

const halfway: SavedCampaign = {
  reached: 6,
  earned: 4200,
  forfeited: 100,
  rebirths: 1
}

const midPour: SavedBench = {
  levelId: 'apprentice',
  pours: 3,
  board: [
    { capacity: 4, contents: ['crimson', 'azure'] },
    { capacity: 4, contents: [] }
  ]
}

/** Whatever the game wrote, whichever key it chose to write it under. */
const onlyEntry = (kept: Map<string, string>): [string, string] => {
  const entries = [...kept.entries()]
  expect(entries).toHaveLength(1)
  return entries[0]
}

const editOneCharacter = (sealed: string): string => {
  const at = Math.floor(sealed.length / 2)
  const different = sealed[at] === 'A' ? 'B' : 'A'
  return sealed.slice(0, at) + different + sealed.slice(at + 1)
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('savedRun', () => {
  it('has nothing to hand back before a run has been saved', () => {
    lendStorage()

    expect(readSavedRun()).toBeNull()
  })

  it('hands back the campaign it was given', () => {
    lendStorage()

    rememberCampaign(halfway)

    expect(readSavedRun()).toEqual({ campaign: halfway, bench: null })
  })

  it('keeps the bench the apprentice is standing at alongside the campaign', () => {
    lendStorage()

    rememberCampaign(halfway)
    rememberBench(midPour)

    expect(readSavedRun()).toEqual({ campaign: halfway, bench: midPour })
  })

  it('leaves the bench standing when only the campaign moves on', () => {
    lendStorage()
    rememberBench(midPour)

    rememberCampaign(halfway)

    expect(readSavedRun()?.bench).toEqual(midPour)
  })

  it('leaves the campaign standing when only the bench changes', () => {
    lendStorage()
    rememberCampaign(halfway)

    rememberBench(midPour)

    expect(readSavedRun()?.campaign).toEqual(halfway)
  })

  it('writes nothing a player could read a score off', () => {
    const kept = lendStorage()

    rememberCampaign(halfway)

    expect(onlyEntry(kept)[1]).not.toContain('4200')
  })

  it('refuses a save the player has edited', () => {
    const kept = lendStorage()
    rememberCampaign(halfway)
    const [key, sealed] = onlyEntry(kept)

    kept.set(key, editOneCharacter(sealed))

    expect(readSavedRun()).toBeNull()
  })

  it('refuses a score typed straight into storage', () => {
    const kept = lendStorage()
    rememberCampaign(halfway)
    const [key] = onlyEntry(kept)

    kept.set(key, JSON.stringify({ campaign: { ...halfway, earned: 999999 } }))

    expect(readSavedRun()).toBeNull()
  })

  /*
   * A save sealed by an older build of the game, whose shape has since moved
   * on. The seal is sound, so only the shape can turn it away — and it has to,
   * because the game would otherwise lay a bench out from nonsense.
   */
  it('refuses a properly sealed save that is not a run at all', () => {
    const kept = lendStorage()
    rememberCampaign(halfway)
    const [key] = onlyEntry(kept)

    kept.set(key, seal({ campaign: { earned: 'lots' } }))

    expect(readSavedRun()).toBeNull()
  })

  /*
   * A bench is the one part of a run that can be given up on its own: laying a
   * fresh one out costs the apprentice the pours they had spent, but it beats
   * throwing away a campaign that is still perfectly readable.
   */
  it('drops a bench it no longer understands without losing the campaign', () => {
    const kept = lendStorage()
    rememberCampaign(halfway)
    const [key] = onlyEntry(kept)

    kept.set(key, seal({ campaign: halfway, bench: { levelId: 7 } }))

    expect(readSavedRun()).toEqual({ campaign: halfway, bench: null })
  })

  it('drops a bench whose board is not a board at all', () => {
    const kept = lendStorage()
    rememberCampaign(halfway)
    const [key] = onlyEntry(kept)

    kept.set(
      key,
      seal({
        campaign: halfway,
        bench: { levelId: 'apprentice', pours: 1, board: 'a bench, honest' }
      })
    )

    expect(readSavedRun()?.bench).toBeNull()
  })

  /*
   * One bad flask condemns the whole board rather than being quietly dropped
   * from it: a bench missing a flask is a puzzle that may no longer be
   * solvable, which is worse than laying the level out again.
   */
  it('drops a board holding anything that is not a flask', () => {
    const kept = lendStorage()
    rememberCampaign(halfway)
    const [key] = onlyEntry(kept)

    kept.set(
      key,
      seal({
        campaign: halfway,
        bench: {
          levelId: 'apprentice',
          pours: 1,
          board: [{ capacity: 4, contents: [] }, { capacity: 'four' }]
        }
      })
    )

    expect(readSavedRun()?.bench).toBeNull()
  })

  it('refuses a save that has a bench but no campaign to put it in', () => {
    const kept = lendStorage()
    rememberCampaign(halfway)
    const [key] = onlyEntry(kept)

    kept.set(key, seal({ bench: midPour }))

    expect(readSavedRun()).toBeNull()
  })

  it('remembers nothing where the browser refuses to store anything', () => {
    refuseToRemember()

    rememberCampaign(halfway)

    expect(readSavedRun()).toBeNull()
  })

  /*
   * Erasing a run has to take the save with it rather than write an empty one
   * over the top: what the apprentice asked for is to be gone from the machine.
   */
  it('leaves nothing behind when the run is forgotten', () => {
    const kept = lendStorage()
    rememberCampaign(halfway)
    rememberBench(midPour)

    forgetSavedRun()

    expect([...kept.entries()]).toEqual([])
  })

  it('has nothing to hand back once the run has been forgotten', () => {
    lendStorage()
    rememberCampaign(halfway)

    forgetSavedRun()

    expect(readSavedRun()).toBeNull()
  })

  it('forgets what it can where the browser refuses to be asked', () => {
    refuseToRemember()

    expect(() => forgetSavedRun()).not.toThrow()
  })
})
