// server/services/content.service.ts
// Content management — announcements CRUD, rules CRUD

import { prisma } from '../lib/prisma';
import { AppError } from '../utils/errors';

export class ContentService {

    // ==========================================
    // ANNOUNCEMENTS
    // ==========================================

    /**
     * Get all announcements, newest first.
     */
    static async getAnnouncements() {
        return prisma.announcement.findMany({
            orderBy: { created_at: 'desc' },
            select: {
                id: true,
                title: true,
                message: true,
                is_active: true,
                created_at: true,
            },
        });
    }

    /**
     * Get only active announcements (for user-facing marquee).
     */
    static async getActiveAnnouncements() {
        const now = new Date();
        return prisma.announcement.findMany({
            where: {
                is_active: true,
                OR: [
                    { starts_at: null, ends_at: null },
                    { starts_at: { lte: now }, ends_at: { gte: now } },
                    { starts_at: { lte: now }, ends_at: null },
                    { starts_at: null, ends_at: { gte: now } },
                ],
            },
            orderBy: { display_order: 'asc' },
            select: {
                id: true,
                title: true,
                message: true,
            },
        });
    }

    /**
     * Create a new announcement.
     */
    static async createAnnouncement(title: string, message: string, createdBy: number) {
        return prisma.announcement.create({
            data: {
                title,
                message,
                is_active: true,
                created_by: createdBy,
            },
        });
    }

    /**
     * Delete an announcement by ID.
     */
    static async deleteAnnouncement(id: number) {
        const announcement = await prisma.announcement.findUnique({ where: { id } });
        if (!announcement) {
            throw new AppError('NOT_FOUND', 'Announcement not found');
        }

        return prisma.announcement.delete({ where: { id } });
    }

    // ==========================================
    // RULES
    // ==========================================

    /**
     * Get the latest rules content.
     */
    static async getRules() {
        const rules = await prisma.rulesContent.findFirst({
            orderBy: { version: 'desc' },
        });

        return { content: rules?.content || '' };
    }

    /**
     * Update/create rules content (versioned).
     */
    static async updateRules(content: string, updatedBy: number) {
        // Get current version
        const current = await prisma.rulesContent.findFirst({
            orderBy: { version: 'desc' },
        });

        const nextVersion = (current?.version || 0) + 1;

        return prisma.rulesContent.create({
            data: {
                content,
                updated_by: updatedBy,
                version: nextVersion,
            },
        });
    }
}
