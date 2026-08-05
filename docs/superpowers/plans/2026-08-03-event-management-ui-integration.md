# Event Management UI Integration — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Port 15 Figma-exported event management components into the mana-community-app, adapting them to use the app's indigo palette, shadcn/ui components, CSS animations, and routing patterns.

**Architecture:** Each Figma component is copied into `src/app/components/events/`, then transformed: `motion/react` → CSS classes, custom form elements → shadcn/ui imports, orange/amber → indigo/violet. An `EventsLayout` modeled on `SportsLayout` provides breadcrumb + pill nav. Routes nest under `/events` with `PermissionGuard`.

**Tech Stack:** React 19, React Router v7, Tailwind v4, shadcn/ui (48 components), Recharts 3.8.1, Lucide icons

## Global Constraints

- No new npm dependencies — `motion`/`framer-motion` must NOT be added
- All colors must use the app's indigo/violet palette (`#4f46e5` primary, `#7c3aed` accent)
- Replace all `motion.div` with plain `<div>` using `animate-fade-in-up` and `stagger-N` CSS classes
- Replace all custom inline form elements with shadcn/ui imports from `@/app/components/ui/`
- Import `cn` from `@/app/components/ui/utils` — never define locally
- All mock data stays hardcoded with `// TODO: wire to eventService` comment at the top of each data block
- Follow the `SportsLayout.tsx` pattern exactly for layout/breadcrumb/nav
- Wrap routes with `<PermissionGuard>` using existing permission constants from `src/constants/permissions.ts`

## File Map

**Create (16 files):**
- `src/app/components/events/EventsLayout.tsx` — sub-module shell
- `src/app/components/events/EventsDashboard.tsx` — index page
- `src/app/components/events/EventsCreate.tsx` — 6-step wizard
- `src/app/components/events/EventsPlanning.tsx` — milestones + task board
- `src/app/components/events/EventsRegistration.tsx` — admin registration table
- `src/app/components/events/EventsUserRegistration.tsx` — public 4-step wizard
- `src/app/components/events/EventsPrograms.tsx` — day schedule timeline
- `src/app/components/events/EventsVolunteers.tsx` — departments + directory
- `src/app/components/events/EventsSponsors.tsx` — packages + sponsor list
- `src/app/components/events/EventsDonations.tsx` — donation ledger
- `src/app/components/events/EventsAuction.tsx` — bid items + live feed
- `src/app/components/events/EventsFood.tsx` — menu prep + stock
- `src/app/components/events/EventsFinance.tsx` — budget charts + ledger
- `src/app/components/events/EventsVenue.tsx` — zone occupancy + facilities
- `src/app/components/events/EventsGallery.tsx` — albums + photo grid
- `src/app/components/events/EventsReports.tsx` — report cards + analytics

**Rename (1 file):**
- `src/app/components/events/Events.tsx` → `src/app/components/events/Events.legacy.tsx`

**Modify (1 file):**
- `src/app/routes.tsx` — replace flat events route with nested group, update CPN import

---

### Task 1: Scaffold — EventsLayout + Routing + Legacy Rename

**Files:**
- Rename: `src/app/components/events/Events.tsx` → `src/app/components/events/Events.legacy.tsx`
- Create: `src/app/components/events/EventsLayout.tsx`
- Create: `src/app/components/events/EventsDashboard.tsx` (placeholder)
- Modify: `src/app/routes.tsx`

**Interfaces:**
- Consumes: `SportsLayout.tsx` pattern, `PermissionGuard` component, permission constants
- Produces: `/events` route group with `EventsLayout` shell, `/events` index renders `EventsDashboard`

- [ ] **Step 1: Rename Events.tsx to Events.legacy.tsx**

```bash
cd "D:/Application/applications/mana community/mana-community-app"
mv src/app/components/events/Events.tsx src/app/components/events/Events.legacy.tsx
```

- [ ] **Step 2: Create EventsLayout.tsx**

