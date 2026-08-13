import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useGame } from './useGame'
import type { Level } from '../domain/levels'

/** Two pours from being solved, so tests stay short and readable. */
const almostSolved: Level = {
  id: 'test-bench',
  name: 'Test Bench',
  par: 1,
  board: [
    ['crimson', 'crimson', 'crimson'],
    ['crimson'],
    ['azure', 'azure', 'azure', 'azure']
  ]
}

/** Flask 2 can never pour onto flask 0, which gives tests an illegal move. */
const mixed: Level = {
  id: 'test-mixed',
  name: 'Mixed Bench',
  par: 4,
  board: [['crimson', 'azure'], ['azure'], ['verdant'], []]
}

describe('useGame', () => {
  it('starts on the given level with nothing selected and no moves spent', () => {
    const { result } = renderHook(() => useGame(mixed))

    expect(result.current).toMatchObject({
      board: mixed.board,
      selectedIndex: null,
      moves: 0,
      isSolved: false
    })
  })

  it('selects a flask that has elixir to pour', () => {
    const { result } = renderHook(() => useGame(mixed))

    act(() => result.current.tapFlask(0))

    expect(result.current.selectedIndex).toBe(0)
  })

  it('ignores a tap on an empty flask when nothing is selected', () => {
    const { result } = renderHook(() => useGame(mixed))

    act(() => result.current.tapFlask(3))

    expect(result.current.selectedIndex).toBeNull()
  })

  it('puts a selected flask back down when it is tapped again', () => {
    const { result } = renderHook(() => useGame(mixed))

    act(() => result.current.tapFlask(0))
    act(() => result.current.tapFlask(0))

    expect(result.current.selectedIndex).toBeNull()
  })

  it('pours from the selected flask into the flask tapped next', () => {
    const { result } = renderHook(() => useGame(mixed))

    act(() => result.current.tapFlask(0))
    act(() => result.current.tapFlask(1))

    expect(result.current.board).toEqual([
      ['crimson'],
      ['azure', 'azure'],
      ['verdant'],
      []
    ])
  })

  it('counts a successful pour as one move and clears the selection', () => {
    const { result } = renderHook(() => useGame(mixed))

    act(() => result.current.tapFlask(0))
    act(() => result.current.tapFlask(1))

    expect(result.current).toMatchObject({ moves: 1, selectedIndex: null })
  })

  it('leaves the board and move count alone when the pour is illegal', () => {
    const { result } = renderHook(() => useGame(mixed))

    act(() => result.current.tapFlask(2))
    act(() => result.current.tapFlask(0))

    expect(result.current).toMatchObject({ board: mixed.board, moves: 0 })
  })

  it('puts both flasks down when the pour is illegal', () => {
    const { result } = renderHook(() => useGame(mixed))

    act(() => result.current.tapFlask(2))
    act(() => result.current.tapFlask(0))

    expect(result.current.selectedIndex).toBeNull()
  })

  it('names the flask that refused the pour, so the UI can rebuff the player', () => {
    const { result } = renderHook(() => useGame(mixed))

    act(() => result.current.tapFlask(2))
    act(() => result.current.tapFlask(0))

    expect(result.current.lastTap).toMatchObject({ refusedFlaskIndex: 0 })
  })

  it('reports the level solved once every flask holds a single elixir', () => {
    const { result } = renderHook(() => useGame(almostSolved))

    act(() => result.current.tapFlask(1))
    act(() => result.current.tapFlask(0))

    expect(result.current.isSolved).toBe(true)
  })

  it('scores completed flasks plus the solve bonus for a run within par', () => {
    const { result } = renderHook(() => useGame(almostSolved))

    act(() => result.current.tapFlask(1))
    act(() => result.current.tapFlask(0))

    expect(result.current.score).toBe(700)
  })

  it('scores completed flasks while the level is still in progress', () => {
    const { result } = renderHook(() => useGame(almostSolved))

    expect(result.current.score).toBe(100)
  })

  it('reports picking a flask up so the UI can react to it', () => {
    const { result } = renderHook(() => useGame(mixed))

    act(() => result.current.tapFlask(0))

    expect(result.current.lastTap).toMatchObject({ outcome: 'picked-up' })
  })

  it('reports a refused pour so the UI can react to it', () => {
    const { result } = renderHook(() => useGame(mixed))

    act(() => result.current.tapFlask(2))
    act(() => result.current.tapFlask(0))

    expect(result.current.lastTap).toMatchObject({ outcome: 'refused' })
  })

  it('reports a completed pour so the UI can react to it', () => {
    const { result } = renderHook(() => useGame(mixed))

    act(() => result.current.tapFlask(0))
    act(() => result.current.tapFlask(1))

    expect(result.current.lastTap).toMatchObject({ outcome: 'poured' })
  })

  it('names the flask a pour just filled, so the UI can celebrate it', () => {
    const { result } = renderHook(() => useGame(almostSolved))

    act(() => result.current.tapFlask(1))
    act(() => result.current.tapFlask(0))

    expect(result.current.lastTap).toMatchObject({ completedFlaskIndex: 0 })
  })

  it('names no flask when the pour leaves the target unfinished', () => {
    const { result } = renderHook(() => useGame(mixed))

    act(() => result.current.tapFlask(0))
    act(() => result.current.tapFlask(1))

    expect(result.current.lastTap).toMatchObject({ completedFlaskIndex: null })
  })

  it('gives repeated identical taps a fresh sequence so effects re-fire', () => {
    const { result } = renderHook(() => useGame(mixed))

    act(() => result.current.tapFlask(0))
    const first = result.current.lastTap
    act(() => result.current.tapFlask(0))

    expect(result.current.lastTap.sequence).toBeGreaterThan(first.sequence)
  })

  it('sends the bench back to its opening state on restart', () => {
    const { result } = renderHook(() => useGame(mixed))

    act(() => result.current.tapFlask(0))
    act(() => result.current.tapFlask(1))
    act(() => result.current.restart())

    expect(result.current).toMatchObject({
      board: mixed.board,
      moves: 0,
      selectedIndex: null
    })
  })
})
