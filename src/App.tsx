import { Game } from './components/Game'
import { useCampaign } from './hooks/useCampaign'
import { LEVELS } from './domain/levels'

export function App() {
  const campaign = useCampaign(LEVELS)

  return (
    <Game
      level={campaign.level}
      position={campaign.position}
      total={campaign.total}
      onNextLevel={campaign.hasNext ? campaign.advance : null}
    />
  )
}
