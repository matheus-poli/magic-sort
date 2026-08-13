interface ColourBlindToggleProps {
  readonly enabled: boolean
  readonly onToggle: () => void
}

/**
 * The switch for the accessible view of the atelier, in plain words rather
 * than in the game's own: a player looking for this is looking for the phrase
 * they already know, not for a sigil in the corner.
 */
export function ColourBlindToggle({
  enabled,
  onToggle
}: ColourBlindToggleProps) {
  return (
    <button
      type='button'
      className='colour-aid'
      aria-pressed={enabled}
      title='Tell the elixirs apart by shape as well as colour'
      onClick={onToggle}
    >
      <span className='colour-aid__marks' aria-hidden='true'>
        ▲●★
      </span>
      Colour-blind mode
    </button>
  )
}
