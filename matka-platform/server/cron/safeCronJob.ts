// server/cron/safeCronJob.ts
// Wraps cron callbacks so they NEVER crash the server
// Compatible with node-cron v4 TaskFn signature

/**
 * Wrap a cron job function so it:
 * 1. Logs start time
 * 2. Logs completion time + duration
 * 3. Catches ALL errors and logs them (never throws)
 *
 * Returns a function compatible with node-cron v4's TaskFn type.
 */
export function safeCronJob(name: string, fn: () => Promise<void>): () => void {
    return () => {
        const startTime = Date.now();
        console.log(`[CRON] [${name}] Started at ${new Date().toISOString()}`);

        fn()
            .then(() => {
                const duration = Date.now() - startTime;
                console.log(`[CRON] [${name}] Completed in ${duration}ms`);
            })
            .catch((err) => {
                const duration = Date.now() - startTime;
                console.error(`[CRON] [${name}] FAILED after ${duration}ms:`, err);
                // NEVER re-throw — cron errors must not crash the server
            });
    };
}
