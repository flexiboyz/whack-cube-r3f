import './WaitingRoom.css'

function WaitingRoom({ isHost, playerCount, minPlayers, onStartGame }) {
  const canStart = playerCount >= minPlayers
  const playersNeeded = minPlayers - playerCount

  return (
    <div className="waiting-room-overlay">
      <div className="waiting-room-box">
        <h1 className="waiting-title">⏳ Waiting Room</h1>
        
        <div className="waiting-info">
          <div className="player-count">
            <span className="count-number">{playerCount}</span>
            <span className="count-label">
              {playerCount === 1 ? 'Player' : 'Players'} in Lobby
            </span>
          </div>
          
          {!canStart && (
            <div className="waiting-message">
              <p className="waiting-text">
                ⏰ Waiting for {playersNeeded} more {playersNeeded === 1 ? 'player' : 'players'}...
              </p>
              <p className="waiting-subtext">
                Share the session code with friends!
              </p>
            </div>
          )}
          
          {canStart && isHost && (
            <div className="ready-section">
              <p className="ready-text">✅ Ready to start!</p>
              <button 
                className="start-game-btn"
                onClick={onStartGame}
              >
                🎮 Start Game
              </button>
            </div>
          )}
          
          {canStart && !isHost && (
            <div className="waiting-host">
              <p className="waiting-host-text">
                👑 Waiting for host to start the game...
              </p>
            </div>
          )}
        </div>
        
        {isHost && (
          <div className="host-badge">
            👑 You are the host
          </div>
        )}
        
        <div className="waiting-hint">
          {isHost ? (
            <p>You can start the game when at least {minPlayers} players have joined</p>
          ) : (
            <p>The host will start the game when ready</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default WaitingRoom
