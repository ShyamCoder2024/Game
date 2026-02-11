// server/routes/auth.routes.ts
// Authentication routes — Login, Logout, Master Access

import { FastifyInstance } from 'fastify';
import { AuthService } from '../services/auth.service';
import { loginSchema, masterAccessSchema, LoginInput, MasterAccessInput } from '../validators/auth.schema';
import { authMiddleware } from '../middleware/auth.middleware';
import { roleMiddleware } from '../middleware/role.middleware';
import { validateBody } from '../middleware/validate.middleware';
import { sendSuccess, sendError } from '../utils/response';

export async function authRoutes(app: FastifyInstance) {

    /**
     * POST /api/auth/login
     * Public — no auth required
     */
    app.post<{ Body: LoginInput }>('/login', {
        preHandler: [validateBody(loginSchema)],
        handler: async (request, reply) => {
            const { user_id, password } = request.body;

            const ip = request.ip;
            const userAgent = request.headers['user-agent'];

            const result = await AuthService.login(user_id, password, ip, userAgent);

            return sendSuccess(reply, {
                data: result,
                message: 'Login successful',
            });
        },
    });

    /**
     * POST /api/auth/logout
     * Authenticated — clears session (client-side JWT removal)
     */
    app.post('/logout', {
        preHandler: [authMiddleware],
        handler: async (_request, reply) => {
            // JWT is stateless — logout is handled client-side by removing the token
            // In future, we can add token blacklisting via Redis
            return sendSuccess(reply, {
                message: 'Logged out successfully',
            });
        },
    });

    /**
     * POST /api/auth/master-access
     * Admin only — access any user account
     */
    app.post<{ Body: MasterAccessInput }>('/master-access', {
        preHandler: [authMiddleware, roleMiddleware(['admin']), validateBody(masterAccessSchema)],
        handler: async (request, reply) => {
            const { target_user_id } = request.body;
            const adminId = request.user.id;

            const result = await AuthService.masterAccess(adminId, target_user_id);

            return sendSuccess(reply, {
                data: result,
                message: `Accessing account ${target_user_id}`,
            });
        },
    });
}
