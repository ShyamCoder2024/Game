// server/services/credit.service.ts
// Credit/Loan system — Give credit, repay, track outstanding

import { prisma } from '../lib/prisma';
import { AppError } from '../utils/errors';
import { generateLoanId, generateTxnId } from '../utils/idGenerator';
import { emitToUser } from '../socket/emitters';
import { WS_EVENTS } from '../socket/events';
import type { GiveCreditInput, CreditListQuery } from '../validators/credit.schema';

// ==========================================
// TYPES
// ==========================================

type HierarchyScope = number[] | null;

// ==========================================
// SERVICE
// ==========================================

export class CreditService {

    /**
     * Give credit to a user — credits their wallet and creates a loan record
     */
    static async giveCredit(fromUserId: number, data: GiveCreditInput) {
        const { toUserId, amount, note } = data;

        // Validate: target user exists
        const toUser = await prisma.user.findUnique({
            where: { id: toUserId },
            select: { id: true, user_id: true, name: true, created_by: true, is_blocked: true, is_deleted: true },
        });

        if (!toUser || toUser.is_deleted) {
            throw new AppError('ACCOUNT_NOT_FOUND', 'Target user not found');
        }

        if (toUser.is_blocked) {
            throw new AppError('ACCOUNT_BLOCKED', 'Cannot give credit to a blocked account');
        }

        const loanId = generateLoanId();

        const loan = await prisma.$transaction(async (tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0]) => {
            // Create loan record
            const loanRecord = await tx.creditLoan.create({
                data: {
                    loan_id: loanId,
                    user_id: toUserId,
                    given_by: fromUserId,
                    type: 'CREDIT_GIVEN',
                    amount,
                    outstanding: amount,
                    status: 'active',
                    notes: note || null,
                },
            });

            // Credit the user's wallet
            const user = await tx.user.findUnique({ where: { id: toUserId }, select: { wallet_balance: true, user_id: true } });
            const balanceBefore = user?.wallet_balance || 0;
            const balanceAfter = balanceBefore + amount;

            await tx.user.update({
                where: { id: toUserId },
                data: { wallet_balance: balanceAfter },
            });

            // Create transaction record
            await tx.transaction.create({
                data: {
                    txn_id: generateTxnId(user?.user_id || 'SYS'),
                    user_id: toUserId,
                    type: 'LOAN_IN',
                    amount,
                    direction: 'CREDIT',
                    balance_before: balanceBefore,
                    balance_after: balanceAfter,
                    performed_by: fromUserId,
                    reference: loanId,
                    reference_type: 'credit_loan',
                    notes: note || `Credit given by user ${fromUserId}`,
                },
            });

            return loanRecord;
        });

        // Emit wallet update AFTER transaction succeeds
        try {
            const updatedUser = await prisma.user.findUnique({
                where: { id: toUserId },
                select: { wallet_balance: true, exposure: true },
            });
            emitToUser(toUserId, WS_EVENTS.WALLET_UPDATE, {
                wallet_balance: updatedUser?.wallet_balance || 0,
                exposure: updatedUser?.exposure || 0,
            });
        } catch (err) {
            console.error('[CreditService] Failed to emit wallet update:', err);
        }

