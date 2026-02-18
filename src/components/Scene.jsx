import { useEffect } from 'react'
import Ground from './3d/Ground'
import Hammer from './3d/Hammer'
import Cube from './3d/Cube'
import useGameStore from '../store/gameStore'

function Scene({ socket }) {
  const {
    currentCube,
    setCurrentCube,
    setCubeIsUp,
    params,
  } = useGameStore()

  useEffect(() => {
    // Listen for cube lifecycle from server
    const handleCubeSpawned = (cubeData) => {
      console.log('Scene: Cube spawned', cubeData)
      setCurrentCube(cubeData)
      setCubeIsUp(false)
    }

    const handleCubeHidden = () => {
      console.log('Scene: Cube hidden')
      setCubeIsUp(false)
      setCurrentCube(null)
    }

    if (socket) {
      socket.on('cubeSpawned', handleCubeSpawned)
      socket.on('cubeHidden', handleCubeHidden)
    }

    return () => {
      if (socket) {
        socket.off('cubeSpawned', handleCubeSpawned)
        socket.off('cubeHidden', handleCubeHidden)
      }
    }
  }, [socket, setCurrentCube, setCubeIsUp])

  return (
    <>
      {/* Sky color */}
      <color attach="background" args={['#87CEEB']} />
      
      {/* Lights */}
      <ambientLight intensity={0.6} />
      <directionalLight
        position={[5, 10, 5]}
        intensity={0.8}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      
      {/* 3D Objects */}
      <Ground />
      <Hammer socket={socket} />
      {currentCube && <Cube cubeData={currentCube} socket={socket} />}
    </>
  )
}

export default Scene
