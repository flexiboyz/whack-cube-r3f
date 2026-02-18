# 🛠️ Development Guide

## Getting Started

### First Time Setup

```bash
# Clone and install
git clone https://github.com/flexiboyz/whack-cube-r3f.git
cd whack-cube-r3f
npm install
```

### Running in Development

You need **TWO terminals running simultaneously**:

#### Terminal 1: Socket.IO Server
```bash
npm run server
```
- Runs on port **3001**
- Handles multiplayer synchronization
- Logs cube spawns, hits, and player events

#### Terminal 2: Vite Dev Server
```bash
npm run dev
```
- Runs on port **5173**
- Hot Module Replacement (HMR)
- Proxies Socket.IO to port 3001

Open **http://localhost:5173** in your browser!

## 📐 Architecture

### State Management (Zustand)

All game state lives in `src/store/gameStore.js`:

```js
{
  score: 0,
  lives: 3,
  isGameOver: false,
  currentCube: null,
  hammerPosition: [0, 5, 0],
  params: { gravity, hammerRaiseSpeed, etc. }
}
```

Access from components:
```jsx
import useGameStore from '../store/gameStore'

function MyComponent() {
  const score = useGameStore(state => state.score)
  const incrementScore = useGameStore(state => state.incrementScore)
  // ...
}
```

### Socket.IO Events

**Client → Server:**
- `createSession` - Request new session
- `joinSession` - Join existing session
- `cubeHit` - Report hitting a cube

**Server → Client:**
- `sessionCreated` - New session created
- `sessionJoined` - Successfully joined
- `cubeSpawned` - New cube appeared
- `cubeHidden` - Cube disappeared
- `scoreUpdate` - Score/lives changed
- `playersUpdate` - Leaderboard update

### Component Hierarchy

```
App (Router)
├── Lobby
│   └── (HTML/CSS only)
└── Game
    ├── HUD (UI overlay)
    └── Canvas
        └── Scene
            ├── Ground
            ├── Hammer
            └── Cube (conditional)
```

## 🎨 Styling

CSS Modules pattern:
- `Lobby.jsx` → `Lobby.css`
- `Game.jsx` → `Game.css`
- `HUD.jsx` → `HUD.css`

3D components (Ground, Hammer, Cube) are styled with R3F props.

## 🔧 Adding Features

### New 3D Object

1. Create component in `src/components/3d/`
2. Add to Scene.jsx
3. Use R3F hooks: `useFrame`, `useThree`, etc.

Example:
```jsx
function MyObject() {
  const ref = useRef()
  
  useFrame(() => {
    ref.current.rotation.y += 0.01
  })
  
  return (
    <mesh ref={ref}>
      <boxGeometry />
      <meshStandardMaterial color="hotpink" />
    </mesh>
  )
}
```

### New Game Parameter

1. Add to `gameStore.js` params
2. Add Leva control in `Game.jsx`
3. Use in relevant component

### New Socket Event

1. Add handler in `server.js`
2. Add listener in appropriate React component
3. Update Zustand store if needed

## 🐛 Debugging

### Socket.IO Issues

Check server logs:
```bash
npm run server
# Look for: "Client connected", "Session created", etc.
```

Check client console (F12):
```js
// In Game.jsx
console.log('Socket connected:', socket.connected)
```

### State Issues

Install React DevTools + Zustand DevTools:
```bash
npm install --save-dev @redux-devtools/extension
```

### 3D Scene Issues

Use R3F DevTools:
```jsx
import { Stats } from '@react-three/drei'

<Canvas>
  <Stats />
  {/* ... */}
</Canvas>
```

## 🚀 Production Build

```bash
# Build
npm run build

# Test production build locally
npm run preview
```

Output goes to `dist/` folder.

### Deployment Checklist

1. Update Socket.IO URL in `Game.jsx` and `Lobby.jsx`:
   ```js
   const socket = io('https://your-server.com')
   ```

2. Deploy static files (`dist/`) to:
   - Vercel
   - Netlify
   - Cloudflare Pages
   - Any static host

3. Deploy server separately:
   - Railway
   - Render
   - Heroku
   - VPS with Node.js

4. Update CORS in `server.js`:
   ```js
   const io = new Server(server, {
     cors: {
       origin: "https://your-frontend.com"
     }
   });
   ```

## 📦 Dependencies

### Core
- `react` + `react-dom` - UI framework
- `@react-three/fiber` - React renderer for Three.js
- `@react-three/drei` - R3F helpers
- `three` (peer dep of R3F) - 3D library

### State & Routing
- `zustand` - State management
- `react-router-dom` - Client-side routing

### Multiplayer
- `socket.io-client` - Real-time client
- `socket.io` - Real-time server
- `express` - Web server
- `cors` - Cross-origin headers

### Dev Experience
- `vite` - Build tool & dev server
- `leva` - GUI controls
- `eslint` - Linting

## 💡 Tips

**Hot Reload:**
- React components → instant HMR
- CSS → instant HMR
- Server changes → restart `npm run server`

**Performance:**
- R3F automatically batches render calls
- Use `useMemo` for expensive computations
- Zustand only re-renders components that use changed state

**Mobile:**
- Touch events work automatically
- Test on actual device (use local network IP)
- Consider adding on-screen controls

**Debugging HMR issues:**
```bash
# Clear Vite cache
rm -rf node_modules/.vite
```

## 🧪 Testing Multiplayer Locally

1. Open **two browser windows** (or one normal + one incognito)
2. Create session in window 1
3. Copy the 6-character code
4. Join with window 2
5. Hit cubes and watch leaderboard sync!

Or use multiple devices on same network:
```bash
# In Vite terminal, note the "Network" URL
npm run dev
# → http://192.168.x.x:5173
```

## 📚 Resources

- [React Three Fiber Docs](https://docs.pmnd.rs/react-three-fiber)
- [Three.js Fundamentals](https://threejs.org/manual/)
- [Socket.IO Docs](https://socket.io/docs/)
- [Zustand Guide](https://docs.pmnd.rs/zustand)
- [Vite Guide](https://vitejs.dev/guide/)

---

Happy hacking! 🔨⚛️
