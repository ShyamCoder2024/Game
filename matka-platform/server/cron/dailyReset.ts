// server/cron/dailyReset.ts
// Runs at 2:00 AM IST — close yesterday's windows, create today's windows

import { prisma } from '../lib/prisma';
import { emitToAll } from '../socket/emitters';
import { WS_EVENTS } from '../socket/events';

export class DailyResetService {

    /**
     * Execute the daily reset:
     * 1. Close all open betting windows from yesterday
     * 2. Create new betting windows for today's active games
     * 3. Broadcast window status events
     */
    static async execute(): Promise<void> {
        const now = new Date();
        const today = now.toISOString().split('T')[0];

        console.log(`[CRON] [DailyReset] Starting for ${today}`);

        // 1. Close all open betting windows from yesterday or earlier
        const closed = await prisma.bettingWindow.updateMany({
            where: {
                is_open: true,
                date: { lt: today },
            },
            data: { is_open: false },
        });

        console.log(`[CRON] [DailyReset] Closed ${closed.count} expired betting windows`);

        // 2. Create new betting windows for today's active games
        const activeGames = await prisma.game.findMany({
            where: { is_active: true, is_deleted: false },
        });

        let windowsCreated = 0;
        for (const game of activeGames) {
            // Check if window already exists for today
            const existing = await prisma.bettingWindow.findFirst({
                where: { game_id: game.id, date: today },
            });

            if (!existing) {
                // Parse game open/close times and create datetime
                const opensAt = combineDateAndTime(today, game.open_time);
                const closesAt = combineDateAndTime(today, game.close_time);

                await prisma.bettingWindow.create({
                    data: {
                        game_id: game.id,
                        date: today,
                        session: 'FULL',
                        is_open: true,
                        opens_at: opensAt,
                        closes_at: closesAt,
                    },
                });
                windowsCreated++;

                // Broadcast window status for each new window
                try {
                    emitToAll(WS_EVENTS.WINDOW_STATUS, {
                        game_id: game.id,
                        game_name: game.name,
                        session: 'FULL',
                        is_open: true,
                        date: today,
                    });
                } catch (err) {
                    console.error(`[CRON] [DailyReset] Failed to emit window status for game ${game.id}`, err);
                }
            }
        }

        console.log(`[CRON] [DailyReset] Created ${windowsCreated} new betting windows for ${today}`);
    }
}

/**
 * Combine a date string (YYYY-MM-DD) with a time string (HH:MM) into a Date.
 * Assumes IST timezone (UTC+5:30).
 */
function combineDateAndTime(dateStr: string, timeStr: string): Date {
    // timeStr is like "09:00" or "15:30"
    const [hours, minutes] = timeStr.split(':').map(Number);
    // Create date in IST by using the +05:30 offset
    const isoStr = `${dateStr}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00+05:30`;
    return new Date(isoStr);
}
