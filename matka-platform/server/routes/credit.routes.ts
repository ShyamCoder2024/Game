// server/routes/credit.routes.ts
// Credit/Loan endpoints — /api/credits
// All routes require auth + leader role + hierarchy scoping

import { FastifyInstance, FastifyRequest } from 'fastify';
import { CreditService } from '../services/credit.service';
import { sendSuccess } from '../utils/response';
import { validateBody, validateQuery } from '../middleware/validate.middleware';
import { giveCreditSchema, repayCreditSchema, creditListSchema } from '../validators/credit.schema';
import type { GiveCreditInput, RepayCreditInput, CreditListQuery } from '../validators/credit.schema';

export async function creditRoutes(app: FastifyInstance) {

    // POST /api/credits/give — Give credit to a user
    app.post('/give', {
        preHandler: [validateBody(giveCreditSchema)],
        handler: async (request: FastifyRequest, reply) => {
            const user = request.user!;
            const data = request.body as GiveCreditInput;
            const result = await CreditService.giveCredit(user.id, data);
            return sendSuccess(reply, {
                data: result,
                message: `Credit of ${data.amount} coins given successfully`,
            }, 201);
        },
    });

    // POST /api/credits/repay — Repay a credit/loan
    app.post('/repay', {
        preHandler: [validateBody(repayCreditSchema)],
        handler: async (request: FastifyRequest, reply) => {
            const user = request.user!;
            const { loanId, amount } = request.body as RepayCreditInput;
            const result = await CreditService.repayCredit(loanId, amount, user.id);
            return sendSuccess(reply, {
                data: result,
                message: `Repayment of ${amount} coins recorded`,
            });
        },
    });

    // GET /api/credits/outstanding — List outstanding credits
    app.get('/outstanding', {
        preHandler: [validateQuery(creditListSchema)],
        handler: async (request: FastifyRequest, reply) => {
            const user = request.user!;
            const query = request.query as CreditListQuery;
            const scope = request.hierarchyScope ?? null;
            const result = await CreditService.getOutstandingCredits(user.id, scope, query);
            return sendSuccess(reply, {
                data: result.data,
                pagination: result.pagination,
                grandTotal: result.grandTotal,
            });
        },
    });

    // GET /api/credits/history — Full credit history
    app.get('/history', {
        preHandler: [validateQuery(creditListSchema)],
        handler: async (request: FastifyRequest, reply) => {
            const user = request.user!;
            const query = request.query as CreditListQuery;
            const scope = request.hierarchyScope ?? null;
            const result = await CreditService.getCreditHistory(user.id, scope, query);
            return sendSuccess(reply, {
                data: result.data,
                pagination: result.pagination,
                grandTotal: result.grandTotal,
            });
        },
    });
}
