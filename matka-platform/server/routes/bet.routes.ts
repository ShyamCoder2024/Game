// server/routes/bet.routes.ts
// Bet routes — /api/bets (authenticated users)

import { FastifyInstance, FastifyRequest } from 'fastify';
import { BetService } from '../services/bet.service';
import { sendSuccess } from '../utils/response';
import { validateBody, validateParams, validateQuery } from '../middleware/validate.middleware';
import {
    placeBetSchema,
    betListQuerySchema,
    betIdParamSchema,
} from '../validators/bet.schema';

export async function betRoutes(app: FastifyInstance) {

    // POST /api/bets/place — Place a new bet
    app.post('/place', {
        preHandler: [validateBody(placeBetSchema)],
        handler: async (request: FastifyRequest, reply) => {
            const user = request.user!;
            const data = request.body as Parameters<typeof BetService.placeBet>[2];
            const result = await BetService.placeBet(user.id, user.user_id, data);
            return sendSuccess(reply, {
                data: result,
                message: 'Bet placed successfully',
            }, 201);
        },
    });

    // GET /api/bets/my-bets — Get all user bets (paginated)
    app.get('/my-bets', {
        preHandler: [validateQuery(betListQuerySchema)],
        handler: async (request: FastifyRequest, reply) => {
            const query = request.query as Parameters<typeof BetService.getUserBets>[1];
            const result = await BetService.getUserBets(request.user!.id, query);
            return sendSuccess(reply, {
                data: result.bets,
                pagination: result.pagination,
            });
        },
    });

    // GET /api/bets/my-bets/today — Get today's bets with summary
    app.get('/my-bets/today', {
        handler: async (request: FastifyRequest, reply) => {
            const result = await BetService.getUserBetsToday(request.user!.id);
            return sendSuccess(reply, {
                data: result.bets,
                grandTotal: result.summary,
            });
        },
    });

    // GET /api/bets/:betId — Get single bet details
    app.get('/:betId', {
        preHandler: [validateParams(betIdParamSchema)],
        handler: async (request: FastifyRequest, reply) => {
            const { betId } = request.params as { betId: number };
            const bet = await BetService.getBetById(betId, request.user!.id);
            return sendSuccess(reply, { data: bet });
        },
    });
}
