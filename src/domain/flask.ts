/** The elixirs an apprentice sorts. One colour per flask is the goal. */
export type Elixir =
  'crimson' | 'azure' | 'verdant' | 'amber' | 'violet' | 'pearl'

/** Layers of elixir, bottom-most first. The last entry is the visible top. */
export type Flask = readonly Elixir[]

export interface PourResult {
  readonly source: Flask
  readonly target: Flask
}

/*
 * How many layers a flask holds when full is the bench's business, not the
 * flask's: the atelier keeps taller glass on its later benches, so every rule
 * about room and fullness has to be told which bench it is standing at.
 */

export function topElixir(flask: Flask): Elixir | null {
  return flask.at(-1) ?? null
}

export function isEmpty(flask: Flask): boolean {
  return flask.length === 0
}

export function isComplete(flask: Flask, capacity: number): boolean {
  return flask.length === capacity && isPure(flask)
}

export function canPour(
  source: Flask,
  target: Flask,
  capacity: number
): boolean {
  if (
    source === target ||
    isEmpty(source) ||
    freeSpace(target, capacity) === 0
  ) {
    return false
  }
  return isEmpty(target) || topElixir(target) === topElixir(source)
}

export function pour(
  source: Flask,
  target: Flask,
  capacity: number
): PourResult {
  if (!canPour(source, target, capacity)) {
    throw new Error(describeRefusal(source, target, capacity))
  }

  const volume = Math.min(topRunSize(source), freeSpace(target, capacity))
  const poured = source.slice(source.length - volume)

  return {
    source: source.slice(0, source.length - volume),
    target: [...target, ...poured]
  }
}

function isPure(flask: Flask): boolean {
  return flask.every((elixir) => elixir === flask[0])
}

function freeSpace(flask: Flask, capacity: number): number {
  return capacity - flask.length
}

/** How many layers pour out at once: the unbroken run of the top elixir. */
function topRunSize(flask: Flask): number {
  const top = topElixir(flask)
  let size = 0
  while (size < flask.length && flask[flask.length - 1 - size] === top) {
    size += 1
  }
  return size
}

function describeRefusal(
  source: Flask,
  target: Flask,
  capacity: number
): string {
  if (source === target) return 'Cannot pour a flask into itself'
  if (isEmpty(source)) return 'Cannot pour from an empty flask'
  if (freeSpace(target, capacity) === 0) {
    return `Cannot pour ${topElixir(source)} into a full flask`
  }
  return `Cannot pour ${topElixir(source)} onto ${topElixir(target)}`
}
