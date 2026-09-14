# Sports Module Test Automation Architecture & Specifications

## 1. Overview
This document outlines the test automation implementation for the **Sports Module** within `mana-community-app`. It complements the existing Event module test automation to provide full end-to-end regression protection across scoring calculations, tournament constraints, player eligibility rules, auction mechanics, API services, and role-based permissions.

---

## 2. Test Architecture & Directory Structure

```
src/
├── app/
│   └── components/
│       └── sports/
│           └── utils/
│               ├── cricketUtils.ts
│               └── cricketUtils.test.ts          # Cricket scoring, ball colors, remaining balls, RRR
├── services/
│   └── sports/
│       ├── sportsDashboardService.ts
│       ├── sportsEventService.ts
│       ├── sportsService.ts
│       ├── auctionService.ts
│       ├── sportsScheduleService.ts
│       └── sportsServices.test.ts               # Service API mocks, dashboard KPIs, registration & auction bids
└── utils/
    ├── sportsValidationUtils.ts                 # Tournament/event windows, age checks, rosters, purse checks
    ├── sportsValidationUtils.test.ts            # Business rules & boundary conditions
    └── permissionUtils.test.ts                  # Sports permissions & SPORTS_ADMIN role matrix
```

---

## 3. Test Suites & Coverage

### A. Cricket Scoring & Utility Suite (`cricketUtils.test.ts`)
1. **Ball Color Badges**:
   * Wickets (`"W"`) $\rightarrow$ Red (`bg-red-100 text-red-700`)
   * Fours (`"4"`) $\rightarrow$ Emerald (`bg-emerald-100 text-emerald-700`)
   * Sixes (`"6"`) $\rightarrow$ Purple (`bg-purple-100 text-purple-700`)
   * Extras (`"wd"`, `"nb"`) $\rightarrow$ Amber (`bg-amber-100 text-amber-700`)
   * Dot balls (`"0"`) $\rightarrow$ Slate (`bg-slate-100 text-slate-400`)
   * Normal runs (`"1"`, `"2"`, `"3"`) $\rightarrow$ Blue (`bg-blue-100 text-blue-700`)
2. **Remaining Balls Engine**:
   * Default 20-over T20 match ball subtraction (`15.4` overs bowled $\rightarrow$ 26 balls left).
   * Custom max overs support (10 overs, 50 overs).
   * Overrun protection (overs > maxOvers clamps safely to 0).
3. **Required Run Rate (RRR)**:
   * Dynamic calculation based on target, current score, and remaining balls.
   * Clamping to `"0.00"` on victory/target achieved.
   * Returning `"-"` when overs expire.

### B. Sports Business Validation Suite (`sportsValidationUtils.test.ts`)
1. **Tournament & Event Dates**:
   * Ensures tournament end date $\ge$ start date.
   * Validates that sports events fall strictly within parent tournament date windows.
2. **Age & Category Eligibility**:
   * Calculates precise age based on reference date and leap year / month boundaries.
   * Evaluates min/max age rules (e.g. Under-16, Veterans).
   * Verifies `playersBornAfter` cutoff dates.
3. **Roster & Mixed Doubles Rules**:
   * Validates min/max player counts for teams.
   * Enforces mandatory Mixed Doubles gender ratio (at least 1 Male and 1 Female player).
4. **Auction Engine Rules**:
   * Enforces minimum bid increment over current bid.
   * Validates reserve base price constraints.
   * Prevents bids exceeding available team purse budget.
   * Accurately calculates remaining team purse.
5. **Registration Capacity & Lifecycle**:
   * Evaluates `OPEN`, `CLOSED`, `FULL`, and `UPCOMING` states based on registration schedule and participant limits.

### C. Sports Service Layer Integration Suite (`sportsServices.test.ts`)
1. **`sportsDashboardService`**:
   * Verifies `/sports/dashboard/stats` KPI retrieval.
   * Verifies `/sports/dashboard/upcoming` upcoming match cards.
   * Verifies `/sports/dashboard/open-tournaments` open tournament cards.
2. **`sportsEventService` & `sportsService`**:
   * Normalizes backend payloads through `mapEvent`.
   * Submits event registration payloads to `/sports/events/register`.
   * Handles partner invitation responses (`/sports/events/partner-invitations/:id/respond`).
   * Fetches tournament schedule stats (`/sports/schedule/stats`).
3. **`auctionService`**:
   * Fetches auction live status and team budgets.
   * Dispatches bids to `/sports/auctions/bid`.
4. **Rejection & Error Handling**:
   * Validates error propagation for full capacity rejections and auction budget exhaustion.

### D. Permission & Security Matrix Suite (`permissionUtils.test.ts`)
* Validates `SPORTS` module access.
* Tests permissions: `VIEW_SPORTS_MAIN`, `CREATE_EDIT_SPORTS_MAIN`, `DELETE_SPORTS_MAIN`, `VIEW_SPORTS_MENU`, `CREATE_EDIT_SPORTS_MENU`, `DELETE_SPORTS_MENU`.
* Validates `ROLE_SPORTS_ADMIN` capabilities vs regular `ROLE_MEMBER`.

---

## 4. Execution & Verification

Run all test suites via Vitest:
```bash
npm test
```
Or run specifically in watch mode:
```bash
npm run test:watch
```
