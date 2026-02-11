# DATA MODEL DOCUMENT
# MATKA BETTING PLATFORM
## Version 1.0 | February 2026

---

## TABLE OF CONTENTS
1. [Data Model Philosophy](#1-data-model-philosophy)
2. [Entity Relationship Diagram (ERD)](#2-entity-relationship-diagram-erd)
3. [Table Summary — All Tables At a Glance](#3-table-summary--all-tables-at-a-glance)
4. [Common Patterns & Conventions](#4-common-patterns--conventions)
5. [Table: users](#5-table-users)
6. [Table: games](#6-table-games)
7. [Table: payout_multipliers](#7-table-payout_multipliers)
8. [Table: betting_windows](#8-table-betting_windows)
9. [Table: bets](#9-table-bets)
10. [Table: results](#10-table-results)
11. [Table: transactions](#11-table-transactions)
12. [Table: member_pnl](#12-table-member_pnl)
13. [Table: settlements](#13-table-settlements)
14. [Table: settlement_entries](#14-table-settlement_entries)
15. [Table: credit_loans](#15-table-credit_loans)
16. [Table: announcements](#16-table-announcements)
17. [Table: banners](#17-table-banners)
18. [Table: rules_content](#18-table-rules_content)
19. [Table: app_settings](#19-table-app_settings)
20. [Table: admin_actions](#20-table-admin_actions)
21. [Table: login_logs](#21-table-login_logs)
22. [Table: db_backups](#22-table-db_backups)
23. [Table: blocked_bets](#23-table-blocked_bets)
24. [Complete Prisma Schema](#24-complete-prisma-schema)
25. [Database Indexes — Complete List](#25-database-indexes--complete-list)
26. [Seed Data](#26-seed-data)
27. [Migration Strategy](#27-migration-strategy)
28. [Future-Proofing & Extensibility Guide](#28-future-proofing--extensibility-guide)
29. [Data Integrity Rules & Constraints](#29-data-integrity-rules--constraints)
30. [Query Patterns — Common Queries](#30-query-patterns--common-queries)

---

## 1. DATA MODEL PHILOSOPHY

### 1.1 Core Principles

#### Principle 1: NEVER DELETE, ALWAYS SOFT-DELETE
Except for the 2-day result cleanup rule, we NEVER physically delete records. We use `is_active`, `is_deleted`, `status` flags. This preserves audit trail, prevents orphaned references, and allows data recovery.

#### Principle 2: EVERY MONEY MOVEMENT HAS A TRANSACTION RECORD
If coins move — bet placed, won, lost, credited, debited, rolled back — there is a row in the `transactions` table. No exceptions. This is the financial ledger. It must be 100% complete and traceable.

#### Principle 3: AUDIT EVERYTHING ADMIN DOES
Every admin action — create account, credit coins, declare result, block user, change password, rollback — goes into `admin_actions`. Who did what, when, what changed from what to what.

#### Principle 4: INTEGER MATH FOR ALL MONEY
Every column storing money is `Int` (not `Float`, not `Decimal`). 1 coin = 1 rupee. No paisa. No rounding errors. Ever.

#### Principle 5: TIMESTAMPS EVERYWHERE
Every table has `created_at` and `updated_at`. Financial tables also have specific timestamps like `settled_at`, `rolled_back_at`. This enables precise debugging and audit.

#### Principle 6: DESIGN FOR EXTENSIBILITY
Use enums stored as strings (not integer codes) so new values can be added without schema migration. Use JSON columns for flexible metadata. Include `metadata` fields on key tables for future data without schema changes.

#### Principle 7: HIERARCHY IS A TREE
The `users` table has a self-referential `created_by` field forming a tree. Every query that shows "my downline" walks this tree. The tree never has cycles (enforced by creation rules — you can only create roles below you).

---

## 2. ENTITY RELATIONSHIP DIAGRAM (ERD)

```
┌─────────────────┐
│     USERS        │ (Self-referential: created_by → users.id)
│─────────────────│
│ id (PK)         │──┐
│ user_id (unique) │  │
│ role (enum)     │  │
│ created_by (FK) │──┘ (parent in hierarchy)
│ wallet_balance  │
│ deal_percentage │
│ ...             │
└───────┬─────────┘
        │
        │ 1:N (user places many bets)
        ├──────────────────────────────────────┐
        │                                      │
        ▼                                      ▼
┌─────────────────┐                   ┌─────────────────┐
│     BETS         │                   │  TRANSACTIONS    │
│─────────────────│                   │─────────────────│
│ id (PK)         │                   │ id (PK)         │
│ user_id (FK)    │──→ users          │ user_id (FK)    │──→ users
│ game_id (FK)    │──→ games          │ type (enum)     │
│ bet_type (enum) │                   │ amount          │
│ bet_number      │                   │ balance_before  │
│ bet_amount      │                   │ balance_after   │
│ status (enum)   │                   │ reference       │
│ result_id (FK)  │──→ results        └─────────────────┘
│ ...             │
└─────────────────┘
        │
        │ settled by
        ▼
┌─────────────────┐         ┌─────────────────┐
│    RESULTS       │         │     GAMES        │
│─────────────────│         │─────────────────│
│ id (PK)         │         │ id (PK)         │
│ game_id (FK)    │──→ games│ name            │
│ date            │         │ open_time       │
│ session (enum)  │         │ close_time      │
│ open_panna      │         │ is_active       │
│ close_panna     │         │ color_code      │
│ jodi            │         │ ...             │
│ ...             │         └───────┬─────────┘
└─────────────────┘                 │
                                    │ 1:N
                                    ▼
                           ┌─────────────────┐
                           │PAYOUT_MULTIPLIERS│
                           │─────────────────│
                           │ id (PK)         │
                           │ game_id (FK)    │ (nullable = global)
                           │ bet_type (enum) │
                           │ multiplier      │
                           └─────────────────┘

┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
│   MEMBER_PNL     │   │   SETTLEMENTS    │   │  CREDIT_LOANS    │
│─────────────────│   │─────────────────│   │─────────────────│
│ user_id (FK)    │   │ result_id (FK)  │   │ user_id (FK)    │
│ game_id (FK)    │   │ game_id (FK)    │   │ given_by (FK)   │
│ date            │   │ date            │   │ amount          │
│ pnl             │   │ total_bets      │   │ type (enum)     │
│ ...             │   │ total_payout    │   │ ...             │
└─────────────────┘   │ status (enum)   │   └─────────────────┘
                      └─────────────────┘

┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
│  ADMIN_ACTIONS   │   │   LOGIN_LOGS     │   │  BLOCKED_BETS    │
│─────────────────│   │─────────────────│   │─────────────────│
│ admin_id        │   │ user_id (FK)    │   │ game_id (FK)    │
│ action_type     │   │ ip_address      │   │ bet_type        │
│ entity_type     │   │ user_agent      │   │ is_blocked      │
│ old_value       │   │ ...             │   │ ...             │
│ new_value       │   └─────────────────┘   └─────────────────┘
│ ...             │
└─────────────────┘

┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
│  ANNOUNCEMENTS   │   │    BANNERS       │   │  RULES_CONTENT   │
│─────────────────│   │─────────────────│   │─────────────────│
│ title           │   │ image_url       │   │ content (text)  │
│ message         │   │ display_order   │   │ updated_by      │
│ is_active       │   │ is_active       │   │ ...             │
│ ...             │   │ ...             │   └─────────────────┘
└─────────────────┘   └─────────────────┘

┌─────────────────┐   ┌─────────────────┐
│  APP_SETTINGS    │   │   DB_BACKUPS     │
│─────────────────│   │─────────────────│
│ key (unique)    │   │ filename        │
│ value           │   │ s3_url          │
│ category        │   │ size_bytes      │
│ ...             │   │ ...             │
└─────────────────┘   └─────────────────┘
```

---

## 3. TABLE SUMMARY — ALL TABLES AT A GLANCE

| # | Table Name | Purpose | Row Growth | Critical Level |
|---|-----------|---------|-----------|---------------|
| 1 | `users` | All accounts (Admin, SM, Master, User) | Slow (manual creation) | ⭐⭐⭐⭐⭐ |
| 2 | `games` | Game definitions (KALYAN, MILAN, etc.) | Very slow (admin adds) | ⭐⭐⭐⭐ |
| 3 | `payout_multipliers` | Payout rates per bet type, global + per-game | Very slow | ⭐⭐⭐⭐ |
| 4 | `betting_windows` | Daily betting windows per game | Medium (daily creation) | ⭐⭐⭐⭐ |
| 5 | `bets` | Every bet placed by every user | **FAST** (highest volume) | ⭐⭐⭐⭐⭐ |
| 6 | `results` | Declared results per game/date/session | Medium (daily) | ⭐⭐⭐⭐⭐ |
| 7 | `transactions` | Every coin movement (financial ledger) | **FAST** (highest volume) | ⭐⭐⭐⭐⭐ |
| 8 | `member_pnl` | P/L per member per game per day | Fast (per settlement) | ⭐⭐⭐⭐⭐ |
| 9 | `settlements` | Settlement records per result | Medium | ⭐⭐⭐⭐ |
| 10 | `settlement_entries` | Individual bet outcomes within settlement | Fast | ⭐⭐⭐⭐ |
| 11 | `credit_loans` | Credit/loan transactions | Slow | ⭐⭐⭐ |
| 12 | `announcements` | Admin announcements (marquee) | Very slow | ⭐⭐ |
| 13 | `banners` | Banner images for user page | Very slow | ⭐⭐ |
| 14 | `rules_content` | Game rules text | Very slow (single row) | ⭐ |
| 15 | `app_settings` | Key-value app configuration | Very slow | ⭐⭐⭐ |
| 16 | `admin_actions` | Audit trail for all admin actions | Fast | ⭐⭐⭐⭐ |
| 17 | `login_logs` | Login attempts and sessions | Fast | ⭐⭐⭐ |
| 18 | `db_backups` | Database backup history | Very slow | ⭐⭐ |
| 19 | `blocked_bets` | Blocked bet configurations | Very slow | ⭐⭐⭐ |

**Total: 19 tables**

---

## 4. COMMON PATTERNS & CONVENTIONS

### 4.1 Column Naming
```
Primary Key:        id (auto-increment Int)
Foreign Keys:       {table_name}_id (e.g., user_id, game_id)
Timestamps:         created_at, updated_at (DateTime, auto-managed)
Boolean Flags:      is_{adjective} (is_active, is_blocked, is_special, is_deleted)
Money Columns:      {name} as Int (wallet_balance, bet_amount, win_amount)
Percentage Columns: {name}_percentage as Float (deal_percentage)
Status Columns:     status as String/Enum
Display IDs:        {role}_id as String (user_id = "PL519")
```

### 4.2 Enum Strategy
We store enums as **strings in the database** (not integer codes). This means:
- Human-readable when querying directly
- New values can be added without data migration
- Prisma maps them cleanly to TypeScript enums
- No lookup table needed

### 4.3 Soft Delete Pattern
```
is_deleted: Boolean @default(false)
deleted_at: DateTime? (null if not deleted)

// Every query must filter: where: { is_deleted: false }
// Prisma middleware can enforce this automatically
```

### 4.4 Metadata Pattern (Future-Proofing)
Critical tables include a `metadata` JSON column:
```
metadata: Json? @default("{}")

// Usage: Store any future data without schema migration
// Example: { "custom_field": "value", "notes": "VIP client" }
// RULE: Never put critical business data in metadata
//       Only supplementary/optional data
```

---

## 5. TABLE: users

### 5.1 Purpose
Stores ALL accounts — Admin reference, Super Masters, Masters, and Users. Self-referential hierarchy via `created_by`.

### 5.2 Column Definitions
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | Int | No | Auto-increment | Primary key (internal) |
| `user_id` | String | No | Generated | Unique display ID (PL519, BSM80867). Auto-generated. |
| `name` | String | No | — | Full name entered by creator |
| `password_hash` | String | No | — | Argon2 hashed password |
| `role` | Enum | No | — | `admin`, `supermaster`, `master`, `user` |
| `created_by` | Int | Yes | null | FK → users.id (parent in hierarchy). Null for admin. |
| `wallet_balance` | Int | No | 0 | Current coin balance. 1 coin = 1 rupee. |
| `deal_percentage` | Float | No | 0 | Commission deal percentage set by creator |
| `my_matka_share` | Float | No | 0 | Personal matka share percentage |
| `agent_matka_share` | Float | No | 0 | Agent matka share percentage |
| `matka_commission` | Float | No | 0 | Matka commission percentage |
| `credit_limit` | Int | No | 0 | Maximum credit allowed |
| `fix_limit` | Int | No | 0 | Maximum operational limit |
| `exposure` | Int | No | 0 | Current exposure (coins locked in pending bets) |
| `is_special` | Boolean | No | false | Flagged as Special Master (custom lower %) |
| `special_notes` | String | Yes | null | Notes about why they're special |
| `is_blocked` | Boolean | No | false | Account is blocked (cannot login/bet) |
| `blocked_at` | DateTime | Yes | null | When was blocked |
| `blocked_by` | Int | Yes | null | FK → users.id (who blocked them) |
| `blocked_reason` | String | Yes | null | Why was blocked |
| `is_active` | Boolean | No | true | Account is active |
| `is_deleted` | Boolean | No | false | Soft delete flag |
| `last_login_at` | DateTime | Yes | null | Last successful login timestamp |
| `last_login_ip` | String | Yes | null | Last login IP address |
| `metadata` | Json | Yes | {} | Extensible metadata (future fields) |
| `created_at` | DateTime | No | now() | Account creation time |
| `updated_at` | DateTime | No | auto | Last update time |

### 5.3 Unique Constraints
- `user_id` — Unique across entire system

### 5.4 Indexes
- `user_id` — Unique index (login lookup)
- `role` — Index (filter by role)
- `created_by` — Index (hierarchy queries)
- `is_blocked` — Index (active user filtering)
- `is_special` — Index (special master listing)
- Composite: `(role, is_blocked, is_deleted)` — Common filter combination

### 5.5 Relationships
- `self → users (created_by)` — Parent in hierarchy
- `users → self (children)` — List of members created by this user
- `users → bets` — All bets placed (only role=user)
- `users → transactions` — All financial transactions
- `users → member_pnl` — P/L records
- `users → credit_loans (received)` — Loans received
- `users → credit_loans (given)` — Loans given
- `users → admin_actions` — Actions performed (if admin)
- `users → login_logs` — Login history

### 5.6 Business Rules
1. `user_id` is auto-generated at creation time, NEVER changes
2. `wallet_balance` can NEVER be negative (except admin who has conceptual infinity)
3. `deal_percentage` of child must be ≤ parent's `deal_percentage`
4. `role` can NEVER change after creation
5. `created_by` can NEVER change after creation
6. Admin row exists in env vars, NOT in database (special handling in auth)
7. `exposure` = sum of all pending bet amounts for this user

---

## 6. TABLE: games

### 6.1 Purpose
Stores all game definitions (KALYAN, MILAN DAY, etc.) with their timing configuration.

### 6.2 Column Definitions
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | Int | No | Auto-increment | Primary key |
| `name` | String | No | — | Game name (KALYAN, SRIDEVI, etc.) |
| `slug` | String | No | — | URL-friendly name (kalyan, sridevi-night) |
| `open_time` | String | No | — | Betting opens time (HH:MM format, IST) |
| `close_time` | String | No | — | Betting closes time (HH:MM, IST) |
| `result_time` | String | No | — | Expected result time (HH:MM, IST) |
| `color_code` | String | No | "#3B82F6" | Color for UI cards |
| `display_order` | Int | No | 0 | Ordering on user page |
| `is_active` | Boolean | No | true | Game is available for betting |
| `is_deleted` | Boolean | No | false | Soft delete |
| `metadata` | Json | Yes | {} | Future extensibility |
| `created_at` | DateTime | No | now() | |
| `updated_at` | DateTime | No | auto | |

### 6.3 Unique Constraints
- `name` — No duplicate game names
- `slug` — No duplicate slugs

### 6.4 Indexes
- `is_active` — Active games list
- `display_order` — Ordered listing

### 6.5 Relationships
- `games → bets` — All bets on this game
- `games → results` — All results for this game
- `games → betting_windows` — Daily windows
- `games → payout_multipliers` — Per-game overrides
- `games → blocked_bets` — Blocked bet configs
- `games → member_pnl` — P/L per game

---

## 7. TABLE: payout_multipliers

### 7.1 Purpose
Stores payout rates for each bet type. Supports both GLOBAL defaults and PER-GAME overrides.

### 7.2 Column Definitions
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | Int | No | Auto-increment | Primary key |
| `game_id` | Int | Yes | null | FK → games.id. **NULL = global default** |
| `bet_type` | Enum | No | — | SINGLE_AKDA, SINGLE_PATTI, DOUBLE_PATTI, TRIPLE_PATTI, JODI |
| `multiplier` | Int | No | — | Payout multiplier (10, 160, 320, 70, 100) |
| `is_active` | Boolean | No | true | Currently active |
| `changed_by` | Int | Yes | null | FK → users.id (who last changed it) |
| `changed_at` | DateTime | Yes | null | When last changed |
| `previous_multiplier` | Int | Yes | null | Previous value (audit) |
| `created_at` | DateTime | No | now() | |
| `updated_at` | DateTime | No | auto | |

### 7.3 Unique Constraints
- `(game_id, bet_type)` — One multiplier per bet type per game (or one global per bet type)

### 7.4 Lookup Logic
```
GET multiplier for (gameId=5, betType=JODI):
  1. Check payout_multipliers WHERE game_id=5 AND bet_type='JODI' AND is_active=true
  2. If found → use per-game multiplier
  3. If NOT found → Check WHERE game_id IS NULL AND bet_type='JODI' AND is_active=true
  4. Use global default
```

This allows Admin to set global defaults that apply everywhere, then override for specific games as needed.

---

## 8. TABLE: betting_windows

### 8.1 Purpose
Tracks daily betting windows for each game. Created every day at 2 AM reset.

### 8.2 Column Definitions
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | Int | No | Auto-increment | Primary key |
| `game_id` | Int | No | — | FK → games.id |
| `date` | String | No | — | Date string (YYYY-MM-DD) |
| `session` | Enum | No | "FULL" | OPEN, CLOSE, FULL (betting for both sessions) |
| `is_open` | Boolean | No | true | Window currently accepts bets |
| `opens_at` | DateTime | No | — | When betting opens |
| `closes_at` | DateTime | No | — | When betting closes |
| `total_bets` | Int | No | 0 | Count of bets placed in this window |
| `total_amount` | Int | No | 0 | Sum of all bet amounts in this window |
| `closed_manually` | Boolean | No | false | Was closed manually by admin (vs auto) |
| `closed_by` | Int | Yes | null | FK → users.id if manually closed |
| `created_at` | DateTime | No | now() | |
| `updated_at` | DateTime | No | auto | |

### 8.3 Unique Constraints
- `(game_id, date, session)` — One window per game per day per session

### 8.4 Indexes
- `(is_open, closes_at)` — Finding open windows that need auto-closing
- `(game_id, date)` — Lookup window for a specific game/day
- `date` — Daily window listing

---

## 9. TABLE: bets

### 9.1 Purpose
**THE HIGHEST VOLUME TABLE.** Every single bet placed by every user. This table must be highly optimized.

### 9.2 Column Definitions
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | Int | No | Auto-increment | Primary key |
| `bet_id` | String | No | Generated | Display bet ID (BET-PL519-001) |
| `user_id` | Int | No | — | FK → users.id (who placed the bet) |
| `game_id` | Int | No | — | FK → games.id (which game) |
| `date` | String | No | — | Bet date (YYYY-MM-DD) |
| `session` | Enum | No | — | OPEN, CLOSE |
| `bet_type` | Enum | No | — | SINGLE_AKDA, SINGLE_PATTI, DOUBLE_PATTI, TRIPLE_PATTI, JODI |
| `bet_number` | String | No | — | The number bet on ("9", "45", "388") |
| `bet_amount` | Int | No | — | Amount wagered (integer, coins) |
| `payout_multiplier` | Int | No | — | Multiplier AT TIME OF BET (snapshot) |
| `potential_win` | Int | No | — | bet_amount × payout_multiplier |
| `status` | Enum | No | "pending" | pending, won, lost, cancelled, rolled_back |
| `win_amount` | Int | No | 0 | Actual win amount (0 if lost) |
| `result_id` | Int | Yes | null | FK → results.id (linked after settlement) |
| `settlement_id` | Int | Yes | null | FK → settlements.id |
| `settled_at` | DateTime | Yes | null | When this bet was settled |
| `is_rolled_back` | Boolean | No | false | Was this bet part of a rollback |
| `rolled_back_at` | DateTime | Yes | null | When rolled back |
| `window_id` | Int | Yes | null | FK → betting_windows.id |
| `placed_ip` | String | Yes | null | IP address of bet placement |
| `metadata` | Json | Yes | {} | Future extensibility |
| `created_at` | DateTime | No | now() | When bet was placed |
| `updated_at` | DateTime | No | auto | |

### 9.3 Unique Constraints
- `bet_id` — Unique display ID

### 9.4 Indexes (CRITICAL FOR PERFORMANCE)
```
idx_bets_game_date_status:     (game_id, date, status)     → Settlement query
idx_bets_user_date:            (user_id, date DESC)         → User's bet history
idx_bets_user_status:          (user_id, status)            → Pending bets / exposure
idx_bets_result_id:            (result_id)                  → Bets per result
idx_bets_settlement_id:        (settlement_id)              → Bets per settlement
idx_bets_date_status:          (date, status)               → Daily reports
idx_bets_created_at:           (created_at DESC)            → Recent bets feed
```

### 9.5 Critical Business Rules
1. `payout_multiplier` is SNAPSHOT at bet time — never updated after creation
2. `status` transitions: pending → won/lost (via settlement), pending → cancelled (admin), won/lost → rolled_back (via rollback)
3. `bet_amount` is deducted from wallet at bet creation (not at settlement)
4. `win_amount` is credited to wallet at settlement (only if won)
5. `exposure` on user table = SUM of bet_amount WHERE status='pending' for that user

---

## 10. TABLE: results

### 10.1 Purpose
Stores declared results for each game/date/session. Created when Admin declares a result.

### 10.2 Column Definitions
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | Int | No | Auto-increment | Primary key |
| `game_id` | Int | No | — | FK → games.id |
| `date` | String | No | — | Result date (YYYY-MM-DD) |
| `session` | Enum | No | — | OPEN, CLOSE |
| `open_panna` | String | Yes | null | 3-digit open panna (e.g., "388") |
| `open_single` | Int | Yes | null | Derived: last digit of panna digit sum (0-9) |
| `close_panna` | String | Yes | null | 3-digit close panna (e.g., "280") |
| `close_single` | Int | Yes | null | Derived: last digit of panna digit sum (0-9) |
| `jodi` | String | Yes | null | Derived: open_single + close_single (e.g., "90") |
| `declared_by` | Int | No | — | FK → users.id (Admin who declared) |
| `declared_at` | DateTime | No | now() | When result was declared |
| `is_settled` | Boolean | No | false | Has settlement been run for this result |
| `settled_at` | DateTime | Yes | null | When settlement completed |
| `is_rolled_back` | Boolean | No | false | Was this result rolled back |
| `rolled_back_at` | DateTime | Yes | null | When rolled back |
| `rolled_back_by` | Int | Yes | null | FK → users.id |
| `is_deleted` | Boolean | No | false | 2-day cleanup soft-delete |
| `deleted_at` | DateTime | Yes | null | When cleaned up |
| `metadata` | Json | Yes | {} | Future extensibility |
| `created_at` | DateTime | No | now() | |
| `updated_at` | DateTime | No | auto | |

### 10.3 Unique Constraints
- `(game_id, date, session)` — One result per game per date per session

### 10.4 Indexes
- `(game_id, date DESC)` — Latest results per game
- `(date, is_deleted)` — Date-based queries + cleanup
- `(is_settled, is_rolled_back)` — Settlement status queries

### 10.5 Result Lifecycle
```
Created (Admin declares)
    → status fields: is_settled=false, is_rolled_back=false
    
Settled (auto after declaration)
    → is_settled=true, settled_at=now()
    
Rolled Back (Admin rollback)
    → is_rolled_back=true, rolled_back_at=now()
    → is_settled=false (reset so can be re-declared)
    
Cleaned Up (2-day cron)
    → is_deleted=true, deleted_at=now()
    → NOT physically deleted (for audit trail)
    → Frontend filters: WHERE is_deleted=false
```

---

## 11. TABLE: transactions

### 11.1 Purpose
**THE FINANCIAL LEDGER.** Every single coin movement in the system. This is the source of truth for all money.

### 11.2 Column Definitions
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | Int | No | Auto-increment | Primary key |
| `txn_id` | String | No | Generated | Display transaction ID (TXN-PL519-001) |
| `user_id` | Int | No | — | FK → users.id (whose wallet) |
| `type` | Enum | No | — | Transaction type (see below) |
| `amount` | Int | No | — | Amount of coins moved (always positive) |
| `direction` | Enum | No | — | CREDIT (+) or DEBIT (-) |
| `balance_before` | Int | No | — | Wallet balance BEFORE this transaction |
| `balance_after` | Int | No | — | Wallet balance AFTER this transaction |
| `reference` | String | Yes | null | Reference ID (bet_id, loan_id, etc.) |
| `reference_type` | String | Yes | null | Type of reference (bet, loan, manual, etc.) |
| `performed_by` | Int | Yes | null | FK → users.id (who initiated — admin/SM/Master) |
| `notes` | String | Yes | null | Human-readable description |
| `metadata` | Json | Yes | {} | Additional context |
| `created_at` | DateTime | No | now() | Transaction timestamp |

### 11.3 Transaction Types (Enum)
```
CREDIT_IN           → Coins received from above hierarchy
CREDIT_OUT          → Coins given to below hierarchy
BET_PLACED          → User placed a bet (debit)
BET_WON             → User won a bet (credit)
BET_CANCELLED       → Bet cancelled, amount returned (credit)
WITHDRAWAL          → Coins withdrawn by hierarchy above
ROLLBACK_DEBIT      → Rollback: win amount taken back
ROLLBACK_CREDIT     → Rollback: bet amount returned
LOAN_IN             → Credit/loan received
LOAN_OUT            → Credit/loan given to downline
LOAN_REPAYMENT      → Loan repayment
MANUAL_ADJUSTMENT   → Manual admin adjustment (special cases)
```

### 11.4 Unique Constraints
- `txn_id` — Unique display ID

### 11.5 Indexes (CRITICAL)
```
idx_txn_user_date:        (user_id, created_at DESC)    → Ledger view
idx_txn_type:             (type)                         → Filter by type
idx_txn_reference:        (reference)                    → Find transactions for a bet/loan
idx_txn_performed_by:     (performed_by)                 → Audit who did what
idx_txn_created_at:       (created_at DESC)              → Chronological listing
```

### 11.6 Critical Rules
1. Transactions are APPEND-ONLY — never update, never delete
2. `balance_before` + amount (credit) = `balance_after` OR `balance_before` - amount (debit) = `balance_after`
3. This table is the source of truth — if wallet balance doesn't match, transactions table is correct
4. Every transaction has a clear `type` that explains WHY coins moved
5. `performed_by` is null for system-generated transactions (settlement), set for manual operations

---

## 12. TABLE: member_pnl

### 12.1 Purpose
Tracks profit/loss for each hierarchy member per game per day. Updated during settlement when P/L cascades through the hierarchy.

### 12.2 Column Definitions
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | Int | No | Auto-increment | Primary key |
| `user_id` | Int | No | — | FK → users.id (the member) |
| `game_id` | Int | No | — | FK → games.id |
| `date` | String | No | — | Date (YYYY-MM-DD) |
| `pnl` | Int | No | 0 | Net P/L amount (positive=profit, negative=loss) |
| `total_bets_volume` | Int | No | 0 | Total bet amount under this member |
| `total_bets_count` | Int | No | 0 | Number of bets under this member |
| `winners_count` | Int | No | 0 | Number of winning bets |
| `losers_count` | Int | No | 0 | Number of losing bets |
| `total_payout` | Int | No | 0 | Total paid out to winners |
| `commission_earned` | Int | No | 0 | Commission based on deal % |
| `is_rolled_back` | Boolean | No | false | Was rolled back |
| `metadata` | Json | Yes | {} | |
| `created_at` | DateTime | No | now() | |
| `updated_at` | DateTime | No | auto | |

### 12.3 Unique Constraints
- `(user_id, game_id, date)` — One P/L record per member per game per day

### 12.4 Indexes
```
idx_pnl_user_date:       (user_id, date DESC)       → Member's P/L history
idx_pnl_game_date:       (game_id, date)             → P/L per game
idx_pnl_date:            (date)                       → Daily P/L reports
```

---

## 13. TABLE: settlements

### 13.1 Purpose
Records each settlement event (when Admin declares a result and bets are auto-settled).

### 13.2 Column Definitions
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | Int | No | Auto-increment | Primary key |
| `result_id` | Int | No | — | FK → results.id |
| `game_id` | Int | No | — | FK → games.id |
| `date` | String | No | — | Settlement date |
| `session` | Enum | No | — | OPEN, CLOSE |
| `total_bets` | Int | No | 0 | Total bets settled |
| `total_bet_amount` | Int | No | 0 | Sum of all bet amounts |
| `winners_count` | Int | No | 0 | Number of winners |
| `losers_count` | Int | No | 0 | Number of losers |
| `total_payout` | Int | No | 0 | Total paid out to winners |
| `net_pnl` | Int | No | 0 | Net P/L (positive = house profit) |
| `status` | Enum | No | "completed" | completed, rolled_back |
| `settled_by` | Int | No | — | FK → users.id (Admin) |
| `settled_at` | DateTime | No | now() | |
| `rolled_back_at` | DateTime | Yes | null | |
| `rolled_back_by` | Int | Yes | null | FK → users.id |
| `duration_ms` | Int | Yes | null | How long settlement took |
| `metadata` | Json | Yes | {} | |
| `created_at` | DateTime | No | now() | |
| `updated_at` | DateTime | No | auto | |

### 13.3 Unique Constraints
- `(result_id)` — One settlement per result

---

## 14. TABLE: settlement_entries

### 14.1 Purpose
Individual bet outcomes within a settlement. Links bets to their settlement result. Used for detailed settlement reports.

### 14.2 Column Definitions
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | Int | No | Auto-increment | Primary key |
| `settlement_id` | Int | No | — | FK → settlements.id |
| `bet_id` | Int | No | — | FK → bets.id |
| `user_id` | Int | No | — | FK → users.id |
| `outcome` | Enum | No | — | won, lost |
| `bet_amount` | Int | No | — | Snapshot of bet amount |
| `win_amount` | Int | No | 0 | Amount won (0 if lost) |
| `created_at` | DateTime | No | now() | |

### 14.3 Indexes
- `(settlement_id)` — All entries for a settlement
- `(user_id, created_at DESC)` — User's settlement history

---

## 15. TABLE: credit_loans

### 15.1 Purpose
Tracks all credit/loan transactions given by Admin/SM/Master to their downline. Separate from regular coin transfers.

### 15.2 Column Definitions
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | Int | No | Auto-increment | Primary key |
| `loan_id` | String | No | Generated | Display ID (LOAN-001) |
| `user_id` | Int | No | — | FK → users.id (receiver) |
| `given_by` | Int | No | — | FK → users.id (giver) |
| `type` | Enum | No | — | CREDIT_GIVEN, CREDIT_RETURNED, LOAN_GIVEN, LOAN_REPAID |
| `amount` | Int | No | — | Loan amount (integer) |
| `outstanding` | Int | No | — | Remaining unpaid amount |
| `status` | Enum | No | "active" | active, partially_paid, fully_paid, written_off |
| `notes` | String | Yes | null | |
| `metadata` | Json | Yes | {} | |
| `created_at` | DateTime | No | now() | |
| `updated_at` | DateTime | No | auto | |

### 15.3 Indexes
- `(user_id, status)` — Active loans per user
- `(given_by)` — Loans given by a specific member

---

## 16. TABLE: announcements

### 16.1 Column Definitions
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | Int | No | Auto-increment | Primary key |
| `title` | String | No | — | Announcement title |
| `message` | String | No | — | Full message text (for marquee) |
| `is_active` | Boolean | No | true | Currently showing |
| `starts_at` | DateTime | Yes | null | Show from date (null = immediately) |
| `ends_at` | DateTime | Yes | null | Show until date (null = forever) |
| `display_order` | Int | No | 0 | Ordering |
| `created_by` | Int | No | — | FK → users.id (Admin) |
| `created_at` | DateTime | No | now() | |
| `updated_at` | DateTime | No | auto | |

---

## 17. TABLE: banners

### 17.1 Column Definitions
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | Int | No | Auto-increment | Primary key |
| `image_url` | String | No | — | S3 URL of banner image |
| `title` | String | Yes | null | Alt text / title |
| `link_url` | String | Yes | null | Click destination (optional) |
| `display_order` | Int | No | 0 | Carousel order |
| `is_active` | Boolean | No | true | Currently showing |
| `created_by` | Int | No | — | FK → users.id |
| `created_at` | DateTime | No | now() | |
| `updated_at` | DateTime | No | auto | |

---

## 18. TABLE: rules_content

### 18.1 Column Definitions
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | Int | No | Auto-increment | Primary key |
| `content` | String | No | — | HTML/Markdown rules content |
| `updated_by` | Int | No | — | FK → users.id (Admin) |
| `version` | Int | No | 1 | Version number (increments on update) |
| `created_at` | DateTime | No | now() | |
| `updated_at` | DateTime | No | auto | |

**Note:** This table typically has only 1 active row. New versions create new rows (old versions preserved for audit).

---

## 19. TABLE: app_settings

### 19.1 Purpose
Key-value store for application-wide settings. Extensible without schema changes.

### 19.2 Column Definitions
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | Int | No | Auto-increment | Primary key |
| `key` | String | No | — | Setting key (unique) |
| `value` | String | No | — | Setting value (stored as string, parsed by app) |
| `category` | String | No | "general" | Group (general, betting, display, contact) |
| `description` | String | Yes | null | What this setting does |
| `updated_by` | Int | Yes | null | FK → users.id |
| `created_at` | DateTime | No | now() | |
| `updated_at` | DateTime | No | auto | |

### 19.3 Default Settings
```
KEY                         | VALUE      | CATEGORY
whatsapp_number             | +91...     | contact
min_bet_amount              | 10         | betting
max_bet_amount              | 100000     | betting
daily_reset_time            | 02:00      | general
result_retention_days       | 2          | general
enable_user_self_register   | false      | general
default_deal_percentage     | 85         | betting
maintenance_mode            | false      | general
```

### 19.4 Why Key-Value
Admin can change any setting from the panel without deploying code. New settings can be added without schema migration. AI agents can query settings without knowing the full schema.

---

## 20. TABLE: admin_actions

### 20.1 Purpose
Complete audit trail of every action performed by Admin (and SM/Master for their allowed actions).

### 20.2 Column Definitions
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | Int | No | Auto-increment | Primary key |
| `admin_id` | Int | No | — | FK → users.id (who performed action) |
| `action_type` | String | No | — | Action code (see below) |
| `entity_type` | String | No | — | What was affected (USER, GAME, BET, RESULT, etc.) |
| `entity_id` | Int | Yes | null | ID of affected entity |
| `old_value` | String | Yes | null | Previous value (JSON stringified) |
| `new_value` | String | Yes | null | New value (JSON stringified) |
| `ip_address` | String | Yes | null | Admin's IP |
| `user_agent` | String | Yes | null | Browser info |
| `notes` | String | Yes | null | Additional context |
| `created_at` | DateTime | No | now() | When action occurred |

### 20.3 Action Types
```
ACCOUNT_CREATED         ACCOUNT_BLOCKED         ACCOUNT_UNBLOCKED
ACCOUNT_EDITED          PASSWORD_CHANGED        DEAL_PERCENT_CHANGED
COINS_CREDITED          COINS_DEBITED           LOAN_GIVEN
GAME_CREATED            GAME_EDITED             GAME_DELETED
GAME_TOGGLED            RESULT_DECLARED         SETTLEMENT_RUN
ROLLBACK_SETTLEMENT     BET_BLOCKED             BET_UNBLOCKED
USER_BLOCKED            USER_UNBLOCKED          MULTIPLIER_CHANGED
ANNOUNCEMENT_CREATED    ANNOUNCEMENT_EDITED     ANNOUNCEMENT_DELETED
BANNER_UPLOADED         BANNER_DELETED          RULES_UPDATED
WHATSAPP_UPDATED        DB_BACKUP_TRIGGERED     SETTINGS_CHANGED
MASTER_KEY_ACCESS       MANUAL_ADJUSTMENT
```

### 20.4 Indexes
- `(admin_id, created_at DESC)` — Actions by specific admin
- `(entity_type, entity_id)` — Actions on specific entity
- `(action_type)` — Filter by action type
- `(created_at DESC)` — Chronological audit log

---

## 21. TABLE: login_logs

### 21.1 Column Definitions
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | Int | No | Auto-increment | Primary key |
| `user_id` | Int | No | — | FK → users.id |
| `success` | Boolean | No | — | Login succeeded or failed |
| `ip_address` | String | No | — | Client IP |
| `user_agent` | String | Yes | null | Browser/device info |
| `failure_reason` | String | Yes | null | If failed: wrong_password, blocked, etc. |
| `created_at` | DateTime | No | now() | |

### 21.2 Indexes
- `(user_id, created_at DESC)` — Login history per user
- `(ip_address, created_at DESC)` — Track IPs for brute force
- `(success, created_at DESC)` — Failed login monitoring

---

## 22. TABLE: db_backups

### 22.1 Column Definitions
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | Int | No | Auto-increment | Primary key |
| `filename` | String | No | — | Backup file name |
| `s3_url` | String | Yes | null | S3 download URL |
| `size_bytes` | Int | No | 0 | File size |
| `status` | Enum | No | — | in_progress, completed, failed |
| `triggered_by` | Int | No | — | FK → users.id (Admin) |
| `error_message` | String | Yes | null | If failed |
| `started_at` | DateTime | No | now() | |
| `completed_at` | DateTime | Yes | null | |
| `created_at` | DateTime | No | now() | |

---

## 23. TABLE: blocked_bets

### 23.1 Purpose
Admin can block betting on specific games or specific bet types within a game.

### 23.2 Column Definitions
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | Int | No | Auto-increment | Primary key |
| `game_id` | Int | Yes | null | FK → games.id. NULL = applies to ALL games |
| `bet_type` | Enum | Yes | null | SINGLE_AKDA, SINGLE_PATTI, etc. NULL = ALL types for this game |
| `is_blocked` | Boolean | No | true | Currently blocked |
| `blocked_by` | Int | No | — | FK → users.id (Admin) |
| `reason` | String | Yes | null | Why blocked |
| `created_at` | DateTime | No | now() | |
| `updated_at` | DateTime | No | auto | |

### 23.3 Blocking Logic
```
Check if bet is blocked for (gameId=5, betType=JODI):

1. Check: game_id=5 AND bet_type='JODI' AND is_blocked=true
   → This specific bet type is blocked for this game

2. Check: game_id=5 AND bet_type IS NULL AND is_blocked=true
   → ALL bet types blocked for this game

3. Check: game_id IS NULL AND bet_type='JODI' AND is_blocked=true
   → JODI is blocked globally (all games)

4. Check: game_id IS NULL AND bet_type IS NULL AND is_blocked=true
   → ALL betting is blocked globally (emergency)

If ANY check returns true → Bet is blocked
```

---

## 24. COMPLETE PRISMA SCHEMA

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ==========================================
// ENUMS
// ==========================================

enum Role {
  admin
  supermaster
  master
  user
}

enum BetType {
  SINGLE_AKDA
  SINGLE_PATTI
  DOUBLE_PATTI
  TRIPLE_PATTI
  JODI
}

enum BetStatus {
  pending
  won
  lost
  cancelled
  rolled_back
}

enum GameSession {
  OPEN
  CLOSE
  FULL
}

enum TransactionType {
  CREDIT_IN
  CREDIT_OUT
  BET_PLACED
  BET_WON
  BET_CANCELLED
  WITHDRAWAL
  ROLLBACK_DEBIT
  ROLLBACK_CREDIT
  LOAN_IN
  LOAN_OUT
  LOAN_REPAYMENT
  MANUAL_ADJUSTMENT
}

enum TransactionDirection {
  CREDIT
  DEBIT
}

enum SettlementStatus {
  completed
  rolled_back
}

enum LoanType {
  CREDIT_GIVEN
  CREDIT_RETURNED
  LOAN_GIVEN
  LOAN_REPAID
}

enum LoanStatus {
  active
  partially_paid
  fully_paid
  written_off
}

enum BackupStatus {
  in_progress
  completed
  failed
}

// ==========================================
// MODELS
// ==========================================

model User {
  id                 Int       @id @default(autoincrement())
  user_id            String    @unique
  name               String
  password_hash      String
  role               Role
  created_by         Int?
  wallet_balance     Int       @default(0)
  deal_percentage    Float     @default(0)
  my_matka_share     Float     @default(0)
  agent_matka_share  Float     @default(0)
  matka_commission   Float     @default(0)
  credit_limit       Int       @default(0)
  fix_limit          Int       @default(0)
  exposure           Int       @default(0)
  is_special         Boolean   @default(false)
  special_notes      String?
  is_blocked         Boolean   @default(false)
  blocked_at         DateTime?
  blocked_by         Int?
  blocked_reason     String?
  is_active          Boolean   @default(true)
  is_deleted         Boolean   @default(false)
  last_login_at      DateTime?
  last_login_ip      String?
  metadata           Json?     @default("{}")
  created_at         DateTime  @default(now())
  updated_at         DateTime  @updatedAt

  // Self-referential hierarchy
  parent             User?     @relation("Hierarchy", fields: [created_by], references: [id])
  children           User[]    @relation("Hierarchy")
  blocker            User?     @relation("Blocker", fields: [blocked_by], references: [id])
  blocked_users      User[]    @relation("Blocker")

  // Relations
  bets               Bet[]
  transactions       Transaction[]
  pnl_records        MemberPnl[]
  loans_received     CreditLoan[]   @relation("LoanReceiver")
  loans_given        CreditLoan[]   @relation("LoanGiver")
  results_declared   Result[]       @relation("ResultDeclarer")
  results_rolled     Result[]       @relation("ResultRoller")
  settlements_run    Settlement[]   @relation("Settler")
  settlements_rolled Settlement[]   @relation("SettlementRoller")
  admin_actions      AdminAction[]
  login_logs         LoginLog[]
  announcements      Announcement[]
  banners            Banner[]
  rules_updated      RulesContent[]
  backups_triggered  DbBackup[]
  windows_closed     BettingWindow[] @relation("WindowCloser")
  blocked_bets_set   BlockedBet[]
  multipliers_changed PayoutMultiplier[] @relation("MultiplierChanger")
  settlement_entries SettlementEntry[]

  @@index([role])
  @@index([created_by])
  @@index([is_blocked])
  @@index([is_special])
  @@index([role, is_blocked, is_deleted])
  @@index([user_id])
}

model Game {
  id             Int       @id @default(autoincrement())
  name           String    @unique
  slug           String    @unique
  open_time      String
  close_time     String
  result_time    String
  color_code     String    @default("#3B82F6")
  display_order  Int       @default(0)
  is_active      Boolean   @default(true)
  is_deleted     Boolean   @default(false)
  metadata       Json?     @default("{}")
  created_at     DateTime  @default(now())
  updated_at     DateTime  @updatedAt

  // Relations
  bets             Bet[]
  results          Result[]
  betting_windows  BettingWindow[]
  multipliers      PayoutMultiplier[]
  blocked_bets     BlockedBet[]
  pnl_records      MemberPnl[]
  settlements      Settlement[]

  @@index([is_active])
  @@index([display_order])
}

model PayoutMultiplier {
  id                    Int       @id @default(autoincrement())
  game_id               Int?
  bet_type              BetType
  multiplier            Int
  is_active             Boolean   @default(true)
  changed_by            Int?
  changed_at            DateTime?
  previous_multiplier   Int?
  created_at            DateTime  @default(now())
  updated_at            DateTime  @updatedAt

  game                  Game?     @relation(fields: [game_id], references: [id])
  changer               User?     @relation("MultiplierChanger", fields: [changed_by], references: [id])

  @@unique([game_id, bet_type])
  @@index([game_id, bet_type, is_active])
}

model BettingWindow {
  id              Int       @id @default(autoincrement())
  game_id         Int
  date            String
  session         GameSession @default(FULL)
  is_open         Boolean   @default(true)
  opens_at        DateTime
  closes_at       DateTime
  total_bets      Int       @default(0)
  total_amount    Int       @default(0)
  closed_manually Boolean   @default(false)
  closed_by       Int?
  created_at      DateTime  @default(now())
  updated_at      DateTime  @updatedAt

  game            Game      @relation(fields: [game_id], references: [id])
  closer          User?     @relation("WindowCloser", fields: [closed_by], references: [id])
  bets            Bet[]

  @@unique([game_id, date, session])
  @@index([is_open, closes_at])
  @@index([game_id, date])
  @@index([date])
}

model Bet {
  id                Int        @id @default(autoincrement())
  bet_id            String     @unique
  user_id           Int
  game_id           Int
  date              String
  session           GameSession
  bet_type          BetType
  bet_number        String
  bet_amount        Int
  payout_multiplier Int
  potential_win     Int
  status            BetStatus  @default(pending)
  win_amount        Int        @default(0)
  result_id         Int?
  settlement_id     Int?
  settled_at        DateTime?
  is_rolled_back    Boolean    @default(false)
  rolled_back_at    DateTime?
  window_id         Int?
  placed_ip         String?
  metadata          Json?      @default("{}")
  created_at        DateTime   @default(now())
  updated_at        DateTime   @updatedAt

  user              User       @relation(fields: [user_id], references: [id])
  game              Game       @relation(fields: [game_id], references: [id])
  result            Result?    @relation(fields: [result_id], references: [id])
  settlement        Settlement? @relation(fields: [settlement_id], references: [id])
  window            BettingWindow? @relation(fields: [window_id], references: [id])
  settlement_entries SettlementEntry[]

  @@index([game_id, date, status])
  @@index([user_id, date])
  @@index([user_id, status])
  @@index([result_id])
  @@index([settlement_id])
  @@index([date, status])
  @@index([created_at(sort: Desc)])
}

model Result {
  id              Int       @id @default(autoincrement())
  game_id         Int
  date            String
  session         GameSession
  open_panna      String?
  open_single     Int?
  close_panna     String?
  close_single    Int?
  jodi            String?
  declared_by     Int
  declared_at     DateTime  @default(now())
  is_settled      Boolean   @default(false)
  settled_at      DateTime?
  is_rolled_back  Boolean   @default(false)
  rolled_back_at  DateTime?
  rolled_back_by  Int?
  is_deleted      Boolean   @default(false)
  deleted_at      DateTime?
  metadata        Json?     @default("{}")
  created_at      DateTime  @default(now())
  updated_at      DateTime  @updatedAt

  game            Game      @relation(fields: [game_id], references: [id])
  declarer        User      @relation("ResultDeclarer", fields: [declared_by], references: [id])
  roller          User?     @relation("ResultRoller", fields: [rolled_back_by], references: [id])
  bets            Bet[]
  settlement      Settlement?

  @@unique([game_id, date, session])
  @@index([game_id, date])
  @@index([date, is_deleted])
  @@index([is_settled, is_rolled_back])
}

model Transaction {
  id              Int                  @id @default(autoincrement())
  txn_id          String               @unique
  user_id         Int
  type            TransactionType
  amount          Int
  direction       TransactionDirection
  balance_before  Int
  balance_after   Int
  reference       String?
  reference_type  String?
  performed_by    Int?
  notes           String?
  metadata        Json?                @default("{}")
  created_at      DateTime             @default(now())

  user            User                 @relation(fields: [user_id], references: [id])

  @@index([user_id, created_at(sort: Desc)])
  @@index([type])
  @@index([reference])
  @@index([performed_by])
  @@index([created_at(sort: Desc)])
}

model MemberPnl {
  id                Int      @id @default(autoincrement())
  user_id           Int
  game_id           Int
  date              String
  pnl               Int      @default(0)
  total_bets_volume Int      @default(0)
  total_bets_count  Int      @default(0)
  winners_count     Int      @default(0)
  losers_count      Int      @default(0)
  total_payout      Int      @default(0)
  commission_earned Int      @default(0)
  is_rolled_back    Boolean  @default(false)
  metadata          Json?    @default("{}")
  created_at        DateTime @default(now())
  updated_at        DateTime @updatedAt

  user              User     @relation(fields: [user_id], references: [id])
  game              Game     @relation(fields: [game_id], references: [id])

  @@unique([user_id, game_id, date])
  @@index([user_id, date])
  @@index([game_id, date])
  @@index([date])
}

model Settlement {
  id              Int              @id @default(autoincrement())
  result_id       Int              @unique
  game_id         Int
  date            String
  session         GameSession
  total_bets      Int              @default(0)
  total_bet_amount Int             @default(0)
  winners_count   Int              @default(0)
  losers_count    Int              @default(0)
  total_payout    Int              @default(0)
  net_pnl         Int              @default(0)
  status          SettlementStatus @default(completed)
  settled_by      Int
  settled_at      DateTime         @default(now())
  rolled_back_at  DateTime?
  rolled_back_by  Int?
  duration_ms     Int?
  metadata        Json?            @default("{}")
  created_at      DateTime         @default(now())
  updated_at      DateTime         @updatedAt

  result          Result           @relation(fields: [result_id], references: [id])
  game            Game             @relation(fields: [game_id], references: [id])
  settler         User             @relation("Settler", fields: [settled_by], references: [id])
  roller          User?            @relation("SettlementRoller", fields: [rolled_back_by], references: [id])
  bets            Bet[]
  entries         SettlementEntry[]

  @@index([game_id, date])
  @@index([status])
}

model SettlementEntry {
  id              Int      @id @default(autoincrement())
  settlement_id   Int
  bet_id          Int
  user_id         Int
  outcome         String   // "won" or "lost"
  bet_amount      Int
  win_amount      Int      @default(0)
  created_at      DateTime @default(now())

  settlement      Settlement @relation(fields: [settlement_id], references: [id])
  bet             Bet        @relation(fields: [bet_id], references: [id])
  user            User       @relation(fields: [user_id], references: [id])

  @@index([settlement_id])
  @@index([user_id, created_at(sort: Desc)])
}

model CreditLoan {
  id           Int        @id @default(autoincrement())
  loan_id      String     @unique
  user_id      Int
  given_by     Int
  type         LoanType
  amount       Int
  outstanding  Int
  status       LoanStatus @default(active)
  notes        String?
  metadata     Json?      @default("{}")
  created_at   DateTime   @default(now())
  updated_at   DateTime   @updatedAt

  receiver     User       @relation("LoanReceiver", fields: [user_id], references: [id])
  giver        User       @relation("LoanGiver", fields: [given_by], references: [id])

  @@index([user_id, status])
  @@index([given_by])
}

model Announcement {
  id             Int       @id @default(autoincrement())
  title          String
  message        String
  is_active      Boolean   @default(true)
  starts_at      DateTime?
  ends_at        DateTime?
  display_order  Int       @default(0)
  created_by     Int
  created_at     DateTime  @default(now())
  updated_at     DateTime  @updatedAt

  creator        User      @relation(fields: [created_by], references: [id])

  @@index([is_active, starts_at, ends_at])
}

model Banner {
  id             Int       @id @default(autoincrement())
  image_url      String
  title          String?
  link_url       String?
  display_order  Int       @default(0)
  is_active      Boolean   @default(true)
  created_by     Int
  created_at     DateTime  @default(now())
  updated_at     DateTime  @updatedAt

  creator        User      @relation(fields: [created_by], references: [id])

  @@index([is_active, display_order])
}

model RulesContent {
  id          Int      @id @default(autoincrement())
  content     String
  updated_by  Int
  version     Int      @default(1)
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt

  updater     User     @relation(fields: [updated_by], references: [id])
}

model AppSetting {
  id          Int      @id @default(autoincrement())
  key         String   @unique
  value       String
  category    String   @default("general")
  description String?
  updated_by  Int?
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt
}

model AdminAction {
  id           Int      @id @default(autoincrement())
  admin_id     Int
  action_type  String
  entity_type  String
  entity_id    Int?
  old_value    String?
  new_value    String?
  ip_address   String?
  user_agent   String?
  notes        String?
  created_at   DateTime @default(now())

  admin        User     @relation(fields: [admin_id], references: [id])

  @@index([admin_id, created_at(sort: Desc)])
  @@index([entity_type, entity_id])
  @@index([action_type])
  @@index([created_at(sort: Desc)])
}

model LoginLog {
  id             Int      @id @default(autoincrement())
  user_id        Int
  success        Boolean
  ip_address     String
  user_agent     String?
  failure_reason String?
  created_at     DateTime @default(now())

  user           User     @relation(fields: [user_id], references: [id])

  @@index([user_id, created_at(sort: Desc)])
  @@index([ip_address, created_at(sort: Desc)])
  @@index([success, created_at(sort: Desc)])
}

model DbBackup {
  id            Int          @id @default(autoincrement())
  filename      String
  s3_url        String?
  size_bytes    Int          @default(0)
  status        BackupStatus
  triggered_by  Int
  error_message String?
  started_at    DateTime     @default(now())
  completed_at  DateTime?
  created_at    DateTime     @default(now())

  triggerer     User         @relation(fields: [triggered_by], references: [id])
}

model BlockedBet {
  id          Int      @id @default(autoincrement())
  game_id     Int?
  bet_type    BetType?
  is_blocked  Boolean  @default(true)
  blocked_by  Int
  reason      String?
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt

  game        Game?    @relation(fields: [game_id], references: [id])
  blocker     User     @relation(fields: [blocked_by], references: [id])

  @@index([game_id, bet_type, is_blocked])
}
```

---

## 25. DATABASE INDEXES — COMPLETE LIST

### 25.1 Performance-Critical Indexes
```sql
-- USERS (Hierarchy & Auth)
users_user_id_key               UNIQUE on (user_id)
idx_users_role                  on (role)
idx_users_created_by            on (created_by)
idx_users_is_blocked            on (is_blocked)
idx_users_is_special            on (is_special)
idx_users_role_blocked_deleted  on (role, is_blocked, is_deleted)

-- BETS (Highest volume — every index matters)
bets_bet_id_key                 UNIQUE on (bet_id)
idx_bets_game_date_status       on (game_id, date, status)        ← Settlement query
idx_bets_user_date              on (user_id, date DESC)           ← Bet history
idx_bets_user_status            on (user_id, status)              ← Exposure calculation
idx_bets_result_id              on (result_id)                    ← Bets per result
idx_bets_settlement_id          on (settlement_id)                ← Bets per settlement
idx_bets_date_status            on (date, status)                 ← Daily reports
idx_bets_created_at             on (created_at DESC)              ← Recent bets feed

-- TRANSACTIONS (Financial ledger)
transactions_txn_id_key         UNIQUE on (txn_id)
idx_txn_user_date               on (user_id, created_at DESC)    ← Ledger
idx_txn_type                    on (type)                         ← Filter
idx_txn_reference               on (reference)                    ← Trace
idx_txn_performed_by            on (performed_by)                 ← Audit
idx_txn_created_at              on (created_at DESC)              ← Chronological

-- RESULTS
results_game_date_session_key   UNIQUE on (game_id, date, session)
idx_results_game_date           on (game_id, date DESC)
idx_results_date_deleted        on (date, is_deleted)
idx_results_settled_rolled      on (is_settled, is_rolled_back)

-- MEMBER P/L
member_pnl_user_game_date_key  UNIQUE on (user_id, game_id, date)
idx_pnl_user_date              on (user_id, date DESC)
idx_pnl_game_date              on (game_id, date)
idx_pnl_date                   on (date)

-- BETTING WINDOWS
betting_windows_game_date_key  UNIQUE on (game_id, date, session)
idx_windows_open_closes        on (is_open, closes_at)
idx_windows_game_date          on (game_id, date)

-- ADMIN ACTIONS (Audit Trail)
idx_actions_admin_date         on (admin_id, created_at DESC)
idx_actions_entity             on (entity_type, entity_id)
idx_actions_type               on (action_type)
idx_actions_created            on (created_at DESC)
```

---

## 26. SEED DATA

### 26.1 Seed Script
```typescript
// prisma/seed.ts

import { PrismaClient, BetType } from '@prisma/client';
import argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  
  // ====== DEFAULT GAMES ======
  const games = [
    { name: 'SRIDEVI', slug: 'sridevi', open_time: '11:42', close_time: '12:43', result_time: '12:45', color_code: '#22C55E', display_order: 1 },
    { name: 'TIME BAZAR', slug: 'time-bazar', open_time: '13:09', close_time: '14:09', result_time: '14:15', color_code: '#3B82F6', display_order: 2 },
    { name: 'MILAN DAY', slug: 'milan-day', open_time: '15:12', close_time: '17:13', result_time: '17:15', color_code: '#EAB308', display_order: 3 },
    { name: 'RAJDHANI DAY', slug: 'rajdhani-day', open_time: '15:19', close_time: '17:19', result_time: '17:25', color_code: '#A855F7', display_order: 4 },
    { name: 'NEW KAMDHENU DAY', slug: 'new-kamdhenu-day', open_time: '15:30', close_time: '17:30', result_time: '17:35', color_code: '#14B8A6', display_order: 5 },
    { name: 'KALYAN', slug: 'kalyan', open_time: '16:22', close_time: '18:22', result_time: '18:30', color_code: '#F97316', display_order: 6 },
    { name: 'SRIDEVI NIGHT', slug: 'sridevi-night', open_time: '19:24', close_time: '20:24', result_time: '20:30', color_code: '#22C55E', display_order: 7 },
    { name: 'NEW KAMDHENU NIGHT', slug: 'new-kamdhenu-night', open_time: '19:45', close_time: '20:45', result_time: '20:50', color_code: '#14B8A6', display_order: 8 },
    { name: 'MILAN NIGHT', slug: 'milan-night', open_time: '21:11', close_time: '23:11', result_time: '23:15', color_code: '#EAB308', display_order: 9 },
    { name: 'RAJDHANI NIGHT', slug: 'rajdhani-night', open_time: '21:44', close_time: '23:53', result_time: '23:55', color_code: '#A855F7', display_order: 10 },
    { name: 'MAIN BAZAR', slug: 'main-bazar', open_time: '22:01', close_time: '00:10', result_time: '00:15', color_code: '#EC4899', display_order: 11 },
  ];
  
  for (const game of games) {
    await prisma.game.upsert({
      where: { slug: game.slug },
      update: game,
      create: game,
    });
  }
  console.log(`✅ Seeded ${games.length} games`);
  
  // ====== GLOBAL DEFAULT PAYOUT MULTIPLIERS ======
  const multipliers = [
    { bet_type: BetType.SINGLE_AKDA, multiplier: 10 },
    { bet_type: BetType.SINGLE_PATTI, multiplier: 160 },
    { bet_type: BetType.DOUBLE_PATTI, multiplier: 320 },
    { bet_type: BetType.TRIPLE_PATTI, multiplier: 70 },
    { bet_type: BetType.JODI, multiplier: 100 },
  ];
  
  for (const m of multipliers) {
    await prisma.payoutMultiplier.upsert({
      where: { game_id_bet_type: { game_id: null, bet_type: m.bet_type } },
      update: { multiplier: m.multiplier },
      create: { game_id: null, bet_type: m.bet_type, multiplier: m.multiplier },
    });
  }
  console.log(`✅ Seeded ${multipliers.length} global payout multipliers`);
  
  // ====== DEFAULT APP SETTINGS ======
  const settings = [
    { key: 'whatsapp_number', value: '+919999999999', category: 'contact', description: 'WhatsApp contact number' },
    { key: 'min_bet_amount', value: '10', category: 'betting', description: 'Minimum bet amount in coins' },
    { key: 'max_bet_amount', value: '100000', category: 'betting', description: 'Maximum bet amount in coins' },
    { key: 'daily_reset_time', value: '02:00', category: 'general', description: 'Daily reset time in IST' },
    { key: 'result_retention_days', value: '2', category: 'general', description: 'Days to keep results before deletion' },
    { key: 'default_deal_percentage', value: '85', category: 'betting', description: 'Default deal percentage for new SMs' },
    { key: 'maintenance_mode', value: 'false', category: 'general', description: 'Enable maintenance mode' },
    { key: 'user_id_prefix', value: 'PL', category: 'general', description: 'Prefix for auto-generated user IDs' },
  ];
  
  for (const s of settings) {
    await prisma.appSetting.upsert({
      where: { key: s.key },
      update: { value: s.value },
      create: s,
    });
  }
  console.log(`✅ Seeded ${settings.length} app settings`);
  
  console.log('\n🎉 Seed complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

---

## 27. MIGRATION STRATEGY

### 27.1 Rules
```
1. NEVER edit existing migration files
2. ALWAYS create new migrations for schema changes
3. ALWAYS test migrations on a staging database first
4. ALWAYS backup database before running migrations in production
5. Use descriptive migration names: npx prisma migrate dev --name add_metadata_to_users
```

### 27.2 Initial Migration
```bash
# Create initial migration from schema
npx prisma migrate dev --name init

# Seed the database
npx prisma db seed

# Generate Prisma client
npx prisma generate
```

### 27.3 Adding New Columns (Future-Proofing)
```
To add a new column:
1. Add to schema.prisma with @default or nullable (?)
2. Run: npx prisma migrate dev --name add_new_column
3. Existing data is preserved with default value
4. NO downtime, NO data loss

Example — adding a "phone_number" to users:
  phone_number  String?   // Nullable — existing users have null

This is WHY we use nullable and defaults everywhere.
```

---

## 28. FUTURE-PROOFING & EXTENSIBILITY GUIDE

### 28.1 Adding a New Bet Type
```
1. Add value to BetType enum in Prisma schema
2. Run migration
3. Add validation in calculation.ts
4. Add multiplier row in payout_multipliers (global)
5. Add winner check logic in settlement.service.ts
6. Frontend: Add to bet type selector
IMPACT: Zero changes to existing tables. Just new enum value + business logic.
```

### 28.2 Adding a New Role
```
1. Add value to Role enum in Prisma schema
2. Run migration
3. Add role middleware rules
4. Add role-specific panel routes
5. Update hierarchy middleware
IMPACT: Zero changes to existing data. Users table already handles all roles.
```

### 28.3 Adding a New Transaction Type
```
1. Add value to TransactionType enum
2. Run migration
3. Add service logic that creates this transaction
IMPACT: Zero changes to existing transactions. Append-only table.
```

### 28.4 Adding Lottery Matka (Future Feature)
```
1. Add game_type field to games table (MATKA, LOTTERY_MATKA)
2. New game creation with type=LOTTERY_MATKA
3. Different bet types/rules for lottery matka
4. Frontend: Activate the second tab
IMPACT: games table already supports this via the metadata field.
Use metadata for lottery-specific config until enough features justify new columns.
```

### 28.5 Adding Multi-Language Support
```
1. Add locale field to users table
2. Frontend: i18n library (next-intl)
3. Content tables (announcements, rules) can have a locale field
IMPACT: Minimal schema change. Mostly frontend work.
```

### 28.6 The metadata Column Strategy
Every major table has a `metadata Json?` column. This is your escape hatch:

```
Need a new field on users but don't want to migrate yet?
→ Store it in metadata: { "phone": "+91...", "city": "Nagpur" }

Need extra info on a bet?
→ Store in metadata: { "source": "mobile_app", "quick_pick": true }

Later, when the field is confirmed important:
→ Move it to a proper column via migration
→ Backfill from metadata
→ Clean up metadata

This means you NEVER need an emergency schema change.
```

---

## 29. DATA INTEGRITY RULES & CONSTRAINTS

### 29.1 Database-Level Constraints
```sql
-- Users
ALTER TABLE users ADD CONSTRAINT chk_wallet_non_negative CHECK (wallet_balance >= 0 OR role = 'admin');
ALTER TABLE users ADD CONSTRAINT chk_deal_percentage CHECK (deal_percentage >= 0 AND deal_percentage <= 100);
ALTER TABLE users ADD CONSTRAINT chk_credit_limit CHECK (credit_limit >= 0);
ALTER TABLE users ADD CONSTRAINT chk_fix_limit CHECK (fix_limit >= 0);
ALTER TABLE users ADD CONSTRAINT chk_exposure CHECK (exposure >= 0);

-- Bets
ALTER TABLE bets ADD CONSTRAINT chk_bet_amount CHECK (bet_amount > 0);
ALTER TABLE bets ADD CONSTRAINT chk_payout_multiplier CHECK (payout_multiplier > 0);
ALTER TABLE bets ADD CONSTRAINT chk_potential_win CHECK (potential_win >= 0);
ALTER TABLE bets ADD CONSTRAINT chk_win_amount CHECK (win_amount >= 0);

-- Transactions
ALTER TABLE transactions ADD CONSTRAINT chk_txn_amount CHECK (amount > 0);

-- Payout Multipliers
ALTER TABLE payout_multipliers ADD CONSTRAINT chk_multiplier CHECK (multiplier > 0);
```

### 29.2 Application-Level Constraints (Enforced in Service Layer)
```
1. User's deal_percentage <= Parent's deal_percentage
2. Cannot credit more coins than parent has (unless Admin)
3. Cannot block a user above you in hierarchy
4. Cannot change password of user above you
5. Settlement only runs on pending bets (not already settled)
6. Rollback only runs on settled bets (not pending or already rolled back)
7. Betting window must be open AND game must be active for bet placement
8. Bet number must pass validation for its bet type
9. User must have sufficient balance for bet placement
10. Transaction balance_after must equal balance_before ± amount
```

---

## 30. QUERY PATTERNS — COMMON QUERIES

### 30.1 Get User's Downline (Recursive)
```sql
WITH RECURSIVE downline AS (
  SELECT id, user_id, name, role, deal_percentage, created_by
  FROM users WHERE created_by = $1
  UNION ALL
  SELECT u.id, u.user_id, u.name, u.role, u.deal_percentage, u.created_by
  FROM users u
  INNER JOIN downline d ON u.created_by = d.id
)
SELECT * FROM downline WHERE is_deleted = false;
```

### 30.2 Settlement Query (Get All Pending Bets)
```typescript
const pendingBets = await prisma.bet.findMany({
  where: {
    game_id: gameId,
    date: date,
    status: 'pending',
  },
  include: {
    user: { select: { id: true, user_id: true, wallet_balance: true, created_by: true } },
  },
  orderBy: { created_at: 'asc' },
});
```

### 30.3 Collection Report (Lena/Dena)
```typescript
const collection = await prisma.memberPnl.groupBy({
  by: ['user_id'],
  where: {
    user_id: { in: downlineIds },
    date: { gte: fromDate, lte: toDate },
  },
  _sum: { pnl: true, commission_earned: true },
});

// Positive pnl = LENA HAI (they owe you)
// Negative pnl = DENA HAI (you owe them)
// Zero = LE LIYA (settled)
```

### 30.4 Account List with Grand Total
```typescript
const users = await prisma.user.findMany({
  where: { created_by: parentId, is_deleted: false },
  select: {
    id: true, user_id: true, name: true, role: true,
    wallet_balance: true, deal_percentage: true, credit_limit: true,
    fix_limit: true, exposure: true, is_blocked: true, is_special: true,
  },
  orderBy: { created_at: 'desc' },
  skip: (page - 1) * limit,
  take: limit,
});

// Grand total (separate query for accuracy)
const grandTotal = await prisma.user.aggregate({
  where: { created_by: parentId, is_deleted: false },
  _sum: {
    wallet_balance: true,
    exposure: true,
    credit_limit: true,
  },
  _count: true,
});
```

### 30.5 Get Active Payout Multiplier
```typescript
async function getMultiplier(gameId: number, betType: BetType): Promise<number> {
  // Try per-game first
  const perGame = await prisma.payoutMultiplier.findFirst({
    where: { game_id: gameId, bet_type: betType, is_active: true },
  });
  if (perGame) return perGame.multiplier;
  
  // Fallback to global
  const global = await prisma.payoutMultiplier.findFirst({
    where: { game_id: null, bet_type: betType, is_active: true },
  });
  if (global) return global.multiplier;
  
  // Hardcoded fallback (should never reach here)
  const defaults: Record<string, number> = {
    SINGLE_AKDA: 10, SINGLE_PATTI: 160, DOUBLE_PATTI: 320,
    TRIPLE_PATTI: 70, JODI: 100,
  };
  return defaults[betType] || 10;
}
```

### 30.6 Check If Bet Is Blocked
```typescript
async function isBetBlocked(gameId: number, betType: BetType): Promise<boolean> {
  const blocked = await prisma.blockedBet.findFirst({
    where: {
      is_blocked: true,
      OR: [
        { game_id: gameId, bet_type: betType },     // Specific game + type
        { game_id: gameId, bet_type: null },          // All types for game
        { game_id: null, bet_type: betType },          // This type globally
        { game_id: null, bet_type: null },             // Everything blocked
      ],
    },
  });
  return !!blocked;
}
```

---

## DOCUMENT VERSION HISTORY

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Feb 2026 | Initial comprehensive Data Model |

---

**END OF DATA MODEL DOCUMENT — This document serves as the complete database blueprint for the Matka Betting Platform. Every table, every column, every index, every relationship, every constraint is defined here.**
