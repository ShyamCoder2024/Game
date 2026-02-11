// server/socket/emitters.ts
// Safe WebSocket emit helpers — never crash, never throw
// These are called from services AFTER transactions commit

import { getIO } from './index';
import { ROOMS } from './events';

/**
 * Safely emit to a specific user's room
 */
export function emitToUser(userId: number, event: string, data: unknown): void {
    try {
        const io = getIO();
        if (io) {
            io.to(ROOMS.user(userId)).emit(event, data);
        }
    } catch (err) {
        console.error(`[WS] Failed to emit ${event} to user:${userId}`, err);
    }
}

/**
 * Safely emit to a game room
 */
export function emitToGame(gameId: number, event: string, data: unknown): void {
    try {
        const io = getIO();
        if (io) {
            io.to(ROOMS.game(gameId)).emit(event, data);
        }
    } catch (err) {
        console.error(`[WS] Failed to emit ${event} to game:${gameId}`, err);
    }
}

/**
 * Safely emit to admin dashboard room
 */
export function emitToAdmins(event: string, data: unknown): void {
    try {
        const io = getIO();
        if (io) {
            io.to(ROOMS.ADMIN_DASHBOARD).emit(event, data);
        }
    } catch (err) {
        console.error(`[WS] Failed to emit ${event} to admins`, err);
    }
}

/**
 * Safely emit to admin bet stream room
 */
export function emitBetStream(data: unknown): void {
    try {
        const io = getIO();
        if (io) {
            io.to(ROOMS.ADMIN_BET_STREAM).emit('bet-stream', data);
        }
    } catch (err) {
        console.error('[WS] Failed to emit bet-stream', err);
    }
}

/**
 * Safely broadcast to all connected clients
 */
export function emitToAll(event: string, data: unknown): void {
    try {
        const io = getIO();
        if (io) {
            io.emit(event, data);
        }
    } catch (err) {
        console.error(`[WS] Failed to broadcast ${event}`, err);
    }
}
