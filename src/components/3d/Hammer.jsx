import { useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import useGameStore from '../../store/gameStore'

function Hammer({ socket }) {
  const hammerRef = useRef()
  
  const {
    hammerPosition,
    setHammerPosition,
    hammerVelocity,
    setHammerVelocity,
    hammerFalling,
    setHammerFalling,
    hammerRaised,
    setHammerRaised,
    params,
    isGameOver,
  } = useGameStore()

  // Handle mouse/touch input
  useEffect(() => {
    const handlePointerDown = () => {
      if (isGameOver) return
      setHammerRaised(true)
      setHammerFalling(false)
    }

    const handlePointerUp = () => {
      if (isGameOver) return
      setHammerRaised(false)
      setHammerFalling(true)
      setHammerVelocity(0)
    }

    window.addEventListener('mousedown', handlePointerDown)
    window.addEventListener('mouseup', handlePointerUp)
    window.addEventListener('touchstart', handlePointerDown)
    window.addEventListener('touchend', handlePointerUp)

    return () => {
      window.removeEventListener('mousedown', handlePointerDown)
      window.removeEventListener('mouseup', handlePointerUp)
      window.removeEventListener('touchstart', handlePointerDown)
      window.removeEventListener('touchend', handlePointerUp)
    }
  }, [isGameOver, setHammerRaised, setHammerFalling, setHammerVelocity])

  // Update hammer physics every frame
  useFrame(() => {
    if (isGameOver) return

    const currentY = hammerPosition[1]
    let newY = currentY
    let newVelocity = hammerVelocity

    if (hammerRaised) {
      // Raise hammer smoothly
      newY += params.hammerRaiseSpeed
      if (newY > params.raisedHeight) {
        newY = params.raisedHeight
      }
    } else if (hammerFalling) {
      // Apply gravity
      newVelocity += params.gravity
      newY += newVelocity

      // Stop at ground level
      if (newY <= params.groundLevel) {
        newY = params.groundLevel
        newVelocity = 0
        setHammerFalling(false)
        
        // Check for cube hit when hammer reaches ground
        const cube = useGameStore.getState().currentCube
        const cubeIsUp = useGameStore.getState().cubeIsUp
        
        if (cube && cubeIsUp) {
          const hammerPos = { x: 0, y: newY, z: 0 }
          const cubePos = { x: cube.x, y: 1.5, z: cube.z }
          const distance = Math.sqrt(
            Math.pow(hammerPos.x - cubePos.x, 2) +
            Math.pow(hammerPos.y - cubePos.y, 2) +
            Math.pow(hammerPos.z - cubePos.z, 2)
          )
          
          if (distance < 1.2) {
            // Hit detected!
            if (socket) {
              socket.emit('cubeHit', { isRed: cube.isRed })
            }
          }
        }
      }
    } else {
      // Return to normal height when not raised or falling
      if (newY < params.normalHeight) {
        newY += params.hammerRaiseSpeed * 0.5
        if (newY > params.normalHeight) {
          newY = params.normalHeight
        }
      } else if (newY > params.normalHeight) {
        newY -= params.hammerRaiseSpeed * 0.5
        if (newY < params.normalHeight) {
          newY = params.normalHeight
        }
      }
    }

    setHammerPosition([0, newY, 0])
    setHammerVelocity(newVelocity)

    if (hammerRef.current) {
      hammerRef.current.position.y = newY
    }
  })

  return (
    <group ref={hammerRef} position={hammerPosition}>
      {/* Handle */}
      <mesh position={[0, -1, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 2, 16]} />
        <meshStandardMaterial color="#8B4513" />
      </mesh>
      
      {/* Head */}
      <mesh castShadow>
        <boxGeometry args={[0.6, 0.4, 0.4]} />
        <meshStandardMaterial color="#808080" />
      </mesh>
    </group>
  )
}

export default Hammer
