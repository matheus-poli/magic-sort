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
 * The number on the scoreboard's total, debt and all. It used to read as zero
 * while the campaign was in the red, which was kind right up until an
 * apprentice could be ruined: a player who cannot see what they owe cannot see
 * the end of their run coming.
 */
export function totalScore({ banked, bench }: CampaignProgress): number {
  return banked + bench
}

export interface Standing {
  /** Points from the benches left behind, less what restarts have cost. */
  readonly banked: number
  /** The most the bench in front of the apprentice could still pay. */
  readonly benchInHand: number
}

/**
 * Whether the apprentice is finished: so deep in debt that even sorting the
 * bench in front of them flawlessly would leave them owing points. Debt on its
 * own is a hole to climb out of; debt no bench can cover is the end of the run.
 */
export function isRuined({ banked, benchInHand }: Standing): boolean {
  return banked + benchInHand < 0
}

export interface Rebirth {
  /** Points from the benches left behind, less what restarts have cost. */
  readonly banked: number
  /** Which bench the apprentice would be walking back from. */
  readonly position: number
}

/**
 * Whether walking back to the first bench from here would leave a debt no
 * bench could clear. Deep into a run the walk costs more than most apprentices
 * have, and the dialog that offers it has to be able to say so first: pressing
 * it unwarned would make the end of the run an ambush rather than a decision.
 */
export function rebirthWouldRuin({ banked, position }: Rebirth): boolean {
  return isRuined({
    banked: banked - priceOfRebirth(position),
    // Whatever they were sorting is poured back out with the walk, so the only
    // bench left to pay them is the first one.
    benchInHand: benchWorth(1)
  })
}

export interface Restart {
  /** Points from the benches left behind, less what restarts have cost. */
  readonly banked: number
  /** Which bench the apprentice would be laying out again. */
  readonly position: number
}

/**
 * Whether throwing this bench away would leave a debt no bench could clear.
 * It is the question a stuck apprentice's run hangs on: the price comes off
 * what they have banked, and the bench handed back to them is then the only
 * thing left that could pay it.
 */
export function restartWouldRuin({ banked, position }: Restart): boolean {
  return isRuined({
    banked: banked - priceOfRestart(position),
    // Whatever was half-sorted is poured back out, so this bench pays from the
    // top again rather than from where they had got to.
    benchInHand: benchWorth(position)
  })
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
