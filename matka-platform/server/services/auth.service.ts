// server/services/auth.service.ts
// Authentication service — Login, JWT, Argon2, Master Access

import jwt from 'jsonwebtoken';
import argon2 from 'argon2';
import { prisma } from '../lib/prisma';
import { AppError } from '../utils/errors';

// ==========================================
// TYPES
// ==========================================

interface JWTPayload {
    id: number;
    user_id: string;
    role: 'admin' | 'supermaster' | 'master' | 'user';
    name: string;
    created_by: number | null;
}

interface LoginResult {
    token: string;
    user: {
        id: number;
        user_id: string;
        name: string;
        role: string;
        wallet_balance: number;
    };
}

// ==========================================
// SERVICE
// ==========================================

export class AuthService {

    /**
     * Login — Check admin env vars first, then database lookup
     */
    static async login(userId: string, password: string, ip?: string, userAgent?: string): Promise<LoginResult> {
        // Step 1: Check if this is the admin
        const adminResult = await this.tryAdminLogin(userId, password);
        if (adminResult) {
            // Log admin login
            await this.logLogin(adminResult.user.id, true, ip, userAgent);
            return adminResult;
        }

        // Step 2: Look up user in database
        const user = await prisma.user.findUnique({
            where: { user_id: userId },
            select: {
                id: true,
                user_id: true,
                name: true,
                role: true,
                password_hash: true,
                wallet_balance: true,
                created_by: true,
                is_blocked: true,
                is_active: true,
                is_deleted: true,
            },
        });

        if (!user) {
            // Log failed attempt if we can find partial match
            throw new AppError('AUTH_INVALID_CREDENTIALS');
        }

        // Step 3: Check account status
        if (user.is_deleted) {
            throw new AppError('AUTH_INVALID_CREDENTIALS');
        }

        if (user.is_blocked) {
            await this.logLogin(user.id, false, ip, userAgent, 'Account blocked');
            throw new AppError('AUTH_ACCOUNT_BLOCKED');
        }

        if (!user.is_active) {
            await this.logLogin(user.id, false, ip, userAgent, 'Account inactive');
            throw new AppError('AUTH_ACCOUNT_INACTIVE');
        }

        // Step 4: Verify password with Argon2
        const isValid = await argon2.verify(user.password_hash, password);
        if (!isValid) {
            await this.logLogin(user.id, false, ip, userAgent, 'Invalid password');
            throw new AppError('AUTH_INVALID_CREDENTIALS');
        }

        // Step 5: Generate JWT
        const payload: JWTPayload = {
            id: user.id,
            user_id: user.user_id,
            role: user.role,
            name: user.name,
            created_by: user.created_by,
        };

        const token = this.generateToken(payload);

        // Step 6: Update last login
        await prisma.user.update({
            where: { id: user.id },
            data: {
                last_login_at: new Date(),
                last_login_ip: ip || null,
            },
        });

        // Step 7: Log successful login
        await this.logLogin(user.id, true, ip, userAgent);

        return {
            token,
            user: {
                id: user.id,
                user_id: user.user_id,
                name: user.name,
                role: user.role,
                wallet_balance: user.wallet_balance,
            },
        };
    }

    /**
     * Try admin login — checks against hardcoded env vars
     */
    private static async tryAdminLogin(userId: string, password: string): Promise<LoginResult | null> {
        const adminId = process.env.ADMIN_ID;
        const adminPassword = process.env.ADMIN_PASSWORD;

        if (!adminId || !adminPassword || userId !== adminId) {
            return null;
        }

        // Admin can login with plain password from .env or with hashed password
        // For simplicity in dev, we compare plain text. In production, hash it.
        if (password !== adminPassword) {
            return null;
        }

        // Check if admin exists in DB (created by seed), if not create one
        let adminUser = await prisma.user.findUnique({
            where: { user_id: adminId },
            select: {
                id: true,
                user_id: true,
                name: true,
                role: true,
                wallet_balance: true,
                created_by: true,
            },
        });

        if (!adminUser) {
            // Admin not seeded yet — create on first login
            const hash = await this.hashPassword(password);
            adminUser = await prisma.user.create({
                data: {
                    user_id: adminId,
                    name: 'Admin',
                    password_hash: hash,
                    role: 'admin',
                    wallet_balance: 0, // Admin has conceptually infinite coins
                    is_active: true,
                },
                select: {
                    id: true,
                    user_id: true,
                    name: true,
                    role: true,
                    wallet_balance: true,
                    created_by: true,
                },
            });
        }

        const payload: JWTPayload = {
            id: adminUser.id,
            user_id: adminUser.user_id,
            role: 'admin',
            name: adminUser.name,
            created_by: null,
        };

        const token = this.generateToken(payload);

        return {
            token,
            user: {
                id: adminUser.id,
                user_id: adminUser.user_id,
                name: adminUser.name,
                role: 'admin',
                wallet_balance: adminUser.wallet_balance,
            },
        };
    }

