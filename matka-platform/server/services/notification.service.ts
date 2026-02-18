// server/services/notification.service.ts
// Notification service — CRUD for admin-created notifications

import { prisma } from '../lib/prisma';
import { AppError } from '../utils/errors';

export class NotificationService {

    /** Create a new notification */
    static async createNotification(title: string, message: string, createdBy: number) {
        const notification = await prisma.notification.create({
            data: { title, message, created_by: createdBy },
            include: { creator: { select: { name: true, user_id: true } } },
        });
        return notification;
    }

    /** Get recent active notifications (for bell icon) */
    static async getNotifications(limit = 20) {
        const notifications = await prisma.notification.findMany({
            where: { is_active: true },
            orderBy: { created_at: 'desc' },
            take: limit,
            include: { creator: { select: { name: true } } },
        });
        return notifications;
    }

    /** Update an existing notification */
    static async updateNotification(id: number, title?: string, message?: string) {
        const existing = await prisma.notification.findUnique({ where: { id } });
        if (!existing || !existing.is_active) {
            throw new AppError('ACCOUNT_NOT_FOUND', 'Notification not found');
        }

        const updated = await prisma.notification.update({
            where: { id },
            data: {
                ...(title !== undefined && { title }),
                ...(message !== undefined && { message }),
            },
        });
        return updated;
    }

    /** Soft-delete a notification (set is_active = false) */
    static async deleteNotification(id: number) {
        const existing = await prisma.notification.findUnique({ where: { id } });
        if (!existing) {
            throw new AppError('ACCOUNT_NOT_FOUND', 'Notification not found');
        }

        await prisma.notification.update({
            where: { id },
            data: { is_active: false },
        });

        return { message: 'Notification deleted' };
    }
}
