# DESIGN REQUIREMENTS DOCUMENT (DRD)
# MATKA BETTING PLATFORM
## Version 1.0 | February 2026

---

## TABLE OF CONTENTS
1. [Design Vision & Philosophy](#1-design-vision--philosophy)
2. [Design Reference & Inspiration](#2-design-reference--inspiration)
3. [Design System Foundation](#3-design-system-foundation)
4. [Typography System](#4-typography-system)
5. [Color System](#5-color-system)
6. [Spacing & Grid System](#6-spacing--grid-system)
7. [Component Library](#7-component-library)
8. [Icon System](#8-icon-system)
9. [Dashboard Design Patterns](#9-dashboard-design-patterns)
10. [Data Visualization & Charts](#10-data-visualization--charts)
11. [Table Design System](#11-table-design-system)
12. [Card Design System](#12-card-design-system)
13. [Form Design System](#13-form-design-system)
14. [Navigation & Layout Patterns](#14-navigation--layout-patterns)
15. [Admin Panel — Page-by-Page Design Spec](#15-admin-panel--page-by-page-design-spec)
16. [Super Master Panel — Design Spec](#16-super-master-panel--design-spec)
17. [Master Panel — Design Spec](#17-master-panel--design-spec)
18. [User Page — Design Spec](#18-user-page--design-spec)
19. [Real-Time UI Patterns](#19-real-time-ui-patterns)
20. [Mobile Responsive Design](#20-mobile-responsive-design)
21. [Micro-Interactions & Animations](#21-micro-interactions--animations)
22. [Dark Mode Specification](#22-dark-mode-specification)
23. [Empty States & Loading States](#23-empty-states--loading-states)
24. [Toast, Notification & Alert Design](#24-toast-notification--alert-design)
25. [Accessibility Requirements](#25-accessibility-requirements)
26. [Design Tokens (CSS Variables)](#26-design-tokens-css-variables)
27. [Implementation Guidelines for AI Agent](#27-implementation-guidelines-for-ai-agent)

---

## 1. DESIGN VISION & PHILOSOPHY

### 1.1 Design Direction
**Refined Modern Minimalism with Data-Dense Clarity**

Inspired by the Rylix Smart Dashboard System — a clean, white-space-rich, professional dashboard that prioritizes data readability while maintaining visual elegance. Every pixel serves a purpose. No decorative clutter. Information hierarchy is king.

### 1.2 Core Design Principles

#### Principle 1: CLARITY OVER DECORATION
The Admin manages real money. Every number, every percentage, every P/L figure must be instantly readable. No fancy backgrounds or textures that compete with data. The data IS the design.

#### Principle 2: BREATHING SPACE
Generous padding and margins everywhere. Tables don't feel cramped. Cards have room to breathe. White space is not wasted space — it creates focus and reduces cognitive load.

#### Principle 3: SOFT BUT AUTHORITATIVE
Rounded corners, soft shadows, muted backgrounds — but with confident typography and bold accent colors for important data points. The design feels professional and trustworthy.

#### Principle 4: CONSISTENT RHYTHM
Every element follows the same spacing scale, the same border radius, the same shadow depth. The entire application feels like ONE cohesive product, not a collection of random pages.

#### Principle 5: DATA HIERARCHY
The most important number on any screen should be the largest, boldest, and most prominent. Secondary data supports it. Tertiary data is accessible but doesn't compete.

### 1.3 Design Tone
- **NOT:** Flashy gambling aesthetic with neon colors and dark backgrounds
- **IS:** Clean financial dashboard — like a premium fintech app
- **Feel:** Professional, trustworthy, modern, efficient
- **Compare to:** Stripe Dashboard, Linear App, Notion — clean SaaS products

---

## 2. DESIGN REFERENCE & INSPIRATION

### 2.1 Primary Reference: Rylix Smart Dashboard System (Behance)
Key elements to replicate:
- Clean white/light gray backgrounds
- Card-based layout with subtle shadows
- Large, bold metric numbers on dashboard
- Minimal sidebar with icon + text navigation
- Soft rounded corners (12-16px radius)
- Data tables with alternating row backgrounds
- Charts with soft gradients and rounded line charts
- Poppins as the primary font family
- Color-coded status indicators
- Wireframe-level clarity in information architecture

### 2.2 Design Elements to Adopt

#### From Rylix Dashboard:
- **Stat Cards:** Large number (32-48px), small label below, subtle icon, mini trend chart
- **Sidebar:** Dark sidebar (charcoal/navy) with white text, active state highlight
- **Content Area:** Light gray (#F5F7FA) background with white cards
- **Tables:** Clean, no heavy borders, alternating rows, hover states
- **Charts:** Soft area charts with gradient fills, donut charts for composition
- **Header:** Minimal — search, notifications bell, user avatar
- **Grid:** 12-column with consistent gutters (24px)
- **Shadows:** Very subtle — `0 1px 3px rgba(0,0,0,0.08)`

### 2.3 What We Will NOT Copy
- No complex multi-tab headers from allindia.bet
- No cluttered sidebar from ag.allindia.bet
- No small, cramped text
- No harsh borders or heavy table lines
- No outdated Bootstrap-default look

---

## 3. DESIGN SYSTEM FOUNDATION

### 3.1 Technology Stack for Design
```
Framework: Next.js 14 (App Router)
Styling: Tailwind CSS
Component Library: shadcn/ui (as base, heavily customized)
Icons: Lucide React
Charts: Recharts (for dashboard visualizations)
Animations: Framer Motion (subtle, purposeful)
Font Loading: next/font (Google Fonts)
```

### 3.2 shadcn/ui Customization
shadcn/ui provides the structural base, but EVERY component must be customized to match our design system:
- Override default border radius to 12px
- Override default colors to our palette
- Override default shadows to our soft shadow system
- Override default font sizes to our typography scale
- Add custom variants for our specific use cases

### 3.3 Design File Structure
```
src/
├── styles/
│   └── globals.css          (CSS variables, base styles)
├── components/
│   ├── ui/                  (shadcn/ui base components - customized)
│   ├── dashboard/           (stat cards, charts, widgets)
│   ├── tables/              (data tables, grand total rows)
│   ├── forms/               (input groups, bet forms)
│   ├── navigation/          (sidebar, header, mobile nav)
│   ├── cards/               (game cards, result cards, member cards)
│   ├── modals/              (confirmation dialogs, rollback warning)
│   ├── notifications/       (toast, alerts, real-time popups)
│   └── layout/              (page layouts, grid wrappers)
```

---

## 4. TYPOGRAPHY SYSTEM

### 4.1 Font Family: Poppins
**Primary:** Poppins (Google Font) — Matches the Rylix reference exactly.

```css
/* Font Import */
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap');

/* Or via next/font (preferred for performance) */
import { Poppins } from 'next/font/google';
const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
});
```

**Fallback Stack:** `'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`

### 4.2 Font Weight Usage
| Weight | Name | Usage |
|--------|------|-------|
| 300 | Light | Subtle labels, helper text |
| 400 | Regular | Body text, table cells, descriptions |
| 500 | Medium | Navigation items, form labels, secondary headings |
| 600 | SemiBold | Card titles, table headers, buttons, important text |
| 700 | Bold | Dashboard metrics, page titles, emphasis numbers |
| 800 | ExtraBold | Hero numbers on dashboard (Total P/L, Grand Total) |

### 4.3 Type Scale
```
--text-xs:    11px / 0.6875rem   → Small labels, timestamps
--text-sm:    13px / 0.8125rem   → Table cells, helper text, badges
--text-base:  15px / 0.9375rem   → Body text, form inputs, descriptions
--text-lg:    17px / 1.0625rem   → Card titles, navigation items
--text-xl:    20px / 1.25rem     → Section headings, modal titles
--text-2xl:   24px / 1.5rem      → Page titles, major headings
--text-3xl:   30px / 1.875rem    → Dashboard stat numbers
--text-4xl:   40px / 2.5rem      → Hero metrics (Total Profit, Grand Total)
--text-5xl:   52px / 3.25rem     → Primary dashboard hero number
```

### 4.4 Line Heights
```
--leading-tight:    1.2   → Headings, large numbers
--leading-snug:     1.35  → Card titles, medium text
--leading-normal:   1.5   → Body text, descriptions
--leading-relaxed:  1.65  → Long-form text, rules pages
```

### 4.5 Letter Spacing
```
--tracking-tight:   -0.02em  → Large headings, hero numbers
--tracking-normal:  0em      → Body text
--tracking-wide:    0.02em   → All-caps labels, category tags
--tracking-wider:   0.05em   → Tiny uppercase badges
```

### 4.6 Number Display
Since this is a financial application, numbers need special treatment:
- **Tabular numbers:** Use `font-variant-numeric: tabular-nums` for all numbers in tables so columns align perfectly
- **₹ symbol:** Always prefix amounts with ₹ followed by formatted number
- **Number formatting:** Use Indian number system (12,34,567 not 1,234,567)
- **Positive amounts:** Green (#22C55E) with optional ↑ arrow
- **Negative amounts:** Red (#EF4444) with optional ↓ arrow
- **Zero amounts:** Neutral gray (#6B7280)

---

## 5. COLOR SYSTEM

### 5.1 Primary Palette (Inspired by Rylix Dashboard)

```css
/* ===== BRAND COLORS ===== */
--color-primary:          #2563EB;    /* Royal Blue — primary actions, active states */
--color-primary-hover:    #1D4ED8;    /* Darker blue for hover */
--color-primary-light:    #EFF6FF;    /* Very light blue for backgrounds */
--color-primary-50:       #DBEAFE;    /* Light blue for subtle highlights */

/* ===== BACKGROUND COLORS ===== */
--color-bg-body:          #F5F7FA;    /* Main page background — light warm gray */
--color-bg-card:          #FFFFFF;    /* Card/panel backgrounds — pure white */
--color-bg-sidebar:       #1E293B;   /* Sidebar — dark slate */
--color-bg-sidebar-hover: #334155;   /* Sidebar hover state */
--color-bg-sidebar-active:#2563EB;   /* Sidebar active item — primary blue */
--color-bg-header:        #FFFFFF;   /* Top header — white */
--color-bg-table-alt:     #F8FAFC;   /* Alternating table row */
--color-bg-table-hover:   #F1F5F9;   /* Table row hover */
--color-bg-input:         #FFFFFF;   /* Input field background */
--color-bg-modal:         #FFFFFF;   /* Modal background */
--color-bg-overlay:       rgba(0, 0, 0, 0.5);  /* Modal overlay */

/* ===== TEXT COLORS ===== */
--color-text-primary:     #0F172A;   /* Headings, important text — near black */
--color-text-secondary:   #475569;   /* Body text, descriptions — medium gray */
--color-text-tertiary:    #94A3B8;   /* Placeholders, helper text — light gray */
--color-text-inverse:     #FFFFFF;   /* Text on dark backgrounds */
--color-text-link:        #2563EB;   /* Links — primary blue */

/* ===== STATUS / SEMANTIC COLORS ===== */
--color-success:          #22C55E;   /* Won, Profit, Active, Credited */
--color-success-light:    #F0FDF4;   /* Success background */
--color-success-border:   #BBF7D0;   /* Success border */

--color-danger:           #EF4444;   /* Lost, Loss, Blocked, Debited */
--color-danger-light:     #FEF2F2;   /* Danger background */
--color-danger-border:    #FECACA;   /* Danger border */

--color-warning:          #F59E0B;   /* Pending, Expiring soon */
--color-warning-light:    #FFFBEB;   /* Warning background */
--color-warning-border:   #FDE68A;   /* Warning border */

--color-info:             #3B82F6;   /* Info, Processing */
--color-info-light:       #EFF6FF;   /* Info background */

/* ===== BORDER COLORS ===== */
--color-border:           #E2E8F0;   /* Default borders — very subtle */
--color-border-focus:     #2563EB;   /* Input focus border — primary blue */
--color-border-error:     #EF4444;   /* Error state border */

/* ===== SHADOW SYSTEM ===== */
--shadow-xs:    0 1px 2px rgba(0, 0, 0, 0.04);
--shadow-sm:    0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04);
--shadow-md:    0 4px 6px rgba(0, 0, 0, 0.05), 0 2px 4px rgba(0, 0, 0, 0.04);
--shadow-lg:    0 10px 15px rgba(0, 0, 0, 0.06), 0 4px 6px rgba(0, 0, 0, 0.04);
--shadow-xl:    0 20px 25px rgba(0, 0, 0, 0.08), 0 8px 10px rgba(0, 0, 0, 0.04);
--shadow-card:  0 1px 3px rgba(0, 0, 0, 0.08);  /* Default card shadow */
```

### 5.2 Game Color Codes
Each game has a unique color for visual identification in result cards:
```css
--game-sridevi:       #22C55E;   /* Green */
--game-time-bazar:    #3B82F6;   /* Blue */
--game-milan-day:     #EAB308;   /* Yellow */
--game-rajdhani:      #A855F7;   /* Purple */
--game-kamdhenu:      #14B8A6;   /* Teal */
--game-kalyan:        #F97316;   /* Orange */
--game-milan-night:   #EAB308;   /* Yellow (same family as day) */
--game-rajdhani-night:#A855F7;   /* Purple (same family as day) */
--game-main-bazar:    #EC4899;   /* Pink */
--game-sridevi-night: #22C55E;   /* Green (same family as day) */
--game-kamdhenu-night:#14B8A6;   /* Teal (same family as day) */
```

### 5.3 P/L Color Convention
```
PROFIT (Positive):  #22C55E (Green) with ↑ icon
LOSS (Negative):    #EF4444 (Red) with ↓ icon
NEUTRAL (Zero):     #6B7280 (Gray) — no icon
PENDING:            #F59E0B (Amber) with ⏳ icon
```

### 5.4 Role-Based Accent Colors
```
ADMIN:          #2563EB (Blue) — authority, trust
SUPER MASTER:   #7C3AED (Purple) — premium, elevated
MASTER:         #0891B2 (Cyan) — professional, capable
USER:           #059669 (Emerald) — active, engaged
SPECIAL:        #D97706 (Amber) — distinguished, flagged
```

---

## 6. SPACING & GRID SYSTEM

### 6.1 Spacing Scale (4px base)
```css
--space-0:    0px;
--space-0.5:  2px;
--space-1:    4px;
--space-1.5:  6px;
--space-2:    8px;
--space-3:    12px;
--space-4:    16px;
--space-5:    20px;
--space-6:    24px;
--space-8:    32px;
--space-10:   40px;
--space-12:   48px;
--space-16:   64px;
--space-20:   80px;
```

### 6.2 Layout Grid
```
Page Structure:
├── Sidebar: 260px fixed width (collapsible to 72px icon-only on tablet)
├── Content Area: Remaining width
│   ├── Header: 72px height, sticky
│   ├── Page Content: Scrollable
│   │   ├── Max content width: 1440px (centered)
│   │   ├── Content padding: 24px (desktop), 16px (mobile)
│   │   └── Grid: 12-column with 24px gutters
│   └── Footer: Optional, 48px height
```

### 6.3 Card Grid
```
Dashboard stat cards: 4 columns (desktop), 2 columns (tablet), 1 column (mobile)
Content cards: Variable — 1 to 4 columns based on content type
Gap between cards: 24px (desktop), 16px (mobile)
```

### 6.4 Border Radius Scale
```css
--radius-sm:    6px;     /* Small elements: badges, chips, tags */
--radius-md:    8px;     /* Buttons, inputs, small cards */
--radius-lg:    12px;    /* Standard cards, modals, dropdowns */
--radius-xl:    16px;    /* Large cards, dashboard stat widgets */
--radius-2xl:   24px;    /* Special containers, hero sections */
--radius-full:  9999px;  /* Pills, avatars, circular elements */
```

---

## 7. COMPONENT LIBRARY

### 7.1 Buttons
```
PRIMARY BUTTON:
├── Background: var(--color-primary) #2563EB
├── Text: White, 600 weight, 15px
├── Padding: 10px 20px
├── Border Radius: 8px
├── Shadow: var(--shadow-sm)
├── Hover: var(--color-primary-hover) + var(--shadow-md)
├── Active: Scale 0.98
├── Disabled: Opacity 0.5, cursor not-allowed
└── Transition: all 150ms ease

SECONDARY BUTTON:
├── Background: White
├── Border: 1px solid var(--color-border)
├── Text: var(--color-text-primary), 500 weight
├── Hover: var(--color-bg-table-alt) background
└── Same sizing as primary

DANGER BUTTON:
├── Background: var(--color-danger) #EF4444
├── Text: White
├── Used for: Delete, Block, Rollback actions
└── Confirmation dialog required before action

SUCCESS BUTTON:
├── Background: var(--color-success) #22C55E
├── Text: White
├── Used for: Credit, Approve, Declare actions

GHOST BUTTON:
├── Background: Transparent
├── Text: var(--color-primary)
├── Hover: var(--color-primary-light) background
├── Used for: Cancel, Close, secondary actions

ICON BUTTON:
├── Size: 36px × 36px
├── Border Radius: 8px
├── Hover: var(--color-bg-table-alt)
├── Used for: Quick actions in tables (D, W, L, C, P buttons)
```

### 7.2 Quick Action Buttons (Table Row Actions)
Like the silverbhai reference — small colored buttons for Deposit, Withdraw, Ledger, Client, P&L:
```
D (Deposit):    Small badge, green background (#22C55E), white text
W (Withdraw):   Small badge, red background (#EF4444), white text
L (Ledger):     Small badge, blue background (#3B82F6), white text
C (Client):     Small badge, purple background (#7C3AED), white text
P (P&L):        Small badge, amber background (#F59E0B), white text

Size: 28px × 28px, border-radius: 6px, font-size: 12px, font-weight: 700
Hover: Darken 10% + shadow-sm
Tooltip on hover showing full label ("Deposit", "Withdraw", etc.)
```

### 7.3 Badges & Status Indicators
```
ACTIVE:    Green dot (#22C55E) + "Active" text in green
BLOCKED:   Red dot (#EF4444) + "Blocked" text in red
PENDING:   Amber dot (#F59E0B) + "Pending" text in amber
SPECIAL:   Star icon (⭐) + amber badge "Special"
WON:       Green badge with "Won" text
LOST:      Red badge with "Lost" text
DECLARED:  Green badge with checkmark
UNDECLARED: Gray badge with clock icon

Badge Design:
├── Padding: 4px 10px
├── Border Radius: 9999px (pill shape)
├── Font Size: 12px, weight 500
├── Background: Light variant of status color
├── Text: Dark variant of status color
├── Dot: 8px circle before text
```

### 7.4 Input Fields
```
DEFAULT INPUT:
├── Height: 44px
├── Padding: 0 16px
├── Border: 1px solid var(--color-border)
├── Border Radius: 8px
├── Background: White
├── Font: 15px Poppins Regular
├── Placeholder: var(--color-text-tertiary)
├── Focus: Border color → var(--color-primary), ring → 3px primary-light
├── Error: Border color → var(--color-danger), helper text in red below
└── Transition: border-color 150ms, box-shadow 150ms

LABEL:
├── Font: 13px Poppins Medium
├── Color: var(--color-text-secondary)
├── Margin bottom: 6px
├── Required indicator: Red asterisk (*)

SELECT / DROPDOWN:
├── Same styling as input
├── Chevron icon on right
├── Dropdown panel: White, shadow-lg, radius-lg, max-height 300px with scroll
├── Option hover: var(--color-bg-table-alt)
├── Selected option: var(--color-primary-light) background, primary text color
```

---

## 8. ICON SYSTEM

### 8.1 Icon Library: Lucide React
```
import {
  Users, UserPlus, UserCheck, UserX,
  Wallet, CreditCard, ArrowUpRight, ArrowDownRight,
  TrendingUp, TrendingDown,
  BarChart3, PieChart, LineChart,
  Shield, ShieldCheck, ShieldAlert,
  Settings, Bell, Search, Filter,
  ChevronDown, ChevronRight, ChevronLeft,
  MoreHorizontal, MoreVertical,
  Download, Upload, FileText, File,
  Lock, Unlock, Eye, EyeOff,
  Check, X, AlertTriangle, Info,
  Clock, Calendar, Timer,
  Gamepad2, Dice3, Target,
  RefreshCw, RotateCcw,
  LogOut, Menu, Home,
  IndianRupee,
  MessageSquare,
  Megaphone, Image,
  Database, HardDrive,
  Ban, Flag
} from 'lucide-react';
```

### 8.2 Icon Sizing
```
--icon-xs:   14px   (inline with small text, badges)
--icon-sm:   16px   (table actions, navigation items)
--icon-md:   20px   (buttons, form elements)
--icon-lg:   24px   (sidebar navigation, card headers)
--icon-xl:   32px   (dashboard stat card icons)
--icon-2xl:  48px   (empty states, hero sections)
```

### 8.3 Icon Color Rules
- Navigation icons: `var(--color-text-tertiary)`, active: `var(--color-text-inverse)`
- Action icons: Match the button/element color
- Status icons: Match the status color
- Decorative icons: `var(--color-text-tertiary)` at 50% opacity

---

## 9. DASHBOARD DESIGN PATTERNS

### 9.1 Stat Card Design (Rylix Style)
```
┌─────────────────────────────────────────────┐
│                                             │
│   📊 (icon, muted)          ↑ 12.5%        │
│                              (trend)        │
│   ₹14,50,320                                │
│   (hero number, 40px, bold)                 │
│                                             │
│   Total Profit Today                        │
│   (label, 13px, muted)                      │
│                                             │
│   ▁▂▃▄▅▆▇ (mini sparkline chart)           │
│                                             │
└─────────────────────────────────────────────┘

Card Properties:
├── Background: White
├── Border Radius: 16px
├── Shadow: var(--shadow-card)
├── Padding: 24px
├── Min Height: 160px
├── Hover: var(--shadow-md) transition
├── Icon: 32px, placed top-right or top-left, muted color
├── Hero Number: 40px, Poppins Bold, var(--color-text-primary)
├── Trend: 13px, green (up) or red (down) with arrow icon
├── Label: 13px, Poppins Medium, var(--color-text-tertiary)
├── Sparkline: 60px height, gradient fill matching card theme
```

### 9.2 Admin Dashboard Stat Cards (4 columns)
```
Row 1:
[Total Users]  [Active Today & Bets]  [Today's Games]  [Today's P/L]

Each card:
├── Total Users: Icon=Users, Number=5,234, Trend=+123 today
├── Active Today: Icon=UserCheck, Number=1,892 users / 4,567 bets
├── Today's Games: Icon=Gamepad2, Number=8 active / 3 declared
└── Today's P/L: Icon=TrendingUp, Number=₹14,50,320, Color=Green/Red
```

### 9.3 Dashboard Charts Section
```
Row 2 (below stat cards):
┌──────────────────────────────┐ ┌──────────────────────┐
│   Revenue Trend (Area Chart) │ │  Game Distribution   │
│   Last 7 days P/L            │ │  (Donut Chart)       │
│   ▁▂▃▅▇▆▄                   │ │  Which games are     │
│                              │ │  most popular        │
│   Gradient fill, soft line   │ │                      │
└──────────────────────────────┘ └──────────────────────┘
8 columns                        4 columns

Row 3:
┌──────────────────────────────────────────────────────┐
│   Upcoming Results Timeline                           │
│   KALYAN OPEN → 15:30 (in 2h 15m)                   │
│   MILAN NIGHT → 21:11 (in 8h 56m)                    │
│   Horizontal timeline with countdown badges           │
└──────────────────────────────────────────────────────┘
12 columns

Row 4:
┌──────────────────────────────────────────────────────┐
│   Recent Bets Stream (Live)                           │
│   Real-time feed of bets being placed                 │
│   User PL519 → KALYAN → JODI 45 → ₹500 → 2s ago    │
│   Scrolling, max 10 visible, auto-updates            │
└──────────────────────────────────────────────────────┘
12 columns
```

### 9.4 Chart Design Guidelines (Recharts)
```
AREA CHART:
├── Line: 2px stroke, primary blue
├── Fill: Gradient from primary-20% opacity to transparent
├── Grid: Dashed, very light (#E2E8F0)
├── Axis labels: 12px Poppins Regular, muted gray
├── Tooltip: White card, shadow-lg, rounded-lg
├── Dots: Hidden by default, shown on hover (6px, primary blue)

DONUT CHART:
├── Inner radius: 60% of outer
├── Segments: Use game color codes
├── Center text: Total count/amount
├── Legend: Below chart, horizontal, dot + label
├── Hover: Segment expands slightly, tooltip shows value

BAR CHART:
├── Bar radius: 6px top corners
├── Bar width: 60% of available space
├── Colors: Primary blue for positive, red for negative
├── Hover: Darken bar, show tooltip
```

---

## 10. DATA VISUALIZATION & CHARTS

### 10.1 Recharts Configuration
```jsx
// Standard chart wrapper
<ResponsiveContainer width="100%" height={300}>
  <AreaChart data={data}>
    <defs>
      <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#2563EB" stopOpacity={0.2} />
        <stop offset="100%" stopColor="#2563EB" stopOpacity={0} />
      </linearGradient>
    </defs>
    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
    <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#94A3B8' }} />
    <YAxis tick={{ fontSize: 12, fill: '#94A3B8' }} />
    <Tooltip content={<CustomTooltip />} />
    <Area
      type="monotone"
      dataKey="value"
      stroke="#2563EB"
      strokeWidth={2}
      fill="url(#gradient)"
    />
  </AreaChart>
</ResponsiveContainer>
```

### 10.2 Custom Tooltip Design
```
┌────────────────────────┐
│  Feb 08, 2026          │ (date, 12px, muted)
│  ₹14,50,320            │ (value, 16px, bold, primary)
│  ↑ 12.5% from yesterday│ (trend, 12px, green)
└────────────────────────┘
Background: White, Shadow: lg, Radius: 12px, Padding: 12px 16px
```

---

## 11. TABLE DESIGN SYSTEM

### 11.1 Standard Data Table
```
STRUCTURE:
┌─────────────────────────────────────────────────────────┐
│ [Search field]              [Filter] [Export CSV] [PDF] │ ← Toolbar
├─────────────────────────────────────────────────────────┤
│ Header Row (sticky)                                     │ ← bg: #F8FAFC
│ S.No │ User Name │ Balance │ P/L │ Actions             │
├──────┼───────────┼─────────┼─────┼─────────────────────┤
│ 1    │ PL519     │ ₹42,000 │ ↑₹5 │ [D][W][L][C][P]   │ ← bg: White
├──────┼───────────┼─────────┼─────┼─────────────────────┤
│ 2    │ BSM80867  │ ₹18,000 │ ↓₹2 │ [D][W][L][C][P]   │ ← bg: #F8FAFC (alt)
├──────┼───────────┼─────────┼─────┼─────────────────────┤
│      │           │         │     │                     │
├──────┴───────────┴─────────┴─────┴─────────────────────┤
│ GRAND TOTAL     │ ₹1,20,000│ ↑₹45│                    │ ← bg: #F0F9FF (blue tint)
├─────────────────────────────────────────────────────────┤
│ Showing 1-20 of 156        │ [← Prev] [1][2][3] [Next →]│ ← Pagination
└─────────────────────────────────────────────────────────┘
```

### 11.2 Table Design Properties
```css
TABLE CONTAINER:
├── Background: White
├── Border Radius: 12px
├── Shadow: var(--shadow-card)
├── Overflow: Hidden (for rounded corners)
├── Border: 1px solid var(--color-border)

TABLE HEADER:
├── Background: #F8FAFC
├── Font: 13px Poppins SemiBold
├── Color: var(--color-text-secondary)
├── Text Transform: Uppercase
├── Letter Spacing: 0.05em
├── Padding: 14px 16px
├── Border Bottom: 1px solid var(--color-border)
├── Sticky: top 0 (scrollable tables)

TABLE BODY ROW:
├── Height: 56px
├── Padding: 12px 16px
├── Font: 14px Poppins Regular
├── Color: var(--color-text-primary)
├── Border Bottom: 1px solid #F1F5F9
├── Alternating: Even rows get bg: #F8FAFC
├── Hover: bg: #F1F5F9, transition 150ms
├── Cursor: pointer (if row is clickable)

GRAND TOTAL ROW:
├── Background: #F0F9FF (very light blue tint)
├── Font: 14px Poppins Bold
├── Color: var(--color-text-primary)
├── Border Top: 2px solid var(--color-primary)
├── Sticky: bottom 0 (always visible)
├── All numbers bold and slightly larger (15px)

PAGINATION:
├── Margin Top: 16px
├── Padding: 12px 16px
├── Font: 13px Poppins Medium
├── Page buttons: 36px square, radius-md
├── Active page: Primary blue bg, white text
├── Hover: var(--color-bg-table-alt)
```

### 11.3 Table Toolbar
```
LEFT SIDE:
├── Search input: Icon (Search) + input, 280px width
├── Filter dropdown: "All Types" / "Active" / "Blocked"

RIGHT SIDE:
├── Export CSV button (ghost, icon + text)
├── Export PDF button (ghost, icon + text)
├── Optional: Column visibility toggle
```

### 11.4 Responsive Table Behavior
- Desktop (>1024px): Full table with all columns
- Tablet (768-1024px): Hide less important columns, horizontal scroll
- Mobile (<768px): Card-based layout instead of table rows

---

## 12. CARD DESIGN SYSTEM

### 12.1 Game Result Card (User Page)
```
┌─────────────────────────────────────────┐
│  05 February 03:45 PM                   │ ← Timestamp, 12px, muted
│                                         │
│  KALYAN OPEN                            │ ← Game name, 18px, bold
│                                         │
│     388 — ⁹⁰ — 280                     │ ← Result, 28px on mobile
│                                         │  Panna: regular weight
│                                         │  Jodi: superscript, primary blue, bold
│                                         │
│  KALYAN चार्ट →                         │ ← Chart link, 13px, primary color
│                                         │
└─────────────────────────────────────────┘

Properties:
├── Background: White
├── Left Border: 4px solid var(--game-kalyan) (game-specific color)
├── Border Radius: 12px
├── Shadow: var(--shadow-card)
├── Padding: 20px
├── Margin Bottom: 12px
├── Hover: shadow-md
├── Result text alignment: Center
├── Jodi superscript: font-size 65% of Panna, vertical-align: super, color: primary blue
```

### 12.2 Bet Type Selection Card
```
┌───────────────────┐
│                   │
│   🎯 SINGLE      │
│      AKDA         │ ← Name, 16px, bold
│                   │
│     10x           │ ← Multiplier, 24px, primary blue, bold
│                   │
│  ₹100 → ₹1,000   │ ← Example, 12px, muted
│                   │
└───────────────────┘

Properties:
├── Background: White
├── Border: 2px solid var(--color-border)
├── Border Radius: 12px
├── Padding: 20px
├── Text Align: Center
├── Hover: Border color → primary, shadow-md
├── Selected: Border color → primary, bg → primary-light, checkmark icon
├── Transition: all 200ms ease
├── Grid: 5 cards in a row (desktop), 2-3 on mobile
```

### 12.3 Member Account Card (Mobile View)
When tables convert to cards on mobile:
```
┌─────────────────────────────────────────┐
│  PL519 (sam)                   ACTIVE ● │
│  Super Master                           │
│                                         │
│  Balance      P/L         Exposure      │
│  ₹42,000      ↑₹5,200    ₹8,000        │
│                                         │
│  [Deposit] [Withdraw] [Ledger] [P&L]   │
└─────────────────────────────────────────┘
```

---

## 13. FORM DESIGN SYSTEM

### 13.1 Standard Form Layout
```
FORM CONTAINER:
├── Background: White card
├── Padding: 32px
├── Border Radius: 12px
├── Shadow: var(--shadow-card)
├── Max Width: 600px (single column forms), 960px (two column forms)

FORM GROUPS:
├── Margin Bottom: 24px
├── Label → Input → Helper/Error text (vertical stack)

TWO-COLUMN LAYOUT:
├── Grid: 2 columns, 24px gap
├── Full-width fields (like notes/textarea) span both columns
├── On mobile: Single column
```

### 13.2 Bet Placement Form
```
┌─────────────────────────────────────────────────┐
│  PLACE YOUR BET                                  │
│                                                  │
│  Game: [KALYAN OPEN ▾]          Status: 🟢 OPEN │
│                                Closes in: 15:30  │
│                                                  │
│  Bet Type:                                       │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐            │
│  │ SA │ │ SP │ │ DP │ │ TP │ │ JD │            │
│  │10x │ │160x│ │320x│ │70x │ │100x│            │
│  └────┘ └────┘ └────┘ └────┘ └────┘            │
│                                                  │
│  Number: [_______]                               │
│  Amount: [₹ _____]  Min: ₹10                    │
│                                                  │
│  ┌──────────────────────────────────────┐       │
│  │ Potential Win: ₹16,000               │       │
│  │ Current Balance: ₹42,000             │       │
│  │ Balance After Bet: ₹41,900           │       │
│  └──────────────────────────────────────┘       │
│                                                  │
│  [PLACE BET]  (full width, primary button)      │
│                                                  │
└─────────────────────────────────────────────────┘

The info box (Potential Win, Balance) has:
├── Background: var(--color-primary-light)
├── Border: 1px solid var(--color-primary-50)
├── Border Radius: 8px
├── Padding: 16px
├── Font: 14px, Potential Win in bold green
```

### 13.3 Create Account Form (Admin)
```
┌─────────────────────────────────────────────────┐
│  CREATE NEW ACCOUNT                              │
│                                                  │
│  Role:    [Super Master ▾]                       │
│  Name:    [________________]                     │
│  Password:[________________] 👁                  │
│                                                  │
│  Deal %:  [____] %                               │
│  Credit Limit: [₹________]                       │
│  Fix Limit:    [₹________]                       │
│                                                  │
│  □ Mark as Special Master                        │
│                                                  │
│  [CANCEL]            [CREATE ACCOUNT]            │
│                                                  │
│  Auto-generated ID will be shown after creation  │
└─────────────────────────────────────────────────┘
```

### 13.4 Declare Result Form (Admin)
```
┌─────────────────────────────────────────────────┐
│  DECLARE RESULT                                  │
│                                                  │
│  Game:    [KALYAN ▾]                             │
│  Session: ○ OPEN  ○ CLOSE                        │
│  Date:    [08/02/2026]                           │
│                                                  │
│  Enter Panna: [___] (3 digits)                   │
│                                                  │
│  ┌──────────────────────────────────────┐       │
│  │ PREVIEW:                             │       │
│  │ Panna: 388                           │       │
│  │ Single: 3+8+8 = 19 → 9              │       │
│  │                                      │       │
│  │ (if Close session, also shows Jodi)  │       │
│  └──────────────────────────────────────┘       │
│                                                  │
│  [CANCEL]            [DECLARE RESULT]            │
│                                                  │
└─────────────────────────────────────────────────┘

Preview box:
├── Background: var(--color-warning-light)
├── Border: 1px dashed var(--color-warning)
├── Shows live calculation as admin types
├── Confirmation dialog after clicking Declare
```

---

## 14. NAVIGATION & LAYOUT PATTERNS

### 14.1 Admin Panel Layout
```
┌────────────────────────────────────────────────────────┐
│ ≡  MatkaPlatform          🔍 Search    🔔 3  👤 Admin │ ← Header (72px)
├──────────┬─────────────────────────────────────────────┤
│          │                                             │
│ SIDEBAR  │  CONTENT AREA                               │
│ (260px)  │  (bg: #F5F7FA)                              │
│          │                                             │
│ Dashboard│  ┌─ Page Title ──────────────────────┐     │
│          │  │  Breadcrumb: Dashboard > Leaders   │     │
│ Leaders ▾│  └────────────────────────────────────┘     │
│  └SM     │                                             │
│  └Master │  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐         │
│  └Users  │  │Stat │ │Stat │ │Stat │ │Stat │         │
│  └Spcl   │  │Card │ │Card │ │Card │ │Card │         │
│          │  └─────┘ └─────┘ └─────┘ └─────┘         │
│ Manage ▾ │                                             │
│          │  ┌─────────────────────────────────┐       │
│ Client ▾ │  │  Data Table / Content            │       │
│          │  │                                  │       │
│Settlement│  │                                  │       │
│          │  │                                  │       │
│ Content ▾│  └─────────────────────────────────┘       │
│          │                                             │
│ Settings▾│                                             │
│          │                                             │
└──────────┴─────────────────────────────────────────────┘
```

### 14.2 Sidebar Design (Dark Theme)
```css
SIDEBAR:
├── Background: #1E293B (dark slate)
├── Width: 260px (expanded), 72px (collapsed)
├── Transition: width 300ms ease
├── Logo area: 72px height, centered logo
├── Scroll: Internal scroll if items overflow

MENU ITEM (Inactive):
├── Height: 44px
├── Padding: 0 20px
├── Icon: 20px, color #94A3B8 (muted)
├── Text: 14px Poppins Medium, color #CBD5E1
├── Hover: Background #334155, transition 150ms

MENU ITEM (Active):
├── Background: #2563EB (primary blue)
├── Border Radius: 8px (with 8px margin on sides)
├── Icon: 20px, color White
├── Text: 14px Poppins SemiBold, color White

SUBMENU:
├── Indented 20px from parent
├── Items slightly smaller (13px)
├── Active indicator: 3px left border, primary blue
├── Background: rgba(255,255,255,0.05)

COLLAPSE TOGGLE:
├── Bottom of sidebar
├── Icon: ChevronLeft (expanded) / ChevronRight (collapsed)
├── Collapsed: Only icons shown, tooltip on hover
```

### 14.3 Header Design
```css
HEADER:
├── Height: 72px
├── Background: White
├── Border Bottom: 1px solid var(--color-border)
├── Shadow: var(--shadow-xs)
├── Padding: 0 24px
├── Display: Flex, align-center, justify-between
├── Sticky: top 0, z-index 50

LEFT SIDE:
├── Hamburger menu (mobile only)
├── Search bar: 320px width, rounded-full, icon prefix

RIGHT SIDE:
├── Notification bell: Icon button, badge showing count
├── User avatar: 36px circle, click opens dropdown
├── Dropdown: Name, Role badge, Settings link, Logout
```

### 14.4 User Page Layout (Mobile-First)
```
┌────────────────────────────────────────┐
│ LOGO          Coins: 10,000    👤     │ ← Header
│               Used Limit: 0          │
├────────────────────────────────────────┤
│ 📢 INSTANT HELP — WHATSAPP...        │ ← Marquee
├────────────────────────────────────────┤
│ ┌────────────────────────────────────┐│
│ │    Banner Carousel (3 slides)      ││
│ │    Share ID • Trusted • Instant    ││
│ └────────────────────────────────────┘│
├────────────────────────────────────────┤
│ [MATKA]  [LOTTERY MATKA (disabled)]   │ ← Tabs
├────────────────────────────────────────┤
│                                        │
│  ┌──────────────────────────────────┐ │
│  │ SRIDEVI OPEN                     │ │
│  │ 388 — ⁹⁰ — 280                  │ │ ← Result cards
│  │ SRIDEVI चार्ट                    │ │    (scrolling feed)
│  └──────────────────────────────────┘ │
│                                        │
│  ┌──────────────────────────────────┐ │
│  │ KALYAN CLOSE                     │ │
│  │ 147 — ²⁰ — 145                  │ │
│  │ KALYAN चार्ट                     │ │
│  └──────────────────────────────────┘ │
│                                        │
│  ... more results ...                  │
│                                        │
│                          [💬 WhatsApp] │ ← Floating button
├────────────────────────────────────────┤
│ [🏠 Home] [🎯 Bet] [📊 Chart] [👤]  │ ← Bottom navigation
└────────────────────────────────────────┘
```

### 14.5 Bottom Navigation (User Page — Mobile)
```css
BOTTOM NAV:
├── Height: 64px
├── Background: White
├── Border Top: 1px solid var(--color-border)
├── Shadow: 0 -2px 10px rgba(0,0,0,0.05)
├── Display: Flex, 4 equal items
├── Fixed: bottom 0
├── z-index: 50
├── Safe area padding for notch phones

NAV ITEM:
├── Icon: 24px, centered
├── Label: 11px, below icon
├── Inactive: var(--color-text-tertiary)
├── Active: var(--color-primary), font-weight 600
├── Active indicator: 3px top border, primary blue
```

---

## 15. ADMIN PANEL — PAGE-BY-PAGE DESIGN SPEC

### 15.1 Dashboard Page
- 4 stat cards (top row)
- P/L area chart + Game distribution donut chart (second row)
- Upcoming results timeline (third row)
- Recent bets live stream (fourth row)
- All widgets in white cards with shadow-card
- Refresh button on each widget
- Real-time updates via WebSocket

### 15.2 Leaders Pages (Super Masters, Masters, Users, Special)
- Table with all columns as defined in PRD
- Quick action buttons (D, W, L, C, P) per row
- Grand total row at bottom (sticky)
- Create button (top right, primary)
- Search + Filter toolbar
- CSV/PDF export
- Active/Blocked tabs
- Click row to open member detail page

### 15.3 Manage Game Pages
- Game list: Card grid showing all games with status indicators
- Add Game: Form in modal or dedicated page
- Declare Result: Two-step form with live preview
- Manage: Edit/disable/delete with inline actions

### 15.4 Client Pages
- Account list with comprehensive columns
- Add/Withdraw coins: Modal with amount input
- Account detail: Full history, P/L, bet records
- Create account: Full form with role selection

### 15.5 Settlement Page
- Match Rollback: Table of settled matches with Roll Back buttons
- Confirmation modal with impact summary before rollback

### 15.6 Content Pages
- Announcements: CRUD list with rich text editor
- Banners: Image upload with drag-and-drop, preview, ordering
- Rules: Rich text editor
- WhatsApp: Single field update

### 15.7 Settings Pages
- Change Password: Form with user search/selection
- DB Backup: Button + history list
- Block Bets: Toggle switches per game/bet type
- Block IDs: Search + toggle, list of blocked IDs

---

## 16. SUPER MASTER PANEL — DESIGN SPEC
- Same layout structure as Admin (sidebar + content)
- Sidebar: Fewer items (no Settings, no Content, no Manage Game)
- Color accent: Purple (#7C3AED) instead of blue for role distinction
- Dashboard: Not required (direct to member management)
- Tables: Same design system, scoped to their downline only

---

## 17. MASTER PANEL — DESIGN SPEC
- Same as Super Master but even fewer options
- Color accent: Cyan (#0891B2)
- Can only manage Users
- Same table/form design system

---

## 18. USER PAGE — DESIGN SPEC
- Mobile-first, clean, simple
- Color accent: Emerald (#059669)
- No sidebar — bottom navigation on mobile, top nav on desktop
- Focus on: Results feed, Betting interface, Charts, Profile
- Betting page: Full-screen experience on mobile
- Charts: Responsive grid, scrollable horizontally on mobile
- WhatsApp floating button: Always visible

---

## 19. REAL-TIME UI PATTERNS

### 19.1 Live Data Indicators
```
LIVE DOT:
├── 8px circle, green (#22C55E)
├── Pulsing animation: scale 1 → 1.5 → 1, opacity 1 → 0.5 → 1
├── Duration: 2s, infinite loop
├── Used next to: Live results, active games, real-time stats

COUNTDOWN TIMER:
├── Font: Poppins SemiBold, 16px
├── Color: var(--color-warning) when < 5 minutes
├── Color: var(--color-text-primary) when > 5 minutes
├── Format: HH:MM:SS
├── Updates every second (client-side)
├── Flash animation when reaching 00:00

WALLET BALANCE UPDATE:
├── When balance changes: Brief green/red flash on the number
├── Number counts up/down to new value (300ms animation)
├── Small toast notification: "+₹1,000" or "-₹500"
```

### 19.2 Result Declaration Animation
When a new result is broadcast:
```
1. New card slides in from top (translateY -100% → 0)
2. Brief highlight/glow effect (box-shadow pulse)
3. Result numbers fade in sequentially (Panna → Jodi → Close Panna)
4. Duration: 600ms total
5. Existing cards shift down smoothly
```

---

## 20. MOBILE RESPONSIVE DESIGN

### 20.1 Breakpoints
```css
--mobile:  < 640px   (phones)
--tablet:  640px - 1024px  (tablets, small laptops)
--desktop: > 1024px  (laptops, desktops)
--wide:    > 1440px  (large monitors)
```

### 20.2 Mobile Adaptations
- Sidebar → Hidden, accessible via hamburger menu (drawer overlay)
- Tables → Convert to card-based layout
- Stat cards → 1 column, swipeable horizontally
- Charts → Full width, reduced height
- Forms → Single column
- Modals → Full screen on mobile (bottom sheet style)
- Header → Compact, essential info only
- Touch targets → Minimum 44px × 44px

### 20.3 Mobile-Specific Components
- Pull-to-refresh on results feed
- Swipe actions on bet history cards (view details)
- Bottom sheet modals for quick actions
- Sticky bet button when scrolling betting page

---

## 21. MICRO-INTERACTIONS & ANIMATIONS

### 21.1 Framer Motion Usage
```jsx
// Page transitions
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3, ease: "easeOut" }}
>

// Staggered list items
<motion.div
  initial={{ opacity: 0, y: 10 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: index * 0.05 }}
>

// Hover card lift
<motion.div whileHover={{ y: -2, boxShadow: "0 8px 25px rgba(0,0,0,0.1)" }}>
```

### 21.2 Animation Guidelines
- Duration: 150-300ms for UI feedback, 300-600ms for content transitions
- Easing: `ease-out` for entrances, `ease-in` for exits, `ease-in-out` for state changes
- Stagger: 30-50ms between list items
- Performance: Use `transform` and `opacity` only (GPU-accelerated)
- Reduced motion: Respect `prefers-reduced-motion` media query

---

## 22. DARK MODE SPECIFICATION

### 22.1 Dark Mode Support (Optional — Phase 2)
Not required for launch but architecture should support it:
- All colors via CSS variables
- Toggle in Settings
- Sidebar already dark — remains same
- Content area: #0F172A background, #1E293B cards
- Text: Invert the hierarchy (primary → #F1F5F9, secondary → #94A3B8)

---

## 23. EMPTY STATES & LOADING STATES

### 23.1 Empty State Design
```
┌─────────────────────────────────────────┐
│                                         │
│           📊 (large icon, 64px, muted)  │
│                                         │
│     No bets placed today               │
│     (16px, Poppins Medium, muted)       │
│                                         │
│     Start by selecting a game and      │
│     placing your first bet.            │
│     (14px, Poppins Regular, muted)      │
│                                         │
│     [Place a Bet] (primary button)      │
│                                         │
└─────────────────────────────────────────┘
```

### 23.2 Loading States
```
SKELETON LOADING:
├── Use for initial page loads
├── Animated gradient shimmer (left to right)
├── Match the shape of actual content
├── Background: #E2E8F0 → #F1F5F9 → #E2E8F0 (shimmer)
├── Duration: 1.5s loop
├── Use for: Cards, tables, charts

SPINNER:
├── 24px circle, 2px border
├── Color: var(--color-primary)
├── Animation: rotate 360deg, 800ms, linear, infinite
├── Use for: Button loading states, inline data fetching

PROGRESS BAR:
├── Height: 3px, top of page
├── Color: var(--color-primary)
├── Indeterminate animation
├── Use for: Page navigation loading
```

---

## 24. TOAST, NOTIFICATION & ALERT DESIGN

### 24.1 Toast Notifications
```
SUCCESS TOAST:
┌─────────────────────────────────────┐
│ ✅  Bet placed successfully!        │
│     Bet ID: BET-PL519-001         │
└─────────────────────────────────────┘
├── Position: Top right
├── Background: White, border-left 4px green
├── Shadow: var(--shadow-lg)
├── Auto dismiss: 4 seconds
├── Slide in from right

ERROR TOAST:
├── Same structure, border-left 4px red
├── Auto dismiss: 6 seconds (longer for errors)

WIN NOTIFICATION (Special):
┌─────────────────────────────────────┐
│ 🎉  Congratulations!               │
│     You won ₹16,000 on JODI 90!   │
│     KALYAN OPEN                    │
└─────────────────────────────────────┘
├── Larger, more prominent
├── Background: Gradient green-to-emerald
├── Text: White
├── Confetti animation (subtle)
├── Sound: Optional victory chime
├── Duration: 8 seconds or manual dismiss
```

### 24.2 Confirmation Dialogs
```
For destructive actions (Rollback, Block, Delete):
┌─────────────────────────────────────────┐
│  ⚠️  Are you sure?                     │
│                                         │
│  Rolling back KALYAN OPEN (Feb 08)     │
│  will reverse all settlements for       │
│  this match including:                  │
│  • 45 winner payouts (₹4,56,789)       │
│  • 1,234 bet status changes            │
│                                         │
│  This action cannot be undone easily.   │
│                                         │
│  [Cancel]          [Yes, Roll Back]     │
│  (ghost)           (danger button)      │
└─────────────────────────────────────────┘

├── Overlay: var(--color-bg-overlay)
├── Modal: White, shadow-xl, radius-xl
├── Max width: 480px
├── Centered vertically and horizontally
├── Close on Escape key
├── Focus trap inside modal
```

---

## 25. ACCESSIBILITY REQUIREMENTS

### 25.1 Minimum Standards
- All interactive elements: Keyboard accessible
- Focus indicators: 2px outline, primary blue, 2px offset
- Color contrast: WCAG AA minimum (4.5:1 for text, 3:1 for large text)
- Screen reader: Proper ARIA labels on icons, buttons, status indicators
- Touch targets: Minimum 44px × 44px on mobile
- Error messages: Connected to inputs via aria-describedby
- Loading states: aria-busy="true" and aria-live="polite" for dynamic content

---

## 26. DESIGN TOKENS (CSS VARIABLES)

### 26.1 Complete CSS Variables File
```css
:root {
  /* Typography */
  --font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

  /* Colors — defined in Section 5 */
  /* Spacing — defined in Section 6 */
  /* Shadows — defined in Section 5 */
  /* Radii — defined in Section 6 */

  /* Layout */
  --sidebar-width: 260px;
  --sidebar-collapsed: 72px;
  --header-height: 72px;
  --content-max-width: 1440px;
  --content-padding: 24px;
  --bottom-nav-height: 64px;

  /* Transitions */
  --transition-fast: 150ms ease;
  --transition-normal: 300ms ease;
  --transition-slow: 500ms ease;

  /* Z-Index Scale */
  --z-base: 0;
  --z-dropdown: 10;
  --z-sticky: 20;
  --z-fixed: 30;
  --z-modal-backdrop: 40;
  --z-modal: 50;
  --z-popover: 60;
  --z-tooltip: 70;
  --z-toast: 80;
}

@media (max-width: 640px) {
  :root {
    --content-padding: 16px;
  }
}
```

---

## 27. IMPLEMENTATION GUIDELINES FOR AI AGENT

### 27.1 For Gemini (UI/UX Phase)
When Gemini takes over for UI/UX polish:
1. **DO NOT** touch any backend logic, API calls, state management, or Socket.io connections
2. **DO** modify: className attributes, Tailwind classes, component structure for layout, CSS variables
3. **DO** add: Framer Motion animations, responsive breakpoints, skeleton loading states
4. **DO** ensure: All interactive elements have hover/active/focus states
5. **DO** follow: This DRD exactly — colors, spacing, typography, component patterns
6. **DO NOT** change: Any variable names, function names, API endpoints, or data structures

### 27.2 Component Naming Convention
```
// Naming pattern: [Domain][Component][Variant]
DashboardStatCard
DashboardChart
TableDataTable
TableGrandTotalRow
FormBetPlacement
FormDeclareResult
CardGameResult
CardBetType
NavSidebar
NavBottomMobile
ModalConfirmation
ModalCreateAccount
ToastNotification
ToastWinCelebration
```

### 27.3 Tailwind Custom Configuration
```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      fontFamily: {
        sans: ['Poppins', ...defaultTheme.fontFamily.sans],
      },
      colors: {
        primary: { DEFAULT: '#2563EB', hover: '#1D4ED8', light: '#EFF6FF', 50: '#DBEAFE' },
        sidebar: { DEFAULT: '#1E293B', hover: '#334155' },
        body: '#F5F7FA',
        // ... all colors from Section 5
      },
      borderRadius: {
        'card': '12px',
        'widget': '16px',
        'pill': '9999px',
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0, 0, 0, 0.08)',
        // ... all shadows from Section 5
      },
    },
  },
};
```

### 27.4 Quality Checklist
Before considering any page complete:
- [ ] Matches Rylix dashboard aesthetic
- [ ] All numbers use tabular-nums and Indian formatting
- [ ] Grand total row present on all tables
- [ ] Responsive on mobile (test at 375px width)
- [ ] Loading skeleton present
- [ ] Empty state present
- [ ] Error states handled
- [ ] All buttons have hover/active states
- [ ] Keyboard navigation works
- [ ] P/L colors correct (green positive, red negative)
- [ ] Real-time updates connected and animating
- [ ] No horizontal scroll on any viewport

---

**END OF DRD — This document serves as the complete design specification for the Matka Betting Platform UI/UX.**
