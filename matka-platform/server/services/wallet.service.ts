// server/services/wallet.service.ts
// Wallet service — Atomic credit/debit operations with transaction records
// RULE: Integer math ONLY (1 Coin = 1 Rupee). No floats. No negative balances.

import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { AppError } from '../utils/errors';
import { generateTxnId } from '../utils/idGenerator';
import { emitToUser } from '../socket/emitters';
import { WS_EVENTS } from '../socket/events';

// ==========================================
// TYPES
// ==========================================

// Use string literals matching Prisma enums to avoid import issues
type TxnType = 'CREDIT_IN' | 'CREDIT_OUT' | 'BET_PLACED' | 'BET_WON' | 'BET_CANCELLED' | 'WITHDRAWAL' | 'ROLLBACK_DEBIT' | 'ROLLBACK_CREDIT' | 'LOAN_IN' | 'LOAN_OUT' | 'LOAN_REPAYMENT' | 'MANUAL_ADJUSTMENT';
type TxnDirection = 'CREDIT' | 'DEBIT';

// Prisma interactive transaction client type
type TxClient = Prisma.TransactionClient;

interface WalletResult {
    txn_id: string;
    balance_before: number;
    balance_after: number;
    amount: number;
}

// ==========================================
// SERVICE
// ==========================================

export class WalletService {

    /**
     * Credit coins to a user's wallet (ATOMIC)
     * Admin has conceptually infinite coins — no balance check for admin
     */
    static async creditCoins(
        userId: number,
        amount: number,
        performedBy: number,
        type: TxnType = 'CREDIT_IN',
        notes?: string,
        reference?: string,
        referenceType?: string,
    ): Promise<WalletResult> {
        if (!Number.isInteger(amount) || amount <= 0) {
            throw new AppError('WALLET_INVALID_AMOUNT', 'Amount must be a positive integer');
        }

        const result = await prisma.$transaction(async (tx: TxClient) => {
            const user = await tx.user.findUnique({
                where: { id: userId },
                select: { id: true, user_id: true, wallet_balance: true, is_deleted: true },
            });

            if (!user || user.is_deleted) {
                throw new AppError('ACCOUNT_NOT_FOUND');
            }

            const balanceBefore = user.wallet_balance;
            const balanceAfter = balanceBefore + amount;

            await tx.user.update({
                where: { id: userId },
                data: { wallet_balance: balanceAfter },
            });

            const txnId = generateTxnId(user.user_id);
            await tx.transaction.create({
                data: {
                    txn_id: txnId,
                    user_id: userId,
                    type,
                    amount,
                    direction: 'CREDIT' as TxnDirection,
                    balance_before: balanceBefore,
                    balance_after: balanceAfter,
                    performed_by: performedBy,
                    notes: notes || null,
                    reference: reference || null,
                    reference_type: referenceType || null,
                },
            });

            return {
                txn_id: txnId,
                balance_before: balanceBefore,
                balance_after: balanceAfter,
                amount,
            };
        });

        // Real-time wallet update
        emitToUser(userId, WS_EVENTS.WALLET_UPDATE, {
            balance: result.balance_after,
        });

        return result;
    }

    /**
     * Debit coins from a user's wallet (ATOMIC)
     * Checks balance before deducting — throws if insufficient
     */
    static async debitCoins(
        userId: number,
        amount: number,
        performedBy: number,
        type: TxnType = 'CREDIT_OUT',
        notes?: string,
        reference?: string,
        referenceType?: string,
    ): Promise<WalletResult> {
        if (!Number.isInteger(amount) || amount <= 0) {
            throw new AppError('WALLET_INVALID_AMOUNT', 'Amount must be a positive integer');
        }

        const result = await prisma.$transaction(async (tx: TxClient) => {
            const user = await tx.user.findUnique({
                where: { id: userId },
                select: { id: true, user_id: true, wallet_balance: true, is_deleted: true },
            });

            if (!user || user.is_deleted) {
                throw new AppError('ACCOUNT_NOT_FOUND');
            }

            const balanceBefore = user.wallet_balance;

            if (balanceBefore < amount) {
                throw new AppError('WALLET_INSUFFICIENT_BALANCE', `Balance: ${balanceBefore}, Required: ${amount}`);
            }

            const balanceAfter = balanceBefore - amount;

            await tx.user.update({
                where: { id: userId },
                data: { wallet_balance: balanceAfter },
            });

            const txnId = generateTxnId(user.user_id);
            await tx.transaction.create({
                data: {
                    txn_id: txnId,
                    user_id: userId,
                    type,
                    amount,
                    direction: 'DEBIT' as TxnDirection,
                    balance_before: balanceBefore,
                    balance_after: balanceAfter,
                    performed_by: performedBy,
                    notes: notes || null,
                    reference: reference || null,
                    reference_type: referenceType || null,
                },
            });

            return {
                txn_id: txnId,
                balance_before: balanceBefore,
                balance_after: balanceAfter,
                amount,
            };
        });

        // Real-time wallet update
        emitToUser(userId, WS_EVENTS.WALLET_UPDATE, {
            balance: result.balance_after,
        });

        return result;
    }

    /**
     * Get user's current wallet balance and exposure
     */
    static async getBalance(userId: number): Promise<{
        wallet_balance: number;
        exposure: number;
        available_balance: number;
    }> {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                wallet_balance: true,
                exposure: true,
            },
        });

        if (!user) {
            throw new AppError('ACCOUNT_NOT_FOUND');
        }

        return {
            wallet_balance: user.wallet_balance,
            exposure: user.exposure,
            available_balance: user.wallet_balance - user.exposure,
        };
    }

    /**
     * Get transaction history for a user (paginated)
     */
    static async getTransactionHistory(
        userId: number,
        options: {
            page?: number;
            limit?: number;
            type?: string;
            dateFrom?: string;
            dateTo?: string;
        } = {}
    ) {
        const page = options.page || 1;
        const limit = Math.min(options.limit || 20, 100);
        const skip = (page - 1) * limit;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const where: Record<string, any> = { user_id: userId };

        if (options.type) {
            where.type = options.type as TxnType;
        }

        if (options.dateFrom || options.dateTo) {
            where.created_at = {};
            if (options.dateFrom) {
                where.created_at.gte = new Date(`${options.dateFrom}T00:00:00+05:30`);
            }
            if (options.dateTo) {
                where.created_at.lte = new Date(`${options.dateTo}T23:59:59+05:30`);
            }
        }

        const [transactions, total] = await Promise.all([
            prisma.transaction.findMany({
                where,
                skip,
                take: limit,
                orderBy: { created_at: 'desc' },
                select: {
                    id: true,
                    txn_id: true,
                    type: true,
                    amount: true,
                    direction: true,
                    balance_before: true,
                    balance_after: true,
                    reference: true,
                    notes: true,
                    performed_by: true,
                    created_at: true,
                },
            }),
            prisma.transaction.count({ where }),
        ]);

        return {
            transactions,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    /**
     * Get balance + exposure for a member (used by leaders)
     */
    static async getBalanceForMember(
        userId: number,
        hierarchyScope: number[] | null
    ) {
        // Verify access scope
        if (hierarchyScope !== null && !hierarchyScope.includes(userId)) {
            throw new AppError('AUTH_INSUFFICIENT_ROLE', 'You do not have access to this member');
        }

        return this.getBalance(userId);
    }
}
