// server/services/result.service.ts
// Result Declaration Service — Enter panna, auto-calculate, trigger settlement

import { prisma } from '../lib/prisma';
import { AppError } from '../utils/errors';
import { calculateSingle, calculateJodi, isValidPanna } from '../utils/calculation';
import { SettlementService } from './settlement.service';
import type { DeclareResultInput } from '../validators/result.schema';

export class ResultService {

    /**
     * Declare a result — Enter panna, auto-calculate single + jodi, trigger settlement
     */
    static async declareResult(data: DeclareResultInput, declaredBy: number) {
        const { game_id, session, panna } = data;

        // Validate panna format
        if (!isValidPanna(panna)) {
            throw new AppError('VALIDATION_ERROR', 'Invalid panna format');
        }

        // Get today's date in IST
        const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

        // Check game exists
        const game = await prisma.game.findUnique({ where: { id: game_id } });
        if (!game || game.is_deleted || !game.is_active) {
            throw new AppError('NOT_FOUND', 'Game not found or inactive');
        }

        // Check for duplicate result (same game/date/session)
        const existing = await prisma.result.findFirst({
            where: { game_id, date: today, session: session as 'OPEN' | 'CLOSE', is_deleted: false },
        });
        if (existing) {
            throw new AppError('DUPLICATE_ENTRY', `Result already declared for ${game.name} - ${session} today`);
        }

        // Auto-calculate single from panna
        const single = calculateSingle(panna);

        // Build result data
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const resultData: Record<string, any> = {
            game_id,
            date: today,
            session: session as 'OPEN' | 'CLOSE',
            declared_by: declaredBy,
        };

        if (session === 'OPEN') {
            resultData.open_panna = panna;
            resultData.open_single = single;
        } else {
            resultData.close_panna = panna;
            resultData.close_single = single;

            // For CLOSE session, fetch the OPEN result to calculate Jodi
            const openResult = await prisma.result.findFirst({
                where: { game_id, date: today, session: 'OPEN', is_deleted: false },
            });

            if (openResult && openResult.open_single !== null) {
                const jodi = calculateJodi(openResult.open_single, single);
                resultData.jodi = jodi;

                // Also update the open result with close data
                resultData.open_panna = openResult.open_panna;
                resultData.open_single = openResult.open_single;
            }
        }

        // Save result
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = await prisma.result.create({ data: resultData as any });

        // Close betting window
        await prisma.bettingWindow.updateMany({
            where: {
                game_id,
                date: today,
                session: session as 'OPEN' | 'CLOSE',
                is_open: true,
            },
            data: { is_open: false },
        });

        // Trigger settlement
        const settlement = await SettlementService.settleGame(
            result.id,
            game_id,
            today,
            session,
            {
                open_panna: resultData.open_panna || null,
                open_single: resultData.open_single ?? null,
                close_panna: resultData.close_panna || null,
                close_single: resultData.close_single ?? null,
                jodi: resultData.jodi || null,
            },
            declaredBy
        );

        return {
            result,
            settlement: {
                id: settlement.id,
                total_bets: settlement.total_bets,
                winners_count: settlement.winners_count,
                losers_count: settlement.losers_count,
                total_payout: settlement.total_payout,
                net_pnl: settlement.net_pnl,
            },
        };
    }

    /**
     * Preview result calculation without saving
     */
    static async previewResult(data: DeclareResultInput) {
        const { game_id, session, panna } = data;

        if (!isValidPanna(panna)) {
            throw new AppError('VALIDATION_ERROR', 'Invalid panna format');
        }

        const single = calculateSingle(panna);
        const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

        let jodi: string | null = null;
        if (session === 'CLOSE') {
            const openResult = await prisma.result.findFirst({
                where: { game_id, date: today, session: 'OPEN', is_deleted: false },
            });
            if (openResult && openResult.open_single !== null) {
                jodi = calculateJodi(openResult.open_single, single);
            }
        }

        // Count pending bets that would be affected
        const pendingBets = await prisma.bet.count({
            where: {
                game_id,
                date: today,
                session: session as 'OPEN' | 'CLOSE',
                status: 'pending',
            },
        });

        return {
            panna,
            single,
            jodi,
            pending_bets_count: pendingBets,
            session,
            game_id,
        };
    }

    /**
     * Get today's results for all games (with declared/undeclared status)
     */
    static async getTodayMatches() {
        const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

        const games = await prisma.game.findMany({
            where: { is_active: true, is_deleted: false },
            orderBy: { display_order: 'asc' },
        });

        const results = await prisma.result.findMany({
            where: { date: today, is_deleted: false },
        });

        const matches = games.map(game => {
            const openResult = results.find(r => r.game_id === game.id && r.session === 'OPEN');
            const closeResult = results.find(r => r.game_id === game.id && r.session === 'CLOSE');

            return {
                game_id: game.id,
                game_name: game.name,
                slug: game.slug,
                color_code: game.color_code,
                open_time: game.open_time,
                close_time: game.close_time,
                open: openResult ? {
                    panna: openResult.open_panna,
                    single: openResult.open_single,
                    is_settled: openResult.is_settled,
                } : null,
                close: closeResult ? {
                    panna: closeResult.close_panna,
                    single: closeResult.close_single,
                    jodi: closeResult.jodi,
                    is_settled: closeResult.is_settled,
                } : null,
            };
        });

        return matches;
    }

    /**
     * Get result by ID (admin detail view)
     */
    static async getResultById(resultId: number) {
        const result = await prisma.result.findUnique({
            where: { id: resultId },
            include: {
                game: { select: { name: true, slug: true } },
                settlement: {
                    include: {
                        entries: {
                            select: {
                                bet_id: true,
                                user_id: true,
                                outcome: true,
                                bet_amount: true,
                                win_amount: true,
                            },
                        },
                    },
                },
            },
        });

        if (!result || result.is_deleted) {
            throw new AppError('NOT_FOUND', 'Result not found');
        }

        return result;
    }

    /**
     * Get results for a specific game (user view)
     */
    static async getGameResults(gameId: number, date?: string) {
        const queryDate = date || new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

        const results = await prisma.result.findMany({
            where: {
                game_id: gameId,
                date: queryDate,
                is_deleted: false,
            },
            orderBy: { declared_at: 'asc' },
            select: {
                id: true,
                session: true,
                open_panna: true,
                open_single: true,
                close_panna: true,
                close_single: true,
                jodi: true,
                is_settled: true,
                declared_at: true,
            },
        });

        return results;
    }
}
