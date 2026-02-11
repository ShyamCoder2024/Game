// server/middleware/role.middleware.ts
// Role-based access control middleware

import { FastifyRequest, FastifyReply } from 'fastify';
import { AppError } from '../utils/errors';

type Role = 'admin' | 'supermaster' | 'master' | 'user';

/**
 * Role Middleware Factory
 * Returns a Fastify onRequest hook that checks user's role against allowed roles
 *
 * Usage:
 *   app.addHook('onRequest', roleMiddleware(['admin']));
 *   app.addHook('onRequest', roleMiddleware(['admin', 'supermaster']));
 *   app.addHook('onRequest', roleMiddleware(['admin', 'supermaster', 'master']));
 */
export function roleMiddleware(allowedRoles: Role[]) {
    return async (request: FastifyRequest, _reply: FastifyReply): Promise<void> => {
        const user = request.user;

        if (!user) {
            throw new AppError('AUTH_TOKEN_MISSING');
        }

        if (!allowedRoles.includes(user.role as Role)) {
            throw new AppError('AUTH_INSUFFICIENT_ROLE', `Required role: ${allowedRoles.join(' or ')}`);
        }
    };
}
