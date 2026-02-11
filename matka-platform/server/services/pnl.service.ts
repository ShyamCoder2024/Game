// server/services/pnl.service.ts
// P/L Cascade Service — Walk hierarchy chain, distribute commission
// Called by settlement engine after determining winners/losers

import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';

// Prisma transaction client type
type TxClient = Prisma.TransactionClient;

export class PnLService {

    /**
     * Walk the hierarchy chain from user up to admin
     * Returns array: [User's creator, Creator's creator, ..., Admin]
     */
    static async getHierarchyChain(userId: number, tx: TxClient) {
        const chain: Array<{
            id: number;
            user_id: string;
            role: string;
            deal_percentage: number;
            created_by: number | null;
        }> = [];

        let currentId: number | null = userId;
        const visited = new Set<number>();

        while (currentId !== null) {
            if (visited.has(currentId)) break; // Safety: prevent infinite loops
            visited.add(currentId);

            const user: { id: number; user_id: string; role: string; deal_percentage: number; created_by: number | null } | null = await tx.user.findUnique({
                where: { id: currentId },
                select: { id: true, user_id: true, role: true, deal_percentage: true, created_by: true },
            });

            if (!user) break;
            chain.push(user);
            currentId = user.created_by;
        }

        return chain;
    }

    /**
     * Cascade P/L through the hierarchy for a single bet
     * Called for each bet during settlement
     *
     * For a LOSING bet: The house gains the bet_amount
     * For a WINNING bet: The house loses the win_amount
     *
     * P/L is distributed up the chain based on deal percentages
     */
    static async cascadePnL(
        tx: TxClient,
        bet: {
            id: number;
            user_id: number;
            game_id: number;
            date: string;
            bet_amount: number;
            win_amount: number;
        },
        isWinner: boolean
    ) {
        // Get the hierarchy chain starting from the bet placer
        const chain = await this.getHierarchyChain(bet.user_id, tx);

        // Net amount from house perspective:
        // Loss = house gains bet_amount
        // Win = house loses (win_amount - bet_amount)
        const netForHouse = isWinner ? -(bet.win_amount - bet.bet_amount) : bet.bet_amount;

        // Walk the chain and update MemberPnl for each level
        for (let i = 0; i < chain.length; i++) {
            const member = chain[i];

            // Calculate this member's share of the P/L
            // Each member gets their deal_percentage of the net
            const memberShare = Math.round((netForHouse * member.deal_percentage) / 100);

            // Upsert MemberPnl record
            await tx.memberPnl.upsert({
                where: {
                    user_id_game_id_date: {
                        user_id: member.id,
                        game_id: bet.game_id,
                        date: bet.date,
                    },
                },
                update: {
                    pnl: { increment: memberShare },
                    total_bets_volume: { increment: bet.bet_amount },
                    total_bets_count: { increment: 1 },
                    winners_count: { increment: isWinner ? 1 : 0 },
                    losers_count: { increment: isWinner ? 0 : 1 },
                    total_payout: { increment: isWinner ? bet.win_amount : 0 },
                    commission_earned: { increment: Math.abs(memberShare) },
                },
                create: {
                    user_id: member.id,
                    game_id: bet.game_id,
                    date: bet.date,
                    pnl: memberShare,
                    total_bets_volume: bet.bet_amount,
                    total_bets_count: 1,
                    winners_count: isWinner ? 1 : 0,
                    losers_count: isWinner ? 0 : 1,
                    total_payout: isWinner ? bet.win_amount : 0,
                    commission_earned: Math.abs(memberShare),
                },
            });
        }
    }

    /**
     * Reverse P/L records for a game/date (used by rollback engine)
     */
    static async reversePnL(tx: TxClient, gameId: number, date: string) {
        await tx.memberPnl.updateMany({
            where: {
                game_id: gameId,
                date,
                is_rolled_back: false,
            },
            data: {
                is_rolled_back: true,
            },
        });
    }
}
