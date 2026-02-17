# ADMIN PANEL — FIXES, MISSING FEATURES & LOGIC IMPROVEMENTS

**Document Version:** 1.0
**Created:** 17 February 2026
**Purpose:** Complete list of all admin panel work remaining. Split into two sections for parallel development.

**IMPORTANT FOR AI AGENTS:** Read this document carefully. Work on items ONE AT A TIME in the order listed. After completing each item, report what you changed and wait for review before continuing. Do NOT skip items. Do NOT modify backend services that are not mentioned in the specific item you are working on.

---

## DEFAULT RATES (REFERENCE — USED ACROSS MULTIPLE ITEMS)

These are the default payout rates for the platform. Reference these whenever rates are mentioned:

```
Bet Type         | Bet Amount | Win Amount | Multiplier
-----------------+------------+------------+-----------
Single Akda      | 10 coins   | 100 coins  | 10x
Single Patti     | 10 coins   | 1600 coins | 160x
Double Patti     | 10 coins   | 3200 coins | 320x
Triple Patti     | 10 coins   | 7000 coins | 700x
Jodi             | 10 coins   | 1000 coins | 100x
```

Minimum bet amount: 5 coins
1 coin = 1 rupee (integer math only, no decimals)

---

## SECTION A — EXISTING FEATURES THAT ARE BROKEN (FIX THESE FIRST)

These features exist in the codebase but do not work correctly. Fix them without rewriting entire files. Be surgical — find the bug, fix only that.

---

### A1. Account Creation — Token Error (CRITICAL)

**Page:** Admin Panel → Leaders → Super Masters / Masters / Users → "Create" button
**Current behavior:** When admin tries to create any member account (Super Master, Master, or User), it shows "Invalid or expired token" error.
**Expected behavior:** Admin should be able to create accounts successfully.

**How to fix:**
1. Open the Create Account dialog component (check src/components/ for CreateAccountDialog or similar)
2. Find the API call that creates the account (POST to /api/leaders or /api/leaders/create or similar)
3. Check if the Authorization header with JWT token is being sent
4. Compare with a WORKING API call (like the dashboard data fetch) to see how auth headers are set
5. The issue is likely: the apiClient from src/lib/api.ts handles auth automatically, but the dialog might be using raw fetch() without the token
6. Fix: Use the apiClient for the create account call, or manually add the auth header

**Test:** After fix, create a Super Master account. It should appear in the Leaders table.

---

### A2. Game Creation — Form Disappears (CRITICAL)

**Page:** Admin Panel → Games → "Add Game" button
**Current behavior:** The add game form appears, admin fills in details, clicks "Add Game" — the form/modal disappears instantly and no game is added.
**Expected behavior:** Game should be created and appear in the games list.

**How to fix:**
1. Open the Games page (src/app/admin/games/page.tsx)
2. Find the form submission handler
3. Check if the API call is actually being made (add console.log if needed)
4. The issue is likely: form state is being reset before the API call completes, OR the API call is failing silently (no error handling), OR the modal closes on any click
5. Check the submit handler: it should await the API call, show success/error toast, THEN close the modal only on success
6. Fix the flow: submit → show loading → await API → on success: close modal + refresh list + show toast → on error: keep modal open + show error toast

**Test:** Create a game called "Test Game" with open time 10:00 AM and close time 12:00 PM. It should appear in the games list.

---

### A3. Client Section — Cannot Add Client (HIGH)

**Page:** Admin Panel → Clients → "Add Client" button
**Current behavior:** Button exists but nothing happens or it errors.
**Expected behavior:** Admin should be able to add clients (credit/debit coins to existing members).

**How to fix:**
1. Open the Clients page (src/app/admin/clients/page.tsx)
2. Check what "Add Client" is supposed to do — it likely should open a dialog to select a member and credit/debit coins
3. Check if the API endpoint for wallet operations exists (look in server/routes/ for wallet routes)
4. Fix the button handler and connect it to the correct API

**Note:** This page will be redesigned in Section B (item B4) with the full client table. For now, just make the basic credit/debit functionality work.

