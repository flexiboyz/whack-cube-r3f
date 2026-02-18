import { create } from 'zustand'

const useGameStore = create((set, get) => ({
  // Game state
  score: 0,
  lives: 3,
  isGameOver: false,
  redHits: 0,
  
  // Multiplayer
  sessionId: null,
  mySocketId: null,
  allPlayers: [],
  playerName: localStorage.getItem('playerName') || 'Player',
  
  // Cube state
  currentCube: null,
  cubeIsUp: false,
  
  // Hammer state
  hammerPosition: [0, 5, 0],
  hammerVelocity: 0,
  hammerFalling: false,
  hammerRaised: false,
  
  // Game parameters (same as vanilla version)
  params: {
    gravity: -0.02,
    hammerRaiseSpeed: 0.15,
    groundLevel: 2,
    normalHeight: 5,
    raisedHeight: 6.5,
    cubePopSpeed: 0.05,
    cubeStayDuration: 2000,
    cubeSpawnDelayMin: 3000,
    cubeSpawnDelayMax: 5000,
  },
  
  // Actions
  setSessionId: (id) => set({ sessionId: id }),
  setMySocketId: (id) => set({ mySocketId: id }),
  setPlayerName: (name) => {
    localStorage.setItem('playerName', name)
    set({ playerName: name })
  },
  
  incrementScore: () => set((state) => ({ score: state.score + 1 })),
  
  incrementRedHits: () => set((state) => {
    const newRedHits = state.redHits + 1
    const newLives = 3 - newRedHits
    const gameOver = newLives <= 0
    return { 
      redHits: newRedHits, 
      lives: newLives,
      isGameOver: gameOver 
    }
  }),
  
  setCurrentCube: (cube) => set({ currentCube: cube }),
  setCubeIsUp: (isUp) => set({ cubeIsUp: isUp }),
  
  setHammerPosition: (pos) => set({ hammerPosition: pos }),
  setHammerVelocity: (vel) => set({ hammerVelocity: vel }),
  setHammerFalling: (falling) => set({ hammerFalling: falling }),
  setHammerRaised: (raised) => set({ hammerRaised: raised }),
  
  updateAllPlayers: (players) => set({ allPlayers: players }),
  
  updateParams: (newParams) => set((state) => ({
    params: { ...state.params, ...newParams }
  })),
  
  resetGame: () => set({
    score: 0,
    lives: 3,
    isGameOver: false,
    redHits: 0,
    currentCube: null,
    cubeIsUp: false,
    hammerPosition: [0, 5, 0],
    hammerVelocity: 0,
    hammerFalling: false,
    hammerRaised: false,
  }),
}))

export default useGameStore
