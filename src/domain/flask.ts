/** The elixirs an apprentice sorts. One colour per flask is the goal. */
export type Elixir = 'crimson' | 'azure' | 'verdant' | 'amber'

/** Layers of elixir, bottom-most first. The last entry is the visible top. */
export type Flask = readonly Elixir[]

export interface PourResult {
  readonly source: Flask
  readonly target: Flask
}

export const FLASK_CAPACITY = 4

export function topElixir(flask: Flask): Elixir | null {
  return flask.at(-1) ?? null
}

export function isEmpty(flask: Flask): boolean {
  return flask.length === 0
}

export function isComplete(flask: Flask): boolean {
  return flask.length === FLASK_CAPACITY && isPure(flask)
}

export function canPour(source: Flask, target: Flask): boolean {
  if (source === target || isEmpty(source) || freeSpace(target) === 0) {
    return false
  }
  return isEmpty(target) || topElixir(target) === topElixir(source)
}

export function pour(source: Flask, target: Flask): PourResult {
  if (!canPour(source, target)) {
    throw new Error(describeRefusal(source, target))
  }

  const volume = Math.min(topRunSize(source), freeSpace(target))
  const poured = source.slice(source.length - volume)

  return {
    source: source.slice(0, source.length - volume),
    target: [...target, ...poured]
  }
}

function isPure(flask: Flask): boolean {
  return flask.every((elixir) => elixir === flask[0])
}

function freeSpace(flask: Flask): number {
  return FLASK_CAPACITY - flask.length
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

function describeRefusal(source: Flask, target: Flask): string {
  if (source === target) return 'Cannot pour a flask into itself'
  if (isEmpty(source)) return 'Cannot pour from an empty flask'
  if (freeSpace(target) === 0) {
    return `Cannot pour ${topElixir(source)} into a full flask`
  }
  return `Cannot pour ${topElixir(source)} onto ${topElixir(target)}`
}