---

### A4. Settlement — Missing Rollback Button (HIGH)

**Page:** Admin Panel → Settlement
**Current behavior:** Settlement page shows data but has no rollback button or toggle.
**Expected behavior:** Each settled result should have a "Rollback" button. Clicking it shows a confirmation popup, then reverses the settlement.

**How to fix:**
1. Open src/app/admin/settlement/page.tsx
2. Check what API endpoints it calls — compare with the actual backend routes in server/routes/settlement.routes.ts
3. The rollback endpoint EXISTS in the backend (rollback.service.ts) — the frontend just needs to call it
4. Add a "Rollback" button (red color) to each row that has status "settled"
5. On click: show ConfirmDialog "Are you sure you want to rollback? This will reverse all settlements and refund bets."
6. On confirm: call the rollback endpoint (check exact path from settlement.routes.ts)
7. On success: refresh the table + show success toast

**IMPORTANT:** Also check if the API paths in the frontend match the actual backend routes. Previous audit found a mismatch — frontend might call /api/admin/settlements but backend has /api/admin/settlement/rollback-list. Fix ALL path mismatches.

**Test:** After declaring a result and settlement runs, the rollback button should appear. Clicking it should reverse everything.

---

### A5. Content Section — Announcements and Rules Not Working (HIGH)

**Page:** Admin Panel → Content
**Current behavior:** Has "Add Announcement" and "Platform Rules" options but neither works. Banner feature is missing entirely.
**Expected behavior:** Admin can create/edit/delete announcements, edit platform rules, and manage banners.

**How to fix:**

ANNOUNCEMENTS:
1. Open the Content page (src/app/admin/content/page.tsx)
2. Find the announcement form/dialog
3. Check the API call — it should POST to /api/admin/announcements or similar (check server/routes/)
4. Fix any broken API calls, missing auth headers, or form submission issues
5. Announcements should have: title, message, starts_at datetime, ends_at datetime
6. After creation, announcement should appear in the user page marquee

PLATFORM RULES:
1. Find the rules editor
2. Should call GET to fetch existing rules, PUT to update
3. Fix any broken API calls
4. Rules content appears on the user profile → Rules page

BANNERS (ADD THIS):
1. Add a "Manage Banners" section to the Content page
2. Admin uploads banner images (16:9 ratio recommended)
3. Banners should have: image URL, title (optional), display order, active status
4. Use an image URL input (not file upload — for simplicity)
5. Banners appear in the user home page carousel
6. Admin can add, reorder, and delete banners
7. Check if there is a Banner model in prisma/schema.prisma and corresponding routes

**Test:** Create an announcement → check user page marquee. Upload a banner → check user page carousel.

---

### A6. Settings — Password Change Logic is Wrong (HIGH)

**Page:** Admin Panel → Settings → Change Password
**Current behavior:** Tries to change admin's own password which is wrong. Admin password is managed by developers only.
**Expected behavior:** Admin enters a User ID and a new password → that member's password gets changed. Works for any member (Super Master, Master, User).

**How to fix:**
1. Open the Settings page or Change Password component
2. Remove the "current password" / "old password" field entirely
3. Replace the form with:
   - Input: "User ID" (text field where admin types the member's ID like SM001, MA001, US001)
   - Input: "New Password" (password field)
   - Input: "Confirm New Password" (password field, must match)
   - Button: "Change Password"
4. On submit: validate that passwords match, then call the password change endpoint
5. Check server/routes/ for the correct endpoint (likely PUT /api/leaders/:id/password or similar)
6. The endpoint should accept userId and newPassword — admin doesn't need to know the old password

**Test:** Change the password for user US001 to "newpass123". Then logout and login as US001 with the new password.

---

### A7. Settings — Block/Unblock Enhancement (MEDIUM)

**Page:** Admin Panel → Settings → Block/Unblock Users
**Current behavior:** Only has basic block/unblock for user IDs. Missing block bet functionality.
**Expected behavior:** Two separate functions:
1. **Block/Unblock ID** — Completely blocks the member's account (can't login)
2. **Block/Unblock Bet** — Member can still login but cannot place any bets

