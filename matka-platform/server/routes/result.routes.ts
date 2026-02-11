// server/routes/result.routes.ts
// Result routes — Admin declaration + Public viewing

import { FastifyInstance, FastifyRequest } from 'fastify';
import { ResultService } from '../services/result.service';
import { sendSuccess } from '../utils/response';
import { validateBody, validateParams, validateQuery } from '../middleware/validate.middleware';
import {
    declareResultSchema,
    previewResultSchema,
    resultListQuerySchema,
    resultIdParamSchema,
    resultGameIdParamSchema,
} from '../validators/result.schema';

// ==========================================
// ADMIN RESULT ROUTES — /api/admin/results
// ==========================================
export async function adminResultRoutes(app: FastifyInstance) {

    // POST /api/admin/results/declare — Declare result + trigger settlement
    app.post('/declare', {
        preHandler: [validateBody(declareResultSchema)],
        handler: async (request: FastifyRequest, reply) => {
            const data = request.body as Parameters<typeof ResultService.declareResult>[0];
            const result = await ResultService.declareResult(data, request.user!.id);
            return sendSuccess(reply, {
                data: result,
                message: 'Result declared and settlement triggered',
            }, 201);
        },
    });

    // POST /api/admin/results/preview — Preview calculation without saving
    app.post('/preview', {
        preHandler: [validateBody(previewResultSchema)],
        handler: async (request: FastifyRequest, reply) => {
            const data = request.body as Parameters<typeof ResultService.previewResult>[0];
            const preview = await ResultService.previewResult(data);
            return sendSuccess(reply, { data: preview });
        },
    });

    // GET /api/admin/results/matches — Today's matches overview
    app.get('/matches', {
        handler: async (_request: FastifyRequest, reply) => {
            const matches = await ResultService.getTodayMatches();
            return sendSuccess(reply, { data: matches });
        },
    });

    // GET /api/admin/results/:id — Result detail with settlement data
    app.get('/:id', {
        preHandler: [validateParams(resultIdParamSchema)],
        handler: async (request: FastifyRequest, reply) => {
            const { id } = request.params as { id: number };
            const result = await ResultService.getResultById(id);
            return sendSuccess(reply, { data: result });
        },
    });
}

// ==========================================
// PUBLIC RESULT ROUTES — /api/results (authenticated)
// ==========================================
export async function publicResultRoutes(app: FastifyInstance) {

    // GET /api/results/today — Today's results for all games
    app.get('/today', {
        handler: async (_request: FastifyRequest, reply) => {
            const matches = await ResultService.getTodayMatches();
            return sendSuccess(reply, { data: matches });
        },
    });

    // GET /api/results/game/:gameId — Results for a specific game
    app.get('/game/:gameId', {
        preHandler: [validateParams(resultGameIdParamSchema), validateQuery(resultListQuerySchema)],
        handler: async (request: FastifyRequest, reply) => {
            const { gameId } = request.params as { gameId: number };
            const query = request.query as { date?: string };
            const results = await ResultService.getGameResults(gameId, query.date);
            return sendSuccess(reply, { data: results });
        },
    });
}
