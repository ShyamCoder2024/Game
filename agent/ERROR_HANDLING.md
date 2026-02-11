# ERROR HANDLING DOCUMENT
# MATKA BETTING PLATFORM
## Version 1.0 | February 2026

---

## TABLE OF CONTENTS
1. [Error Handling Philosophy](#1-error-handling-philosophy)
2. [Error Architecture Overview](#2-error-architecture-overview)
3. [Error Code System — Complete Registry](#3-error-code-system--complete-registry)
4. [AppError Class — The Single Error Type](#4-apperror-class--the-single-error-type)
5. [HTTP Status Code Mapping](#5-http-status-code-mapping)
6. [Global Error Handler (Fastify)](#6-global-error-handler-fastify)
7. [Validation Errors (Zod)](#7-validation-errors-zod)
8. [Database Errors (Prisma)](#8-database-errors-prisma)
9. [Authentication Errors](#9-authentication-errors)
10. [Authorization Errors](#10-authorization-errors)
11. [Wallet & Financial Errors](#11-wallet--financial-errors)
12. [Bet Placement Errors](#12-bet-placement-errors)
13. [Game & Betting Window Errors](#13-game--betting-window-errors)
14. [Result Declaration Errors](#14-result-declaration-errors)
15. [Settlement Errors](#15-settlement-errors)
16. [Rollback Errors](#16-rollback-errors)
17. [Account Management Errors](#17-account-management-errors)
18. [WebSocket Error Handling](#18-websocket-error-handling)
19. [Cron Job Error Handling](#19-cron-job-error-handling)
20. [Frontend Error Handling](#20-frontend-error-handling)
21. [API Client Error Handling](#21-api-client-error-handling)
22. [Error Logging Strategy](#22-error-logging-strategy)
23. [Error Recovery Patterns](#23-error-recovery-patterns)
24. [Retry Logic](#24-retry-logic)
25. [Circuit Breaker Pattern](#25-circuit-breaker-pattern)
26. [Error Monitoring (Sentry)](#26-error-monitoring-sentry)
27. [Error Response Examples — Every Scenario](#27-error-response-examples--every-scenario)
28. [Testing Error Scenarios](#28-testing-error-scenarios)
29. [Error Handling Checklist for New Features](#29-error-handling-checklist-for-new-features)

---

## 1. ERROR HANDLING PHILOSOPHY

### 1.1 Core Rules

#### Rule 1: ONE ERROR CLASS, ONE FORMAT, EVERYWHERE
Every error in the entire backend is an `AppError`. Every error response has the exact same JSON shape. No exceptions. No custom error objects scattered across modules. One class rules them all.

#### Rule 2: ERRORS ARE DATA, NOT STRINGS
Every error has a machine-readable `code` (like `INSUFFICIENT_BALANCE`), a human-readable `message`, an HTTP `statusCode`, and optional `details`. Frontend code checks `code`, not `message`. Messages can change, codes never change.

#### Rule 3: FAIL FAST, FAIL LOUD
Check every condition at the START of a function. Don't let invalid state propagate deep into business logic. If something is wrong, throw immediately with a clear error code.

#### Rule 4: TRANSACTIONS PROTECT MONEY
Every financial operation happens inside a Prisma `$transaction`. If ANY step fails, EVERYTHING rolls back. No partial wallet updates. No orphaned bets. No incomplete settlements.

#### Rule 5: LOG ERRORS, DON'T SWALLOW THEM
Every error is logged with full context. Never `catch (e) {}` with empty catch blocks. Never `console.log(e)` in production. Use structured logging (Pino) with error level, context, and stack trace.

#### Rule 6: USER SEES FRIENDLY, LOGS SEE DETAILS
The API returns a clean, user-friendly message. The server logs contain full stack trace, request details, user info, and error context. Two different audiences, two different levels of detail.

#### Rule 7: ERRORS ARE REUSABLE
Define errors once in a central registry. Every module imports and throws them. No duplicating error messages across services. Change a message in one place, it changes everywhere.

---

## 2. ERROR ARCHITECTURE OVERVIEW

```
REQUEST COMES IN
    │
    ├── Middleware Layer
    │   ├── Rate Limiter → throws RATE_LIMIT_EXCEEDED
    │   ├── Auth Middleware → throws AUTH_* errors
    │   ├── Role Middleware → throws FORBIDDEN
    │   └── Hierarchy Middleware → throws HIERARCHY_ACCESS_DENIED
    │
    ├── Validation Layer (Zod)
    │   └── Schema validation fails → throws VALIDATION_ERROR
    │
    ├── Service Layer
    │   ├── Business logic check fails → throws specific AppError
    │   ├── Prisma query fails → caught and re-thrown as AppError
    │   └── External service fails → caught and re-thrown as AppError
    │
    └── All errors bubble up to Global Error Handler
        │
        ├── AppError → Return structured JSON with correct status code
        ├── Prisma Error → Map to AppError, return structured JSON
        ├── Zod Error → Map to VALIDATION_ERROR, return structured JSON
        ├── JWT Error → Map to AUTH error, return structured JSON
        └── Unknown Error → Log full details, return generic 500 error
            │
            └── Sentry captures 500 errors automatically
```

---

## 3. ERROR CODE SYSTEM — COMPLETE REGISTRY

### 3.1 Error Code Format
```
{CATEGORY}_{SPECIFIC_ERROR}

Examples:
AUTH_INVALID_CREDENTIALS
WALLET_INSUFFICIENT_BALANCE
BET_WINDOW_CLOSED
RESULT_ALREADY_DECLARED
```

### 3.2 Complete Error Registry

```typescript
// server/utils/errorCodes.ts

export const ERROR_CODES = {
  
  // ========================
  // GENERAL (1xx pattern)
  // ========================
  INTERNAL_ERROR:           { code: 'INTERNAL_ERROR',           status: 500, message: 'An unexpected error occurred' },
  NOT_FOUND:                { code: 'NOT_FOUND',                status: 404, message: 'Resource not found' },
  VALIDATION_ERROR:         { code: 'VALIDATION_ERROR',         status: 400, message: 'Invalid request data' },
  RATE_LIMIT_EXCEEDED:      { code: 'RATE_LIMIT_EXCEEDED',      status: 429, message: 'Too many requests. Please wait and try again' },
  MAINTENANCE_MODE:         { code: 'MAINTENANCE_MODE',         status: 503, message: 'System is under maintenance. Please try again later' },
  METHOD_NOT_ALLOWED:       { code: 'METHOD_NOT_ALLOWED',       status: 405, message: 'HTTP method not allowed' },
  DUPLICATE_ENTRY:          { code: 'DUPLICATE_ENTRY',          status: 409, message: 'A record with this value already exists' },
  
  // ========================
  // AUTHENTICATION
  // ========================
  AUTH_INVALID_CREDENTIALS: { code: 'AUTH_INVALID_CREDENTIALS', status: 401, message: 'Invalid ID or password' },
  AUTH_TOKEN_MISSING:       { code: 'AUTH_TOKEN_MISSING',       status: 401, message: 'Authentication token is required' },
  AUTH_TOKEN_EXPIRED:       { code: 'AUTH_TOKEN_EXPIRED',       status: 401, message: 'Authentication token has expired. Please login again' },
  AUTH_TOKEN_INVALID:       { code: 'AUTH_TOKEN_INVALID',       status: 401, message: 'Authentication token is invalid' },
  AUTH_ACCOUNT_BLOCKED:     { code: 'AUTH_ACCOUNT_BLOCKED',     status: 403, message: 'Your account has been blocked. Contact your admin' },
  AUTH_ACCOUNT_INACTIVE:    { code: 'AUTH_ACCOUNT_INACTIVE',    status: 403, message: 'Your account is inactive' },
  AUTH_LOGIN_ATTEMPTS:      { code: 'AUTH_LOGIN_ATTEMPTS',      status: 429, message: 'Too many failed login attempts. Try again in 15 minutes' },
  
  // ========================
  // AUTHORIZATION
  // ========================
  FORBIDDEN:                { code: 'FORBIDDEN',                status: 403, message: 'You do not have permission to perform this action' },
  HIERARCHY_ACCESS_DENIED:  { code: 'HIERARCHY_ACCESS_DENIED',  status: 403, message: 'You can only access members in your downline' },
  ADMIN_ONLY:               { code: 'ADMIN_ONLY',               status: 403, message: 'This action is restricted to Admin only' },
  ROLE_NOT_ALLOWED:         { code: 'ROLE_NOT_ALLOWED',         status: 403, message: 'Your role does not have permission for this action' },
  CANNOT_MODIFY_SELF:       { code: 'CANNOT_MODIFY_SELF',       status: 403, message: 'You cannot perform this action on your own account' },
  CANNOT_MODIFY_ABOVE:      { code: 'CANNOT_MODIFY_ABOVE',      status: 403, message: 'You cannot modify accounts above you in the hierarchy' },
  
  // ========================
  // WALLET & FINANCIAL
  // ========================
  WALLET_INSUFFICIENT_BALANCE: { code: 'WALLET_INSUFFICIENT_BALANCE', status: 400, message: 'Insufficient coin balance' },
  WALLET_INVALID_AMOUNT:       { code: 'WALLET_INVALID_AMOUNT',       status: 400, message: 'Amount must be a positive whole number' },
  WALLET_EXCEEDS_CREDIT_LIMIT: { code: 'WALLET_EXCEEDS_CREDIT_LIMIT', status: 400, message: 'Amount exceeds credit limit' },
  WALLET_EXCEEDS_FIX_LIMIT:    { code: 'WALLET_EXCEEDS_FIX_LIMIT',    status: 400, message: 'Amount exceeds fix limit' },
  WALLET_ZERO_AMOUNT:           { code: 'WALLET_ZERO_AMOUNT',           status: 400, message: 'Amount cannot be zero' },
  WALLET_NEGATIVE_RESULT:       { code: 'WALLET_NEGATIVE_RESULT',       status: 400, message: 'This operation would result in negative balance' },
  WALLET_TRANSACTION_FAILED:    { code: 'WALLET_TRANSACTION_FAILED',    status: 500, message: 'Wallet transaction failed. No changes were made' },
  
  // ========================
  // BET PLACEMENT
  // ========================
  BET_WINDOW_CLOSED:         { code: 'BET_WINDOW_CLOSED',         status: 400, message: 'Betting window is closed for this game' },
  BET_WINDOW_NOT_FOUND:      { code: 'BET_WINDOW_NOT_FOUND',      status: 400, message: 'No active betting window found for this game today' },
  BET_INVALID_NUMBER:        { code: 'BET_INVALID_NUMBER',        status: 400, message: 'Invalid number for the selected bet type' },
  BET_INVALID_TYPE:          { code: 'BET_INVALID_TYPE',          status: 400, message: 'Invalid bet type' },
  BET_BELOW_MINIMUM:         { code: 'BET_BELOW_MINIMUM',         status: 400, message: 'Bet amount is below the minimum allowed' },
  BET_ABOVE_MAXIMUM:         { code: 'BET_ABOVE_MAXIMUM',         status: 400, message: 'Bet amount exceeds the maximum allowed' },
  BET_GAME_INACTIVE:         { code: 'BET_GAME_INACTIVE',         status: 400, message: 'This game is currently inactive' },
  BET_GAME_NOT_FOUND:        { code: 'BET_GAME_NOT_FOUND',        status: 404, message: 'Game not found' },
  BET_BLOCKED:               { code: 'BET_BLOCKED',               status: 403, message: 'Betting is currently blocked' },
  BET_BLOCKED_FOR_GAME:      { code: 'BET_BLOCKED_FOR_GAME',      status: 403, message: 'Betting is blocked for this game' },
  BET_BLOCKED_FOR_TYPE:      { code: 'BET_BLOCKED_FOR_TYPE',      status: 403, message: 'This bet type is currently blocked' },
  BET_USER_BLOCKED:          { code: 'BET_USER_BLOCKED',          status: 403, message: 'Your account is blocked from placing bets' },
  BET_NOT_FOUND:             { code: 'BET_NOT_FOUND',             status: 404, message: 'Bet not found' },
  BET_PLACEMENT_FAILED:      { code: 'BET_PLACEMENT_FAILED',      status: 500, message: 'Bet placement failed. No coins were deducted' },
  
  // ========================
  // GAME MANAGEMENT
  // ========================
  GAME_NOT_FOUND:            { code: 'GAME_NOT_FOUND',            status: 404, message: 'Game not found' },
  GAME_NAME_EXISTS:          { code: 'GAME_NAME_EXISTS',          status: 409, message: 'A game with this name already exists' },
  GAME_SLUG_EXISTS:          { code: 'GAME_SLUG_EXISTS',          status: 409, message: 'A game with this URL slug already exists' },
  GAME_INVALID_TIMING:       { code: 'GAME_INVALID_TIMING',       status: 400, message: 'Close time must be after open time' },
  GAME_HAS_PENDING_BETS:     { code: 'GAME_HAS_PENDING_BETS',     status: 400, message: 'Cannot delete game with pending bets' },
  GAME_ALREADY_INACTIVE:     { code: 'GAME_ALREADY_INACTIVE',     status: 400, message: 'Game is already inactive' },
  
  // ========================
  // RESULT DECLARATION
  // ========================
  RESULT_ALREADY_DECLARED:   { code: 'RESULT_ALREADY_DECLARED',   status: 409, message: 'Result has already been declared for this game/date/session' },
  RESULT_INVALID_PANNA:      { code: 'RESULT_INVALID_PANNA',      status: 400, message: 'Panna must be a 3-digit number (000-999)' },
  RESULT_OPEN_NOT_DECLARED:  { code: 'RESULT_OPEN_NOT_DECLARED',  status: 400, message: 'Open result must be declared before Close result' },
  RESULT_NOT_FOUND:          { code: 'RESULT_NOT_FOUND',          status: 404, message: 'Result not found' },
  RESULT_GAME_INACTIVE:      { code: 'RESULT_GAME_INACTIVE',      status: 400, message: 'Cannot declare result for an inactive game' },
  
  // ========================
  // SETTLEMENT
  // ========================
  SETTLEMENT_ALREADY_DONE:   { code: 'SETTLEMENT_ALREADY_DONE',   status: 409, message: 'Settlement has already been completed for this result' },
  SETTLEMENT_NO_BETS:        { code: 'SETTLEMENT_NO_BETS',        status: 400, message: 'No pending bets found for settlement' },
  SETTLEMENT_FAILED:         { code: 'SETTLEMENT_FAILED',         status: 500, message: 'Settlement process failed. All changes have been rolled back' },
  SETTLEMENT_PARTIAL_FAILURE:{ code: 'SETTLEMENT_PARTIAL_FAILURE', status: 500, message: 'Settlement partially failed. Manual review required' },
  SETTLEMENT_NOT_FOUND:      { code: 'SETTLEMENT_NOT_FOUND',      status: 404, message: 'Settlement record not found' },
  
  // ========================
  // ROLLBACK
  // ========================
  ROLLBACK_NOT_SETTLED:      { code: 'ROLLBACK_NOT_SETTLED',      status: 400, message: 'Cannot rollback — this result has not been settled yet' },
  ROLLBACK_ALREADY_DONE:     { code: 'ROLLBACK_ALREADY_DONE',     status: 409, message: 'This settlement has already been rolled back' },
  ROLLBACK_FAILED:           { code: 'ROLLBACK_FAILED',           status: 500, message: 'Rollback failed. Manual intervention may be required' },
  ROLLBACK_WITHDRAWAL_CONFLICT: { code: 'ROLLBACK_WITHDRAWAL_CONFLICT', status: 400, message: 'Some winners have already withdrawn funds. Review required' },
  
  // ========================
  // ACCOUNT MANAGEMENT
  // ========================
  ACCOUNT_NOT_FOUND:         { code: 'ACCOUNT_NOT_FOUND',         status: 404, message: 'Account not found' },
  ACCOUNT_ALREADY_BLOCKED:   { code: 'ACCOUNT_ALREADY_BLOCKED',   status: 400, message: 'Account is already blocked' },
  ACCOUNT_NOT_BLOCKED:       { code: 'ACCOUNT_NOT_BLOCKED',       status: 400, message: 'Account is not blocked' },
  ACCOUNT_CREATION_FAILED:   { code: 'ACCOUNT_CREATION_FAILED',   status: 500, message: 'Account creation failed' },
  ACCOUNT_INVALID_ROLE:      { code: 'ACCOUNT_INVALID_ROLE',      status: 400, message: 'You cannot create accounts with this role' },
  ACCOUNT_DEAL_EXCEEDS:      { code: 'ACCOUNT_DEAL_EXCEEDS',      status: 400, message: 'Deal percentage cannot exceed your own deal percentage' },
  ACCOUNT_PASSWORD_WEAK:     { code: 'ACCOUNT_PASSWORD_WEAK',     status: 400, message: 'Password must be at least 6 characters' },
  ACCOUNT_PASSWORD_WRONG:    { code: 'ACCOUNT_PASSWORD_WRONG',    status: 400, message: 'Current password is incorrect' },
  ACCOUNT_ADMIN_PASSWORD:    { code: 'ACCOUNT_ADMIN_PASSWORD',    status: 403, message: 'Admin password cannot be changed from the application' },
  
  // ========================
  // CONTENT
  // ========================
  CONTENT_NOT_FOUND:         { code: 'CONTENT_NOT_FOUND',         status: 404, message: 'Content not found' },
  BANNER_UPLOAD_FAILED:      { code: 'BANNER_UPLOAD_FAILED',      status: 500, message: 'Banner image upload failed' },
  BANNER_INVALID_FORMAT:     { code: 'BANNER_INVALID_FORMAT',     status: 400, message: 'Invalid image format. Use JPG, PNG, or WebP' },
  BANNER_TOO_LARGE:          { code: 'BANNER_TOO_LARGE',          status: 400, message: 'Image size exceeds 5MB limit' },
  
  // ========================
  // MULTIPLIER
  // ========================
  MULTIPLIER_NOT_FOUND:      { code: 'MULTIPLIER_NOT_FOUND',      status: 404, message: 'Payout multiplier configuration not found' },
  MULTIPLIER_INVALID:        { code: 'MULTIPLIER_INVALID',        status: 400, message: 'Multiplier must be a positive whole number' },
  
  // ========================
  // BACKUP
  // ========================
  BACKUP_IN_PROGRESS:        { code: 'BACKUP_IN_PROGRESS',        status: 409, message: 'A backup is already in progress' },
  BACKUP_FAILED:             { code: 'BACKUP_FAILED',             status: 500, message: 'Database backup failed' },
  
  // ========================
  // DATABASE
  // ========================
  DB_CONNECTION_FAILED:      { code: 'DB_CONNECTION_FAILED',      status: 503, message: 'Database connection failed' },
  DB_TRANSACTION_FAILED:     { code: 'DB_TRANSACTION_FAILED',     status: 500, message: 'Database transaction failed. No changes were made' },
  DB_QUERY_TIMEOUT:          { code: 'DB_QUERY_TIMEOUT',          status: 504, message: 'Database query timed out' },
  
} as const;

export type ErrorCode = keyof typeof ERROR_CODES;
```

---

## 4. AppError CLASS — THE SINGLE ERROR TYPE

```typescript
// server/utils/errors.ts

import { ERROR_CODES, ErrorCode } from './errorCodes';

export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details: Record<string, any> | null;
  public readonly isOperational: boolean;
  
  constructor(
    errorCode: ErrorCode,
    customMessage?: string,
    details?: Record<string, any>,
  ) {
    const errorDef = ERROR_CODES[errorCode];
    
    super(customMessage || errorDef.message);
    
    this.code = errorDef.code;
    this.statusCode = errorDef.status;
    this.details = details || null;
    this.isOperational = true; // Distinguishes from programming errors
    
    // Preserve stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}

// ==========================================
// USAGE EXAMPLES — Clean and Consistent
// ==========================================

// Simple throw (uses default message from registry)
throw new AppError('WALLET_INSUFFICIENT_BALANCE');

// Custom message (overrides default)
throw new AppError('WALLET_INSUFFICIENT_BALANCE', 'You need at least ₹500 to place this bet');

// With details (extra context for frontend)
throw new AppError('WALLET_INSUFFICIENT_BALANCE', undefined, {
  required: 500,
  available: 200,
  shortfall: 300,
});

// All three
throw new AppError(
  'BET_BELOW_MINIMUM',
  'Minimum bet for KALYAN JODI is ₹20',
  { minimum: 20, attempted: 5, game: 'KALYAN', bet_type: 'JODI' }
);
```

### 4.1 Why This Pattern Works
```
1. SINGLE SOURCE OF TRUTH: Error codes defined once in errorCodes.ts
2. TYPE-SAFE: TypeScript ensures you only use valid error codes
3. CONSISTENT: Every error has code + message + statusCode
4. EXTENSIBLE: Add new error? Add one line to ERROR_CODES object
5. REUSABLE: Same AppError class used in every service
6. AI-FRIENDLY: AI agents see the pattern once, replicate it everywhere
7. HUMAN-FRIENDLY: Code reads like English — throw new AppError('BET_WINDOW_CLOSED')
```

---

## 5. HTTP STATUS CODE MAPPING

| Status | Meaning | When To Use |
|--------|---------|-------------|
| `200` | OK | Successful GET, PUT, DELETE |
| `201` | Created | Successful POST (bet placed, account created) |
| `400` | Bad Request | Validation failed, business rule violated, invalid input |
| `401` | Unauthorized | Missing token, expired token, invalid credentials |
| `403` | Forbidden | Valid token but wrong role, hierarchy violation, blocked account |
| `404` | Not Found | Resource doesn't exist |
| `409` | Conflict | Duplicate entry, already declared, already settled |
| `429` | Too Many Requests | Rate limit exceeded, too many login attempts |
| `500` | Internal Error | Unexpected failures, transaction failures |
| `503` | Service Unavailable | Database down, maintenance mode |
| `504` | Gateway Timeout | Query timeout |

### 5.1 Rule: Never use status codes not in this list
No 201 for errors, no 422, no 418. Keep it simple. The `code` field in the response body provides all the specificity you need.

---

## 6. GLOBAL ERROR HANDLER (FASTIFY)

```typescript
// server/plugins/errorHandler.ts

import { FastifyInstance, FastifyError, FastifyRequest, FastifyReply } from 'fastify';
import { AppError } from '../utils/errors';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';

export function setupErrorHandler(app: FastifyInstance) {
  
  app.setErrorHandler((error: FastifyError | Error, request: FastifyRequest, reply: FastifyReply) => {
    
    // ========================================
    // 1. AppError (Our business errors)
    // ========================================
    if (error instanceof AppError) {
      logError(app, error, request, 'business');
      
      return reply.status(error.statusCode).send({
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      });
    }
    
    // ========================================
    // 2. Zod Validation Errors
    // ========================================
    if (error instanceof ZodError) {
      const formattedErrors = error.errors.map(e => ({
        field: e.path.join('.'),
        message: e.message,
        code: e.code,
      }));
      
      logError(app, error, request, 'validation');
      
      return reply.status(400).send({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: { fields: formattedErrors },
        },
      });
    }
    
    // ========================================
    // 3. Fastify Validation Errors
    // ========================================
    if ('validation' in error && error.validation) {
      logError(app, error, request, 'validation');
      
      return reply.status(400).send({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: { fields: error.validation },
        },
      });
    }
    
    // ========================================
    // 4. Prisma Errors
    // ========================================
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return handlePrismaError(app, error, request, reply);
    }
    
    if (error instanceof Prisma.PrismaClientValidationError) {
      logError(app, error, request, 'prisma_validation');
      
      return reply.status(400).send({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid data sent to database',
        },
      });
    }
    
    if (error instanceof Prisma.PrismaClientInitializationError) {
      logError(app, error, request, 'prisma_init');
      
      return reply.status(503).send({
        success: false,
        error: {
          code: 'DB_CONNECTION_FAILED',
          message: 'Database connection failed. Please try again later',
        },
      });
    }
    
    // ========================================
    // 5. JWT Errors
    // ========================================
    if (error.name === 'JsonWebTokenError') {
      return reply.status(401).send({
        success: false,
        error: {
          code: 'AUTH_TOKEN_INVALID',
          message: 'Authentication token is invalid',
        },
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return reply.status(401).send({
        success: false,
        error: {
          code: 'AUTH_TOKEN_EXPIRED',
          message: 'Authentication token has expired. Please login again',
        },
      });
    }
    
    // ========================================
    // 6. Rate Limit Errors
    // ========================================
    if (error.statusCode === 429) {
      return reply.status(429).send({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests. Please wait and try again',
        },
      });
    }
    
    // ========================================
    // 7. Unknown / Unhandled Errors (500)
    // ========================================
    logError(app, error, request, 'unhandled');
    
    // Report to Sentry
    if (process.env.SENTRY_DSN) {
      const Sentry = require('@sentry/node');
      Sentry.captureException(error, {
        extra: {
          url: request.url,
          method: request.method,
          userId: request.user?.id,
          body: request.body,
        },
      });
    }
    
    return reply.status(500).send({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
        // NEVER expose stack trace or internal details to the user
      },
    });
  });
}

// ========================================
// PRISMA ERROR MAPPING
// ========================================
function handlePrismaError(
  app: FastifyInstance,
  error: Prisma.PrismaClientKnownRequestError,
  request: FastifyRequest,
  reply: FastifyReply
) {
  logError(app, error, request, 'prisma');
  
  switch (error.code) {
    case 'P2002': // Unique constraint violation
      const field = (error.meta?.target as string[])?.join(', ') || 'field';
      return reply.status(409).send({
        success: false,
        error: {
          code: 'DUPLICATE_ENTRY',
          message: `A record with this ${field} already exists`,
          details: { field },
        },
      });
    
    case 'P2025': // Record not found
      return reply.status(404).send({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'The requested record was not found',
        },
      });
    
    case 'P2003': // Foreign key constraint failed
      return reply.status(400).send({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Referenced record does not exist',
        },
      });
    
    case 'P2024': // Connection pool timeout
      return reply.status(504).send({
        success: false,
        error: {
          code: 'DB_QUERY_TIMEOUT',
          message: 'Database query timed out. Please try again',
        },
      });
    
    default:
      return reply.status(500).send({
        success: false,
        error: {
          code: 'DB_TRANSACTION_FAILED',
          message: 'A database error occurred',
        },
      });
  }
}

// ========================================
// STRUCTURED ERROR LOGGING
// ========================================
function logError(
  app: FastifyInstance,
  error: Error,
  request: FastifyRequest,
  category: string
) {
  app.log.error({
    category,
    errorCode: (error as AppError).code || error.name,
    message: error.message,
    stack: error.stack,
    url: request.url,
    method: request.method,
    userId: (request as any).user?.id || null,
    userRole: (request as any).user?.role || null,
    ip: request.ip,
    body: request.method !== 'GET' ? request.body : undefined,
    params: request.params,
    query: request.query,
    timestamp: new Date().toISOString(),
  });
}
```

---

## 7. VALIDATION ERRORS (ZOD)

### 7.1 Validation Pattern in Routes
```typescript
// PATTERN: Validate at the START of every route handler
app.post('/place', async (request, reply) => {
  // Step 1: Validate input
  const parsed = placeBetSchema.safeParse(request.body);
  
  if (!parsed.success) {
    throw parsed.error; // ZodError → caught by global handler
  }
  
  // Step 2: Use validated data (fully typed)
  const data = parsed.data;
  // data.game_id is guaranteed to be a positive integer
  // data.bet_amount is guaranteed to be >= 10
  // data.bet_type is guaranteed to be a valid enum value
});
```

### 7.2 Validation Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data",
    "details": {
      "fields": [
        {
          "field": "bet_amount",
          "message": "Minimum bet is ₹10",
          "code": "too_small"
        },
        {
          "field": "bet_number",
          "message": "String must contain at most 3 character(s)",
          "code": "too_big"
        }
      ]
    }
  }
}
```

---

## 8. DATABASE ERRORS (PRISMA)

### 8.1 Prisma Error Code Mapping
| Prisma Code | Our Error Code | HTTP Status | Meaning |
|-------------|---------------|-------------|---------|
| `P2002` | `DUPLICATE_ENTRY` | 409 | Unique constraint violation |
| `P2003` | `VALIDATION_ERROR` | 400 | Foreign key constraint failed |
| `P2025` | `NOT_FOUND` | 404 | Record not found (update/delete) |
| `P2024` | `DB_QUERY_TIMEOUT` | 504 | Connection pool timeout |
| `P2034` | `DB_TRANSACTION_FAILED` | 500 | Transaction conflict |
| Other | `DB_TRANSACTION_FAILED` | 500 | Generic database error |

### 8.2 Transaction Error Handling Pattern
```typescript
// EVERY financial operation uses this pattern
async function safeTransaction<T>(
  operation: (tx: PrismaTransaction) => Promise<T>,
  errorCode: ErrorCode = 'DB_TRANSACTION_FAILED'
): Promise<T> {
  try {
    return await prisma.$transaction(operation, {
      maxWait: 10000,    // 10 seconds to acquire
      timeout: 30000,    // 30 seconds to execute
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    });
  } catch (error) {
    if (error instanceof AppError) throw error; // Re-throw our errors
    
    throw new AppError(errorCode, undefined, {
      originalError: (error as Error).message,
    });
  }
}

// Usage:
const result = await safeTransaction(async (tx) => {
  const user = await tx.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError('ACCOUNT_NOT_FOUND');
  if (user.wallet_balance < amount) throw new AppError('WALLET_INSUFFICIENT_BALANCE');
  
  // ... rest of transaction
  return updatedData;
}, 'WALLET_TRANSACTION_FAILED');
```

---

## 9. AUTHENTICATION ERRORS

### 9.1 Login Error Scenarios
| Scenario | Error Code | Details |
|----------|-----------|---------|
| ID does not exist | `AUTH_INVALID_CREDENTIALS` | — (never reveal if ID exists) |
| Password is wrong | `AUTH_INVALID_CREDENTIALS` | — (same message as above) |
| Account is blocked | `AUTH_ACCOUNT_BLOCKED` | `{ blocked_at, reason }` |
| Account is inactive | `AUTH_ACCOUNT_INACTIVE` | — |
| 5+ failed attempts | `AUTH_LOGIN_ATTEMPTS` | `{ retry_after_seconds }` |

**SECURITY RULE:** Login errors for "ID not found" and "wrong password" return the SAME error code and message. Never reveal whether the ID exists.

### 9.2 Token Error Scenarios
| Scenario | Error Code |
|----------|-----------|
| No Authorization header | `AUTH_TOKEN_MISSING` |
| Token format invalid | `AUTH_TOKEN_INVALID` |
| Token signature invalid | `AUTH_TOKEN_INVALID` |
| Token expired | `AUTH_TOKEN_EXPIRED` |
| Token blacklisted (logged out) | `AUTH_TOKEN_INVALID` |

---

## 10. AUTHORIZATION ERRORS

### 10.1 Role Check Errors
```typescript
// Role middleware pattern
function requireRole(...allowedRoles: Role[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user;
    
    if (!user) {
      throw new AppError('AUTH_TOKEN_MISSING');
    }
    
    if (!allowedRoles.includes(user.role)) {
      throw new AppError('ROLE_NOT_ALLOWED', undefined, {
        requiredRoles: allowedRoles,
        yourRole: user.role,
      });
    }
  };
}
```

### 10.2 Hierarchy Check Errors
```typescript
// Hierarchy middleware pattern
async function requireDownlineAccess(request: FastifyRequest, targetUserId: number) {
  const user = request.user;
  
  // Admin can access everyone
  if (user.role === 'admin') return;
  
  // Check if target is in requester's downline
  const isInDownline = await isUserInDownline(user.id, targetUserId);
  
  if (!isInDownline) {
    throw new AppError('HIERARCHY_ACCESS_DENIED', undefined, {
      yourId: user.user_id,
      targetId: targetUserId,
    });
  }
}
```

---

## 11. WALLET & FINANCIAL ERRORS

### 11.1 Every Wallet Operation Check
```typescript
function validateWalletOperation(user: User, amount: number, operation: 'credit' | 'debit') {
  
  // Check 1: Amount is valid
  if (!Number.isInteger(amount)) {
    throw new AppError('WALLET_INVALID_AMOUNT', 'Amount must be a whole number (no decimals)');
  }
  if (amount <= 0) {
    throw new AppError('WALLET_ZERO_AMOUNT');
  }
  
  // Check 2: For debits — sufficient balance
  if (operation === 'debit') {
    if (user.wallet_balance < amount) {
      throw new AppError('WALLET_INSUFFICIENT_BALANCE', undefined, {
        available: user.wallet_balance,
        required: amount,
        shortfall: amount - user.wallet_balance,
      });
    }
    
    // Verify no negative result
    if (user.wallet_balance - amount < 0) {
      throw new AppError('WALLET_NEGATIVE_RESULT');
    }
  }
  
  // Check 3: Credit limit
  if (operation === 'credit' && user.credit_limit > 0) {
    if (user.wallet_balance + amount > user.credit_limit) {
      throw new AppError('WALLET_EXCEEDS_CREDIT_LIMIT', undefined, {
        creditLimit: user.credit_limit,
        currentBalance: user.wallet_balance,
        attemptedCredit: amount,
      });
    }
  }
}
```

---

## 12. BET PLACEMENT ERRORS

### 12.1 Complete Bet Validation Chain
```typescript
async function validateBetPlacement(userId: number, data: PlaceBetInput) {
  
  // 1. Check user is not blocked
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError('ACCOUNT_NOT_FOUND');
  if (user.is_blocked) throw new AppError('BET_USER_BLOCKED');
  
  // 2. Check game exists and is active
  const game = await prisma.game.findUnique({ where: { id: data.game_id } });
  if (!game) throw new AppError('BET_GAME_NOT_FOUND');
  if (!game.is_active) throw new AppError('BET_GAME_INACTIVE');
  
  // 3. Check betting is not blocked
  const isBlocked = await isBetBlocked(data.game_id, data.bet_type);
  if (isBlocked) throw new AppError('BET_BLOCKED_FOR_TYPE');
  
  // 4. Check betting window is open
  const window = await getOpenWindow(data.game_id);
  if (!window) throw new AppError('BET_WINDOW_NOT_FOUND');
  if (new Date() > window.closes_at) throw new AppError('BET_WINDOW_CLOSED');
  
  // 5. Validate bet number for bet type
  if (!validateBetNumber(data.bet_type, data.bet_number)) {
    throw new AppError('BET_INVALID_NUMBER', undefined, {
      bet_type: data.bet_type,
      bet_number: data.bet_number,
      rules: getBetNumberRules(data.bet_type),
    });
  }
  
  // 6. Check bet amount
  const minBet = await getSetting('min_bet_amount');
  if (data.bet_amount < Number(minBet)) {
    throw new AppError('BET_BELOW_MINIMUM', undefined, {
      minimum: Number(minBet),
      attempted: data.bet_amount,
    });
  }
  
  // 7. Check balance
  if (user.wallet_balance < data.bet_amount) {
    throw new AppError('WALLET_INSUFFICIENT_BALANCE', undefined, {
      available: user.wallet_balance,
      required: data.bet_amount,
    });
  }
  
  return { user, game, window };
}
```

---

## 13. GAME & BETTING WINDOW ERRORS

### 13.1 Game Management Errors
```typescript
// Before creating a game
async function validateGameCreation(data: CreateGameInput) {
  const existingName = await prisma.game.findUnique({ where: { name: data.name } });
  if (existingName) throw new AppError('GAME_NAME_EXISTS');
  
  const existingSlug = await prisma.game.findUnique({ where: { slug: data.slug } });
  if (existingSlug) throw new AppError('GAME_SLUG_EXISTS');
  
  if (data.close_time <= data.open_time) {
    throw new AppError('GAME_INVALID_TIMING');
  }
}

// Before deleting a game
async function validateGameDeletion(gameId: number) {
  const pendingBets = await prisma.bet.count({
    where: { game_id: gameId, status: 'pending' },
  });
  if (pendingBets > 0) {
    throw new AppError('GAME_HAS_PENDING_BETS', undefined, {
      pendingBetsCount: pendingBets,
    });
  }
}
```

---

## 14. RESULT DECLARATION ERRORS

```typescript
async function validateResultDeclaration(data: DeclareResultInput) {
  
  // 1. Game must be active
  const game = await prisma.game.findUnique({ where: { id: data.game_id } });
  if (!game) throw new AppError('GAME_NOT_FOUND');
  if (!game.is_active) throw new AppError('RESULT_GAME_INACTIVE');
  
  // 2. Result must not already exist
  const existing = await prisma.result.findUnique({
    where: { game_id_date_session: { game_id: data.game_id, date: data.date, session: data.session } },
  });
  if (existing && !existing.is_rolled_back) {
    throw new AppError('RESULT_ALREADY_DECLARED');
  }
  
  // 3. Panna validation
  if (!/^[0-9]{3}$/.test(data.panna)) {
    throw new AppError('RESULT_INVALID_PANNA', undefined, {
      entered: data.panna,
      expected: '3 digits (000-999)',
    });
  }
  
  // 4. For CLOSE session — OPEN must be declared first
  if (data.session === 'CLOSE') {
    const openResult = await prisma.result.findUnique({
      where: { game_id_date_session: { game_id: data.game_id, date: data.date, session: 'OPEN' } },
    });
    if (!openResult || openResult.is_rolled_back) {
      throw new AppError('RESULT_OPEN_NOT_DECLARED');
    }
  }
}
```

---

## 15. SETTLEMENT ERRORS

```typescript
async function validateSettlement(resultId: number) {
  const result = await prisma.result.findUnique({ where: { id: resultId } });
  if (!result) throw new AppError('RESULT_NOT_FOUND');
  
  if (result.is_settled && !result.is_rolled_back) {
    throw new AppError('SETTLEMENT_ALREADY_DONE');
  }
  
  const pendingBets = await prisma.bet.count({
    where: { game_id: result.game_id, date: result.date, status: 'pending' },
  });
  if (pendingBets === 0) {
    throw new AppError('SETTLEMENT_NO_BETS');
  }
}
```

---

## 16. ROLLBACK ERRORS

```typescript
async function validateRollback(resultId: number) {
  const result = await prisma.result.findUnique({ where: { id: resultId } });
  if (!result) throw new AppError('RESULT_NOT_FOUND');
  
  if (!result.is_settled) {
    throw new AppError('ROLLBACK_NOT_SETTLED');
  }
  
  if (result.is_rolled_back) {
    throw new AppError('ROLLBACK_ALREADY_DONE');
  }
  
  // Check if any winners have already withdrawn (balance < win amount)
  const winnersWithdrawals = await checkWinnerWithdrawals(resultId);
  if (winnersWithdrawals.length > 0) {
    throw new AppError('ROLLBACK_WITHDRAWAL_CONFLICT', undefined, {
      affectedUsers: winnersWithdrawals.map(w => ({
        user_id: w.user_id,
        win_amount: w.win_amount,
        current_balance: w.wallet_balance,
        shortfall: w.win_amount - w.wallet_balance,
      })),
    });
  }
}
```

---

## 17. ACCOUNT MANAGEMENT ERRORS

```typescript
// Who can create which role
function validateAccountCreation(creatorRole: Role, targetRole: Role) {
  const allowed: Record<Role, Role[]> = {
    admin:       ['supermaster', 'master', 'user'],
    supermaster: ['master', 'user'],
    master:      ['user'],
    user:        [],
  };
  
  if (!allowed[creatorRole].includes(targetRole)) {
    throw new AppError('ACCOUNT_INVALID_ROLE', undefined, {
      yourRole: creatorRole,
      attemptedRole: targetRole,
      allowedRoles: allowed[creatorRole],
    });
  }
}

// Deal percentage validation
function validateDealPercentage(parentDealPercent: number, childDealPercent: number) {
  if (childDealPercent > parentDealPercent) {
    throw new AppError('ACCOUNT_DEAL_EXCEEDS', undefined, {
      yourDealPercent: parentDealPercent,
      attemptedDealPercent: childDealPercent,
      maxAllowed: parentDealPercent,
    });
  }
}
```

---

## 18. WEBSOCKET ERROR HANDLING

```typescript
// server/socket/index.ts

io.on('connection', (socket) => {
  
  // Wrap every event handler with error catching
  socket.on('subscribe-game', async (gameId: number) => {
    try {
      if (typeof gameId !== 'number') {
        socket.emit('error', { code: 'VALIDATION_ERROR', message: 'Invalid game ID' });
        return;
      }
      socket.join(`game:${gameId}`);
    } catch (error) {
      socket.emit('error', { code: 'INTERNAL_ERROR', message: 'Failed to subscribe' });
    }
  });
  
  // Handle socket-level errors
  socket.on('error', (error) => {
    app.log.error({ category: 'websocket', socketId: socket.id, error: error.message });
  });
  
  // Handle disconnect
  socket.on('disconnect', (reason) => {
    app.log.debug({ category: 'websocket', socketId: socket.id, reason });
  });
});

// Emit helper with error catching
export function safeEmit(room: string, event: string, data: any) {
  try {
    io.to(room).emit(event, data);
  } catch (error) {
    app.log.error({ category: 'websocket_emit', room, event, error: (error as Error).message });
  }
}
```

---

## 19. CRON JOB ERROR HANDLING

```typescript
// Every cron job uses this wrapper
async function safeCronJob(name: string, job: () => Promise<void>) {
  const startTime = Date.now();
  
  try {
    app.log.info({ category: 'cron', job: name, status: 'started' });
    
    await job();
    
    app.log.info({
      category: 'cron',
      job: name,
      status: 'completed',
      duration_ms: Date.now() - startTime,
    });
  } catch (error) {
    app.log.error({
      category: 'cron',
      job: name,
      status: 'failed',
      error: (error as Error).message,
      stack: (error as Error).stack,
      duration_ms: Date.now() - startTime,
    });
    
    // Report to Sentry
    Sentry.captureException(error, { tags: { cron_job: name } });
    
    // CRON FAILURES NEVER CRASH THE SERVER
    // They log, report, and continue
  }
}

// Usage
cron.schedule('30 20 * * *', () => safeCronJob('daily-reset', DailyResetService.execute));
cron.schedule('35 20 * * *', () => safeCronJob('result-cleanup', ResultCleanupService.execute));
cron.schedule('* * * * *', () => safeCronJob('window-auto-close', WindowAutoCloseService.execute));
```

---

## 20. FRONTEND ERROR HANDLING

### 20.1 API Error Types
```typescript
// src/lib/errors.ts

export class ApiError extends Error {
  constructor(
    public code: string,
    public message: string,
    public statusCode: number,
    public details?: Record<string, any>,
  ) {
    super(message);
  }
}

// Check error type in components
export function isAuthError(error: ApiError): boolean {
  return error.code.startsWith('AUTH_');
}

export function isValidationError(error: ApiError): boolean {
  return error.code === 'VALIDATION_ERROR';
}

export function isWalletError(error: ApiError): boolean {
  return error.code.startsWith('WALLET_');
}
```

### 20.2 React Error Boundary
```typescript
// src/components/ErrorBoundary.tsx

'use client';
import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };
  
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info);
    // Report to Sentry in production
  }
  
  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <p className="text-lg text-gray-600">Something went wrong</p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-4 py-2 bg-primary text-white rounded-lg"
          >
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
```

### 20.3 Toast Error Display
```typescript
// src/lib/toast.ts

import { ApiError } from './errors';

export function showErrorToast(error: ApiError | Error) {
  if (error instanceof ApiError) {
    // User-friendly messages from backend
    toast.error(error.message);
    
    // Special handling for specific errors
    if (error.code === 'AUTH_TOKEN_EXPIRED') {
      // Auto-redirect to login
      window.location.href = '/login';
    }
    if (error.code === 'WALLET_INSUFFICIENT_BALANCE' && error.details) {
      toast.error(`Need ₹${error.details.required}. You have ₹${error.details.available}.`);
    }
  } else {
    // Generic errors
    toast.error('Something went wrong. Please try again.');
  }
}
```

---

## 21. API CLIENT ERROR HANDLING

```typescript
// src/lib/api.ts

export async function apiClient<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = useAuthStore.getState().token;
  
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new ApiError(
        data.error.code,
        data.error.message,
        response.status,
        data.error.details,
      );
    }
    
    return data.data as T;
    
  } catch (error) {
    // Network error (no response at all)
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new ApiError(
        'NETWORK_ERROR',
        'Unable to connect to server. Please check your internet connection.',
        0,
      );
    }
    
    // Re-throw ApiError as-is
    if (error instanceof ApiError) throw error;
    
    // Unknown error
    throw new ApiError('UNKNOWN_ERROR', 'An unexpected error occurred', 500);
  }
}

// Usage in components:
try {
  const result = await apiClient('/bets/place', {
    method: 'POST',
    body: JSON.stringify(betData),
  });
  toast.success('Bet placed successfully!');
} catch (error) {
  if (error instanceof ApiError) {
    showErrorToast(error);
  }
}
```

---

## 22. ERROR LOGGING STRATEGY

### 22.1 Log Levels
```
FATAL  → Server crash, database connection lost permanently
         Action: Alert immediately, auto-restart via PM2

ERROR  → Failed transactions, settlement errors, rollback failures
         Action: Log + Sentry alert + manual review if financial

WARN   → Insufficient balance attempts, rate limits, blocked user tries to login
         Action: Log only (expected business errors)

INFO   → Successful settlements, result declarations, account creations
         Action: Log for audit trail

DEBUG  → API requests, database queries, WebSocket events
         Action: Development only, disabled in production
```

### 22.2 Structured Log Format
```json
{
  "level": "error",
  "time": "2026-02-08T14:30:00.000Z",
  "category": "settlement",
  "errorCode": "SETTLEMENT_FAILED",
  "message": "Settlement failed for KALYAN OPEN",
  "gameId": 5,
  "date": "2026-02-08",
  "betsCount": 156,
  "userId": 0,
  "ip": "192.168.1.1",
  "duration_ms": 15234,
  "stack": "Error: Settlement failed...",
  "metadata": {
    "failedAtBetId": 4523,
    "reason": "Prisma transaction timeout"
  }
}
```

---

## 23. ERROR RECOVERY PATTERNS

### 23.1 Settlement Recovery
```
IF settlement fails mid-way:
  1. Transaction rolls back automatically (Prisma $transaction)
  2. All bets remain "pending" (no partial settlement)
  3. All wallets unchanged (no partial credits)
  4. Error logged with full context
  5. Admin sees "Settlement Failed" status on dashboard
  6. Admin can retry by re-declaring the result
  7. System re-attempts settlement from scratch
```

### 23.2 Rollback Recovery
```
IF rollback fails mid-way:
  1. Transaction rolls back automatically
  2. Settlement remains intact (no partial reversal)
  3. Error flagged for manual review
  4. Admin sees "Rollback Failed — Manual Review Required"
  5. Developer can inspect logs and fix manually if needed
```

### 23.3 Wallet Recovery
```
IF wallet update fails:
  1. Transaction rolls back (balance unchanged)
  2. Bet/credit/debit operation cancelled entirely
  3. User sees: "Transaction failed. No changes were made"
  4. Can retry immediately

VERIFICATION:
  - Periodic job compares wallet_balance vs SUM of transactions
  - If mismatch detected → Alert admin + log discrepancy
  - Never auto-fix → Requires manual review
```

---

## 24. RETRY LOGIC

```typescript
// server/utils/retry.ts

export async function withRetry<T>(
  operation: () => Promise<T>,
  options: {
    maxRetries?: number;
    delayMs?: number;
    backoff?: boolean;
    retryOn?: (error: Error) => boolean;
  } = {}
): Promise<T> {
  const { maxRetries = 3, delayMs = 1000, backoff = true, retryOn } = options;
  
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry business errors (they'll fail again)
      if (error instanceof AppError && error.isOperational) throw error;
      
      // Custom retry condition
      if (retryOn && !retryOn(error as Error)) throw error;
      
      // Last attempt — don't wait, just throw
      if (attempt === maxRetries) break;
      
      // Wait before retry (with exponential backoff)
      const delay = backoff ? delayMs * Math.pow(2, attempt - 1) : delayMs;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}

// Usage:
const result = await withRetry(
  () => SettlementService.settleGame(gameId, date, result),
  { maxRetries: 2, delayMs: 2000 }
);
```

### 24.1 What To Retry vs What Not To Retry
```
RETRY (Transient failures):
├── Database connection timeout (P2024)
├── Redis connection timeout
├── Network glitches
└── Lock contention on transactions

NEVER RETRY (Business errors):
├── Insufficient balance (same input = same result)
├── Validation errors (same input = same result)
├── Authentication errors (same token = same result)
├── Already declared/settled (idempotency issue)
└── Any AppError with isOperational = true
```

---

## 25. CIRCUIT BREAKER PATTERN

```typescript
// server/utils/circuitBreaker.ts

class CircuitBreaker {
  private failures: number = 0;
  private lastFailure: number = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  
  constructor(
    private threshold: number = 5,
    private resetTimeout: number = 30000, // 30 seconds
  ) {}
  
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailure > this.resetTimeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw new AppError('DB_CONNECTION_FAILED', 'Service temporarily unavailable');
      }
    }
    
    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  
  private onSuccess() {
    this.failures = 0;
    this.state = 'CLOSED';
  }
  
  private onFailure() {
    this.failures++;
    this.lastFailure = Date.now();
    if (this.failures >= this.threshold) {
      this.state = 'OPEN';
    }
  }
}

// Usage for database operations
const dbCircuitBreaker = new CircuitBreaker(5, 30000);

async function safeQuery<T>(query: () => Promise<T>): Promise<T> {
  return dbCircuitBreaker.execute(query);
}
```

---

## 26. ERROR MONITORING (SENTRY)

```typescript
// server/lib/sentry.ts

import * as Sentry from '@sentry/node';

export function setupSentry() {
  if (!process.env.SENTRY_DSN) return;
  
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    
    beforeSend(event) {
      // Don't send operational errors (business logic errors)
      if (event.extra?.isOperational) return null;
      
      // Scrub sensitive data
      if (event.request?.data) {
        const data = JSON.parse(event.request.data);
        if (data.password) data.password = '[REDACTED]';
        event.request.data = JSON.stringify(data);
      }
      
      return event;
    },
  });
}

// Automatic capture in error handler:
// Only 500 errors go to Sentry (not 400/401/403/404)
if (error.statusCode >= 500 || !(error instanceof AppError)) {
  Sentry.captureException(error, {
    tags: {
      errorCode: error.code,
      userId: request.user?.id,
      userRole: request.user?.role,
    },
    extra: {
      url: request.url,
      method: request.method,
      body: request.body,
    },
  });
}
```

---

## 27. ERROR RESPONSE EXAMPLES — EVERY SCENARIO

### 27.1 Validation Error
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data",
    "details": {
      "fields": [
        { "field": "bet_amount", "message": "Minimum bet is ₹10", "code": "too_small" },
        { "field": "bet_number", "message": "Invalid number for JODI (must be 2 digits)", "code": "invalid_string" }
      ]
    }
  }
}
```

### 27.2 Insufficient Balance
```json
{
  "success": false,
  "error": {
    "code": "WALLET_INSUFFICIENT_BALANCE",
    "message": "Insufficient coin balance",
    "details": {
      "available": 200,
      "required": 500,
      "shortfall": 300
    }
  }
}
```

### 27.3 Betting Window Closed
```json
{
  "success": false,
  "error": {
    "code": "BET_WINDOW_CLOSED",
    "message": "Betting window is closed for this game",
    "details": null
  }
}
```

### 27.4 Token Expired
```json
{
  "success": false,
  "error": {
    "code": "AUTH_TOKEN_EXPIRED",
    "message": "Authentication token has expired. Please login again",
    "details": null
  }
}
```

### 27.5 Hierarchy Access Denied
```json
{
  "success": false,
  "error": {
    "code": "HIERARCHY_ACCESS_DENIED",
    "message": "You can only access members in your downline",
    "details": {
      "yourId": "BSM80867",
      "targetId": 45
    }
  }
}
```

### 27.6 Rollback Conflict
```json
{
  "success": false,
  "error": {
    "code": "ROLLBACK_WITHDRAWAL_CONFLICT",
    "message": "Some winners have already withdrawn funds. Review required",
    "details": {
      "affectedUsers": [
        { "user_id": "PL519", "win_amount": 16000, "current_balance": 3000, "shortfall": 13000 },
        { "user_id": "PL8239", "win_amount": 10000, "current_balance": 0, "shortfall": 10000 }
      ]
    }
  }
}
```

### 27.7 Internal Error (500)
```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An unexpected error occurred",
    "details": null
  }
}
```

---

## 28. TESTING ERROR SCENARIOS

### 28.1 Critical Error Scenarios to Test
```
WALLET:
□ Place bet with 0 balance
□ Place bet with exact balance (should succeed)
□ Place bet with 1 coin less than needed
□ Credit coins to user at credit limit
□ Debit more than available
□ Two simultaneous bets exceeding total balance (race condition)

BETTING:
□ Place bet 1 second after window closes
□ Place bet on inactive game
□ Place Single Akda with "10" (invalid — must be 1 digit)
□ Place JODI with "5" (invalid — must be 2 digits)
□ Place Double Patti with "123" (invalid — all different, should be Single Patti)
□ Place bet while user is blocked

SETTLEMENT:
□ Declare result with no pending bets
□ Declare result for already-declared game/date/session
□ Declare Close before Open
□ Settlement with 1000 concurrent bets
□ Settlement where one winner credit fails (should rollback ALL)

ROLLBACK:
□ Rollback already-rolled-back settlement
□ Rollback when winner has 0 balance
□ Rollback settlement that was never completed

AUTH:
□ Login with correct ID, wrong password (5 times = lockout)
□ Login with non-existent ID
□ Access admin endpoint with user token
□ Access with expired token
□ Access SM endpoint trying to see another SM's downline

HIERARCHY:
□ SM tries to create Super Master (forbidden)
□ Master tries to manage another Master's users
□ Set child deal % higher than parent's
□ Block user above you in hierarchy
```

---

## 29. ERROR HANDLING CHECKLIST FOR NEW FEATURES

### When adding ANY new feature, check EVERY item:

```
INPUT VALIDATION:
□ Zod schema defined for all inputs
□ All numbers validated as integers where required
□ All strings validated for length and format
□ All IDs validated as positive integers
□ All enums validated against allowed values

AUTHORIZATION:
□ Route protected with auth middleware
□ Role check middleware applied
□ Hierarchy scope check applied
□ Cannot modify entities above your hierarchy level

BUSINESS LOGIC:
□ All preconditions checked at START of function
□ Clear AppError thrown for each failure case
□ Error code exists in ERROR_CODES registry
□ Details object includes useful debugging info

DATABASE:
□ Prisma $transaction used for multi-step operations
□ Prisma errors caught and mapped to AppError
□ Unique constraint violations handled gracefully
□ Foreign key errors handled gracefully
□ No raw SQL without error handling

FINANCIAL (if money involved):
□ Integer math only (no parseFloat, no toFixed)
□ Balance checked BEFORE deduction
□ Transaction records created for EVERY coin movement
□ balance_before + amount = balance_after verified
□ Atomic transaction wraps ALL wallet changes

REAL-TIME:
□ WebSocket emit wrapped in try-catch
□ Failed emits don't crash the request
□ Disconnected clients handled gracefully

LOGGING:
□ Error logged with full context (userId, endpoint, params)
□ Success logged for audit-worthy operations
□ No sensitive data in logs (passwords, tokens)

FRONTEND:
□ API call wrapped in try-catch
□ ApiError handled with appropriate toast
□ Loading state shown during API call
□ Error state UI displayed for failures
□ Retry button available where appropriate
□ Auth errors redirect to login
```

---

## DOCUMENT VERSION HISTORY

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Feb 2026 | Initial comprehensive Error Handling |

---

**END OF ERROR HANDLING DOCUMENT — This document ensures every error in the Matka Betting Platform is caught, handled, logged, and displayed consistently across the entire application.**
