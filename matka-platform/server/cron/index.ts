// server/cron/index.ts
// Register all cron jobs — called once after server starts

import * as cron from 'node-cron';
import { safeCronJob } from './safeCronJob';
import { DailyResetService } from './dailyReset';
import { WindowAutoCloseService } from './windowAutoClose';
import { ResultCleanupService } from './resultCleanup';

/**
 * Setup all scheduled cron jobs.
 * Timezone: Asia/Kolkata (IST) — node-cron handles conversion.
 */
export function setupCron(): void {
    console.log('[CRON] Registering cron jobs...');

    // ==========================================
    // Daily reset at 2:00 AM IST
    // Creates new betting windows, closes yesterday's windows
    // ==========================================
    cron.schedule(
        '0 2 * * *',
        safeCronJob('DailyReset', () => DailyResetService.execute()),
        { timezone: 'Asia/Kolkata' }
    );

    // ==========================================
    // Result cleanup at 3:00 AM IST
    // Permanently deletes results older than 2 days
    // ==========================================
    cron.schedule(
        '0 3 * * *',
        safeCronJob('ResultCleanup', () => ResultCleanupService.execute()),
        { timezone: 'Asia/Kolkata' }
    );

    // ==========================================
    // Auto-close expired betting windows (every minute)
    // ==========================================
    cron.schedule(
        '* * * * *',
        safeCronJob('WindowAutoClose', () => WindowAutoCloseService.execute()),
        { timezone: 'Asia/Kolkata' }
    );

    console.log('[CRON] Cron jobs registered:');
    console.log('[CRON]   - Daily reset: 2:00 AM IST');
    console.log('[CRON]   - Result cleanup: 3:00 AM IST');
    console.log('[CRON]   - Window auto-close: every minute');
}
