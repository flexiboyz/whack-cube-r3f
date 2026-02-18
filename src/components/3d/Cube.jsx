import { useRef, useEffect, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import useGameStore from '../../store/gameStore'

function Cube({ cubeData, socket }) {
  const cubeRef = useRef()
  const [position, setPosition] = useState([cubeData.x, -2, cubeData.z])
  const [isRising, setIsRising] = useState(false)
  const [isFalling, setIsFalling] = useState(false)
  const [wasHit, setWasHit] = useState(false)
  
  const { params, setCubeIsUp } = useGameStore()
  
  const targetY = 1.5
  const cubeSize = 0.8

  useEffect(() => {
    // Start rising immediately when cube spawns
    setIsRising(true)
  }, [])

  useEffect(() => {
    const handleCubeHidden = () => {
      setIsFalling(true)
    }

    if (socket) {
      socket.on('cubeHidden', handleCubeHidden)
    }

    return () => {
      if (socket) {
        socket.off('cubeHidden', handleCubeHidden)
      }
    }
  }, [socket])

  useFrame(() => {
    if (isRising) {
      const newY = position[1] + params.cubePopSpeed
      if (newY >= targetY) {
        setPosition([position[0], targetY, position[2]])
        setIsRising(false)
        setCubeIsUp(true)
      } else {
        setPosition([position[0], newY, position[2]])
      }
    } else if (isFalling) {
      const newY = position[1] - params.cubePopSpeed
      if (newY <= -2) {
        setPosition([position[0], -2, position[2]])
        setIsFalling(false)
        setCubeIsUp(false)
      } else {
        setPosition([position[0], newY, position[2]])
      }
    }

    if (cubeRef.current) {
      cubeRef.current.position.set(...position)
    }
  })

  const color = cubeData.isRed ? '#ff0000' : '#00ff00'
  const emissive = cubeData.isRed ? '#440000' : '#004400'

  return (
    <mesh
      ref={cubeRef}
      position={position}
      castShadow
    >
      <boxGeometry args={[cubeSize, cubeSize, cubeSize]} />
      <meshStandardMaterial
        color={color}
        emissive={emissive}
        emissiveIntensity={0.3}
      />
    </mesh>
  )
}

export default Cube
