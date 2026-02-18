// server/routes/notification.routes.ts
// Notification routes — admin creates, all authenticated users read

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { NotificationService } from '../services/notification.service';
import { createNotificationSchema, updateNotificationSchema } from '../validators/notification.schema';
import { AppError } from '../utils/errors';
import { sendSuccess } from '../utils/response';

export async function notificationRoutes(app: FastifyInstance) {

    // GET /api/notifications — all authenticated users (read notifications for bell)
    app.get('/', async (_request: FastifyRequest, reply: FastifyReply) => {
        const notifications = await NotificationService.getNotifications(20);
        return sendSuccess(reply, { data: notifications });
    });
}

export async function adminNotificationRoutes(app: FastifyInstance) {

    // POST /api/admin/notifications — create notification
    app.post('/', async (request: FastifyRequest, reply: FastifyReply) => {
        const parsed = createNotificationSchema.safeParse(request.body);
        if (!parsed.success) {
            throw new AppError('VALIDATION_FAILED', parsed.error.issues[0]?.message || 'Invalid input');
        }
        const adminId = (request as any).user.id;
        const notification = await NotificationService.createNotification(
            parsed.data.title,
            parsed.data.message,
            adminId,
        );
        return reply.status(201).send({ success: true, data: notification });
    });

    // PUT /api/admin/notifications/:id — update notification
    app.put('/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
        const id = parseInt(request.params.id, 10);
        if (isNaN(id)) throw new AppError('INVALID_INPUT', 'Invalid notification ID');

        const parsed = updateNotificationSchema.safeParse(request.body);
        if (!parsed.success) {
            throw new AppError('VALIDATION_FAILED', parsed.error.issues[0]?.message || 'Invalid input');
        }
        const updated = await NotificationService.updateNotification(id, parsed.data.title, parsed.data.message);
        return sendSuccess(reply, { data: updated, message: 'Notification updated' });
    });

    // DELETE /api/admin/notifications/:id — soft-delete notification
    app.delete('/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
        const id = parseInt(request.params.id, 10);
        if (isNaN(id)) throw new AppError('INVALID_INPUT', 'Invalid notification ID');

        const result = await NotificationService.deleteNotification(id);
        return sendSuccess(reply, { message: result.message });
    });
}
