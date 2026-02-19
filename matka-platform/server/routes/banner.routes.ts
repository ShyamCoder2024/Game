// server/routes/banner.routes.ts
// Banner management routes

import { FastifyInstance, FastifyRequest } from 'fastify';
import { prisma } from '../lib/prisma';
import { sendSuccess, sendError } from '../utils/response';
import { z } from 'zod';

const createBannerSchema = z.object({
    image_url: z.string().url('Must be a valid URL').min(1),
    title: z.string().max(200).optional(),
    display_order: z.number().int().min(0).default(0),
});

// =========================================
// PUBLIC: GET /api/banners — active banners
// =========================================
export async function publicBannerRoutes(app: FastifyInstance) {
    app.get('/', {
        handler: async (_req: FastifyRequest, reply) => {
            const banners = await prisma.banner.findMany({
                where: { is_active: true },
                orderBy: { display_order: 'asc' },
                select: { id: true, image_url: true, title: true, display_order: true },
            });
            return sendSuccess(reply, { data: banners });
        },
    });
}

// =========================================
// ADMIN: POST / DELETE /api/admin/banners
// =========================================
export async function adminBannerRoutes(app: FastifyInstance) {

    // GET /api/admin/banners — list all banners
    app.get('/', {
        handler: async (_req: FastifyRequest, reply) => {
            const banners = await prisma.banner.findMany({
                where: { is_active: true },
                orderBy: { display_order: 'asc' },
            });
            return sendSuccess(reply, { data: banners });
        },
    });

    // POST /api/admin/banners — create banner
    app.post('/', {
        handler: async (req: FastifyRequest, reply) => {
            const parsed = createBannerSchema.safeParse(req.body);
            if (!parsed.success) {
                return sendError(reply, 'VALIDATION_ERROR', 'Invalid banner data', 400);
            }
            const banner = await prisma.banner.create({
                data: {
                    image_url: parsed.data.image_url,
                    title: parsed.data.title,
                    display_order: parsed.data.display_order,
                    created_by: req.user!.id,
                },
            });
            return sendSuccess(reply, { data: banner, message: 'Banner created' }, 201);
        },
    });

    // DELETE /api/admin/banners/:id — soft-delete banner
    app.delete('/:id', {
        handler: async (req: FastifyRequest, reply) => {
            const { id } = req.params as { id: string };
            const bannerId = parseInt(id, 10);
            if (isNaN(bannerId)) return sendError(reply, 'INVALID_PARAM', 'Invalid banner ID', 400);
            await prisma.banner.update({
                where: { id: bannerId },
                data: { is_active: false },
            });
            return sendSuccess(reply, { message: 'Banner deleted' });
        },
    });
}
