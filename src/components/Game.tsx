import { useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Flask } from './Flask'
import { HoldToRestart } from './HoldToRestart'
import { StartOver } from './StartOver'
import { ScoreBoard } from './ScoreBoard'
import { useGame } from '../hooks/useGame'
import { useGameSounds } from '../hooks/useGameSounds'
import { usePourFlight } from '../hooks/usePourFlight'
import { celebrateLevel } from '../effects/confetti'
import { PERFECT_SCORE, totalScore } from '../domain/scoring'
import type { CSSProperties } from 'react'
import type { Level } from '../domain/levels'

interface GameProps {
  readonly level: Level
  /** Which bench of the atelier this is, counted the way a player counts. */
  readonly position: number
  readonly levelCount: number
  /** Points earned on the benches before this one, less what restarts cost. */
  readonly bankedScore: number
  /** What restarts have cost so far, which the restart button owns up to. */
  readonly forfeited: number
  /** Show the elixirs the accessible way: tuned colours, and a sigil each. */
  readonly colourBlind: boolean
  /**
   * Hands over the next bench, taking what this one scored so the campaign can
   * bank it. Null when this is the last bench.
   */
  readonly onNextLevel: ((score: number) => void) | null
  /** Tells the campaign a bench was thrown away, so it can charge for it. */
  readonly onRestart: () => void
  /** Throws the whole run away and starts the atelier from the first bench. */
  readonly onStartOver: () => void
}

export function Game({
  level,
  position,
  levelCount,
  bankedScore,
  forfeited,
  colourBlind,
  onNextLevel,
  onRestart,
  onStartOver
}: GameProps) {
  const game = useGame(level)
  useGameSounds(game)

  const bench = useRef<HTMLOListElement | null>(null)
  const slots = useRef<(HTMLLIElement | null)[]>([])
  const pour = usePourFlight({
    board: game.board,
    selectedIndex: game.selectedIndex,
    bench,
    slots,
    onTap: game.tapFlask
  })

  useEffect(() => {
    if (game.isSolved) celebrateLevel()
  }, [game.isSolved])

  const total = totalScore({ banked: bankedScore, bench: game.score })
  const perfectTotal = levelCount * PERFECT_SCORE
  const isLastBench = onNextLevel === null

  const restartBench = () => {
    game.restart()
    onRestart()
  }

  // The campaign may already be on the first bench, in which case the level it
  // hands back is the one in hand: the board has to be laid out again here.
  const startOverFromTheTop = () => {
    game.restart()
    onStartOver()
  }

  const startOverControl = (
    <StartOver
      position={position}
      levelCount={levelCount}
      total={total}
      onStartOver={startOverFromTheTop}
    />
  )

  return (
    <main className='game' data-colour-blind={colourBlind}>
      <header className='game__header'>
        <h1 className='game__title'>Magic Sort</h1>
        <p className='game__level'>
          Level {position} of {levelCount}
        </p>
      </header>

      <ScoreBoard
        score={game.score}
        totalScore={total}
        perfectTotal={perfectTotal}
        pours={game.pours}
        minimumPours={level.minimumPours}
      />

      <ol className='bench' aria-label='Flask bench' ref={bench}>
        {game.board.map((flask, index) => (
          <li
            key={index}
            className='bench__slot'
            ref={(slot) => {
              slots.current[index] = slot
            }}
          >
            <Flask
              position={index + 1}
              contents={flask.contents}
              capacity={flask.capacity}
              sigils={colourBlind}
              isSelected={game.selectedIndex === index}
              refusedAt={
                game.lastTap.refusedFlaskIndex === index
                  ? game.lastTap.sequence
                  : null
              }
              onTap={() => pour.tapFlask(index)}
            />
          </li>
        ))}

        {/* The elixir in the air, drawn between the tipped flask and the one
            filling: it belongs to the bench rather than to either flask. */}
        {pour.stream !== null && (
          <motion.span
            className='pour-stream'
            aria-hidden='true'
            data-elixir={pour.stream.elixir}
            style={
              {
                left: pour.stream.left,
                top: pour.stream.top,
                height: pour.stream.height
              } as CSSProperties
            }
            initial={{ scaleY: 0, opacity: 1 }}
            animate={{ scaleY: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15, ease: 'easeIn' }}
          />
        )}
      </ol>

      <div className='undo'>
        <HoldToRestart onRestart={restartBench} forfeited={forfeited} />
        {startOverControl}
      </div>

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

              {/* "Final" only when it is: the word was telling players on the
                  first bench that they had reached the end of the game. */}
              <p className='victory__score'>
                {isLastBench ? 'Final score' : 'Score'} {game.score} of{' '}
                {PERFECT_SCORE}
              </p>
              <p className='victory__detail'>
                Pours spent: {game.pours} · Fewest possible:{' '}
                {level.minimumPours}
              </p>

              {/* The card covers the whole atelier, so it has to carry the
                  progress the header behind it would otherwise show. */}
              <div className='victory__progress'>
                <ol className='pips' aria-hidden='true'>
                  {Array.from({ length: levelCount }, (_, bench) => (
                    <li
                      key={bench}
                      className='pips__pip'
                      data-sorted={bench < position}
                    />
                  ))}
                </ol>
                <p className='victory__closing'>
                  {isLastBench
                    ? `Every bench in the atelier is sorted, for ${total} of ${perfectTotal}.`
                    : `${levelCount - position} more to sort.`}
                </p>
              </div>

              <div className='victory__actions'>
                {onNextLevel !== null && (
                  <button
                    type='button'
                    className='button button--primary button--wide'
                    autoFocus
                    onClick={() => onNextLevel(game.score)}
                  >
                    Next level <span aria-hidden='true'>→</span>
                  </button>
                )}
                <button
                  type='button'
                  className='button button--quiet'
                  autoFocus={isLastBench}
                  onClick={game.restart}
                >
                  Play again
                </button>
                {/* Reachable at the end too: the card covers the bench, and
                    with it the only other way back to the first flask. */}
                {isLastBench && startOverControl}
              </div>
            </motion.div>
          </motion.section>
        )}
      </AnimatePresence>
    </main>
  )
}
