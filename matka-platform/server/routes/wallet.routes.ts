// server/routes/wallet.routes.ts
// Wallet routes — /api/wallet (Leader scope: admin, SM, master)

import { FastifyInstance, FastifyRequest } from 'fastify';
import { WalletService } from '../services/wallet.service';
import { sendSuccess } from '../utils/response';
import { validateBody, validateParams, validateQuery } from '../middleware/validate.middleware';
import {
    creditDebitSchema,
    transactionHistorySchema,
    userIdParamSchema,
} from '../validators/wallet.schema';

export async function walletRoutes(app: FastifyInstance) {

    // POST /api/wallet/credit — Add coins to member
    app.post('/credit', {
        preHandler: [validateBody(creditDebitSchema)],
        handler: async (request: FastifyRequest, reply) => {
            const { user_id, amount, notes } = request.body as { user_id: number; amount: number; notes?: string };
            const result = await WalletService.creditCoins(
                user_id,
                amount,
                request.user!.id,
                'CREDIT_IN',
                notes || `Credit by ${request.user!.role}`,
            );
            return sendSuccess(reply, { data: result, message: `₹${amount} credited successfully` });
        },
    });

    // POST /api/wallet/debit — Withdraw coins from member
    app.post('/debit', {
        preHandler: [validateBody(creditDebitSchema)],
        handler: async (request: FastifyRequest, reply) => {
            const { user_id, amount, notes } = request.body as { user_id: number; amount: number; notes?: string };
            const result = await WalletService.debitCoins(
                user_id,
                amount,
                request.user!.id,
                'CREDIT_OUT',
                notes || `Debit by ${request.user!.role}`,
            );
            return sendSuccess(reply, { data: result, message: `₹${amount} debited successfully` });
        },
    });

    // GET /api/wallet/transactions/:userId — Transaction history
    app.get('/transactions/:userId', {
        preHandler: [validateParams(userIdParamSchema), validateQuery(transactionHistorySchema)],
        handler: async (request: FastifyRequest, reply) => {
            const { userId } = request.params as { userId: number };
            const query = request.query as { page?: number; limit?: number; type?: string; dateFrom?: string; dateTo?: string };
            const result = await WalletService.getTransactionHistory(userId, query);
            return sendSuccess(reply, {
                data: result.transactions,
                pagination: result.pagination,
            });
        },
    });

    // GET /api/wallet/balance/:userId — Current balance + exposure
    app.get('/balance/:userId', {
        preHandler: [validateParams(userIdParamSchema)],
        handler: async (request: FastifyRequest, reply) => {
            const { userId } = request.params as { userId: number };
            const balance = await WalletService.getBalanceForMember(
                userId,
                request.hierarchyScope ?? null
            );
            return sendSuccess(reply, { data: balance });
        },
    });
}
