// server/services/report.service.ts
// All report generation functions — P&L, Collection, Bets, Exposure, Cashbook, Deals, Daily Summary
// Every function is hierarchy-scoped: admin sees all, leaders see only their downline

import { prisma } from '../lib/prisma';
import type { ReportFilter, DailySummaryInput } from '../validators/report.schema';

// ==========================================
// TYPES
// ==========================================

type HierarchyScope = number[] | null; // null = admin (sees everything)

interface PaginationResult {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

function buildPagination(page: number, limit: number, total: number): PaginationResult {
    return {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
    };
}

// ==========================================
// SERVICE
// ==========================================

export class ReportService {

    /**
     * P&L Report — Member-wise profit/loss
     */
    static async getPnlReport(filters: ReportFilter, scope: HierarchyScope) {
        const { page, limit, gameId, memberId, startDate, endDate } = filters;
        const skip = (page - 1) * limit;

        const where: Record<string, unknown> = {};
        if (scope) where.user_id = { in: scope };
        if (gameId) where.game_id = gameId;
        if (memberId) where.user_id = memberId;
        if (startDate || endDate) {
            where.date = {};
            if (startDate) (where.date as Record<string, string>).gte = startDate;
            if (endDate) (where.date as Record<string, string>).lte = endDate;
        }

        const [records, total, aggregates] = await Promise.all([
            prisma.memberPnl.findMany({
                where,
                include: {
                    user: { select: { id: true, user_id: true, name: true, role: true } },
                    game: { select: { id: true, name: true } },
                },
                orderBy: { date: 'desc' },
                skip,
                take: limit,
            }),
            prisma.memberPnl.count({ where }),
            prisma.memberPnl.aggregate({
                where,
                _sum: {
                    pnl: true,
                    total_bets_volume: true,
                    total_bets_count: true,
                    total_payout: true,
                    commission_earned: true,
                },
            }),
        ]);

        const data = records.map(r => ({
            id: r.id,
            user_id: r.user.user_id,
            name: r.user.name,
            role: r.user.role,
            game: r.game.name,
            date: r.date,
            pnl: r.pnl,
            total_bets_volume: r.total_bets_volume,
            total_bets_count: r.total_bets_count,
            total_payout: r.total_payout,
            commission_earned: r.commission_earned,
        }));

        return {
            data,
            pagination: buildPagination(page, limit, total),
            grandTotal: {
                pnl: aggregates._sum.pnl || 0,
                total_bets_volume: aggregates._sum.total_bets_volume || 0,
                total_bets_count: aggregates._sum.total_bets_count || 0,
                total_payout: aggregates._sum.total_payout || 0,
                commission_earned: aggregates._sum.commission_earned || 0,
            },
        };
    }

    /**
     * Collection Report — P&L categorized as LENA_HAI / DENA_HAI / LE_LIYA
     */
    static async getCollectionReport(filters: ReportFilter, scope: HierarchyScope) {
        const { page, limit, startDate, endDate } = filters;
        const skip = (page - 1) * limit;

        // Build where clause for member_pnl grouped by user
        const where: Record<string, unknown> = {};
        if (scope) where.user_id = { in: scope };
        if (startDate || endDate) {
            where.date = {};
            if (startDate) (where.date as Record<string, string>).gte = startDate;
            if (endDate) (where.date as Record<string, string>).lte = endDate;
        }

        // Get unique users with their net P&L
        const userPnls = await prisma.memberPnl.groupBy({
            by: ['user_id'],
            where,
            _sum: { pnl: true },
        });

        const total = userPnls.length;

        // Paginate
        const paginated = userPnls
            .sort((a, b) => Math.abs(b._sum.pnl || 0) - Math.abs(a._sum.pnl || 0))
            .slice(skip, skip + limit);

        // Get user details
        const userIds = paginated.map(p => p.user_id);
        const users = await prisma.user.findMany({
            where: { id: { in: userIds } },
            select: { id: true, user_id: true, name: true, role: true },
        });
        const userMap = new Map(users.map(u => [u.id, u]));

        let totalLena = 0;
        let totalDena = 0;

        const data = paginated.map(p => {
            const user = userMap.get(p.user_id);
            const pnl = p._sum.pnl || 0;
            let status: string;

            if (pnl > 0) {
                status = 'LENA_HAI';
                totalLena += pnl;
            } else if (pnl < 0) {
                status = 'DENA_HAI';
                totalDena += Math.abs(pnl);
            } else {
                status = 'LE_LIYA';
            }

            return {
                user_id: user?.user_id || '',
                name: user?.name || '',
                role: user?.role || '',
                pnl,
                status,
            };
        });

        return {
            data,
            pagination: buildPagination(page, limit, total),
            grandTotal: {
                total_lena: totalLena,
                total_dena: totalDena,
                net: totalLena - totalDena,
            },
        };
    }

