import { useEffect } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Flask } from './Flask'
import { ScoreBoard } from './ScoreBoard'
import { useGame } from '../hooks/useGame'
import { useGameSounds } from '../hooks/useGameSounds'
import { celebrateLevel } from '../effects/confetti'
import type { Level } from '../domain/levels'

interface GameProps {
  readonly level: Level
}

export function Game({ level }: GameProps) {
  const game = useGame(level)
  useGameSounds(game)

  useEffect(() => {
    if (game.isSolved) celebrateLevel()
  }, [game.isSolved])

  return (
    <main className='game'>
      <header className='game__header'>
        <h1 className='game__title'>Magic Sort</h1>
      </header>

      <ScoreBoard
        score={game.score}
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
              <p className='victory__detail'>
                Final score {game.score} in {game.pours} pours.
              </p>
              <button type='button' className='button' onClick={game.restart}>
                Play again
              </button>
            </motion.div>
          </motion.section>
        )}
      </AnimatePresence>
    </main>
  )
}