**How to fix:**
1. Open the Block/Unblock section in Settings
2. Redesign the form to have:
   - Input: "User ID" (enter member ID)
   - Two buttons: "Block ID" (red) and "Block Bet" (orange)
   - Current status display: show if the member is Active/ID Blocked/Bet Blocked
   - Unblock buttons for each type
3. For Block ID: call the existing block endpoint (check leader routes — PATCH /api/leaders/:id/block)
4. For Block Bet: 
   - Check if the User model in prisma/schema.prisma has a field like is_bet_blocked or bet_blocked
   - If YES: create/use the endpoint to toggle it
   - If NO: you need to add this field. Add it to the Prisma schema, create a migration, and add a new endpoint
   - When bet is blocked, the bet placement service should check this field and reject bets

**Access control:**
- Admin can block/unblock anyone (Super Master, Master, User)
- Super Master can only block/unblock Masters and Users in their downline
- Master can only block/unblock Users in their downline
- This should already be handled by the hierarchy middleware

**Test:** Block bet for US001 → login as US001 → try to place a bet → should get "Your betting is blocked" error.

---

### A8. Dashboard — Verify Real Data (MEDIUM)

**Page:** Admin Panel → Dashboard
**Current behavior:** Shows stat cards and charts but need to verify they show real data from the database.
**Expected behavior:** All dashboard numbers should reflect actual database data.

**How to fix:**
1. Open the dashboard page and the dashboard service (server/services/dashboard.service.ts)
2. Verify that:
   - "Total Bets Today" counts today's bets from the Bet table
   - "Total Volume" sums today's bet amounts
   - "Net P/L Today" calculates today's profit/loss
   - "Active Users" counts users with is_active = true
   - P/L chart shows real 7-day data
   - Recent Bets table shows actual recent bets
3. If any stat is hardcoded or returns dummy data, fix it to query real data
4. If the dashboard service functions are correct, the issue might be in the frontend — check that API responses are being displayed properly

**Test:** Create some test accounts, place bets, declare results — dashboard numbers should update accordingly.

---

### A9. Account Creation — Form Redesign (HIGH — COMPLEX)

**Page:** All panels where accounts are created (Admin, Super Master, Master)
**Current form has:** Role, Name, Password, Deal Percentage
**New form must have:**

1. **User ID** — Auto-generated, unique, format examples: SM001, SM002, MA001, MA002, US001, US002
   - Prefix: SM for Super Master, MA for Master, US for User
   - Number: Auto-increment based on existing accounts of that type
   - Display the generated ID to admin (read-only field) before they submit
   - User ID must be stored in the database and used for login

2. **Display Name** — Text field (this is the name but only visible to admin/leaders, not to users on the user page)

3. **Password** — Set initial password

4. **Deal Percentage** — Existing field, keep it

5. **Custom Rates (OPTIONAL — 5 fields):**
   - Single Akda rate (default: 10x)
   - Single Patti rate (default: 160x)
   - Double Patti rate (default: 320x)
   - Triple Patti rate (default: 700x)
   - Jodi rate (default: 100x)
   - These fields are NOT mandatory. If left empty, use default rates.
   - If admin enters ANY custom rate that differs from default, this member is classified as "Special Master"
   - Store custom rates in the database (check if PayoutMultiplier table supports per-user rates, if not, add a field to User model or create a user_rates table)

6. **Initial Coin Credit (OPTIONAL):**
   - Amount field: "Credit coins to this account"
   - If admin enters an amount, coins are credited to the new member's wallet immediately after account creation
   - This should happen in the same transaction as account creation (or immediately after)
   - If left empty (0), account is created with 0 balance

