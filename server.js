import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "http://192.168.68.103:5173"],
    methods: ["GET", "POST"]
  }
});

app.use(cors());

// Game sessions
const sessions = new Map();

// Generate unique slug
function generateSlug() {
    return Math.random().toString(36).substring(2, 8);
}

// Session class
class GameSession {
    constructor(id) {
        this.id = id;
        this.players = new Map();
        this.hostId = null; // First player becomes host
        this.status = 'waiting'; // 'waiting' | 'active' | 'finished'
        this.currentCube = null;
        this.cubeSpawnTimeout = null;
        this.cubeHideTimeout = null;
        this.settings = {
            cubeSpawnDelayMin: 3000,
            cubeSpawnDelayMax: 5000,
            cubeStayDuration: 2000,
            minPlayers: 2, // Minimum players to start
            maxPlayers: 8  // Maximum players per session
        };
    }

    addPlayer(socketId, name) {
        // Set first player as host
        if (this.players.size === 0) {
            this.hostId = socketId;
            console.log(`👑 ${name} is now the host of session ${this.id}`);
        }
        
        this.players.set(socketId, {
            id: socketId,
            name: name || `Player ${this.players.size + 1}`,
            score: 0,
            lives: 3,
            isGameOver: false,
            isHost: socketId === this.hostId
        });
        
        console.log(`✅ Player added to session ${this.id}: ${name} (${socketId}), total: ${this.players.size}`);
        
        return this.players.get(socketId);
    }

    removePlayer(socketId) {
        const player = this.players.get(socketId);
        if (player) {
            console.log(`❌ Player removed from session ${this.id}: ${player.name} (${socketId})`);
        }
        this.players.delete(socketId);
        
        // Transfer host if host left
        if (socketId === this.hostId && this.players.size > 0) {
            const newHost = Array.from(this.players.keys())[0];
            this.hostId = newHost;
            this.players.get(newHost).isHost = true;
            console.log(`👑 New host: ${this.players.get(newHost).name}`);
            io.to(this.id).emit('hostChanged', { newHostId: newHost });
        }
        
        // Stop game if not enough players
        if (this.status === 'active' && this.players.size < this.settings.minPlayers) {
            this.pauseGame();
        }
        
        // Stop spawning if no players
        if (this.players.size === 0) {
            this.stopSpawning();
        }
    }

    startGame() {
        if (this.status === 'active') {
            console.log(`⚠️  Session ${this.id} already active`);
            return false;
        }
        
        if (this.players.size < this.settings.minPlayers) {
            console.log(`⚠️  Not enough players (${this.players.size}/${this.settings.minPlayers})`);
            return false;
        }
        
        this.status = 'active';
        console.log(`🎮 Game started in session ${this.id} with ${this.players.size} players`);
        this.scheduleNextCube();
        return true;
    }

    pauseGame() {
        if (this.status !== 'active') return;
        
        this.status = 'waiting';
        this.stopSpawning();
        console.log(`⏸️  Game paused in session ${this.id} (not enough players)`);
        io.to(this.id).emit('gamePaused', { 
            reason: 'Not enough players',
            minPlayers: this.settings.minPlayers 
        });
    }

    stopSpawning() {
        if (this.cubeSpawnTimeout) {
            clearTimeout(this.cubeSpawnTimeout);
            this.cubeSpawnTimeout = null;
        }
        if (this.cubeHideTimeout) {
            clearTimeout(this.cubeHideTimeout);
            this.cubeHideTimeout = null;
        }
    }

    scheduleNextCube() {
        if (this.players.size === 0 || this.status !== 'active') return;
        
        const delay = this.settings.cubeSpawnDelayMin + 
                     Math.random() * (this.settings.cubeSpawnDelayMax - this.settings.cubeSpawnDelayMin);
        
        console.log(`⏰ Next cube in ${Math.round(delay)}ms for session ${this.id}`);
        
        this.cubeSpawnTimeout = setTimeout(() => {
            this.spawnCube();
        }, delay);
    }

