// server/validators/credit.schema.ts
// Zod schemas for credit/loan endpoints

import { z } from 'zod';

// Give credit to a user
export const giveCreditSchema = z.object({
    toUserId: z.number().int().positive(),
    amount: z.number().int().positive(),
    note: z.string().max(500).optional(),
});

// Repay credit
export const repayCreditSchema = z.object({
    loanId: z.number().int().positive(),
    amount: z.number().int().positive(),
});

// Credit list query
export const creditListSchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    status: z.enum(['active', 'partially_paid', 'fully_paid', 'all']).default('all'),
});

// Types
export type GiveCreditInput = z.infer<typeof giveCreditSchema>;
export type RepayCreditInput = z.infer<typeof repayCreditSchema>;
export type CreditListQuery = z.infer<typeof creditListSchema>;
