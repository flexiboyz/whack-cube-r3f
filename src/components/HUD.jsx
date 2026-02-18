import { useEffect } from 'react'
import useGameStore from '../store/gameStore'
import './HUD.css'

function HUD({ socket }) {
  const {
    score,
    lives,
    isGameOver,
    sessionId,
    allPlayers,
    incrementScore,
    incrementRedHits,
    updateAllPlayers,
  } = useGameStore()

  useEffect(() => {
    if (!socket) return

    socket.on('scoreUpdate', ({ score: newScore, lives: newLives }) => {
      console.log('Score update:', newScore, newLives)
      // Server sends updated values, sync with local state
      const currentScore = useGameStore.getState().score
      const currentLives = useGameStore.getState().lives
      
      if (newScore > currentScore) {
        incrementScore()
      }
      if (newLives < currentLives) {
        incrementRedHits()
      }
    })

    socket.on('playersUpdate', (players) => {
      updateAllPlayers(players)
    })

    return () => {
      socket.off('scoreUpdate')
      socket.off('playersUpdate')
    }
  }, [socket, incrementScore, incrementRedHits, updateAllPlayers])

  const hearts = '❤️'.repeat(lives) + '🖤'.repeat(3 - lives)

  return (
    <>
      <div className="hud-score">
        Score: {score} | Lives: {hearts}
      </div>
      
      <div className="hud-instructions">
        Hit GREEN cubes ✅ | Avoid RED cubes ❌
      </div>
      
      <div className="hud-session">
        <div>Session: <span className="session-code">{sessionId?.toUpperCase()}</span></div>
        <div className="share-text">Share this code with friends!</div>
      </div>
      
      <div className="hud-leaderboard">
        <h3>🏆 Players</h3>
        <div className="player-list">
          {allPlayers
            .sort((a, b) => b.score - a.score)
            .map((player) => (
              <div key={player.id} className="player-item">
                <span className="player-name">{player.name}</span>
                <span className="player-stats">
                  {player.score} pts | {player.lives} ❤️
                </span>
              </div>
            ))}
        </div>
      </div>
      
      {isGameOver && (
        <div className="game-over-modal">
          <div className="game-over-box">
            <h1 className="game-over-title">GAME OVER!</h1>
            <p className="final-score">Final Score: {score}</p>
            <button
              className="play-again-btn"
              onClick={() => window.location.reload()}
            >
              Play Again
            </button>
          </div>
        </div>
      )}
    </>
  )
}

export default HUD
