// server/validators/result.schema.ts
// Zod schemas for Result Declaration APIs

import { z } from 'zod';

// ==========================================
// DECLARE RESULT (Admin enters panna)
// ==========================================
export const declareResultSchema = z.object({
    game_id: z.number().int().positive(),
    session: z.enum(['OPEN', 'CLOSE']),
    panna: z.string().regex(/^\d{3}$/, 'Panna must be a 3-digit number'),
});

// ==========================================
// PREVIEW RESULT (auto-calculate without saving)
// ==========================================
export const previewResultSchema = z.object({
    game_id: z.number().int().positive(),
    session: z.enum(['OPEN', 'CLOSE']),
    panna: z.string().regex(/^\d{3}$/, 'Panna must be a 3-digit number'),
});

// ==========================================
// LIST RESULTS FILTERS
// ==========================================
export const resultListQuerySchema = z.object({
    game_id: z.string().regex(/^\d+$/).transform(Number).optional(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

// ==========================================
// PARAM SCHEMAS
// ==========================================
export const resultIdParamSchema = z.object({
    id: z.string().regex(/^\d+$/).transform(Number),
});

export const resultGameIdParamSchema = z.object({
    gameId: z.string().regex(/^\d+$/).transform(Number),
});

// Inferred types
export type DeclareResultInput = z.infer<typeof declareResultSchema>;
