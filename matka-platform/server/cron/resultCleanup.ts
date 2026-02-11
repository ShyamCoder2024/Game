// server/cron/resultCleanup.ts
// Runs daily — permanently delete results older than 2 days

import { prisma } from '../lib/prisma';

export class ResultCleanupService {

    /**
     * Permanently delete results that are:
     * 1. Soft-deleted (is_deleted = true), OR
     * 2. Older than 2 days
     *
     * This is a PERMANENT delete (not soft delete).
     * Settled results older than 2 days are also cleaned up.
     */
    static async execute(): Promise<void> {
        const twoDaysAgo = new Date();
        twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
        const cutoffDate = twoDaysAgo.toISOString().split('T')[0];

        console.log(`[CRON] [ResultCleanup] Cleaning results older than ${cutoffDate}`);

        // Delete settlement entries for old results first (foreign key constraint)
        const oldResults = await prisma.result.findMany({
            where: {
                date: { lt: cutoffDate },
            },
            select: { id: true },
        });

        if (oldResults.length === 0) {
            console.log('[CRON] [ResultCleanup] No old results to clean up');
            return;
        }

        const resultIds = oldResults.map(r => r.id);

        // Get settlement IDs from old results
        const oldSettlements = await prisma.settlement.findMany({
            where: { result_id: { in: resultIds } },
            select: { id: true },
        });
        const settlementIds = oldSettlements.map(s => s.id);

        // Delete in correct order to respect foreign key constraints
        if (settlementIds.length > 0) {
            const deletedEntries = await prisma.settlementEntry.deleteMany({
                where: { settlement_id: { in: settlementIds } },
            });
            console.log(`[CRON] [ResultCleanup] Deleted ${deletedEntries.count} settlement entries`);
        }

        // Unlink bets from results and settlements
        await prisma.bet.updateMany({
            where: { result_id: { in: resultIds } },
            data: { result_id: null, settlement_id: null },
        });

        // Delete settlements
        if (settlementIds.length > 0) {
            const deletedSettlements = await prisma.settlement.deleteMany({
                where: { id: { in: settlementIds } },
            });
            console.log(`[CRON] [ResultCleanup] Deleted ${deletedSettlements.count} settlements`);
        }

        // Delete old results permanently
        const deletedResults = await prisma.result.deleteMany({
            where: { id: { in: resultIds } },
        });

        console.log(`[CRON] [ResultCleanup] Permanently deleted ${deletedResults.count} results older than ${cutoffDate}`);
    }
}
