# Frontend Audit Report
This document provides a comprehensive, file-by-file functional audit of the Next.js frontend architecture.

## 1. App Routing & Layouts (`src/app/`)
The frontend uses the Next.js App Router paradigm, explicitly wrapping paths with server/client rendering boundary definitions.

- **`src/app/layout.tsx`**: Root layout importing global CSS (`globals.css`), fonts, and injecting providers (Toast, Auth context).
- **`src/app/admin/layout.tsx` / `src/app/user/ClientLayout.tsx`**: Layout wrappers providing specialized sidebars, navigation headers, and responsive mobile-first wrappers depending on the authenticated role map.

## 2. API & Network Clients (`src/lib/` & `src/hooks/`)
- **`src/lib/api.ts`**: A singleton `fetch` wrapper. Automatically intercepts requests to inject `Authorization: Bearer <token>`, standardizes `Content-Type: application/json`, and normalizes HTTP errors into a standardized `{ success, data, error }` object interface.
- **`src/lib/socket.ts`**: Singleton Socket.io instantiation. Retrieves the global socket instance or connects via `transports: ['websocket', 'polling']` to bypass strict proxying environments.
- **`src/hooks/useSocket.ts`**: Ties component lifecycles to the socket connection. Subscribes effectively to `WS_EVENTS.WALLET_UPDATE`, `WS_EVENTS.RESULT_DECLARED`, and `WS_EVENTS.BET_STREAM`. Unmounts subscriptions correctly via `useEffect` returns to prevent duplicate firing bugs.

## 3. State Management (`src/store/`)
Zustand is used for rapid, un-opinionated state slicing isolated from React overhead.
- **`authStore.ts`**: Holds JWT user states, role details, and `isAuthenticated` boolean flags globally.
- **`socketStore.ts`**: Houses reactive live balance integers, notification unread counts, and last declared payload values updated passively by `useSocket.ts`.
- **`toastStore.ts`**: Manages the ephemeral Toast notification array logic.

## 4. Admin Panel (`src/app/admin/`)
The administrative dashboard is constructed cleanly using `Page.tsx` components.

- **`games/page.tsx`**: Renders the game list table. *(Audit Finding: The Add Game modal contains corrupted payload mappings omitting crucial time parameters required by the backend).*
- **`results/page.tsx`**: Connects heavily to the `liveReport` API. Presents liabilities mapping active bets before admins explicitly trigger closures.
- **`clients/page.tsx`**: Table fetching downward hierarchies using robust pagination. Includes inline editing and blocking/unblocking UI integrations.
- **`content/page.tsx`**: Carousel and announcement managers. Modals exist for pushing platform rules and sending push notification structures globally.
- **`settings/page.tsx`**: Password management mappings for individual leaders and system-wide default overrides. Global multiplier inputs directly replace fallback configurations.
- **`leaders/*`**: Folders specifically segmented for viewing the master limits (`agent_matka_share` vs `my_matka_share`).

## 5. User Platform (`src/app/user/`)
Built specifically as a mobile-first Progressive Web App (PWA) look and feel interface using framer motion to enhance UX mapping.

- **`page.tsx` (Home)**: Aggregates active games into `GameResultCard` UI components. Renders the Announcement Marquee explicitly connected to websockets for live banner updating. Detects `is_holiday` to gray out specific markets.
- **`bet/page.tsx`**: The core interactive wager file. 
  - *Time Logic:* Utilizes local JS intervals mapping to target close times via `getISTTime()` calculations. 
  - *Data Mapping:* Relies on a hardcoded map of constants (`BET_TYPES: SINGLE_AKDA, JODI, SP, DP, TP`) setting max lengths and fallback multipliers (e.g. 9.5x for Single Akda). 
  - *Bug Trigger:* Connects `Session (OPEN/CLOSE)` against the `amount` against the user's explicit limits enforced by the responsive `useSocketStore()` payload limits globally.
- **`profile/ledger/page.tsx`**: Renders localized transaction histories pulling from wallet actions natively displaying mapping of bet type impacts against previous credit additions.
- **`charts/page.tsx`**: Assumed mapping file tracing historic results declared dynamically per requested game slug.

## 6. Reusable Components (`src/components/`)
Modular elements structured via atomic design layouts.
- **`admin/Sidebar.tsx`**: The robust collapsable active navigation context handling master/admin role views dynamically based on URLs mapping.
- **`leaders/CreateAccountDialog.tsx` & `CoinTransferDialog.tsx`**: Highly controlled modular forms capturing inputs, mutating API states, and reporting closure callbacks up to parent interfaces (preventing prop-drilling).
- **`user/GameResultCard.tsx` / `BannerCarousel.tsx`**: Swiper implementations rendering visual displays mapped purely dynamically without tracking heavy component states.
- **`shared/DataTable.tsx`**: Centralized mapping table for all administration layers handling infinite limits and native search bar query updates logically.

## 7. Frontend Summary & Fix Recommendations
The frontend UI strictly follows the required styling and UX paradigms. The data mapping architecture allows for immense responsiveness but suffers from:
1. **Implicit Local Constants vs API Definitions** (Frontend dictating time offsets instead of centralizing time configurations on request loops).
2. **Payload Type Mismatches** (Particularly in Form Modals in `admin/games/` deviating from the rigorous Zod structures enforced downstream).
