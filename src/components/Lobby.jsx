import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { io } from 'socket.io-client'
import useGameStore from '../store/gameStore'
import './Lobby.css'

function Lobby() {
  const navigate = useNavigate()
  const { playerName, setPlayerName, setSessionId } = useGameStore()
  
  const [name, setName] = useState(playerName)
  const [joinCode, setJoinCode] = useState('')
  const [isQuickMatching, setIsQuickMatching] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [isJoining, setIsJoining] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    return () => {
      const socketUrl = window.location.hostname === 'localhost' 
        ? 'http://localhost:3001'
        : `http://${window.location.hostname}:3001`
      const socket = io(socketUrl)
      socket.disconnect()
    }
  }, [])

  const handleQuickMatch = () => {
    setIsQuickMatching(true)
    setError('')
    
    const finalName = name.trim() || 'Player'
    setPlayerName(finalName)
    
    try {
      const socketUrl = window.location.hostname === 'localhost' 
        ? 'http://localhost:3001'
        : `http://${window.location.hostname}:3001`
      const socket = io(socketUrl)
      
      socket.on('connect', () => {
        socket.emit('quickMatch', { playerName: finalName })
        
        socket.once('sessionJoined', ({ sessionId }) => {
          console.log('Quick matched to session:', sessionId)
          setSessionId(sessionId)
          socket.disconnect()
          navigate(`/game?session=${sessionId}`)
        })
      })
      
      socket.on('error', (err) => {
        setIsQuickMatching(false)
        setError(err.message || 'Failed to find match')
        socket.disconnect()
      })
      
      setTimeout(() => {
        setIsQuickMatching(false)
        setError('Connection timeout. Please try again.')
      }, 5000)
      
    } catch (err) {
      setIsQuickMatching(false)
      setError('Failed to connect. Please try again.')
      console.error(err)
    }
  }

  const handleCreateGame = async () => {
    setIsCreating(true)
    setError('')
    
    if (name.trim()) {
      setPlayerName(name.trim())
    }
    
    try {
      const socketUrl = window.location.hostname === 'localhost' 
        ? 'http://localhost:3001'
        : `http://${window.location.hostname}:3001`
      const socket = io(socketUrl)
      
      socket.on('connect', () => {
        socket.emit('createSession')
        
        socket.once('sessionCreated', ({ sessionId }) => {
          console.log('Session created:', sessionId)
          setSessionId(sessionId)
          socket.disconnect()
          navigate(`/game?session=${sessionId}`)
        })
      })
      
      setTimeout(() => {
        setIsCreating(false)
        setError('Connection timeout. Please try again.')
      }, 5000)
      
    } catch (err) {
      setIsCreating(false)
      setError('Failed to create session. Please try again.')
      console.error(err)
    }
  }

  const handleJoinGame = () => {
    setIsJoining(true)
    setError('')
    
    if (!joinCode.trim()) {
      setError('Please enter a session code')
      setIsJoining(false)
      return
    }
    
    if (name.trim()) {
      setPlayerName(name.trim())
    }
    
    const sessionId = joinCode.trim().toLowerCase()
    setSessionId(sessionId)
    navigate(`/game?session=${sessionId}`)
  }

  return (
    <div className="lobby-container">
      <div className="lobby-box">
        <h1 className="lobby-title">🔨 Whack-a-Cube</h1>
        <p className="lobby-subtitle">Multiplayer 3D Edition</p>
        
        <div className="lobby-form">
          <div className="form-group">
            <label>Your Name (optional)</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              maxLength={20}
            />
          </div>
          
          <div className="button-group">
            <button
              className="btn btn-primary btn-large"
              onClick={handleQuickMatch}
              disabled={isQuickMatching || isCreating || isJoining}
            >
              {isQuickMatching ? '🔍 Finding Match...' : '⚡ Quick Match'}
            </button>
          </div>

          <div className="quick-match-info">
            Auto-join a waiting game or create new one
          </div>
          
          <div className="divider">
            <span>OR</span>
          </div>
          
          <div className="button-group">
            <button
              className="btn btn-secondary"
              onClick={handleCreateGame}
              disabled={isCreating || isJoining || isQuickMatching}
            >
              {isCreating ? 'Creating...' : '🎮 Create Private Game'}
            </button>
          </div>
          
          <div className="divider">
            <span>OR</span>
          </div>
          
          <div className="form-group">
            <label>Join Private Game</label>
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toLowerCase())}
              placeholder="Enter 6-character code"
              maxLength={6}
            />
          </div>
          
          <div className="button-group">
            <button
              className="btn btn-tertiary"
              onClick={handleJoinGame}
              disabled={isCreating || isJoining || isQuickMatching}
            >
              {isJoining ? 'Joining...' : '🚪 Join with Code'}
            </button>
          </div>
          
          {error && <div className="error-message">{error}</div>}
        </div>
        
        <div className="lobby-instructions">
          <h3>How to Play</h3>
          <ul>
            <li>🟢 Hit <strong>GREEN</strong> cubes to score points</li>
            <li>🔴 Avoid <strong>RED</strong> cubes (3 hits = game over)</li>
            <li>🖱️ Hold mouse/touch to raise hammer, release to drop</li>
            <li>👥 Need at least <strong>2 players</strong> to start</li>
            <li>👑 First player is host and starts the game</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default Lobby
