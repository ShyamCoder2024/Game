# PRODUCT REQUIREMENTS DOCUMENT (PRD)
# MATKA BETTING PLATFORM
## Version 1.0 | February 2026

---

## TABLE OF CONTENTS
1. [Product Overview](#1-product-overview)
2. [Game Logic & Rules](#2-game-logic--rules)
3. [User Roles & Hierarchy](#3-user-roles--hierarchy)
4. [Role Permissions Matrix](#4-role-permissions-matrix)
5. [Account Management Rules](#5-account-management-rules)
6. [Coin & Financial System](#6-coin--financial-system)
7. [Deal Percentage & Commission System](#7-deal-percentage--commission-system)
8. [Bet Types & Payout System](#8-bet-types--payout-system)
9. [Game Session Management](#9-game-session-management)
10. [Result Declaration & Settlement](#10-result-declaration--settlement)
11. [Settlement Engine (Lena/Dena/Le Liya)](#11-settlement-engine-lenadena-le-liya)
12. [Rollback System](#12-rollback-system)
13. [Credit & Loan System](#13-credit--loan-system)
14. [Admin Panel — Complete Feature Specification](#14-admin-panel--complete-feature-specification)
15. [Super Master Panel — Feature Specification](#15-super-master-panel--feature-specification)
16. [Master Panel — Feature Specification](#16-master-panel--feature-specification)
17. [User Page — Feature Specification](#17-user-page--feature-specification)
18. [Real-Time Requirements](#18-real-time-requirements)
19. [Daily Reset & Cron Jobs](#19-daily-reset--cron-jobs)
20. [Report & Analytics Requirements](#20-report--analytics-requirements)
21. [Non-Functional Requirements](#21-non-functional-requirements)
22. [Business Rules & Constraints](#22-business-rules--constraints)
23. [Security Requirements](#23-security-requirements)
24. [Future Scope (Planned)](#24-future-scope-planned)
25. [Glossary](#25-glossary)

---

## 1. PRODUCT OVERVIEW

### 1.1 What Is This Application?
A real-time Matka (Satta Matka) betting platform that allows users to place bets on number-based gambling games. The platform is managed through a hierarchical system where an Admin (God) controls the entire operation through Super Masters, Masters, and Users.

### 1.2 Business Context
- **Client Location:** Nagpur, India
- **Current Users:** ~5,000 (scaling to 20,000+)
- **Reference Platform:** allindia.bet (being replaced with a superior platform)
- **Revenue Model:** Admin earns through the house edge and cascading commission percentages through the hierarchy

### 1.3 Core Principle
The Admin is the GOD of the application. Everything is manual. Admin has unlimited coins, sets all rules, controls all percentages, declares all results, and has access to every account in the system. The application is 80% Admin panel work and 20% User-facing interface.

### 1.4 Four Separate Panels/Interfaces
| Panel | Access | URL Pattern |
|-------|--------|-------------|
| Admin Panel | Admin only (hardcoded credentials) | `/admin/*` |
| Super Master Panel | Super Masters (credentials created by Admin) | `/supermaster/*` |
| Master Panel | Masters (credentials created by Admin/Super Master) | `/master/*` |
| User Page | Users (credentials created by Admin/Super Master/Master) | `/` (public facing) |

### 1.5 Platform Requirements
- Mobile-first responsive design (most users access via mobile)
- Works on all modern browsers
- Android APK (via Capacitor) planned for future
- No iOS app required currently

---

## 2. GAME LOGIC & RULES

### 2.1 What Is Matka?
Matka is a numbers-based gambling game popular in India. Each game session produces a result consisting of three numbers.

### 2.2 Result Format
```
RESULT FORMAT: XXX - YY - ZZZ
Example: 388 - 90 - 280

Where:
├── 388 = OPEN PANNA (3-digit number)
├── 90  = JODI (2-digit result, auto-calculated)
└── 280 = CLOSE PANNA (3-digit number)
```

### 2.3 Result Calculation Logic
```
STEP 1: Admin enters Open Panna → 388
├── Sum digits: 3 + 8 + 8 = 19
└── Take last digit: 9 → This is "OPEN SINGLE"

STEP 2: Admin enters Close Panna → 280
├── Sum digits: 2 + 8 + 0 = 10
└── Take last digit: 0 → This is "CLOSE SINGLE"

STEP 3: System auto-calculates JODI
└── Combine: Open Single (9) + Close Single (0) = "90"

FINAL RESULT: 388 - 90 - 280
DISPLAY FORMAT: 388 - ⁹⁰ - 280 (Jodi shown in superscript style)
```

### 2.4 Game Sessions
Each game runs TWICE daily:
- **OPEN Session:** Admin declares Open Panna → Open Single is derived
- **CLOSE Session:** Admin declares Close Panna → Close Single is derived → Jodi is auto-calculated

### 2.5 Available Games (Default — Admin can add/remove/modify)
| Game Name | Open Time | Close Time | Color Code |
|-----------|-----------|------------|------------|
| SRIDEVI | 11:42 AM | 12:43 PM | Green |
| TIME BAZAR | 01:09 PM | 02:09 PM | Blue |
| MILAN DAY | 03:12 PM | 05:13 PM | Yellow |
| RAJDHANI DAY | 03:19 PM | 05:19 PM | Purple |
| NEW KAMDHENU DAY | 03:30 PM | 05:30 PM | Teal |
| KALYAN | 04:22 PM | 06:22 PM | Orange |
| SRIDEVI NIGHT | 07:24 PM | 08:24 PM | Green |
| NEW KAMDHENU NIGHT | 07:45 PM | 08:45 PM | Teal |
| MILAN NIGHT | 09:11 PM | 11:11 PM | Yellow |
| RAJDHANI NIGHT | 09:44 PM | 11:53 PM | Purple |
| MAIN BAZAR | 10:01 PM | 12:10 AM | Pink |

**IMPORTANT:** These times are reference only. Admin manually sets and can change the timing for every game. Each game has different close time which is set by Admin.

### 2.6 Game Display
Results on the user page display with color-coded cards showing:
- Date & Time of declaration
- Game Name (OPEN/CLOSE)
- Result in format: Open Panna – Jodi (superscript) – Close Panna
- Link to that game's chart (e.g., "KALYAN चार्ट")

---

## 3. USER ROLES & HIERARCHY

### 3.1 Hierarchy Structure
```
ADMIN (God — Infinite Coins — Hardcoded Credentials)
    │
    ├── SUPER MASTER (Created by Admin)
    │   ├── MASTER (Created by Admin or Super Master)
    │   │   └── USER (Created by Admin, Super Master, or Master)
    │   └── USER (Created by Admin or Super Master)
    │
    ├── MASTER (Created by Admin directly)
    │   └── USER (Created by Admin or Master)
    │
    └── USER (Created by Admin directly)
```

### 3.2 Role Definitions

#### ADMIN (God)
- **Credentials:** Hardcoded by developer. Admin CANNOT change their own ID or password. Only the developer can reset.
- **Coins:** UNLIMITED / INFINITE
- **Access:** Full access to everything. Can log into any account using master key.
- **Powers:** Create/manage all roles, declare results, set percentages, give credit, block anyone, rollback transactions, see all bets/transactions, control all settings.

#### SUPER MASTER
- **Credentials:** Created by Admin (system auto-generates unique ID, Admin sets password)
- **Coins:** Given by Admin (credit/loan)
- **Access:** Own panel only. Cannot access other accounts.
- **Powers:** Create Masters and Users under them, manage their downline, add coins to downline, see transactions of their downline, settlement (Lena/Dena/Le Liya), block members under them.
- **Limitation:** Cannot access Admin panel or other Super Masters' accounts.

#### MASTER
- **Credentials:** Created by Admin or Super Master
- **Coins:** Given by Admin or their Super Master
- **Access:** Own panel only. Cannot access other accounts.
- **Powers:** Same as Super Master BUT can only create Users (not Masters). Manage Users under them, add coins, see transactions, settlement.
- **Limitation:** Cannot create Masters. Cannot access other panels.

#### USER
- **Credentials:** Created by Admin, Super Master, or Master. Users CANNOT self-register.
- **Coins:** Given by their creator (Admin/Super Master/Master)
- **Access:** User page only — login screen with ID & Password.
- **Powers:** Place bets, view results, view charts, profile section (Statement, Ledger, Bet History, Rules, Change Password, Logout).
- **Limitation:** Cannot create anyone. Cannot access any management panel.

#### SPECIAL MASTER (Flag, not separate role)
- **Definition:** Any Super Master, Master, or User who receives a LOWER percentage or DIFFERENT credit limit than the default set by Admin.
- **Implementation:** A flag (`is_special: true`) on the existing account with custom percentage fields.
- **Purpose:** Admin gives preferential or different deal terms to specific members.

### 3.3 Account Creation Flow
```
1. Creator (Admin/Super Master/Master) initiates "Create Account"
2. Creator enters the new member's NAME
3. System auto-generates a UNIQUE ID (e.g., PL519, BSM80867)
4. Creator manually sets the PASSWORD for the new member
5. Creator sets the DEAL PERCENTAGE for the new member
6. Creator sets CREDIT LIMIT (coins to give)
7. Account is created → New member logs in with ID + Password
```

### 3.4 Account ID Format
- Auto-generated by system
- Must be unique across the entire platform
- Format examples: PL519, BSM80867, BS199, PL8239
- Prefix can indicate role (but not mandatory — Admin configures)

---

## 4. ROLE PERMISSIONS MATRIX

| Feature | Admin | Super Master | Master | User |
|---------|-------|-------------|--------|------|
| Access Admin Panel | ✅ | ❌ | ❌ | ❌ |
| Access SM Panel | ✅ (master key) | ✅ (own only) | ❌ | ❌ |
| Access Master Panel | ✅ (master key) | ❌ | ✅ (own only) | ❌ |
| Access User Page | ✅ (master key) | ❌ | ❌ | ✅ (own only) |
| Create Super Master | ✅ | ❌ | ❌ | ❌ |
| Create Master | ✅ | ✅ | ❌ | ❌ |
| Create User | ✅ | ✅ | ✅ | ❌ |
| Set Deal Percentage | ✅ (for all) | ✅ (for downline) | ✅ (for users) | ❌ |
| Add/Withdraw Coins | ✅ (for all) | ✅ (for downline) | ✅ (for users) | ❌ |
| Block Any Account | ✅ | ✅ (downline only) | ✅ (users only) | ❌ |
| Declare Results | ✅ | ❌ | ❌ | ❌ |
| Add/Manage Games | ✅ | ❌ | ❌ | ❌ |
| Set Game Timing | ✅ | ❌ | ❌ | ❌ |
| Edit Payout Multipliers | ✅ | ❌ | ❌ | ❌ |
| Rollback Settlement | ✅ | ❌ | ❌ | ❌ |
| View All Bets | ✅ (entire system) | ✅ (downline only) | ✅ (users only) | ✅ (own only) |
| View Settlement Report | ✅ (entire system) | ✅ (own chain) | ✅ (own chain) | ❌ |
| Give Credit/Loan | ✅ (to anyone) | ✅ (to downline) | ✅ (to users) | ❌ |
| Place Bets | ❌ | ❌ | ❌ | ✅ |
| View Results | ✅ | ✅ | ✅ | ✅ |
| View Charts | ✅ | ✅ | ✅ | ✅ |
| Change Own Password | ❌ (dev only) | ✅ | ✅ | ✅ |
| Change Others' Password | ✅ (anyone) | ✅ (downline) | ✅ (users) | ❌ |
| DB Backup | ✅ | ❌ | ❌ | ❌ |
| Block Bets | ✅ | ❌ | ❌ | ❌ |
| Block User IDs | ✅ | ❌ | ❌ | ❌ |
| Manage Content | ✅ | ❌ | ❌ | ❌ |
| Settings | ✅ | ❌ | ❌ | ❌ |
| See P/L Reports | ✅ (all levels) | ✅ (own + downline) | ✅ (own + users) | ✅ (own only) |

---

## 5. ACCOUNT MANAGEMENT RULES

### 5.1 Admin Account
- **ID:** Hardcoded by developer in environment variables / config
- **Password:** Hardcoded by developer (hashed with Argon2)
- **Reset:** Only developer can change Admin credentials (requires code deployment or env change)
- **Session:** Admin can have only ONE active session at a time
- **Master Key:** Admin can enter any member's ID to access their account view

### 5.2 Auto-Generated User IDs
- System generates unique IDs upon account creation
- IDs are permanent and cannot be changed
- Format: Alphanumeric string (e.g., PL519, BSM80867)
- Must be unique across all roles

### 5.3 Password Rules
- Minimum 6 characters
- Set by the creator of the account (not the account holder initially)
- Account holder can change their own password after first login (except Admin)
- Admin can change anyone's password from Admin panel
- Super Master can change password for their downline
- Master can change password for their Users

### 5.4 Account Blocking
- Blocked accounts cannot login
- Blocked accounts' pending bets are voided (coins returned)
- Admin can block anyone
- Super Master can block their Masters and Users
- Master can block their Users
- A blocked Super Master's entire downline is effectively frozen (Masters and Users under them cannot operate)

### 5.5 Account Hierarchy Chain
Every account has a `created_by` reference indicating who created it. This forms a tree:
```
Admin (root)
├── SM-1 (created_by: Admin)
│   ├── M-1 (created_by: SM-1)
│   │   ├── U-1 (created_by: M-1)
│   │   └── U-2 (created_by: M-1)
│   └── U-3 (created_by: SM-1)
└── SM-2 (created_by: Admin)
    └── M-2 (created_by: SM-2)
        └── U-4 (created_by: M-2)
```

This chain determines:
- Who can see whose data
- How P/L flows up the hierarchy
- Settlement (Lena/Dena) relationships
- Permission boundaries

---

## 6. COIN & FINANCIAL SYSTEM

### 6.1 Core Rule: 1 COIN = 1 RUPEE. NO PAISA. INTEGERS ONLY.
- All amounts stored as integers in the database
- No decimal points anywhere in the application
- Display format: ₹10,000 (never ₹10,000.50)
- Minimum bet: ₹10 (configurable by Admin)

### 6.2 Coin Flow (Top to Bottom)
```
ADMIN (Infinite Coins)
    │
    │── Credits 1,00,000 coins to Super Master A
    │
    SUPER MASTER A (Balance: 1,00,000)
    │
    │── Credits 50,000 coins to Master B
    │
    MASTER B (Balance: 50,000)
    │
    │── Credits 10,000 coins to User C
    │
    USER C (Balance: 10,000)
    │
    └── Places bet of 1,000 coins → Balance: 9,000
```

### 6.3 Coin Operations
| Operation | Who Can Do | Effect |
|-----------|-----------|--------|
| Credit (Add Coins) | Admin → Anyone; SM → Downline; Master → Users | Increases target's balance |
| Debit (Withdraw Coins) | Admin → Anyone; SM → Downline; Master → Users | Decreases target's balance |
| Bet Placement | User only | Deducts bet amount from User's balance |
| Win Payout | System (automatic) | Credits win amount to User's balance |
| Rollback | Admin only | Reverses all transactions of a specific settlement |

### 6.4 Transaction Types
Every coin movement creates a transaction record:
| Type | Description | Debit/Credit |
|------|------------|-------------|
| `CREDIT_IN` | Coins received from above hierarchy | Credit (+) |
| `CREDIT_OUT` | Coins given to below hierarchy | Debit (–) |
| `BET_PLACED` | User placed a bet | Debit (–) |
| `BET_WON` | User won a bet (auto-credited) | Credit (+) |
| `BET_LOST` | Bet lost (already deducted at placement) | No movement |
| `WITHDRAWAL` | Coins withdrawn by above hierarchy | Debit (–) |
| `ROLLBACK_DEBIT` | Rollback removed previously credited amount | Debit (–) |
| `ROLLBACK_CREDIT` | Rollback returned previously debited amount | Credit (+) |
| `LOAN_IN` | Credit/Loan received from Admin | Credit (+) |
| `LOAN_OUT` | Credit/Loan given to downline | Debit (–) |

### 6.5 Wallet Balance Rules
- Balance can NEVER go negative for Users
- Admin has infinite balance (conceptually — stored as very large number or handled specially)
- Before any debit operation, system MUST check sufficient balance
- All balance changes MUST be atomic (database transaction — either complete or rollback entirely)
- Balance displayed in User header: "Coins: 10,000"
- Used Limit displayed: Shows total exposure (coins locked in pending bets)

### 6.6 Admin's Infinite Coins
- Admin's wallet is conceptually unlimited
- Implementation: Either a very large hardcoded number or a special flag that bypasses balance checks
- When Admin credits coins to anyone, it's essentially creating coins out of thin air
- This mimics how the real-world operation works — the Admin (bookie) has unlimited capital

---

## 7. DEAL PERCENTAGE & COMMISSION SYSTEM

### 7.1 How Deals Work
When Admin creates a Super Master, Admin sets a DEAL PERCENTAGE. This percentage determines how profit/loss is split between them.

```
EXAMPLE:
Admin creates Super Master A with 85% deal.
├── This means: SM-A keeps 85% of profit/loss
└── Admin keeps 15% of profit/loss

SM-A creates Master B with 70% deal.
├── This means: Master B keeps 70% of profit/loss
├── SM-A keeps 15% (85% - 70% = 15%)
└── Admin keeps 15% (100% - 85% = 15%)

Master B creates User C with 60% deal.
├── This means: No further split for User C
├── Master B keeps 10% (70% - 60% = 10%)
├── SM-A keeps 15% (85% - 70% = 15%)
└── Admin keeps 15% (100% - 85% = 15%)
```

### 7.2 Percentage Rules
- Admin always sets the TOP percentage for Super Masters
- Each level can give a percentage LESS THAN OR EQUAL to their own percentage to their downline
- The DIFFERENCE between percentages at each level is that level's commission
- All percentages are manually set by the creator of the account
- Admin can see and modify ANY percentage at ANY level
- Admin can see the full chain of deal percentages in reports

### 7.3 Special Master
- A Special Master is any member who gets a LOWER percentage than the default
- Example: Default SM deal is 85%. A Special SM gets 70%. They are flagged as Special.
- Admin sets this manually when creating or editing the account
- Flagged in database as `is_special: true`
- Admin report clearly shows Special Masters with their custom percentages

### 7.4 P/L Cascade on Bet Result
When a User wins or loses, the P/L cascades up through the hierarchy based on deal percentages:

```
SCENARIO: User C bets ₹1,000 on JODI and LOSES.

P/L Distribution (User Lost ₹1,000):
├── Master B earns: ₹1,000 × 10% = ₹100
├── Super Master A earns: ₹1,000 × 15% = ₹150
└── Admin earns: ₹1,000 × 15% = ₹150
    (Remaining 60% stays as house/system margin)

SCENARIO: User C bets ₹1,000 on JODI (100x) and WINS ₹1,00,000.

P/L Distribution (User Won ₹1,00,000):
├── Master B loses: ₹1,00,000 × 10% = ₹10,000
├── Super Master A loses: ₹1,00,000 × 15% = ₹15,000
└── Admin loses: ₹1,00,000 × 15% = ₹15,000
    (Payout to user comes from the chain proportionally)
```

### 7.5 Admin Percentage Report
Admin needs a report page that shows:
- All Super Masters with their deal % set by Admin
- Under each SM: All Masters with their deal % set by SM
- Under each Master: All Users with their deal % set by Master
- The CHAIN of percentages clearly visible
- Who is a Special Master (highlighted differently)
- Profit/Loss at each level based on these percentages
- Grand total of all P/L across the entire hierarchy

---

## 8. BET TYPES & PAYOUT SYSTEM

### 8.1 Five Bet Types (ONLY THESE)

#### 1. SINGLE AKDA (Single Digit)
- **What:** Bet on a single digit (0-9)
- **Valid Numbers:** 0, 1, 2, 3, 4, 5, 6, 7, 8, 9
- **Default Payout:** 10x (₹100 bet → ₹1,000 win)
- **Win Condition:** Bet number matches Open Single OR Close Single
- **Example:** User bets on "9". Result is 388-90-280. Open Single = 9. User WINS.
- **Note:** Single Akda can win on BOTH open and close singles

#### 2. SINGLE PATTI (Single Panna — all digits different)
- **What:** Bet on a 3-digit number where all three digits are DIFFERENT
- **Valid Numbers:** Three-digit numbers with all unique digits (e.g., 127, 389, 456)
- **Default Payout:** 160x (₹100 bet → ₹16,000 win)
- **Win Condition:** Bet number matches Open Panna OR Close Panna exactly
- **Example:** User bets on "280". Result is 388-90-280. Close Panna = 280. User WINS.

#### 3. DOUBLE PATTI (Double Panna — one pair)
- **What:** Bet on a 3-digit number where exactly TWO digits are the same
- **Valid Numbers:** Three-digit numbers with exactly one pair (e.g., 223, 558, 112)
- **Default Payout:** 320x (₹100 bet → ₹32,000 win)
- **Win Condition:** Bet number matches Open Panna OR Close Panna exactly
- **Example:** User bets on "388". Result is 388-90-280. Open Panna = 388. User WINS.

#### 4. TRIPLE PATTI (Triple Panna — all digits same)
- **What:** Bet on a 3-digit number where ALL THREE digits are the same
- **Valid Numbers:** 000, 111, 222, 333, 444, 555, 666, 777, 888, 999
- **Default Payout:** 70x (₹100 bet → ₹7,000 win)
- **Win Condition:** Bet number matches Open Panna OR Close Panna exactly
- **Example:** User bets on "777". Result is 777-XX-XXX. Open Panna = 777. User WINS.

#### 5. JODI (Pair — 2 digits)
- **What:** Bet on the 2-digit Jodi number
- **Valid Numbers:** 00 to 99 (must be 2 digits — "05" not "5")
- **Default Payout:** 100x (₹100 bet → ₹10,000 win)
- **Win Condition:** Bet number matches the auto-calculated Jodi exactly
- **Example:** User bets on "90". Result is 388-90-280. Jodi = 90. User WINS.

### 8.2 Payout Multiplier Rules
| Bet Type | Default Multiplier | Admin Editable | Per-Game Override |
|----------|-------------------|----------------|-------------------|
| Single Akda | 10x | ✅ Yes | ✅ Yes |
| Single Patti | 160x | ✅ Yes | ✅ Yes |
| Double Patti | 320x | ✅ Yes | ✅ Yes |
| Triple Patti | 70x | ✅ Yes | ✅ Yes |
| Jodi | 100x | ✅ Yes | ✅ Yes |

- **Global Default:** Admin sets default multipliers for ALL games
- **Per-Game Override:** Admin can set DIFFERENT multipliers for a specific game
- **If per-game multiplier exists → use it. If not → use global default.**
- **Multiplier changes apply to FUTURE bets only, not existing pending bets**
- **Pending bets use the multiplier that was active when the bet was placed**

### 8.3 Bet Number Validation Rules
```
SINGLE AKDA:
├── Must be exactly 1 digit
├── Range: 0-9
└── Regex: /^[0-9]$/

JODI:
├── Must be exactly 2 digits
├── Range: 00-99 (leading zero preserved)
└── Regex: /^[0-9]{2}$/

SINGLE PATTI:
├── Must be exactly 3 digits
├── All three digits must be DIFFERENT
├── Range: 100-999 (or 012, 013, etc. — leading zeros may apply based on game rules)
└── Validation: digit[0] ≠ digit[1] ≠ digit[2] ≠ digit[0]

DOUBLE PATTI:
├── Must be exactly 3 digits
├── Exactly TWO digits must be the same
├── Range: 100-999
└── Validation: exactly one pair exists

TRIPLE PATTI:
├── Must be exactly 3 digits
├── ALL THREE digits must be the same
├── Valid set: {000, 111, 222, 333, 444, 555, 666, 777, 888, 999}
└── Validation: digit[0] === digit[1] === digit[2]
```

### 8.4 Minimum Bet Amount
- Default: ₹10 (configurable by Admin in Settings)
- Maximum: No maximum (controlled by User's available balance and exposure limit)
- Amount must be a whole number (integer) — no paisa

---

## 9. GAME SESSION MANAGEMENT

### 9.1 Betting Window
- Each game has a betting window that OPENS and CLOSES at specific times
- Times are set MANUALLY by Admin for each game independently
- When betting window is OPEN → Users can place bets
- When betting window is CLOSED → No new bets accepted
- Countdown timer shown to users: "Closes in: 00:15:30"
- Bets MUST NOT be accepted after the closed time for a particular game

### 9.2 Game Lifecycle (Daily)
```
1. 2:00 AM IST → System auto-refreshes all games (daily reset)
2. Games become available for the new day
3. Betting windows open at Admin-configured times
4. Users place bets during open windows
5. Betting window closes at Admin-configured close time
6. Admin declares result at result time
7. System auto-settles all bets for that game
8. P/L cascades through hierarchy
9. Results displayed on all panels with real-time update
10. After 2 days → Results permanently deleted from the system
```

### 9.3 Admin Game Controls
- **Add new game:** Name, Open time, Close time, Result time, Color code, Active/Inactive
- **Edit existing game:** Change any parameter including timing
- **Disable/Enable game:** Toggle game visibility and betting
- **Set per-game payout multipliers:** Override global defaults for specific games
- **Delete game:** Remove game entirely (with confirmation — affects historical data)

### 9.4 Betting Close Time vs Result Time
```
Betting Close Time: 3:30 PM ← Users can bet until this time
Result Time: 3:45 PM ← Admin declares result at this time (or whenever ready)
Gap: 15 minutes (this gap is flexible — Admin controls both times)
```

### 9.5 Open & Close Sessions
Each game has TWO sessions per day:
- **OPEN Session:** Admin declares Open Panna → System derives Open Single
- **CLOSE Session:** Admin declares Close Panna → System derives Close Single → Auto-calculates Jodi

Users can bet on:
- OPEN session bets (Single Akda on Open Single, Panna on Open Panna)
- CLOSE session bets (Single Akda on Close Single, Panna on Close Panna, Jodi)

---

## 10. RESULT DECLARATION & SETTLEMENT

### 10.1 Result Declaration (Admin Only — Manual)
```
Admin opens "Declare Result" page
├── Selects Game (e.g., KALYAN)
├── Selects Session (OPEN or CLOSE)
├── Enters Date (defaults to today)
│
├── For OPEN session:
│   └── Enters Open Panna (3 digits, e.g., 388)
│       System auto-calculates: Open Single = (3+8+8) % 10 = 9
│
├── For CLOSE session:
│   └── Enters Close Panna (3 digits, e.g., 280)
│       System auto-calculates: Close Single = (2+8+0) % 10 = 0
│       System auto-calculates: Jodi = Open Single + Close Single = "90"
│
└── Admin clicks "Declare Result"
```

### 10.2 After Result Declaration — Automated Settlement
```
IMMEDIATELY after Admin clicks "Declare Result":

1. System fetches ALL pending bets for this game/date/session
2. For EACH pending bet:
   ├── Compare bet_number against declared result
   ├── Determine if WINNER or LOSER based on bet type rules
   │
   ├── If WINNER:
   │   ├── Calculate: win_amount = bet_amount × payout_multiplier
   │   ├── Credit win_amount to User's wallet (atomic transaction)
   │   ├── Update bet status → "won"
   │   ├── Create transaction record (type: BET_WON)
   │   ├── Calculate P/L cascade through hierarchy (percentage system)
   │   ├── Update P/L for Master, Super Master, Admin
   │   └── Send real-time notification to User
   │
   └── If LOSER:
       ├── Update bet status → "lost"
       ├── Calculate P/L cascade through hierarchy
       ├── Update P/L for Master, Super Master, Admin
       └── (Amount already deducted at bet placement time)

3. Broadcast result via WebSocket to ALL connected users
4. Update dashboard stats in real-time
5. Close betting window for this session
```

### 10.3 Winner Determination Rules
| Bet Type | Wins If | Checked Against |
|----------|---------|----------------|
| SINGLE_AKDA | bet_number matches Open Single OR Close Single | Both sessions |
| SINGLE_PATTI | bet_number matches Open Panna OR Close Panna | Both sessions |
| DOUBLE_PATTI | bet_number matches Open Panna OR Close Panna | Both sessions |
| TRIPLE_PATTI | bet_number matches Open Panna OR Close Panna | Both sessions |
| JODI | bet_number matches calculated Jodi | Close session only |

### 10.4 Critical Settlement Rules
- Settlement is 100% AUTOMATIC — Admin does NOT manually credit winnings
- All settlements must be ATOMIC (database transaction)
- If settlement fails for any bet, the ENTIRE settlement for that game must rollback
- Settlement must happen within seconds of result declaration
- P/L cascade calculations must be 100% accurate — no rounding errors (integer math only)
- Each bet's payout multiplier is the one that was active WHEN THE BET WAS PLACED (not current multiplier)

---

## 11. SETTLEMENT ENGINE (LENA/DENA/LE LIYA)

### 11.1 Concept
This is a traditional Indian bookkeeping system used in the hierarchy:
- **LENA HAI (लेना है):** "Receivable" — Money someone owes to you
- **DENA HAI (देना है):** "Payable" — Money you owe to someone
- **LE LIYA (ले लिया):** "Settled/Cleared" — Payment has been made and settled

### 11.2 How It Works In The Hierarchy
```
After game results are settled:

ADMIN's Collection Report:
├── LENA HAI (Receivable from):
│   ├── SM-A: ₹67,06,170 (SM-A owes Admin from losses)
│   └── SM-B: ₹9,850
│   └── Total Receivable: ₹67,16,020
│
├── DENA HAI (Payable to):
│   ├── BS199: ₹490 (Admin owes this from winnings)
│   └── Total Payable: ₹490
│
└── LE LIYA (Cleared/Settled):
    ├── BSC682 (office 01): ₹0
    ├── BSC45346 (office 02): ₹0
    ├── BS86732: ₹0
    └── PL854: ₹0
    └── Total Cleared: ₹0

SUPER MASTER's Settlement:
├── LENA HAI: What their Masters/Users owe them
├── DENA HAI: What they owe their Masters/Users (from wins)
└── LE LIYA: What's been settled
```

### 11.3 Settlement Flow
1. Results are declared and bets are settled automatically
2. P/L is calculated at each hierarchy level based on deal percentages
3. The Lena/Dena/Le Liya report is generated automatically
4. Admin/Super Master/Master can view their collection report
5. When actual money changes hands (offline via WhatsApp/UPI), the relevant person marks it as "Le Liya" (settled)
6. Grand total always shown at the bottom of each column

---

## 12. ROLLBACK SYSTEM

### 12.1 What Is Rollback?
Rollback is the ability for Admin to UNDO an entire game settlement. This is used when:
- Admin declared wrong result
- A bet was incorrectly processed
- Need to correct and re-settle

### 12.2 Rollback Process
```
Admin opens Settlement → Match Rollback
├── Sees list of all settled matches with dates
├── Each row shows: Date, Sport, Match Name, Settlement Date, Action
├── Admin clicks "Roll Back" on a specific match
│
├── System REVERSES all transactions for that match:
│   ├── All winners: Win amount DEDUCTED from their wallet
│   ├── All losers: Bet amount CREDITED back to their wallet
│   ├── All P/L cascade entries reversed for hierarchy
│   ├── Result removed from declared results
│   ├── All bets reset to "pending" status
│   └── All transaction records marked as "rolled_back"
│
├── Match status changes to "Undeclared"
├── Admin can now re-declare the correct result
└── System re-settles with new result
```

### 12.3 Rollback Rules
- ONLY Admin can perform rollback
- Rollback reverses EVERYTHING — wallet balances, P/L, transactions
- Rollback creates new transaction records (type: ROLLBACK_DEBIT / ROLLBACK_CREDIT)
- Original transactions are NOT deleted — they're marked as rolled back (audit trail)
- After rollback, Admin can re-declare result and system re-settles
- Rollback must be ATOMIC — all or nothing
- Must handle edge cases: what if a user already withdrew their winnings? (Flag this to Admin)

---

## 13. CREDIT & LOAN SYSTEM

### 13.1 How Credit Works
Admin can give credit/loan to ANY member (Super Master, Master, User). This is separate from regular coin transfers.

### 13.2 Credit Flow
```
Admin gives ₹1,00,000 credit to Super Master A
├── SM-A's balance increases by ₹1,00,000
├── Transaction record created (type: LOAN_IN)
├── Credit tracked separately in SM-A's account
├── SM-A can now distribute these coins to Masters/Users
└── Admin's report shows total credit given to each member
```

### 13.3 Credit Limit
- Admin can set a CREDIT LIMIT for each member
- Member cannot receive credit beyond their limit
- Credit limit is visible in the account list table
- Admin can modify credit limits at any time

### 13.4 Fix Limit
- Each member has a "Fix Limit" — the maximum operational amount
- This controls the total exposure a member can have
- Shown in the account management table
- Set by Admin (or by creator for downline members)

---

## 14. ADMIN PANEL — COMPLETE FEATURE SPECIFICATION

### 14.1 Dashboard
| Widget | Data | Real-Time |
|--------|------|-----------|
| Total Users | Count of all registered users across hierarchy | Updated on user creation |
| Active Users Today & Bets | Users who logged in today + total bets placed today | Live |
| Today's Game Status | List of all games with Open/Close/Declared status | Live |
| Upcoming Result Timings | Next game results with countdown | Live countdown |
| Today's Profit/Loss | Net P/L across all games settled today | Updated on settlement |

### 14.2 Leaders Section
#### Super Masters List
- Table: S.No, User Name, Name, Fix Limit, My Matka Share %, Agent Matka Share %, Matka Commission, Is Special, Actions (Edit, Change Password)
- Create Super Master button
- Search, CSV export, PDF export
- Grand total row

#### Masters List
- Same structure as Super Masters
- Shows which Super Master created them
- Create Master button

#### Users List
- Same structure
- Shows which Master/SM created them
- Create User button

#### Special Masters List
- Filtered view of all members flagged as Special
- Shows their custom percentages vs default percentages

### 14.3 Manage Game Section
#### Add Games
- Form: Game Name, Open Time, Close Time, Result Time, Color Code, Active/Inactive toggle
- Validation: Times must be in IST, Close time must be after Open time

#### Declare Results
- Select Game → Select Session (Open/Close) → Enter Panna (3 digits)
- System auto-calculates Single and Jodi
- Preview result before confirming
- "Declare" button triggers settlement

#### Own Game Result & Declare
- Admin creates a custom/one-off game and declares its result

#### Manage All Games
- List of all games with current status
- Edit, Disable, Delete actions
- Per-game payout multiplier override

### 14.4 Client Section
#### Create Accounts
- Create User, Super Master, or Master
- Form: Name, Role, Password, Deal %, Credit Limit, Fix Limit
- System auto-generates unique ID

#### Add Coins & Withdraw
- Select member by ID or search by name
- Enter amount (integer only)
- Select: Add or Withdraw
- Notes field for reference
- Confirmation dialog
- Transaction record created automatically

#### Manage Accounts with History
- Complete account list (like silverbhai reference)
- Columns: User Name, Credit Reference, Balance, Client P/L, Exposure, Available Balance, Status, Exposure Limit, Default %, Account Type, Actions (D, W, L, C, P)
- Quick action buttons: Deposit, Withdraw, Ledger, Client Report, P&L
- Active/Inactive tabs
- CSV/PDF export
- **GRAND TOTAL ROW** at bottom showing totals for all columns
- Search functionality

### 14.5 Settlement Section
#### Roll Back
- List of all settled matches
- Columns: Date, Sport, Match Name, Settlement Date, Action
- Roll Back button per match
- Confirmation dialog with warning
- Rollback process as defined in Section 12

### 14.6 Content Section
#### Announcements
- Create/Edit/Delete announcements
- Displayed as scrolling marquee on user page
- Date range for visibility

#### Banners
- Upload banner images
- Set display order
- Carousel on user page homepage
- Activate/Deactivate banners

#### Set Rules
- Rich text editor for game rules
- Displayed on User's "Rules" page
- Admin can update anytime

#### Update WhatsApp Number
- Single field to update the WhatsApp contact number
- This number is used across the application for "Contact Admin" features

### 14.7 Settings Section
#### Change Password (For Anyone)
- Admin searches or selects a member
- Sets new password for them
- Admin's OWN password cannot be changed here (hardcoded by developer)

#### DB Backup (Manual)
- "Backup Now" button
- Creates a full database dump
- Downloads as SQL file or saves to S3
- Shows backup history with timestamps

#### Block Bets
- Admin can block betting on specific games
- Block specific bet types for specific games
- Block betting entirely (emergency switch)

#### Block User ID
- Search and select any user/SM/Master
- Block/Unblock toggle
- Blocked users cannot log in
- Show list of currently blocked IDs

---

## 15. SUPER MASTER PANEL — FEATURE SPECIFICATION

### 15.1 No Dashboard Required
Super Masters don't need a dashboard with stats. They have management sections only.

### 15.2 Features
| Feature | Description |
|---------|------------|
| Create Master | Create new Master accounts under them |
| Create User | Create new User accounts under them |
| Manage Members | View all Masters and Users under them, block/unblock |
| Add/Withdraw Coins | Add or withdraw coins from their downline |
| View Transactions | See all transactions by their Masters and Users |
| Settlement Report | Lena Hai / Dena Hai / Le Liya for their downline |
| View Bets | See all bets placed by Users in their chain |
| Change Password | Change their own password or their downline's password |
| View Results | See results with 2-day filter |

---

## 16. MASTER PANEL — FEATURE SPECIFICATION

### 16.1 Same as Super Master but Limited
- Can only create USERS (not Masters)
- Can only manage Users under them
- Same features otherwise: Add coins, view transactions, settlement, view bets, change passwords

---

## 17. USER PAGE — FEATURE SPECIFICATION

### 17.1 Login Page
- ONLY a login form — no registration option
- Fields: ID (auto-generated, given by creator) + Password
- "Forgot Password?" → Message: "Contact your master/admin"
- Clean, mobile-first design

### 17.2 Home Page (After Login)
- Header: User ID, Coins balance, Used Limit (exposure)
- Scrolling marquee: Announcements
- Banner carousel (images set by Admin)
- Two tabs: MATKA | LOTTERY MATKA (only MATKA active currently)
- Results feed: Color-coded cards for each game result
  - Format: Game Name, Open Panna – Jodi (superscript) – Close Panna
  - Link to chart for each game
- WhatsApp floating button (bottom right)
- Real-time updates via WebSocket — no page refresh needed

### 17.3 Betting Page
```
Step 1: Select Game (list of active games with open betting windows)
├── Shows countdown timer for each game
├── Indicates OPEN/CLOSED status

Step 2: Select Bet Type
├── Single Akda (10x)
├── Single Patti (160x)
├── Double Patti (320x)
├── Triple Patti (70x)
└── Jodi (100x)
(Multipliers shown are current active multipliers for selected game)

Step 3: Enter Details
├── Number input (validated based on bet type)
├── Amount input (integer, minimum ₹10)
├── Shows: "Potential Win: ₹XX,XXX"
├── Shows: "Current Balance: ₹X,XXX"
└── [PLACE BET] button

Step 4: Confirmation
├── Bet ID generated
├── Amount deducted from wallet
├── Balance updated in real-time
└── Bet appears in "My Bets Today" section

My Bets Today (below betting form):
├── List of all bets placed today
├── Shows: Bet Type, Number, Amount, Status (Pending/Won/Lost)
└── Updates in real-time when results are declared
```

### 17.4 Charts Page
- Select Game (dropdown)
- Select Date Range (from/to date picker)
- Weekly grid display:
  - Rows: Week date ranges
  - Columns: MON, TUE, WED, THU, FRI, SAT, SUN
  - Each cell: Open Panna digits (top), Jodi in red/bold (middle), Close Panna digits (bottom)
  - Asterisk (*) for holidays/no results
- Jodi Chart and Panel Chart views

### 17.5 Profile Section (Dropdown Menu)
| Menu Item | Description |
|-----------|------------|
| Statement | Summary of all financial activity |
| Ledger | Detailed transaction log (credits, debits, bets, wins) |
| Bet History | All bets with status (won/lost/pending), filterable by date/game |
| Rules | Game rules set by Admin (read-only) |
| Change Password | Change own password (Old + New + Confirm) |
| Logout | End session |

### 17.6 Result Filter
- All members (Admin, SM, Master, User) can filter results by date
- Results are visible for 2 days only
- After 2 days, results are permanently deleted from the system
- Filter options: Today, Yesterday, Custom date range (within 2 days)

---

## 18. REAL-TIME REQUIREMENTS

### 18.1 What Must Be Real-Time (No Page Refresh)
| Event | Who Sees It | Update Method |
|-------|------------|---------------|
| Result Declared | All connected users | WebSocket broadcast |
| Wallet Balance Change | Affected user | WebSocket to specific user |
| Bet Placed | User who placed it | Instant UI update |
| Bet Won/Lost | User who placed it | WebSocket notification |
| Betting Window Open/Close | All users viewing that game | WebSocket + countdown timer |
| Dashboard Stats | Admin | WebSocket updates |
| New User Created | Admin panel | WebSocket |
| Announcement Published | All users | WebSocket broadcast |

### 18.2 WebSocket Channels
```
game:{gameId}:result      → Result declared for a game
game:{gameId}:window      → Betting window open/close status
user:{userId}:wallet      → Wallet balance updated
user:{userId}:bet         → Bet status changed (won/lost)
user:{userId}:notification → General notifications
admin:dashboard           → Dashboard stats update
admin:bet-stream          → Live bet placement stream
announcements             → New announcements
```

### 18.3 Application Should Be
- Highly real-time
- Smooth and responsive
- No need to refresh — EVER
- Every single update works in real-time
- Works on slow mobile connections (graceful degradation)

---

## 19. DAILY RESET & CRON JOBS

### 19.1 Daily Reset at 2:00 AM IST
```
At exactly 2:00 AM IST every day:
├── Reset all game statuses for the new day
├── Create new betting windows for all active games
├── Archive yesterday's results (keep for 2 more days)
├── Delete results older than 2 days PERMANENTLY
├── Reset daily counters (active users today, bets today)
├── Admin must see yesterday's results after refreshing
└── Log the reset in system logs
```

### 19.2 Result Deletion (2-Day Rule)
- Results are permanently deleted after 2 days
- This applies to ALL members (Admin, SM, Master, User)
- Deletion happens during the 2 AM reset
- Historical charts data: TBD — charts may need longer retention (discuss with client)
- **IMPORTANT:** Bet and transaction records are NOT deleted — only the result display data

### 19.3 Betting Window Auto-Close
- If Admin doesn't manually close a betting window, the system auto-closes it at the configured close time
- Cron job checks every minute for windows that should be closed
- No bets accepted after auto-close

---

## 20. REPORT & ANALYTICS REQUIREMENTS

### 20.1 Admin Reports
| Report | Description | Real-Time |
|--------|------------|-----------|
| **Profit/Loss Report** | P/L per game, per day, per member, with hierarchy breakdown | Updated on settlement |
| **Collection Report** | Lena/Dena/Le Liya per member | Updated on settlement |
| **Bet Report** | All bets filterable by game, date, user, bet type, status | Live |
| **User Activity Report** | Login times, active sessions, bet frequency | Daily |
| **Percentage Deal Report** | Full hierarchy with deal % at each level | On demand |
| **Exposure Report** | Total exposure per user, per game | Live |
| **Cashbook** | Complete financial ledger for the platform | Updated on every transaction |
| **Grand Total** | Aggregate totals for ALL reports at the bottom | Always present |

### 20.2 Report Export
- All reports exportable to CSV and PDF
- Search/filter functionality on all report tables
- Date range filters
- Pagination for large datasets

### 20.3 Grand Total Requirement
**EVERY table and report MUST have a GRAND TOTAL row** showing aggregated totals for all numeric columns. This includes:
- Total Balance
- Total P/L
- Total Exposure
- Total Available Balance
- Total Credit Reference
- Total Coins Given
- Total Bets
- Total Winnings
- Total Losses

---

## 21. NON-FUNCTIONAL REQUIREMENTS

### 21.1 Performance
- Page load: < 2 seconds on 4G connection
- API response: < 200ms for standard queries
- Settlement calculation: < 5 seconds for 1000 bets
- WebSocket latency: < 500ms for result broadcast
- Concurrent users: Support 2,000 active users (scale to 20,000)

### 21.2 Reliability
- 99.9% uptime target
- Zero data loss for financial transactions
- All transactions are ACID compliant
- Automatic retry for failed settlements
- Database backup: Manual by Admin + automated daily backup

### 21.3 Responsive Design
- Mobile-first approach (80%+ users on mobile)
- Works on screen widths: 320px to 1920px
- Touch-friendly interface for mobile users
- No horizontal scrolling on mobile

### 21.4 Browser Support
- Chrome (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Samsung Internet
- Edge (latest 2 versions)

---

## 22. BUSINESS RULES & CONSTRAINTS

### 22.1 Critical Financial Rules
1. **1 Coin = 1 Rupee. No Paisa. Integer math ONLY.**
2. All wallet operations must be atomic (database transactions)
3. Balance can NEVER go negative for any member (except Admin who has infinite)
4. Settlement must be automatic and accurate — every single time
5. P/L cascade must reflect deal percentages correctly at every level
6. Payout uses the multiplier that was active at bet placement time
7. All transactions must have complete audit trail
8. Admin's credentials are hardcoded — cannot be changed from the application

### 22.2 Betting Rules
1. Bets cannot be placed after betting window closes
2. Minimum bet amount: ₹10 (configurable)
3. User must have sufficient balance to place bet
4. User's exposure (Used Limit) is tracked in real-time
5. Blocked users cannot place bets
6. Blocked bets (specific games/types) cannot be placed

### 22.3 Hierarchy Rules
1. Each member has exactly ONE creator (parent in hierarchy)
2. Members can only manage their direct and indirect downline
3. Admin is the root — has no parent
4. Blocking a parent effectively freezes all their downline
5. Deal percentage of child must be ≤ parent's deal percentage
6. Coin flow is top-down only (Admin → SM → Master → User)

### 22.4 Result Rules
1. Results are declared manually by Admin only
2. Each game can have only ONE result per session per day
3. Results cannot be edited — only rolled back and re-declared
4. Results older than 2 days are permanently deleted
5. Game auto-refreshes at 2 AM IST daily
6. After 2 AM refresh, yesterday's results still visible (for 2 more days)

---

## 23. SECURITY REQUIREMENTS

### 23.1 Authentication
- JWT-based authentication
- Password hashing: Argon2
- Token expiry: 24 hours (configurable)
- Admin credentials: Hardcoded, not stored in database
- Rate limiting on login attempts (5 failed attempts → 15-minute lockout)

### 23.2 Authorization
- Role-based access control (RBAC) on every API endpoint
- Hierarchy-based data scoping (members only see their downline's data)
- Admin master key requires re-authentication

### 23.3 Data Security
- HTTPS everywhere (SSL/TLS)
- Environment variables for all secrets (never in code)
- `.gitignore` must include: `.env`, `node_modules/`, `*.log`, database dumps, any credential files
- Input validation on ALL user inputs (Zod schemas)
- SQL injection protection (Prisma ORM handles this)
- XSS protection (React handles this + helmet.js)

### 23.4 Audit Trail
- Every admin action logged with: admin_id, action_type, entity, old_value, new_value, timestamp, IP address
- Every financial transaction logged with full before/after balances
- Logs cannot be deleted from the application (only via database direct access)

---

## 24. FUTURE SCOPE (PLANNED)

The following features are NOT in the current scope but may be added in the future. The architecture must be modular enough to accommodate these:
- Lottery Matka (second tab on user page — currently inactive)
- Android APK via Capacitor
- Automated game scheduling (currently all manual)
- SMS/Push notifications
- Multiple Admin support (sub-admins with limited access)
- Automated WhatsApp integration for deposits/withdrawals
- Advanced analytics dashboard
- Additional bet types beyond the current 5
- Multi-language support (Hindi/English)

---

## 25. GLOSSARY

| Term | Meaning |
|------|---------|
| **Matka** | Numbers-based gambling game popular in India |
| **Panna** | 3-digit number result (Open Panna / Close Panna) |
| **Jodi** | 2-digit result derived from Open + Close singles |
| **Single/Akda** | Single digit (0-9) derived from Panna sum's last digit |
| **Open** | First session of a game |
| **Close** | Second session of a game |
| **Coin** | In-app currency. 1 Coin = 1 Rupee |
| **Exposure** | Total amount at risk in pending bets (Used Limit) |
| **Fix Limit** | Maximum operational amount for a member |
| **Lena Hai** | Receivable — money owed TO you |
| **Dena Hai** | Payable — money YOU owe |
| **Le Liya** | Settled/Cleared — transaction completed |
| **Feeder/Leader** | Members who manage downline (Super Masters, Masters) |
| **Downline** | All members created by and under a specific member |
| **Deal %** | Profit/Loss sharing percentage between hierarchy levels |
| **Special Master** | Member with custom (lower) percentage or different credit limit |
| **Rollback** | Reversing an entire game settlement |
| **Settlement** | Process of calculating winners/losers and distributing P/L |
| **IST** | Indian Standard Time (UTC+5:30) |

---

## DOCUMENT REVISION HISTORY

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Feb 2026 | Initial comprehensive PRD |

---

**END OF PRD — This document serves as the single source of truth for all product requirements of the Matka Betting Platform.**