    /**
     * Admin Master Access — Login as any user (view-only)
     */
    static async masterAccess(adminId: number, targetUserId: string): Promise<LoginResult> {
        // Verify caller is admin
        const admin = await prisma.user.findUnique({
            where: { id: adminId },
            select: { role: true },
        });

        if (!admin || admin.role !== 'admin') {
            throw new AppError('AUTH_INSUFFICIENT_ROLE');
        }

        // Find target user
        const targetUser = await prisma.user.findUnique({
            where: { user_id: targetUserId },
            select: {
                id: true,
                user_id: true,
                name: true,
                role: true,
                wallet_balance: true,
                created_by: true,
                is_deleted: true,
            },
        });

        if (!targetUser || targetUser.is_deleted) {
            throw new AppError('ACCOUNT_NOT_FOUND');
        }

        // Generate token for target user
        const payload: JWTPayload = {
            id: targetUser.id,
            user_id: targetUser.user_id,
            role: targetUser.role,
            name: targetUser.name,
            created_by: targetUser.created_by,
        };

        const token = this.generateToken(payload);

        // Audit log this access
        await prisma.adminAction.create({
            data: {
                admin_id: adminId,
                action_type: 'MASTER_ACCESS',
                entity_type: 'user',
                entity_id: targetUser.id,
                notes: `Admin accessed account ${targetUserId}`,
            },
        });

        return {
            token,
            user: {
                id: targetUser.id,
                user_id: targetUser.user_id,
                name: targetUser.name,
                role: targetUser.role,
                wallet_balance: targetUser.wallet_balance,
            },
        };
    }

    /**
     * Generate JWT token
     */
    static generateToken(payload: JWTPayload): string {
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            throw new AppError('INTERNAL_ERROR', 'JWT_SECRET is not configured');
        }

        // 24h default = 86400 seconds
        const expirySeconds = parseInt(process.env.JWT_EXPIRY_SECONDS || '86400', 10);
        return jwt.sign(payload, secret, { expiresIn: expirySeconds });
    }

    /**
     * Verify and decode JWT token
     */
    static verifyToken(token: string): JWTPayload {
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            throw new AppError('INTERNAL_ERROR', 'JWT_SECRET is not configured');
        }

        try {
            return jwt.verify(token, secret) as JWTPayload;
        } catch (err) {
            if (err instanceof jwt.TokenExpiredError) {
                throw new AppError('AUTH_TOKEN_EXPIRED');
            }
            throw new AppError('AUTH_TOKEN_INVALID');
        }
    }

    /**
     * Hash password with Argon2id
     */
    static async hashPassword(password: string): Promise<string> {
        return argon2.hash(password, {
            type: argon2.argon2id,
            memoryCost: 65536,    // 64MB
            timeCost: 3,          // 3 iterations
            parallelism: 4,       // 4 threads
        });
    }

    /**
     * Verify password against hash
     */
    static async verifyPassword(hash: string, password: string): Promise<boolean> {
        return argon2.verify(hash, password);
    }

    /**
     * Log login attempt (success or failure)
     */
    private static async logLogin(
        userId: number,
        success: boolean,
        ip?: string,
        userAgent?: string,
        failureReason?: string
    ): Promise<void> {
        try {
            await prisma.loginLog.create({
                data: {
                    user_id: userId,
                    success,
                    ip_address: ip || 'unknown',
                    user_agent: userAgent || null,
                    failure_reason: failureReason || null,
                },
            });
        } catch {
            // Don't fail login if logging fails
        }
    }
}
