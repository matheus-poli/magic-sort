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
  it('leaves a run open while there are pours left on the bench', () => {
    expect(endOfRun({ board: openBench, banked: 0, position: 1 })).toBeNull()
  })

  it('ends the run of an apprentice stuck on a bench they cannot pay to lay out again', () => {
    expect(endOfRun({ board: stuckBench, banked: 0, position: 1 })).toEqual({
      kind: 'stuck',
      price: 100
    })
  })

  /* Being stuck is only the end of a run when the way out of it is priced out
     of reach: an apprentice who can pay for a restart is merely stuck. */
  it('leaves a stuck apprentice who can pay for a restart to go and take it', () => {
    expect(endOfRun({ board: stuckBench, banked: 100, position: 1 })).toBeNull()
  })

  it('leaves an apprentice with pours left alone, however little they have banked', () => {
    expect(endOfRun({ board: openBench, banked: 0, position: 5 })).toBeNull()
  })

  it('prices the restart by the bench the apprentice is stuck on', () => {
    expect(endOfRun({ board: stuckBench, banked: 400, position: 5 })).toEqual({
      kind: 'stuck',
      price: 500
    })
  })
})
