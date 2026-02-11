// server/utils/idGenerator.ts
// Unique ID generation for accounts, bets, transactions, and loans

import { v4 as uuidv4 } from 'uuid';

/**
 * Generate a unique User ID (e.g., PL519, PL80867)
 * Format: PREFIX + random number
 */
export function generateUserId(prefix: string = 'PL'): string {
    const randomNum = Math.floor(Math.random() * 90000) + 10000; // 5-digit number
    return `${prefix}${randomNum}`;
}

/**
 * Generate a unique Super Master ID (e.g., BSM80867)
 */
export function generateSuperMasterId(): string {
    const randomNum = Math.floor(Math.random() * 90000) + 10000;
    return `BSM${randomNum}`;
}

/**
 * Generate a unique Master ID (e.g., BM80867)
 */
export function generateMasterId(): string {
    const randomNum = Math.floor(Math.random() * 90000) + 10000;
    return `BM${randomNum}`;
}

/**
 * Generate a role-appropriate user ID
 */
export function generateRoleBasedId(role: string, prefix: string = 'PL'): string {
    switch (role) {
        case 'supermaster':
            return generateSuperMasterId();
        case 'master':
            return generateMasterId();
        case 'user':
            return generateUserId(prefix);
        default:
            return generateUserId(prefix);
    }
}

/**
 * Generate a unique Bet ID (e.g., BET-PL519-001)
 */
export function generateBetId(userId: string): string {
    const shortUuid = uuidv4().split('-')[0];
    return `BET-${userId}-${shortUuid}`;
}

/**
 * Generate a unique Transaction ID (e.g., TXN-PL519-abc123)
 */
export function generateTxnId(userId: string): string {
    const shortUuid = uuidv4().split('-')[0];
    return `TXN-${userId}-${shortUuid}`;
}

/**
 * Generate a unique Loan ID (e.g., LOAN-abc12345)
 */
export function generateLoanId(): string {
    const shortUuid = uuidv4().split('-')[0];
    return `LOAN-${shortUuid}`;
}
