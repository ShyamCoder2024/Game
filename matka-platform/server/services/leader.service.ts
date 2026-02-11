// server/services/leader.service.ts
// Account Management Service — Create/manage SM, Master, User accounts

import { prisma } from '../lib/prisma';
import argon2 from 'argon2';
import { AppError } from '../utils/errors';
import { generateRoleBasedId } from '../utils/idGenerator';
import type { CreateAccountInput, UpdateAccountInput, ListMembersQuery } from '../validators/leader.schema';

// Role hierarchy: admin → supermaster → master → user
const ROLE_CAN_CREATE: Record<string, string[]> = {
    admin: ['supermaster', 'master', 'user'],
    supermaster: ['master', 'user'],
    master: ['user'],
};

export class LeaderService {

    // ==========================================
    // CREATE ACCOUNT
    // ==========================================

    /** Create a new account in the hierarchy */
    static async createAccount(
        creatorId: number,
        creatorRole: string,
        data: CreateAccountInput
    ) {
        // Validate role permissions
        const allowed = ROLE_CAN_CREATE[creatorRole];
        if (!allowed || !allowed.includes(data.role)) {
            throw new AppError('AUTH_INSUFFICIENT_ROLE', `${creatorRole} cannot create ${data.role} accounts`);
        }

        // Validate deal percentage doesn't exceed creator's
        if (data.deal_percentage > 0 && creatorRole !== 'admin') {
            const creator = await prisma.user.findUnique({
                where: { id: creatorId },
                select: { deal_percentage: true },
            });
            if (creator && data.deal_percentage > creator.deal_percentage) {
                throw new AppError('VALIDATION_ERROR', `Deal percentage cannot exceed your own (${creator.deal_percentage}%)`);
            }
        }

        // Generate role-based user ID
        let userId = generateRoleBasedId(data.role);

        // Ensure uniqueness (retry up to 5 times)
        for (let attempt = 0; attempt < 5; attempt++) {
            const exists = await prisma.user.findUnique({ where: { user_id: userId } });
            if (!exists) break;
            userId = generateRoleBasedId(data.role);
            if (attempt === 4) {
                throw new AppError('INTERNAL_ERROR', 'Failed to generate unique user ID');
            }
        }

        // Hash password
        const passwordHash = await argon2.hash(data.password, {
            type: argon2.argon2id,
            memoryCost: 65536,
            timeCost: 3,
            parallelism: 4,
        });

        // Create user
        const user = await prisma.user.create({
            data: {
                user_id: userId,
                name: data.name,
                password_hash: passwordHash,
                role: data.role as 'supermaster' | 'master' | 'user',
                created_by: creatorId,
                deal_percentage: data.deal_percentage,
                my_matka_share: data.my_matka_share,
                agent_matka_share: data.agent_matka_share,
                matka_commission: data.matka_commission,
                credit_limit: data.credit_limit,
                fix_limit: data.fix_limit,
                is_special: data.is_special,
                special_notes: data.special_notes,
                wallet_balance: 0,
                is_active: true,
            },
            select: {
                id: true,
                user_id: true,
                name: true,
                role: true,
                deal_percentage: true,
                wallet_balance: true,
                credit_limit: true,
                is_special: true,
                created_at: true,
            },
        });

        return user;
    }

    // ==========================================
    // LIST MEMBERS (scoped by hierarchy)
    // ==========================================

