// server/routes/leader.routes.ts
// Account Management (Leader) routes — /api/leaders

import { FastifyInstance, FastifyRequest } from 'fastify';
import { LeaderService } from '../services/leader.service';
import { sendSuccess } from '../utils/response';
import { validateBody, validateParams, validateQuery } from '../middleware/validate.middleware';
import {
    createAccountSchema,
    updateAccountSchema,
    blockAccountSchema,
    changePasswordSchema,
    listMembersQuerySchema,
    memberIdParamSchema,
} from '../validators/leader.schema';

export async function leaderRoutes(app: FastifyInstance) {

    // POST /api/leaders/create — Create account
    app.post('/create', {
        preHandler: [validateBody(createAccountSchema)],
        handler: async (request: FastifyRequest, reply) => {
            const user = request.user!;
            const data = request.body as Parameters<typeof LeaderService.createAccount>[2];
            const result = await LeaderService.createAccount(user.id, user.role, data);
            return sendSuccess(reply, { data: result, message: 'Account created successfully' }, 201);
        },
    });

    // GET /api/leaders/list — List members
    app.get('/list', {
        preHandler: [validateQuery(listMembersQuerySchema)],
        handler: async (request: FastifyRequest, reply) => {
            const user = request.user!;
            const query = request.query as Parameters<typeof LeaderService.listMembers>[3];
            const result = await LeaderService.listMembers(
                user.id,
                user.role,
                request.hierarchyScope ?? null,
                query
            );
            return sendSuccess(reply, {
                data: result.members,
                pagination: result.pagination,
                grandTotal: result.grandTotal,
            });
        },
    });

    // GET /api/leaders/special — List special masters
    app.get('/special', {
        handler: async (request: FastifyRequest, reply) => {
            const result = await LeaderService.listSpecialMasters(request.hierarchyScope ?? null);
            return sendSuccess(reply, { data: result });
        },
    });

    // GET /api/leaders/hierarchy — Full hierarchy tree
    app.get('/hierarchy', {
        handler: async (request: FastifyRequest, reply) => {
            const user = request.user!;
            const tree = await LeaderService.getHierarchyTree(user.id, user.role);
            return sendSuccess(reply, { data: tree });
        },
    });

    // GET /api/leaders/:id — Member details
    app.get('/:id', {
        preHandler: [validateParams(memberIdParamSchema)],
        handler: async (request: FastifyRequest, reply) => {
            const { id } = request.params as { id: number };
            const member = await LeaderService.getMemberDetails(id, request.hierarchyScope ?? null);
            return sendSuccess(reply, { data: member });
        },
    });

    // PUT /api/leaders/:id — Update member
    app.put('/:id', {
        preHandler: [validateParams(memberIdParamSchema), validateBody(updateAccountSchema)],
        handler: async (request: FastifyRequest, reply) => {
            const { id } = request.params as { id: number };
            const data = request.body as Parameters<typeof LeaderService.updateMember>[2];
            const result = await LeaderService.updateMember(id, request.hierarchyScope ?? null, data);
            return sendSuccess(reply, { data: result, message: 'Account updated' });
        },
    });

    // PUT /api/leaders/:id/block — Block/Unblock member
    app.put('/:id/block', {
        preHandler: [validateParams(memberIdParamSchema), validateBody(blockAccountSchema)],
        handler: async (request: FastifyRequest, reply) => {
            const { id } = request.params as { id: number };
            const { is_blocked, reason } = request.body as { is_blocked: boolean; reason?: string };
            const result = await LeaderService.blockMember(
                id,
                request.hierarchyScope ?? null,
                is_blocked,
                request.user!.id,
                reason
            );
            return sendSuccess(reply, {
                data: result,
                message: is_blocked ? 'Account blocked' : 'Account unblocked',
            });
        },
    });

    // PUT /api/leaders/:id/password — Change member's password
    app.put('/:id/password', {
        preHandler: [validateParams(memberIdParamSchema), validateBody(changePasswordSchema)],
        handler: async (request: FastifyRequest, reply) => {
            const { id } = request.params as { id: number };
            const { new_password } = request.body as { new_password: string };
            const result = await LeaderService.changeMemberPassword(
                id,
                request.hierarchyScope ?? null,
                new_password,
                request.user!.id
            );
            return sendSuccess(reply, { message: result.message });
        },
    });
}
