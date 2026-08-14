export interface RunProgress {
  readonly completedFlasks: number
  /** How many flasks a sorted bench ends up with: one per elixir. */
  readonly flasksToFill: number
  readonly pours: number
  /** The fewest pours that can sort this bench. */
  readonly minimumPours: number
  /** What this bench pays for a flawless run, which is its place in the atelier. */
  readonly worth: number
  readonly solved: boolean
}

/** What the first bench of the atelier pays. Every bench after it pays more. */
const WORTH_OF_THE_FIRST_BENCH = 1000

/**
 * A pour past the fewest possible costs a fortieth of the bench, so twenty
 * wasted pours cost the whole solving half wherever they are wasted.
 */
const POURS_THAT_COST_THE_SOLVING_HALF = 20

/**
 * What a bench pays for a flawless run: another first bench for every bench
 * sorted to reach it, so the tenth is worth ten times the first.
 *
 * The ladder is the whole economy. An apprentice who presses on into the
 * benches that are hard to sort has to out-earn one who keeps sorting the easy
 * ones and walking back to them, or the game rewards the wrong player.
 */
export function benchWorth(position: number): number {
  return WORTH_OF_THE_FIRST_BENCH * position
}

/** What throwing this bench away costs: a tenth of what it would have paid. */
export function priceOfRestart(position: number): number {
  return benchWorth(position) / 10
}

/**
 * What walking back to the first bench costs: every bench behind the apprentice
 * and the one they are standing on.
 *
 * That price is deliberately more than the walk back can pay. Sorting the
 * benches behind again earns exactly what they are worth, so charging that
 * much plus the bench in hand leaves a farmer out of pocket every time round —
 * the only way to earn in this atelier is the bench you have not sorted yet.
 */
export function priceOfRebirth(position: number): number {
  return atelierWorth(position)
}

export interface Atelier {
  readonly levelCount: number
  /** How many times the apprentice has gone back to the first bench. */
  readonly rebirths: number
}

/**
 * The ceiling on the scoreboard's total. A rebirth hands the apprentice every
 * bench to sort a second time while they keep the points from the first, so
 * each one opens another atelier's worth of points to earn.
 */
export function perfectTotal({ levelCount, rebirths }: Atelier): number {
  return atelierWorth(levelCount) * (rebirths + 1)
}

export interface CampaignProgress {
  /** Points from the benches left behind, less what restarts have cost. */
  readonly banked: number
  /** What the bench in front of the apprentice is worth right now. */
  readonly bench: number
}

/**
 * The number on the scoreboard's total. Restarts can cost more than the benches
 * have earned so far, and a campaign in debt reads as zero rather than as a
 * negative score nobody wants to look at.
 */
export function totalScore({ banked, bench }: CampaignProgress): number {
  return Math.max(0, banked + bench)
}

export function scoreFor(progress: RunProgress): number {
  return sortingPoints(progress) + solvingPoints(progress)
}

function sortingPoints({
  completedFlasks,
  flasksToFill,
  worth
}: RunProgress): number {
  return Math.round((half(worth) * completedFlasks) / flasksToFill)
}

function solvingPoints(progress: RunProgress): number {
  if (!progress.solved) return 0

  const extraPours = Math.max(0, progress.pours - progress.minimumPours)
  return Math.max(
    0,
    half(progress.worth) - extraPours * pourPenalty(progress.worth)
  )
}

/**
 * What a pour past the fewest possible costs, which is the bench's own worth
 * scaled: the price of wasting a pour has to rise with what a bench pays, or
 * the late benches would hand out their points however clumsily they were sorted.
 */
export function pourPenalty(worth: number): number {
  return half(worth) / POURS_THAT_COST_THE_SOLVING_HALF
}

/** Half a bench: what sorting it pays, and what solving it in time pays. */
function half(worth: number): number {
  return worth / 2
}

/** Every bench up to and including this one, sorted flawlessly. */
function atelierWorth(levelCount: number): number {
  return (WORTH_OF_THE_FIRST_BENCH * levelCount * (levelCount + 1)) / 2
}