**Backend changes needed:**
- Update the create account endpoint to accept new fields (userId auto-generation, custom rates, initial credit)
- Auto-generate userId: query the latest ID for that role prefix, increment the number
- If custom rates are provided and differ from default, mark the user as special (add a field like is_special: true to User model if it doesn't exist)
- If initial credit amount is provided, credit the wallet after account creation

**Frontend changes:**
- Update CreateAccountDialog to show all new fields
- Show the auto-generated User ID as a read-only preview
- Custom rate fields should have placeholder text showing the default value
- Add a "Credit Coins" input at the bottom with ₹ prefix

**Test:** Create a Super Master with custom Single Akda rate of 8x (instead of default 10x). Verify:
- The account is created with auto-generated ID like SM003
- The custom rate is saved
- The member appears in the "Special Masters" section
- If initial coins were added, the balance shows correctly

---

### A10. Admin Coin Management — Credit/Debit in Admin Panel (HIGH)

**Page:** Admin Panel — needs to be accessible from Leaders section and Clients section
**Current behavior:** Admin cannot credit or debit coins from the admin panel.
**Expected behavior:** Admin can credit (add) and debit (withdraw) coins to/from any member.

**How to fix:**
1. In the Leaders tables (Super Masters, Masters, Users), add action buttons "D" (Deposit) and "W" (Withdraw) for each member row
2. Clicking D or W opens the CoinTransferDialog (check if this component exists in components/)
3. The dialog should show: Member ID, Member Name, Current Balance, Amount input, Notes input
4. On submit: call the wallet credit/debit endpoint (check server/routes/wallet.routes.ts)
5. After success: refresh the table to show updated balance

Also ensure this works in the Clients section (will be fully redesigned in Section B item B4).

**Test:** Credit 10,000 coins to SM001. Check that SM001's balance shows ₹10,000 in the leaders table and when logging in as SM001.

---

### A11. Result Declaration — Single Session Only (MEDIUM)

**Page:** Admin Panel → Results (already redesigned with live report)
**Current behavior:** May allow declaring both Open and Close at once.
**Expected behavior:** Only ONE session (Open OR Close) can be declared at a time. The dropdown should show "OPEN" and "CLOSE" as separate options. Admin declares Open result first, then later declares Close result separately.

**How to fix:**
1. The Results page was just rebuilt with separate OPEN/CLOSE dropdown — verify this works correctly
2. Ensure the backend declareResult endpoint accepts only one session at a time
3. If OPEN is already declared for a game today, the OPEN option should show "Already Declared" or be disabled
4. If both OPEN and CLOSE are declared, the Jodi is auto-calculated (OPEN single + CLOSE single)

**Test:** Declare OPEN result for SRIDEVI → verify only OPEN is marked as declared. Then declare CLOSE → verify Jodi is calculated.

---

### A12. Special Masters Dropdown (LOW)

**Page:** Admin Panel → Leaders → Special Masters
**Current behavior:** Shows a flat list.
**Expected behavior:** Add a dropdown filter above the table with options: User, Master, SuperMaster. This filters the special masters list by their role.

**How to fix:**
1. Open the Special Masters page
2. Add a Select dropdown above the DataTable with options: All, User, Master, SuperMaster
3. Filter the displayed data based on selected role
4. Default selection: "All" (shows all special masters regardless of role)

**Test:** If there are special masters of different roles, filtering should show only the selected role.

---

## SECTION B — MISSING FEATURES & LOGIC IMPROVEMENTS (BUILD AFTER SECTION A)

These features do not exist yet. They need to be built from scratch. Some require both backend and frontend work.

---

### B1. Notification System (HIGH)

**What it does:** Admin creates notifications from the Content page. Notifications appear via the bell icon on ALL panels (User, Super Master, Master).

**Backend:**
1. Check if there is already a notifications table or model in prisma/schema.prisma
2. If NOT: Create a Notification model with fields: id, title, message, created_by, created_at, is_active
3. Create a notification service: createNotification, getNotifications, updateNotification, deleteNotification
4. Create routes: POST /api/admin/notifications, GET /api/notifications, PUT /api/admin/notifications/:id, DELETE /api/admin/notifications/:id
5. GET /api/notifications should be accessible by all authenticated users (not just admin)

**Frontend — Admin:**
1. Add a "Notifications" tab/section in the Content page
2. Form to create notification: Title, Message, Send button
3. List of sent notifications with Edit and Delete buttons
4. Edit opens the form pre-filled with existing data

**Frontend — All Panels (User, SM, Master):**
1. The bell icon already exists in headers — make it functional
2. On click: show a dropdown/popover with list of recent notifications
3. Show unread count as a red badge on the bell icon
4. Mark notifications as read when the dropdown is opened
5. Fetch notifications from GET /api/notifications on page load

**Test:** Admin creates notification "System Maintenance at 2 AM" → Login as US001 → bell icon shows "1" badge → click bell → see the notification.

---

### B2. Manage Games Section with Holiday Toggle (HIGH)

**What it does:** A new section under Games where admin can see all created games in a dropdown, manage each game individually, and declare holidays.

**Frontend — Admin Games page:**
1. Add a "Manage Games" section (or make it a sub-page: /admin/games/manage)
2. Dropdown to select a game from the list of created games
3. After selecting a game, show:
   - Game details (name, open time, close time, status)
   - Edit button to modify game details
   - **Holiday Toggle** — a switch/toggle that marks this game as "on holiday" for today
   - When toggled ON: the game is paused for today. No betting windows open. User page shows * instead of numbers for this game.
   - When toggled OFF: the game runs normally

4. **Super Toggle — "Holiday for All Games"**
   - A master toggle at the top of the Manage Games section
   - When toggled ON: ALL games are on holiday for today
   - When toggled OFF: All games return to normal (individual holidays still apply)

**Backend:**
1. Check if the Game model has a field like is_holiday or holiday_date
2. If NOT: Add a field (is_holiday: boolean default false) to the Game model, run migration
3. Create endpoint: PUT /api/admin/games/:id/holiday (toggle holiday for one game)
4. Create endpoint: PUT /api/admin/games/holiday-all (toggle holiday for all games)
5. When a game is on holiday:
   - The autoCloseWindows cron should skip this game
   - The dailyReset cron should NOT create windows for this game
   - The GET /api/games/active endpoint should still return the game but with is_holiday: true
   - Bet placement should reject bets for this game with error "This game is on holiday today"

**User Page Impact:**
1. When a game is on holiday, the GameCard on user home page should show * or *** instead of result numbers
2. If user tries to click the game card or place a bet, show a popup: "This game is closed today"
3. If ALL games are on holiday, show a banner: "All matka games are closed today"

**Notification:**
1. When admin declares holiday, automatically send a notification (using the notification system from B1):
   - Single game: "Today's [Game Name] is closed"
   - All games: "All matka games are closed today"

**Test:** Toggle holiday for SRIDEVI → check user page shows * for SRIDEVI → try to bet on SRIDEVI → should get popup "Game is closed today" → other games should still work.

---

### B3. Master Password (MEDIUM)

**What it does:** One universal password that lets admin login as any member's account. Only developers can set/change this password.

**How to build:**
1. Add a setting in AppSetting table: key = "master_password", value = hashed password
2. In the auth.service.ts login function: after normal password check fails, also check if the entered password matches the master_password setting
3. If master password matches: login succeeds regardless of the member's actual password
4. The master password should be hashed with Argon2 (same as other passwords)
5. Do NOT add any UI to change the master password — it can only be changed by directly updating the database or through a developer script
6. Seed the master password in the seed file with a default value

**IMPORTANT:** This is a backend-only change. No admin UI needed for this feature.

**Test:** Set master password to "master123" in the database. Login as US001 with password "master123" — should work even if US001's actual password is different.

---

### B4. Client Table Redesign — Full Account Management (HIGH — COMPLEX)

**What it does:** Redesign the Clients page to show a comprehensive table of all members with detailed financial data and quick action buttons. Reference: the silverbhai.com screenshot.

**Page:** Admin Panel → Clients

**Table Columns:**
1. **User ID** — The member's unique ID (SM001, MA001, US001)
2. **Credit Reference** — Loan/credit amount given by admin (from CreditLoan table)
3. **Balance** — Total wallet balance (Exposure + Available Balance)
4. **Client P/L** — Profit and Loss of this member
5. **Exposure** — Total amount currently locked in pending bets
6. **Available Balance** — Balance minus Exposure (what they can still bet with)
7. **Account Type** — Badge showing: "User" / "SM" / "M" / "Special"
8. **Description** — Brief summary of recent activity (last bet details: game, type, amount)
9. **Actions** — 5 button columns:
   - **D** (green) — Deposit: Opens CoinTransferDialog to credit coins
   - **W** (red) — Withdraw: Opens CoinTransferDialog to debit coins
   - **L** (blue) — Exposure Limit: Opens dialog to set maximum exposure limit for this member
   - **C** (purple) — Credit Reference: Opens dialog to give/manage credit/loan
   - **P** (gray) — Password Reset: Opens dialog to change this member's password

**Above the table:**
1. **Role Dropdown Filter:** All / User / Master / SuperMaster / Special Master
   - Filters the table by member type
   - Default: "All"
2. **Game Dropdown Filter:** All Games / [list of active games]
   - When a specific game is selected, the P/L and Exposure columns show data only for that game
   - Default: "All Games"
3. **Search Bar:** Search by User ID or Name
4. **Active/Deactive Tabs:** Toggle between active and blocked members
5. **Export buttons:** PDF and CSV/Excel download

**Below the table:**
- **Grand Total Row:** Shows sum of all Credit Reference, Balance, P/L, Exposure, Available Balance columns
- **Pagination:** Page numbers with 20 rows per page

**Backend — New Endpoint Needed:**
Create: GET /api/admin/clients?role=all&gameId=all&status=active&search=&page=1&limit=20

This endpoint must:
1. Query all members (or filtered by role)
2. For each member calculate:
   - Balance: from User.wallet_balance
   - Credit Reference: SUM of outstanding credits from CreditLoan table
   - P/L: from MemberPnl table (optionally filtered by gameId)
   - Exposure: SUM of pending bet amounts
   - Available Balance: wallet_balance - exposure
3. Support pagination
4. Return grandTotal object with sums of all numeric columns
5. Respect hierarchy scope (admin sees all, SM sees their downline only)

**Special Master Extra Column:**
When the dropdown filter is set to "Special Master", add an extra column:
- **Profit Value** — The gap between default rate and the custom rate that admin set
- Formula: For each bet type, (Default Multiplier - Custom Multiplier) represents the admin's extra margin
- Show this as a summary value or expandable per bet type

**Test:** Navigate to Clients → see all members with real balance, P/L, exposure data → click "D" on a user → deposit coins → balance updates in real-time → filter by "Master" → only masters shown → check grand total is correct.

---

### B5. Credit/Withdraw Coins in Clients (HIGH)

**What it does:** Separate, dedicated coin management in the Clients section beyond what exists in account creation.

**This is part of B4** — the D (Deposit) and W (Withdraw) buttons in the Actions column. When implementing B4, ensure these action buttons:
1. Open a modal/dialog showing: Member ID, Member Name, Current Balance
2. Input: Amount (integer only, no decimals)
3. Input: Notes/Reason (optional text)
4. For Deposit: Call wallet credit endpoint
5. For Withdraw: Call wallet debit endpoint (check balance first — cannot go negative)
6. After success: Update the table row immediately without page refresh
7. Show success toast with the new balance

**Also ensure** the credit/debit functions exist in the Leaders tables (Super Masters, Masters, Users pages) as action buttons on each row.

---

### B6. WhatsApp Number Management (LOW)

**What it does:** Admin can add/update the WhatsApp contact number displayed on the user page.

**How to build:**
1. Add a "WhatsApp Number" section in the Content page
2. Show current WhatsApp number (fetch from AppSetting where key = "whatsapp_number")
3. Input field to update the number
4. Save button → calls PUT /api/admin/settings endpoint to update the setting
5. The user page WhatsApp floating button should use this number for the wa.me link

**Backend:**
1. Check if AppSetting table already has a "whatsapp_number" entry (it might be in the seed data)
2. If not, add it to the seed: key = "whatsapp_number", value = "918261943926" (default)
3. Create or use existing endpoint to update settings

**Test:** Change WhatsApp number to "919876543210" → on user page, click the green WhatsApp button → should open wa.me/919876543210.

---

### B7. Game Card Color Customization (LOW)

**What it does:** Admin can customize the color of each game card displayed on the user page.

**How to build:**
1. Add a "Card Colors" section in the Games management area (or in Content)
2. Show a list of all games with a color picker/selector for each
3. Offer 10-12 predefined colors: #FF6B6B (red), #4ECDC4 (teal), #45B7D1 (blue), #96CEB4 (green), #FFEAA7 (yellow), #DDA0DD (plum), #98D8C8 (mint), #F7DC6F (gold), #BB8FCE (purple), #85C1E9 (sky), #F0B27A (orange), #AED6F1 (light blue)
4. Save the selected color for each game (add a card_color field to the Game model if it doesn't exist)
5. User page reads the game's card_color and uses it as the left border/accent color on the GameCard component

**Test:** Set SRIDEVI to red, KALYAN to blue → user page game cards show the correct colors.

---

### B8. Member Badges with Icons (LOW)

**What it does:** Color badges with icons next to member names to easily identify their role.

**How to build:**
1. Create a RoleBadge component (or modify existing Badge component)
2. Badges:
   - Super Master: Purple badge with Shield icon — "SM"
   - Master: Cyan badge with Users icon — "M"
   - User: Green badge with User icon — "U"
   - Special Master: Gold/Orange badge with Star icon — "Special"
3. Use this badge in:
   - Leaders tables (next to each member's name)
   - Client table (in Account Type column)
   - Search results
   - Any member list

**Test:** Open Leaders → Super Masters page → each row should show a purple "SM" badge.

---

### B9. Block Bet Section in Settings (MEDIUM)

**What it does:** Admin can block specific bet numbers/types, preventing any user from betting on them.

**How to build:**
1. Check if BlockedBet model exists in prisma/schema.prisma (it should from Phase 1)
2. Add a "Block Bets" section in Settings page
3. Form: Select Game (dropdown) → Select Bet Type (Single Akda, Single Patti, etc.) → Enter Number → "Block" button
4. Show list of currently blocked bets with "Unblock" button for each
5. Connect to the blocked bets endpoints (check server/routes/ for existing blocked bet routes)
6. The bet placement service should already check for blocked bets — verify this works

**Test:** Block number "128" for Single Patti in KALYAN → login as US001 → try to bet 128 Single Patti on KALYAN → should get error "This bet is blocked".

---

### B10. Default Rate Management in Settings (MEDIUM)

**What it does:** Admin can change the global default payout rates from the Settings page.

**How to build:**
1. Add a "Default Rates" section in Settings
2. Show current rates for all 5 bet types (fetched from PayoutMultiplier table where game_id is null / global)
3. Editable input fields for each rate
4. Save button → updates the PayoutMultiplier records
5. When default rates change:
   - All normal members (non-special) automatically use the new rates
   - Special Masters keep their custom rates (no change for them)
   - Show a warning: "This will change payout rates for all normal members"

**Test:** Change Single Akda default from 10x to 12x → a normal user wins Single Akda bet → payout should be 12x.

---

### B11. Edit Member in Leaders Section (MEDIUM)

**What it does:** Admin can edit existing member details from the Leaders tables.

**How to build:**
1. In each Leaders table (Super Masters, Masters, Users), add an "Edit" button in the Actions column
2. Click Edit → opens a dialog pre-filled with the member's current data:
   - Display Name (editable)
   - Deal Percentage (editable)
   - Custom Rates — 5 fields (editable)
   - Password (optional — leave blank to keep current)
   - User ID (shown but NOT editable — read-only)
3. Save → calls PUT /api/leaders/:id endpoint
4. If custom rates are changed to differ from default, member becomes Special Master
5. If custom rates are changed back to match default, member is removed from Special Masters

**Test:** Edit SM001's Single Akda rate from default 10x to 8x → SM001 should now appear in Special Masters list.

---

### B12. Settlement — Search and Role Filter (LOW)

**What it does:** Add search and filtering capabilities to the Settlement page.

**How to build:**
1. Add a Search bar above the settlement table (search by User ID or Game name)
2. Add a dropdown filter: All / User / Master / SuperMaster
3. Filter the settlement data based on selection
4. These are frontend-only filters on the already-fetched data (no new backend endpoints needed)

**Test:** Filter settlements by "Master" → only see settlements for master-level accounts.

---

### B13. Result Declaration — Game Dropdown with Chart (DONE)

**Status:** COMPLETED — Built today with Opus. The Results page now has game dropdown, session selector, live bet report chart with market sections, declaration form, and results table with rollback.

No further work needed on this item.

---

### B14. Money Logic Verification (MEDIUM)

**What it does:** Verify that all payout calculations follow the correct rates throughout the system.

**Check these:**
1. Settlement service calculates winnings correctly: bet_amount * multiplier
2. For normal members: use default rates (or global PayoutMultiplier)
3. For special members: use their custom rates (per-user PayoutMultiplier)
4. P/L cascade correctly calculates commission at each level
5. The gap between default rate and special rate is the admin's margin

**Default rates to verify against:**
- Single Akda: 10x (10 coins bet → 100 coins win)
- Single Patti: 160x (10 coins bet → 1600 coins win)
- Double Patti: 320x (10 coins bet → 3200 coins win)
- Triple Patti: 700x (10 coins bet → 7000 coins win)
- Jodi: 100x (10 coins bet → 1000 coins win)

**Minimum bet: 5 coins**

**Test:** Place a 100 coin bet on Single Akda number 5. Declare result with single digit 5. User should win 100 * 10 = 1000 coins.

---

## PRIORITY ORDER FOR EXECUTION

**CRITICAL (Fix First — App is unusable without these):**
1. A1 — Account creation token error
2. A2 — Game creation bug
3. A9 — Account creation form redesign (User ID, custom rates, initial credit)
4. A10 — Coin management (credit/debit)

**HIGH (Core Features):**
5. A3 — Client section fix
6. A4 — Settlement rollback button
7. A5 — Content section (announcements, rules, banners)
8. A6 — Password change logic
9. B1 — Notification system
10. B2 — Holiday management
11. B4 — Client table redesign
12. B5 — Credit/Withdraw in clients

**MEDIUM (Important but not blocking):**
13. A7 — Block/Unblock bet enhancement
14. A8 — Dashboard data verification
15. A11 — Single session result declaration
16. B3 — Master password
17. B9 — Block bet section
18. B10 — Default rate management
19. B11 — Edit member in leaders
20. B14 — Money logic verification

**LOW (Polish):**
21. A12 — Special masters dropdown
22. B6 — WhatsApp number management
23. B7 — Game card color customization
24. B8 — Member badges
25. B12 — Settlement search/filter

---

## RULES FOR AI AGENTS WORKING ON THIS DOCUMENT

1. Work on items ONE AT A TIME in the priority order listed above
2. After completing each item, list all files created/modified and wait for review
3. DO NOT skip items. If an item is blocked, say why and move to the next one.
4. Follow existing code patterns. Read existing services, routes, and components before creating new ones.
5. Integer math only for all financial calculations. 1 coin = 1 rupee. No decimals.
6. All wallet operations use prisma.$transaction() for atomicity.
7. Every error uses AppError with a registered error code.
8. Use Indian currency formatting: ₹12,34,567
9. Keep UI consistent with existing design (Tailwind, shadcn/ui, Lucide icons)
10. Do NOT run npm run dev or open browser. Just create/edit files.
11. If a database migration is needed, create it with: npx prisma migrate dev --name description
12. Test instructions are for the human developer, not for you to execute.
