function Ground() {
  return (
    <group>
      {/* Ground plane */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
        position={[0, 0, 0]}
      >
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#228B22" />
      </mesh>
      
      {/* Hole (center platform) */}
      <mesh position={[0, 0.1, 0]} receiveShadow>
        <cylinderGeometry args={[1.5, 1.5, 0.2, 32]} />
        <meshStandardMaterial color="#654321" />
      </mesh>
    </group>
  )
}

export default Ground
