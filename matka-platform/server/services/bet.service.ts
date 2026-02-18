// server/services/bet.service.ts
// Bet Placement Service — Place bets, check balance, atomic operations
// RULE: Integer math ONLY. No negative balances. Window must be open.

import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { AppError } from '../utils/errors';
import { generateBetId, generateTxnId } from '../utils/idGenerator';
import { isValidBetNumber } from '../utils/calculation';
import { GameService } from './game.service';
import type { PlaceBetInput, BetListQuery } from '../validators/bet.schema';
import { emitToUser, emitBetStream } from '../socket/emitters';
import { WS_EVENTS } from '../socket/events';

// Prisma interactive transaction client type
type TxClient = Prisma.TransactionClient;

export class BetService {

    // ==========================================
    // PLACE BET (ATOMIC)
    // ==========================================

    /**
     * Place a bet — Validates everything, then atomically:
     * 1. Deducts balance
     * 2. Creates bet record
     * 3. Creates transaction record
     * 4. Updates exposure
     */
    static async placeBet(userId: number, userIdStr: string, data: PlaceBetInput) {
        const { game_id, bet_type, bet_number, session, amount } = data;

        // 1. Validate bet number format
        if (!isValidBetNumber(bet_type, bet_number)) {
            throw new AppError('VALIDATION_ERROR', `Invalid ${bet_type} number: ${bet_number}`);
        }

        // 2. Validate game exists and is active
        const game = await prisma.game.findUnique({ where: { id: game_id } });
        if (!game || game.is_deleted || !game.is_active) {
            throw new AppError('NOT_FOUND', 'Game not found or inactive');
        }

        // 3. Check betting window is open using game times (IST)
        const now = new Date();
        const istOffset = 5.5 * 60 * 60 * 1000; // IST = UTC+5:30
        const istNow = new Date(now.getTime() + istOffset);
        const [nowH, nowM] = [istNow.getUTCHours(), istNow.getUTCMinutes()];
        const nowMinutes = nowH * 60 + nowM;

        const toMinutes = (t: string) => {
            const [h, m] = t.split(':').map(Number);
            return h * 60 + m;
        };

        const openMin = toMinutes(game.open_time);
        const closeMin = toMinutes(game.close_time);
        const resultMin = toMinutes(game.result_time);

        let windowOpen = false;
        if (session === 'OPEN') {
            // OPEN session: between open_time and close_time
            windowOpen = nowMinutes >= openMin && nowMinutes < closeMin;
        } else {
            // CLOSE session: between close_time and result_time
            windowOpen = nowMinutes >= closeMin && nowMinutes < resultMin;
        }

        if (!windowOpen) {
            throw new AppError('BETTING_CLOSED', `Betting window for ${session} session is closed`);
        }

        // Today's date in IST (for bet record)
        const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

        // 4. Get payout multiplier (game-specific → global fallback)
        const multiplier = await GameService.getActiveMultiplier(game_id, bet_type);

        // 5. Atomic transaction: check balance → deduct → create bet → create txn → update exposure
        const result = await prisma.$transaction(async (tx: TxClient) => {
            // Check user balance
            const user = await tx.user.findUnique({
                where: { id: userId },
                select: { id: true, user_id: true, wallet_balance: true, is_blocked: true, is_deleted: true },
            });

            if (!user || user.is_deleted) {
                throw new AppError('ACCOUNT_NOT_FOUND');
            }

            if (user.is_blocked) {
                throw new AppError('ACCOUNT_BLOCKED', 'Your account is blocked');
            }

            if (user.wallet_balance < amount) {
                throw new AppError('WALLET_INSUFFICIENT_BALANCE', `Balance: ₹${user.wallet_balance}, Required: ₹${amount}`);
            }

            // Deduct balance
            const balanceBefore = user.wallet_balance;
            const balanceAfter = balanceBefore - amount;
            await tx.user.update({
                where: { id: userId },
                data: {
                    wallet_balance: balanceAfter,
                    exposure: { increment: amount },
                },
            });

            // Create bet record
            const betId = generateBetId(userIdStr);
            const bet = await tx.bet.create({
                data: {
                    bet_id: betId,
                    user_id: userId,
                    game_id,
                    bet_type: bet_type as 'SINGLE_AKDA' | 'SINGLE_PATTI' | 'DOUBLE_PATTI' | 'TRIPLE_PATTI' | 'JODI',
                    bet_number,
                    session: session as 'OPEN' | 'CLOSE',
                    bet_amount: amount,
                    payout_multiplier: multiplier,
                    potential_win: amount * multiplier,
                    status: 'pending',
                    date: today,
                },
            });

            // Create transaction record
            const txnId = generateTxnId(userIdStr);
            await tx.transaction.create({
                data: {
                    txn_id: txnId,
                    user_id: userId,
                    type: 'BET_PLACED',
                    amount,
                    direction: 'DEBIT',
                    balance_before: balanceBefore,
                    balance_after: balanceAfter,
                    performed_by: userId,
                    reference: betId,
                    reference_type: 'BET',
                    notes: `${bet_type} bet on ${game.name} - ${bet_number} (${session})`,
                },
            });

            return {
                bet: {
                    id: bet.id,
                    bet_id: bet.bet_id,
                    game_name: game.name,
                    bet_type: bet.bet_type,
                    bet_number: bet.bet_number,
                    session: bet.session,
                    amount: bet.bet_amount,
                    multiplier: bet.payout_multiplier,
                    potential_win: bet.potential_win,
                    status: bet.status,
                },
                balance_after: balanceAfter,
            };
        });

        // Real-time: notify user of balance change
        emitToUser(userId, WS_EVENTS.WALLET_UPDATE, {
            balance: result.balance_after,
        });

        // Real-time: stream bet to admin dashboard
        emitBetStream({
            bet_id: result.bet.bet_id,
            user_id: userIdStr,
            game_name: result.bet.game_name,
            bet_type: result.bet.bet_type,
            bet_number: result.bet.bet_number,
            session: result.bet.session,
            amount: result.bet.amount,
            potential_win: result.bet.potential_win,
            placed_at: new Date().toISOString(),
        });

        return result;
    }

