// src/hooks/useSocket.ts
// Custom React hook — manages Socket.io connection lifecycle and event subscriptions

'use client';

import { useEffect, useRef, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import { getSocket, disconnectSocket, WS_EVENTS } from '@/lib/socket';
import { useAuthStore } from '@/store/authStore';
import { useSocketStore } from '@/store/socketStore';
import { useToastStore } from '@/store/toastStore';

/**
 * useSocket — Connect to WebSocket on mount, subscribe to events, cleanup on unmount.
 *
 * Usage:
 *   const { isConnected, subscribeGame, unsubscribeGame } = useSocket();
 */
export function useSocket() {
    const socketRef = useRef<Socket | null>(null);
    const { token, isAuthenticated } = useAuthStore();
    const {
        isConnected,
        setConnected,
        setLiveWallet,
        setLastResult,
        setLastBetResult,
        setLastBetStream,
        setLastDashboardStats,
        setLastSettlement,
        setLastWindowStatus,
        setLastAnnouncement,
        incrementUnread,
    } = useSocketStore();
    const addToast = useToastStore((s) => s.addToast);

    // Track previous balance for toast delta
    const prevBalanceRef = useRef<number | null>(null);

    // Connect and subscribe to events
    useEffect(() => {
        if (!isAuthenticated || !token) {
            return;
        }

        const socket = getSocket(token);
        socketRef.current = socket;

        // Connection events
        socket.on('connect', () => {
            setConnected(true);
            console.log('[WS] Connected');
        });

        socket.on('disconnect', () => {
            setConnected(false);
            console.log('[WS] Disconnected');
        });

        socket.on('connect_error', (err: Error) => {
            setConnected(false);
            console.error('[WS] Connection error:', err.message);
        });

        // ==========================================
        // EVENT SUBSCRIPTIONS
        // ==========================================

        // Wallet balance updates
        socket.on(WS_EVENTS.WALLET_UPDATE, (data: { wallet_balance: number; exposure: number }) => {
            const prev = prevBalanceRef.current;
            setLiveWallet(data);

            // Toast: balance increased
            if (prev !== null && data.wallet_balance > prev) {
                const delta = data.wallet_balance - prev;
                addToast(`Coins credited: +₹${delta.toLocaleString('en-IN')}`, 'success');
            }
            prevBalanceRef.current = data.wallet_balance;
        });

        // Result declared
        socket.on(WS_EVENTS.RESULT_DECLARED, (data: {
            game_id: number;
            game_name: string;
            session: string;
            panna: string;
            single: number;
            jodi: string | null;
        }) => {
            setLastResult(data);
            incrementUnread();
            addToast(`${data.game_name} result declared: ${data.panna}`, 'info');
        });

        // Bet won notification
        socket.on(WS_EVENTS.BET_WON, (data: {
            game_name: string;
            bet_type: string;
            bet_number: string;
            bet_amount: number;
            win_amount: number;
        }) => {
            setLastBetResult(data);
            incrementUnread();
            addToast(`You won ₹${data.win_amount.toLocaleString('en-IN')} on ${data.game_name}!`, 'success');
        });

        // Bet lost notification
        socket.on(WS_EVENTS.BET_LOST, (data: {
            game_name: string;
            bet_type: string;
            bet_number: string;
            bet_amount: number;
        }) => {
            setLastBetResult(data);
            incrementUnread();
        });

        // Bet stream (admin dashboard live feed)
        socket.on(WS_EVENTS.BET_STREAM, (data: {
            bet_id: string;
            user_id: string;
            game_name: string;
            bet_type: string;
            bet_amount: number;
            status: string;
            created_at: string;
        }) => {
            setLastBetStream(data);
        });

        // Dashboard stats push (admin)
        socket.on(WS_EVENTS.DASHBOARD_UPDATE, (data: {
            totalBetsToday: number;
            totalVolumeToday: number;
            netPnlToday: number;
            activeUsers: number;
        }) => {
            setLastDashboardStats(data);
        });

        // Settlement complete
        socket.on(WS_EVENTS.SETTLEMENT_COMPLETE, (data: {
            game_id: number;
            game_name: string;
            session: string;
            settled_at: string;
        }) => {
            setLastSettlement(data);
        });

        // Window status change
        socket.on(WS_EVENTS.WINDOW_STATUS, (data: {
            game_id: number;
            game_name: string;
            status: 'open' | 'closed';
        }) => {
            setLastWindowStatus(data);
        });

        // Announcements
        socket.on(WS_EVENTS.ANNOUNCEMENT, (data: {
            title: string;
            message: string;
        }) => {
            setLastAnnouncement(data);
            addToast(`📢 ${data.title}`, 'info');
        });

        // Rollback notification
        socket.on(WS_EVENTS.ROLLBACK, (data: {
            game_name?: string;
        }) => {
            incrementUnread();
            addToast(`Settlement rolled back${data?.game_name ? ` for ${data.game_name}` : ''}`, 'warning');
        });

        // Cleanup on unmount or when auth changes
        return () => {
            socket.off('connect');
            socket.off('disconnect');
            socket.off('connect_error');
            socket.off(WS_EVENTS.WALLET_UPDATE);
            socket.off(WS_EVENTS.RESULT_DECLARED);
            socket.off(WS_EVENTS.BET_WON);
            socket.off(WS_EVENTS.BET_LOST);
            socket.off(WS_EVENTS.BET_STREAM);
            socket.off(WS_EVENTS.DASHBOARD_UPDATE);
            socket.off(WS_EVENTS.SETTLEMENT_COMPLETE);
            socket.off(WS_EVENTS.WINDOW_STATUS);
            socket.off(WS_EVENTS.ANNOUNCEMENT);
            socket.off(WS_EVENTS.ROLLBACK);
            disconnectSocket();
            setConnected(false);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAuthenticated, token]);

    // Subscribe to a specific game channel
    const subscribeGame = useCallback((gameId: number) => {
        socketRef.current?.emit('subscribe-game', gameId);
    }, []);

    // Unsubscribe from a game channel
    const unsubscribeGame = useCallback((gameId: number) => {
        socketRef.current?.emit('unsubscribe-game', gameId);
    }, []);

    return {
        isConnected,
        subscribeGame,
        unsubscribeGame,
    };
}
