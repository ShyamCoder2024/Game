# Backend Audit Report
This document provides a comprehensive, file-by-file functional audit of the Matka platform backend architecture.

## 1. Database & ORM
**`prisma/schema.prisma`**
- **Purpose:** Defines the complete relational database schema.
- **Models:** `User` (handles hierarchy, balances, shares), `Game` (handles match timings, colors, statuses), `Bet` (tracks individual wagers), `Result` (winning numbers), `Transaction` (wallet ledger), `Settlement` (tracks payout rollbacks/events), `Announcement`, `Banner`, `Notification`, and `PlatformSetting`.
- **Audit Findings:** The schema heavily relies on Enums (`Role`, `BetType`, `TransactionType`, `GameStatus`) ensuring strict database-level integrity. The `parent_user_id` self-referencing relationship in `User` successfully establishes the Supermaster -> Master -> User tree.

**`prisma/seed.ts`**
- **Purpose:** Populates the database with initial required records upon instantiation.
- **Audit Findings:** Creates the default Admin login, inserts default "Global Multipliers" for the 5 bet types, and hardcodes initial platform settings (e.g., minimum bet, WhatsApp number).

## 2. API Routes (`server/routes/`)
Routes rely on Fastify and enforce request typing using Zod schema pre-handlers.

- **`admin.routes.ts`**: Handles dashboard metrics and system-wide admin overrides.
- **`auth.routes.ts`**: JWT login generation and password change logic for all users.
- **`banner.routes.ts`**: CRUD operations for the image carousel displayed on the user homepage.
- **`bet.routes.ts`**: Contains `/bets/place` logic (receives type, amount, number, and game ID).
- **`credit.routes.ts` / `wallet.routes.ts`**: `/credit` and `/debit` endpoints managing hierarchical coin transfers.
- **`export.routes.ts` / `report.routes.ts`**: Generates CSV/PDF exports for admin and master statement ledgers.
- **`game.routes.ts`**: CRUD operations for Game objects (create, update, toggle active status, manage holidays).
- **`leader.routes.ts`**: Dedicated to creating hierarchical accounts (Masters, Supermasters, Special Masters).
- **`notification.routes.ts`**: Push notification broadcast triggers.
- **`result.routes.ts`**: Endpoints to declare wins and retrieve previous results (`/results/today`).
- **`settlement.routes.ts`**: Triggers atomic payouts and manages result rollbacks.
- **`user.routes.ts`**: Fetches user-specific profile data, ledgers, and active bet limits.
- **`index.ts`**: The main router registry that aggregates all the route families with proper URL prefixes.

## 3. Core Business Services (`server/services/`)
Decoupled class functions executing business logic independent of Fastify request/response overhead.

- **`admin.service.ts` / `dashboard.service.ts`**: Aggregates total PNL, active users, and transaction volume for the admin landing page.
- **`auth.service.ts`**: Encrypts/decrypts passwords. Generates JWTs containing `user_id` and `role`. Extracts session data.
- **`bet.service.ts`**: Validates a user's wallet balance against the wager, inserts the pending `Bet` record, and triggers the `wallet.service` to deduct funds.
- **`content.service.ts`**: Retrieves rules, banners, and announcements.
- **`credit.service.ts` / `wallet.service.ts`**: Wrapped heavily in Prisma `$transaction`. Critical for preventing negative balances during simultaneous network requests (double-spend protection). Emits socket events updating user interfaces live.
- **`game.service.ts`**: Validates times, overrides global multipliers automatically, manages automatic status toggling based on current time thresholds.
- **`leader.service.ts`**: Handles the complex math limits when creating a sub-agent. Evaluates `my_matka_share` vs `agent_matka_share` to ensure children do not exceed master boundaries.
- **`liveReport.service.ts`**: Calculates combined real-time exposure algorithms for admins to track system liabilities on active bets before result declaration.
- **`pnl.service.ts` / `report.service.ts`**: Cascades up the hierarchy to determine what percentage of a user's loss/win is eaten by the Master vs the Supermaster vs the Admin.
- **`result.service.ts`**: Calculates exact panna and jodi algorithmic strings from declared inputs.
- **`rollback.service.ts` / `settlement.service.ts`**: The most complex service. Operates atomic DB transactions to loop over all `PENDING` bets, calculate win amounts using `multiplier`, create `CREDIT` transactions for winners, update bet statuses to `WON`/`LOST`, and emit to real-time `BET_WON` websocket rooms. Rollback reverses this entire flow.

## 4. Input Validators (`server/validators/`)
Zod schema guards mapping to frontend payloads.

- **`game.schema.ts`**: Validates open/close times as HH:mm. *(Audit Note: Frontend mismatch exists here rendering creation unverified in UI payloads).*
- **`leader.schema.ts`**: Validates roles and enforces 0-100 limits on share percentages.
- **`wallet.schema.ts`**: Enforces strictly positive integers to prevent negative amount payload attacks.
- **`result.schema.ts`**: Demands exact 3-digit Panna payload for result generation.

## 5. WebSockets (`server/socket/index.ts`)
- **Adapter**: Uses Redis (`@socket.io/redis-adapter`) to allow horizontal scaling.
- **Auth Middleware**: Intercepts `socket.handshake.auth.token` to reject unauthenticated websocket consumers.
- **Rooms Structure**: Dynamically assigns connections into `ROOMS.user(id)`, `ROOMS.role(role)`, and `ROOMS.game(id)`.
- **Audit Findings**: The logic is extremely secure. Users only receive `WALLET_UPDATE` and `BET_WON` payloads implicitly tagged to their explicit single-user room. Only admins join `ADMIN_BET_STREAM` preventing standard users from sniffing global betting volumes.
