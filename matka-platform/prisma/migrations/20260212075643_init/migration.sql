-- CreateEnum
CREATE TYPE "Role" AS ENUM ('admin', 'supermaster', 'master', 'user');

-- CreateEnum
CREATE TYPE "BetType" AS ENUM ('SINGLE_AKDA', 'SINGLE_PATTI', 'DOUBLE_PATTI', 'TRIPLE_PATTI', 'JODI');

-- CreateEnum
CREATE TYPE "BetStatus" AS ENUM ('pending', 'won', 'lost', 'cancelled', 'rolled_back');

-- CreateEnum
CREATE TYPE "GameSession" AS ENUM ('OPEN', 'CLOSE', 'FULL');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('CREDIT_IN', 'CREDIT_OUT', 'BET_PLACED', 'BET_WON', 'BET_CANCELLED', 'WITHDRAWAL', 'ROLLBACK_DEBIT', 'ROLLBACK_CREDIT', 'LOAN_IN', 'LOAN_OUT', 'LOAN_REPAYMENT', 'MANUAL_ADJUSTMENT');

-- CreateEnum
CREATE TYPE "TransactionDirection" AS ENUM ('CREDIT', 'DEBIT');

-- CreateEnum
CREATE TYPE "SettlementStatus" AS ENUM ('completed', 'rolled_back');

-- CreateEnum
CREATE TYPE "LoanType" AS ENUM ('CREDIT_GIVEN', 'CREDIT_RETURNED', 'LOAN_GIVEN', 'LOAN_REPAID');

-- CreateEnum
CREATE TYPE "LoanStatus" AS ENUM ('active', 'partially_paid', 'fully_paid', 'written_off');