Create `src/app/components/events/EventsLayout.tsx` modeled on SportsLayout:

```tsx
import { NavLink, Outlet, useLocation } from "react-router";
import {
  LayoutDashboard, CalendarDays, ClipboardList, Users, Ticket,
  Mic2, HandHeart, Gem, Gavel, UtensilsCrossed, Landmark,
  MapPin, ImageIcon, BarChart3, ChevronRight, PlusCircle, UserCheck,
} from "lucide-react";
import { useAuth } from "../../../contexts/AuthContext";
import { VIEW_EVENTS, CREATE_EVENT, REGISTER_EVENT } from "../../../constants/permissions";

const navItems = [
  { to: "/events",              label: "Dashboard",    icon: LayoutDashboard, end: true  },
  { to: "/events/create",      label: "Create Event", icon: PlusCircle       },
  { to: "/events/planning",    label: "Planning",     icon: ClipboardList    },
  { to: "/events/registration",label: "Registration", icon: Ticket           },
  { to: "/events/register",    label: "Public Reg.",  icon: UserCheck        },
  { to: "/events/programs",    label: "Programs",     icon: Mic2             },
  { to: "/events/volunteers",  label: "Volunteers",   icon: Users            },
  { to: "/events/sponsors",    label: "Sponsors",     icon: Gem              },
  { to: "/events/donations",   label: "Donations",    icon: HandHeart        },
  { to: "/events/auction",     label: "Auction",      icon: Gavel            },
  { to: "/events/food",        label: "Food",         icon: UtensilsCrossed  },
  { to: "/events/finance",     label: "Finance",      icon: Landmark         },
  { to: "/events/venue",       label: "Venue",        icon: MapPin           },
  { to: "/events/gallery",     label: "Gallery",      icon: ImageIcon        },
  { to: "/events/reports",     label: "Reports",      icon: BarChart3        },
];

export function EventsLayout() {
  const { hasPermission } = useAuth();
  const location = useLocation();

  const activeItem = navItems.find((item) =>
    item.end ? location.pathname === item.to : location.pathname.startsWith(item.to)
  );

  const visibleNav = navItems.filter((nav) => {
    if (nav.label === "Create Event") return hasPermission(CREATE_EVENT);
    if (nav.label === "Public Reg.") return hasPermission(REGISTER_EVENT);
    return hasPermission(VIEW_EVENTS);
  });

  return (
    <div className="flex flex-col gap-4 h-full min-h-0">
      <div className="shrink-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2 text-xs" style={{ color: "#6b7094" }}>
          <span>Home</span>
          <ChevronRight className="h-3 w-3" />
          <span style={{ color: "#4f46e5" }}>Events</span>
          {activeItem && activeItem.label !== "Dashboard" && (
            <>
              <ChevronRight className="h-3 w-3" />
              <span style={{ color: "#4f46e5" }}>{activeItem.label}</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-3 sm:text-right sm:justify-end">
          <div className="text-left sm:text-right">
            <h2 className="text-xl font-bold leading-tight" style={{ color: "#0d0d2b" }}>Event Management</h2>
            <p className="text-xs" style={{ color: "#6b7094" }}>
              Planning, Registration, Finance & more
            </p>
          </div>
          <div
            className="h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0 order-first sm:order-last"
            style={{ background: "linear-gradient(135deg, #4f46e5, #7c3aed)" }}
          >
            <CalendarDays className="h-4.5 w-4.5 text-white" />
          </div>
        </div>
      </div>

      <div
        className="rounded-xl p-1.5 flex items-center gap-1 overflow-x-auto shrink-0"
        style={{
          background: "white",
          border: "1px solid rgba(99, 102, 241, 0.12)",
          boxShadow: "rgba(99, 102, 241, 0.06) 0px 2px 12px",
        }}
      >
        {visibleNav.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className="flex-shrink-0">
            {({ isActive }) => (
              <div
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 cursor-pointer"
                style={
                  isActive
                    ? {
                        background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
                        color: "white",
                        boxShadow: "0 2px 12px rgba(99, 102, 241, 0.35)",
                      }
                    : { color: "rgb(107, 112, 148)", background: "transparent" }
                }
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = "rgba(99, 102, 241, 0.08)";
                    e.currentTarget.style.color = "#4f46e5";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "rgb(107, 112, 148)";
                  }
                }}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {label}
              </div>
            )}
          </NavLink>
        ))}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto hide-scrollbar">
        <Outlet />
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create placeholder EventsDashboard.tsx**

Create `src/app/components/events/EventsDashboard.tsx`:

```tsx
export function EventsDashboard() {
  return (
    <div className="text-center py-20 text-slate-400">
      <p className="text-lg font-semibold">Event Dashboard</p>
      <p className="text-sm mt-1">Coming in Task 2</p>
    </div>
  );
}
```

- [ ] **Step 4: Update routes.tsx**

In `src/app/routes.tsx`:

1. Change the Events import from:
```tsx
import { Events } from "./components/events/Events";
```
to:
```tsx
import { Events } from "./components/events/Events.legacy";
import { EventsLayout } from "./components/events/EventsLayout";
import { EventsDashboard } from "./components/events/EventsDashboard";
```

2. Replace the flat events route (around line 342-345):
```tsx
{ 
  path: "events", 
  element: <PermissionGuard permission={VIEW_EVENTS} requiredModule="EVENTS"><Events /></PermissionGuard> 
},
```
with:
```tsx
{
  path: "events",
  element: <PermissionGuard permission={VIEW_EVENTS} requiredModule="EVENTS"><EventsLayout /></PermissionGuard>,
  children: [
    { index: true, element: <EventsDashboard /> },
  ],
},
```

3. The CPN route at `{ path: "events", element: <Events /> }` (around line 502) continues using `Events` from `Events.legacy` — no change needed since the import alias `Events` now points to the legacy file.

- [ ] **Step 5: Verify in browser**

```bash
cd "D:/Application/applications/mana community/mana-community-app"
npm run dev
```

Navigate to `/events` — should see the EventsLayout shell (breadcrumb + pill nav) with the placeholder dashboard. Verify pill nav items render and the breadcrumb shows "Home > Events". Verify `/cpn/events` still renders the legacy Events page.

- [ ] **Step 6: Commit**

```bash
git add src/app/components/events/Events.legacy.tsx src/app/components/events/EventsLayout.tsx src/app/components/events/EventsDashboard.tsx src/app/routes.tsx
git commit -m "feat(events): scaffold EventsLayout with nested routing and pill nav"
```

---

### Task 2: EventsDashboard — KPIs, Charts, Lists

**Files:**
- Modify: `src/app/components/events/EventsDashboard.tsx` (replace placeholder)

**Interfaces:**
- Consumes: Recharts (installed), Lucide icons (installed)
- Produces: Full dashboard at `/events` with 8 KPI tiles, 3 charts, event list, task list

**Source reference:** `D:\Application\applications\backup\Figma AI\event\Sports Scheduler Page\src\app\components\events\EventsDashboard.tsx` (239 lines)

- [ ] **Step 1: Port EventsDashboard with adaptations**

Copy the source file's content into `src/app/components/events/EventsDashboard.tsx` and apply these transformations:

1. Remove `import { motion } from "motion/react"` — replace all `<motion.div>` with `<div className="animate-fade-in-up stagger-N">` where N is the item index (capped at 8)
2. Color swaps in the code:
   - `#ea580c` → `#4f46e5` (chart strokes, gradients, bar fills)
   - `hover:shadow-[0_4px_20px_rgba(234,88,12,0.1)]` → `hover:shadow-[0_4px_20px_rgba(99,102,241,0.1)]`
   - `text-orange-600` → `text-indigo-600`
   - `bg-orange-500` inline → `bg-indigo-500` (the bar chart "spent" bar)
   - `#fff7ed` (orange bg for first KPI) → `#eef2ff` (indigo bg)
