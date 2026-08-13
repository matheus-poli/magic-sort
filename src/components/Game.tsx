import { useEffect } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Flask } from './Flask'
import { ScoreBoard } from './ScoreBoard'
import { useGame } from '../hooks/useGame'
import { useGameSounds } from '../hooks/useGameSounds'
import { celebrateLevel } from '../effects/confetti'
import { PERFECT_SCORE } from '../domain/scoring'
import type { Level } from '../domain/levels'

interface GameProps {
  readonly level: Level
  /** Which bench of the atelier this is, counted the way a player counts. */
  readonly position: number
  readonly levelCount: number
  /** Points earned on the benches before this one. */
  readonly bankedScore: number
  /**
   * Hands over the next bench, taking what this one scored so the campaign can
   * bank it. Null when this is the last bench.
   */
  readonly onNextLevel: ((score: number) => void) | null
}

export function Game({
  level,
  position,
  levelCount,
  bankedScore,
  onNextLevel
}: GameProps) {
  const game = useGame(level)
  useGameSounds(game)

  useEffect(() => {
    if (game.isSolved) celebrateLevel()
  }, [game.isSolved])

  const totalScore = bankedScore + game.score
  const perfectTotal = levelCount * PERFECT_SCORE

  return (
    <main className='game'>
      <header className='game__header'>
        <h1 className='game__title'>Magic Sort</h1>
        <p className='game__level'>
          Level {position} of {levelCount}
        </p>
      </header>

      <ScoreBoard
        score={game.score}
        totalScore={totalScore}
        perfectTotal={perfectTotal}
        pours={game.pours}
        minimumPours={level.minimumPours}
      />

      <ol className='bench' aria-label='Flask bench'>
        {game.board.map((contents, index) => (
          <li key={index} className='bench__slot'>
            <Flask
              position={index + 1}
              contents={contents}
              isSelected={game.selectedIndex === index}
              refusedAt={
                game.lastTap.refusedFlaskIndex === index
                  ? game.lastTap.sequence
                  : null
              }
              onTap={() => game.tapFlask(index)}
            />
          </li>
        ))}
      </ol>

      <button type='button' className='button' onClick={game.restart}>
        Restart level
      </button>

      <AnimatePresence>
        {game.isSolved && (
          <motion.section
            className='victory'
            role='status'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className='victory__card'
              initial={{ scale: 0.8, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            >
              <h2 className='victory__title'>Elixirs sorted!</h2>
              <p className='victory__score'>
                Final score {game.score} of {PERFECT_SCORE}
              </p>
              <p className='victory__detail'>
                Pours spent: {game.pours} · Fewest possible:{' '}
                {level.minimumPours}
              </p>
              {onNextLevel === null && (
                <p className='victory__closing'>
                  Every bench in the atelier is sorted, for {totalScore} of{' '}
                  {perfectTotal}.
                </p>
              )}

              <div className='victory__actions'>
                {onNextLevel !== null && (
                  <button
                    type='button'
                    className='button button--primary'
                    onClick={() => onNextLevel(game.score)}
                  >
                    Next level
                  </button>
                )}
                <button type='button' className='button' onClick={game.restart}>
                  Play again
                </button>
              </div>
            </motion.div>
          </motion.section>
        )}
      </AnimatePresence>
    </main>
  )
}