        return {
            loan_id: loan.loan_id,
            amount: loan.amount,
            outstanding: loan.outstanding,
            status: loan.status,
            to_user: toUser.user_id,
            to_name: toUser.name,
        };
    }

    /**
     * Repay credit — debits borrower's wallet and reduces outstanding
     */
    static async repayCredit(loanId: number, amount: number, requestingUserId: number) {
        const loan = await prisma.creditLoan.findUnique({
            where: { id: loanId },
            include: {
                receiver: { select: { id: true, user_id: true, name: true, wallet_balance: true } },
            },
        });

        if (!loan) {
            throw new AppError('CREDIT_LOAN_NOT_FOUND', 'Loan not found');
        }

        if (loan.status === 'fully_paid') {
            throw new AppError('CREDIT_ALREADY_REPAID', 'This loan is already fully repaid');
        }

        if (amount > loan.outstanding) {
            throw new AppError('CREDIT_EXCEEDS_OUTSTANDING', `Repayment amount exceeds outstanding balance of ${loan.outstanding}`);
        }

        // Check borrower has sufficient balance
        if (loan.receiver.wallet_balance < amount) {
            throw new AppError('WALLET_INSUFFICIENT_BALANCE', 'Borrower has insufficient balance for repayment');
        }

        const newOutstanding = loan.outstanding - amount;
        const newStatus = newOutstanding === 0 ? 'fully_paid' : 'partially_paid';

        const updatedLoan = await prisma.$transaction(async (tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0]) => {
            // Debit borrower's wallet
            const balanceBefore = loan.receiver.wallet_balance;
            const balanceAfter = balanceBefore - amount;

            await tx.user.update({
                where: { id: loan.user_id },
                data: { wallet_balance: balanceAfter },
            });

            // Update loan record
            const updated = await tx.creditLoan.update({
                where: { id: loanId },
                data: {
                    outstanding: newOutstanding,
                    status: newStatus,
                },
            });

            // Create transaction record
            await tx.transaction.create({
                data: {
                    txn_id: generateTxnId(loan.receiver.user_id),
                    user_id: loan.user_id,
                    type: 'LOAN_REPAYMENT',
                    amount,
                    direction: 'DEBIT',
                    balance_before: balanceBefore,
                    balance_after: balanceAfter,
                    performed_by: requestingUserId,
                    reference: loan.loan_id,
                    reference_type: 'credit_loan',
                    notes: `Loan repayment - ${newOutstanding === 0 ? 'Fully repaid' : 'Partial payment'}`,
                },
            });

            return updated;
        });

        // Emit wallet update AFTER transaction succeeds
        try {
            const updatedUser = await prisma.user.findUnique({
                where: { id: loan.user_id },
                select: { wallet_balance: true, exposure: true },
            });
            emitToUser(loan.user_id, WS_EVENTS.WALLET_UPDATE, {
                wallet_balance: updatedUser?.wallet_balance || 0,
                exposure: updatedUser?.exposure || 0,
            });
        } catch (err) {
            console.error('[CreditService] Failed to emit wallet update:', err);
        }

        return {
            loan_id: updatedLoan.loan_id,
            amount_repaid: amount,
            outstanding: updatedLoan.outstanding,
            status: updatedLoan.status,
        };
    }

    /**
     * Get outstanding credits — all active/partially paid loans
     */
    static async getOutstandingCredits(userId: number, scope: HierarchyScope, query: CreditListQuery) {
        const { page, limit } = query;
        const skip = (page - 1) * limit;

        const where: Record<string, unknown> = {
            status: { in: ['active', 'partially_paid'] },
        };

        // Scope: if not admin, only show loans given by this user or to users in their scope
        if (scope) {
            where.OR = [
                { given_by: userId },
                { user_id: { in: scope } },
            ];
        }

        const [loans, total, aggregate] = await Promise.all([
            prisma.creditLoan.findMany({
                where,
                include: {
                    receiver: { select: { user_id: true, name: true, role: true } },
                    giver: { select: { user_id: true, name: true } },
                },
                orderBy: { created_at: 'desc' },
                skip,
                take: limit,
            }),
            prisma.creditLoan.count({ where }),
            prisma.creditLoan.aggregate({
                where,
                _sum: { outstanding: true, amount: true },
            }),
        ]);

        const data = loans.map((l: typeof loans[number]) => ({
            id: l.id,
            loan_id: l.loan_id,
            borrower_id: l.receiver.user_id,
            borrower_name: l.receiver.name,
            borrower_role: l.receiver.role,
            given_by_id: l.giver.user_id,
            given_by_name: l.giver.name,
            amount: l.amount,
            outstanding: l.outstanding,
            status: l.status,
            notes: l.notes,
            created_at: l.created_at.toISOString(),
        }));

        return {
            data,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
            grandTotal: {
                total_given: aggregate._sum.amount || 0,
                total_outstanding: aggregate._sum.outstanding || 0,
            },
        };
    }

    /**
     * Get full credit history — all loans with optional status filter
     */
    static async getCreditHistory(userId: number, scope: HierarchyScope, query: CreditListQuery) {
        const { page, limit, status } = query;
        const skip = (page - 1) * limit;

        const where: Record<string, unknown> = {};

        if (status && status !== 'all') {
            where.status = status;
        }

        if (scope) {
            where.OR = [
                { given_by: userId },
                { user_id: { in: scope } },
            ];
        }

        const [loans, total, givenAgg, outstandingAgg] = await Promise.all([
            prisma.creditLoan.findMany({
                where,
                include: {
                    receiver: { select: { user_id: true, name: true, role: true } },
                    giver: { select: { user_id: true, name: true } },
                },
                orderBy: { created_at: 'desc' },
                skip,
                take: limit,
            }),
            prisma.creditLoan.count({ where }),
            prisma.creditLoan.aggregate({
                where,
                _sum: { amount: true },
            }),
            prisma.creditLoan.aggregate({
                where,
                _sum: { outstanding: true },
            }),
        ]);

        const data = loans.map((l: typeof loans[number]) => ({
            id: l.id,
            loan_id: l.loan_id,
            borrower_id: l.receiver.user_id,
            borrower_name: l.receiver.name,
            borrower_role: l.receiver.role,
            given_by_id: l.giver.user_id,
            given_by_name: l.giver.name,
            type: l.type,
            amount: l.amount,
            outstanding: l.outstanding,
            status: l.status,
            notes: l.notes,
            created_at: l.created_at.toISOString(),
        }));

        const totalGiven = givenAgg._sum.amount || 0;
        const totalOutstanding = outstandingAgg._sum.outstanding || 0;

        return {
            data,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
            grandTotal: {
                total_given: totalGiven,
                total_repaid: totalGiven - totalOutstanding,
                total_outstanding: totalOutstanding,
            },
        };
    }
}
