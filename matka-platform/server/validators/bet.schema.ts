// server/validators/bet.schema.ts
// Zod schemas for Bet Placement APIs

import { z } from 'zod';

// ==========================================
// PLACE BET
// ==========================================
export const placeBetSchema = z.object({
    game_id: z.number().int().positive(),
    bet_type: z.enum(['SINGLE_AKDA', 'SINGLE_PATTI', 'DOUBLE_PATTI', 'TRIPLE_PATTI', 'JODI']),
    bet_number: z.string().min(1).max(3).trim(),
    session: z.enum(['OPEN', 'CLOSE']),
    amount: z.number().int().positive('Bet amount must be a positive integer'),
});

// ==========================================
// BET LIST FILTERS
// ==========================================
export const betListQuerySchema = z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
    game_id: z.string().regex(/^\d+$/).transform(Number).optional(),
    status: z.enum(['pending', 'won', 'lost', 'cancelled']).optional(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    bet_type: z.enum(['SINGLE_AKDA', 'SINGLE_PATTI', 'DOUBLE_PATTI', 'TRIPLE_PATTI', 'JODI']).optional(),
});

// ==========================================
// PARAM SCHEMAS
// ==========================================
export const betIdParamSchema = z.object({
    betId: z.string().regex(/^\d+$/).transform(Number),
});

// Inferred types
export type PlaceBetInput = z.infer<typeof placeBetSchema>;
export type BetListQuery = z.infer<typeof betListQuerySchema>;
