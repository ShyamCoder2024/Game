// server/validators/game.schema.ts
// Zod schemas for Game Management APIs

import { z } from 'zod';

// ==========================================
// TIME FORMAT: HH:mm (24-hour IST)
// ==========================================
const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

// ==========================================
// CREATE GAME
// ==========================================
export const createGameSchema = z.object({
    name: z.string().min(1).max(100).trim(),
    slug: z.string().min(1).max(100).trim().regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
    open_time: z.string().regex(timeRegex, 'Must be HH:mm format'),
    close_time: z.string().regex(timeRegex, 'Must be HH:mm format'),
    result_time: z.string().regex(timeRegex, 'Must be HH:mm format'),
    color_code: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color').default('#3B82F6'),
    display_order: z.number().int().min(0).default(0),
});

// ==========================================
// UPDATE GAME
// ==========================================
export const updateGameSchema = z.object({
    name: z.string().min(1).max(100).trim().optional(),
    open_time: z.string().regex(timeRegex, 'Must be HH:mm format').optional(),
    close_time: z.string().regex(timeRegex, 'Must be HH:mm format').optional(),
    result_time: z.string().regex(timeRegex, 'Must be HH:mm format').optional(),
    color_code: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
    display_order: z.number().int().min(0).optional(),
});

// ==========================================
// TOGGLE GAME (enable/disable)
// ==========================================
export const toggleGameSchema = z.object({
    is_active: z.boolean(),
});

// ==========================================
// SET PAYOUT MULTIPLIERS (per-game or global)
// ==========================================
export const setMultipliersSchema = z.object({
    multipliers: z.array(z.object({
        bet_type: z.enum(['SINGLE_AKDA', 'SINGLE_PATTI', 'DOUBLE_PATTI', 'TRIPLE_PATTI', 'JODI']),
        multiplier: z.number().int().min(1).max(10000),
    })).min(1).max(5),
});

// ==========================================
// QUERY PARAMS
// ==========================================
export const gameIdParamSchema = z.object({
    id: z.string().regex(/^\d+$/).transform(Number),
});

export const gameIdSlugParamSchema = z.object({
    gameId: z.string().regex(/^\d+$/).transform(Number),
});

// Inferred types
export type CreateGameInput = z.infer<typeof createGameSchema>;
export type UpdateGameInput = z.infer<typeof updateGameSchema>;
export type SetMultipliersInput = z.infer<typeof setMultipliersSchema>;
