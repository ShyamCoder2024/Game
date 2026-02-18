// server/routes/index.ts
// Route registration — Public, Protected, Admin, Leader scoping
// Pattern from SYSTEM_DESIGN.md Section 3.3

import { FastifyInstance } from 'fastify';
import { authRoutes } from './auth.routes';
import { publicGameRoutes } from './game.routes';
import { adminGameRoutes } from './game.routes';
import { leaderRoutes } from './leader.routes';
import { walletRoutes } from './wallet.routes';
import { userRoutes } from './user.routes';
import { betRoutes } from './bet.routes';
import { publicResultRoutes, adminResultRoutes } from './result.routes';
import { settlementRoutes } from './settlement.routes';
import { adminRoutes } from './admin.routes';
import { reportRoutes } from './report.routes';
import { creditRoutes } from './credit.routes';
import { exportRoutes } from './export.routes';
import { notificationRoutes, adminNotificationRoutes } from './notification.routes';
import { authMiddleware } from '../middleware/auth.middleware';
import { roleMiddleware } from '../middleware/role.middleware';
import { hierarchyMiddleware } from '../middleware/hierarchy.middleware';

/**
 * Register all application routes with proper middleware scoping
 */
export async function setupRoutes(app: FastifyInstance) {

    // ==========================================
    // PUBLIC ROUTES (no auth required)
    // ==========================================
    app.register(authRoutes, { prefix: '/api/auth' });

    // ==========================================
    // PROTECTED ROUTES (JWT required)
    // ==========================================
    app.register(async (protectedApp) => {
        // Apply auth middleware to all routes in this scope
        protectedApp.addHook('onRequest', authMiddleware);

        // --- User routes (all authenticated users) ---
        protectedApp.register(userRoutes, { prefix: '/api/user' });
        protectedApp.register(publicGameRoutes, { prefix: '/api/games' });
        protectedApp.register(betRoutes, { prefix: '/api/bets' });
        protectedApp.register(publicResultRoutes, { prefix: '/api/results' });
        protectedApp.register(notificationRoutes, { prefix: '/api/notifications' });

        // --- Admin routes (admin role only) ---
        protectedApp.register(async (adminApp) => {
            adminApp.addHook('onRequest', roleMiddleware(['admin']));

            adminApp.register(adminGameRoutes, { prefix: '/api/admin/games' });
            adminApp.register(adminResultRoutes, { prefix: '/api/admin/results' });
            adminApp.register(settlementRoutes, { prefix: '/api/admin/settlement' });
            adminApp.register(adminNotificationRoutes, { prefix: '/api/admin/notifications' });
            adminApp.register(adminRoutes, { prefix: '/api/admin' });
        });

        // --- Leader routes (admin + supermaster + master with hierarchy scoping) ---
        protectedApp.register(async (leaderApp) => {
            leaderApp.addHook('onRequest', roleMiddleware(['admin', 'supermaster', 'master']));
            leaderApp.addHook('onRequest', hierarchyMiddleware);

            leaderApp.register(leaderRoutes, { prefix: '/api/leaders' });
            leaderApp.register(walletRoutes, { prefix: '/api/wallet' });
            leaderApp.register(reportRoutes, { prefix: '/api/reports' });
            leaderApp.register(creditRoutes, { prefix: '/api/credits' });
            leaderApp.register(exportRoutes, { prefix: '/api/export' });
        });
    });
}

