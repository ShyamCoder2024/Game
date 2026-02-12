// server/socket/events.ts
// WebSocket event name constants — single source of truth
// Used by both emitters (server) and listeners (client)

export const WS_EVENTS = {
    // Wallet events
    WALLET_UPDATE: 'wallet-update',

    // Betting events
    BET_PLACED: 'bet-placed',
    BET_STREAM: 'bet-stream',           // Admin live bet feed
    BET_WON: 'bet-won',
    BET_LOST: 'bet-lost',

    // Result events
    RESULT_DECLARED: 'result-declared',
    WINDOW_STATUS: 'window-status',

    // Settlement events
    SETTLEMENT_COMPLETE: 'settlement-complete',

    // Rollback events
    ROLLBACK: 'settlement-rolled-back',

    // Admin events
    DASHBOARD_UPDATE: 'dashboard-update',

    // System events
    ANNOUNCEMENT: 'announcement',
} as const;

// Room name helpers
export const ROOMS = {
    user: (userId: number) => `user:${userId}`,
    role: (role: string) => `role:${role}`,
    game: (gameId: number) => `game:${gameId}`,
    ADMIN_DASHBOARD: 'admin:dashboard',
    ADMIN_BET_STREAM: 'admin:bet-stream',
} as const;
