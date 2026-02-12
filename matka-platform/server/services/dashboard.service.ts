// server/services/dashboard.service.ts
// Admin dashboard data — stats, P&L chart, live bets, upcoming results

import { prisma } from '../lib/prisma';

export class DashboardService {

    /**
     * Get today's dashboard stat cards with trends vs yesterday.
     */
    static async getStats() {
        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

        // Today's stats
        const [todayBets, yesterdayBets, activeUsers] = await Promise.all([
            prisma.bet.aggregate({
                where: { date: today },
                _count: true,
                _sum: { bet_amount: true },
            }),
            prisma.bet.aggregate({
                where: { date: yesterday },
                _count: true,
                _sum: { bet_amount: true },
            }),
            prisma.user.count({
                where: { role: 'user', is_blocked: false, is_deleted: false },
            }),
        ]);

        // Today's net P&L from settlements
        const todayPnl = await prisma.settlement.aggregate({
            where: { date: today },
            _sum: { net_pnl: true },
        });

        const yesterdayPnl = await prisma.settlement.aggregate({
            where: { date: yesterday },
            _sum: { net_pnl: true },
        });

        const totalBetsToday = todayBets._count;
        const totalVolumeToday = todayBets._sum.bet_amount || 0;
        const netPnlToday = todayPnl._sum.net_pnl || 0;

        const totalBetsYesterday = yesterdayBets._count;
        const totalVolumeYesterday = yesterdayBets._sum.bet_amount || 0;
        const netPnlYesterday = yesterdayPnl._sum.net_pnl || 0;

        // Calculate trend percentages (avoid division by zero)
        const calcTrend = (today: number, yesterday: number): number => {
            if (yesterday === 0) return today > 0 ? 100 : 0;
            return Math.round(((today - yesterday) / yesterday) * 100);
        };

        return {
            totalBetsToday,
            totalVolumeToday,
            netPnlToday,
            activeUsers,
            totalBetsTrend: calcTrend(totalBetsToday, totalBetsYesterday),
            volumeTrend: calcTrend(totalVolumeToday, totalVolumeYesterday),
            pnlTrend: calcTrend(netPnlToday, netPnlYesterday),
            usersTrend: 0, // Users don't have daily trend
        };
    }

    /**
     * Get last 7 days P&L data for chart.
     */
    static async getPnlChart() {
        const dates: string[] = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date(Date.now() - i * 86400000);
            dates.push(d.toISOString().split('T')[0]);
        }

        const pnlRecords = await prisma.settlement.groupBy({
            by: ['date'],
            where: { date: { in: dates } },
            _sum: { net_pnl: true },
        });

        const pnlMap = new Map(pnlRecords.map(r => [r.date, r._sum.net_pnl || 0]));

        return dates.map(date => {
            const d = new Date(date);
            const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
            return {
                date: dayName,
                pnl: pnlMap.get(date) || 0,
            };
        });
    }

    /**
     * Get recent 20 bets for live feed.
     */
    static async getLiveBets() {
        const bets = await prisma.bet.findMany({
            take: 20,
            orderBy: { created_at: 'desc' },
            include: {
                user: { select: { user_id: true } },
                game: { select: { name: true } },
            },
        });

        return bets.map(b => ({
            bet_id: b.bet_id,
            user_id: b.user.user_id,
            game_name: b.game.name,
            bet_type: b.bet_type,
            bet_amount: b.bet_amount,
            status: b.status,
            created_at: b.created_at.toISOString(),
        }));
    }

    /**
     * Get today's games with upcoming (undeclared) results.
     */
    static async getUpcoming() {
        const today = new Date().toISOString().split('T')[0];

        const games = await prisma.game.findMany({
            where: { is_active: true, is_deleted: false },
            orderBy: { display_order: 'asc' },
        });

        // Get results already declared today
        const declaredResults = await prisma.result.findMany({
            where: { date: today, is_deleted: false },
            select: { game_id: true, session: true },
        });

        const declaredSet = new Set(declaredResults.map(r => `${r.game_id}-${r.session}`));

        const upcoming: { game_id: number; game_name: string; session: string; close_time: string; status: string }[] = [];

        for (const game of games) {
            // Check OPEN session
            if (!declaredSet.has(`${game.id}-OPEN`)) {
                upcoming.push({
                    game_id: game.id,
                    game_name: game.name,
                    session: 'OPEN',
                    close_time: game.open_time,
                    status: 'pending',
                });
            }

            // Check CLOSE session
            if (!declaredSet.has(`${game.id}-CLOSE`)) {
                upcoming.push({
                    game_id: game.id,
                    game_name: game.name,
                    session: 'CLOSE',
                    close_time: game.close_time,
                    status: 'pending',
                });
            }
        }

        return upcoming;
    }
}
