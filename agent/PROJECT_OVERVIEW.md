# PROJECT OVERVIEW
# MATKA BETTING PLATFORM
## Version 1.0 | February 2026

---

## TABLE OF CONTENTS
1. [Project Summary](#1-project-summary)
2. [Business Context](#2-business-context)
3. [What Is Matka — Complete Game Explanation](#3-what-is-matka--complete-game-explanation)
4. [Application Architecture Overview](#4-application-architecture-overview)
5. [Tech Stack — Final Decisions](#5-tech-stack--final-decisions)
6. [User Roles & Hierarchy](#6-user-roles--hierarchy)
7. [Four Application Panels](#7-four-application-panels)
8. [Core Features Summary](#8-core-features-summary)
9. [Money Flow & Commission System](#9-money-flow--commission-system)
10. [Real-Time Architecture](#10-real-time-architecture)
11. [Infrastructure & Deployment](#11-infrastructure--deployment)
12. [Project Folder Structure](#12-project-folder-structure)
13. [Development Strategy](#13-development-strategy)
14. [AI Agent Workflow](#14-ai-agent-workflow)
15. [Build Phases](#15-build-phases)
16. [Git Strategy & .gitignore](#16-git-strategy--gitignore)
17. [Document Map — What To Read When](#17-document-map--what-to-read-when)
18. [Critical Rules — Never Break These](#18-critical-rules--never-break-these)
19. [Scalability Plan](#19-scalability-plan)
20. [Team & Responsibilities](#20-team--responsibilities)

---

## 1. PROJECT SUMMARY

### 1.1 One-Line Description
A real-time, hierarchical Matka (Satta Matka) betting platform with a God-mode Admin panel, cascading commission system, and automated settlement engine.

### 1.2 Key Facts
| Item | Detail |
|------|--------|
| **Project Name** | Matka Betting Platform |
| **Client Location** | Nagpur, India |
| **Domain** | Already owned by client |
| **Budget** | ₹4,00,000 (development) + ₹20,000/month (maintenance) |
| **Timeline** | 8 weeks (2 months) |
| **Current Users** | ~5,000 |
| **Target Scale** | 20,000+ users |
| **Reference Platform** | allindia.bet (being replaced) |
| **Design Reference** | Rylix Smart Dashboard (Behance) |
| **Development IDE** | Google Antigravity (Free Tier) |
| **Primary AI Model** | Claude Opus 4.5 (heavy development) |
| **Secondary AI Model** | Claude Sonnet 4.5 (bug fixes, refinements) |
| **UI/UX AI Model** | Gemini 2.5 Pro (design polish only) |
| **Developers** | 2 (parallel development via GitHub) |
| **Source Control** | GitHub (Private Repository) |

### 1.3 What Makes This Project Unique
- **80% Admin Panel, 20% User Interface** — The admin panel IS the product
- **Everything is Manual** — Admin is God, controls every aspect manually
- **Hierarchical Commission System** — Profit/Loss cascades through 4 levels with configurable percentages
- **Real-Time Financial Operations** — Every calculation must be instant and 100% accurate
- **No Payment Gateway** — All money movement is offline via WhatsApp/UPI
- **Integer Math Only** — 1 Coin = 1 Rupee, no paisa, no decimals anywhere

---

## 2. BUSINESS CONTEXT

### 2.1 What The Client Has Now
The client currently uses **allindia.bet** — a basic, outdated matka platform with limited admin controls, poor UI/UX, and no real-time features. The client wants a **completely new platform** that is superior in every way: better admin controls, cleaner interface, real-time updates, hierarchical management, and comprehensive reporting.

### 2.2 What The Client Wants
A professional-grade platform where:
- Admin has complete God-level control over every aspect
- Super Masters and Masters can manage their downline efficiently
- Users have a clean, fast, mobile-first betting experience
- Every financial calculation is accurate to the last rupee
- Everything works in real-time without page refreshes
- Comprehensive reports with grand totals at every level
- The platform can handle 20,000+ users without issues

### 2.3 Revenue Model
```
USER places bet (₹1,000) and LOSES
    │
    ├── Master earns: commission based on deal % difference
    ├── Super Master earns: commission based on deal % difference
    └── Admin earns: remaining commission %
    
    Each level's cut = (their deal %) - (deal % they gave to downline)
    
USER places bet (₹1,000) and WINS (e.g., ₹10,000 on JODI 100x)
    │
    ├── Payout flows DOWN from hierarchy proportionally
    ├── Master bears: their % share of the loss
    ├── Super Master bears: their % share of the loss
    └── Admin bears: their % share of the loss
```

### 2.4 Admin Reference Screenshots
Two reference platforms have been studied:
1. **allindia.bet** — Current client platform (user-facing: result feed, charts, betting, profile)
2. **ag.allindia.bet** — Current admin panel (dashboard, manage hierarchy, sports, clients, settlement, ledgers, staff, settings)
3. **silverbhai.com/admin** — Reference for account management table (Credit Reference, Balance, P/L, Exposure, Available Balance, quick action buttons D/W/L/C/P, grand totals)

Our platform will be **significantly better** than all three references.

---

## 3. WHAT IS MATKA — COMPLETE GAME EXPLANATION

### 3.1 Game Concept
Matka is a numbers-based gambling game popular in India. Users bet on number combinations, and if their chosen number matches the declared result, they win a multiplied payout.

### 3.2 Result Structure
```
RESULT FORMAT: XXX — YY — ZZZ
Example:       388 — 90 — 280

Components:
├── 388 = OPEN PANNA (3-digit number, entered by Admin)
├── 90  = JODI (2-digit, auto-calculated by system)
└── 280 = CLOSE PANNA (3-digit number, entered by Admin)

How JODI is calculated:
├── Open Panna: 388 → Sum: 3+8+8 = 19 → Last digit: 9 (OPEN SINGLE)
├── Close Panna: 280 → Sum: 2+8+0 = 10 → Last digit: 0 (CLOSE SINGLE)
└── Jodi: Open Single + Close Single = "90"
```

### 3.3 Game Sessions
Each game runs TWICE daily:
- **OPEN Session:** Admin enters Open Panna → System derives Open Single
- **CLOSE Session:** Admin enters Close Panna → System derives Close Single → Jodi auto-calculated

### 3.4 Five Bet Types
| # | Bet Type | What User Bets | Valid Numbers | Default Payout | Win Condition |
|---|----------|---------------|---------------|----------------|---------------|
| 1 | **Single Akda** | Single digit | 0-9 | 10x | Matches Open Single OR Close Single |
| 2 | **Single Patti** | 3-digit, all different | e.g., 127, 389 | 160x | Matches Open Panna OR Close Panna |
| 3 | **Double Patti** | 3-digit, one pair | e.g., 223, 558 | 320x | Matches Open Panna OR Close Panna |
| 4 | **Triple Patti** | 3-digit, all same | 000-999 (all same) | 70x | Matches Open Panna OR Close Panna |
| 5 | **Jodi** | 2-digit pair | 00-99 | 100x | Matches calculated Jodi |

**Critical:** These multipliers are DEFAULT values. Admin can change them globally and per-game.

### 3.5 Available Games (Default Set — Admin Manages)
SRIDEVI, TIME BAZAR, MILAN DAY, RAJDHANI DAY, NEW KAMDHENU DAY, KALYAN, SRIDEVI NIGHT, NEW KAMDHENU NIGHT, MILAN NIGHT, RAJDHANI NIGHT, MAIN BAZAR.

Admin can add, remove, edit, enable, or disable any game. Each game has independently configurable open time, close time, and result time — all set manually by Admin.

### 3.6 Daily Cycle
```
2:00 AM IST → System auto-refreshes (new day begins)
Throughout day → Games open/close at Admin-configured times
Admin declares results → System auto-settles bets
P/L cascades through hierarchy → Settlements calculated
After 2 days → Results permanently deleted
```

---

## 4. APPLICATION ARCHITECTURE OVERVIEW

### 4.1 High-Level Architecture
```
┌──────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                          │
│                                                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│  │  Admin   │ │  Super   │ │  Master  │ │   User   │      │
│  │  Panel   │ │  Master  │ │  Panel   │ │   Page   │      │
│  │ (Next.js)│ │  Panel   │ │ (Next.js)│ │ (Next.js)│      │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘      │
│       │             │            │             │             │
│       └──────┬──────┴────────┬───┴─────────────┘             │
│              │               │                               │
│         REST APIs      WebSocket (Socket.io)                 │
│              │               │                               │
├──────────────┼───────────────┼───────────────────────────────┤
│              │       SERVER LAYER                             │
│              │               │                               │
│         ┌────┴───────────────┴────┐                          │
│         │      Fastify Server     │                          │
│         │  ┌──────────────────┐   │                          │
│         │  │  Route Handlers  │   │                          │
│         │  │  Zod Validation  │   │                          │
│         │  │  Auth Middleware │   │                          │
│         │  │  Role Middleware │   │                          │
│         │  │  Service Layer   │   │                          │
│         │  └──────────────────┘   │                          │
│         │  ┌──────────────────┐   │                          │
│         │  │ Settlement Engine│   │  ← CRITICAL MODULE       │
│         │  │ P/L Calculator   │   │                          │
│         │  │ Rollback Engine  │   │                          │
│         │  └──────────────────┘   │                          │
│         │  ┌──────────────────┐   │                          │
│         │  │  Socket.io Server│   │  ← REAL-TIME             │
│         │  └──────────────────┘   │                          │
│         │  ┌──────────────────┐   │                          │
│         │  │  Cron Jobs       │   │  ← 2AM RESET, CLEANUP   │
│         │  └──────────────────┘   │                          │
│         └────┬────────────┬───────┘                          │
│              │            │                                  │
├──────────────┼────────────┼──────────────────────────────────┤
│              │   DATA LAYER                                  │
│              │            │                                  │
│         ┌────┴─────┐ ┌───┴──────┐                           │
│         │PostgreSQL│ │  Redis   │                           │
│         │ (Prisma) │ │ (Cache + │                           │
│         │          │ │  PubSub) │                           │
│         └──────────┘ └──────────┘                           │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│                    INFRASTRUCTURE                            │
│                                                              │
│  AWS: EC2 + RDS (PostgreSQL) + ElastiCache (Redis)          │
│  CDN: CloudFront    Storage: S3    SSL: Let's Encrypt       │
│  Monitoring: Sentry                                          │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### 4.2 Data Flow — Bet Placement to Settlement
```
1. USER places bet on KALYAN OPEN, JODI 45, ₹500
   │
2. Frontend → POST /api/bets/place (JWT authenticated)
   │
3. Fastify receives request
   ├── Zod validates: game_id, bet_type, bet_number, amount
   ├── Auth middleware: Verify JWT, extract user
   ├── Role middleware: Verify user role = "user"
   │
4. Service Layer processes:
   ├── Check betting window is OPEN for KALYAN
   ├── Check user has sufficient balance (≥ ₹500)
   ├── Validate "45" is valid JODI number (2 digits, 00-99)
   ├── Get active payout multiplier for KALYAN JODI (100x)
   ├── Calculate potential win: 500 × 100 = ₹50,000
   │
5. Database Transaction (ATOMIC):
   ├── Deduct ₹500 from user.wallet_balance
   ├── Create bet record (status: "pending", multiplier: 100)
   ├── Create transaction record (type: BET_PLACED, -₹500)
   ├── Update betting_window stats
   ├── COMMIT
   │
6. Response → { success, bet_id, new_balance, potential_win }
   │
7. WebSocket → Emit to user:{userId}:wallet (balance update)
   WebSocket → Emit to admin:bet-stream (live bet feed)

--- LATER ---

8. ADMIN declares result: KALYAN OPEN Panna = 456
   ├── System calculates: 4+5+6=15 → Single = 5
   │
9. ADMIN declares CLOSE: Panna = 280
   ├── System calculates: 2+8+0=10 → Single = 0
   ├── Jodi = "50" (Open Single 5 + Close Single 0)
   │
10. Settlement Engine triggers:
    ├── Fetch all pending bets for KALYAN today
    ├── User's bet: JODI 45 vs Result JODI 50 → NO MATCH → LOST
    ├── Update bet status → "lost"
    ├── P/L Cascade:
    │   ├── Master earns their % of ₹500
    │   ├── Super Master earns their % of ₹500
    │   └── Admin earns their % of ₹500
    ├── Create settlement records
    ├── COMMIT
    │
11. WebSocket broadcasts:
    ├── game:kalyan:result → All users see result
    ├── user:{userId}:bet → Bet status updated to "lost"
    └── admin:dashboard → P/L stats updated
```

---

## 5. TECH STACK — FINAL DECISIONS

### 5.1 Frontend
| Technology | Version | Purpose | Why This |
|------------|---------|---------|----------|
| **Next.js** | 14 (App Router) | Frontend framework | Stable, battle-tested, great for SSR + CSR. NOT v15 (too new, rough edges) |
| **TypeScript** | 5.x | Language | Type safety prevents bugs in financial calculations |
| **Tailwind CSS** | 3.x | Styling | Utility-first, consistent design system, fast development |
| **shadcn/ui** | Latest | Component library | Customizable base components, works perfectly with Tailwind |
| **Zustand** | 4.x | State management | Simple, lightweight, no boilerplate (NOT Redux) |
| **Socket.io Client** | 4.x | Real-time | Reliable WebSocket with auto-reconnection |
| **Recharts** | 2.x | Charts/Graphs | Dashboard visualizations, clean API |
| **Framer Motion** | 11.x | Animations | Subtle micro-interactions, page transitions |
| **Lucide React** | Latest | Icons | Clean, consistent icon set |
| **React Hook Form** | 7.x | Form handling | Performance-optimized forms with Zod validation |
| **date-fns** | 3.x | Date utilities | Lightweight, tree-shakeable date operations |

### 5.2 Backend
| Technology | Version | Purpose | Why This |
|------------|---------|---------|----------|
| **Node.js** | 22 LTS | Runtime | Latest LTS, stable, performant |
| **Fastify** | 4.x | HTTP framework | 2x faster than Express, built-in validation, clean plugin system |
| **TypeScript** | 5.x | Language | Same as frontend — full-stack type safety |
| **Prisma** | 5.x | ORM | Type-safe database queries, great migrations, clean API that AI models understand well |
| **Zod** | 3.x | Validation | Runtime type checking on all API inputs |
| **Socket.io** | 4.x | Real-time server | Reliable WebSocket with room-based broadcasting |
| **JWT (jsonwebtoken)** | 9.x | Authentication | Stateless auth tokens |
| **Argon2** | 0.31.x | Password hashing | Most secure hashing algorithm available |
| **node-cron** | 3.x | Scheduled jobs | 2 AM daily reset, result cleanup, window auto-close |
| **pino** | 8.x | Logging | High-performance structured logging (Fastify default) |
| **helmet** | 7.x | Security headers | HTTP security best practices |

### 5.3 Database
| Technology | Version | Purpose | Why This |
|------------|---------|---------|----------|
| **PostgreSQL** | 16 | Primary database | ACID transactions critical for financial operations, robust, battle-tested |
| **Redis** | 7.x | Cache + PubSub | Real-time data caching, Socket.io adapter for multi-instance support |
| **Prisma Migrate** | Built-in | Migrations | Version-controlled schema changes |

### 5.4 Infrastructure (AWS)
| Service | Spec | Purpose | Monthly Cost (Est.) |
|---------|------|---------|-------------------|
| **EC2** | t3.medium (2 vCPU, 4GB RAM) | Application server | ~₹3,500 |
| **RDS PostgreSQL** | db.t3.micro (1 vCPU, 1GB RAM) | Database | ~₹2,500 |
| **ElastiCache Redis** | cache.t3.micro | Caching + PubSub | ~₹2,000 |
| **S3** | Standard | DB backups, banner images, static files | ~₹500 |
| **CloudFront** | Standard | CDN, DDoS protection | ~₹1,000 |
| **Route 53** | Standard | DNS management | ~₹200 |
| **ACM** | Free | SSL/TLS certificates | Free |
| **Total** | | | **~₹10,000/month** |

### 5.5 Development Tools
| Tool | Purpose |
|------|---------|
| **Docker + Docker Compose** | Local development environment |
| **GitHub (Private Repo)** | Source control, collaboration |
| **Sentry** | Error monitoring in production |
| **Postman** | API testing during development |

---

## 6. USER ROLES & HIERARCHY

### 6.1 Hierarchy
```
ADMIN (God — Infinite Coins — Hardcoded Credentials by Developer)
    │
    ├── SUPER MASTER (Created by Admin only)
    │   ├── MASTER (Created by Admin or Super Master)
    │   │   └── USER (Created by Admin, Super Master, or Master)
    │   └── USER (Created by Admin or Super Master directly)
    │
    └── SPECIAL MASTER (Not a role — a FLAG on any SM/Master/User with custom lower %)
```

### 6.2 Who Creates Whom
| Creator | Can Create |
|---------|-----------|
| Admin | Super Masters, Masters, Users |
| Super Master | Masters, Users |
| Master | Users only |
| User | Nobody |

### 6.3 Who Manages Whom
| Role | Can Manage |
|------|-----------|
| Admin | Everyone (God access, master key to access any account) |
| Super Master | Their own Masters and Users (downline only, own panel only) |
| Master | Their own Users only (downline only, own panel only) |
| User | Nobody (only manages own profile) |

### 6.4 Account Creation Flow
1. Creator enters new member's **Name**
2. System auto-generates a **Unique ID** (e.g., PL519, BSM80867)
3. Creator sets the **Password**
4. Creator sets **Deal Percentage** (commission %)
5. Creator sets **Credit Limit** and **Fix Limit**
6. Optional: Mark as **Special Master** (custom lower %)
7. Account created → New member uses ID + Password to login

### 6.5 Admin Credentials
- **Hardcoded by the developer** in environment variables / config
- Admin CANNOT change their own ID or password through the application
- ONLY the developer can reset Admin credentials (requires code deployment or env variable change)
- This is a security feature — even God can't lock out the developer

---

## 7. FOUR APPLICATION PANELS

### 7.1 Panel Access
| Panel | URL Pattern | Who Accesses | Accent Color |
|-------|-------------|-------------|--------------|
| Admin Panel | `/admin/*` | Admin only (hardcoded login) | Blue #2563EB |
| Super Master Panel | `/supermaster/*` | Super Masters (own panel only) | Purple #7C3AED |
| Master Panel | `/master/*` | Masters (own panel only) | Cyan #0891B2 |
| User Page | `/` (public facing) | Users (login required) | Emerald #059669 |

### 7.2 Panel Complexity
```
Admin Panel:       ████████████████████ (80% of total work)
Super Master Panel:██████ (8% — subset of admin features for downline)
Master Panel:      ████ (5% — subset of SM features for users only)
User Page:         ██████ (7% — login, bet, results, charts, profile)
```

### 7.3 Admin Panel Sections
```
├── Dashboard (stats, charts, live feed)
├── Leaders (Super Masters, Masters, Users, Special Masters)
├── Manage Game (Add games, Declare results, Manage all games)
├── Client (Create accounts, Add/Withdraw coins, Account management with history)
├── Settlement (Rollback)
├── Content (Announcements, Banners, Rules, WhatsApp number)
└── Settings (Change passwords, DB Backup, Block bets, Block IDs)
```

### 7.4 User Page Sections
```
├── Login (ID + Password only, no registration)
├── Home (Results feed, banners, announcements, MATKA/LOTTERY tabs)
├── Betting (Game selection, bet type, number, amount, place bet)
├── Charts (Historical results in weekly grid format)
└── Profile (Statement, Ledger, Bet History, Rules, Change Password, Logout)
```

---

## 8. CORE FEATURES SUMMARY

### 8.1 Critical Features (Must be 100% correct)
| Feature | Complexity | Description |
|---------|-----------|-------------|
| **Settlement Engine** | ⭐⭐⭐⭐⭐ | Auto-calculate winners/losers, credit wallets, cascade P/L through hierarchy |
| **P/L Cascade Calculator** | ⭐⭐⭐⭐⭐ | Distribute profit/loss through SM→Master→User chain based on deal percentages |
| **Rollback System** | ⭐⭐⭐⭐ | Reverse entire game settlement, undo all transactions atomically |
| **Wallet System** | ⭐⭐⭐⭐ | Atomic balance operations, infinite Admin coins, exposure tracking |
| **Bet Placement** | ⭐⭐⭐⭐ | Validate, deduct, record — with correct multiplier at time of bet |
| **Hierarchy Management** | ⭐⭐⭐⭐ | Create/manage members, scoped access, parent-child chain |
| **Credit/Loan System** | ⭐⭐⭐ | Admin gives credit to any level, tracked separately |
| **Real-Time Updates** | ⭐⭐⭐ | WebSocket for results, wallet, bets, dashboard |
| **Collection Report (Lena/Dena/Le Liya)** | ⭐⭐⭐ | Settlement tracking at each hierarchy level |
| **Deal % Report** | ⭐⭐⭐ | Full hierarchy view with percentages and P/L at each level |
| **Grand Total on All Tables** | ⭐⭐ | Aggregate row at bottom of every data table |
| **Charts Page** | ⭐⭐ | Historical results in weekly grid format |
| **2 AM Daily Reset** | ⭐⭐ | Cron job for game refresh and result cleanup |
| **Result Deletion (2 Days)** | ⭐⭐ | Permanent deletion of results older than 2 days |
| **DB Backup** | ⭐ | Manual trigger from Admin panel |

---

## 9. MONEY FLOW & COMMISSION SYSTEM

### 9.1 Coin Flow (Top Down)
```
ADMIN (∞ Coins)
    │ Credits coins
    ↓
SUPER MASTER (e.g., 1,00,000 coins) — Deal: 85%
    │ Credits coins from their balance
    ↓
MASTER (e.g., 50,000 coins) — Deal: 70%
    │ Credits coins from their balance
    ↓
USER (e.g., 10,000 coins) — Places bets
```

### 9.2 P/L Flow (Bottom Up) — When User LOSES
```
User loses ₹1,000 bet:
├── Master earns: (70% - 60%) = 10% → ₹100
├── Super Master earns: (85% - 70%) = 15% → ₹150
└── Admin earns: (100% - 85%) = 15% → ₹150
    Remaining 60% is the base (already deducted from user)
```

### 9.3 P/L Flow (Bottom Up) — When User WINS
```
User wins ₹10,000 on a ₹100 JODI bet (100x):
├── Master bears: 10% of loss → ₹1,000
├── Super Master bears: 15% of loss → ₹1,500
└── Admin bears: 15% of loss → ₹1,500
    Payout to user comes proportionally from the chain
```

### 9.4 Special Master
A member flagged as "Special" who gets a **lower deal percentage** than the default. This means the hierarchy above keeps more commission from that member's activity.

---

## 10. REAL-TIME ARCHITECTURE

### 10.1 WebSocket Strategy
```
Technology: Socket.io (Client + Server)
Transport: WebSocket with long-polling fallback
Adapter: Redis adapter (for future multi-instance scaling)

Channel Structure:
├── game:{gameId}:result     → Result broadcast to all
├── game:{gameId}:window     → Betting window status changes
├── user:{userId}:wallet     → Wallet balance updates
├── user:{userId}:bet        → Bet status changes (won/lost)
├── user:{userId}:notification → General notifications
├── admin:dashboard          → Admin dashboard live stats
├── admin:bet-stream         → Live bet placement feed
└── announcements            → Broadcast announcements
```

### 10.2 What Updates In Real-Time (No Page Refresh)
- Result declarations → All connected users
- Wallet balance changes → Affected user
- Bet status changes (won/lost) → Affected user
- Betting window open/close → All users viewing that game
- Dashboard statistics → Admin
- New bet placements → Admin live feed
- Countdown timers → Client-side, synced with server time
- Announcements → All users

### 10.3 Redis Usage
| Purpose | How |
|---------|-----|
| **Socket.io Adapter** | PubSub for real-time message distribution |
| **Cache: Game Status** | Current open/close status of all games |
| **Cache: Active Windows** | Currently open betting windows with close times |
| **Cache: Online Users** | Count of currently connected users |
| **Cache: Dashboard Stats** | Pre-computed stats updated on each settlement |
| **Rate Limiting** | Track API request counts per user |

---

## 11. INFRASTRUCTURE & DEPLOYMENT

### 11.1 AWS Architecture
```
Internet → CloudFront (CDN + SSL) → EC2 (Application)
                                        ├── Next.js (Frontend SSR)
                                        ├── Fastify (Backend API)
                                        └── Socket.io (WebSocket)
                                            │
                                    ┌───────┴───────┐
                                    │               │
                                RDS PostgreSQL  ElastiCache Redis
                                    │
                                S3 (Backups + Static Files)
```

### 11.2 Deployment Strategy
- **Docker Compose** for local development
- **Single EC2 instance** for production (current scale)
- **PM2** for Node.js process management
- **Nginx** as reverse proxy on EC2
- **Let's Encrypt / ACM** for SSL
- **GitHub Actions** for CI/CD (optional, can be manual deploy initially)

### 11.3 Environment Variables (NEVER in code)
```bash
# Database
DATABASE_URL=postgresql://user:pass@host:5432/matka_db

# Redis
REDIS_URL=redis://host:6379

# JWT
JWT_SECRET=<long-random-string>
JWT_EXPIRY=24h

# Admin Credentials (HARDCODED — only developer changes these)
ADMIN_ID=<admin-unique-id>
ADMIN_PASSWORD_HASH=<argon2-hashed-password>

# AWS S3
AWS_S3_BUCKET=matka-backups
AWS_ACCESS_KEY_ID=<key>
AWS_SECRET_ACCESS_KEY=<secret>
AWS_REGION=ap-south-1

# App
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://yourdomain.com
SOCKET_CORS_ORIGIN=https://yourdomain.com

# WhatsApp (configurable by Admin from panel)
DEFAULT_WHATSAPP_NUMBER=+91XXXXXXXXXX
```

---

## 12. PROJECT FOLDER STRUCTURE

```
matka-platform/
│
├── agent/                          ← AI Agent documentation (6 docs)
│   ├── README.md                   ← Compressed project brain (updated every session)
│   ├── PROJECT_OVERVIEW.md         ← This document
│   ├── PRD.md                      ← Product Requirements
│   ├── SYSTEM_DESIGN.md            ← Technical architecture, APIs, patterns
│   ├── DATA_MODEL.md               ← Database schema, relationships
│   ├── ADMIN_MODULES.md            ← All admin features in detail
│   └── ERROR_HANDLING.md           ← Error scenarios and handling
│
├── src/
│   ├── app/                        ← Next.js App Router pages
│   │   ├── (auth)/                 ← Auth pages (login)
│   │   │   └── login/page.tsx
│   │   ├── (user)/                 ← User-facing pages
│   │   │   ├── page.tsx            ← Home (results feed)
│   │   │   ├── bet/page.tsx        ← Betting page
│   │   │   ├── charts/page.tsx     ← Charts page
│   │   │   └── profile/            ← Profile subpages
│   │   ├── admin/                  ← Admin panel pages
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── leaders/
│   │   │   ├── manage-game/
│   │   │   ├── client/
│   │   │   ├── settlement/
│   │   │   ├── content/
│   │   │   └── settings/
│   │   ├── supermaster/            ← Super Master panel pages
│   │   └── master/                 ← Master panel pages
│   │
│   ├── components/                 ← Reusable UI components
│   │   ├── ui/                     ← shadcn/ui base (customized)
│   │   ├── dashboard/              ← Dashboard widgets
│   │   ├── tables/                 ← Data tables + grand totals
│   │   ├── forms/                  ← Forms (bet, declare, create account)
│   │   ├── cards/                  ← Result cards, stat cards, bet cards
│   │   ├── navigation/             ← Sidebar, header, bottom nav
│   │   ├── modals/                 ← Confirmation dialogs
│   │   ├── notifications/          ← Toast, alerts
│   │   └── layout/                 ← Page layouts, wrappers
│   │
│   ├── lib/                        ← Shared utilities
│   │   ├── api.ts                  ← API client (fetch wrapper)
│   │   ├── socket.ts               ← Socket.io client setup
│   │   ├── auth.ts                 ← Auth utilities (JWT decode, role check)
│   │   ├── format.ts               ← Number formatting (Indian system, ₹ prefix)
│   │   ├── validators.ts           ← Shared Zod schemas
│   │   ├── constants.ts            ← App-wide constants
│   │   └── utils.ts                ← General utilities
│   │
│   ├── hooks/                      ← Custom React hooks
│   │   ├── useAuth.ts              ← Authentication hook
│   │   ├── useSocket.ts            ← WebSocket connection hook
│   │   ├── useWallet.ts            ← Wallet balance with real-time updates
│   │   └── useCountdown.ts         ← Betting window countdown
│   │
│   ├── store/                      ← Zustand state stores
│   │   ├── authStore.ts            ← Auth state (user, token, role)
│   │   ├── gameStore.ts            ← Games, results, betting windows
│   │   ├── walletStore.ts          ← Wallet balance, exposure
│   │   └── uiStore.ts              ← UI state (sidebar, modals, toasts)
│   │
│   └── styles/
│       └── globals.css             ← CSS variables, Tailwind base
│
├── server/                         ← Backend (Fastify)
│   ├── index.ts                    ← Server entry point
│   ├── app.ts                      ← Fastify app setup, plugins
│   │
│   ├── routes/                     ← API route handlers
│   │   ├── auth.routes.ts          ← Login, token refresh
│   │   ├── user.routes.ts          ← User-facing APIs
│   │   ├── bet.routes.ts           ← Bet placement, bet history
│   │   ├── game.routes.ts          ← Game management
│   │   ├── result.routes.ts        ← Result declaration
│   │   ├── wallet.routes.ts        ← Wallet operations
│   │   ├── admin.routes.ts         ← Admin-specific APIs
│   │   ├── leader.routes.ts        ← Hierarchy management
│   │   ├── settlement.routes.ts    ← Settlement, rollback
│   │   ├── report.routes.ts        ← Reports, P/L, collection
│   │   └── content.routes.ts       ← Announcements, banners, rules
│   │
│   ├── services/                   ← Business logic layer
│   │   ├── auth.service.ts
│   │   ├── bet.service.ts
│   │   ├── game.service.ts
│   │   ├── result.service.ts
│   │   ├── settlement.service.ts   ← CRITICAL: Settlement engine
│   │   ├── pnl.service.ts          ← CRITICAL: P/L cascade calculator
│   │   ├── rollback.service.ts     ← CRITICAL: Rollback engine
│   │   ├── wallet.service.ts
│   │   ├── leader.service.ts
│   │   ├── report.service.ts
│   │   └── content.service.ts
│   │
│   ├── middleware/                  ← Request middleware
│   │   ├── auth.middleware.ts       ← JWT verification
│   │   ├── role.middleware.ts       ← Role-based access control
│   │   ├── hierarchy.middleware.ts  ← Hierarchy scope checking
│   │   └── rateLimit.middleware.ts  ← Rate limiting
│   │
│   ├── socket/                     ← WebSocket handlers
│   │   ├── index.ts                ← Socket.io server setup
│   │   ├── gameSocket.ts           ← Game/result events
│   │   ├── walletSocket.ts         ← Wallet update events
│   │   └── adminSocket.ts          ← Admin dashboard events
│   │
│   ├── cron/                       ← Scheduled jobs
│   │   ├── dailyReset.ts           ← 2 AM IST daily reset
│   │   ├── resultCleanup.ts        ← Delete results older than 2 days
│   │   └── windowAutoClose.ts      ← Auto-close expired betting windows
│   │
│   ├── utils/                      ← Server utilities
│   │   ├── calculation.ts          ← Matka math (single, jodi, panna validation)
│   │   ├── idGenerator.ts          ← Unique ID generation for accounts
│   │   ├── formatters.ts           ← Number/date formatting
│   │   └── errors.ts               ← Custom error classes
│   │
│   └── validators/                 ← Zod schemas for all API inputs
│       ├── auth.schema.ts
│       ├── bet.schema.ts
│       ├── game.schema.ts
│       ├── result.schema.ts
│       ├── wallet.schema.ts
│       └── admin.schema.ts
│
├── prisma/
│   ├── schema.prisma               ← Database schema
│   ├── migrations/                  ← Migration files
│   └── seed.ts                      ← Seed data (Admin account, default games)
│
├── docker-compose.yml               ← Local dev: PostgreSQL + Redis containers
├── Dockerfile                       ← Production container
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── next.config.js
├── .env.example                     ← Template (committed to git)
├── .env                             ← Actual secrets (NEVER committed)
├── .gitignore                       ← CRITICAL — see Section 16
└── README.md                        ← Standard project README
```

---

## 13. DEVELOPMENT STRATEGY

### 13.1 AI Model Usage Strategy
```
CLAUDE OPUS 4.5 (Heavy Development):
├── Initial project setup and scaffolding
├── Database schema (all Prisma models)
├── Authentication system with hierarchy
├── Settlement engine (most complex module)
├── P/L cascade calculator
├── Rollback mechanism
├── Wallet system with atomic transactions
├── All core backend APIs
├── Frontend page structure + API integrations + state management
└── Socket.io real-time setup

CLAUDE SONNET 4.5 (Fixes & Refinements):
├── Bug fixes
├── Small feature additions
├── Edge case handling
├── Validation improvements
├── Code refactoring
├── Test additions
└── Documentation updates

GEMINI 2.5 PRO (UI/UX Polish — LAST PHASE):
├── Tailwind class improvements
├── Responsive design fixes
├── Animations (Framer Motion)
├── Loading states and skeletons
├── Empty states
├── Color/spacing/typography fine-tuning
├── Mobile optimization
└── DOES NOT TOUCH: Backend logic, API calls, state management, Socket.io
```

### 13.2 Development Order
Always build **backend first, frontend second** for each feature. Always build **functionality first, beauty second.**

### 13.3 Code Patterns
The entire codebase follows ONE consistent pattern:
```
Route (defines endpoint + validation)
    → Middleware (auth + role + hierarchy check)
        → Service (business logic + database operations)
            → Prisma (database queries inside transactions)
                → Response (standardized JSON format)
```

Every API follows this exact flow. No exceptions. This makes the codebase predictable for AI agents and human developers alike.

### 13.4 API Response Format (Standard)
```typescript
// Success
{
  success: true,
  data: { ... },
  message: "Bet placed successfully"
}

// Error
{
  success: false,
  error: {
    code: "INSUFFICIENT_BALANCE",
    message: "Not enough coins to place this bet",
    details: { required: 500, available: 200 }
  }
}

// List (with pagination)
{
  success: true,
  data: [ ... ],
  pagination: {
    page: 1,
    limit: 20,
    total: 156,
    totalPages: 8
  },
  grandTotal: {
    balance: 12000000,
    pnl: 450000,
    exposure: 890000
  }
}
```

---

## 14. AI AGENT WORKFLOW

### 14.1 Session Workflow
```
Every session in Antigravity IDE:

START:
1. Agent reads agent/README.md (compressed brain)
2. Agent reads relevant document for current task
3. Agent reviews current codebase state
4. Agent continues building from where last session left off

END:
1. Agent updates agent/README.md with:
   ├── What was built in this session
   ├── What's currently working
   ├── What's broken or incomplete
   ├── What to build next
   └── Any known issues
2. Developer pushes to GitHub
```

### 14.2 README.md Template (Compressed Brain)
```markdown
# MATKA PLATFORM — Agent Brain

## Project Summary
Real-time Matka betting platform with hierarchical admin system.

## Tech Stack
Next.js 14 + Fastify + PostgreSQL + Redis + Prisma + Socket.io

## Current Build Status
### ✅ Completed
- [ list of completed features ]

### 🔄 In Progress
- [ current feature being built ]

### ⏳ Pending
- [ features not yet started ]

### 🐛 Known Issues
- [ any bugs or incomplete items ]

## Key Architecture Decisions
- [ important decisions made during development ]

## Next Steps
- [ what to build in the next session ]

## Folder Structure
- [ current project tree, abbreviated ]

## Database Tables
- [ list of tables and their purpose ]

## API Endpoints Built
- [ list of working endpoints ]

## Important Rules
1. 1 Coin = 1 Rupee. Integer math ONLY.
2. All wallet operations MUST be atomic (Prisma transactions).
3. Admin credentials are hardcoded in .env.
4. Settlement must cascade P/L through hierarchy.
5. Every table must have a Grand Total row.
6. Results delete permanently after 2 days.
7. Games auto-refresh at 2 AM IST.
```

### 14.3 Document Map — Which Doc to Read When
```
Building auth/login?        → PROJECT_OVERVIEW.md + DATA_MODEL.md
Building database schema?   → DATA_MODEL.md
Building settlement?        → PRD.md (Sections 10-12) + DATA_MODEL.md + ERROR_HANDLING.md
Building admin features?    → ADMIN_MODULES.md + DATA_MODEL.md
Building user page?         → PRD.md (Section 17) + DRD.md
Building any API?           → SYSTEM_DESIGN.md + DATA_MODEL.md
Fixing bugs?                → ERROR_HANDLING.md + agent/README.md
Polishing UI?               → DRD.md only (Gemini reads this)
```

---

## 15. BUILD PHASES

### Phase 1: Project Setup (Day 1 — 30 minutes)
```
├── Initialize Next.js 14 project with TypeScript
├── Install all dependencies (frontend + backend)
├── Setup Tailwind CSS + shadcn/ui
├── Setup Fastify server with TypeScript
├── Setup Prisma with PostgreSQL connection
├── Create docker-compose.yml (PostgreSQL + Redis)
├── Create .env.example and .env
├── Create .gitignore (CRITICAL — see Section 16)
├── Create folder structure as defined in Section 12
├── Create agent/ folder with all 6 documents
└── Initial git commit + push to private GitHub repo
```

### Phase 2: Database & Auth (Day 1 — 2-3 hours)
```
├── Define ALL Prisma models (read DATA_MODEL.md)
├── Run migrations
├── Seed Admin account (hardcoded credentials)
├── Seed default games with timings
├── Seed default payout multipliers
├── Build auth system:
│   ├── Login API (POST /api/auth/login)
│   ├── JWT generation and verification
│   ├── Auth middleware
│   ├── Role middleware (admin, supermaster, master, user)
│   ├── Hierarchy middleware (scope data to downline)
│   └── Admin master key access
├── Build wallet base:
│   ├── Wallet balance operations (atomic)
│   ├── Transaction record creation
│   └── Balance check utilities
└── Test: Login as Admin, verify JWT, verify role middleware
```

### Phase 3: Backend Core (Day 1-2 — 4-6 hours)
```
├── Game Management APIs:
│   ├── CRUD for games
│   ├── Betting window management
│   └── Payout multiplier management (global + per-game)
│
├── Bet Placement API:
│   ├── All validations (window open, balance, number format, bet type)
│   ├── Atomic: deduct balance + create bet + create transaction
│   └── Return bet confirmation
│
├── Result Declaration API (Admin):
│   ├── Enter panna → auto-calculate single and jodi
│   ├── Save result to database
│   └── TRIGGER settlement
│
├── Settlement Engine (MOST CRITICAL):
│   ├── Fetch all pending bets for game/date
│   ├── Determine winners/losers
│   ├── Credit winners (atomic per bet)
│   ├── P/L Cascade through hierarchy (deal percentages)
│   ├── Update all bet statuses
│   ├── Create transaction records
│   └── Broadcast results via WebSocket
│
├── Rollback Engine:
│   ├── Reverse all settlement transactions
│   ├── Reset bet statuses to pending
│   ├── Reverse P/L cascade
│   └── Allow re-declaration
│
├── Credit/Loan System:
│   ├── Admin credits coins to any member
│   ├── Hierarchy-based coin distribution
│   └── Track credit separately
│
└── Account Management APIs:
    ├── Create SM/Master/User with hierarchy
    ├── Edit account details, deal %, limits
    ├── Block/Unblock accounts
    └── Change password (for self and downline)
```

### Phase 4: Admin Panel Frontend (Day 2-3 — 4-6 hours)
```
├── Layout: Sidebar + Header + Content area
├── Dashboard page with stat cards and charts
├── Leaders pages (SM, Master, User, Special — all tables with grand totals)
├── Manage Game pages (add, declare result, manage)
├── Client pages (create account, add/withdraw coins, account list)
├── Settlement page (rollback table)
├── Content pages (announcements, banners, rules, WhatsApp)
├── Settings pages (change password, DB backup, block bets/IDs)
├── All tables with: Search, filter, CSV/PDF export, pagination, grand total row
└── Quick action buttons (D/W/L/C/P) on all member tables
```

### Phase 5: Other Panels + User Page (Day 3-4)
```
├── Super Master Panel:
│   ├── Member management (Masters + Users)
│   ├── Add/withdraw coins for downline
│   ├── View transactions and bets of downline
│   ├── Settlement (Lena/Dena/Le Liya)
│   └── Change password (self + downline)
│
├── Master Panel:
│   ├── Same as SM but Users only
│   └── Fewer options
│
├── User Page:
│   ├── Login page (ID + Password only)
│   ├── Home page (results feed, banners, announcements)
│   ├── Betting page (game selection, bet placement)
│   ├── Charts page (weekly grid with date range filter)
│   └── Profile (Statement, Ledger, Bet History, Rules, Change Password, Logout)
│
└── Real-Time Integration:
    ├── Socket.io connections on all pages
    ├── Live result updates
    ├── Wallet balance real-time update
    ├── Betting window countdown timers
    └── Win/loss notifications
```

### Phase 6: Cron Jobs + Testing + Deployment (Day 4-5)
```
├── Cron Jobs:
│   ├── 2 AM IST daily reset
│   ├── Result deletion (older than 2 days)
│   └── Auto-close expired betting windows
│
├── Testing:
│   ├── Test all bet types and their validations
│   ├── Test settlement accuracy (each bet type)
│   ├── Test P/L cascade with multiple hierarchy levels
│   ├── Test rollback (full reversal verification)
│   ├── Test concurrent bets on same wallet
│   ├── Test blocking/unblocking accounts
│   └── Test edge cases (zero balance, expired window, etc.)
│
├── UI/UX Polish (Gemini):
│   ├── Apply DRD design system
│   ├── Responsive design
│   ├── Animations
│   └── Loading/empty states
│
└── Deployment:
    ├── Setup AWS resources
    ├── Docker build
    ├── Deploy to EC2
    ├── Configure Nginx
    ├── Setup SSL
    ├── Point domain
    └── Go live 🚀
```

---

## 16. GIT STRATEGY & .gitignore

### 16.1 .gitignore (CRITICAL — Copy This Exactly)
```gitignore
# Dependencies
node_modules/
.pnp
.pnp.js

# Environment variables (NEVER commit)
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
.env.production

# Build outputs
.next/
out/
build/
dist/

# Database
*.sql
*.dump
prisma/migrations/**/migration_lock.toml

# OS files
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
*.swp
*.swo

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*
*.log

# Testing
coverage/

# Docker
docker-compose.override.yml

# Backups
backups/
*.backup
*.bak

# Credentials
*.pem
*.key
*.cert

# Temporary files
tmp/
temp/
*.tmp
```

### 16.2 What IS Committed
```
✅ All source code (src/, server/, prisma/schema.prisma)
✅ agent/ folder (all 6 documents + README.md)
✅ package.json, package-lock.json
✅ Configuration files (tsconfig, tailwind.config, next.config)
✅ docker-compose.yml (base version)
✅ .env.example (template without actual secrets)
✅ .gitignore
✅ README.md
✅ Dockerfile
```

### 16.3 Git Workflow (Two Developers)
```
main branch ← Production-ready code
    │
    ├── dev branch ← Active development (both developers merge here)
    │   ├── feature/admin-dashboard (Developer 1)
    │   ├── feature/settlement-engine (Developer 1)
    │   ├── feature/user-page (Developer 2)
    │   └── feature/client-management (Developer 2)
    │
    └── Pull from dev → main when feature set is complete and tested
```

---

## 17. DOCUMENT MAP — WHAT TO READ WHEN

| Task | Read These Documents |
|------|---------------------|
| Understanding the full project | **PROJECT_OVERVIEW.md** (this doc) |
| Understanding features and rules | **PRD.md** |
| Building database/schema | **DATA_MODEL.md** |
| Building any backend API | **SYSTEM_DESIGN.md** + **DATA_MODEL.md** |
| Building admin panel features | **ADMIN_MODULES.md** + **DATA_MODEL.md** |
| Handling errors and edge cases | **ERROR_HANDLING.md** |
| Polishing UI/UX (Gemini) | **DRD.md** only |
| Resuming from a break | **agent/README.md** (always first) |
| Building settlement/rollback | **PRD.md** (Sections 10-12) + **DATA_MODEL.md** + **ERROR_HANDLING.md** |
| Understanding money flow | **PRD.md** (Sections 6-7) + **PROJECT_OVERVIEW.md** (Section 9) |

---

## 18. CRITICAL RULES — NEVER BREAK THESE

These rules apply to EVERY part of the application. Every AI model, every developer, every coding session must follow these without exception:

### 18.1 Financial Rules
1. **1 Coin = 1 Rupee. NO PAISA. INTEGER MATH ONLY.** — Store all amounts as integers. No decimals anywhere. Not in database, not in calculations, not in display.
2. **All wallet operations MUST be atomic** — Use Prisma `$transaction`. Either everything succeeds or everything rolls back. No partial state.
3. **Balance can NEVER go negative** — Check before every debit. If insufficient, reject.
4. **Admin has infinite/unlimited coins** — Special handling. Admin balance checks are bypassed.
5. **Payout multiplier at BET TIME** — When settling, use the multiplier that was saved with the bet when it was placed, not the current multiplier.

### 18.2 Architecture Rules
6. **Every API follows: Route → Middleware → Service → Prisma → Response** — No shortcuts. No business logic in routes. No database queries outside services.
7. **Every table has a Grand Total row** — No exceptions. Every data table in the admin panel shows aggregate totals.
8. **Every real-time event goes through WebSocket** — No polling. No page refresh needed. Ever.
9. **Admin credentials are hardcoded in .env** — Never in database. Never changeable from the UI.
10. **Hierarchy scoping on EVERY query** — A Super Master can NEVER see data outside their downline. A Master can NEVER see data outside their Users. This is enforced at the middleware level.

### 18.3 Business Rules
11. **Results are manually declared by Admin only** — No auto-generation. No scheduling. Manual.
12. **Settlement is 100% automatic after result declaration** — No manual winner selection. System calculates everything.
13. **Results permanently deleted after 2 days** — Not archived. Gone. All members have 2-day filter.
14. **Games auto-refresh at 2:00 AM IST daily** — New day starts at 2 AM, not midnight.
15. **Bets CANNOT be placed after betting window closes** — Strict server-side time check. No grace period.

### 18.4 Security Rules
16. **Never commit .env to Git** — .gitignore must include it.
17. **All passwords hashed with Argon2** — Never stored in plain text.
18. **JWT on every API request** — No unauthenticated endpoints (except login).
19. **Input validation via Zod on EVERY endpoint** — Never trust client-side data.
20. **Audit trail for every admin action** — Log what was changed, by whom, when, from what to what.

---

## 19. SCALABILITY PLAN

### 19.1 Current Scale (5K users)
- Single EC2 t3.medium handles this easily
- Single PostgreSQL instance is sufficient
- Single Redis instance is sufficient
- No load balancing needed

### 19.2 Growth Scale (20K users)
- Upgrade EC2 to t3.large or c5.large
- Upgrade RDS to db.t3.small
- Redis stays same (cache.t3.micro handles 20K easily)
- Consider read replicas for PostgreSQL if report queries become heavy

### 19.3 Future Scale (50K+ users)
- Multiple EC2 instances behind Application Load Balancer
- Redis adapter for Socket.io enables multi-instance WebSocket
- RDS Multi-AZ for high availability
- Read replicas for report/analytics queries
- Consider moving to ECS/Fargate for container orchestration
- CDN for all static assets

### 19.4 What We Build NOW for Future Scale
- Redis adapter for Socket.io (already in place even with single instance)
- Stateless backend (JWT, no server-side sessions)
- Database indexes on all frequently queried columns
- Pagination on all list APIs
- Caching strategy via Redis for hot data

---

## 20. TEAM & RESPONSIBILITIES

### 20.1 Developer 1 (You — Primary)
```
Responsibilities:
├── All 6 documents + Master Prompt creation (with Claude Opus 4.6 on claude.ai)
├── Project setup and scaffolding
├── Database schema and migrations
├── Authentication system
├── Settlement engine + P/L cascade + Rollback
├── Wallet system
├── Admin Dashboard
├── Real-time WebSocket setup
├── Deployment to AWS
└── Agent/README.md maintenance
```

### 20.2 Developer 2 (Friend)
```
Responsibilities:
├── Feeder/Leader management (Super Master, Master, User CRUD)
├── Client management module
├── Content module (announcements, banners, rules)
├── Settings module
├── Super Master panel
├── Master panel
├── User-facing pages (betting, results, charts)
└── Charts page implementation
```

### 20.3 Work Split Principle
Split by **MODULES (vertical slices), not LAYERS (horizontal)**:
- ✅ "I build settlement (backend + frontend)" — GOOD
- ❌ "I build all backend, you build all frontend" — BAD (causes integration hell)

Each developer owns their modules completely: backend API + frontend UI + testing.

---

## DOCUMENT VERSION HISTORY

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Feb 2026 | Initial comprehensive Project Overview |

---

**END OF PROJECT OVERVIEW — This document serves as the entry point for understanding the entire Matka Betting Platform project.**
