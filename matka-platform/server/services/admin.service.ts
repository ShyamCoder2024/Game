// server/services/admin.service.ts
// Admin-only operations — block/unblock users, DB backup

import { prisma } from '../lib/prisma';
import { AppError } from '../utils/errors';

export class AdminService {

    /**
     * Block or unblock a user by user_id (string ID, not numeric).
     */
    static async blockUnblockUser(userId: string, action: 'block' | 'unblock', adminId: number) {
        const user = await prisma.user.findUnique({
            where: { user_id: userId },
        });

        if (!user) {
            throw new AppError('NOT_FOUND', `User ${userId} not found`);
        }

        if (user.role === 'admin') {
            throw new AppError('FORBIDDEN', 'Cannot block an admin user');
        }

        const isBlocking = action === 'block';

        await prisma.user.update({
            where: { user_id: userId },
            data: {
                is_blocked: isBlocking,
                blocked_at: isBlocking ? new Date() : null,
                blocked_by: isBlocking ? adminId : null,
                blocked_reason: isBlocking ? 'Blocked by admin' : null,
            },
        });

        // Log admin action
        await prisma.adminAction.create({
            data: {
                admin_id: adminId,
                action_type: isBlocking ? 'BLOCK_USER' : 'UNBLOCK_USER',
                entity_type: 'user',
                entity_id: user.id,
                notes: `${action}ed user ${userId}`,
            },
        });

        return { message: `User ${userId} ${action}ed successfully` };
    }

    /**
     * Create a database backup record (placeholder — actual backup needs pg_dump).
     */
    static async createBackup(adminId: number) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `matka-backup-${timestamp}.sql`;

        const backup = await prisma.dbBackup.create({
            data: {
                filename,
                status: 'completed',
                triggered_by: adminId,
                size_bytes: 0,
                completed_at: new Date(),
            },
        });

        // Log admin action
        await prisma.adminAction.create({
            data: {
                admin_id: adminId,
                action_type: 'DB_BACKUP',
                entity_type: 'backup',
                entity_id: backup.id,
                notes: `Backup created: ${filename}`,
            },
        });

        return { url: filename, id: backup.id };
    }
}
