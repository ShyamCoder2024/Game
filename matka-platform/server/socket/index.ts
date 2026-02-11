// server/socket/index.ts
// Socket.io server — Real-time WebSocket layer
// Attaches to Fastify's underlying HTTP server

import { Server as SocketIOServer } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { redis } from '../lib/redis';
import { AuthService } from '../services/auth.service';
import { ROOMS } from './events';

// Module-level IO instance
let io: SocketIOServer | null = null;

/**
 * Get the Socket.io server instance.
 * Returns null if not yet initialized.
 */
export function getIO(): SocketIOServer | null {
    return io;
}

/**
 * Initialize and attach Socket.io to the HTTP server.
 * Called once after Fastify starts listening.
 */
export async function setupSocket(httpServer: unknown): Promise<SocketIOServer> {
    io = new SocketIOServer(httpServer as Parameters<typeof SocketIOServer>[0], {
        cors: {
            origin: process.env.SOCKET_CORS_ORIGIN || 'http://localhost:3000',
            credentials: true,
        },
        transports: ['websocket', 'polling'],
        pingInterval: 25000,
        pingTimeout: 20000,
    });

    // ==========================================
    // REDIS ADAPTER (for multi-instance support)
    // ==========================================
    try {
        const pubClient = redis.duplicate();
        const subClient = redis.duplicate();

        await Promise.all([pubClient.connect(), subClient.connect()]);
        io.adapter(createAdapter(pubClient, subClient));

        console.log('[WS] Redis adapter connected');
    } catch (err) {
        // Redis adapter is optional — works without it in single-instance mode
        console.warn('[WS] Redis adapter failed, running in single-instance mode:', err);
    }

    // ==========================================
    // AUTHENTICATION MIDDLEWARE
    // ==========================================
    io.use((socket, next) => {
        try {
            const token = socket.handshake.auth?.token;
            if (!token) {
                return next(new Error('Authentication token required'));
            }

            const decoded = AuthService.verifyToken(token);
            socket.data.user = decoded;
            next();
        } catch (err) {
            next(new Error('Authentication failed'));
        }
    });

    // ==========================================
    // CONNECTION HANDLER
    // ==========================================
    io.on('connection', (socket) => {
        const user = socket.data.user;

        if (!user) {
            socket.disconnect(true);
            return;
        }

        console.log(`[WS] Connected: ${user.user_id} (${user.role})`);

        // Join personal room
        socket.join(ROOMS.user(user.id));

        // Join role-based room
        socket.join(ROOMS.role(user.role));

        // Admin joins admin-specific rooms
        if (user.role === 'admin') {
            socket.join(ROOMS.ADMIN_DASHBOARD);
            socket.join(ROOMS.ADMIN_BET_STREAM);
        }

        // ========== Game subscription ==========
        socket.on('subscribe-game', (gameId: number) => {
            if (typeof gameId === 'number' && gameId > 0) {
                socket.join(ROOMS.game(gameId));
            }
        });

        socket.on('unsubscribe-game', (gameId: number) => {
            if (typeof gameId === 'number' && gameId > 0) {
                socket.leave(ROOMS.game(gameId));
            }
        });

        // ========== Disconnect ==========
        socket.on('disconnect', (reason) => {
            console.log(`[WS] Disconnected: ${user.user_id} (${reason})`);
        });

        // ========== Error handler ==========
        socket.on('error', (err) => {
            console.error(`[WS] Socket error for ${user.user_id}:`, err);
        });
    });

    console.log('[WS] Socket.io server initialized');
    return io;
}
