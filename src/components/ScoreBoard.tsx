import { useId } from 'react'

interface ScoreBoardProps {
  readonly score: number
  readonly moves: number
  readonly par: number
}

export function ScoreBoard({ score, moves, par }: ScoreBoardProps) {
  return (
    <dl className='scoreboard'>
      <Stat label='Score' value={score} />
      <Stat label='Pours' value={moves} />
      <Stat label='Par' value={par} />
    </dl>
  )
}

interface StatProps {
  readonly label: string
  readonly value: number
}

function Stat({ label, value }: StatProps) {
  const labelId = useId()

  return (
    <div className='stat'>
      <dt className='stat__label' id={labelId}>
        {label}
      </dt>
      <dd className='stat__value' aria-labelledby={labelId}>
        {value}
      </dd>
    </div>
  )
}
