// server/routes/game.routes.ts
// Game management routes (admin + public)

import { FastifyInstance, FastifyRequest } from 'fastify';
import { GameService } from '../services/game.service';
import { sendSuccess } from '../utils/response';
import { validateBody, validateParams } from '../middleware/validate.middleware';
import {
    createGameSchema,
    updateGameSchema,
    toggleGameSchema,
    setMultipliersSchema,
    gameIdParamSchema,
    gameIdSlugParamSchema,
} from '../validators/game.schema';

// ==========================================
// ADMIN GAME ROUTES — /api/admin/games
// ==========================================
export async function adminGameRoutes(app: FastifyInstance) {

    // POST /api/admin/games — Create game
    app.post('/', {
        preHandler: [validateBody(createGameSchema)],
        handler: async (request: FastifyRequest, reply) => {
            const game = await GameService.createGame(request.body as Record<string, unknown> as Parameters<typeof GameService.createGame>[0]);
            return sendSuccess(reply, { data: game, message: 'Game created successfully' }, 201);
        },
    });

    // PUT /api/admin/games/:id — Update game
    app.put('/:id', {
        preHandler: [validateParams(gameIdParamSchema), validateBody(updateGameSchema)],
        handler: async (request: FastifyRequest, reply) => {
            const { id } = request.params as { id: number };
            const game = await GameService.updateGame(id, request.body as Record<string, unknown> as Parameters<typeof GameService.updateGame>[1]);
            return sendSuccess(reply, { data: game, message: 'Game updated successfully' });
        },
    });

    // DELETE /api/admin/games/:id — Soft-delete game
    app.delete('/:id', {
        preHandler: [validateParams(gameIdParamSchema)],
        handler: async (request: FastifyRequest, reply) => {
            const { id } = request.params as { id: number };
            const result = await GameService.deleteGame(id);
            return sendSuccess(reply, { message: result.message });
        },
    });

    // PUT /api/admin/games/:id/toggle — Enable/Disable game
    app.put('/:id/toggle', {
        preHandler: [validateParams(gameIdParamSchema), validateBody(toggleGameSchema)],
        handler: async (request: FastifyRequest, reply) => {
            const { id } = request.params as { id: number };
            const { is_active } = request.body as { is_active: boolean };
            const game = await GameService.toggleGame(id, is_active);
            return sendSuccess(reply, { data: game, message: `Game ${is_active ? 'enabled' : 'disabled'}` });
        },
    });

    // PUT /api/admin/games/:id/multipliers — Set per-game multipliers
    app.put('/:id/multipliers', {
        preHandler: [validateParams(gameIdParamSchema), validateBody(setMultipliersSchema)],
        handler: async (request: FastifyRequest, reply) => {
            const { id } = request.params as { id: number };
            const data = request.body as Parameters<typeof GameService.setGameMultipliers>[1];
            const result = await GameService.setGameMultipliers(id, data, request.user!.id);
            return sendSuccess(reply, { data: result, message: 'Game multipliers updated' });
        },
    });

    // PUT /api/admin/games/multipliers — Set global default multipliers
    app.put('/multipliers', {
        preHandler: [validateBody(setMultipliersSchema)],
        handler: async (request: FastifyRequest, reply) => {
            const data = request.body as Parameters<typeof GameService.setGlobalMultipliers>[0];
            const result = await GameService.setGlobalMultipliers(data, request.user!.id);
            return sendSuccess(reply, { data: result, message: 'Global multipliers updated' });
        },
    });

    // GET /api/admin/games — List all games (including inactive)
    app.get('/', {
        handler: async (_request: FastifyRequest, reply) => {
            const games = await GameService.listAllGames();
            return sendSuccess(reply, { data: games });
        },
    });
}

// ==========================================
// PUBLIC GAME ROUTES — /api/games (authenticated)
// ==========================================
export async function publicGameRoutes(app: FastifyInstance) {

    // GET /api/games/active — List active games
    app.get('/active', {
        handler: async (_request: FastifyRequest, reply) => {
            const games = await GameService.listActiveGames();
            return sendSuccess(reply, { data: games });
        },
    });

    // GET /api/games/:gameId/status — Game status + window info
    app.get('/:gameId/status', {
        preHandler: [validateParams(gameIdSlugParamSchema)],
        handler: async (request: FastifyRequest, reply) => {
            const { gameId } = request.params as { gameId: number };
            const status = await GameService.getGameStatus(gameId);
            return sendSuccess(reply, { data: status });
        },
    });

    // GET /api/games/:gameId/multipliers — Current multipliers
    app.get('/:gameId/multipliers', {
        preHandler: [validateParams(gameIdSlugParamSchema)],
        handler: async (request: FastifyRequest, reply) => {
            const { gameId } = request.params as { gameId: number };
            const multipliers = await GameService.getMultipliers(gameId);
            return sendSuccess(reply, { data: multipliers });
        },
    });
}
