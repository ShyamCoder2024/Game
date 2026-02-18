// server/validators/notification.schema.ts
// Zod schemas for notification endpoints

import { z } from 'zod';

export const createNotificationSchema = z.object({
    title: z.string().min(1, 'Title is required').max(100, 'Title too long'),
    message: z.string().min(1, 'Message is required').max(500, 'Message too long'),
});

export const updateNotificationSchema = z.object({
    title: z.string().min(1).max(100).optional(),
    message: z.string().min(1).max(500).optional(),
});

export type CreateNotificationInput = z.infer<typeof createNotificationSchema>;
export type UpdateNotificationInput = z.infer<typeof updateNotificationSchema>;