    /**
     * Bet Report — All bets with filters
     */
    static async getBetReport(filters: ReportFilter, scope: HierarchyScope) {
        const { page, limit, gameId, memberId, startDate, endDate } = filters;
        const skip = (page - 1) * limit;

        const where: Record<string, unknown> = {};
        if (scope) where.user_id = { in: scope };
        if (gameId) where.game_id = gameId;
        if (memberId) where.user_id = memberId;
        if (startDate || endDate) {
            where.date = {};
            if (startDate) (where.date as Record<string, string>).gte = startDate;
            if (endDate) (where.date as Record<string, string>).lte = endDate;
        }

        const [bets, total, aggregates] = await Promise.all([
            prisma.bet.findMany({
                where,
                include: {
                    user: { select: { user_id: true, name: true } },
                    game: { select: { name: true } },
                },
                orderBy: { created_at: 'desc' },
                skip,
                take: limit,
            }),
            prisma.bet.count({ where }),
            prisma.bet.aggregate({
                where,
                _sum: { bet_amount: true, win_amount: true },
            }),
        ]);

        const data = bets.map(b => ({
            bet_id: b.bet_id,
            user_id: b.user.user_id,
            name: b.user.name,
            game: b.game.name,
            date: b.date,
            session: b.session,
            bet_type: b.bet_type,
            bet_number: b.bet_number,
            bet_amount: b.bet_amount,
            potential_win: b.potential_win,
            win_amount: b.win_amount,
            status: b.status,
            created_at: b.created_at.toISOString(),
        }));

        const totalBetAmount = aggregates._sum.bet_amount || 0;
        const totalWinAmount = aggregates._sum.win_amount || 0;

        return {
            data,
            pagination: buildPagination(page, limit, total),
            grandTotal: {
                total_bet_amount: totalBetAmount,
                total_win_amount: totalWinAmount,
                net: totalBetAmount - totalWinAmount,
            },
        };
    }

    /**
     * Exposure Report — Pending bets grouped by game
     */
    static async getExposureReport(scope: HierarchyScope) {
        const where: Record<string, unknown> = { status: 'pending' };
        if (scope) where.user_id = { in: scope };

        const bets = await prisma.bet.findMany({
            where,
            include: {
                game: { select: { id: true, name: true } },
            },
        });

        // Group by game
        const gameMap = new Map<number, { game_name: string; total_bets: number; total_amount: number; max_payout: number }>();

        for (const bet of bets) {
            const existing = gameMap.get(bet.game_id);
            if (existing) {
                existing.total_bets += 1;
                existing.total_amount += bet.bet_amount;
                existing.max_payout += bet.potential_win;
            } else {
                gameMap.set(bet.game_id, {
                    game_name: bet.game.name,
                    total_bets: 1,
                    total_amount: bet.bet_amount,
                    max_payout: bet.potential_win,
                });
            }
        }

        const data = Array.from(gameMap.entries()).map(([game_id, info]) => ({
            game_id,
            ...info,
        }));

        let totalPendingBets = 0;
        let totalPotentialPayout = 0;
        for (const item of data) {
            totalPendingBets += item.total_bets;
            totalPotentialPayout += item.max_payout;
        }

        return {
            data,
            grandTotal: {
                total_pending_bets: totalPendingBets,
                total_potential_payout: totalPotentialPayout,
            },
        };
    }