-- CreateEnum
CREATE TYPE "BackupStatus" AS ENUM ('in_progress', 'completed', 'failed');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "created_by" INTEGER,
    "wallet_balance" INTEGER NOT NULL DEFAULT 0,
    "deal_percentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "my_matka_share" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "agent_matka_share" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "matka_commission" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "credit_limit" INTEGER NOT NULL DEFAULT 0,
    "fix_limit" INTEGER NOT NULL DEFAULT 0,
    "exposure" INTEGER NOT NULL DEFAULT 0,
    "is_special" BOOLEAN NOT NULL DEFAULT false,
    "special_notes" TEXT,
    "is_blocked" BOOLEAN NOT NULL DEFAULT false,
    "blocked_at" TIMESTAMP(3),
    "blocked_by" INTEGER,
    "blocked_reason" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "last_login_at" TIMESTAMP(3),
    "last_login_ip" TEXT,
    "metadata" JSONB DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Game" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "open_time" TEXT NOT NULL,
    "close_time" TEXT NOT NULL,
    "result_time" TEXT NOT NULL,
    "color_code" TEXT NOT NULL DEFAULT '#3B82F6',
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Game_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayoutMultiplier" (
    "id" SERIAL NOT NULL,
    "game_id" INTEGER,
    "bet_type" "BetType" NOT NULL,
    "multiplier" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "changed_by" INTEGER,
    "changed_at" TIMESTAMP(3),
    "previous_multiplier" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PayoutMultiplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BettingWindow" (
    "id" SERIAL NOT NULL,
    "game_id" INTEGER NOT NULL,
    "date" TEXT NOT NULL,
    "session" "GameSession" NOT NULL DEFAULT 'FULL',
    "is_open" BOOLEAN NOT NULL DEFAULT true,
    "opens_at" TIMESTAMP(3) NOT NULL,
    "closes_at" TIMESTAMP(3) NOT NULL,
    "total_bets" INTEGER NOT NULL DEFAULT 0,
    "total_amount" INTEGER NOT NULL DEFAULT 0,
    "closed_manually" BOOLEAN NOT NULL DEFAULT false,
    "closed_by" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BettingWindow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bet" (
    "id" SERIAL NOT NULL,
    "bet_id" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "game_id" INTEGER NOT NULL,
    "date" TEXT NOT NULL,
    "session" "GameSession" NOT NULL,
    "bet_type" "BetType" NOT NULL,
    "bet_number" TEXT NOT NULL,
    "bet_amount" INTEGER NOT NULL,
    "payout_multiplier" INTEGER NOT NULL,
    "potential_win" INTEGER NOT NULL,
    "status" "BetStatus" NOT NULL DEFAULT 'pending',
    "win_amount" INTEGER NOT NULL DEFAULT 0,
    "result_id" INTEGER,
    "settlement_id" INTEGER,
    "settled_at" TIMESTAMP(3),
    "is_rolled_back" BOOLEAN NOT NULL DEFAULT false,
    "rolled_back_at" TIMESTAMP(3),
    "window_id" INTEGER,
    "placed_ip" TEXT,
    "metadata" JSONB DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Bet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Result" (
    "id" SERIAL NOT NULL,
    "game_id" INTEGER NOT NULL,
    "date" TEXT NOT NULL,
    "session" "GameSession" NOT NULL,
    "open_panna" TEXT,
    "open_single" INTEGER,
    "close_panna" TEXT,
    "close_single" INTEGER,
    "jodi" TEXT,
    "declared_by" INTEGER NOT NULL,
    "declared_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_settled" BOOLEAN NOT NULL DEFAULT false,
    "settled_at" TIMESTAMP(3),
    "is_rolled_back" BOOLEAN NOT NULL DEFAULT false,
    "rolled_back_at" TIMESTAMP(3),
    "rolled_back_by" INTEGER,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),
    "metadata" JSONB DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Result_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" SERIAL NOT NULL,
    "txn_id" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "type" "TransactionType" NOT NULL,
    "amount" INTEGER NOT NULL,
    "direction" "TransactionDirection" NOT NULL,
    "balance_before" INTEGER NOT NULL,
    "balance_after" INTEGER NOT NULL,
    "reference" TEXT,
    "reference_type" TEXT,
    "performed_by" INTEGER,
    "notes" TEXT,
    "metadata" JSONB DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MemberPnl" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "game_id" INTEGER NOT NULL,
    "date" TEXT NOT NULL,
    "pnl" INTEGER NOT NULL DEFAULT 0,
    "total_bets_volume" INTEGER NOT NULL DEFAULT 0,
    "total_bets_count" INTEGER NOT NULL DEFAULT 0,
    "winners_count" INTEGER NOT NULL DEFAULT 0,
    "losers_count" INTEGER NOT NULL DEFAULT 0,
    "total_payout" INTEGER NOT NULL DEFAULT 0,
    "commission_earned" INTEGER NOT NULL DEFAULT 0,
    "is_rolled_back" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MemberPnl_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Settlement" (
    "id" SERIAL NOT NULL,
    "result_id" INTEGER NOT NULL,
    "game_id" INTEGER NOT NULL,
    "date" TEXT NOT NULL,
    "session" "GameSession" NOT NULL,
    "total_bets" INTEGER NOT NULL DEFAULT 0,
    "total_bet_amount" INTEGER NOT NULL DEFAULT 0,
    "winners_count" INTEGER NOT NULL DEFAULT 0,
    "losers_count" INTEGER NOT NULL DEFAULT 0,
    "total_payout" INTEGER NOT NULL DEFAULT 0,
    "net_pnl" INTEGER NOT NULL DEFAULT 0,
    "status" "SettlementStatus" NOT NULL DEFAULT 'completed',
    "settled_by" INTEGER NOT NULL,
    "settled_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rolled_back_at" TIMESTAMP(3),
    "rolled_back_by" INTEGER,
    "duration_ms" INTEGER,
    "metadata" JSONB DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Settlement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SettlementEntry" (
    "id" SERIAL NOT NULL,
    "settlement_id" INTEGER NOT NULL,
    "bet_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "outcome" TEXT NOT NULL,
    "bet_amount" INTEGER NOT NULL,
    "win_amount" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SettlementEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreditLoan" (
    "id" SERIAL NOT NULL,
    "loan_id" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "given_by" INTEGER NOT NULL,
    "type" "LoanType" NOT NULL,
    "amount" INTEGER NOT NULL,
    "outstanding" INTEGER NOT NULL,
    "status" "LoanStatus" NOT NULL DEFAULT 'active',
    "notes" TEXT,
    "metadata" JSONB DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CreditLoan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Announcement" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "starts_at" TIMESTAMP(3),
    "ends_at" TIMESTAMP(3),
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_by" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Banner" (
    "id" SERIAL NOT NULL,
    "image_url" TEXT NOT NULL,
    "title" TEXT,
    "link_url" TEXT,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Banner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RulesContent" (
    "id" SERIAL NOT NULL,
    "content" TEXT NOT NULL,
    "updated_by" INTEGER NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RulesContent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppSetting" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'general',
    "description" TEXT,
    "updated_by" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminAction" (
    "id" SERIAL NOT NULL,
    "admin_id" INTEGER NOT NULL,
    "action_type" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" INTEGER,
    "old_value" TEXT,
    "new_value" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoginLog" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "success" BOOLEAN NOT NULL,
    "ip_address" TEXT NOT NULL,
    "user_agent" TEXT,
    "failure_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoginLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DbBackup" (
    "id" SERIAL NOT NULL,
    "filename" TEXT NOT NULL,
    "s3_url" TEXT,
    "size_bytes" INTEGER NOT NULL DEFAULT 0,
    "status" "BackupStatus" NOT NULL,
    "triggered_by" INTEGER NOT NULL,
    "error_message" TEXT,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DbBackup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlockedBet" (
    "id" SERIAL NOT NULL,
    "game_id" INTEGER,
    "bet_type" "BetType",
    "is_blocked" BOOLEAN NOT NULL DEFAULT true,
    "blocked_by" INTEGER NOT NULL,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BlockedBet_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_user_id_key" ON "User"("user_id");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_created_by_idx" ON "User"("created_by");

-- CreateIndex
CREATE INDEX "User_is_blocked_idx" ON "User"("is_blocked");

-- CreateIndex
CREATE INDEX "User_is_special_idx" ON "User"("is_special");

-- CreateIndex
CREATE INDEX "User_role_is_blocked_is_deleted_idx" ON "User"("role", "is_blocked", "is_deleted");

-- CreateIndex
CREATE INDEX "User_user_id_idx" ON "User"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "Game_name_key" ON "Game"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Game_slug_key" ON "Game"("slug");

-- CreateIndex
CREATE INDEX "Game_is_active_idx" ON "Game"("is_active");

-- CreateIndex
CREATE INDEX "Game_display_order_idx" ON "Game"("display_order");

-- CreateIndex
CREATE INDEX "PayoutMultiplier_game_id_bet_type_is_active_idx" ON "PayoutMultiplier"("game_id", "bet_type", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "PayoutMultiplier_game_id_bet_type_key" ON "PayoutMultiplier"("game_id", "bet_type");

-- CreateIndex
CREATE INDEX "BettingWindow_is_open_closes_at_idx" ON "BettingWindow"("is_open", "closes_at");

-- CreateIndex
CREATE INDEX "BettingWindow_game_id_date_idx" ON "BettingWindow"("game_id", "date");

-- CreateIndex
CREATE INDEX "BettingWindow_date_idx" ON "BettingWindow"("date");

-- CreateIndex
CREATE UNIQUE INDEX "BettingWindow_game_id_date_session_key" ON "BettingWindow"("game_id", "date", "session");

-- CreateIndex
CREATE UNIQUE INDEX "Bet_bet_id_key" ON "Bet"("bet_id");

-- CreateIndex
CREATE INDEX "Bet_game_id_date_status_idx" ON "Bet"("game_id", "date", "status");

-- CreateIndex
CREATE INDEX "Bet_user_id_date_idx" ON "Bet"("user_id", "date");

-- CreateIndex
CREATE INDEX "Bet_user_id_status_idx" ON "Bet"("user_id", "status");

-- CreateIndex
CREATE INDEX "Bet_result_id_idx" ON "Bet"("result_id");

-- CreateIndex
CREATE INDEX "Bet_settlement_id_idx" ON "Bet"("settlement_id");

-- CreateIndex
CREATE INDEX "Bet_date_status_idx" ON "Bet"("date", "status");

-- CreateIndex
CREATE INDEX "Bet_created_at_idx" ON "Bet"("created_at" DESC);

-- CreateIndex
CREATE INDEX "Result_game_id_date_idx" ON "Result"("game_id", "date");

-- CreateIndex
CREATE INDEX "Result_date_is_deleted_idx" ON "Result"("date", "is_deleted");

-- CreateIndex
CREATE INDEX "Result_is_settled_is_rolled_back_idx" ON "Result"("is_settled", "is_rolled_back");

-- CreateIndex
CREATE UNIQUE INDEX "Result_game_id_date_session_key" ON "Result"("game_id", "date", "session");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_txn_id_key" ON "Transaction"("txn_id");

-- CreateIndex
CREATE INDEX "Transaction_user_id_created_at_idx" ON "Transaction"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "Transaction_type_idx" ON "Transaction"("type");

-- CreateIndex
CREATE INDEX "Transaction_reference_idx" ON "Transaction"("reference");

-- CreateIndex
CREATE INDEX "Transaction_performed_by_idx" ON "Transaction"("performed_by");

-- CreateIndex
CREATE INDEX "Transaction_created_at_idx" ON "Transaction"("created_at" DESC);

-- CreateIndex
CREATE INDEX "MemberPnl_user_id_date_idx" ON "MemberPnl"("user_id", "date");

-- CreateIndex
CREATE INDEX "MemberPnl_game_id_date_idx" ON "MemberPnl"("game_id", "date");

-- CreateIndex
CREATE INDEX "MemberPnl_date_idx" ON "MemberPnl"("date");

-- CreateIndex
CREATE UNIQUE INDEX "MemberPnl_user_id_game_id_date_key" ON "MemberPnl"("user_id", "game_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "Settlement_result_id_key" ON "Settlement"("result_id");

-- CreateIndex
CREATE INDEX "Settlement_game_id_date_idx" ON "Settlement"("game_id", "date");

-- CreateIndex
CREATE INDEX "Settlement_status_idx" ON "Settlement"("status");

-- CreateIndex
CREATE INDEX "SettlementEntry_settlement_id_idx" ON "SettlementEntry"("settlement_id");

-- CreateIndex
CREATE INDEX "SettlementEntry_user_id_created_at_idx" ON "SettlementEntry"("user_id", "created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "CreditLoan_loan_id_key" ON "CreditLoan"("loan_id");

-- CreateIndex
CREATE INDEX "CreditLoan_user_id_status_idx" ON "CreditLoan"("user_id", "status");

-- CreateIndex
CREATE INDEX "CreditLoan_given_by_idx" ON "CreditLoan"("given_by");

-- CreateIndex
CREATE INDEX "Announcement_is_active_starts_at_ends_at_idx" ON "Announcement"("is_active", "starts_at", "ends_at");

-- CreateIndex
CREATE INDEX "Banner_is_active_display_order_idx" ON "Banner"("is_active", "display_order");

-- CreateIndex
CREATE UNIQUE INDEX "AppSetting_key_key" ON "AppSetting"("key");

-- CreateIndex
CREATE INDEX "AdminAction_admin_id_created_at_idx" ON "AdminAction"("admin_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "AdminAction_entity_type_entity_id_idx" ON "AdminAction"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "AdminAction_action_type_idx" ON "AdminAction"("action_type");

-- CreateIndex
CREATE INDEX "AdminAction_created_at_idx" ON "AdminAction"("created_at" DESC);

-- CreateIndex
CREATE INDEX "LoginLog_user_id_created_at_idx" ON "LoginLog"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "LoginLog_ip_address_created_at_idx" ON "LoginLog"("ip_address", "created_at" DESC);

-- CreateIndex
CREATE INDEX "LoginLog_success_created_at_idx" ON "LoginLog"("success", "created_at" DESC);

-- CreateIndex
CREATE INDEX "BlockedBet_game_id_bet_type_is_blocked_idx" ON "BlockedBet"("game_id", "bet_type", "is_blocked");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_blocked_by_fkey" FOREIGN KEY ("blocked_by") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayoutMultiplier" ADD CONSTRAINT "PayoutMultiplier_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "Game"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayoutMultiplier" ADD CONSTRAINT "PayoutMultiplier_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BettingWindow" ADD CONSTRAINT "BettingWindow_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BettingWindow" ADD CONSTRAINT "BettingWindow_closed_by_fkey" FOREIGN KEY ("closed_by") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bet" ADD CONSTRAINT "Bet_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bet" ADD CONSTRAINT "Bet_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bet" ADD CONSTRAINT "Bet_result_id_fkey" FOREIGN KEY ("result_id") REFERENCES "Result"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bet" ADD CONSTRAINT "Bet_settlement_id_fkey" FOREIGN KEY ("settlement_id") REFERENCES "Settlement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bet" ADD CONSTRAINT "Bet_window_id_fkey" FOREIGN KEY ("window_id") REFERENCES "BettingWindow"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Result" ADD CONSTRAINT "Result_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Result" ADD CONSTRAINT "Result_declared_by_fkey" FOREIGN KEY ("declared_by") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Result" ADD CONSTRAINT "Result_rolled_back_by_fkey" FOREIGN KEY ("rolled_back_by") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberPnl" ADD CONSTRAINT "MemberPnl_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberPnl" ADD CONSTRAINT "MemberPnl_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Settlement" ADD CONSTRAINT "Settlement_result_id_fkey" FOREIGN KEY ("result_id") REFERENCES "Result"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Settlement" ADD CONSTRAINT "Settlement_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Settlement" ADD CONSTRAINT "Settlement_settled_by_fkey" FOREIGN KEY ("settled_by") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Settlement" ADD CONSTRAINT "Settlement_rolled_back_by_fkey" FOREIGN KEY ("rolled_back_by") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SettlementEntry" ADD CONSTRAINT "SettlementEntry_settlement_id_fkey" FOREIGN KEY ("settlement_id") REFERENCES "Settlement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SettlementEntry" ADD CONSTRAINT "SettlementEntry_bet_id_fkey" FOREIGN KEY ("bet_id") REFERENCES "Bet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SettlementEntry" ADD CONSTRAINT "SettlementEntry_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditLoan" ADD CONSTRAINT "CreditLoan_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditLoan" ADD CONSTRAINT "CreditLoan_given_by_fkey" FOREIGN KEY ("given_by") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Banner" ADD CONSTRAINT "Banner_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RulesContent" ADD CONSTRAINT "RulesContent_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminAction" ADD CONSTRAINT "AdminAction_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoginLog" ADD CONSTRAINT "LoginLog_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DbBackup" ADD CONSTRAINT "DbBackup_triggered_by_fkey" FOREIGN KEY ("triggered_by") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlockedBet" ADD CONSTRAINT "BlockedBet_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "Game"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlockedBet" ADD CONSTRAINT "BlockedBet_blocked_by_fkey" FOREIGN KEY ("blocked_by") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
