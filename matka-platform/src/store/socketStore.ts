// src/store/socketStore.ts
// Zustand store for real-time WebSocket state

import { create } from 'zustand';

// ===== Event payload types =====

interface WalletUpdateEvent {
    wallet_balance: number;
    exposure: number;
}

interface BetResultEvent {
    game_name: string;
    bet_type: string;
    bet_number: string;
    bet_amount: number;
    win_amount?: number;
}

interface ResultDeclaredEvent {
    game_id: number;
    game_name: string;
    session: string;
    panna: string;
    single: number;
    jodi: string | null;
}

interface BetStreamEvent {
    bet_id: string;
    user_id: string;
    game_name: string;
    bet_type: string;
    bet_amount: number;
    status: string;
    created_at: string;
}

interface DashboardStatsEvent {
    totalBetsToday: number;
    totalVolumeToday: number;
    netPnlToday: number;
    activeUsers: number;
}

interface SettlementEvent {
    game_id: number;
    game_name: string;
    session: string;
    settled_at: string;
}

interface WindowStatusEvent {
    game_id: number;
    game_name: string;
    status: 'open' | 'closed';
}

interface AnnouncementEvent {
    title: string;
    message: string;
}

// ===== Store =====

interface SocketState {
    // Connection
    isConnected: boolean;
    setConnected: (connected: boolean) => void;

    // Real-time wallet balance
    liveBalance: number | null;
    liveExposure: number | null;
    setLiveWallet: (data: WalletUpdateEvent) => void;

    // Latest result event
    lastResult: ResultDeclaredEvent | null;
    setLastResult: (result: ResultDeclaredEvent) => void;

    // Latest bet result (won/lost)
    lastBetResult: BetResultEvent | null;
    setLastBetResult: (event: BetResultEvent) => void;

    // Live bet stream (admin dashboard)
    lastBetStream: BetStreamEvent | null;
    setLastBetStream: (event: BetStreamEvent) => void;

    // Dashboard stats push (admin)
    lastDashboardStats: DashboardStatsEvent | null;
    setLastDashboardStats: (event: DashboardStatsEvent) => void;

    // Settlement complete event
    lastSettlement: SettlementEvent | null;
    setLastSettlement: (event: SettlementEvent) => void;

    // Window status change (open/closed)
    lastWindowStatus: WindowStatusEvent | null;
    setLastWindowStatus: (event: WindowStatusEvent) => void;

    // Announcement push
    lastAnnouncement: AnnouncementEvent | null;
    setLastAnnouncement: (event: AnnouncementEvent) => void;

    // Notification count (unread)
    unreadCount: number;
    incrementUnread: () => void;
    resetUnread: () => void;

    // Reset all state
    reset: () => void;
}

export const useSocketStore = create<SocketState>((set) => ({
    // Connection
    isConnected: false,
    setConnected: (connected) => set({ isConnected: connected }),

    // Wallet
    liveBalance: null,
    liveExposure: null,
    setLiveWallet: (data) => set({ liveBalance: data.wallet_balance, liveExposure: data.exposure }),

    // Results
    lastResult: null,
    setLastResult: (result) => set({ lastResult: result }),

    // Bet results
    lastBetResult: null,
    setLastBetResult: (event) => set({ lastBetResult: event }),

    // Bet stream (admin)
    lastBetStream: null,
    setLastBetStream: (event) => set({ lastBetStream: event }),

    // Dashboard stats
    lastDashboardStats: null,
    setLastDashboardStats: (event) => set({ lastDashboardStats: event }),

    // Settlement
    lastSettlement: null,
    setLastSettlement: (event) => set({ lastSettlement: event }),

    // Window status
    lastWindowStatus: null,
    setLastWindowStatus: (event) => set({ lastWindowStatus: event }),

    // Announcement
    lastAnnouncement: null,
    setLastAnnouncement: (event) => set({ lastAnnouncement: event }),

    // Notifications
    unreadCount: 0,
    incrementUnread: () => set((state) => ({ unreadCount: state.unreadCount + 1 })),
    resetUnread: () => set({ unreadCount: 0 }),

    // Reset
    reset: () =>
        set({
            isConnected: false,
            liveBalance: null,
            liveExposure: null,
            lastResult: null,
            lastBetResult: null,
            lastBetStream: null,
            lastDashboardStats: null,
            lastSettlement: null,
            lastWindowStatus: null,
            lastAnnouncement: null,
            unreadCount: 0,
        }),
}));
