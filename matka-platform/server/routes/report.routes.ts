// server/routes/report.routes.ts
// Report endpoints — /api/reports
// All routes require auth + leader role + hierarchy scoping

import { FastifyInstance, FastifyRequest } from 'fastify';
import { ReportService } from '../services/report.service';
import { sendSuccess } from '../utils/response';
import { validateQuery } from '../middleware/validate.middleware';
import { reportFilterSchema, dailySummarySchema } from '../validators/report.schema';
import type { ReportFilter, DailySummaryInput } from '../validators/report.schema';
import { roleMiddleware } from '../middleware/role.middleware';

export async function reportRoutes(app: FastifyInstance) {

    // GET /api/reports/pnl — P&L Report (admin + leaders)
    app.get('/pnl', {
        preHandler: [validateQuery(reportFilterSchema)],
        handler: async (request: FastifyRequest, reply) => {
            const filters = request.query as ReportFilter;
            const scope = request.hierarchyScope ?? null;
            const result = await ReportService.getPnlReport(filters, scope);
            return sendSuccess(reply, {
                data: result.data,
                pagination: result.pagination,
                grandTotal: result.grandTotal,
            });
        },
    });

    // GET /api/reports/collection — Collection Report (admin + leaders)
    app.get('/collection', {
        preHandler: [validateQuery(reportFilterSchema)],
        handler: async (request: FastifyRequest, reply) => {
            const filters = request.query as ReportFilter;
            const scope = request.hierarchyScope ?? null;
            const result = await ReportService.getCollectionReport(filters, scope);
            return sendSuccess(reply, {
                data: result.data,
                pagination: result.pagination,
                grandTotal: result.grandTotal,
            });
        },
    });

    // GET /api/reports/bets — Bet Report (admin + leaders)
    app.get('/bets', {
        preHandler: [validateQuery(reportFilterSchema)],
        handler: async (request: FastifyRequest, reply) => {
            const filters = request.query as ReportFilter;
            const scope = request.hierarchyScope ?? null;
            const result = await ReportService.getBetReport(filters, scope);
            return sendSuccess(reply, {
                data: result.data,
                pagination: result.pagination,
                grandTotal: result.grandTotal,
            });
        },
    });

    // GET /api/reports/exposure — Exposure Report (admin only)
    app.get('/exposure', {
        preHandler: [roleMiddleware(['admin'])],
        handler: async (request: FastifyRequest, reply) => {
            const scope = request.hierarchyScope ?? null;
            const result = await ReportService.getExposureReport(scope);
            return sendSuccess(reply, {
                data: result.data,
                grandTotal: result.grandTotal,
            });
        },
    });

    // GET /api/reports/cashbook — Cashbook Report (admin + leaders)
    app.get('/cashbook', {
        preHandler: [validateQuery(reportFilterSchema)],
        handler: async (request: FastifyRequest, reply) => {
            const filters = request.query as ReportFilter;
            const scope = request.hierarchyScope ?? null;
            const result = await ReportService.getCashbookReport(filters, scope);
            return sendSuccess(reply, {
                data: result.data,
                pagination: result.pagination,
                grandTotal: result.grandTotal,
            });
        },
    });

    // GET /api/reports/deals — Deal Report (admin only)
    app.get('/deals', {
        preHandler: [roleMiddleware(['admin'])],
        handler: async (request: FastifyRequest, reply) => {
            const scope = request.hierarchyScope ?? null;
            const result = await ReportService.getDealReport(scope);
            return sendSuccess(reply, { data: result.data });
        },
    });

    // GET /api/reports/daily-summary — Daily Summary (admin only)
    app.get('/daily-summary', {
        preHandler: [roleMiddleware(['admin']), validateQuery(dailySummarySchema)],
        handler: async (request: FastifyRequest, reply) => {
            const input = request.query as DailySummaryInput;
            const scope = request.hierarchyScope ?? null;
            const result = await ReportService.getDailySummary(input, scope);
            return sendSuccess(reply, { data: result });
        },
    });
}
