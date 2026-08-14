import { describe, expect, it } from 'vitest'
import { endOfRun } from './runsEnd'
import { emptyFlask } from './flask'
import type { Board } from './board'
import type { Elixir, Flask } from './flask'

/** A glass of a given size, holding whatever has been poured into it so far. */
function glass(capacity: number, ...contents: Elixir[]): Flask {
  return { capacity, contents }
}

/** A bench mid-sort, with a spare flask and every pour still open to it. */
const openBench: Board = [glass(4, 'crimson', 'azure'), emptyFlask(4)]

/** A bench with nothing left to pour: both flasks full, and their tops clash. */
const stuckBench: Board = [
  glass(4, 'crimson', 'crimson', 'crimson', 'azure'),
  glass(4, 'azure', 'azure', 'azure', 'crimson')
]

describe('endOfRun', () => {
  it('leaves a run open while there are pours left and points to earn', () => {
    expect(
      endOfRun({ board: openBench, banked: 0, bench: 0, position: 1 })
    ).toBeNull()
  })

  it('buries an apprentice no bench in the atelier could pay out of debt', () => {
    expect(
      endOfRun({ board: openBench, banked: -4200, bench: 0, position: 1 })
    ).toEqual({ kind: 'buried', debt: 4200 })
  })

  /* The bench in hand has already earned some of the debt back, and the card
     that names what is owed must not ask for points already paid. */
  it('counts what the bench has earned so far into the debt it names', () => {
    expect(
      endOfRun({ board: openBench, banked: -4200, bench: 300, position: 1 })
    ).toEqual({ kind: 'buried', debt: 3900 })
  })

  it('ends the run of an apprentice stuck on a bench they cannot lay out again', () => {
    expect(
      endOfRun({ board: stuckBench, banked: -950, bench: 0, position: 1 })
    ).toEqual({ kind: 'stuck', price: 100 })
  })

  /* Being stuck is only the end of a run when the way out of it is priced out
     of reach: an apprentice who can pay for a restart is merely stuck. */
  it('leaves a stuck apprentice who can pay for a restart to go and take it', () => {
    expect(
      endOfRun({ board: stuckBench, banked: -400, bench: 0, position: 1 })
    ).toBeNull()
  })

  it('leaves an apprentice with pours left alone, however dear a restart is', () => {
    expect(
      endOfRun({ board: openBench, banked: -950, bench: 0, position: 1 })
    ).toBeNull()
  })

  /* Debt is the deeper of the two endings: it is the one the apprentice cannot
     sort their way out of even with a bench they could still pour on. */
  it('names the debt rather than the bench when both have ended the run', () => {
    expect(
      endOfRun({ board: stuckBench, banked: -4200, bench: 0, position: 1 })
    ).toEqual({ kind: 'buried', debt: 4200 })
  })

  it('prices the restart by the bench the apprentice is stuck on', () => {
    expect(
      endOfRun({ board: stuckBench, banked: -4800, bench: 0, position: 5 })
    ).toEqual({ kind: 'stuck', price: 500 })
  })
})
