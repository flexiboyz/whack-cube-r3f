import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Canvas } from '@react-three/fiber'
import { io } from 'socket.io-client'
import { useControls } from 'leva'
import useGameStore from '../store/gameStore'
import Scene from './Scene'
import HUD from './HUD'
import WaitingRoom from './WaitingRoom'
import './Game.css'

let socket = null

function Game() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const sessionId = searchParams.get('session')
  
  const {
    setSessionId,
    setMySocketId,
    setIsHost,
    setSessionStatus,
    setMinPlayers,
    playerName,
    updateAllPlayers,
    setCurrentCube,
    setCubeIsUp,
    sessionStatus,
    isHost,
    allPlayers,
    minPlayers,
    params,
    updateParams,
  } = useGameStore()

  const [isConnected, setIsConnected] = useState(false)

  // Leva controls for game parameters (same as dat.GUI from vanilla)
  const controls = useControls({
    'Hammer Settings': {
      gravity: {
        value: params.gravity,
        min: -0.1,
        max: -0.005,
        step: 0.001,
        onChange: (v) => updateParams({ gravity: v }),
      },
      hammerRaiseSpeed: {
        value: params.hammerRaiseSpeed,
        min: 0.05,
        max: 0.5,
        step: 0.01,
        onChange: (v) => updateParams({ hammerRaiseSpeed: v }),
      },
    },
    'Cube Settings': {
      cubePopSpeed: {
        value: params.cubePopSpeed,
        min: 0.01,
        max: 0.2,
        step: 0.01,
        onChange: (v) => updateParams({ cubePopSpeed: v }),
      },
      cubeStayDuration: {
        value: params.cubeStayDuration,
        min: 500,
        max: 5000,
        step: 100,
        onChange: (v) => updateParams({ cubeStayDuration: v }),
      },
      cubeSpawnDelayMin: {
        value: params.cubeSpawnDelayMin,
        min: 1000,
        max: 10000,
        step: 100,
        onChange: (v) => updateParams({ cubeSpawnDelayMin: v }),
      },
      cubeSpawnDelayMax: {
        value: params.cubeSpawnDelayMax,
        min: 1000,
        max: 10000,
        step: 100,
        onChange: (v) => updateParams({ cubeSpawnDelayMax: v }),
      },
    },
  })

  const handleStartGame = () => {
    if (socket && isHost) {
      console.log('Host starting game...')
      socket.emit('startGame')
    }
  }

  useEffect(() => {
    if (!sessionId) {
      navigate('/')
      return
    }

    setSessionId(sessionId)

    // Initialize socket connection - dynamically use current host
    const socketUrl = window.location.hostname === 'localhost' 
      ? 'http://localhost:3001'
      : `http://${window.location.hostname}:3001`
    
    socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
    })

    socket.on('connect', () => {
      console.log('Socket connected, joining session:', sessionId)
      setIsConnected(true)
      socket.emit('joinSession', { sessionId, playerName })
    })

    socket.on('disconnect', () => {
      console.log('Socket disconnected')
      setIsConnected(false)
    })

    socket.on('sessionJoined', ({ socketId, status, players, hostId, minPlayers: min }) => {
      console.log('Joined session:', socketId, 'Status:', status, 'Players:', players)
      setMySocketId(socketId)
      setIsHost(socketId === hostId)
      setSessionStatus(status)
      setMinPlayers(min)
      updateAllPlayers(players)
    })

    socket.on('playersUpdate', (players) => {
      console.log('Players update:', players)
      updateAllPlayers(players)
    })

    socket.on('hostChanged', ({ newHostId }) => {
      console.log('New host:', newHostId)
      const myId = useGameStore.getState().mySocketId
      setIsHost(myId === newHostId)
    })

    socket.on('gameStarted', ({ status }) => {
      console.log('Game started!')
      setSessionStatus(status)
    })

    socket.on('gamePaused', ({ reason, minPlayers: min }) => {
      console.log('Game paused:', reason)
      setSessionStatus('waiting')
      alert(`Game paused: ${reason}. Need at least ${min} players.`)
    })

    socket.on('cubeSpawned', (cubeData) => {
      console.log('Cube spawned:', cubeData)
      setCurrentCube(cubeData)
      setCubeIsUp(false)
    })

    socket.on('cubeHidden', () => {
      console.log('Cube hidden')
      setCubeIsUp(false)
      setCurrentCube(null)
    })

    socket.on('error', (error) => {
      console.error('Socket error:', error)
      alert(error.message)
      navigate('/')
    })

    return () => {
      if (socket) {
        socket.disconnect()
        socket = null
      }
    }
  }, [sessionId, navigate])

  if (!sessionId) {
    return null
  }

  const showWaitingRoom = sessionStatus === 'waiting'

  return (
    <div className="game-container">
      <HUD socket={socket} />
      
      {showWaitingRoom && (
        <WaitingRoom
          isHost={isHost}
          playerCount={allPlayers.length}
          minPlayers={minPlayers}
          onStartGame={handleStartGame}
        />
      )}
      
      <Canvas
        shadows
        camera={{ position: [0, 2.5, 8], fov: 75 }}
        onCreated={({ camera }) => {
          camera.lookAt(0, 1, 0)
        }}
      >
        <Scene socket={socket} />
      </Canvas>
      
      {!isConnected && (
        <div className="connection-status">Connecting...</div>
      )}
    </div>
  )
}

export { socket }
export default Game
