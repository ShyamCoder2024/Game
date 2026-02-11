// server/middleware/auth.middleware.ts
// JWT authentication middleware — verifies token and attaches user to request

import { FastifyRequest, FastifyReply } from 'fastify';
import { AuthService } from '../services/auth.service';
import { prisma } from '../lib/prisma';
import { AppError } from '../utils/errors';

/**
 * Auth Middleware
 * - Extracts Bearer token from Authorization header
 * - Verifies JWT
 * - Checks user exists and is not blocked/deleted
 * - Attaches user to request.user
 */
export async function authMiddleware(request: FastifyRequest, _reply: FastifyReply): Promise<void> {
    // Step 1: Extract token from header
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new AppError('AUTH_TOKEN_MISSING');
    }

    const token = authHeader.substring(7); // Remove "Bearer "

    if (!token) {
        throw new AppError('AUTH_TOKEN_MISSING');
    }

    // Step 2: Verify JWT
    const payload = AuthService.verifyToken(token);

    // Step 3: For admin, check if admin exists (may have been created on first login)
    if (payload.role === 'admin') {
        const adminUser = await prisma.user.findUnique({
            where: { id: payload.id },
            select: {
                id: true,
                user_id: true,
                role: true,
                name: true,
                created_by: true,
                is_blocked: true,
                is_deleted: true,
            },
        });

        if (!adminUser || adminUser.is_deleted) {
            throw new AppError('AUTH_TOKEN_INVALID');
        }

        request.user = {
            id: adminUser.id,
            user_id: adminUser.user_id,
            role: adminUser.role,
            name: adminUser.name,
            created_by: adminUser.created_by,
        };
        return;
    }

    // Step 4: For non-admin users, verify from database
    const user = await prisma.user.findUnique({
        where: { id: payload.id },
        select: {
            id: true,
            user_id: true,
            role: true,
            name: true,
            created_by: true,
            is_blocked: true,
            is_active: true,
            is_deleted: true,
        },
    });

    if (!user || user.is_deleted) {
        throw new AppError('AUTH_TOKEN_INVALID');
    }

    if (user.is_blocked) {
        throw new AppError('AUTH_ACCOUNT_BLOCKED');
    }

    if (!user.is_active) {
        throw new AppError('AUTH_ACCOUNT_INACTIVE');
    }

    // Step 5: Attach user to request
    request.user = {
        id: user.id,
        user_id: user.user_id,
        role: user.role,
        name: user.name,
        created_by: user.created_by,
    };
}
