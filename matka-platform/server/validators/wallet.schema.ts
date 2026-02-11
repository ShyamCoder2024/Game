// server/validators/wallet.schema.ts
// Zod schemas for Wallet Operations APIs

import { z } from 'zod';

// ==========================================
// CREDIT / DEBIT COINS
// ==========================================
export const creditDebitSchema = z.object({
    user_id: z.number().int().positive(),
    amount: z.number().int().positive('Amount must be a positive integer'),
    notes: z.string().max(500).optional().default(''),
});

// ==========================================
// TRANSACTION HISTORY FILTERS
// ==========================================
export const transactionHistorySchema = z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
    type: z.string().optional(),
    dateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    dateTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

// ==========================================
// PARAM SCHEMAS
// ==========================================
export const userIdParamSchema = z.object({
    userId: z.string().regex(/^\d+$/).transform(Number),
});

// Inferred types
export type CreditDebitInput = z.infer<typeof creditDebitSchema>;
export type TransactionHistoryQuery = z.infer<typeof transactionHistorySchema>;