    spawnCube() {
        if (this.players.size === 0 || this.status !== 'active') return;
        
        const isRed = Math.random() > 0.7;
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * 0.8;
        
        this.currentCube = {
            isRed,
            x: Math.cos(angle) * distance,
            z: Math.sin(angle) * distance,
            spawnTime: Date.now(),
            hitBy: null
        };
        
        console.log(`🎲 Cube spawned in session ${this.id}: ${isRed ? 'RED' : 'GREEN'} at (${this.currentCube.x.toFixed(2)}, ${this.currentCube.z.toFixed(2)})`);
        
        io.to(this.id).emit('cubeSpawned', this.currentCube);
        
        // Auto-hide after stay duration
        this.cubeHideTimeout = setTimeout(() => {
            if (this.currentCube && !this.currentCube.hitBy) {
                console.log(`👻 Cube auto-hidden in session ${this.id} (not hit)`);
                this.currentCube = null;
                io.to(this.id).emit('cubeHidden');
                this.scheduleNextCube();
            }
        }, this.settings.cubeStayDuration);
    }

    handleHit(socketId, isRedHit) {
        if (!this.currentCube || this.currentCube.hitBy) {
            console.log(`⚠️  Hit rejected in session ${this.id}: cube already hit or doesn't exist`);
            return;
        }
        
        const player = this.players.get(socketId);
        if (!player || player.isGameOver) {
            console.log(`⚠️  Hit rejected in session ${this.id}: player not found or game over`);
            return;
        }
        
        this.currentCube.hitBy = socketId;
        
        if (this.currentCube.isRed) {
            player.lives--;
            console.log(`💔 ${player.name} hit RED cube! Lives: ${player.lives}`);
            if (player.lives <= 0) {
                player.isGameOver = true;
                console.log(`☠️  ${player.name} GAME OVER!`);
            }
        } else {
            player.score++;
            console.log(`✨ ${player.name} hit GREEN cube! Score: ${player.score}`);
        }
        
        // Clear the auto-hide timeout
        if (this.cubeHideTimeout) {
            clearTimeout(this.cubeHideTimeout);
            this.cubeHideTimeout = null;
        }
        
        // Send score update to the player who hit
        io.to(socketId).emit('scoreUpdate', {
            score: player.score,
            lives: player.lives,
            isGameOver: player.isGameOver
        });
        
        // Broadcast players update to everyone
        io.to(this.id).emit('playersUpdate', Array.from(this.players.values()));
        
        // Hide cube and spawn next
        this.currentCube = null;
        io.to(this.id).emit('cubeHidden');
        this.scheduleNextCube();
    }

    getPlayers() {
        return Array.from(this.players.values());
    }

    canJoin() {
        return this.players.size < this.settings.maxPlayers && this.status !== 'finished';
    }

    getState() {
        return {
            id: this.id,
            status: this.status,
            playerCount: this.players.size,
            maxPlayers: this.settings.maxPlayers,
            minPlayers: this.settings.minPlayers,
            hostId: this.hostId,
            players: this.getPlayers()
        };
    }
}