3. In the `categoryPie` array, change `color: "#ea580c"` to `color: "#4f46e5"`
4. In `upcomingEvents`, change `color: "#ea580c"` to `color: "#4f46e5"`
5. In the budget chart legend, change `bg-orange-500` → `bg-indigo-500`
6. In "View all" button, change `text-orange-600` → `text-indigo-600`
7. Add `// TODO: wire to eventService` comment above each mock data array

- [ ] **Step 2: Verify in browser**

Navigate to `/events` — should see 8 KPI tiles with icons, AreaChart, PieChart donut, BarChart, upcoming events list, and pending tasks. All accent colors should be indigo, not orange.

- [ ] **Step 3: Commit**

```bash
git add src/app/components/events/EventsDashboard.tsx
git commit -m "feat(events): add EventsDashboard with KPIs, charts, and task list"
```

---

### Task 3: EventsCreate — 6-Step Wizard

**Files:**
- Create: `src/app/components/events/EventsCreate.tsx`
- Modify: `src/app/routes.tsx` (add route)

**Interfaces:**
- Consumes: shadcn/ui `Input`, `Textarea`, `Button`, `Switch`, `Select`, `Badge`
- Produces: 6-step event creation wizard at `/events/create`

**Source reference:** `D:\Application\applications\backup\Figma AI\event\Sports Scheduler Page\src\app\components\events\EventsCreate.tsx` (698 lines)

