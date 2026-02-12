// server/services/rollback.service.ts
// Rollback Engine — Reverse settlements, return bets, reverse P/L
// ADMIN ONLY — Must be idempotent and atomic

import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { AppError } from '../utils/errors';
import { generateTxnId } from '../utils/idGenerator';
import { PnLService } from './pnl.service';
import { emitToUser, emitToAll, emitToAdmins } from '../socket/emitters';
import { WS_EVENTS } from '../socket/events';

// Prisma transaction client type
type TxClient = Prisma.TransactionClient;

export class RollbackService {

    /**
     * Rollback a settlement — Reverses everything done by the settlement engine
     *
     * 1. Find all settled bets for this result
     * 2. For winners: debit the win amount from their wallet
     * 3. For losers: credit the bet amount back to their wallet
     * 4. Reset all bet statuses to 'pending'
     * 5. Reverse P/L records
     * 6. Mark result as rolled back
     * 7. Create audit record
     */
    static async rollbackSettlement(resultId: number, adminId: number) {
        // Validate result exists and is settled
        const result = await prisma.result.findUnique({
            where: { id: resultId },
            include: {
                settlement: true,
                game: { select: { name: true } },
            },
        });

        if (!result || result.is_deleted) {
            throw new AppError('NOT_FOUND', 'Result not found');
        }

        if (!result.is_settled) {
            throw new AppError('VALIDATION_ERROR', 'This result has not been settled yet');
        }

        if (result.is_rolled_back) {
            throw new AppError('VALIDATION_ERROR', 'This result has already been rolled back');
        }

        // Store bets reference for post-transaction WS emits
        const settledBetsForEmit = await prisma.bet.findMany({
            where: {
                result_id: resultId,
                status: { in: ['won', 'lost'] },
            },
            select: { user_id: true },
        });

        const rollbackResult = await prisma.$transaction(async (tx: TxClient) => {

            // 1. Find all settled bets for this result
            const settledBets = await tx.bet.findMany({
                where: {
                    result_id: resultId,
                    status: { in: ['won', 'lost'] },
                },
                include: {
                    user: { select: { id: true, user_id: true, wallet_balance: true } },
                },
            });

            // 2. Reverse each bet
            for (const bet of settledBets) {
                if (bet.status === 'won') {
                    // WINNER ROLLBACK: Debit the win amount
                    const balanceBefore = bet.user.wallet_balance;
                    const balanceAfter = balanceBefore - bet.win_amount;

                    await tx.user.update({
                        where: { id: bet.user_id },
                        data: {
                            wallet_balance: { decrement: bet.win_amount },
                        },
                    });

                    // Create ROLLBACK_DEBIT transaction
                    const txnId = generateTxnId(bet.user.user_id);
                    await tx.transaction.create({
                        data: {
                            txn_id: txnId,
                            user_id: bet.user_id,
                            type: 'ROLLBACK_DEBIT',
                            amount: bet.win_amount,
                            direction: 'DEBIT',
                            balance_before: balanceBefore,
                            balance_after: balanceAfter,
                            performed_by: adminId,
                            reference: bet.bet_id,
                            reference_type: 'ROLLBACK',
                            notes: `Rollback: Win reversed for ${bet.bet_type} - ${bet.bet_number}`,
                        },
                    });

                } else if (bet.status === 'lost') {
                    // LOSER ROLLBACK: Credit the bet amount back
                    const balanceBefore = bet.user.wallet_balance;
                    const balanceAfter = balanceBefore + bet.bet_amount;

                    await tx.user.update({
                        where: { id: bet.user_id },
                        data: {
                            wallet_balance: { increment: bet.bet_amount },
                            exposure: { increment: bet.bet_amount },
                        },
                    });

                    // Create ROLLBACK_CREDIT transaction
                    const txnId = generateTxnId(bet.user.user_id);
                    await tx.transaction.create({
                        data: {
                            txn_id: txnId,
                            user_id: bet.user_id,
                            type: 'ROLLBACK_CREDIT',
                            amount: bet.bet_amount,
                            direction: 'CREDIT',
                            balance_before: balanceBefore,
                            balance_after: balanceAfter,
                            performed_by: adminId,
                            reference: bet.bet_id,
                            reference_type: 'ROLLBACK',
                            notes: `Rollback: Bet amount returned for ${bet.bet_type} - ${bet.bet_number}`,
                        },
                    });
                }

                // 3. Reset bet status to 'pending'
                await tx.bet.update({
                    where: { id: bet.id },
                    data: {
                        status: 'pending',
                        win_amount: 0,
                        result_id: null,
                        settlement_id: null,
                        settled_at: null,
                        is_rolled_back: true,
                        rolled_back_at: new Date(),
                    },
                });
            }

            // 4. Reverse P/L records
            await PnLService.reversePnL(tx, result.game_id, result.date);

            // 5. Mark result as rolled back
            await tx.result.update({
                where: { id: resultId },
                data: {
                    is_settled: false,
                    is_rolled_back: true,
                    rolled_back_at: new Date(),
                    rolled_back_by: adminId,
                },
            });

            // 6. Update settlement record
            if (result.settlement) {
                await tx.settlement.update({
                    where: { id: result.settlement.id },
                    data: {
                        status: 'rolled_back',
                        rolled_back_at: new Date(),
                        rolled_back_by: adminId,
                    },
                });
            }

            // 7. Create admin action audit log
            await tx.adminAction.create({
                data: {
                    admin_id: adminId,
                    action_type: 'ROLLBACK_SETTLEMENT',
                    entity_type: 'RESULT',
                    entity_id: resultId,
                    notes: `Rolled back settlement for ${result.game.name} - ${result.session} on ${result.date}. ${settledBets.length} bets reversed.`,
                },
            });

            return {
                result_id: resultId,
                bets_reversed: settledBets.length,
                winners_reversed: settledBets.filter(b => b.status === 'won').length,
                losers_reversed: settledBets.filter(b => b.status === 'lost').length,
            };
        }, {
            timeout: 30000,
        });

        // ==========================================
        // REAL-TIME WEBSOCKET EVENTS (after transaction commits)
        // ==========================================

        // Broadcast rollback to all clients
        emitToAll(WS_EVENTS.ROLLBACK, {
            result_id: resultId,
            game_name: result.game.name,
            session: result.session,
            date: result.date,
        });

        // Notify admins
        emitToAdmins(WS_EVENTS.ROLLBACK, {
            result_id: resultId,
            game_name: result.game.name,
            session: result.session,
            bets_reversed: rollbackResult.bets_reversed,
        });

        // Send wallet updates to all affected users
        try {
            const affectedUserIds = Array.from(new Set(settledBetsForEmit.map(b => b.user_id)));
            const updatedUsers = await prisma.user.findMany({
                where: { id: { in: affectedUserIds } },
                select: { id: true, wallet_balance: true },
            });

            for (const user of updatedUsers) {
                emitToUser(user.id, WS_EVENTS.WALLET_UPDATE, {
                    balance: user.wallet_balance,
                });
            }
        } catch (err) {
            console.error('[WS] Failed to send rollback wallet updates:', err);
        }

        return rollbackResult;
    }

    /**
     * Get list of settled results available for rollback
     */
    static async getRollbackList() {
        const results = await prisma.result.findMany({
            where: {
                is_settled: true,
                is_rolled_back: false,
                is_deleted: false,
            },
            include: {
                game: { select: { name: true, slug: true } },
                settlement: {
                    select: {
                        total_bets: true,
                        total_payout: true,
                        net_pnl: true,
                        settled_at: true,
                    },
                },
            },
            orderBy: { declared_at: 'desc' },
            take: 50,
        });

        return results;
    }
}
