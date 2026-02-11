// server/middleware/hierarchy.middleware.ts
// Hierarchy scoping middleware — ensures users only see their downline data

import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../lib/prisma';
import { AppError } from '../utils/errors';

/**
 * Hierarchy Middleware
 * - Admin: scope = null (sees everything)
 * - SuperMaster/Master: scope = array of downline user IDs
 * - User: scope = [own ID only]
 *
 * Attaches request.hierarchyScope for use in service layer
 */
export async function hierarchyMiddleware(request: FastifyRequest, _reply: FastifyReply): Promise<void> {
    const user = request.user;

    if (!user) {
        throw new AppError('AUTH_TOKEN_MISSING');
    }

    // Admin sees everything — no scoping needed
    if (user.role === 'admin') {
        request.hierarchyScope = null;
        return;
    }

    // Users can only see their own data
    if (user.role === 'user') {
        request.hierarchyScope = [user.id];
        return;
    }

    // SuperMaster / Master — get full downline tree via recursive CTE
    const downlineIds = await getDownlineIds(user.id);
    request.hierarchyScope = [user.id, ...downlineIds];
}

/**
 * Get all user IDs in the downline tree using recursive CTE
 */
async function getDownlineIds(parentId: number): Promise<number[]> {
    const result = await prisma.$queryRaw<Array<{ id: number }>>`
    WITH RECURSIVE downline AS (
      SELECT id FROM "User" WHERE created_by = ${parentId} AND is_deleted = false
      UNION ALL
      SELECT u.id FROM "User" u
      INNER JOIN downline d ON u.created_by = d.id
      WHERE u.is_deleted = false
    )
    SELECT id FROM downline;
  `;

    return result.map((r) => r.id);
}
