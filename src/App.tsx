import { Game } from './components/Game'
import { STARTER_LEVEL } from './domain/levels'

export function App() {
  return <Game level={STARTER_LEVEL} />
}
