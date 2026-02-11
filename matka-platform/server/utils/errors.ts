// server/utils/errors.ts
// Custom error classes — AppError is the ONLY error type thrown in the app

export class AppError extends Error {
    public readonly code: string;
    public readonly statusCode: number;
    public readonly details?: Record<string, unknown>;

    constructor(code: string, message?: string, details?: Record<string, unknown>) {
        const errorDef = ERROR_CODES[code];
        const finalMessage = message || errorDef?.message || 'An unexpected error occurred';
        const statusCode = errorDef?.statusCode || 500;

        super(finalMessage);
        this.name = 'AppError';
        this.code = code;
        this.statusCode = statusCode;
        this.details = details;

        // Maintain proper stack trace
        Error.captureStackTrace(this, this.constructor);
    }

    toJSON() {
        return {
            success: false,
            error: {
                code: this.code,
                message: this.message,
                ...(this.details && { details: this.details }),
            },
        };
    }
}

// ==========================================
// ERROR CODES REGISTRY
// ==========================================

interface ErrorDefinition {
    message: string;
    statusCode: number;
}

export const ERROR_CODES: Record<string, ErrorDefinition> = {
    // Auth Errors (1xxx)
    AUTH_INVALID_CREDENTIALS: { message: 'Invalid ID or password', statusCode: 401 },
    AUTH_TOKEN_MISSING: { message: 'Authentication token is required', statusCode: 401 },
    AUTH_TOKEN_INVALID: { message: 'Invalid or expired token', statusCode: 401 },
    AUTH_TOKEN_EXPIRED: { message: 'Token has expired', statusCode: 401 },
    AUTH_INSUFFICIENT_ROLE: { message: 'You do not have permission for this action', statusCode: 403 },
    AUTH_ACCOUNT_BLOCKED: { message: 'Your account has been blocked', statusCode: 403 },
    AUTH_ACCOUNT_INACTIVE: { message: 'Your account is inactive', statusCode: 403 },

    // Account Errors (2xxx)
    ACCOUNT_NOT_FOUND: { message: 'Account not found', statusCode: 404 },
    ACCOUNT_ALREADY_EXISTS: { message: 'Account with this ID already exists', statusCode: 409 },
    ACCOUNT_BLOCKED: { message: 'This account is blocked', statusCode: 403 },
    ACCOUNT_INVALID_ROLE: { message: 'Invalid role specified', statusCode: 400 },
    ACCOUNT_DEAL_EXCEEDS_PARENT: { message: 'Deal percentage cannot exceed parent\'s deal percentage', statusCode: 400 },
    ACCOUNT_CANNOT_CREATE_ROLE: { message: 'You cannot create accounts with this role', statusCode: 403 },
    ACCOUNT_NOT_IN_DOWNLINE: { message: 'This account is not in your downline', statusCode: 403 },
    ACCOUNT_ROLE_IMMUTABLE: { message: 'Account role cannot be changed after creation', statusCode: 400 },

    // Wallet Errors (3xxx)
    WALLET_INSUFFICIENT_BALANCE: { message: 'Insufficient balance', statusCode: 400 },
    WALLET_INVALID_AMOUNT: { message: 'Invalid amount', statusCode: 400 },
    WALLET_NEGATIVE_AMOUNT: { message: 'Amount must be positive', statusCode: 400 },
    WALLET_TRANSACTION_FAILED: { message: 'Wallet transaction failed', statusCode: 500 },

    // Game Errors (4xxx)
    GAME_NOT_FOUND: { message: 'Game not found', statusCode: 404 },
    GAME_ALREADY_EXISTS: { message: 'Game with this name already exists', statusCode: 409 },
    GAME_INACTIVE: { message: 'This game is currently inactive', statusCode: 400 },

    // Betting Errors (5xxx)
    BET_WINDOW_CLOSED: { message: 'Betting window is closed', statusCode: 400 },
    BET_WINDOW_NOT_FOUND: { message: 'Betting window not found', statusCode: 404 },
    BET_INVALID_NUMBER: { message: 'Invalid bet number for this bet type', statusCode: 400 },
    BET_INVALID_AMOUNT: { message: 'Bet amount is outside allowed range', statusCode: 400 },
    BET_TYPE_BLOCKED: { message: 'This bet type is currently blocked', statusCode: 400 },
    BET_GAME_BLOCKED: { message: 'Betting is blocked for this game', statusCode: 400 },
    BET_GLOBALLY_BLOCKED: { message: 'All betting is currently blocked', statusCode: 400 },
    BET_NOT_FOUND: { message: 'Bet not found', statusCode: 404 },

    // Result Errors (6xxx)
    RESULT_ALREADY_DECLARED: { message: 'Result has already been declared', statusCode: 400 },
    RESULT_INVALID_PANNA: { message: 'Invalid panna (must be 3 digits)', statusCode: 400 },
    RESULT_OPEN_REQUIRED: { message: 'Open result must be declared before Close', statusCode: 400 },
    RESULT_NOT_FOUND: { message: 'Result not found', statusCode: 404 },

    // Settlement Errors (7xxx)
    SETTLEMENT_ALREADY_DONE: { message: 'Settlement has already been completed', statusCode: 400 },
    SETTLEMENT_NOT_FOUND: { message: 'Settlement not found', statusCode: 404 },
    SETTLEMENT_ROLLBACK_FAILED: { message: 'Settlement rollback failed', statusCode: 500 },
    SETTLEMENT_ALREADY_ROLLED_BACK: { message: 'This settlement has already been rolled back', statusCode: 400 },

    // Validation Errors (8xxx)
    VALIDATION_FAILED: { message: 'Validation failed', statusCode: 400 },
    INVALID_INPUT: { message: 'Invalid input provided', statusCode: 400 },
    MISSING_REQUIRED_FIELD: { message: 'A required field is missing', statusCode: 400 },

    // System Errors (9xxx)
    INTERNAL_ERROR: { message: 'Internal server error', statusCode: 500 },
    DATABASE_ERROR: { message: 'Database operation failed', statusCode: 500 },
    RATE_LIMIT_EXCEEDED: { message: 'Too many requests. Please try again later', statusCode: 429 },
    SERVICE_UNAVAILABLE: { message: 'Service temporarily unavailable', statusCode: 503 },
};
