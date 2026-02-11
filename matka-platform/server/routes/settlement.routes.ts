// server/routes/settlement.routes.ts
// Settlement & Rollback routes — /api/admin/settlement (admin only)

import { FastifyInstance, FastifyRequest } from 'fastify';
import { RollbackService } from '../services/rollback.service';
import { sendSuccess } from '../utils/response';
import { validateParams } from '../middleware/validate.middleware';
import { resultIdParamSchema } from '../validators/result.schema';

export async function settlementRoutes(app: FastifyInstance) {

    // GET /api/admin/settlement/rollback-list — List settled results available for rollback
    app.get('/rollback-list', {
        handler: async (_request: FastifyRequest, reply) => {
            const results = await RollbackService.getRollbackList();
            return sendSuccess(reply, { data: results });
        },
    });

    // POST /api/admin/settlement/rollback/:id — Rollback a settlement
    app.post('/rollback/:id', {
        preHandler: [validateParams(resultIdParamSchema)],
        handler: async (request: FastifyRequest, reply) => {
            const { id } = request.params as { id: number };
            const result = await RollbackService.rollbackSettlement(id, request.user!.id);
            return sendSuccess(reply, {
                data: result,
                message: `Rollback complete: ${result.bets_reversed} bets reversed`,
            });
        },
    });
}
