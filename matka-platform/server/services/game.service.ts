// server/services/game.service.ts
// Game Management Service — CRUD games, multipliers, betting windows

import { prisma } from '../lib/prisma';
import { AppError } from '../utils/errors';
import type { CreateGameInput, UpdateGameInput, SetMultipliersInput } from '../validators/game.schema';

export class GameService {

    // ==========================================
    // GAME CRUD
    // ==========================================

    /** Create a new game */
    static async createGame(data: CreateGameInput) {
        // Check for duplicate slug
        const existing = await prisma.game.findUnique({ where: { slug: data.slug } });
        if (existing) {
            throw new AppError('DUPLICATE_ENTRY', `Game with slug "${data.slug}" already exists`);
        }

        const game = await prisma.game.create({ data });
        return game;
    }

    /** Update an existing game */
    static async updateGame(gameId: number, data: UpdateGameInput) {
        const game = await prisma.game.findUnique({ where: { id: gameId } });
        if (!game || game.is_deleted) {
            throw new AppError('NOT_FOUND', 'Game not found');
        }

        const updated = await prisma.game.update({
            where: { id: gameId },
            data,
        });
        return updated;
    }

    /** Soft-delete a game */
    static async deleteGame(gameId: number) {
        const game = await prisma.game.findUnique({ where: { id: gameId } });
        if (!game || game.is_deleted) {
            throw new AppError('NOT_FOUND', 'Game not found');
        }

        await prisma.game.update({
            where: { id: gameId },
            data: { is_deleted: true, is_active: false },
        });

        return { message: 'Game deleted successfully' };
    }

    /** Toggle game active status */
    static async toggleGame(gameId: number, isActive: boolean) {
        const game = await prisma.game.findUnique({ where: { id: gameId } });
        if (!game || game.is_deleted) {
            throw new AppError('NOT_FOUND', 'Game not found');
        }

        const updated = await prisma.game.update({
            where: { id: gameId },
            data: { is_active: isActive },
        });
        return updated;
    }

    /** Get a single game by ID */
    static async getGameById(gameId: number) {
        const game = await prisma.game.findUnique({ where: { id: gameId } });
        if (!game || game.is_deleted) {
            throw new AppError('NOT_FOUND', 'Game not found');
        }
        return game;
    }

    /** List all active games (for authenticated users) */
    static async listActiveGames() {
        const games = await prisma.game.findMany({
            where: { is_active: true, is_deleted: false },
            orderBy: { display_order: 'asc' },
        });
        return games;
    }

    /** List all games including inactive (for admin) */
    static async listAllGames() {
        const games = await prisma.game.findMany({
            where: { is_deleted: false },
            orderBy: { display_order: 'asc' },
        });
        return games;
    }

    // ==========================================
    // PAYOUT MULTIPLIER MANAGEMENT
    // ==========================================

    /** Set multipliers for a specific game (per-game override) */
    static async setGameMultipliers(gameId: number, data: SetMultipliersInput, changedBy: number) {
        const game = await prisma.game.findUnique({ where: { id: gameId } });
        if (!game || game.is_deleted) {
            throw new AppError('NOT_FOUND', 'Game not found');
        }

        const results = [];
        for (const m of data.multipliers) {
            const existing = await prisma.payoutMultiplier.findFirst({
                where: { game_id: gameId, bet_type: m.bet_type as 'SINGLE_AKDA' | 'SINGLE_PATTI' | 'DOUBLE_PATTI' | 'TRIPLE_PATTI' | 'JODI' },
            });

            if (existing) {
                const updated = await prisma.payoutMultiplier.update({
                    where: { id: existing.id },
                    data: {
                        previous_multiplier: existing.multiplier,
                        multiplier: m.multiplier,
                        changed_by: changedBy,
                        changed_at: new Date(),
                    },
                });
                results.push(updated);
            } else {
                const created = await prisma.payoutMultiplier.create({
                    data: {
                        game_id: gameId,
                        bet_type: m.bet_type as 'SINGLE_AKDA' | 'SINGLE_PATTI' | 'DOUBLE_PATTI' | 'TRIPLE_PATTI' | 'JODI',
                        multiplier: m.multiplier,
                        changed_by: changedBy,
                        changed_at: new Date(),
                    },
                });
                results.push(created);
            }
        }

        return results;
    }

