// src/lib/constants.ts
// Application-wide constants

// Panel accent colors
export const PANEL_COLORS = {
    admin: '#2563EB',        // Blue
    supermaster: '#7C3AED',  // Purple
    master: '#0891B2',       // Cyan
    user: '#059669',         // Emerald
} as const;

// Design system
export const COLORS = {
    primary: '#2563EB',
    sidebar: '#1E293B',
    bodyBg: '#F5F7FA',
    cardBg: '#FFFFFF',
    success: '#22C55E',
    warning: '#F59E0B',
    danger: '#EF4444',
    info: '#3B82F6',
} as const;

// Bet types with display names and default multipliers
export const BET_TYPES = {
    SINGLE_AKDA: { name: 'Single Akda', shortName: 'SA', defaultMultiplier: 10 },
    SINGLE_PATTI: { name: 'Single Patti', shortName: 'SP', defaultMultiplier: 160 },
    DOUBLE_PATTI: { name: 'Double Patti', shortName: 'DP', defaultMultiplier: 320 },
    TRIPLE_PATTI: { name: 'Triple Patti', shortName: 'TP', defaultMultiplier: 70 },
    JODI: { name: 'Jodi', shortName: 'JD', defaultMultiplier: 100 },
} as const;

// Role display names
export const ROLE_NAMES = {
    admin: 'Admin',
    supermaster: 'Super Master',
    master: 'Master',
    user: 'User',
} as const;

// Transaction type labels
export const TRANSACTION_LABELS = {
    CREDIT_IN: 'Coins Received',
    CREDIT_OUT: 'Coins Given',
    BET_PLACED: 'Bet Placed',
    BET_WON: 'Bet Won',
    BET_CANCELLED: 'Bet Cancelled',
    WITHDRAWAL: 'Withdrawal',
    ROLLBACK_DEBIT: 'Rollback Debit',
    ROLLBACK_CREDIT: 'Rollback Credit',
    LOAN_IN: 'Loan Received',
    LOAN_OUT: 'Loan Given',
    LOAN_REPAYMENT: 'Loan Repayment',
    MANUAL_ADJUSTMENT: 'Manual Adjustment',
} as const;

// Pagination defaults
export const PAGINATION = {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
} as const;