- [ ] **Step 1: Port EventsCreate with adaptations**

Copy the source and apply:

1. Remove `motion` and `AnimatePresence` imports — use CSS transitions
2. Replace custom `Label`, `Input`, `Textarea`, `Toggle` sub-components with shadcn/ui:
   ```tsx
   import { Input } from "@/app/components/ui/input";
   import { Textarea } from "@/app/components/ui/textarea";
   import { Button } from "@/app/components/ui/button";
   import { Switch } from "@/app/components/ui/switch";
   import { Label } from "@/app/components/ui/label";
   import { Badge } from "@/app/components/ui/badge";
   import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
   import { cn } from "@/app/components/ui/utils";
   ```
3. Color swaps:
   - All `from-orange-500 to-amber-400` → `from-indigo-600 to-violet-500`
   - `bg-orange-*` → `bg-indigo-*`
   - `text-orange-*` → `text-indigo-*`
   - `focus:ring-orange-50` → `focus:ring-indigo-50`
   - Step progress gradient: `#ea580c` → `#4f46e5`, `#f59e0b` → `#7c3aed`
   - Publish button: keep emerald gradient (it's a success action)
4. Replace `<AnimatePresence mode="wait">` step transitions with a simple conditional render — each step is shown/hidden based on `step` state
5. Replace `<motion.div>` wrappers with `<div className="animate-fade-in-up">`
6. Add `// TODO: wire to eventService` comment

- [ ] **Step 2: Add route in routes.tsx**

Add import:
```tsx
import { EventsCreate } from "./components/events/EventsCreate";
```

Add as child of events route:
```tsx
{ path: "create", element: <PermissionGuard permission={CREATE_EVENT}><EventsCreate /></PermissionGuard> },
```

- [ ] **Step 3: Verify in browser**

Navigate to `/events/create` — walk through all 6 steps. Verify form inputs render, step navigation works, event type selection grid works, review step shows entered data, and submit shows success state.

- [ ] **Step 4: Commit**

```bash
git add src/app/components/events/EventsCreate.tsx src/app/routes.tsx
git commit -m "feat(events): add 6-step EventsCreate wizard"
```

---

### Task 4: EventsPlanning + EventsPrograms

**Files:**
- Create: `src/app/components/events/EventsPlanning.tsx`
- Create: `src/app/components/events/EventsPrograms.tsx`
- Modify: `src/app/routes.tsx` (add routes)

**Source references:**
- `EventsPlanning.tsx` (147 lines) — milestone timeline + task board
- `EventsPrograms.tsx` (133 lines) — day tabs + schedule timeline

- [ ] **Step 1: Port EventsPlanning**

Copy source, apply standard adaptations:
- Remove `motion` → use `animate-fade-in-up`
- Orange milestone fill/line colors → indigo (`#ea580c` → `#4f46e5`, `#f59e0b` → `#7c3aed`)
- Progress bar gradient → `from-indigo-600 to-violet-500`

- [ ] **Step 2: Port EventsPrograms**

Copy source, apply:
- Remove `motion` → use `animate-fade-in-up`
- Active day tab gradient → `linear-gradient(135deg, #4f46e5, #7c3aed)`
- `border-orange-100` hover → `border-indigo-100`
- `bg-orange-50/20` hover → `bg-indigo-50/20`

- [ ] **Step 3: Add routes**

Add imports and children to events route:
```tsx
import { EventsPlanning } from "./components/events/EventsPlanning";
import { EventsPrograms } from "./components/events/EventsPrograms";
```
```tsx
{ path: "planning", element: <EventsPlanning /> },
{ path: "programs", element: <EventsPrograms /> },
```

- [ ] **Step 4: Verify both pages in browser**

`/events/planning` — milestone strip with progress, task board with filter tabs.
`/events/programs` — 3-day tabs, vertical timeline with program entries.

- [ ] **Step 5: Commit**

```bash
git add src/app/components/events/EventsPlanning.tsx src/app/components/events/EventsPrograms.tsx src/app/routes.tsx
git commit -m "feat(events): add EventsPlanning and EventsPrograms pages"
```

---

### Task 5: EventsRegistration + EventsUserRegistration

**Files:**
- Create: `src/app/components/events/EventsRegistration.tsx`
- Create: `src/app/components/events/EventsUserRegistration.tsx`
- Modify: `src/app/routes.tsx`

**Source references:**
- `EventsRegistration.tsx` (145 lines) — admin registration table
- `EventsUserRegistration.tsx` (628 lines) — 4-step public registration wizard

- [ ] **Step 1: Port EventsRegistration (admin)**

Copy source, apply:
- Remove `motion` → `animate-fade-in-up`
- Replace custom search input with shadcn `Input`
- Replace custom buttons with shadcn `Button`
- Replace the HTML table with shadcn `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell`:
  ```tsx
  import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/app/components/ui/table";
  ```
- Color swaps: indigo throughout

- [ ] **Step 2: Port EventsUserRegistration (public wizard)**

Copy source (628 lines), apply:
- Remove `motion`/`AnimatePresence` → CSS transitions
- Replace custom `Label`, `Input`, `Select` with shadcn/ui
- Hero gradient: `#ea580c`/`#f59e0b` → `#4f46e5`/`#7c3aed`
- Step indicator: done=emerald (keep), active=orange → active=indigo
- Pass card gradient: orange/amber/yellow → indigo/violet/purple
- Payment buttons: `border-orange-200 bg-orange-50` → `border-indigo-200 bg-indigo-50`
- Confirm button: keep emerald gradient

- [ ] **Step 3: Add routes**

```tsx
import { EventsRegistration } from "./components/events/EventsRegistration";
import { EventsUserRegistration } from "./components/events/EventsUserRegistration";
```
```tsx
{ path: "registration", element: <EventsRegistration /> },
{ path: "register", element: <EventsUserRegistration /> },
```

- [ ] **Step 4: Verify in browser**

`/events/registration` — stats strip, searchable table, category tabs.
`/events/register` — hero, 4-step wizard through to digital pass.

- [ ] **Step 5: Commit**

```bash
git add src/app/components/events/EventsRegistration.tsx src/app/components/events/EventsUserRegistration.tsx src/app/routes.tsx
git commit -m "feat(events): add admin registration table and public registration wizard"
```

---

### Task 6: EventsVolunteers + EventsVenue

**Files:**
- Create: `src/app/components/events/EventsVolunteers.tsx`
- Create: `src/app/components/events/EventsVenue.tsx`
- Modify: `src/app/routes.tsx`

**Source references:**
- `EventsVolunteers.tsx` (151 lines) — dept cards + directory table
- `EventsVenue.tsx` (120 lines) — zone occupancy + facility status

- [ ] **Step 1: Port EventsVolunteers**

Copy source, apply:
- Remove `motion` → `animate-fade-in-up`
- Avatar gradient: `orange-to-amber` → `indigo-to-violet`
- Progress bars in dept cards: keep as-is (they use per-dept colors)
- Replace HTML table with shadcn `Table`

- [ ] **Step 2: Port EventsVenue**

Copy source, apply:
- Remove `motion` → `animate-fade-in-up`
- Live badge pulse: keep (uses generic colors)
- Zone card colors: keep per-zone scheme

- [ ] **Step 3: Add routes**

```tsx
import { EventsVolunteers } from "./components/events/EventsVolunteers";
import { EventsVenue } from "./components/events/EventsVenue";
```
```tsx
{ path: "volunteers", element: <EventsVolunteers /> },
{ path: "venue", element: <EventsVenue /> },
```

- [ ] **Step 4: Verify in browser, commit**

```bash
git add src/app/components/events/EventsVolunteers.tsx src/app/components/events/EventsVenue.tsx src/app/routes.tsx
git commit -m "feat(events): add EventsVolunteers and EventsVenue pages"
```

---

### Task 7: EventsSponsors + EventsDonations + EventsAuction

**Files:**
- Create: `src/app/components/events/EventsSponsors.tsx`
- Create: `src/app/components/events/EventsDonations.tsx`
- Create: `src/app/components/events/EventsAuction.tsx`
- Modify: `src/app/routes.tsx`

**Source references:**
- `EventsSponsors.tsx` (134 lines) — packages + sponsor list
- `EventsDonations.tsx` (116 lines) — donation ledger
- `EventsAuction.tsx` (180 lines) — bid items + live feed + leaderboard

- [ ] **Step 1: Port EventsSponsors**

Copy source, apply:
- Remove `motion` → `animate-fade-in-up`
- Collection progress gradient: `indigo-to-violet` → keep (already indigo)
- Logo circle gradient: `indigo-to-violet` → keep
- Color swaps on buttons/badges only

- [ ] **Step 2: Port EventsDonations**

Copy source, apply:
- Remove `motion` → `animate-fade-in-up`
- Progress bar: `rose-to-pink` gradient → keep (it represents donations, not the primary brand)
- Replace table with shadcn `Table`
- Color swap on buttons

- [ ] **Step 3: Port EventsAuction**

Copy source, apply:
- Remove `motion`/`AnimatePresence` → CSS for bid panel show/hide
- Bid button: `orange gradient` → `indigo gradient`
- Place Bid button: keep the `Zap` icon, swap to indigo
- Live pulse dot: keep red (it's a "live" indicator)

- [ ] **Step 4: Add routes**

```tsx
import { EventsSponsors } from "./components/events/EventsSponsors";
import { EventsDonations } from "./components/events/EventsDonations";
import { EventsAuction } from "./components/events/EventsAuction";
```
```tsx
{ path: "sponsors", element: <EventsSponsors /> },
{ path: "donations", element: <EventsDonations /> },
{ path: "auction", element: <EventsAuction /> },
```

- [ ] **Step 5: Verify all three, commit**

```bash
git add src/app/components/events/EventsSponsors.tsx src/app/components/events/EventsDonations.tsx src/app/components/events/EventsAuction.tsx src/app/routes.tsx
git commit -m "feat(events): add Sponsors, Donations, and Auction pages"
```

---

### Task 8: EventsFood + EventsFinance

**Files:**
- Create: `src/app/components/events/EventsFood.tsx`
- Create: `src/app/components/events/EventsFinance.tsx`
- Modify: `src/app/routes.tsx`

**Source references:**
- `EventsFood.tsx` (116 lines) — menu prep + ingredient stock
- `EventsFinance.tsx` (135 lines) — summary + charts + ledger

- [ ] **Step 1: Port EventsFood**

Copy source, apply:
- Remove `motion` → `animate-fade-in-up`
- Progress bars: keep emerald/orange/amber (they're status-based, not brand)

- [ ] **Step 2: Port EventsFinance**

Copy source, apply:
- Remove `motion` → `animate-fade-in-up`
- Expense BarChart bars: `#ea580c` → `#4f46e5`
- Income PieChart: keep multi-color
- Replace transaction list icons: keep (TrendingUp=green, TrendingDown=red)
- Import Recharts (already used)

- [ ] **Step 3: Add routes**

```tsx
import { EventsFood } from "./components/events/EventsFood";
import { EventsFinance } from "./components/events/EventsFinance";
```
```tsx
{ path: "food", element: <EventsFood /> },
{ path: "finance", element: <EventsFinance /> },
```

- [ ] **Step 4: Verify, commit**

```bash
git add src/app/components/events/EventsFood.tsx src/app/components/events/EventsFinance.tsx src/app/routes.tsx
git commit -m "feat(events): add EventsFood and EventsFinance pages"
```

---

### Task 9: EventsGallery + EventsReports — Final Pages

**Files:**
- Create: `src/app/components/events/EventsGallery.tsx`
- Create: `src/app/components/events/EventsReports.tsx`
- Modify: `src/app/routes.tsx`

**Source references:**
- `EventsGallery.tsx` (106 lines) — album/grid toggle + photo tiles
- `EventsReports.tsx` (122 lines) — report cards + RadarChart + AreaChart

- [ ] **Step 1: Port EventsGallery**

Copy source, apply:
- Remove `motion` → `animate-fade-in-up`
- Remove `ImageWithFallback` import — use plain `<img>` with `onError` fallback to a placeholder div
- Featured badge: `amber` → keep (it's a highlight, not brand)
- View toggle active: swap to indigo bg

- [ ] **Step 2: Port EventsReports**

Copy source, apply:
- Remove `motion` → `animate-fade-in-up`
- AreaChart stroke/fill: `#ea580c` → `#4f46e5`
- RadarChart stroke/fill: `#ea580c` → `#4f46e5`
- Export button gradient: `orange-to-amber` → `indigo-to-violet`
- Report card icons: keep per-card colors (they differentiate report types)

- [ ] **Step 3: Add final routes**

```tsx
import { EventsGallery } from "./components/events/EventsGallery";
import { EventsReports } from "./components/events/EventsReports";
```
```tsx
{ path: "gallery", element: <EventsGallery /> },
{ path: "reports", element: <EventsReports /> },
```

- [ ] **Step 4: Full verification**

Navigate through every pill nav item in the events module and confirm each page renders with correct indigo theme:
- `/events` — Dashboard with KPIs and charts
- `/events/create` — 6-step wizard
- `/events/planning` — Timeline + task board
- `/events/registration` — Admin table
- `/events/register` — Public wizard
- `/events/programs` — Day schedule
- `/events/volunteers` — Dept cards + directory
- `/events/sponsors` — Package tiers + list
- `/events/donations` — Ledger
- `/events/auction` — Bid items
- `/events/food` — Menu + stock
- `/events/finance` — Charts + ledger
- `/events/venue` — Zone map
- `/events/gallery` — Albums + grid
- `/events/reports` — Report cards + analytics
- `/cpn/events` — Legacy Events page still works

- [ ] **Step 5: Commit**

```bash
git add src/app/components/events/EventsGallery.tsx src/app/components/events/EventsReports.tsx src/app/routes.tsx
git commit -m "feat(events): add EventsGallery and EventsReports — all 15 pages complete"
```
