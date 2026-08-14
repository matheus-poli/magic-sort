import { ColourBlindToggle } from './components/ColourBlindToggle'
import { Game } from './components/Game'
import { Wordmark } from './components/Wordmark'
import { useCampaign } from './hooks/useCampaign'
import { useColourBlindMode } from './hooks/useColourBlindMode'
import { LEVELS } from './domain/levels'

export function App() {
  const campaign = useCampaign(LEVELS)
  const colourBlind = useColourBlindMode()

  return (
    <>
      <Wordmark />
      <ColourBlindToggle
        enabled={colourBlind.enabled}
        onToggle={colourBlind.toggle}
      />
      <Game
        level={campaign.level}
        position={campaign.position}
        levelCount={campaign.levelCount}
        worth={campaign.worth}
        bankedScore={campaign.bankedScore}
        perfectTotal={campaign.perfectTotal}
        forfeited={campaign.forfeited}
        colourBlind={colourBlind.enabled}
        onNextLevel={campaign.hasNext ? campaign.advance : null}
        onRestart={campaign.chargeForRestart}
        onStartOver={campaign.startOver}
      />
    </>
  )
}