    /** List members visible to the requester */
    static async listMembers(
        requesterId: number,
        requesterRole: string,
        hierarchyScope: number[] | null,
        query: ListMembersQuery
    ) {
        const pg = query.page ?? 1;
        const lim = query.limit ?? 20;
        const { search, role, status, sort, order } = query;
        const skip = (pg - 1) * lim;

        // Build where clause
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const where: Record<string, any> = {
            is_deleted: false,
        };

        // Scope by hierarchy (null = admin sees all)
        if (hierarchyScope !== null) {
            where.id = { in: hierarchyScope };
        } else if (requesterRole !== 'admin') {
            // Non-admin without scope — only own downline
            where.created_by = requesterId;
        }

        // Filter by role
        if (role) {
            where.role = role;
        } else {
            // Exclude admin from results
            where.role = { not: 'admin' };
        }

        // Filter by status
        if (status === 'active') {
            where.is_blocked = false;
            where.is_active = true;
        } else if (status === 'blocked') {
            where.is_blocked = true;
        }

        // Search by name or user_id
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { user_id: { contains: search, mode: 'insensitive' } },
            ];
        }

        // Fetch data + count
        const [members, total] = await Promise.all([
            prisma.user.findMany({
                where,
                skip,
                take: Math.min(lim, 100),
                orderBy: { [sort]: order },
                select: {
                    id: true,
                    user_id: true,
                    name: true,
                    role: true,
                    wallet_balance: true,
                    deal_percentage: true,
                    credit_limit: true,
                    exposure: true,
                    is_blocked: true,
                    is_active: true,
                    is_special: true,
                    last_login_at: true,
                    created_at: true,
                    created_by: true,
                },
            }),
            prisma.user.count({ where }),
        ]);

        // Grand totals
        const grandTotal = await prisma.user.aggregate({
            where,
            _sum: { wallet_balance: true, exposure: true },
            _count: true,
        });

        return {
            members,
            pagination: {
                page: pg,
                limit: lim,
                total,
                totalPages: Math.ceil(total / lim),
            },
            grandTotal: {
                balance: grandTotal._sum.wallet_balance ?? 0,
                exposure: grandTotal._sum.exposure ?? 0,
                count: grandTotal._count,
            },
        };
    }

    // ==========================================
    // GET MEMBER DETAILS
    // ==========================================

    static async getMemberDetails(memberId: number, hierarchyScope: number[] | null) {
        // Verify access
        if (hierarchyScope !== null && !hierarchyScope.includes(memberId)) {
            throw new AppError('AUTH_INSUFFICIENT_ROLE', 'You do not have access to this member');
        }

        const member = await prisma.user.findUnique({
            where: { id: memberId },
            select: {
                id: true,
                user_id: true,
                name: true,
                role: true,
                wallet_balance: true,
                deal_percentage: true,
                my_matka_share: true,
                agent_matka_share: true,
                matka_commission: true,
                credit_limit: true,
                fix_limit: true,
                exposure: true,
                is_blocked: true,
                is_active: true,
                is_special: true,
                special_notes: true,
                last_login_at: true,
                created_at: true,
                created_by: true,
                _count: { select: { children: true } },
            },
        });

        if (!member || member.role === 'admin') {
            throw new AppError('NOT_FOUND', 'Member not found');
        }

        return member;
    }

    // ==========================================
    // UPDATE MEMBER
    // ==========================================

    static async updateMember(
        memberId: number,
        hierarchyScope: number[] | null,
        data: UpdateAccountInput
    ) {
        if (hierarchyScope !== null && !hierarchyScope.includes(memberId)) {
            throw new AppError('AUTH_INSUFFICIENT_ROLE', 'You do not have access to this member');
        }

        const member = await prisma.user.findUnique({ where: { id: memberId } });
        if (!member || member.is_deleted || member.role === 'admin') {
            throw new AppError('NOT_FOUND', 'Member not found');
        }

        const updated = await prisma.user.update({
            where: { id: memberId },
            data,
            select: {
                id: true,
                user_id: true,
                name: true,
                role: true,
                deal_percentage: true,
                credit_limit: true,
                fix_limit: true,
                is_special: true,
                wallet_balance: true,
            },
        });

        return updated;
    }

    // ==========================================
    // BLOCK / UNBLOCK
    // ==========================================

    static async blockMember(
        memberId: number,
        hierarchyScope: number[] | null,
        isBlocked: boolean,
        blockedById: number,
        reason?: string
    ) {
        if (hierarchyScope !== null && !hierarchyScope.includes(memberId)) {
            throw new AppError('AUTH_INSUFFICIENT_ROLE', 'You do not have access to this member');
        }

        const member = await prisma.user.findUnique({ where: { id: memberId } });
        if (!member || member.is_deleted || member.role === 'admin') {
            throw new AppError('NOT_FOUND', 'Member not found');
        }

        const updated = await prisma.user.update({
            where: { id: memberId },
            data: {
                is_blocked: isBlocked,
                blocked_at: isBlocked ? new Date() : null,
                blocked_by: isBlocked ? blockedById : null,
                blocked_reason: isBlocked ? (reason || null) : null,
            },
            select: {
                id: true,
                user_id: true,
                name: true,
                is_blocked: true,
                blocked_reason: true,
            },
        });

        // Log admin action
        await prisma.adminAction.create({
            data: {
                admin_id: blockedById,
                action_type: isBlocked ? 'BLOCK_USER' : 'UNBLOCK_USER',
                entity_type: 'USER',
                entity_id: memberId,
                new_value: isBlocked ? 'blocked' : 'unblocked',
                notes: reason || undefined,
            },
        });

        return updated;
    }

    // ==========================================
    // CHANGE MEMBER PASSWORD
    // ==========================================

    static async changeMemberPassword(
        memberId: number,
        hierarchyScope: number[] | null,
        newPassword: string,
        changedById: number
    ) {
        if (hierarchyScope !== null && !hierarchyScope.includes(memberId)) {
            throw new AppError('AUTH_INSUFFICIENT_ROLE', 'You do not have access to this member');
        }

        const member = await prisma.user.findUnique({ where: { id: memberId } });
        if (!member || member.is_deleted || member.role === 'admin') {
            throw new AppError('NOT_FOUND', 'Member not found');
        }

        const passwordHash = await argon2.hash(newPassword, {
            type: argon2.argon2id,
            memoryCost: 65536,
            timeCost: 3,
            parallelism: 4,
        });

        await prisma.user.update({
            where: { id: memberId },
            data: { password_hash: passwordHash },
        });

        // Log action
        await prisma.adminAction.create({
            data: {
                admin_id: changedById,
                action_type: 'CHANGE_PASSWORD',
                entity_type: 'USER',
                entity_id: memberId,
            },
        });

        return { message: 'Password changed successfully' };
    }

    // ==========================================
    // SPECIAL MASTERS LIST
    // ==========================================

    static async listSpecialMasters(hierarchyScope: number[] | null) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const where: Record<string, any> = {
            is_special: true,
            is_deleted: false,
            role: { in: ['supermaster', 'master'] },
        };

        if (hierarchyScope !== null) {
            where.id = { in: hierarchyScope };
        }

        const specials = await prisma.user.findMany({
            where,
            select: {
                id: true,
                user_id: true,
                name: true,
                role: true,
                deal_percentage: true,
                wallet_balance: true,
                special_notes: true,
                is_blocked: true,
                created_at: true,
            },
            orderBy: { name: 'asc' },
        });

        return specials;
    }

    // ==========================================
    // HIERARCHY TREE
    // ==========================================

    static async getHierarchyTree(requesterId: number, requesterRole: string) {
        if (requesterRole === 'admin') {
            // Admin sees full tree starting from supermasters
            const tree = await prisma.user.findMany({
                where: { role: 'supermaster', is_deleted: false },
                select: {
                    id: true,
                    user_id: true,
                    name: true,
                    role: true,
                    deal_percentage: true,
                    wallet_balance: true,
                    is_blocked: true,
                    children: {
                        where: { is_deleted: false },
                        select: {
                            id: true,
                            user_id: true,
                            name: true,
                            role: true,
                            deal_percentage: true,
                            wallet_balance: true,
                            is_blocked: true,
                            children: {
                                where: { is_deleted: false },
                                select: {
                                    id: true,
                                    user_id: true,
                                    name: true,
                                    role: true,
                                    deal_percentage: true,
                                    wallet_balance: true,
                                    is_blocked: true,
                                },
                            },
                        },
                    },
                },
                orderBy: { name: 'asc' },
            });
            return tree;
        }

        // Non-admin: show own subtree
        const tree = await prisma.user.findUnique({
            where: { id: requesterId },
            select: {
                id: true,
                user_id: true,
                name: true,
                role: true,
                deal_percentage: true,
                children: {
                    where: { is_deleted: false },
                    select: {
                        id: true,
                        user_id: true,
                        name: true,
                        role: true,
                        deal_percentage: true,
                        wallet_balance: true,
                        is_blocked: true,
                        children: {
                            where: { is_deleted: false },
                            select: {
                                id: true,
                                user_id: true,
                                name: true,
                                role: true,
                                deal_percentage: true,
                                wallet_balance: true,
                                is_blocked: true,
                            },
                        },
                    },
                },
            },
        });

        return tree ? [tree] : [];
    }
}
