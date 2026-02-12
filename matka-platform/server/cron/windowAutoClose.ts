// server/cron/windowAutoClose.ts
// Runs every minute — auto-close expired betting windows

import { prisma } from '../lib/prisma';
import { emitToAll } from '../socket/emitters';
import { WS_EVENTS } from '../socket/events';

export class WindowAutoCloseService {

    /**
     * Close any betting windows whose closes_at time has passed.
     * Runs every minute.
     */
    static async execute(): Promise<void> {
        const now = new Date();

        // Find all open windows that have expired
        const expiredWindows = await prisma.bettingWindow.findMany({
            where: {
                is_open: true,
                closes_at: { lte: now },
            },
            select: {
                id: true,
                game_id: true,
                session: true,
                date: true,
                game: { select: { name: true } },
            },
        });

        if (expiredWindows.length === 0) return;

        // Close all expired windows in one query
        const windowIds = expiredWindows.map(bw => bw.id);
        await prisma.bettingWindow.updateMany({
            where: { id: { in: windowIds } },
            data: { is_open: false },
        });

        // Broadcast window status changes
        for (const bw of expiredWindows) {
            try {
                emitToAll(WS_EVENTS.WINDOW_STATUS, {
                    game_id: bw.game_id,
                    game_name: bw.game.name,
                    session: bw.session,
                    is_open: false,
                    date: bw.date,
                });
            } catch (err) {
                console.error(`[CRON] [WindowAutoClose] Failed to emit for game ${bw.game_id}`, err);
            }
        }

        console.log(`[CRON] [WindowAutoClose] Auto-closed ${expiredWindows.length} betting windows`);
    }
}
