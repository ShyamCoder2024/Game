// src/lib/socketEvents.ts
// Client-side copy of WebSocket event constants
// Must stay in sync with server/socket/events.ts

export const WS_EVENTS = {
    // Wallet events
    WALLET_UPDATE: 'wallet-update',

    // Betting events
    BET_PLACED: 'bet-placed',
    BET_STREAM: 'bet-stream',
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
