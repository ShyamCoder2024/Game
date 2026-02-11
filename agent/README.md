# MATKA PLATFORM — Agent Brain
## Last Updated: February 2026 — Phase 1 Complete

## Project Summary
Real-time Matka betting platform with hierarchical admin system.
- **Admin** → creates Super Masters (deal %)
- **Super Master** → creates Masters (deal %)
- **Master** → creates Users (fix limits)
- **Users** → place bets on Matka games

## Documentation Map
| File | Purpose |
|---|---|
| `PROJECT_OVERVIEW.md` | Architecture, tech stack, folder structure, build phases |
| `DATA_MODEL.md` | All 19 tables, Prisma schema, seed data |
| `DRD.md` | Design system, page layouts, component specs |
| `REAL_TIME.md` | Socket.io events, channels, connection strategy |
| `SETTLEMENT.md` | Result declaration, bet settlement, rollback engine |
| `TESTING.md` | Test strategy, edge cases, load testing |

## Current Phase
Phase 2: Authentication & Middleware

## Build Status
### ✅ Completed
- Documentation: All 6 agent/ documents created
- **Phase 1: Project Setup** — COMPLETE
  - Next.js 14 + TypeScript + App Router initialized
  - All dependencies installed (Fastify, Prisma, Socket.io, Argon2, JWT, Zustand, Recharts, etc.)
  - Docker Compose (PostgreSQL 16 + Redis 7)
  - Complete folder structure (server/, src/app/, src/components/, etc.)
  - Prisma schema: 19 tables, all enums, indexes, relationships
  - Prisma client generated successfully
  - Seed script: 11 games, 5 global multipliers, 8 app settings
  - Fastify server entry point with CORS, Helmet, health check, global error handler
  - AppError class with 50+ error codes
  - Server utilities: formatters (Indian currency ₹, IST dates), Matka math (panna/single/jodi), ID generators
  - Redis client singleton
  - Response helpers (sendSuccess/sendError)
  - Frontend: API client, Zustand auth store, constants, cn() utility
  - Tailwind theme: panel colors, game colors, Inter font, card shadows, animations
  - Global CSS: scrollbar, badge utilities, grand-total-row
  - shadcn/ui config (components.json)
  - .env + .env.example + .gitignore

### 🔄 In Progress
- Nothing yet — Phase 2 next

### ⏳ Not Started
- Phase 2: Auth system (JWT + Argon2), middleware (auth, role, validation)
- Phase 3: Admin panel (game CRUD, user management, wallet operations)
- Phase 4: Betting engine (windows, bet placement, exposure tracking)
- Phase 5: Results + Settlement engine
- Phase 6: Reports + P&L
- Phase 7: Real-time (Socket.io)
- Phase 8: User panel
- Phase 9: Content management
- Phase 10: Polish + Deploy

## Key Decisions
- Integer math ONLY (1 Coin = 1 Rupee) — no floats for money
- Admin credentials from .env (not DB)
- Payout multiplier snapshot at bet time
- IST timezone everywhere
- Indian number formatting (₹12,34,567)
- Grand total row on all data tables

## Database State
- **Schema:** 19 tables defined in Prisma, client generated
- **Migration:** Pending — needs Docker (PostgreSQL) running first
- **Seed:** Script ready (11 games, 5 multipliers, 8 settings)
- **Tables:** users, games, payout_multipliers, betting_windows, bets, results, transactions, member_pnl, settlements, settlement_entries, credit_loans, announcements, banners, rules_content, app_settings, admin_actions, login_logs, db_backups, blocked_bets

## API Status
| Endpoint | Status |
|---|---|
| `GET /api/health` | ✅ Built |

## WebSocket Events
None yet — Phase 7

## Next Steps
1. **Start Docker Desktop** → `npm run docker:up`
2. **Run migration** → `npm run db:migrate` (name: init)
3. **Seed database** → `npm run db:seed`
4. **Test server** → `npm run dev:server` → hit `/api/health`
5. Begin Phase 2: Auth system (JWT + Argon2 + middleware)

## Important Reminders
- NEVER use `console.log` in production — use Pino logger
- ALL errors must be `throw new AppError(code)`
- ALL wallet operations must be atomic (Prisma transactions)
- ALL queries must be scoped to user's downline
- ALL tables support soft delete (is_deleted flag)
- ALWAYS snapshot payout multiplier at bet time
- Fastify pattern: Route → Middleware → Service → Prisma → Response
