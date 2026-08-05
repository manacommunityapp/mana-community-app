# Event Management UI Integration — Design Spec

**Date:** 2026-08-03
**Status:** Approved
**Source:** Figma AI export at `D:\Application\applications\backup\Figma AI\event\Sports Scheduler Page\`
**Target:** `mana-community-app` (React 19 + Vite 8 + Tailwind v4 + shadcn/ui)
**Approach:** Direct port with color/component adaptation (Approach A)

---

## Overview

Port 15 event management components from a Figma AI export into the existing mana-community-app, replacing the current single-page `Events.tsx` with a full sub-module that mirrors the Sports module pattern (`SportsLayout` + nested routes + pill nav).

## Source Components (3,090 lines total)

| Component | Lines | Route | Key Features |
|---|---|---|---|
| EventsLayout | 140 | /events/* | Breadcrumb, pill nav, Outlet |
| EventsDashboard | 239 | /events | 8 KPIs, 3 Recharts, event list, tasks |
| EventsCreate | 698 | /events/create | 6-step wizard (Basics→Schedule→Reg→Budget→Media→Review) |
| EventsPlanning | 147 | /events/planning | Milestone timeline, task board with filters |
| EventsRegistration | 145 | /events/registration | Admin table, category filters, stats strip |
| EventsUserRegistration | 628 | /events/register | 4-step public wizard (Pass→Details→Payment→Confirm) |
| EventsPrograms | 133 | /events/programs | Day tabs, vertical timeline with icons |
| EventsVolunteers | 151 | /events/volunteers | Dept cards, volunteer directory table |
| EventsSponsors | 134 | /events/sponsors | Package tiers, sponsor list, progress bar |
| EventsDonations | 116 | /events/donations | Donation ledger, type summary, target progress |
| EventsAuction | 180 | /events/auction | Bid cards, live feed, leaderboard |
| EventsFood | 116 | /events/food | Menu prep progress, ingredient stock |
| EventsFinance | 135 | /events/finance | Summary tiles, expense BarChart, income PieChart |
| EventsVenue | 120 | /events/venue | Zone occupancy, facility status |
| EventsGallery | 106 | /events/gallery | Album/grid toggle, photo tiles |
| EventsReports | 122 | /events/reports | Report cards, AreaChart, RadarChart |

---

## File Structure

```
src/app/components/events/
├── EventsLayout.tsx
├── EventsDashboard.tsx
├── EventsCreate.tsx
├── EventsPlanning.tsx
├── EventsRegistration.tsx
├── EventsUserRegistration.tsx
├── EventsPrograms.tsx
├── EventsVolunteers.tsx
├── EventsSponsors.tsx
├── EventsDonations.tsx
├── EventsAuction.tsx
├── EventsFood.tsx
├── EventsFinance.tsx
├── EventsVenue.tsx
├── EventsGallery.tsx
└── EventsReports.tsx
```

The existing `Events.tsx` is renamed to `Events.legacy.tsx` and continues serving `cpn/events`.

---

## Routing Changes

**Before** (flat, single component):
```tsx
{ path: "events", element: <PermissionGuard permission={VIEW_EVENTS} requiredModule="EVENTS"><Events /></PermissionGuard> }
```

**After** (nested, 15 child routes):
```tsx
{
  path: "events",
  element: <PermissionGuard permission={VIEW_EVENTS} requiredModule="EVENTS"><EventsLayout /></PermissionGuard>,
  children: [
    { index: true, element: <EventsDashboard /> },
    { path: "create", element: <PermissionGuard permission={CREATE_EVENT}><EventsCreate /></PermissionGuard> },
    { path: "planning", element: <EventsPlanning /> },
    { path: "registration", element: <EventsRegistration /> },
    { path: "register", element: <EventsUserRegistration /> },
    { path: "programs", element: <EventsPrograms /> },
    { path: "volunteers", element: <EventsVolunteers /> },
    { path: "sponsors", element: <EventsSponsors /> },
    { path: "donations", element: <EventsDonations /> },
    { path: "auction", element: <EventsAuction /> },
    { path: "food", element: <EventsFood /> },
    { path: "finance", element: <EventsFinance /> },
    { path: "venue", element: <EventsVenue /> },
    { path: "gallery", element: <EventsGallery /> },
    { path: "reports", element: <EventsReports /> },
  ],
}
```

CPN route unchanged: `{ path: "events", element: <Events /> }` imports from `Events.legacy.tsx`.

---

## Adaptation Rules

### Color Mapping

| Figma (orange/amber) | Target (indigo/violet) |
|---|---|
| `#ea580c` | `#4f46e5` |
| `#f59e0b` | `#7c3aed` |
| `linear-gradient(135deg, #ea580c, #f59e0b)` | `linear-gradient(135deg, #4f46e5, #7c3aed)` |
| `rgba(234,88,12,0.12)` | `rgba(99,102,241,0.12)` |
| `rgba(234,88,12,0.35)` | `rgba(99,102,241,0.35)` |
| `orange-500` / `amber-400` Tailwind classes | `indigo-600` / `violet-500` |
| `bg-orange-50` | `bg-indigo-50` |
| `text-orange-600` | `text-indigo-600` |
| `focus:ring-orange-50` | `focus:ring-indigo-50` |

