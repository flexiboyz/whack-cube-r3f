# 🔨 Whack-a-Cube Multiplayer (React Three Fiber)

A real-time multiplayer 3D whack-a-mole game built with **React Three Fiber**, **Vite**, and **Socket.IO**.

This is the modern React version of the original vanilla JS game, featuring the same game mechanics and parameters in a component-based architecture.

![Game Preview](https://img.shields.io/badge/multiplayer-real--time-brightgreen) ![React](https://img.shields.io/badge/react-19-blue) ![R3F](https://img.shields.io/badge/r3f-latest-orange)

## 🎮 Features

- **Real-time Multiplayer** - Synchronized gameplay across all players
- **React Three Fiber** - Declarative 3D with React components
- **Session-based** - Unique 6-character codes for easy joining
- **Live Leaderboard** - See all players' scores and lives
- **Two Cube Types:**
  - 🟢 **Green cubes** - Hit for points!
  - 🔴 **Red cubes** - Avoid! (3 hits = game over)
- **Physics-based Hammer** - Gravity and anticipation mechanics
- **Tweakable Parameters** - Leva GUI panel for live adjustments
- **Mobile Friendly** - Touch controls supported
- **Vite HMR** - Lightning-fast development with Hot Module Replacement

## 🚀 Quick Start

### Prerequisites

- Node.js (v18 or higher)
- npm

### Installation

```bash
# Clone the repository
git clone https://github.com/flexiboyz/whack-cube-r3f.git
cd whack-cube-r3f

# Install dependencies
npm install
```

### Running the Game

**You need to run TWO terminals:**

#### Terminal 1 - Socket.IO Server
```bash
npm run server
```
Server runs on **http://localhost:3001**

#### Terminal 2 - Vite Dev Server
```bash
npm run dev
```
Vite runs on **http://localhost:5173**

Then open **http://localhost:5173** in your browser!

## 📦 Production Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

For production deployment, you'll need to:
1. Build the React app (`npm run build`)
2. Serve the `dist/` folder with a static file server
3. Run the Socket.IO server separately (`npm run server`)

## 🎯 How to Play

1. **Create a Session**
   - Enter your name (optional)
   - Click "Create New Game"
   - Share the 6-character code with friends

2. **Join a Session**
   - Enter your name (optional)
   - Enter a friend's session code
   - Click "Join Game"

3. **Game Controls**
   - **Mouse/Touch down** - Raise the hammer (anticipation)
   - **Mouse/Touch up** - Drop the hammer
   - **Objective** - Hit green cubes, avoid red cubes!

## 🛠️ Tech Stack

### Frontend
- **React 19** - Latest React features
- **React Three Fiber** - React renderer for Three.js
- **@react-three/drei** - Useful helpers for R3F
- **Socket.IO Client** - Real-time communication
- **Zustand** - Lightweight state management
- **Leva** - GUI controls for tweaking parameters
- **React Router** - Client-side routing
- **Vite** - Lightning-fast build tool

### Backend
- **Node.js** - JavaScript runtime
- **Express** - Web server framework
- **Socket.IO** - Real-time bidirectional communication
- **CORS** - Cross-origin resource sharing

## 📁 Project Structure

```
whack-cube-r3f/
├── src/
│   ├── components/
│   │   ├── 3d/
│   │   │   ├── Cube.jsx       # Popup cube component
│   │   │   ├── Ground.jsx     # Ground plane + hole
│   │   │   └── Hammer.jsx     # Hammer with physics
│   │   ├── Game.jsx           # Main game scene
│   │   ├── HUD.jsx            # UI overlay (score, leaderboard)
│   │   ├── Lobby.jsx          # Session creation/joining
│   │   └── Scene.jsx          # 3D scene wrapper
│   ├── store/
│   │   └── gameStore.js       # Zustand state management
│   ├── App.jsx                # Router setup
│   └── main.jsx               # App entry point
├── server.js                  # Socket.IO multiplayer server
├── vite.config.js             # Vite configuration
└── package.json               # Dependencies & scripts
```

## 🎛️ Game Parameters

All parameters from the vanilla version are preserved and tweakable via the Leva GUI panel:

**Hammer Settings:**
- Gravity (-0.1 to -0.005)
- Raise Speed (0.05 to 0.5)

**Cube Settings:**
- Pop Speed (0.01 to 0.2)
- Stay Duration (500-5000ms)
- Spawn Delay Min (1000-10000ms)
- Spawn Delay Max (1000-10000ms)

**Camera:**
- Position: [0, 2.5, 8]
- FOV: 75
- LookAt: [0, 1, 0]

## 🌐 Multiplayer Architecture

- **Session Management:** Unique slug-based sessions with 30-second grace period
- **Real-time Sync:** Server-authoritative cube spawning
- **Hit Detection:** Client-side detection, server-side validation
- **State Management:** Zustand store synced with Socket.IO events
- **Auto-cleanup:** Empty sessions deleted after 30 seconds

## 🔄 Differences from Vanilla Version

### Advantages
- ✅ Declarative component-based 3D
- ✅ Hot Module Replacement (HMR)
- ✅ Better state management (Zustand)
- ✅ Type-safe with modern tooling
- ✅ Easier to extend and maintain
- ✅ React ecosystem benefits

### Same Game Mechanics
- ✅ All physics parameters identical
- ✅ Same camera positioning
- ✅ Same cube spawn logic
- ✅ Same multiplayer protocol
- ✅ Same visual design

## 🤝 Contributing

Contributions welcome! Feel free to:
- Report bugs
- Suggest features
- Submit pull requests

## 📝 License

MIT License - use this project however you'd like!

## 🔗 Related

- **Vanilla JS Version:** [whack-cube-multiplayer](https://github.com/flexiboyz/whack-cube-multiplayer)
- **Three.js:** https://threejs.org
- **React Three Fiber:** https://docs.pmnd.rs/react-three-fiber

## 🦞 Created By

Built with OpenClaw - an autonomous AI agent framework.

GitHub: [@flexiboyz](https://github.com/flexiboyz)

---

**Have fun whacking cubes in React!** 🔨🎮⚛️
