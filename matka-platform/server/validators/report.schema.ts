// server/validators/report.schema.ts
// Zod schemas for report endpoints

import { z } from 'zod';

// Date range filter — used across all reports
export const reportFilterSchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    gameId: z.coerce.number().int().optional(),
    memberId: z.coerce.number().int().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
});

// Daily summary — requires a specific date
export const dailySummarySchema = z.object({
    date: z.string().min(10).max(10), // YYYY-MM-DD
});

// Types
export type ReportFilter = z.infer<typeof reportFilterSchema>;
export type DailySummaryInput = z.infer<typeof dailySummarySchema>;