Status colors remain unchanged: emerald for success, rose for errors, amber for warnings.

### Animation Replacement

| Figma (motion/react) | Target (CSS) |
|---|---|
| `motion.div initial={{ opacity: 0, y: 20 }}` | `className="animate-fade-in-up"` |
| `AnimatePresence mode="wait"` | CSS `transition-all duration-200` |
| Stagger delays (0.04-0.06s) | Stagger CSS classes (`.stagger-1`, `.stagger-2`, etc.) or remove |
| `motion` hover/tap animations | `card-hover-lift` class or `hover:shadow-md transition-shadow` |

### Component Replacement

| Figma (custom inline) | Target (shadcn/ui) |
|---|---|
| Custom `<input>` with Tailwind | `<Input />` from `@/app/components/ui/input` |
| Custom `<select>` | `<Select>` from `@/app/components/ui/select` |
| Custom `<textarea>` | `<Textarea />` from `@/app/components/ui/textarea` |
| Custom `<button>` | `<Button />` from `@/app/components/ui/button` |
| Custom toggle switch | `<Switch />` from `@/app/components/ui/switch` |
| Custom checkbox | `<Checkbox />` from `@/app/components/ui/checkbox` |
| Custom tabs | `<Tabs>` from `@/app/components/ui/tabs` |
| Custom dialog/modal | `<Dialog>` from `@/app/components/ui/dialog` |
| Custom progress bar | `<Progress />` from `@/app/components/ui/progress` |
| Custom table | `<Table>` from `@/app/components/ui/table` |
| Custom badge/chip | `<Badge />` from `@/app/components/ui/badge` |
| Custom card wrapper | `<Card>` from `@/app/components/ui/card` |
| `cn()` local definition | Import from `@/app/components/ui/utils` |

### Data Strategy

All components keep hardcoded mock data arrays with `// TODO: wire to eventService` comments. The existing `src/services/events/eventService.ts` will be extended with new endpoints when the backend Event Management ERP APIs are built.

### Charts

Recharts 3.8.1 is already installed. Chart color swaps:
- Area/Bar fill: `#ea580c` → `#4f46e5`
- Gradient stops: orange/amber → indigo/violet
- Pie chart slices: keep multi-color palette, swap primary slice to indigo

---

## EventsLayout Design

Cloned from `SportsLayout.tsx` (160 lines) with these changes:

- Icon: `CalendarDays` (instead of `Trophy`)
- Title: "Event Management"
- Subtitle: "Planning, Registration, Finance & more"
- Gradient: `linear-gradient(135deg, #4f46e5, #7c3aed)` (indigo)
- 15 nav items with Lucide icons (same as Figma export)
- Permission-gated visibility per nav item using existing `VIEW_EVENTS`, `CREATE_EVENT`, `REGISTER_EVENT` constants
- Additional permission constants to be added as needed

---

## Permissions

Existing constants in `src/constants/permissions.ts`:
- `VIEW_EVENTS` — gates the entire events module
- `CREATE_EVENT` — gates event creation
- `REGISTER_EVENT` — gates event registration

All other sub-pages (planning, sponsors, donations, etc.) are gated at the module level by `VIEW_EVENTS` initially. More granular permissions can be added later as the backend implements role-based access per sub-feature.

---

## No New Dependencies

- `motion`/`framer-motion`: NOT added — replaced with CSS animations
- `recharts`: Already installed (v3.8.1)
- `lucide-react`: Already installed (v1.8.0)
- All shadcn/ui components: Already installed (48 components)

---

## Implementation Order

1. Rename `Events.tsx` → `Events.legacy.tsx`, update CPN import
2. Create `EventsLayout.tsx` (clone SportsLayout pattern)
3. Port all 15 components with color/component/animation adaptations
4. Update `routes.tsx` with nested event routes
5. Verify in browser — all 15 routes render with mock data
