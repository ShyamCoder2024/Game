# SYSTEM DESIGN DOCUMENT
# MATKA BETTING PLATFORM
## Version 1.0 | February 2026

---

## TABLE OF CONTENTS
1. [System Architecture Overview](#1-system-architecture-overview)
2. [Technology Stack Deep Dive](#2-technology-stack-deep-dive)
3. [Application Layer Architecture](#3-application-layer-architecture)
4. [Backend Architecture Patterns](#4-backend-architecture-patterns)
5. [Authentication & Authorization System](#5-authentication--authorization-system)
6. [API Design — Complete Endpoint Reference](#6-api-design--complete-endpoint-reference)
7. [Request/Response Standards](#7-requestresponse-standards)
8. [Middleware Chain](#8-middleware-chain)
9. [Service Layer Architecture](#9-service-layer-architecture)
10. [Settlement Engine — Technical Design](#10-settlement-engine--technical-design)
11. [P/L Cascade Calculator — Technical Design](#11-pl-cascade-calculator--technical-design)
12. [Rollback Engine — Technical Design](#12-rollback-engine--technical-design)
13. [Wallet System — Technical Design](#13-wallet-system--technical-design)
14. [WebSocket Architecture](#14-websocket-architecture)
15. [Cron Job System](#15-cron-job-system)
16. [Caching Strategy (Redis)](#16-caching-strategy-redis)
17. [Database Connection & Transaction Patterns](#17-database-connection--transaction-patterns)
18. [Validation Layer (Zod Schemas)](#18-validation-layer-zod-schemas)
19. [Logging & Monitoring](#19-logging--monitoring)
20. [Security Architecture](#20-security-architecture)
21. [Frontend Architecture](#21-frontend-architecture)
22. [State Management (Zustand)](#22-state-management-zustand)
23. [API Client Layer](#23-api-client-layer)
24. [File Upload & Storage (S3)](#24-file-upload--storage-s3)
25. [Deployment Architecture](#25-deployment-architecture)
26. [Performance Optimization](#26-performance-optimization)
27. [Configuration Management](#27-configuration-management)
28. [Coding Standards & Conventions](#28-coding-standards--conventions)

---

## 1. SYSTEM ARCHITECTURE OVERVIEW

### 1.1 Architecture Style
**Modular Monolith** — A single deployable application with clear internal module boundaries. NOT microservices (overkill for current scale). NOT a tangled monolith (modules are cleanly separated).

Why Modular Monolith:
- Simple deployment (one server, one process)
- No network overhead between modules
- Easy for AI agents to understand and navigate
- Can be split into microservices later if needed
- Perfect for 5K-20K users scale

### 1.2 Three-Layer Architecture
```
┌─────────────────────────────────────────────┐
│              PRESENTATION LAYER              │
│     Next.js 14 (SSR + CSR + App Router)     │
│     Pages, Components, Hooks, Stores         │
├─────────────────────────────────────────────┤
│              APPLICATION LAYER               │
│     Fastify (HTTP) + Socket.io (WS)         │
│     Routes → Middleware → Services           │
├─────────────────────────────────────────────┤
│                DATA LAYER                    │
│     PostgreSQL (Prisma) + Redis (Cache)      │
│     Transactions, Queries, PubSub            │
└─────────────────────────────────────────────┘
```

### 1.3 Communication Patterns
| From | To | Method | Purpose |
|------|----|--------|---------|
| Frontend | Backend | REST API (HTTP) | All CRUD operations, data fetching |
| Frontend | Backend | WebSocket (Socket.io) | Real-time subscriptions |
| Backend | Database | Prisma Client | All database operations |
| Backend | Redis | ioredis | Caching, PubSub, rate limiting |
| Backend | Frontend | WebSocket (Socket.io) | Push updates (results, wallet, bets) |
| Cron | Backend Services | Direct function calls | Scheduled tasks |

---

## 2. TECHNOLOGY STACK DEEP DIVE

### 2.1 Runtime & Language
```
Node.js 22 LTS
├── Why: Latest LTS, native TypeScript support improvements, performance
├── Package Manager: npm (not yarn, not pnpm — keep it simple for AI agents)
└── Module System: ESM (import/export, not require)

TypeScript 5.x (Strict Mode)
├── strict: true in tsconfig
├── noUncheckedIndexedAccess: true
├── Full type coverage on all modules
└── Shared types between frontend and backend
```

### 2.2 Backend Framework: Fastify
```
Fastify 4.x
├── Why over Express:
│   ├── 2x faster request handling
│   ├── Built-in JSON schema validation
│   ├── Plugin-based architecture (clean module separation)
│   ├── Built-in TypeScript support
│   ├── Automatic request/response serialization
│   └── Cleaner error handling
│
├── Plugins we register:
│   ├── @fastify/cors          → Cross-origin for frontend
│   ├── @fastify/jwt           → JWT token handling
│   ├── @fastify/cookie        → Cookie support (refresh tokens)
│   ├── @fastify/rate-limit    → API rate limiting
│   ├── @fastify/helmet        → Security headers
│   ├── @fastify/multipart     → File uploads (banners)
│   └── @fastify/websocket     → WebSocket upgrade support
│
└── NOT using:
    ├── @fastify/swagger (not needed for AI-agent development)
    └── @fastify/static (Next.js handles static files)
```

### 2.3 Database: PostgreSQL 16 via Prisma 5
```
PostgreSQL 16
├── Why:
│   ├── ACID transactions (critical for financial operations)
│   ├── Robust index support (B-tree, partial indexes)
│   ├── Excellent concurrent read/write performance
│   ├── JSON support for flexible data
│   └── Battle-tested at scale
│
Prisma 5.x
├── Why over raw SQL or Knex:
│   ├── Type-safe queries (TypeScript integration)
│   ├── Migration system built-in
│   ├── Relation handling (joins) is clean
│   ├── Transaction support ($transaction)
│   ├── AI agents write better Prisma code than raw SQL
│   └── Schema is readable and serves as documentation
│
├── Connection pooling: Prisma default (connection_limit in DATABASE_URL)
└── Logging: query events enabled in development
```

### 2.4 Cache & PubSub: Redis 7 via ioredis
```
Redis 7.x
├── Client: ioredis (not node-redis — better cluster support, Promises native)
├── Mode: Single instance (not cluster — overkill for current scale)
│
├── Usage:
│   ├── Socket.io adapter (PubSub for multi-process support)
│   ├── Cache: Game status, betting windows, online count
│   ├── Rate limiting counters
│   ├── Dashboard stat cache (pre-computed)
│   └── Session blacklist (for logged-out tokens)
│
└── TTL Strategy:
    ├── Game status: 60 seconds
    ├── Betting windows: 30 seconds
    ├── Dashboard stats: 10 seconds
    ├── Rate limit counters: Per-minute sliding window
    └── Session blacklist: Same as JWT expiry (24h)
```

### 2.5 Frontend: Next.js 14
```
Next.js 14 (App Router)
├── Why v14 not v15: Stable, well-documented, AI agents know it well
├── Rendering Strategy:
│   ├── Admin Panel: Client-side rendering (CSR) — highly interactive
│   ├── User Home: Server-side rendering (SSR) — SEO for results page
│   ├── User Betting: Client-side rendering (CSR) — real-time interaction
│   └── Charts: SSR with client hydration
│
├── Route Groups:
│   ├── (auth)/    → Login pages (no layout)
│   ├── (user)/    → User-facing pages (user layout)
│   ├── admin/     → Admin panel (admin layout with sidebar)
│   ├── supermaster/ → Super Master panel
│   └── master/    → Master panel
│
└── API Routes: NOT using Next.js API routes
    └── All API is handled by Fastify (separate server)
    └── Reason: Cleaner separation, Fastify is faster, Socket.io lives on Fastify
```

---

## 3. APPLICATION LAYER ARCHITECTURE

### 3.1 Server Entry Point
```typescript
// server/index.ts
import Fastify from 'fastify';
import { setupPlugins } from './plugins';
import { setupRoutes } from './routes';
import { setupSocket } from './socket';
import { setupCron } from './cron';
import { prisma } from './lib/prisma';
import { redis } from './lib/redis';

const app = Fastify({
  logger: {
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    transport: process.env.NODE_ENV !== 'production' 
      ? { target: 'pino-pretty' } 
      : undefined,
  },
});

// 1. Register plugins (cors, jwt, helmet, rate-limit)
await setupPlugins(app);

// 2. Register routes (all API endpoints)
await setupRoutes(app);

// 3. Setup Socket.io on the Fastify server
const io = setupSocket(app.server);

// 4. Setup cron jobs (2AM reset, result cleanup, window auto-close)
setupCron();

// 5. Start server
await app.listen({ port: Number(process.env.PORT) || 3001, host: '0.0.0.0' });
```

### 3.2 Plugin Registration Order
```typescript
// server/plugins/index.ts
export async function setupPlugins(app: FastifyInstance) {
  // 1. Security headers (FIRST)
  await app.register(helmet);
  
  // 2. CORS
  await app.register(cors, {
    origin: process.env.FRONTEND_URL,
    credentials: true,
  });
  
  // 3. Rate limiting
  await app.register(rateLimit, {
    max: 100,          // 100 requests
    timeWindow: '1 minute',
    redis: redisClient, // Use Redis for distributed counting
  });
  
  // 4. JWT
  await app.register(jwt, {
    secret: process.env.JWT_SECRET,
  });
  
  // 5. Multipart (file uploads)
  await app.register(multipart, {
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  });
  
  // 6. Cookie
  await app.register(cookie);
}
```

### 3.3 Route Registration
```typescript
// server/routes/index.ts
export async function setupRoutes(app: FastifyInstance) {
  // Public routes (no auth)
  app.register(authRoutes, { prefix: '/api/auth' });
  
  // Protected routes (JWT required)
  app.register(async (protectedApp) => {
    protectedApp.addHook('onRequest', authMiddleware);
    
    // User routes
    protectedApp.register(betRoutes, { prefix: '/api/bets' });
    protectedApp.register(userRoutes, { prefix: '/api/user' });
    protectedApp.register(resultPublicRoutes, { prefix: '/api/results' });
    protectedApp.register(chartRoutes, { prefix: '/api/charts' });
    
    // Admin routes (additional role check)
    protectedApp.register(async (adminApp) => {
      adminApp.addHook('onRequest', roleMiddleware(['admin']));
      adminApp.register(adminRoutes, { prefix: '/api/admin' });
      adminApp.register(gameRoutes, { prefix: '/api/admin/games' });
      adminApp.register(resultAdminRoutes, { prefix: '/api/admin/results' });
      adminApp.register(settlementRoutes, { prefix: '/api/admin/settlement' });
      adminApp.register(contentRoutes, { prefix: '/api/admin/content' });
      adminApp.register(settingsRoutes, { prefix: '/api/admin/settings' });
    });
    
    // Leader routes (admin + supermaster + master with hierarchy scoping)
    protectedApp.register(async (leaderApp) => {
      leaderApp.addHook('onRequest', roleMiddleware(['admin', 'supermaster', 'master']));
      leaderApp.register(leaderRoutes, { prefix: '/api/leaders' });
      leaderApp.register(walletRoutes, { prefix: '/api/wallet' });
      leaderApp.register(reportRoutes, { prefix: '/api/reports' });
    });
  });
}
```

---

## 4. BACKEND ARCHITECTURE PATTERNS

### 4.1 The Sacred Pattern: Route → Middleware → Service → Prisma
```
EVERY API endpoint follows this exact flow:

1. ROUTE HANDLER
   ├── Defines HTTP method + URL
   ├── Attaches Zod validation schema
   ├── Calls the service function
   └── Returns response

2. MIDDLEWARE (applied via hooks)
   ├── authMiddleware: Verify JWT, attach user to request
   ├── roleMiddleware: Check user role matches required roles
   ├── hierarchyMiddleware: Scope data access to downline
   └── rateLimitMiddleware: Check rate limits

3. SERVICE FUNCTION
   ├── Contains ALL business logic
   ├── Calls Prisma for database operations
   ├── Calls Redis for cache operations
   ├── Calls Socket.io for real-time broadcasts
   ├── Handles errors and throws typed exceptions
   └── Returns data to route handler

4. PRISMA (Database)
   ├── All queries are type-safe
   ├── Transactions for multi-step operations
   ├── Includes for relations
   └── Where clauses scoped by hierarchy
```

### 4.2 Example: Complete API Implementation Pattern
```typescript
// ==========================================
// 1. ROUTE — server/routes/bet.routes.ts
// ==========================================
import { FastifyInstance } from 'fastify';
import { placeBetSchema } from '../validators/bet.schema';
import { BetService } from '../services/bet.service';

export async function betRoutes(app: FastifyInstance) {
  
  app.post('/place', {
    schema: {
      body: placeBetSchema,
    },
    handler: async (request, reply) => {
      const userId = request.user.id; // from authMiddleware
      const betData = request.body;
      
      const result = await BetService.placeBet(userId, betData);
      
      return reply.status(201).send({
        success: true,
        data: result,
        message: 'Bet placed successfully',
      });
    },
  });
  
  app.get('/my-bets', {
    handler: async (request, reply) => {
      const userId = request.user.id;
      const { date, gameId, status, page, limit } = request.query;
      
      const result = await BetService.getUserBets(userId, { date, gameId, status, page, limit });
      
      return reply.send({
        success: true,
        data: result.bets,
        pagination: result.pagination,
      });
    },
  });
}

// ==========================================
// 2. VALIDATOR — server/validators/bet.schema.ts
// ==========================================
import { z } from 'zod';

export const placeBetSchema = z.object({
  game_id: z.number().int().positive(),
  bet_type: z.enum(['SINGLE_AKDA', 'SINGLE_PATTI', 'DOUBLE_PATTI', 'TRIPLE_PATTI', 'JODI']),
  bet_number: z.string().min(1).max(3),
  bet_amount: z.number().int().min(10, 'Minimum bet is ₹10'),
});

// ==========================================
// 3. SERVICE — server/services/bet.service.ts
// ==========================================
import { prisma } from '../lib/prisma';
import { AppError } from '../utils/errors';
import { validateBetNumber } from '../utils/calculation';
import { emitToUser, emitToAdmin } from '../socket';

export class BetService {
  
  static async placeBet(userId: number, data: PlaceBetInput) {
    
    // Step 1: Validate bet number for bet type
    if (!validateBetNumber(data.bet_type, data.bet_number)) {
      throw new AppError('INVALID_BET_NUMBER', 'Invalid number for selected bet type', 400);
    }
    
    // Step 2: Check betting window is open
    const window = await prisma.bettingWindow.findFirst({
      where: {
        game_id: data.game_id,
        date: new Date().toISOString().split('T')[0],
        is_open: true,
        closes_at: { gt: new Date() },
      },
    });
    if (!window) {
      throw new AppError('WINDOW_CLOSED', 'Betting window is closed for this game', 400);
    }
    
    // Step 3: Get active payout multiplier
    const multiplier = await this.getActiveMultiplier(data.game_id, data.bet_type);
    
    // Step 4: Calculate potential win
    const potentialWin = data.bet_amount * multiplier;
    
    // Step 5: Atomic transaction — deduct balance + create bet + create transaction
    const result = await prisma.$transaction(async (tx) => {
      
      // Check user balance
      const user = await tx.user.findUnique({ where: { id: userId } });
      if (!user || user.wallet_balance < data.bet_amount) {
        throw new AppError('INSUFFICIENT_BALANCE', 'Not enough coins', 400);
      }
      
      // Deduct balance
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: { wallet_balance: { decrement: data.bet_amount } },
      });
      
      // Generate bet ID
      const betId = generateBetId(user.user_id);
      
      // Create bet record
      const bet = await tx.bet.create({
        data: {
          bet_id: betId,
          user_id: userId,
          game_id: data.game_id,
          date: new Date().toISOString().split('T')[0],
          bet_type: data.bet_type,
          bet_number: data.bet_number,
          bet_amount: data.bet_amount,
          payout_multiplier: multiplier,
          potential_win: potentialWin,
          status: 'pending',
        },
      });
      
      // Create transaction record
      await tx.transaction.create({
        data: {
          txn_id: generateTxnId(user.user_id),
          user_id: userId,
          type: 'BET_PLACED',
          amount: data.bet_amount,
          balance_before: user.wallet_balance,
          balance_after: updatedUser.wallet_balance,
          reference: betId,
          notes: `Bet on ${data.bet_type} ${data.bet_number}`,
        },
      });
      
      // Update betting window stats
      await tx.bettingWindow.update({
        where: { id: window.id },
        data: {
          total_bets: { increment: 1 },
          total_amount: { increment: data.bet_amount },
        },
      });
      
      return {
        bet_id: betId,
        wallet_balance: updatedUser.wallet_balance,
        potential_win: potentialWin,
        bet_type: data.bet_type,
        bet_number: data.bet_number,
        bet_amount: data.bet_amount,
      };
    });
    
    // Step 6: Real-time updates (outside transaction — non-blocking)
    emitToUser(userId, 'wallet-update', { balance: result.wallet_balance });
    emitToAdmin('bet-stream', {
      user_id: userId,
      game_id: data.game_id,
      bet_type: data.bet_type,
      bet_number: data.bet_number,
      amount: data.bet_amount,
      timestamp: new Date(),
    });
    
    return result;
  }
}
```

### 4.3 Error Handling Pattern
```typescript
// server/utils/errors.ts
export class AppError extends Error {
  constructor(
    public code: string,
    public message: string,
    public statusCode: number = 400,
    public details?: Record<string, any>,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

// Global error handler registered in Fastify
app.setErrorHandler((error, request, reply) => {
  if (error instanceof AppError) {
    return reply.status(error.statusCode).send({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
      },
    });
  }
  
  // Prisma errors
  if (error.code === 'P2002') {
    return reply.status(409).send({
      success: false,
      error: {
        code: 'DUPLICATE_ENTRY',
        message: 'A record with this value already exists',
      },
    });
  }
  
  // Zod validation errors
  if (error.validation) {
    return reply.status(400).send({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request data',
        details: error.validation,
      },
    });
  }
  
  // Unknown errors
  app.log.error(error);
  return reply.status(500).send({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    },
  });
});
```

---

## 5. AUTHENTICATION & AUTHORIZATION SYSTEM

### 5.1 Authentication Flow
```
LOGIN:
1. User submits ID + Password → POST /api/auth/login
2. Server checks:
   ├── If ID matches ADMIN_ID env var → validate against ADMIN_PASSWORD_HASH
   └── If ID matches database user → validate against stored password_hash
3. Verify password with Argon2
4. Generate JWT token containing: { id, user_id, role, created_by }
5. Return token + user profile

TOKEN USAGE:
- Frontend stores JWT in memory (Zustand store) — NOT localStorage
- Every API request includes: Authorization: Bearer <token>
- Token expiry: 24 hours
- On expiry: Redirect to login

ADMIN MASTER KEY:
- Admin can access any account by providing the target user_id
- POST /api/auth/master-access { target_user_id: "PL519" }
- Returns a temporary view-only token for that account
- Audit logged
```

### 5.2 JWT Payload
```typescript
interface JWTPayload {
  id: number;           // Database primary key
  user_id: string;      // Display ID (PL519)
  role: 'admin' | 'supermaster' | 'master' | 'user';
  name: string;
  created_by: number | null;  // Parent in hierarchy (null for admin)
  iat: number;          // Issued at
  exp: number;          // Expiry
}
```

### 5.3 Password Hashing
```typescript
import argon2 from 'argon2';

// Hash password (on account creation)
const hash = await argon2.hash(password, {
  type: argon2.argon2id,
  memoryCost: 65536,    // 64MB
  timeCost: 3,          // 3 iterations
  parallelism: 4,       // 4 threads
});

// Verify password (on login)
const isValid = await argon2.verify(storedHash, inputPassword);
```

### 5.4 Admin Hardcoded Credentials
```typescript
// server/services/auth.service.ts
async function loginAdmin(inputId: string, inputPassword: string) {
  const adminId = process.env.ADMIN_ID;
  const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;
  
  if (inputId !== adminId) return null;
  
  const isValid = await argon2.verify(adminPasswordHash, inputPassword);
  if (!isValid) return null;
  
  // Return admin profile (not from database)
  return {
    id: 0,                  // Special ID for admin
    user_id: adminId,
    role: 'admin' as const,
    name: 'Admin',
    wallet_balance: Infinity, // Conceptually infinite
    created_by: null,
  };
}
```

### 5.5 Role Middleware
```typescript
// server/middleware/role.middleware.ts
export function roleMiddleware(allowedRoles: string[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user;
    
    if (!user || !allowedRoles.includes(user.role)) {
      throw new AppError('FORBIDDEN', 'You do not have permission to access this resource', 403);
    }
  };
}

// Usage in routes:
app.addHook('onRequest', roleMiddleware(['admin']));                    // Admin only
app.addHook('onRequest', roleMiddleware(['admin', 'supermaster']));     // Admin + SM
app.addHook('onRequest', roleMiddleware(['admin', 'supermaster', 'master'])); // Leaders
```

### 5.6 Hierarchy Middleware
```typescript
// server/middleware/hierarchy.middleware.ts
// This middleware ensures members can ONLY access data from their downline

export async function hierarchyMiddleware(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user;
  
  // Admin sees everything — no scoping needed
  if (user.role === 'admin') {
    request.hierarchyScope = null; // null = no filter (sees all)
    return;
  }
  
  // For SM/Master — get all IDs in their downline tree
  const downlineIds = await getDownlineIds(user.id);
  request.hierarchyScope = downlineIds; // Array of user IDs they can see
}

async function getDownlineIds(parentId: number): Promise<number[]> {
  // Recursive CTE query to get entire downline tree
  const result = await prisma.$queryRaw`
    WITH RECURSIVE downline AS (
      SELECT id FROM users WHERE created_by = ${parentId}
      UNION ALL
      SELECT u.id FROM users u
      INNER JOIN downline d ON u.created_by = d.id
    )
    SELECT id FROM downline;
  `;
  return result.map((r: any) => r.id);
}

// Usage in service layer:
async function getMembers(scope: number[] | null) {
  const where = scope ? { id: { in: scope } } : {}; // null = no filter for admin
  return prisma.user.findMany({ where });
}
```

---

## 6. API DESIGN — COMPLETE ENDPOINT REFERENCE

### 6.1 Authentication APIs
```
POST   /api/auth/login              → Login (all roles)
POST   /api/auth/refresh            → Refresh JWT token
POST   /api/auth/logout             → Invalidate token
POST   /api/auth/master-access      → Admin master key access (admin only)
```

### 6.2 User APIs (Authenticated Users)
```
GET    /api/user/profile            → Get own profile
PUT    /api/user/change-password    → Change own password
GET    /api/user/statement          → Financial statement
GET    /api/user/ledger             → Transaction ledger
```

### 6.3 Bet APIs (Users Only)
```
POST   /api/bets/place              → Place a bet
GET    /api/bets/my-bets            → Get own bets (with filters: date, game, status)
GET    /api/bets/my-bets/today      → Today's bets
GET    /api/bets/:betId             → Single bet details
```

### 6.4 Result APIs (Public — Authenticated)
```
GET    /api/results/today           → Today's results (all games)
GET    /api/results/game/:gameId    → Results for specific game
GET    /api/results/filter          → Filter results (date range, max 2 days)
```

### 6.5 Chart APIs (Authenticated)
```
GET    /api/charts/:gameId          → Chart data for a game (weekly grid)
GET    /api/charts/:gameId/range    → Chart data for date range
```

### 6.6 Game APIs (Active Games — Authenticated)
```
GET    /api/games/active            → List active games with current window status
GET    /api/games/:gameId/status    → Single game status + countdown
GET    /api/games/:gameId/multipliers → Current payout multipliers for a game
```

### 6.7 Admin — Game Management APIs
```
POST   /api/admin/games             → Create new game
PUT    /api/admin/games/:id         → Edit game (name, timings, color, active)
DELETE /api/admin/games/:id         → Delete game
PUT    /api/admin/games/:id/toggle  → Enable/Disable game
PUT    /api/admin/games/:id/multipliers → Set per-game payout multipliers
PUT    /api/admin/games/multipliers → Set global default payout multipliers
```

### 6.8 Admin — Result Declaration APIs
```
POST   /api/admin/results/declare      → Declare result (enter panna)
POST   /api/admin/results/preview      → Preview calculation without saving
GET    /api/admin/results/matches       → List all matches with declared/undeclared status
GET    /api/admin/results/matches/:id   → Single match details with P/L
```

### 6.9 Admin — Settlement APIs
```
GET    /api/admin/settlement/rollback-list  → List of settled matches
POST   /api/admin/settlement/rollback/:id   → Rollback a settlement
GET    /api/admin/settlement/status/:matchId → Settlement status details
```

### 6.10 Leader — Account Management APIs (Admin, SM, Master)
```
POST   /api/leaders/create             → Create account (SM/Master/User based on creator's role)
GET    /api/leaders/list               → List all members in downline (with hierarchy scoping)
GET    /api/leaders/:id                → Get member details
PUT    /api/leaders/:id                → Edit member (name, deal %, limits, special flag)
PUT    /api/leaders/:id/block          → Block/Unblock member
PUT    /api/leaders/:id/password       → Change member's password
GET    /api/leaders/special            → List special masters
GET    /api/leaders/hierarchy          → Full hierarchy tree with deal %
```

### 6.11 Leader — Wallet APIs (Admin, SM, Master)
```
POST   /api/wallet/credit              → Add coins to member
POST   /api/wallet/debit               → Withdraw coins from member
GET    /api/wallet/transactions/:userId → Transaction history for a member
GET    /api/wallet/balance/:userId      → Current balance + exposure
```

### 6.12 Leader — Report APIs
```
GET    /api/reports/pnl                 → Profit/Loss report (scoped to downline)
GET    /api/reports/collection          → Collection report (Lena/Dena/Le Liya)
GET    /api/reports/bets               → All bets report (filterable)
GET    /api/reports/exposure            → Exposure report (pending bets)
GET    /api/reports/cashbook            → Cashbook (all transactions)
GET    /api/reports/deal-percentage     → Deal percentage chain report
GET    /api/reports/daily-summary       → Daily summary with grand totals
```

### 6.13 Admin — Content APIs
```
POST   /api/admin/content/announcements      → Create announcement
PUT    /api/admin/content/announcements/:id   → Edit announcement
DELETE /api/admin/content/announcements/:id   → Delete announcement
GET    /api/admin/content/announcements       → List all announcements
POST   /api/admin/content/banners             → Upload banner
PUT    /api/admin/content/banners/:id         → Edit banner (order, active)
DELETE /api/admin/content/banners/:id         → Delete banner
GET    /api/admin/content/banners             → List banners
PUT    /api/admin/content/rules               → Update game rules
GET    /api/admin/content/rules               → Get current rules
PUT    /api/admin/content/whatsapp            → Update WhatsApp number
GET    /api/admin/content/whatsapp            → Get WhatsApp number
```

### 6.14 Admin — Settings APIs
```
POST   /api/admin/settings/backup             → Trigger database backup
GET    /api/admin/settings/backup/history      → Backup history
PUT    /api/admin/settings/block-bets          → Block/unblock betting (per game/global)
GET    /api/admin/settings/block-bets          → Get blocked bet config
PUT    /api/admin/settings/block-id            → Block/unblock user ID
GET    /api/admin/settings/blocked-ids         → List blocked IDs
GET    /api/admin/settings/login-reports       → Login history
```

### 6.15 Admin — Dashboard APIs
```
GET    /api/admin/dashboard/stats              → Dashboard stat cards data
GET    /api/admin/dashboard/pnl-chart          → P/L trend chart data (7 days)
GET    /api/admin/dashboard/game-distribution  → Game popularity chart data
GET    /api/admin/dashboard/upcoming           → Upcoming results timeline
GET    /api/admin/dashboard/live-bets          → Recent bet stream
```

### 6.16 Public APIs (User Page — Authenticated)
```
GET    /api/public/announcements     → Active announcements (for marquee)
GET    /api/public/banners           → Active banners (for carousel)
GET    /api/public/rules             → Game rules
GET    /api/public/whatsapp          → WhatsApp number
```

---

## 7. REQUEST/RESPONSE STANDARDS

### 7.1 Standard Success Response
```typescript
{
  success: true,
  data: T,                    // The actual data
  message?: string            // Optional human-readable message
}
```

### 7.2 Standard Error Response
```typescript
{
  success: false,
  error: {
    code: string,             // Machine-readable error code (e.g., "INSUFFICIENT_BALANCE")
    message: string,          // Human-readable error message
    details?: Record<string, any>  // Optional additional details
  }
}
```

### 7.3 Standard List Response (with Pagination + Grand Total)
```typescript
{
  success: true,
  data: T[],                  // Array of items
  pagination: {
    page: number,             // Current page (1-indexed)
    limit: number,            // Items per page
    total: number,            // Total items matching filter
    totalPages: number        // Calculated total pages
  },
  grandTotal: {               // Aggregated totals (REQUIRED on all list endpoints)
    balance?: number,
    pnl?: number,
    exposure?: number,
    totalBets?: number,
    totalAmount?: number,
    // ... context-specific totals
  }
}
```

### 7.4 Pagination Parameters
```
All list endpoints accept:
?page=1         → Page number (default: 1)
?limit=20       → Items per page (default: 20, max: 100)
?search=PL519   → Search by name or ID
?sort=balance   → Sort field
?order=desc     → Sort direction (asc/desc)
?status=active  → Filter by status
?dateFrom=2026-02-01  → Date range start
?dateTo=2026-02-08    → Date range end
?gameId=5       → Filter by game
```

### 7.5 Number Format Convention
```
API Layer:     Integers always (no decimals)
Database:      Integer columns (not DECIMAL or FLOAT)
Display:       Frontend formats to Indian number system with ₹ prefix

Example:
Database stores: 1450320
API returns: 1450320
Frontend displays: ₹14,50,320
```

---

## 8. MIDDLEWARE CHAIN

### 8.1 Request Processing Order
```
Incoming Request
    │
    ├── 1. Fastify Rate Limiter     → Reject if exceeded
    ├── 2. Helmet (Security Headers) → Add security headers
    ├── 3. CORS Check                → Reject if not allowed origin
    ├── 4. Body Parser               → Parse JSON body
    ├── 5. Auth Middleware            → Verify JWT, attach user
    ├── 6. Role Middleware            → Check role permissions
    ├── 7. Hierarchy Middleware       → Scope data to downline
    ├── 8. Zod Validation            → Validate request body/params
    ├── 9. Route Handler             → Process request
    └── 10. Error Handler            → Catch and format errors
```

### 8.2 Rate Limiting Strategy
```
Global:          100 requests/minute per IP
Login:           5 attempts/15 minutes per IP (brute force protection)
Bet Placement:   30 bets/minute per user
Wallet Operations: 10/minute per admin
Result Declaration: 5/minute per admin
```

---

## 9. SERVICE LAYER ARCHITECTURE

### 9.1 Service Structure
```
server/services/
├── auth.service.ts         → Login, token generation, master key
├── bet.service.ts          → Place bet, get bets, validate bets
├── game.service.ts         → CRUD games, manage windows, multipliers
├── result.service.ts       → Declare result, calculate singles/jodi
├── settlement.service.ts   → CRITICAL: Auto-settle bets after result
├── pnl.service.ts          → CRITICAL: Cascade P/L through hierarchy
├── rollback.service.ts     → CRITICAL: Reverse entire settlement
├── wallet.service.ts       → Credit/debit coins, check balance
├── leader.service.ts       → Create/manage accounts, hierarchy
├── report.service.ts       → P/L reports, collection, cashbook
├── content.service.ts      → Announcements, banners, rules
└── backup.service.ts       → Database backup operations
```

### 9.2 Service Rules
1. Services contain ALL business logic — routes are thin
2. Services call Prisma for database operations — never raw SQL except for recursive CTEs
3. Services throw `AppError` for business rule violations
4. Services are stateless — no instance variables, all methods are static
5. Complex operations use `prisma.$transaction` for atomicity
6. Services emit WebSocket events for real-time updates (non-blocking)
7. Services log important operations via `app.log`

---

## 10. SETTLEMENT ENGINE — TECHNICAL DESIGN

### 10.1 Settlement Process (Triggered by Result Declaration)
```typescript
// server/services/settlement.service.ts

export class SettlementService {
  
  static async settleGame(gameId: number, date: string, result: DeclaredResult) {
    
    // Step 1: Get all pending bets for this game/date
    const pendingBets = await prisma.bet.findMany({
      where: {
        game_id: gameId,
        date: date,
        status: 'pending',
      },
      include: {
        user: {
          select: { id: true, user_id: true, wallet_balance: true, created_by: true },
        },
      },
    });
    
    if (pendingBets.length === 0) return { winnersCount: 0, totalPayout: 0 };
    
    let winnersCount = 0;
    let totalPayout = 0;
    let losersCount = 0;
    
    // Step 2: Process each bet in a transaction
    for (const bet of pendingBets) {
      const isWinner = this.checkWinner(bet, result);
      
      if (isWinner) {
        await this.processWinner(bet, result);
        winnersCount++;
        totalPayout += bet.bet_amount * bet.payout_multiplier;
      } else {
        await this.processLoser(bet, result);
        losersCount++;
      }
      
      // Step 3: Cascade P/L through hierarchy for this bet
      await PnLService.cascadePnL(bet, isWinner, result);
    }
    
    // Step 4: Broadcast settlement complete
    emitToAll('settlement-complete', {
      gameId, date, winnersCount, losersCount, totalPayout,
    });
    
    return { winnersCount, losersCount, totalPayout };
  }
  
  static checkWinner(bet: Bet, result: DeclaredResult): boolean {
    switch (bet.bet_type) {
      case 'SINGLE_AKDA':
        return (
          String(bet.bet_number) === String(result.open_single) ||
          String(bet.bet_number) === String(result.close_single)
        );
      
      case 'SINGLE_PATTI':
      case 'DOUBLE_PATTI':
      case 'TRIPLE_PATTI':
        return (
          bet.bet_number === result.open_panna ||
          bet.bet_number === result.close_panna
        );
      
      case 'JODI':
        return bet.bet_number === result.jodi;
      
      default:
        return false;
    }
  }
  
  static async processWinner(bet: Bet, result: DeclaredResult) {
    const winAmount = bet.bet_amount * bet.payout_multiplier;
    
    await prisma.$transaction(async (tx) => {
      // Update bet
      await tx.bet.update({
        where: { id: bet.id },
        data: {
          status: 'won',
          win_amount: winAmount,
          result_id: result.id,
          settled_at: new Date(),
        },
      });
      
      // Credit wallet
      const updatedUser = await tx.user.update({
        where: { id: bet.user_id },
        data: { wallet_balance: { increment: winAmount } },
      });
      
      // Transaction record
      await tx.transaction.create({
        data: {
          txn_id: generateTxnId(bet.user.user_id),
          user_id: bet.user_id,
          type: 'BET_WON',
          amount: winAmount,
          balance_before: updatedUser.wallet_balance - winAmount,
          balance_after: updatedUser.wallet_balance,
          reference: bet.bet_id,
          notes: `Won ${bet.bet_type} ${bet.bet_number} on game`,
        },
      });
    });
    
    // Notify winner (non-blocking)
    emitToUser(bet.user_id, 'bet-won', {
      bet_id: bet.bet_id,
      win_amount: winAmount,
      bet_type: bet.bet_type,
      bet_number: bet.bet_number,
    });
  }
  
  static async processLoser(bet: Bet, result: DeclaredResult) {
    await prisma.bet.update({
      where: { id: bet.id },
      data: {
        status: 'lost',
        result_id: result.id,
        settled_at: new Date(),
      },
    });
    // No wallet change — amount already deducted at bet placement
  }
}
```

### 10.2 Result Calculation
```typescript
// server/utils/calculation.ts

export function calculateResult(openPanna: string, closePanna: string) {
  const openDigits = openPanna.split('').map(Number);
  const closeDigits = closePanna.split('').map(Number);
  
  const openSum = openDigits.reduce((a, b) => a + b, 0);
  const closeSum = closeDigits.reduce((a, b) => a + b, 0);
  
  const openSingle = openSum % 10;
  const closeSingle = closeSum % 10;
  const jodi = `${openSingle}${closeSingle}`;
  
  return { openSingle, closeSingle, jodi };
}

export function validateBetNumber(betType: string, number: string): boolean {
  switch (betType) {
    case 'SINGLE_AKDA':
      return /^[0-9]$/.test(number);
    
    case 'JODI':
      return /^[0-9]{2}$/.test(number);
    
    case 'SINGLE_PATTI': {
      if (!/^[0-9]{3}$/.test(number)) return false;
      const digits = number.split('');
      return digits[0] !== digits[1] && digits[1] !== digits[2] && digits[0] !== digits[2];
    }
    
    case 'DOUBLE_PATTI': {
      if (!/^[0-9]{3}$/.test(number)) return false;
      const d = number.split('');
      const pairs = (d[0]===d[1] ? 1 : 0) + (d[1]===d[2] ? 1 : 0) + (d[0]===d[2] ? 1 : 0);
      return pairs === 1; // exactly one pair
    }
    
    case 'TRIPLE_PATTI': {
      if (!/^[0-9]{3}$/.test(number)) return false;
      return number[0] === number[1] && number[1] === number[2];
    }
    
    default:
      return false;
  }
}
```

---

## 11. P/L CASCADE CALCULATOR — TECHNICAL DESIGN

### 11.1 Cascade Logic
```typescript
// server/services/pnl.service.ts

export class PnLService {
  
  static async cascadePnL(bet: Bet, isWinner: boolean, result: DeclaredResult) {
    
    // Get the full hierarchy chain for this user
    // User → Master → Super Master → Admin
    const chain = await this.getHierarchyChain(bet.user_id);
    
    // Calculate the net amount
    // If user LOST: positive P/L for hierarchy (they earned)
    // If user WON: negative P/L for hierarchy (they paid out)
    const netAmount = isWinner 
      ? -(bet.bet_amount * bet.payout_multiplier)  // Payout (loss for house)
      : bet.bet_amount;                             // Bet amount kept (profit for house)
    
    // Process each level in the chain
    for (let i = 0; i < chain.length; i++) {
      const member = chain[i];
      const childDealPercent = i === 0 
        ? 0                           // User level (base)
        : chain[i-1].deal_percentage; // Child's deal %
      const myDealPercent = member.deal_percentage;
      
      // My commission = my deal % - child's deal %
      const commissionPercent = myDealPercent - childDealPercent;
      const myPnL = Math.round(netAmount * (commissionPercent / 100));
      
      // Update member's P/L record
      await prisma.memberPnL.upsert({
        where: {
          user_id_date_game_id: {
            user_id: member.id,
            date: bet.date,
            game_id: bet.game_id,
          },
        },
        update: {
          pnl: { increment: myPnL },
        },
        create: {
          user_id: member.id,
          date: bet.date,
          game_id: bet.game_id,
          pnl: myPnL,
        },
      });
    }
  }
  
  static async getHierarchyChain(userId: number) {
    // Walk UP the tree from user to admin
    const chain = [];
    let currentId = userId;
    
    while (currentId) {
      const user = await prisma.user.findUnique({
        where: { id: currentId },
        select: { id: true, user_id: true, role: true, deal_percentage: true, created_by: true },
      });
      
      if (!user || user.role === 'user') {
        currentId = user?.created_by || 0;
        continue;
      }
      
      chain.push(user);
      
      if (user.role === 'admin' || !user.created_by) break;
      currentId = user.created_by;
    }
    
    return chain; // [Master, Super Master, Admin] (bottom to top)
  }
}
```

---

## 12. ROLLBACK ENGINE — TECHNICAL DESIGN

### 12.1 Rollback Process
```typescript
// server/services/rollback.service.ts

export class RollbackService {
  
  static async rollbackSettlement(resultId: number, adminId: number) {
    
    // Step 1: Get all bets settled with this result
    const settledBets = await prisma.bet.findMany({
      where: { result_id: resultId, status: { in: ['won', 'lost'] } },
      include: { user: true },
    });
    
    // Step 2: Reverse everything in one big transaction
    await prisma.$transaction(async (tx) => {
      
      for (const bet of settledBets) {
        if (bet.status === 'won') {
          // DEDUCT the win amount back
          const winAmount = bet.win_amount;
          
          const user = await tx.user.findUnique({ where: { id: bet.user_id } });
          
          await tx.user.update({
            where: { id: bet.user_id },
            data: { wallet_balance: { decrement: winAmount } },
          });
          
          await tx.transaction.create({
            data: {
              txn_id: generateTxnId(bet.user.user_id),
              user_id: bet.user_id,
              type: 'ROLLBACK_DEBIT',
              amount: winAmount,
              balance_before: user.wallet_balance,
              balance_after: user.wallet_balance - winAmount,
              reference: bet.bet_id,
              notes: `Rollback: Win reversed for ${bet.bet_type} ${bet.bet_number}`,
            },
          });
        }
        
        if (bet.status === 'lost') {
          // RETURN the bet amount
          const user = await tx.user.findUnique({ where: { id: bet.user_id } });
          
          await tx.user.update({
            where: { id: bet.user_id },
            data: { wallet_balance: { increment: bet.bet_amount } },
          });
          
          await tx.transaction.create({
            data: {
              txn_id: generateTxnId(bet.user.user_id),
              user_id: bet.user_id,
              type: 'ROLLBACK_CREDIT',
              amount: bet.bet_amount,
              balance_before: user.wallet_balance,
              balance_after: user.wallet_balance + bet.bet_amount,
              reference: bet.bet_id,
              notes: `Rollback: Bet amount returned for ${bet.bet_type} ${bet.bet_number}`,
            },
          });
        }
        
        // Reset bet to pending
        await tx.bet.update({
          where: { id: bet.id },
          data: {
            status: 'pending',
            win_amount: 0,
            result_id: null,
            settled_at: null,
          },
        });
      }
      
      // Reverse all P/L records for this result's game/date
      await tx.memberPnL.deleteMany({
        where: {
          game_id: settledBets[0]?.game_id,
          date: settledBets[0]?.date,
        },
      });
      
      // Mark result as rolled back
      await tx.result.update({
        where: { id: resultId },
        data: { is_rolled_back: true },
      });
      
      // Audit log
      await tx.adminAction.create({
        data: {
          admin_id: adminId,
          action_type: 'ROLLBACK_SETTLEMENT',
          entity_type: 'RESULT',
          entity_id: resultId,
          old_value: JSON.stringify({ betsAffected: settledBets.length }),
          new_value: 'rolled_back',
          ip_address: '', // Populated from request
        },
      });
    });
    
    // Broadcast rollback event
    emitToAll('settlement-rolled-back', { resultId });
    
    return { betsRolledBack: settledBets.length };
  }
}
```

---

## 13. WALLET SYSTEM — TECHNICAL DESIGN

### 13.1 Atomic Wallet Operations
```typescript
// server/services/wallet.service.ts

export class WalletService {
  
  static async creditCoins(
    targetUserId: number,
    amount: number,
    performedBy: number,
    notes: string
  ) {
    if (amount <= 0) throw new AppError('INVALID_AMOUNT', 'Amount must be positive', 400);
    
    return prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: targetUserId } });
      if (!user) throw new AppError('USER_NOT_FOUND', 'User not found', 404);
      
      const updatedUser = await tx.user.update({
        where: { id: targetUserId },
        data: { wallet_balance: { increment: amount } },
      });
      
      await tx.transaction.create({
        data: {
          txn_id: generateTxnId(user.user_id),
          user_id: targetUserId,
          type: 'CREDIT_IN',
          amount: amount,
          balance_before: user.wallet_balance,
          balance_after: updatedUser.wallet_balance,
          reference: `CREDIT-${performedBy}`,
          notes: notes,
        },
      });
      
      await tx.adminAction.create({
        data: {
          admin_id: performedBy,
          action_type: 'CREDIT_COINS',
          entity_type: 'USER',
          entity_id: targetUserId,
          old_value: String(user.wallet_balance),
          new_value: String(updatedUser.wallet_balance),
        },
      });
      
      // Real-time update
      emitToUser(targetUserId, 'wallet-update', {
        balance: updatedUser.wallet_balance,
      });
      
      return {
        user_id: user.user_id,
        old_balance: user.wallet_balance,
        new_balance: updatedUser.wallet_balance,
        amount_credited: amount,
      };
    });
  }
  
  static async debitCoins(
    targetUserId: number,
    amount: number,
    performedBy: number,
    notes: string
  ) {
    if (amount <= 0) throw new AppError('INVALID_AMOUNT', 'Amount must be positive', 400);
    
    return prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: targetUserId } });
      if (!user) throw new AppError('USER_NOT_FOUND', 'User not found', 404);
      
      if (user.wallet_balance < amount) {
        throw new AppError('INSUFFICIENT_BALANCE', 'User does not have enough coins', 400, {
          available: user.wallet_balance,
          requested: amount,
        });
      }
      
      const updatedUser = await tx.user.update({
        where: { id: targetUserId },
        data: { wallet_balance: { decrement: amount } },
      });
      
      await tx.transaction.create({
        data: {
          txn_id: generateTxnId(user.user_id),
          user_id: targetUserId,
          type: 'WITHDRAWAL',
          amount: amount,
          balance_before: user.wallet_balance,
          balance_after: updatedUser.wallet_balance,
          reference: `DEBIT-${performedBy}`,
          notes: notes,
        },
      });
      
      emitToUser(targetUserId, 'wallet-update', {
        balance: updatedUser.wallet_balance,
      });
      
      return {
        user_id: user.user_id,
        old_balance: user.wallet_balance,
        new_balance: updatedUser.wallet_balance,
        amount_debited: amount,
      };
    });
  }
}
```

---

## 14. WEBSOCKET ARCHITECTURE

### 14.1 Socket.io Server Setup
```typescript
// server/socket/index.ts
import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { redis } from '../lib/redis';

export function setupSocket(httpServer: any) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL,
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });
  
  // Redis adapter for multi-instance support
  const pubClient = redis.duplicate();
  const subClient = redis.duplicate();
  io.adapter(createAdapter(pubClient, subClient));
  
  // Authentication middleware
  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token;
    try {
      const decoded = verifyJWT(token);
      socket.data.user = decoded;
      next();
    } catch (err) {
      next(new Error('Authentication failed'));
    }
  });
  
  io.on('connection', (socket) => {
    const user = socket.data.user;
    
    // Join personal room
    socket.join(`user:${user.id}`);
    
    // Join role-based room
    socket.join(`role:${user.role}`);
    
    // Admin joins admin room
    if (user.role === 'admin') {
      socket.join('admin:dashboard');
      socket.join('admin:bet-stream');
    }
    
    // Subscribe to game channels
    socket.on('subscribe-game', (gameId: number) => {
      socket.join(`game:${gameId}`);
    });
    
    socket.on('unsubscribe-game', (gameId: number) => {
      socket.leave(`game:${gameId}`);
    });
    
    socket.on('disconnect', () => {
      // Cleanup
    });
  });
  
  return io;
}

// Helper functions to emit events
export function emitToUser(userId: number, event: string, data: any) {
  io.to(`user:${userId}`).emit(event, data);
}

export function emitToAdmin(event: string, data: any) {
  io.to('admin:dashboard').emit(event, data);
}

export function emitToAll(event: string, data: any) {
  io.emit(event, data);
}

export function emitToGame(gameId: number, event: string, data: any) {
  io.to(`game:${gameId}`).emit(event, data);
}
```

### 14.2 WebSocket Events Reference
| Event | Direction | Room | Data |
|-------|-----------|------|------|
| `result-declared` | Server→Client | `game:{gameId}` | Result details |
| `window-status` | Server→Client | `game:{gameId}` | Open/Closed + countdown |
| `wallet-update` | Server→Client | `user:{userId}` | New balance |
| `bet-won` | Server→Client | `user:{userId}` | Bet details, win amount |
| `bet-lost` | Server→Client | `user:{userId}` | Bet details |
| `bet-stream` | Server→Client | `admin:bet-stream` | Live bet feed |
| `dashboard-update` | Server→Client | `admin:dashboard` | Updated stats |
| `settlement-complete` | Server→Client | All | Settlement summary |
| `settlement-rolled-back` | Server→Client | All | Rollback notification |
| `announcement` | Server→Client | All | New announcement |
| `subscribe-game` | Client→Server | — | Game ID to subscribe to |
| `unsubscribe-game` | Client→Server | — | Game ID to unsubscribe from |

---

## 15. CRON JOB SYSTEM

### 15.1 Cron Jobs
```typescript
// server/cron/index.ts
import cron from 'node-cron';

export function setupCron() {
  
  // Daily reset at 2:00 AM IST (8:30 PM UTC previous day)
  cron.schedule('30 20 * * *', async () => {
    console.log('[CRON] Daily reset triggered at 2:00 AM IST');
    await DailyResetService.execute();
  }, { timezone: 'Asia/Kolkata' });
  
  // Result cleanup — delete results older than 2 days (runs at 2:05 AM IST)
  cron.schedule('35 20 * * *', async () => {
    console.log('[CRON] Result cleanup triggered');
    await ResultCleanupService.execute();
  }, { timezone: 'Asia/Kolkata' });
  
  // Auto-close expired betting windows (every minute)
  cron.schedule('* * * * *', async () => {
    await WindowAutoCloseService.execute();
  }, { timezone: 'Asia/Kolkata' });
}
```

### 15.2 Daily Reset Service
```typescript
// server/cron/dailyReset.ts
export class DailyResetService {
  static async execute() {
    // 1. Close all open betting windows from yesterday
    await prisma.bettingWindow.updateMany({
      where: { is_open: true, date: { lt: today() } },
      data: { is_open: false },
    });
    
    // 2. Create new betting windows for today's active games
    const activeGames = await prisma.game.findMany({ where: { is_active: true } });
    for (const game of activeGames) {
      await prisma.bettingWindow.create({
        data: {
          game_id: game.id,
          date: today(),
          is_open: true,
          opens_at: combineDateAndTime(today(), game.open_time),
          closes_at: combineDateAndTime(today(), game.betting_close_time),
        },
      });
    }
    
    // 3. Reset daily stat counters in Redis
    await redis.del('stats:active_users_today');
    await redis.del('stats:bets_today');
    
    // 4. Broadcast reset event
    emitToAll('daily-reset', { date: today() });
  }
}
```

---

## 16. CACHING STRATEGY (REDIS)

### 16.1 Cache Keys
```
GAME STATUS:
├── cache:games:active              → List of active games with status (TTL: 60s)
├── cache:game:{id}:status          → Single game current status (TTL: 30s)
├── cache:game:{id}:multipliers     → Payout multipliers for game (TTL: 300s)

BETTING WINDOWS:
├── cache:windows:open              → Currently open windows (TTL: 30s)
├── cache:window:{gameId}:{date}    → Specific window status (TTL: 15s)

DASHBOARD:
├── cache:dashboard:stats           → Pre-computed dashboard data (TTL: 10s)
├── cache:dashboard:pnl:7day        → 7-day P/L chart data (TTL: 60s)

USER:
├── cache:user:{id}:balance         → Wallet balance (TTL: 10s)

RATE LIMITING:
├── ratelimit:{ip}:{endpoint}       → Request counter (TTL: 60s sliding window)

SESSION:
├── blacklist:token:{jti}           → Logged-out token (TTL: JWT expiry time)
```

### 16.2 Cache Invalidation Rules
```
Game settings changed     → Invalidate cache:games:*, cache:game:{id}:*
Result declared          → Invalidate cache:dashboard:*, cache:game:{id}:status
Bet placed               → Invalidate cache:user:{id}:balance, cache:dashboard:stats
Wallet changed           → Invalidate cache:user:{id}:balance
Window opened/closed     → Invalidate cache:windows:*, cache:window:{gameId}:*
Multiplier changed       → Invalidate cache:game:{id}:multipliers
```

---

## 17. DATABASE CONNECTION & TRANSACTION PATTERNS

### 17.1 Prisma Client Singleton
```typescript
// server/lib/prisma.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'error', 'warn'] 
    : ['error'],
  datasources: {
    db: { url: process.env.DATABASE_URL },
  },
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

### 17.2 Transaction Patterns
```typescript
// PATTERN 1: Sequential transaction (default)
// Use when operations depend on each other
await prisma.$transaction(async (tx) => {
  const user = await tx.user.findUnique(...);     // Step 1
  await tx.user.update(...);                       // Step 2
  await tx.transaction.create(...);                // Step 3
}); // All 3 succeed or all 3 rollback

// PATTERN 2: Batch transaction
// Use when operations are independent
await prisma.$transaction([
  prisma.bet.updateMany({ where: { ... }, data: { status: 'lost' } }),
  prisma.result.create({ data: { ... } }),
]);

// PATTERN 3: Interactive transaction with timeout
// Use for long-running settlements
await prisma.$transaction(async (tx) => {
  // ... complex settlement logic
}, {
  maxWait: 10000,    // 10s max wait to acquire lock
  timeout: 30000,    // 30s max execution time
  isolationLevel: 'Serializable', // Highest isolation for financial ops
});
```

---

## 18. VALIDATION LAYER (ZOD SCHEMAS)

### 18.1 Key Validation Schemas
```typescript
// server/validators/bet.schema.ts
export const placeBetSchema = z.object({
  game_id: z.number().int().positive(),
  bet_type: z.enum(['SINGLE_AKDA', 'SINGLE_PATTI', 'DOUBLE_PATTI', 'TRIPLE_PATTI', 'JODI']),
  bet_number: z.string().min(1).max(3).regex(/^[0-9]+$/),
  bet_amount: z.number().int().min(10),
});

// server/validators/result.schema.ts
export const declareResultSchema = z.object({
  game_id: z.number().int().positive(),
  session: z.enum(['OPEN', 'CLOSE']),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  panna: z.string().length(3).regex(/^[0-9]{3}$/),
});

// server/validators/wallet.schema.ts
export const walletOperationSchema = z.object({
  user_id: z.number().int().positive(),
  amount: z.number().int().min(1),
  type: z.enum(['CREDIT', 'DEBIT']),
  notes: z.string().max(500).optional(),
});

// server/validators/leader.schema.ts
export const createAccountSchema = z.object({
  name: z.string().min(2).max(100),
  role: z.enum(['supermaster', 'master', 'user']),
  password: z.string().min(6).max(100),
  deal_percentage: z.number().min(0).max(100),
  credit_limit: z.number().int().min(0),
  fix_limit: z.number().int().min(0),
  is_special: z.boolean().default(false),
});

// server/validators/auth.schema.ts
export const loginSchema = z.object({
  user_id: z.string().min(1).max(50),
  password: z.string().min(1).max(100),
});
```

---

## 19. LOGGING & MONITORING

### 19.1 Logging Strategy (Pino)
```
LOG LEVELS:
├── fatal  → Application crash, database connection lost
├── error  → Failed transactions, settlement errors, unhandled exceptions
├── warn   → Insufficient balance attempts, rate limit hits, suspicious activity
├── info   → Result declared, settlement complete, user created, rollback
├── debug  → API requests, database queries (development only)
└── trace  → Detailed flow (development only)

STRUCTURED LOG FORMAT:
{
  level: 'info',
  time: 1707400000,
  msg: 'Settlement complete',
  gameId: 5,
  date: '2026-02-08',
  winnersCount: 45,
  totalPayout: 456789,
  duration: 2341  // milliseconds
}
```

### 19.2 Sentry Integration
```typescript
// server/lib/sentry.ts
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,  // 10% of transactions
});

// Use in error handler:
app.setErrorHandler((error, request, reply) => {
  if (error.statusCode >= 500) {
    Sentry.captureException(error);
  }
  // ... standard error handling
});
```

---

## 20. SECURITY ARCHITECTURE

### 20.1 Security Layers
```
Layer 1: CloudFront (DDoS Protection, SSL Termination)
Layer 2: Nginx (Reverse Proxy, Request Size Limits)
Layer 3: Fastify Rate Limiting (Per IP, Per Endpoint)
Layer 4: Helmet (Security Headers: CSP, XSS, etc.)
Layer 5: JWT Authentication (On every request)
Layer 6: Role-Based Access Control (Per endpoint)
Layer 7: Hierarchy Scoping (Per query)
Layer 8: Zod Validation (All inputs)
Layer 9: Prisma (SQL Injection Prevention)
Layer 10: Audit Trail (Every admin action logged)
```

### 20.2 Security Headers (Helmet)
```typescript
app.register(helmet, {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "fonts.googleapis.com"],
      fontSrc: ["'self'", "fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "*.amazonaws.com"],
      connectSrc: ["'self'", "wss:"],
    },
  },
  crossOriginEmbedderPolicy: false,
});
```

---

## 21. FRONTEND ARCHITECTURE

### 21.1 Next.js App Router Structure
```
src/app/
├── layout.tsx              → Root layout (fonts, providers)
├── (auth)/
│   └── login/
│       └── page.tsx        → Login page (all roles)
├── (user)/
│   ├── layout.tsx          → User layout (header, bottom nav)
│   ├── page.tsx            → Home (results feed)
│   ├── bet/page.tsx        → Betting page
│   ├── charts/
│   │   ├── page.tsx        → Game selection
│   │   └── [gameId]/page.tsx → Chart for specific game
│   └── profile/
│       ├── page.tsx        → Profile overview
│       ├── statement/page.tsx
│       ├── ledger/page.tsx
│       ├── bet-history/page.tsx
│       ├── rules/page.tsx
│       └── change-password/page.tsx
├── admin/
│   ├── layout.tsx          → Admin layout (sidebar + header)
│   ├── dashboard/page.tsx
│   ├── leaders/
│   │   ├── supermasters/page.tsx
│   │   ├── masters/page.tsx
│   │   ├── users/page.tsx
│   │   ├── special/page.tsx
│   │   └── [id]/page.tsx   → Member detail
│   ├── manage-game/
│   │   ├── page.tsx        → Game list
│   │   ├── add/page.tsx
│   │   ├── declare/page.tsx
│   │   └── [id]/page.tsx   → Edit game
│   ├── client/
│   │   ├── page.tsx        → Account list
│   │   ├── create/page.tsx
│   │   └── [id]/page.tsx   → Account detail + history
│   ├── settlement/
│   │   └── rollback/page.tsx
│   ├── content/
│   │   ├── announcements/page.tsx
│   │   ├── banners/page.tsx
│   │   ├── rules/page.tsx
│   │   └── whatsapp/page.tsx
│   └── settings/
│       ├── password/page.tsx
│       ├── backup/page.tsx
│       ├── block-bets/page.tsx
│       └── block-ids/page.tsx
├── supermaster/
│   ├── layout.tsx
│   └── ... (subset of admin pages)
└── master/
    ├── layout.tsx
    └── ... (subset of supermaster pages)
```

---

## 22. STATE MANAGEMENT (ZUSTAND)

### 22.1 Store Structure
```typescript
// src/store/authStore.ts
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (userId: string, password: string) => Promise<void>;
  logout: () => void;
  setToken: (token: string) => void;
}

// src/store/gameStore.ts
interface GameState {
  games: Game[];
  activeWindows: BettingWindow[];
  todayResults: Result[];
  setGames: (games: Game[]) => void;
  addResult: (result: Result) => void;
  updateWindow: (window: BettingWindow) => void;
}

// src/store/walletStore.ts
interface WalletState {
  balance: number;
  usedLimit: number;
  setBalance: (balance: number) => void;
  setUsedLimit: (limit: number) => void;
}
```

---

## 23. API CLIENT LAYER

### 23.1 Fetch Wrapper
```typescript
// src/lib/api.ts
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = useAuthStore.getState().token;
  
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  
  const data = await response.json();
  
  if (!data.success) {
    throw new ApiError(data.error.code, data.error.message, response.status);
  }
  
  return data;
}

// Usage:
const result = await apiClient<BetResponse>('/bets/place', {
  method: 'POST',
  body: JSON.stringify({ game_id: 1, bet_type: 'JODI', bet_number: '45', bet_amount: 500 }),
});
```

---

## 24. FILE UPLOAD & STORAGE (S3)

### 24.1 Banner Upload Flow
```
Admin uploads banner image
    → Fastify receives multipart/form-data
    → Validate: file type (jpg, png, webp), size (< 5MB)
    → Upload to S3 bucket: matka-banners/{timestamp}-{filename}
    → Save S3 URL to database (banners table)
    → Return URL to frontend

DB Backup Flow:
    → Admin clicks "Backup Now"
    → Server runs: pg_dump to generate SQL file
    → Upload to S3: matka-backups/{date}-backup.sql.gz
    → Save backup record to database
    → Return success
```

---

## 25. DEPLOYMENT ARCHITECTURE

### 25.1 Production Setup
```
EC2 Instance (t3.medium):
├── Nginx (reverse proxy, SSL, static files)
│   ├── Port 80 → Redirect to 443
│   ├── Port 443 (SSL) → Proxy to:
│   │   ├── / → Next.js (Port 3000) — Frontend
│   │   ├── /api/* → Fastify (Port 3001) — Backend API
│   │   └── /socket.io/* → Fastify (Port 3001) — WebSocket
│
├── PM2 Process Manager:
│   ├── Process 1: Next.js (PORT=3000)
│   └── Process 2: Fastify Server (PORT=3001)
│
├── Docker (optional for local dev):
│   ├── postgres:16 (Port 5432)
│   └── redis:7 (Port 6379)
│
└── Production DB/Cache:
    ├── RDS PostgreSQL (managed, external)
    └── ElastiCache Redis (managed, external)
```

### 25.2 Nginx Configuration
```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;
    
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    # Frontend (Next.js)
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
    }
    
    # Backend API (Fastify)
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    # WebSocket (Socket.io)
    location /socket.io/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
    }
}
```

---

## 26. PERFORMANCE OPTIMIZATION

### 26.1 Database Indexes (Critical)
```sql
-- These indexes are ESSENTIAL for performance at 20K users
CREATE INDEX idx_bets_game_date_status ON bets(game_id, date, status);
CREATE INDEX idx_bets_user_date ON bets(user_id, date DESC);
CREATE INDEX idx_transactions_user_date ON transactions(user_id, created_at DESC);
CREATE INDEX idx_users_created_by ON users(created_by);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_results_game_date ON results(game_id, date DESC);
CREATE INDEX idx_betting_windows_open ON betting_windows(is_open, closes_at) WHERE is_open = true;
CREATE INDEX idx_member_pnl_user_date ON member_pnl(user_id, date, game_id);
```

### 26.2 Query Optimization
```
Rule 1: Always use pagination (never return all records)
Rule 2: Select only needed fields (Prisma select/include)
Rule 3: Use partial indexes for frequently filtered columns
Rule 4: Cache hot data in Redis (game status, dashboard stats)
Rule 5: Use database transactions with appropriate isolation levels
Rule 6: Batch operations where possible (settle multiple bets in one transaction)
```

---

## 27. CONFIGURATION MANAGEMENT

### 27.1 Environment Variables (.env)
```bash
# App
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://yourdomain.com

# Database
DATABASE_URL=postgresql://user:pass@rds-host:5432/matka_db

# Redis
REDIS_URL=redis://elasticache-host:6379

# JWT
JWT_SECRET=<64-character-random-string>
JWT_EXPIRY=24h

# Admin (HARDCODED — Developer only)
ADMIN_ID=ADMIN001
ADMIN_PASSWORD_HASH=$argon2id$v=19$m=65536,t=3,p=4$<hash>

# AWS
AWS_REGION=ap-south-1
AWS_S3_BUCKET=matka-platform
AWS_ACCESS_KEY_ID=<key>
AWS_SECRET_ACCESS_KEY=<secret>

# Sentry
SENTRY_DSN=https://<key>@sentry.io/<project>

# Rate Limiting
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=60000
```

---

## 28. CODING STANDARDS & CONVENTIONS

### 28.1 Naming Conventions
```
Files:          camelCase.ts (authMiddleware.ts, bet.service.ts)
Components:     PascalCase.tsx (DashboardStatCard.tsx, GameResultCard.tsx)
Variables:      camelCase (walletBalance, betAmount)
Constants:      UPPER_SNAKE_CASE (PAYOUT_MULTIPLIERS, MAX_BET_AMOUNT)
Database:       snake_case (wallet_balance, bet_amount, created_at)
API Endpoints:  kebab-case (/api/admin/manage-game, /api/bets/my-bets)
CSS Variables:  kebab-case (--color-primary, --shadow-card)
Types/Interfaces: PascalCase (User, BetPlacement, GameResult)
Enums:          UPPER_SNAKE_CASE values (SINGLE_AKDA, BET_PLACED)
```

### 28.2 Code Organization Rules
```
1. One export per file (services, routes, components)
2. Imports ordered: external libs → internal modules → types → styles
3. No inline styles on frontend (use Tailwind classes only)
4. No magic numbers (use named constants)
5. No console.log in production (use Pino logger)
6. All async functions must have try-catch or error propagation
7. All financial calculations use integer math (no parseFloat, no toFixed)
8. All dates/times in IST (Asia/Kolkata timezone)
9. Comments only for WHY, not WHAT (code should be self-documenting)
10. Maximum function length: 50 lines (break into smaller functions)
```

---

## DOCUMENT VERSION HISTORY

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Feb 2026 | Initial comprehensive System Design |

---

**END OF SYSTEM DESIGN DOCUMENT — This document serves as the complete technical blueprint for building the Matka Betting Platform.**
