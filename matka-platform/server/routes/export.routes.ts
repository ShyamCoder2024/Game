// server/routes/export.routes.ts
// CSV export endpoints — /api/export
// All routes require auth + leader role + hierarchy scoping

import { FastifyInstance, FastifyRequest } from 'fastify';
import { ReportService } from '../services/report.service';
import { ExportService } from '../services/export.service';
import { validateQuery } from '../middleware/validate.middleware';
import { reportFilterSchema } from '../validators/report.schema';
import type { ReportFilter } from '../validators/report.schema';

export async function exportRoutes(app: FastifyInstance) {

    // GET /api/export/pnl — P&L report as CSV
    app.get('/pnl', {
        preHandler: [validateQuery(reportFilterSchema)],
        handler: async (request: FastifyRequest, reply) => {
            const filters = request.query as ReportFilter;
            const scope = request.hierarchyScope ?? null;
            // Get all records (override pagination for full export)
            const result = await ReportService.getPnlReport({ ...filters, page: 1, limit: 10000 }, scope);

            const csv = ExportService.generateCsv(result.data as Record<string, unknown>[], [
                { header: 'User ID', key: 'user_id' },
                { header: 'Name', key: 'name' },
                { header: 'Role', key: 'role' },
                { header: 'Game', key: 'game' },
                { header: 'Date', key: 'date' },
                { header: 'P&L', key: 'pnl' },
                { header: 'Bets Volume', key: 'total_bets_volume' },
                { header: 'Bets Count', key: 'total_bets_count' },
                { header: 'Payout', key: 'total_payout' },
                { header: 'Commission', key: 'commission_earned' },
            ]);

            const today = new Date().toISOString().split('T')[0];
            reply.header('Content-Type', 'text/csv');
            reply.header('Content-Disposition', `attachment; filename="pnl-report-${today}.csv"`);
            return reply.send(csv);
        },
    });

    // GET /api/export/bets — Bet report as CSV
    app.get('/bets', {
        preHandler: [validateQuery(reportFilterSchema)],
        handler: async (request: FastifyRequest, reply) => {
            const filters = request.query as ReportFilter;
            const scope = request.hierarchyScope ?? null;
            const result = await ReportService.getBetReport({ ...filters, page: 1, limit: 10000 }, scope);

            const csv = ExportService.generateCsv(result.data as Record<string, unknown>[], [
                { header: 'Bet ID', key: 'bet_id' },
                { header: 'User ID', key: 'user_id' },
                { header: 'Name', key: 'name' },
                { header: 'Game', key: 'game' },
                { header: 'Date', key: 'date' },
                { header: 'Session', key: 'session' },
                { header: 'Bet Type', key: 'bet_type' },
                { header: 'Bet Number', key: 'bet_number' },
                { header: 'Bet Amount', key: 'bet_amount' },
                { header: 'Potential Win', key: 'potential_win' },
                { header: 'Win Amount', key: 'win_amount' },
                { header: 'Status', key: 'status' },
                { header: 'Placed At', key: 'created_at' },
            ]);

            const today = new Date().toISOString().split('T')[0];
            reply.header('Content-Type', 'text/csv');
            reply.header('Content-Disposition', `attachment; filename="bets-report-${today}.csv"`);
            return reply.send(csv);
        },
    });

    // GET /api/export/cashbook — Cashbook report as CSV
    app.get('/cashbook', {
        preHandler: [validateQuery(reportFilterSchema)],
        handler: async (request: FastifyRequest, reply) => {
            const filters = request.query as ReportFilter;
            const scope = request.hierarchyScope ?? null;
            const result = await ReportService.getCashbookReport({ ...filters, page: 1, limit: 10000 }, scope);

            const csv = ExportService.generateCsv(result.data as Record<string, unknown>[], [
                { header: 'Txn ID', key: 'txn_id' },
                { header: 'User ID', key: 'user_id' },
                { header: 'Name', key: 'name' },
                { header: 'Type', key: 'type' },
                { header: 'Direction', key: 'direction' },
                { header: 'Amount', key: 'amount' },
                { header: 'Balance Before', key: 'balance_before' },
                { header: 'Balance After', key: 'balance_after' },
                { header: 'Reference', key: 'reference' },
                { header: 'Notes', key: 'notes' },
                { header: 'Date', key: 'created_at' },
            ]);

            const today = new Date().toISOString().split('T')[0];
            reply.header('Content-Type', 'text/csv');
            reply.header('Content-Disposition', `attachment; filename="cashbook-${today}.csv"`);
            return reply.send(csv);
        },
    });

    // GET /api/export/collection — Collection report as CSV
    app.get('/collection', {
        preHandler: [validateQuery(reportFilterSchema)],
        handler: async (request: FastifyRequest, reply) => {
            const filters = request.query as ReportFilter;
            const scope = request.hierarchyScope ?? null;
            const result = await ReportService.getCollectionReport({ ...filters, page: 1, limit: 10000 }, scope);

            const csv = ExportService.generateCsv(result.data as Record<string, unknown>[], [
                { header: 'User ID', key: 'user_id' },
                { header: 'Name', key: 'name' },
                { header: 'Role', key: 'role' },
                { header: 'P&L', key: 'pnl' },
                { header: 'Status', key: 'status' },
            ]);

            const today = new Date().toISOString().split('T')[0];
            reply.header('Content-Type', 'text/csv');
            reply.header('Content-Disposition', `attachment; filename="collection-report-${today}.csv"`);
            return reply.send(csv);
        },
    });
}
