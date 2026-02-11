// server/services/settlement.service.ts
// Settlement Engine — THE MOST CRITICAL service
// Determines winners/losers, credits winners, creates settlement records
// Called automatically when a result is declared

import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { AppError } from '../utils/errors';
import { generateTxnId } from '../utils/idGenerator';
import { checkWinner } from '../utils/calculation';
import { PnLService } from './pnl.service';

// Prisma transaction client type
type TxClient = Prisma.TransactionClient;

interface DeclaredResult {
    open_panna?: string | null;
    open_single?: number | null;
    close_panna?: string | null;
    close_single?: number | null;
    jodi?: string | null;
}

export class SettlementService {

    /**
     * Settle all pending bets for a game/session after result declaration
     * This runs inside a single Prisma transaction for atomicity
     */
    static async settleGame(
        resultId: number,
        gameId: number,
        date: string,
        session: string,
        result: DeclaredResult,
        settledBy: number
    ) {
        const startTime = Date.now();

        return await prisma.$transaction(async (tx: TxClient) => {

            // 1. Fetch all pending bets for this game/date/session
            const pendingBets = await tx.bet.findMany({
                where: {
                    game_id: gameId,
                    date,
                    session: session as 'OPEN' | 'CLOSE',
                    status: 'pending',
                },
                include: {
                    user: { select: { id: true, user_id: true, wallet_balance: true } },
                },
            });

            if (pendingBets.length === 0) {
                // No bets to settle — still create settlement record
                const settlement = await tx.settlement.create({
                    data: {
                        result_id: resultId,
                        game_id: gameId,
                        date,
                        session: session as 'OPEN' | 'CLOSE',
                        total_bets: 0,
                        total_bet_amount: 0,
                        winners_count: 0,
                        losers_count: 0,
                        total_payout: 0,
                        net_pnl: 0,
                        settled_by: settledBy,
                        duration_ms: Date.now() - startTime,
                    },
                });
                return settlement;
            }

            // 2. Process each bet
            let winnersCount = 0;
            let losersCount = 0;
            let totalBetAmount = 0;
            let totalPayout = 0;
            const settlementEntries: Array<{
                bet_id: number;
                user_id: number;
                outcome: string;
                bet_amount: number;
                win_amount: number;
            }> = [];

            for (const bet of pendingBets) {
                totalBetAmount += bet.bet_amount;

                const isWinner = checkWinner(
                    bet.bet_type,
                    bet.bet_number,
                    bet.session,
                    result
                );

                if (isWinner) {
                    winnersCount++;
                    const winAmount = bet.bet_amount * bet.payout_multiplier;
                    totalPayout += winAmount;

                    // Credit winner's wallet
                    await tx.user.update({
                        where: { id: bet.user_id },
                        data: {
                            wallet_balance: { increment: winAmount },
                            exposure: { decrement: bet.bet_amount },
                        },
                    });

                    // Create WIN transaction
                    const txnId = generateTxnId(bet.user.user_id);
                    await tx.transaction.create({
                        data: {
                            txn_id: txnId,
                            user_id: bet.user_id,
                            type: 'BET_WON',
                            amount: winAmount,
                            direction: 'CREDIT',
                            balance_before: bet.user.wallet_balance,
                            balance_after: bet.user.wallet_balance + winAmount,
                            performed_by: settledBy,
                            reference: bet.bet_id,
                            reference_type: 'SETTLEMENT',
                            notes: `Won ₹${winAmount} on ${bet.bet_type} - ${bet.bet_number}`,
                        },
                    });

                    // Update bet status
                    await tx.bet.update({
                        where: { id: bet.id },
                        data: {
                            status: 'won',
                            win_amount: winAmount,
                            result_id: resultId,
                            settled_at: new Date(),
                        },
                    });

                    // Cascade P/L for winner
                    await PnLService.cascadePnL(tx, {
                        id: bet.id,
                        user_id: bet.user_id,
                        game_id: gameId,
                        date,
                        bet_amount: bet.bet_amount,
                        win_amount: winAmount,
                    }, true);

                    settlementEntries.push({
                        bet_id: bet.id,
                        user_id: bet.user_id,
                        outcome: 'won',
                        bet_amount: bet.bet_amount,
                        win_amount: winAmount,
                    });

                } else {
                    losersCount++;

                    // Loser: reduce exposure (balance already deducted at bet time)
                    await tx.user.update({
                        where: { id: bet.user_id },
                        data: {
                            exposure: { decrement: bet.bet_amount },
                        },
                    });

                    // Update bet status
                    await tx.bet.update({
                        where: { id: bet.id },
                        data: {
                            status: 'lost',
                            win_amount: 0,
                            result_id: resultId,
                            settled_at: new Date(),
                        },
                    });

                    // Cascade P/L for loser
                    await PnLService.cascadePnL(tx, {
                        id: bet.id,
                        user_id: bet.user_id,
                        game_id: gameId,
                        date,
                        bet_amount: bet.bet_amount,
                        win_amount: 0,
                    }, false);

                    settlementEntries.push({
                        bet_id: bet.id,
                        user_id: bet.user_id,
                        outcome: 'lost',
                        bet_amount: bet.bet_amount,
                        win_amount: 0,
                    });
                }
            }

            // 3. Create Settlement record
            const netPnl = totalBetAmount - totalPayout; // House perspective
            const settlement = await tx.settlement.create({
                data: {
                    result_id: resultId,
                    game_id: gameId,
                    date,
                    session: session as 'OPEN' | 'CLOSE',
                    total_bets: pendingBets.length,
                    total_bet_amount: totalBetAmount,
                    winners_count: winnersCount,
                    losers_count: losersCount,
                    total_payout: totalPayout,
                    net_pnl: netPnl,
                    settled_by: settledBy,
                    duration_ms: Date.now() - startTime,
                },
            });

            // 4. Create SettlementEntry records
            for (const entry of settlementEntries) {
                await tx.settlementEntry.create({
                    data: {
                        settlement_id: settlement.id,
                        bet_id: entry.bet_id,
                        user_id: entry.user_id,
                        outcome: entry.outcome,
                        bet_amount: entry.bet_amount,
                        win_amount: entry.win_amount,
                    },
                });
            }

            // 5. Update bets with settlement_id
            await tx.bet.updateMany({
                where: {
                    id: { in: pendingBets.map(b => b.id) },
                },
                data: {
                    settlement_id: settlement.id,
                },
            });

            // 6. Mark result as settled
            await tx.result.update({
                where: { id: resultId },
                data: {
                    is_settled: true,
                    settled_at: new Date(),
                },
            });

            return settlement;
        }, {
            timeout: 30000, // 30 seconds for complex settlements
        });
    }
}
