import type { Board } from '../domain/board'
import type { Elixir } from '../domain/flask'

/**
 * A bench laid out in glass all of one size, which is how the atelier's earlier
 * benches are built and how a fixture wants to read. Flasks carry their own
 * capacity, so a fixture that names it once per bench says the same thing with
 * far less noise than a board of objects.
 */
export function benchOfGlass(
  capacity: number,
  ...flasks: readonly (readonly Elixir[])[]
): Board {
  return flasks.map((contents) => ({ capacity, contents }))
}
