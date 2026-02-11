// server/routes/user.routes.ts
// User profile routes — /api/user (authenticated users)

import { FastifyInstance, FastifyRequest } from 'fastify';
import { prisma } from '../lib/prisma';
import { WalletService } from '../services/wallet.service';
import { AuthService } from '../services/auth.service';
import { sendSuccess } from '../utils/response';
import { validateBody, validateQuery } from '../middleware/validate.middleware';
import { changeOwnPasswordSchema } from '../validators/leader.schema';
import { transactionHistorySchema } from '../validators/wallet.schema';
import { AppError } from '../utils/errors';

export async function userRoutes(app: FastifyInstance) {

    // GET /api/user/profile — Get own profile
    app.get('/profile', {
        handler: async (request: FastifyRequest, reply) => {
            const user = await prisma.user.findUnique({
                where: { id: request.user!.id },
                select: {
                    id: true,
                    user_id: true,
                    name: true,
                    role: true,
                    wallet_balance: true,
                    exposure: true,
                    deal_percentage: true,
                    credit_limit: true,
                    fix_limit: true,
                    is_special: true,
                    last_login_at: true,
                    created_at: true,
                },
            });

            if (!user) {
                throw new AppError('ACCOUNT_NOT_FOUND');
            }

            return sendSuccess(reply, { data: user });
        },
    });

    // PUT /api/user/change-password — Change own password
    app.put('/change-password', {
        preHandler: [validateBody(changeOwnPasswordSchema)],
        handler: async (request: FastifyRequest, reply) => {
            const { current_password, new_password } = request.body as {
                current_password: string;
                new_password: string;
            };

            // Verify current password
            const user = await prisma.user.findUnique({
                where: { id: request.user!.id },
                select: { password_hash: true },
            });

            if (!user) {
                throw new AppError('ACCOUNT_NOT_FOUND');
            }

            const isValid = await AuthService.verifyPassword(user.password_hash, current_password);
            if (!isValid) {
                throw new AppError('AUTH_INVALID_CREDENTIALS', 'Current password is incorrect');
            }

            // Hash and update
            const newHash = await AuthService.hashPassword(new_password);
            await prisma.user.update({
                where: { id: request.user!.id },
                data: { password_hash: newHash },
            });

            return sendSuccess(reply, { message: 'Password changed successfully' });
        },
    });

    // GET /api/user/statement — Financial statement (balance overview)
    app.get('/statement', {
        handler: async (request: FastifyRequest, reply) => {
            const balance = await WalletService.getBalance(request.user!.id);
            return sendSuccess(reply, { data: balance });
        },
    });

    // GET /api/user/ledger — Transaction ledger
    app.get('/ledger', {
        preHandler: [validateQuery(transactionHistorySchema)],
        handler: async (request: FastifyRequest, reply) => {
            const query = request.query as { page?: number; limit?: number; type?: string; dateFrom?: string; dateTo?: string };
            const result = await WalletService.getTransactionHistory(request.user!.id, query);
            return sendSuccess(reply, {
                data: result.transactions,
                pagination: result.pagination,
            });
        },
    });
}