    // ==========================================
    // GET USER BETS (paginated, filterable)
    // ==========================================

    static async getUserBets(userId: number, query: BetListQuery) {
        const page = query.page ?? 1;
        const limit = Math.min(query.limit ?? 20, 100);
        const skip = (page - 1) * limit;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const where: Record<string, any> = {
            user_id: userId,
        };

        if (query.game_id) where.game_id = query.game_id;
        if (query.status) where.status = query.status;
        if (query.date) where.date = query.date;
        if (query.bet_type) where.bet_type = query.bet_type;

        const [bets, total] = await Promise.all([
            prisma.bet.findMany({
                where,
                skip,
                take: limit,
                orderBy: { created_at: 'desc' },
                include: {
                    game: { select: { name: true, slug: true, color_code: true } },
                },
            }),
            prisma.bet.count({ where }),
        ]);

        return {
            bets,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    // ==========================================
    // GET TODAY'S BETS (shortcut)
    // ==========================================

    static async getUserBetsToday(userId: number) {
        const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

        const bets = await prisma.bet.findMany({
            where: {
                user_id: userId,
                date: today,
            },
            orderBy: { created_at: 'desc' },
            include: {
                game: { select: { name: true, slug: true, color_code: true } },
            },
        });

        // Calculate today's totals
        let totalStaked = 0;
        let totalWon = 0;
        let pendingCount = 0;

        for (const bet of bets) {
            totalStaked += bet.bet_amount;
            if (bet.status === 'won') {
                totalWon += bet.win_amount ?? 0;
            }
            if (bet.status === 'pending') {
                pendingCount++;
            }
        }

        return {
            bets,
            summary: {
                total_staked: totalStaked,
                total_won: totalWon,
                net_pnl: totalWon - totalStaked,
                pending_count: pendingCount,
                total_bets: bets.length,
            },
        };
    }

    // ==========================================
    // GET SINGLE BET
    // ==========================================

    static async getBetById(betId: number, userId: number) {
        const bet = await prisma.bet.findUnique({
            where: { id: betId },
            include: {
                game: { select: { name: true, slug: true, color_code: true } },
                result: {
                    select: {
                        open_panna: true,
                        open_single: true,
                        close_panna: true,
                        close_single: true,
                        jodi: true,
                    },
                },
            },
        });

        if (!bet || bet.user_id !== userId) {
            throw new AppError('NOT_FOUND', 'Bet not found');
        }

        return bet;
    }
}