    /**
     * Cashbook Report — Transaction log with running balance
     */
    static async getCashbookReport(filters: ReportFilter, scope: HierarchyScope) {
        const { page, limit, memberId, startDate, endDate } = filters;
        const skip = (page - 1) * limit;

        const where: Record<string, unknown> = {};
        if (scope && memberId) {
            // Leader viewing a specific member — must be in their scope
            if (!scope.includes(memberId)) {
                return { data: [], pagination: buildPagination(page, limit, 0), grandTotal: { total_credits: 0, total_debits: 0, net: 0 } };
            }
            where.user_id = memberId;
        } else if (scope) {
            where.user_id = { in: scope };
        } else if (memberId) {
            where.user_id = memberId;
        }

        if (startDate || endDate) {
            where.created_at = {};
            if (startDate) (where.created_at as Record<string, unknown>).gte = new Date(startDate);
            if (endDate) (where.created_at as Record<string, unknown>).lte = new Date(endDate + 'T23:59:59.999Z');
        }

        const [transactions, total, creditAgg, debitAgg] = await Promise.all([
            prisma.transaction.findMany({
                where,
                include: {
                    user: { select: { user_id: true, name: true } },
                },
                orderBy: { created_at: 'desc' },
                skip,
                take: limit,
            }),
            prisma.transaction.count({ where }),
            prisma.transaction.aggregate({
                where: { ...where, direction: 'CREDIT' },
                _sum: { amount: true },
            }),
            prisma.transaction.aggregate({
                where: { ...where, direction: 'DEBIT' },
                _sum: { amount: true },
            }),
        ]);

        const data = transactions.map(t => ({
            txn_id: t.txn_id,
            user_id: t.user.user_id,
            name: t.user.name,
            type: t.type,
            direction: t.direction,
            amount: t.amount,
            balance_before: t.balance_before,
            balance_after: t.balance_after,
            reference: t.reference,
            notes: t.notes,
            created_at: t.created_at.toISOString(),
        }));

        const totalCredits = creditAgg._sum.amount || 0;
        const totalDebits = debitAgg._sum.amount || 0;

        return {
            data,
            pagination: buildPagination(page, limit, total),
            grandTotal: {
                total_credits: totalCredits,
                total_debits: totalDebits,
                net: totalCredits - totalDebits,
            },
        };
    }

    /**
     * Deal Report — Hierarchy tree with deal/commission percentages
     */
    static async getDealReport(scope: HierarchyScope) {
        const where: Record<string, unknown> = {
            is_deleted: false,
            role: { in: ['supermaster', 'master', 'user'] },
        };
        if (scope) where.id = { in: scope };

        const members = await prisma.user.findMany({
            where,
            select: {
                id: true,
                user_id: true,
                name: true,
                role: true,
                deal_percentage: true,
                created_by: true,
            },
            orderBy: [{ role: 'asc' }, { name: 'asc' }],
        });

        // Build parent name lookup
        const parentIds = members.map(m => m.created_by).filter((id): id is number => id !== null);
        const parents = await prisma.user.findMany({
            where: { id: { in: parentIds } },
            select: { id: true, user_id: true, name: true, deal_percentage: true },
        });
        const parentMap = new Map(parents.map(p => [p.id, p]));

        const data = members.map(m => {
            const parent = m.created_by ? parentMap.get(m.created_by) : null;
            const parentDeal = parent?.deal_percentage || 0;
            const commission = parentDeal - m.deal_percentage;

            return {
                user_id: m.user_id,
                name: m.name,
                role: m.role,
                parent_name: parent?.name || 'Admin',
                deal_percentage: m.deal_percentage,
                commission_percentage: commission > 0 ? commission : 0,
            };
        });

        return { data };
    }

    /**
     * Daily Summary — One day's complete overview
     */
    static async getDailySummary(input: DailySummaryInput, scope: HierarchyScope) {
        const { date } = input;

        const betWhere: Record<string, unknown> = { date };
        if (scope) betWhere.user_id = { in: scope };

        // Overall stats
        const [betAgg, winnerCount, settlementAgg] = await Promise.all([
            prisma.bet.aggregate({
                where: betWhere,
                _count: true,
                _sum: { bet_amount: true },
            }),
            prisma.bet.count({
                where: { ...betWhere, status: 'won' },
            }),
            prisma.settlement.aggregate({
                where: { date },
                _sum: { total_payout: true, net_pnl: true, total_bet_amount: true },
            }),
        ]);

        // Game-wise breakdown
        const gameBreakdown = await prisma.bet.groupBy({
            by: ['game_id'],
            where: betWhere,
            _count: true,
            _sum: { bet_amount: true, win_amount: true },
        });

        // Get game names
        const gameIds = gameBreakdown.map(g => g.game_id);
        const games = await prisma.game.findMany({
            where: { id: { in: gameIds } },
            select: { id: true, name: true },
        });
        const gameMap = new Map(games.map(g => [g.id, g.name]));

        const gameWise = gameBreakdown.map(g => ({
            game_id: g.game_id,
            game_name: gameMap.get(g.game_id) || 'Unknown',
            total_bets: g._count,
            total_amount: g._sum.bet_amount || 0,
            total_winnings: g._sum.win_amount || 0,
            net: (g._sum.bet_amount || 0) - (g._sum.win_amount || 0),
        }));

        return {
            date,
            total_bets: betAgg._count,
            total_amount_bet: betAgg._sum.bet_amount || 0,
            total_winners: winnerCount,
            total_payout: settlementAgg._sum.total_payout || 0,
            net_pnl: settlementAgg._sum.net_pnl || 0,
            game_wise: gameWise,
        };
    }
}
