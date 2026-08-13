import { useId } from 'react'
import { PERFECT_SCORE, POINTS_LOST_PER_EXTRA_POUR } from '../domain/scoring'

interface ScoreBoardProps {
  readonly score: number
  readonly pours: number
  readonly minimumPours: number
}

export function ScoreBoard({ score, pours, minimumPours }: ScoreBoardProps) {
  return (
    <div className='scoreboard'>
      <dl className='scoreboard__stats'>
        <Stat label='Score' value={score} outOf={PERFECT_SCORE} />
        <Stat label='Pours' value={pours} />
      </dl>

      {/* This used to be a bare stat labelled "Par", which reads as golf to
          everyone who has not played golf. Spell the rule out instead. */}
      <p className='scoreboard__hint'>
        This bench can be sorted in {minimumPours} pours. Every pour past that
        costs {POINTS_LOST_PER_EXTRA_POUR} points.
      </p>
    </div>
  )
}

interface StatProps {
  readonly label: string
  readonly value: number
  /** The most this stat can reach, for a stat that has a ceiling. */
  readonly outOf?: number
}

function Stat({ label, value, outOf }: StatProps) {
  const labelId = useId()

  return (
    <div className='stat'>
      <dt className='stat__label' id={labelId}>
        {label}
      </dt>
      <dd className='stat__value' aria-labelledby={labelId}>
        {value}
        {outOf !== undefined && (
          <span className='stat__ceiling'> / {outOf}</span>
        )}
      </dd>
    </div>
  )
}