    /** Set global default multipliers (game_id = null) */
    static async setGlobalMultipliers(data: SetMultipliersInput, changedBy: number) {
        const results = [];
        for (const m of data.multipliers) {
            const existing = await prisma.payoutMultiplier.findFirst({
                where: { game_id: null, bet_type: m.bet_type as 'SINGLE_AKDA' | 'SINGLE_PATTI' | 'DOUBLE_PATTI' | 'TRIPLE_PATTI' | 'JODI' },
            });

            if (existing) {
                const updated = await prisma.payoutMultiplier.update({
                    where: { id: existing.id },
                    data: {
                        previous_multiplier: existing.multiplier,
                        multiplier: m.multiplier,
                        changed_by: changedBy,
                        changed_at: new Date(),
                    },
                });
                results.push(updated);
            } else {
                const created = await prisma.payoutMultiplier.create({
                    data: {
                        game_id: null,
                        bet_type: m.bet_type as 'SINGLE_AKDA' | 'SINGLE_PATTI' | 'DOUBLE_PATTI' | 'TRIPLE_PATTI' | 'JODI',
                        multiplier: m.multiplier,
                        changed_by: changedBy,
                        changed_at: new Date(),
                    },
                });
                results.push(created);
            }
        }

        return results;
    }

    /** Get multipliers for a game (game-specific first, fallback to global) */
    static async getMultipliers(gameId: number) {
        // Try game-specific first
        const gameMultipliers = await prisma.payoutMultiplier.findMany({
            where: { game_id: gameId, is_active: true },
        });

        // Get global defaults
        const globalMultipliers = await prisma.payoutMultiplier.findMany({
            where: { game_id: null, is_active: true },
        });

        // Merge: game-specific overrides global
        const betTypes = ['SINGLE_AKDA', 'SINGLE_PATTI', 'DOUBLE_PATTI', 'TRIPLE_PATTI', 'JODI'] as const;
        const merged = betTypes.map((bt) => {
            const gameM = gameMultipliers.find((m) => m.bet_type === bt);
            const globalM = globalMultipliers.find((m) => m.bet_type === bt);
            return gameM || globalM || { bet_type: bt, multiplier: 0, game_id: null };
        });

        return merged;
    }

    /** Get the active multiplier for a specific bet type on a game */
    static async getActiveMultiplier(gameId: number, betType: string): Promise<number> {
        // Game-specific first
        const gameM = await prisma.payoutMultiplier.findFirst({
            where: { game_id: gameId, bet_type: betType as 'SINGLE_AKDA' | 'SINGLE_PATTI' | 'DOUBLE_PATTI' | 'TRIPLE_PATTI' | 'JODI', is_active: true },
        });
        if (gameM) return gameM.multiplier;

        // Global fallback
        const globalM = await prisma.payoutMultiplier.findFirst({
            where: { game_id: null, bet_type: betType as 'SINGLE_AKDA' | 'SINGLE_PATTI' | 'DOUBLE_PATTI' | 'TRIPLE_PATTI' | 'JODI', is_active: true },
        });
        if (globalM) return globalM.multiplier;

        throw new AppError('NOT_FOUND', `No payout multiplier configured for ${betType}`);
    }

    // ==========================================
    // GAME STATUS (for users)
    // ==========================================

    /** Get game status with current window info */
    static async getGameStatus(gameId: number) {
        const game = await prisma.game.findUnique({ where: { id: gameId } });
        if (!game || game.is_deleted || !game.is_active) {
            throw new AppError('NOT_FOUND', 'Game not found or inactive');
        }

        // Get today's date in IST
        const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

        // Check for open betting window
        const activeWindow = await prisma.bettingWindow.findFirst({
            where: {
                game_id: gameId,
                date: today,
                is_open: true,
            },
        });

        // Get today's result if any
        const result = await prisma.result.findFirst({
            where: {
                game_id: gameId,
                date: today,
                is_deleted: false,
            },
        });

        return {
            ...game,
            window: activeWindow,
            has_result: !!result,
            result: result ? {
                open_panna: result.open_panna,
                open_single: result.open_single,
                close_panna: result.close_panna,
                close_single: result.close_single,
                jodi: result.jodi,
            } : null,
        };
    }

    // ==========================================
    // HOLIDAY MANAGEMENT
    // ==========================================

    /** Toggle holiday for a single game */
    static async setGameHoliday(gameId: number, isHoliday: boolean) {
        const game = await prisma.game.findUnique({ where: { id: gameId } });
        if (!game || game.is_deleted) {
            throw new AppError('NOT_FOUND', 'Game not found');
        }
        return prisma.game.update({
            where: { id: gameId },
            data: { is_holiday: isHoliday },
        });
    }

    /** Toggle holiday for ALL games */
    static async setHolidayAll(isHoliday: boolean) {
        const result = await prisma.game.updateMany({
            where: { is_deleted: false },
            data: { is_holiday: isHoliday },
        });
        return { updated: result.count };
    }
}
