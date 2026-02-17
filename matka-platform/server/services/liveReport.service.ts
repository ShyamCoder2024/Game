// server/services/liveReport.service.ts
// Live Bet Report Service — Aggregates pending bets by type + number for admin dashboard

import { prisma } from '../lib/prisma';
import { AppError } from '../utils/errors';
import type { BetType } from '@prisma/client';

type MarketKey = 'single_akda' | 'single_patti' | 'double_patti' | 'triple_patti' | 'jodi';

interface MarketData {
    position: number;
    numbers: Record<string, number>;
}

interface LiveReportResponse {
    gameId: number;
    gameName: string;
    session: string;
    totalBets: number;
    totalAmount: number;
    markets: Record<MarketKey, MarketData>;
}

// Map BetType enum to market keys
const BET_TYPE_TO_MARKET: Record<BetType, MarketKey> = {
    SINGLE_AKDA: 'single_akda',
    SINGLE_PATTI: 'single_patti',
    DOUBLE_PATTI: 'double_patti',
    TRIPLE_PATTI: 'triple_patti',
    JODI: 'jodi',
};

export class LiveReportService {

    /**
     * Get aggregated live bet report for a game + session
     * Groups all pending bets by bet_type + bet_number, sums amounts
     */
    static async getLiveReport(gameId: number, session: 'OPEN' | 'CLOSE'): Promise<LiveReportResponse> {
        // Validate game exists
        const game = await prisma.game.findUnique({ where: { id: gameId } });
        if (!game || game.is_deleted || !game.is_active) {
            throw new AppError('NOT_FOUND', 'Game not found or inactive');
        }

        // Get today's date in IST
        const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

        // Aggregate bets: GROUP BY bet_type, bet_number → SUM(bet_amount)
        const grouped = await prisma.bet.groupBy({
            by: ['bet_type', 'bet_number'],
            where: {
                game_id: gameId,
                date: today,
                session: session,
                status: 'pending',
            },
            _sum: {
                bet_amount: true,
            },
            _count: {
                id: true,
            },
        });

        // Initialize empty markets
        const markets: Record<MarketKey, MarketData> = {
            single_akda: { position: 0, numbers: {} },
            single_patti: { position: 0, numbers: {} },
            double_patti: { position: 0, numbers: {} },
            triple_patti: { position: 0, numbers: {} },
            jodi: { position: 0, numbers: {} },
        };

        let totalBets = 0;
        let totalAmount = 0;

        // Populate markets from grouped data
        for (const row of grouped) {
            const marketKey = BET_TYPE_TO_MARKET[row.bet_type];
            const amount = row._sum.bet_amount || 0;
            const count = row._count.id || 0;

            markets[marketKey].numbers[row.bet_number] = amount;
            markets[marketKey].position += amount;
            totalBets += count;
            totalAmount += amount;
        }

        return {
            gameId: game.id,
            gameName: game.name,
            session,
            totalBets,
            totalAmount,
            markets,
        };
    }
}
