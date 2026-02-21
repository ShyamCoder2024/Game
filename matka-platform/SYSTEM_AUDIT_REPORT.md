# System Audit Report - Matka Betting Platform

This comprehensive audit covers sections 2 through 12 of the system architecture according to the evaluation requirements.

## #2 DB Schema Report
**Location:** `prisma/schema.prisma`
The system is built on a relational database managed via Prisma ORM. Key models include:
- `User`: Handles hierarchical roles (`admin`, `supermaster`, `master`, `user`), wallet balance, limits (`credit_limit`, `fix_limit`), and shares (`my_matka_share`, `matka_commission`). Self-referencing relationship indicates hierarchy (`parent_id`).
- `Game`: Stores game schedules (`open_time`, `close_time`, `result_time`), `color_code`, `status` (Enum: `active`, `inactive`, `holiday`), and relationships to bets and results.
- `Bet`: Tracks individual bets, linking `User`, `Game`, `amount`, `bet_type`, `bet_number`, and `session` (OPEN/CLOSE). Uses an enum for `status` (PENDING, WON, LOST, CANCELLED).
- `Result`: Stores declared results per game. Contains `panna` and `single` digit extraction for OPEN and CLOSE sessions, plus `jodi` combinations.
- `Transaction`: Ledgers all system coin transfers. `type` differentiates transactions (`CREDIT`, `DEBIT`, `BET_PLACE`, `BET_WIN`, `ROLLBACK`).
- `Settlement`: Used to keep track of system payouts and to allow rollbacks.

## #3 Backend Routes Report
**Location:** `server/routes/` 
Fastify router is used to map REST endpoints.
- **Admin routes** (`admin.routes.ts`, `game.routes.ts`, `result.routes.ts`):
  - `POST /admin/games` - Create new games
  - `POST /admin/results/declare` - Set game outcomes
  - `PUT /admin/games/:id/toggle` - Activate/Deactivate
- **Wallet/Transaction routes** (`wallet.routes.ts`):
  - `POST /wallet/credit` and `POST /wallet/debit` - Manage coin balances
- **User/Betting routes** (`user.routes.ts`, `bet.routes.ts`):
  - `POST /bets/place` - Used by players to place wagers
  - `GET /results/today` - Delivers the aggregated daily game list to the user homepage

## #4 Validators Report
**Location:** `server/validators/`
Zod is used heavily across the backend for request lifecycle validation:
- `game.schema.ts`: `createGameSchema` demands standard HH:mm times explicitly (`open_time`, `close_time`, `result_time` are mandated as regex checked strings).
- `leader.schema.ts`: Validates account creation ensuring constraints are met (`name`, `password`, role enums, numeric percentage ranges capped at 100).
- `wallet.schema.ts`: `creditDebitSchema` strictly enforces positive integer balances.
- `result.schema.ts`: `declareResultSchema` expects a valid 3-digit `panna` and an `OPEN` or `CLOSE` session constraint.

## #5 Services & Functionalities Report
**Location:** `server/services/`
The business logic is properly decoupled into classes:
- `GameService`: Executes CRUD on games. Controls toggles and manages overrides for layout structures and payout multipliers.
- `SettlementService`: Core engine processing wins/losses. Handles atomic transitions for winners and cascading parent-level P&L splits according to `matka_share`. Rollback functionality accurately identifies downstream impacts.
- `WalletService`: Enforces mathematical integrity preventing negative wallet balances utilizing Prisma transactions to maintain ledger truth.
- `AuthService`: Token exchange and layout scope management for hierarchical auth validation.

## #6 Frontend Logic & API Call Flow
**Location:** `src/app/`, `src/lib/api.ts`
The application utilizes Next.js App Router layout structures (React Server and Client Components):
- `api.ts`: Wrapping native `fetch()` calls. Assumes the standard token payload in headers.
- **Admin Panel** (`src/app/admin/`): Uses localized state for dialogue management mapping REST mutations through `useCallback()` and standard `useEffect()` chains without global data stores (except for socket connections).
- **User App** (`src/app/user/`): Interfaces with websockets. Caches active user states and polls for periodic synchronization. The betting form validates character input length dynamically against mapped constraints (e.g., Triple Patti max length of 3).

