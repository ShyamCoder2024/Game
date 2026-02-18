// server/routes/admin.routes.ts
// Admin-only routes — dashboard, content management, settings
// All routes require admin role (enforced by parent scope in routes/index.ts)

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { DashboardService } from '../services/dashboard.service';
import { ContentService } from '../services/content.service';
import { AdminService } from '../services/admin.service';
import {
    createAnnouncementSchema,
    updateRulesSchema,
    blockUnblockParamsSchema,
} from '../validators/admin.schema';
import { AppError } from '../utils/errors';
import { prisma } from '../lib/prisma';

export async function adminRoutes(app: FastifyInstance) {

    // ==========================================
    // DASHBOARD ENDPOINTS
    // ==========================================

    app.get('/dashboard/stats', async (_request: FastifyRequest, reply: FastifyReply) => {
        const stats = await DashboardService.getStats();
        return reply.send({ success: true, data: stats });
    });

    app.get('/dashboard/pnl-chart', async (_request: FastifyRequest, reply: FastifyReply) => {
        const data = await DashboardService.getPnlChart();
        return reply.send({ success: true, data });
    });

    app.get('/dashboard/live-bets', async (_request: FastifyRequest, reply: FastifyReply) => {
        const data = await DashboardService.getLiveBets();
        return reply.send({ success: true, data });
    });

    app.get('/dashboard/upcoming', async (_request: FastifyRequest, reply: FastifyReply) => {
        const data = await DashboardService.getUpcoming();
        return reply.send({ success: true, data });
    });

    // ==========================================
    // ANNOUNCEMENTS
    // ==========================================

    app.get('/announcements', async (_request: FastifyRequest, reply: FastifyReply) => {
        const data = await ContentService.getAnnouncements();
        return reply.send({ success: true, data });
    });

    app.post('/announcements', async (request: FastifyRequest, reply: FastifyReply) => {
        const parsed = createAnnouncementSchema.safeParse(request.body);
        if (!parsed.success) {
            throw new AppError('VALIDATION_ERROR', parsed.error.issues[0]?.message || 'Invalid input');
        }

        const adminId = (request as any).user.id;
        const announcement = await ContentService.createAnnouncement(
            parsed.data.title,
            parsed.data.message,
            adminId,
        );

        return reply.status(201).send({ success: true, data: announcement });
    });

    app.delete('/announcements/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
        const id = parseInt(request.params.id, 10);
        if (isNaN(id)) {
            throw new AppError('VALIDATION_ERROR', 'Invalid announcement ID');
        }

        await ContentService.deleteAnnouncement(id);
        return reply.send({ success: true, message: 'Announcement deleted' });
    });

    // ==========================================
    // RULES
    // ==========================================

    app.get('/rules', async (_request: FastifyRequest, reply: FastifyReply) => {
        const data = await ContentService.getRules();
        return reply.send({ success: true, data });
    });

    app.put('/rules', async (request: FastifyRequest, reply: FastifyReply) => {
        const parsed = updateRulesSchema.safeParse(request.body);
        if (!parsed.success) {
            throw new AppError('VALIDATION_ERROR', parsed.error.issues[0]?.message || 'Invalid input');
        }

        const adminId = (request as any).user.id;
        await ContentService.updateRules(parsed.data.content, adminId);

        return reply.send({ success: true, message: 'Rules updated' });
    });

    // ==========================================
    // USER BLOCK / UNBLOCK
    // ==========================================

    app.put('/users/:userId/:action', async (request: FastifyRequest<{ Params: { userId: string; action: string } }>, reply: FastifyReply) => {
        const parsed = blockUnblockParamsSchema.safeParse(request.params);
        if (!parsed.success) {
            throw new AppError('VALIDATION_ERROR', 'Invalid action. Use block or unblock.');
        }

        const adminId = (request as any).user.id;
        const result = await AdminService.blockUnblockUser(
            parsed.data.userId,
            parsed.data.action,
            adminId,
        );

        return reply.send({ success: true, ...result });
    });

    // ==========================================
    // BET BLOCK / UNBLOCK (A7)
    // ==========================================

    app.put('/users/:userId/bet-block', async (request: FastifyRequest<{ Params: { userId: string } }>, reply: FastifyReply) => {
        const userId = parseInt(request.params.userId, 10);
        if (isNaN(userId)) throw new AppError('VALIDATION_ERROR', 'Invalid user ID');

        const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, is_blocked: true } });
        if (!user) throw new AppError('NOT_FOUND', 'User not found');

        const updated = await prisma.user.update({
            where: { id: userId },
            data: { is_blocked: !user.is_blocked },
            select: { id: true, is_blocked: true },
        });

        return reply.send({
            success: true,
            data: updated,
            message: updated.is_blocked ? 'Betting blocked for user' : 'Betting unblocked for user',
        });
    });

    // ==========================================
    // DATABASE BACKUP
    // ==========================================

    app.post('/backup', async (request: FastifyRequest, reply: FastifyReply) => {
        const adminId = (request as any).user.id;
        const result = await AdminService.createBackup(adminId);
        return reply.send({ success: true, data: result });
    });

    // ==========================================
    // APP SETTINGS (WhatsApp number, etc.)
    // ==========================================

    // GET /api/admin/settings/:key — Get a single setting value
    app.get('/settings/:key', async (request: FastifyRequest, reply: FastifyReply) => {
        const { key } = request.params as { key: string };
        const setting = await prisma.appSetting.findUnique({ where: { key } });
        if (!setting) return reply.status(404).send({ success: false, error: { message: 'Setting not found' } });
        return reply.send({ success: true, data: { key: setting.key, value: setting.value } });
    });

    // PUT /api/admin/settings/:key — Update a setting value
    app.put('/settings/:key', async (request: FastifyRequest, reply: FastifyReply) => {
        const { key } = request.params as { key: string };
        const { value } = request.body as { value: string };
        if (!value && value !== '') return reply.status(400).send({ success: false, error: { message: 'Value is required' } });
        // Disallow updating master_password via this route (security)
        if (key === 'master_password') return reply.status(403).send({ success: false, error: { message: 'Cannot update master_password via API' } });
        const setting = await prisma.appSetting.upsert({
            where: { key },
            update: { value },
            create: { key, value, category: 'general', description: key },
        });
        return reply.send({ success: true, data: { key: setting.key, value: setting.value } });
    });
}
