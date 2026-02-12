// server/validators/admin.schema.ts
// Zod schemas for admin routes

import { z } from 'zod';

// Announcement creation
export const createAnnouncementSchema = z.object({
    title: z.string().min(1).max(200),
    message: z.string().min(1).max(2000),
});

// Rules update
export const updateRulesSchema = z.object({
    content: z.string().min(0).max(50000),
});

// Block/unblock user params
export const blockUnblockParamsSchema = z.object({
    userId: z.string().min(1),
    action: z.enum(['block', 'unblock']),
});

// Types
export type CreateAnnouncementInput = z.infer<typeof createAnnouncementSchema>;
export type UpdateRulesInput = z.infer<typeof updateRulesSchema>;
export type BlockUnblockParams = z.infer<typeof blockUnblockParamsSchema>;