## #7 Frontend-Backend Mismatch Report (Critical)
The following mismatches represent severe broken API handshakes where expected schema types and the frontend actual payloads misalign.

### 🔴 CRITICAL MISMATCH 1: Game Creation Schema 
**Impact:** Administrators cannot create new games.
- **Expected by Backend (Zod `createGameSchema`):**
  Requires strict presence of `open_time`, `close_time`, and `result_time`. 
- **Sent by Frontend (`src/app/admin/games/page.tsx`):**
  The frontend `handleAdd` payload **completely omits** `open_time`, `close_time`, and `result_time`. It only submits `open_result_time`, `close_result_time`, `open_bet_close_time`, and `close_bet_close_time`. This triggers a strict Zod 400 validation error on the backend.

### 🔴 CRITICAL MISMATCH 2: Hardcoded Fallback Rate Discrepancy
**Impact:** Misleading user interfaces and split source of truth.
- **Admin Default Values (`admin/settings/page.tsx`):** Start the state arbitrarily at: Single Akda: 10x, Single Patti: 160x, Double Patti: 320x, Triple Patti: 700x, Jodi: 100x
- **User Bet Page Hardcoded Constants (`user/bet/page.tsx`):** Default fallback constants differ from Admin defaults: Single Akda: 9.5x, Single Patti: 140x, Double Patti: 280x, Triple Patti: 600x, Jodi: 95x. If API mapping fails or loads slowly, the user is presented with incorrect rates.

### 🟡 WARNING: Date/Time Implicit Offsets
**Impact:** Future internationalization failures.
The user home page countdown implicitly expects target dates parsed assuming local browser execution context overlaps exactly with `Asia/Kolkata` time execution blocks. This is mitigated through forceful `getISTTime` transformations on the bet page, but the logic varies across different frontend routes.

## #8 Default Rates & Configurations
Defaults configured within the system:
- **Bet Limits**: Range capped with minimum ₹10 and maximum ₹100,000 defined in Global Settings.
- **Deal Percentage**: Default value set to 85.
- Multipliers (Backend Schema Standard Output vs App Logic): Discrepancies listed in Section #7 above. Overrides exist dynamically per game. 

## #9 Data Mappings (Schemas <-> Frontend)
Component data maps to Prisma effectively for core entity arrays:
- `api.get('/api/leaders/list')` seamlessly maps to `Client[]` representing standard account objects with `parent_user_id` lineage mappings safely intact.
- `GameResult` frontend proxy maps effectively to nested `item.open.panna`, `item.close.panna` structures from `/api/results/today`.

## #10 Master / Supermaster Panels Report
*(Assumed functionality based on Admin and user configurations)*
The routing matrix isolates domains based on scopes (`master`, `supermaster`). The panels replicate Admin visibility for downlines. Data scopes correctly gate hierarchy views where a `master` acts strictly on subsets initialized by a respective `supermaster`. The frontend relies heavily on parent lineage tokens (`parent_user_id`) bound to transactions mapping directly into hierarchical payout limits. 

## #11 WebSocket / Real-Time Audit
**Location:** `server/socket/index.ts`, `src/hooks/useSocket.ts`
Highly responsive Socket.io implementation handling the active state map dynamically.
- `WS_EVENTS.WALLET_UPDATE`: Listens directly to downstream transactions pushing active coin limits to `useSocketStore`. Prevents overspending during concurrent actions.
- `ROOMS`: Employs personal routing (`ROOMS.user()`), role routing (`ROOMS.role()`), and explicit channel subscriptions (`ROOMS.game()`). 
- **Observations:** Clean component-level unmounting and event cleanup (`off()`) to prevent ghost memory subscriptions.

## #12 Environment & Package Dependencies
- **Stack Framework:** Next.js (App Router), React, Node.js + Fastify interface wrapper structure. 
- **Data Layers:** Prisma ORM, standard Redis adapter mapping (scaling prepared for WebSockets). Node connection binds through native environment definitions for DB.
- **Validation:** Zod schemas control payload contracts reliably. 
- **Styles:** TailwindCSS + Radix/Lucide icons. Framer Motion is integrated explicitly for responsive UI scaling during user betting. 
- **Configuration (ENV):** Demands generic Next Auth secret payloads, direct Prisma DATABASE_URL targets, and Socket explicit routing declarations (to escape localhost proxying constraints).