// Find session with fewest players for auto-matchmaking
function findBestSession() {
    let bestSession = null;
    let minPlayers = Infinity;
    
    for (const [id, session] of sessions.entries()) {
        if (session.canJoin() && session.status === 'waiting') {
            if (session.players.size < minPlayers) {
                minPlayers = session.players.size;
                bestSession = session;
            }
        }
    }
    
    return bestSession;
}

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('🔌 Client connected:', socket.id);
    
    // Auto-matchmaking (find or create session)
    socket.on('quickMatch', ({ playerName }) => {
        console.log(`🎯 Quick match request from ${playerName}`);
        
        let session = findBestSession();
        
        if (!session) {
            // Create new session if none available
            const sessionId = generateSlug();
            session = new GameSession(sessionId);
            sessions.set(sessionId, session);
            console.log(`✅ New session created for quick match: ${sessionId}`);
        }
        
        socket.join(session.id);
        const player = session.addPlayer(socket.id, playerName);
        socket.sessionId = session.id;
        
        // Send session info to joining player
        socket.emit('sessionJoined', {
            sessionId: session.id,
            socketId: socket.id,
            ...session.getState()
        });
        
        // Notify all players in session
        io.to(session.id).emit('playersUpdate', session.getPlayers());
    });
    
    // Create new session manually
    socket.on('createSession', () => {
        const sessionId = generateSlug();
        const session = new GameSession(sessionId);
        sessions.set(sessionId, session);
        
        console.log(`✅ Session created: ${sessionId}, total sessions: ${sessions.size}`);
        
        socket.emit('sessionCreated', { sessionId });
    });
    
    // Join specific session by code
    socket.on('joinSession', ({ sessionId, playerName }) => {
        console.log(`🚪 Join attempt: ${playerName} -> ${sessionId}`);
        
        const session = sessions.get(sessionId);
        
        if (!session) {
            console.log(`❌ Session ${sessionId} not found!`);
            socket.emit('error', { message: 'Session not found' });
            return;
        }
        
        if (!session.canJoin()) {
            console.log(`❌ Session ${sessionId} is full!`);
            socket.emit('error', { message: 'Session is full' });
            return;
        }
        
        socket.join(sessionId);
        const player = session.addPlayer(socket.id, playerName);
        socket.sessionId = sessionId;
        
        // Send current state to joining player
        socket.emit('sessionJoined', {
            sessionId: session.id,
            socketId: socket.id,
            ...session.getState()
        });
        
        // Notify all players in session
        io.to(sessionId).emit('playersUpdate', session.getPlayers());
        
        // If there's an active cube, send it to the new player
        if (session.currentCube && session.status === 'active') {
            socket.emit('cubeSpawned', session.currentCube);
        }
    });
    
    // Start game (host only)
    socket.on('startGame', () => {
        const session = sessions.get(socket.sessionId);
        if (!session) return;
        
        if (socket.id !== session.hostId) {
            socket.emit('error', { message: 'Only the host can start the game' });
            return;
        }
        
        if (session.startGame()) {
            io.to(session.id).emit('gameStarted', {
                status: 'active'
            });
        } else {
            socket.emit('error', { 
                message: `Need at least ${session.settings.minPlayers} players to start` 
            });
        }
    });
    
    // Handle cube hit
    socket.on('cubeHit', ({ isRed }) => {
        const session = sessions.get(socket.sessionId);
        if (session && session.status === 'active') {
            session.handleHit(socket.id, isRed);
        }
    });
    
    // Disconnect
    socket.on('disconnect', () => {
        console.log('🔌 Client disconnected:', socket.id);
        
        const session = sessions.get(socket.sessionId);
        if (session) {
            session.removePlayer(socket.id);
            
            // Notify other players
            io.to(socket.sessionId).emit('playersUpdate', session.getPlayers());
            
            // Delete empty sessions after grace period
            if (session.players.size === 0) {
                setTimeout(() => {
                    const stillEmpty = sessions.get(socket.sessionId);
                    if (stillEmpty && stillEmpty.players.size === 0) {
                        sessions.delete(socket.sessionId);
                        console.log(`🗑️  Session ${socket.sessionId} deleted (no players, 30s grace expired)`);
                    }
                }, 30000);
            }
        }
    });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`\n🎮 Multiplayer server running on:`);
    console.log(`   http://localhost:${PORT}`);
    console.log(`\n💡 Features:`);
    console.log(`   - Auto-matchmaking to sessions with fewest players`);
    console.log(`   - Host controls (first player starts game)`);
    console.log(`   - Min ${2} players to start`);
    console.log(`\n💡 Run Vite dev server separately: npm run dev\n`);
});
