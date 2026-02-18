const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // Vite dev server
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
        this.currentCube = null;
        this.cubeSpawnTimeout = null;
        this.cubeHideTimeout = null;
        this.settings = {
            cubeSpawnDelayMin: 3000,
            cubeSpawnDelayMax: 5000,
            cubeStayDuration: 2000
        };
    }

    addPlayer(socketId, name) {
        this.players.set(socketId, {
            id: socketId,
            name: name || `Player ${this.players.size + 1}`,
            score: 0,
            lives: 3,
            isGameOver: false
        });
        
        console.log(`✅ Player added to session ${this.id}: ${name} (${socketId}), total: ${this.players.size}`);
        
        // Start cube spawning if first player
        if (this.players.size === 1) {
            console.log(`🎲 Starting cube spawning for session ${this.id}`);
            this.scheduleNextCube();
        }
    }

    removePlayer(socketId) {
        const player = this.players.get(socketId);
        if (player) {
            console.log(`❌ Player removed from session ${this.id}: ${player.name} (${socketId})`);
        }
        this.players.delete(socketId);
        
        // Stop spawning if no players
        if (this.players.size === 0) {
            console.log(`⏸️  No players left in session ${this.id}, stopping cube spawning`);
            if (this.cubeSpawnTimeout) {
                clearTimeout(this.cubeSpawnTimeout);
                this.cubeSpawnTimeout = null;
            }
            if (this.cubeHideTimeout) {
                clearTimeout(this.cubeHideTimeout);
                this.cubeHideTimeout = null;
            }
        }
    }

    scheduleNextCube() {
        if (this.players.size === 0) return;
        
        const delay = this.settings.cubeSpawnDelayMin + 
                     Math.random() * (this.settings.cubeSpawnDelayMax - this.settings.cubeSpawnDelayMin);
        
        console.log(`⏰ Next cube in ${Math.round(delay)}ms for session ${this.id}`);
        
        this.cubeSpawnTimeout = setTimeout(() => {
            this.spawnCube();
        }, delay);
    }

    spawnCube() {
        if (this.players.size === 0) return;
        
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
        
        // Broadcast to all players in session
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
}

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('🔌 Client connected:', socket.id);
    
    // Create new session
    socket.on('createSession', () => {
        const sessionId = generateSlug();
        const session = new GameSession(sessionId);
        sessions.set(sessionId, session);
        
        console.log(`✅ Session created: ${sessionId}, total sessions: ${sessions.size}`);
        console.log(`   Active sessions: [${Array.from(sessions.keys()).join(', ')}]`);
        
        socket.emit('sessionCreated', { sessionId });
        
        // Auto-cleanup empty sessions after 30 seconds
        setTimeout(() => {
            const sess = sessions.get(sessionId);
            if (sess && sess.players.size === 0) {
                sessions.delete(sessionId);
                console.log(`🗑️  Deleted empty session ${sessionId} (30s grace period expired)`);
            }
        }, 30000);
    });
    
    // Join existing session
    socket.on('joinSession', ({ sessionId, playerName }) => {
        console.log(`🚪 Join attempt: ${playerName} -> ${sessionId}`);
        
        const session = sessions.get(sessionId);
        
        if (!session) {
            console.log(`❌ Session ${sessionId} not found!`);
            socket.emit('error', { message: 'Session not found' });
            return;
        }
        
        socket.join(sessionId);
        session.addPlayer(socket.id, playerName);
        socket.sessionId = sessionId;
        
        // Send current state to joining player
        socket.emit('sessionJoined', {
            socketId: socket.id,
            players: session.getPlayers()
        });
        
        // Notify all players in session
        io.to(sessionId).emit('playersUpdate', session.getPlayers());
        
        // If there's an active cube, send it to the new player
        if (session.currentCube) {
            socket.emit('cubeSpawned', session.currentCube);
        }
    });
    
    // Handle cube hit
    socket.on('cubeHit', ({ isRed }) => {
        const session = sessions.get(socket.sessionId);
        if (session) {
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
    console.log(`\n💡 Run Vite dev server separately: npm run dev\n`);
});
