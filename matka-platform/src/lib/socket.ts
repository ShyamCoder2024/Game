// src/lib/socket.ts
// Socket.io client singleton — connects to the backend WebSocket server

import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';

let socket: Socket | null = null;

/**
 * Get the singleton socket instance.
 * Creates and connects if not already connected.
 */
export function getSocket(token: string): Socket {
    if (socket?.connected) {
        return socket;
    }

    socket = io(SOCKET_URL, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 10000,
        timeout: 20000,
    });

    return socket;
}

/**
 * Disconnect and destroy the socket instance.
 */
export function disconnectSocket(): void {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
}

/**
 * Check if socket is currently connected.
 */
export function isSocketConnected(): boolean {
    return socket?.connected ?? false;
}

// Re-export event constants for convenience
export { WS_EVENTS } from './socketEvents';
