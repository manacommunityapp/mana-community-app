# Web vs Mobile UI Parity Audit: Minute & Detail-Level Comparison

> **Comprehensive Analysis of Frontend Pages & Screens**
> **Web Repository**: `mana-community-app` (React 19, React Router, Vite)
> **Mobile Repository**: `mana-community-mobile` (React Native, Expo Router v4)
> **Scope**: 484 Web Actionable Pages vs 555 Mobile Actionable Screens across 19 Functional Domains

---

## 1. Executive Summary

A comprehensive architectural and functional audit was conducted comparing the UI pages and screens between the **Web Application** (`mana-community-app`) and the **Mobile Application** (`mana-community-mobile`).

### Key Totals:
- **Total Web Actionable Pages**: **484**
- **Total Mobile Actionable Screens**: **555**
- **Direct Parity / Shared Capabilities**: **206**
- **Web-Exclusive Pages**: **278**
- **Mobile-Exclusive Screens**: **349**

### Architectural & Design Paradigms:
1. **Web Frontend (`mana-community-app`)**:
   - Built with **React 19** and central routing in `src/app/routes.tsx` using `createBrowserRouter`.
   - Focuses heavily on **Back-Office Operations, Society Administration, Complex Data Grids, Vendor Portals, and Multi-Tenant Platform Operations** (e.g. Batch Payroll, ANPR Monitor, Smart Meter IoT Graphs, Vendor Verification Matrix, Custom Report Builder, Org Chart Hierarchy).
2. **Mobile Frontend (`mana-community-mobile`)**:
   - Built with **React Native / Expo** with file-based routing under `app/` (555 screen files).
   - Focuses on **Resident Daily Touchpoints, Hardware-Integrated Features, On-The-Go Staff Operations, and Consumer Fintech** (e.g. Camera-based Meal Logging, QR Gate Passes, UPI Scan & Pay, BBPS Utility Payments, Personal Finance Manager, Carpool/Ride Sharing, School Bus Live GPS, Guard Handover, and Teleconsultation Video Rooms).

---

## 2. High-Level Parity Matrix by Functional Domain

| Domain | Web Pages | Mobile Screens | Shared Parity | Web Exclusive | Mobile Exclusive | Parity Status |
| :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| **Auth & Onboarding** | 15 | 14 | 5 | 10 | 9 | 🟡 Partial Parity |
| **Events & Cultural** | 20 | 24 | 4 | 16 | 20 | 🟡 Partial Parity |
| **Sports, Courts & Tournaments** | 50 | 55 | 20 | 30 | 35 | 🟡 Partial Parity |
| **Visitors & Gate Access** | 19 | 40 | 13 | 6 | 27 | 🟡 Partial Parity |
| **Home Services & Amenities** | 33 | 29 | 16 | 17 | 13 | 🟡 Partial Parity |
| **Food, Dining & Groceries** | 52 | 21 | 17 | 35 | 4 | 🟡 Partial Parity |
| **Commerce & Marketplace** | 81 | 83 | 36 | 45 | 47 | 🟡 Partial Parity |
| **Finance, Payments & Fintech** | 29 | 64 | 18 | 11 | 46 | 🟡 Partial Parity |
| **HRM & Workforce Operations** | 27 | 24 | 15 | 12 | 9 | 🟡 Partial Parity |
| **Healthcare & Wellness** | 22 | 40 | 10 | 12 | 30 | 🟡 Partial Parity |
| **IoT & Smart Facilities** | 4 | 6 | 4 | 0 | 2 | 🟡 Partial Parity |
| **Mobility, Parking & Commute** | 6 | 42 | 6 | 0 | 36 | 📱 Mobile Heavy |
| **Emergency & Safety** | 4 | 2 | 2 | 2 | 0 | 🟡 Partial Parity |
| **Community & Social** | 17 | 12 | 6 | 11 | 6 | 🟡 Partial Parity |
| **Governance, Notices & Docs** | 12 | 13 | 8 | 4 | 5 | 🟡 Partial Parity |
| **Communication & AI Chat** | 5 | 7 | 4 | 1 | 3 | 🟡 Partial Parity |
| **Admin, Management & Ops** | 40 | 22 | 11 | 29 | 11 | 🟡 Partial Parity |
| **User Profile & Settings** | 5 | 7 | 2 | 3 | 5 | 🟡 Partial Parity |
| **General / Other** | 43 | 50 | 9 | 34 | 41 | 🟡 Partial Parity |
| **TOTAL** | **484** | **555** | **206** | **278** | **349** | **Overview: 1,039 Total Screens** |

---

## 3. Domain-by-Domain Minute-Level Breakdown

### 3.1 Auth & Onboarding

**Summary**: Web: **15** pages | Mobile: **14** screens | Shared Parity: **5** | Web Exclusive: **10** | Mobile Exclusive: **9**

#### Shared Capabilities / Direct Parity (5)

| Web Route | Web Component | Mobile Route | Mobile File | Match Type |
| :--- | :--- | :--- | :--- | :--- |
| `/onboarding` | `ResidentAuthExperience` | `/onboarding` | `onboarding/index.tsx` | `EXACT_PATH` |
| `/auth/resident-onboarding` | `ResidentAuthExperience` | `/auth` | `auth/index.tsx` | `SEMANTIC_SIMILAR` |
| `/login` | `Login` | `/auth/login` | `auth/login.tsx` | `COMPONENT_MATCH` |
| `/forgot-password` | `ForgotPassword` | `/auth/forgot-password` | `auth/forgot-password.tsx` | `COMPONENT_MATCH` |
| `/profile/kyc` | `KycWizardPage` | `/profile/kyc` | `profile/kyc.tsx` | `EXACT_PATH` |

#### Web Exclusive Pages (10)

*Pages built in Web that do not currently have a direct screen in Mobile:*

| Web Path | Component | Likely Architectural Rationale |
| :--- | :--- | :--- |
| `/resident-auth` | `ResidentAuthExperience` | Desktop-oriented admin / multi-column view |
| `/signup` | `Signup` | Public guest / external registration link |
| `/kyc-verification` | `KYCVerification` | Desktop-oriented admin / multi-column view |
| `/event-register/:eventId?` | `EventPublicRegistration` | Public guest / external registration link |
| `/sports/register/external/:token` | `SportsExternalPublicRegister` | Public guest / external registration link |
| `/sports/team-register/:eventId` | `TeamRegisterPage` | Public guest / external registration link |
| `/sports/register` | `MySports` | Public guest / external registration link |
| `/sports/register/:eventUuid` | `SportsRegister` | Public guest / external registration link |
| `/sports/register-tournament/:tournamentId` | `SportsMultiRegister` | Public guest / external registration link |
| `/food/become-seller` | `HomeChefOnboarding` | Desktop-oriented admin / multi-column view |

#### Mobile Exclusive Screens (9)

*Screens built in Mobile that do not currently have a direct route in Web:*

| Mobile Route | File Path | Inferred Role / Hardware Trigger |
| :--- | :--- | :--- |
| `/auth/register` | `auth/register.tsx` | Mobile-first resident touchpoint |
| `/events/register` | `events/register.tsx` | Mobile-first resident touchpoint |
| `/hrm/onboarding` | `hrm/onboarding.tsx` | Mobile-first resident touchpoint |
| `/onboarding/account` | `onboarding/account.tsx` | Mobile-first resident touchpoint |
| `/onboarding/community` | `onboarding/community.tsx` | Mobile-first resident touchpoint |
| `/onboarding/details` | `onboarding/details.tsx` | Mobile-first resident touchpoint |
| `/onboarding/pending` | `onboarding/pending.tsx` | Mobile-first resident touchpoint |
| `/onboarding/tour` | `onboarding/tour.tsx` | Mobile-first resident touchpoint |
| `/onboarding/verify` | `onboarding/verify.tsx` | Mobile-first resident touchpoint |

---

### 3.2 Events & Cultural

**Summary**: Web: **20** pages | Mobile: **24** screens | Shared Parity: **4** | Web Exclusive: **16** | Mobile Exclusive: **20**

#### Shared Capabilities / Direct Parity (4)

| Web Route | Web Component | Mobile Route | Mobile File | Match Type |
| :--- | :--- | :--- | :--- | :--- |
| `/events` | `EventDashboardWrapper` | `/events` | `events/index.tsx` | `EXACT_PATH` |
| `/events/dashboard-preview` | `EventUserDashboardPreview` | `/events/:id` | `events/[id].tsx` | `SEMANTIC_SIMILAR` |
| `/events/create` | `EventEditor` | `/events/create` | `events/create.tsx` | `EXACT_PATH` |
| `/cpn/events` | `Events` | `/event-admin/tabs/events` | `event-admin/tabs/events.tsx` | `COMPONENT_MATCH` |

#### Web Exclusive Pages (16)

*Pages built in Web that do not currently have a direct screen in Mobile:*

| Web Path | Component | Likely Architectural Rationale |
| :--- | :--- | :--- |
| `/sports/schedule/:eventId` | `SportsSchedule` | Desktop-oriented admin / multi-column view |
| `/sports/auction/:eventId` | `SportsAuction` | Desktop-oriented admin / multi-column view |
| `/events/member-flow` | `EventMemberFlow` | Desktop-oriented admin / multi-column view |
| `/events/schedule` | `EventsSchedule` | Desktop-oriented admin / multi-column view |
| `/events/registration` | `EventsRegistrationHub` | Desktop-oriented admin / multi-column view |
| `/events/forms` | `EventsFormsHub` | Desktop-oriented admin / multi-column view |
| `/events/people` | `EventsPeople` | Desktop-oriented admin / multi-column view |
| `/events/fundraising` | `EventsFundraising` | Desktop-oriented admin / multi-column view |
| `/events/operations` | `EventsOperations` | Desktop-oriented admin / multi-column view |
| `/events/media` | `EventsGallery` | Desktop-oriented admin / multi-column view |
| `/events/reports` | `EventsReports` | Heavy analytical / report generation tool |
| `/events/:id/edit` | `EventEditor` | Desktop-oriented admin / multi-column view |
| `/finance/event-budgets` | `EventBudgetsView` | Desktop-oriented admin / multi-column view |
| `/vendor-portal/sports/events` | `SportsEventsOrganizerPortal` | Vendor back-office desktop portal |
| `/food/events` | `FoodEvents` | Desktop-oriented admin / multi-column view |
| `/deals/market-days` | `MarketEventsView` | Desktop-oriented admin / multi-column view |

#### Mobile Exclusive Screens (20)

*Screens built in Mobile that do not currently have a direct route in Web:*

| Mobile Route | File Path | Inferred Role / Hardware Trigger |
| :--- | :--- | :--- |
| `/event-admin` | `event-admin/index.tsx` | Mobile-first resident touchpoint |
| `/event-admin/tabs/analytics` | `event-admin/tabs/analytics.tsx` | Mobile-first resident touchpoint |
| `/event-admin/tabs/dashboard` | `event-admin/tabs/dashboard.tsx` | Mobile-first resident touchpoint |
| `/event-admin/tabs/profile` | `event-admin/tabs/profile.tsx` | Mobile-first resident touchpoint |
| `/event-admin/tabs/venues` | `event-admin/tabs/venues.tsx` | Mobile-first resident touchpoint |
| `/events/calendar` | `events/calendar.tsx` | Mobile-first resident touchpoint |
| `/events/donations` | `events/donations.tsx` | Mobile-first resident touchpoint |
| `/events/expenses` | `events/expenses.tsx` | Mobile-first resident touchpoint |
| `/events/gallery` | `events/gallery.tsx` | Mobile-first resident touchpoint |
| `/events/gatepass` | `events/gatepass.tsx` | Camera / QR code scanner feature |
| `/events/meals` | `events/meals.tsx` | Mobile-first resident touchpoint |
| `/events/my-events` | `events/my-events.tsx` | Mobile-first resident touchpoint |
| `/events/passes` | `events/passes.tsx` | Mobile-first resident touchpoint |
| `/events/pooja` | `events/pooja.tsx` | Mobile-first resident touchpoint |
| `/events/programs` | `events/programs.tsx` | Mobile-first resident touchpoint |
| `/events/sponsors` | `events/sponsors.tsx` | Mobile-first resident touchpoint |
| `/events/tasks` | `events/tasks.tsx` | Mobile-first resident touchpoint |
| `/events/volunteers` | `events/volunteers.tsx` | Mobile-first resident touchpoint |
| `/kitty-party/kittyPartyEventScreen` | `kitty-party/kittyPartyEventScreen.tsx` | Mobile-first resident touchpoint |
| `/tabs/events` | `tabs/events.tsx` | Mobile-first resident touchpoint |

---

### 3.3 Sports, Courts & Tournaments

**Summary**: Web: **50** pages | Mobile: **55** screens | Shared Parity: **20** | Web Exclusive: **30** | Mobile Exclusive: **35**

#### Shared Capabilities / Direct Parity (20)

| Web Route | Web Component | Mobile Route | Mobile File | Match Type |
| :--- | :--- | :--- | :--- | :--- |
| `/sports` | `SportsDashboard` | `/sports` | `sports/index.tsx` | `EXACT_PATH` |
| `/sports/my-sports` | `MySports` | `/sports/facility/my-bookings` | `sports/facility/my-bookings.tsx` | `SEMANTIC_SIMILAR` |
| `/sports/tournaments` | `SportsTournamentBrowse` | `/sports/tournaments` | `sports/tournaments.tsx` | `EXACT_PATH` |
| `/sports/my-teams` | `SportsMyTeams` | `/sports/my-teams` | `sports/my-teams.tsx` | `EXACT_PATH` |
| `/sports/trainers` | `SportsTrainers` | `/sports/trainers` | `sports/trainers.tsx` | `EXACT_PATH` |
| `/sports/auction` | `SportsAuction` | `/sports/auction` | `sports/auction/index.tsx` | `EXACT_PATH` |
| `/sports/admin` | `SportsAdmin` | `/sports-admin` | `sports-admin/index.tsx` | `EXACT_PATH` |
| `/sports/analytics` | `SportsAnalytics` | `/sports-admin/tabs/analytics` | `sports-admin/tabs/analytics.tsx` | `COMPONENT_MATCH` |
| `/sports/match/:matchId` | `MatchDetailPage` | `/sports/match/:id` | `sports/match/[id].tsx` | `EXACT_PATH` |
| `/sports/leaderboard` | `LeaderboardPage` | `/sports/leaderboard` | `sports/leaderboard.tsx` | `EXACT_PATH` |
| `/sports/leaderboard/:tournamentId` | `LeaderboardPage` | `/sports/tournament/leaderboard` | `sports/tournament/leaderboard.tsx` | `SEMANTIC_SIMILAR` |
| `/sports/race/:matchId` | `RaceResultsPage` | `/sports/match/race-results` | `sports/match/race-results.tsx` | `SEMANTIC_SIMILAR` |
| `/sports/match/:matchId/stream` | `MatchStreamPage` | `/sports/stream/:id` | `sports/stream/[id].tsx` | `SEMANTIC_SIMILAR` |
| `/sports/match/:matchId/stream/manage` | `MatchStreamControlPage` | `/sports/stream/manage/:id` | `sports/stream/manage/[id].tsx` | `SEMANTIC_SIMILAR` |
| `/academy` | `AcademyDashboard` | `/academy` | `academy/index.tsx` | `EXACT_PATH` |
| `/academy/my-learning` | `MyLearningView` | `/academy/my-learning` | `academy/my-learning.tsx` | `EXACT_PATH` |
| `/academy/teaching` | `InstructorHubView` | `/academy/teaching` | `academy/teaching.tsx` | `EXACT_PATH` |
| `/academy/admin` | `AcademyAdminHub` | `/academy/admin` | `academy/admin.tsx` | `EXACT_PATH` |
| `/sports-ops` | `SportsOpsHub` | `/sports-ops` | `sports-ops/index.tsx` | `EXACT_PATH` |
| `/hrm/skill-passport` | `HrmSkillPassportPage` | `/hrm/passport` | `hrm/passport.tsx` | `SEMANTIC_SIMILAR` |

#### Web Exclusive Pages (30)

*Pages built in Web that do not currently have a direct screen in Mobile:*

| Web Path | Component | Likely Architectural Rationale |
| :--- | :--- | :--- |
| `/sports/badges` | `SportsBadgeShowcase` | Desktop-oriented admin / multi-column view |
| `/sports/feed` | `SportsFeed` | Desktop-oriented admin / multi-column view |
| `/sports/find-players` | `SportsMatchmaking` | Desktop-oriented admin / multi-column view |
| `/sports/messages` | `SportsMessages` | Desktop-oriented admin / multi-column view |
| `/sports/insurance` | `SportsInsuranceWidget` | Desktop-oriented admin / multi-column view |
| `/sports/my-auctions` | `SportsMyAuctions` | Desktop-oriented admin / multi-column view |
| `/sports/schedule` | `SportsSchedule` | Desktop-oriented admin / multi-column view |
| `/sports/venues` | `SportsVenueBrowse` | Desktop-oriented admin / multi-column view |
| `/sports/venues/:venueId` | `SportsVenueDetail` | Desktop-oriented admin / multi-column view |
| `/sports/match/:matchId/live` | `MatchLivePage` | Desktop-oriented admin / multi-column view |
| `/sports/match/:matchId/score` | `MatchScorePage` | Desktop-oriented admin / multi-column view |
| `/sports/match/generic/:matchId/live` | `GenericMatchLivePage` | Desktop-oriented admin / multi-column view |
| `/sports/match/generic/:matchId/score` | `GenericMatchScorePage` | Desktop-oriented admin / multi-column view |
| `/sports/race/:matchId/score` | `RaceScorePage` | Desktop-oriented admin / multi-column view |
| `/admin/business` | `BusinessRevenueDashboard` | Administrative dashboard / configuration tool |
| `/admin/venues` | `AdminVenues` | Administrative dashboard / configuration tool |
| `/finance/tournament-budgets` | `TournamentBudgetsView` | Desktop-oriented admin / multi-column view |
| `/vendor-portal/sports` | `SportsVendorDashboard` | Vendor back-office desktop portal |
| `/vendor-portal/sports/venues` | `SportsVenueManager` | Vendor back-office desktop portal |
| `/vendor-portal/sports/calendar` | `SportsSlotCalendar` | Vendor back-office desktop portal |
| `/vendor-portal/sports/bookings` | `SportsBookingManager` | Vendor back-office desktop portal |
| `/vendor-portal/sports/pricing` | `SportsPricingMatrix` | Vendor back-office desktop portal |
| `/vendor-portal/sports/coaching` | `SportsCoachingPortal` | Vendor back-office desktop portal |
| `/vendor-portal/sports/memberships` | `SportsMembershipsPortal` | Vendor back-office desktop portal |
| `/vendor-portal/sports/suppliers` | `SportsSuppliersPortal` | Vendor back-office desktop portal |
| `/vendor-portal/sports/intelligence` | `SportsIntelligencePortal` | Vendor back-office desktop portal |
| `/vendor-portal/sports/branches` | `SportsMultiVenuePortal` | Vendor back-office desktop portal |
| `/cpos/crm/integrations` | `CPOSPortalIntegrationsPage` | Vendor back-office desktop portal |
| `/mutual-funds` | `MutualFundsPortal` | Desktop-oriented admin / multi-column view |
| `/wellness/log-sports` | `LogSportsWorkout` | Desktop-oriented admin / multi-column view |

#### Mobile Exclusive Screens (35)

*Screens built in Mobile that do not currently have a direct route in Web:*

| Mobile Route | File Path | Inferred Role / Hardware Trigger |
| :--- | :--- | :--- |
| `/auction` | `auction/index.tsx` | Mobile-first resident touchpoint |
| `/auction/:id` | `auction/[id].tsx` | Mobile-first resident touchpoint |
| `/procurement/auction` | `procurement/auction/index.tsx` | Mobile-first resident touchpoint |
| `/procurement/auction/new` | `procurement/auction/new.tsx` | Mobile-first resident touchpoint |
| `/procurement/auction/:id` | `procurement/auction/[id].tsx` | Mobile-first resident touchpoint |
| `/sports/auction/:id` | `sports/auction/[id].tsx` | Mobile-first resident touchpoint |
| `/sports/challenge` | `sports/challenge.tsx` | Mobile-first resident touchpoint |
| `/sports/create-team` | `sports/create-team.tsx` | Mobile-first resident touchpoint |
| `/sports/facility/:id` | `sports/facility/[id].tsx` | Mobile-first resident touchpoint |
| `/sports/matches` | `sports/matches.tsx` | Mobile-first resident touchpoint |
| `/sports/photos/:id` | `sports/photos/[id].tsx` | Mobile-first resident touchpoint |
| `/sports/player/cricheroes` | `sports/player/cricheroes.tsx` | Mobile-first resident touchpoint |
| `/sports/player/:id` | `sports/player/[id].tsx` | Mobile-first resident touchpoint |
| `/sports/rankings` | `sports/rankings.tsx` | Mobile-first resident touchpoint |
| `/sports/rate/:id` | `sports/rate/[id].tsx` | Mobile-first resident touchpoint |
| `/sports/scorecard/entry/:id` | `sports/scorecard/entry/[id].tsx` | Mobile-first resident touchpoint |
| `/sports/scorecard/:id` | `sports/scorecard/[id].tsx` | Mobile-first resident touchpoint |
| `/sports/tournament/announcements` | `sports/tournament/announcements.tsx` | Mobile-first resident touchpoint |
| `/sports/tournament/:id` | `sports/tournament/[id].tsx` | Mobile-first resident touchpoint |
| `/sports/trainer/book/:slotId` | `sports/trainer/book/[slotId].tsx` | Mobile-first resident touchpoint |
| `/sports/trainer/:id` | `sports/trainer/[id].tsx` | Mobile-first resident touchpoint |
| `/sports-admin/tabs/dashboard` | `sports-admin/tabs/dashboard.tsx` | Mobile-first resident touchpoint |
| `/sports-admin/tabs/matches` | `sports-admin/tabs/matches.tsx` | Mobile-first resident touchpoint |
| `/sports-admin/tabs/profile` | `sports-admin/tabs/profile.tsx` | Mobile-first resident touchpoint |
| `/sports-admin/tabs/tournaments` | `sports-admin/tabs/tournaments.tsx` | Mobile-first resident touchpoint |
| `/sports-ops/coaching` | `sports-ops/coaching.tsx` | Mobile-first resident touchpoint |
| `/sports-ops/deposits` | `sports-ops/deposits.tsx` | Mobile-first resident touchpoint |
| `/sports-ops/merchandise` | `sports-ops/merchandise.tsx` | Mobile-first resident touchpoint |
| `/sports-ops/open-play` | `sports-ops/open-play.tsx` | Mobile-first resident touchpoint |
| `/sports-ops/ratings` | `sports-ops/ratings.tsx` | Mobile-first resident touchpoint |
| `/sports-ops/referees` | `sports-ops/referees.tsx` | Mobile-first resident touchpoint |
| `/sports-ops/sponsors` | `sports-ops/sponsors.tsx` | Mobile-first resident touchpoint |
| `/sports-ops/subscriptions` | `sports-ops/subscriptions.tsx` | Mobile-first resident touchpoint |
| `/sports-ops/waitlist` | `sports-ops/waitlist.tsx` | Mobile-first resident touchpoint |
| `/tabs/sports` | `tabs/sports.tsx` | Mobile-first resident touchpoint |

---

### 3.4 Visitors & Gate Access

**Summary**: Web: **19** pages | Mobile: **40** screens | Shared Parity: **13** | Web Exclusive: **6** | Mobile Exclusive: **27**

#### Shared Capabilities / Direct Parity (13)

| Web Route | Web Component | Mobile Route | Mobile File | Match Type |
| :--- | :--- | :--- | :--- | :--- |
| `/admin/access-roles` | `AdminAccessManagement` | `/access` | `access/index.tsx` | `SEMANTIC_SIMILAR` |
| `/visitors` | `VisitorManagement` | `/visitors` | `visitors/index.tsx` | `EXACT_PATH` |
| `/parcels` | `ParcelRoom` | `/guard/tabs/parcels` | `guard/tabs/parcels.tsx` | `SEMANTIC_SIMILAR` |
| `/access/turnstiles` | `BiometricTurnstileMonitor` | `/access/turnstiles` | `access/turnstiles.tsx` | `EXACT_PATH` |
| `/healthguard` | `HealthGuardDashboard` | `/healthguard` | `healthguard/index.tsx` | `EXACT_PATH` |
| `/healthguard/contacts` | `EmergencyContacts` | `/healthguard/contacts` | `healthguard/contacts.tsx` | `EXACT_PATH` |
| `/healthguard/incidents` | `IncidentTracker` | `/healthguard/incidents` | `healthguard/incidents.tsx` | `EXACT_PATH` |
| `/healthguard/sos` | `SosScreen` | `/healthguard/sos` | `healthguard/sos.tsx` | `EXACT_PATH` |
| `/healthguard/profile` | `HealthProfile` | `/healthguard/profile` | `healthguard/profile.tsx` | `EXACT_PATH` |
| `/healthguard/responder` | `ResponderHub` | `/healthguard/responder` | `healthguard/responder.tsx` | `EXACT_PATH` |
| `/healthguard/ambulance` | `AmbulanceBookingScreen` | `/healthguard/ambulance` | `healthguard/ambulance.tsx` | `EXACT_PATH` |
| `/healthguard/admin/wearable-alerts` | `WearableAlertsDashboard` | `/healthguard/wearable` | `healthguard/wearable.tsx` | `SEMANTIC_SIMILAR` |
| `/ops/parcels` | `ParcelManager` | `/ops/parcels` | `ops/parcels.tsx` | `EXACT_PATH` |

#### Web Exclusive Pages (6)

*Pages built in Web that do not currently have a direct screen in Mobile:*

| Web Path | Component | Likely Architectural Rationale |
| :--- | :--- | :--- |
| `/access/cards` | `AccessCardsManagement` | Desktop-oriented admin / multi-column view |
| `/guards` | `GuardManagement` | Desktop-oriented admin / multi-column view |
| `/parking/anpr` | `AnprGateLiveMonitor` | Desktop-oriented admin / multi-column view |
| `/healthguard/connected-health` | `ConnectedHealthOverview` | Desktop-oriented admin / multi-column view |
| `/healthguard/admin/incidents` | `AdminIncidentDashboard` | Administrative dashboard / configuration tool |
| `/healthguard/ambulance-dispatch` | `AmbulanceDispatch` | Desktop-oriented admin / multi-column view |

#### Mobile Exclusive Screens (27)

*Screens built in Mobile that do not currently have a direct route in Web:*

| Mobile Route | File Path | Inferred Role / Hardware Trigger |
| :--- | :--- | :--- |
| `/access/blacklist` | `access/blacklist.tsx` | Mobile-first resident touchpoint |
| `/access/logs` | `access/logs.tsx` | Mobile-first resident touchpoint |
| `/admin-role/tabs/security` | `admin-role/tabs/security.tsx` | Mobile-first resident touchpoint |
| `/guard/cctv` | `guard/cctv.tsx` | Guard handheld device on-duty interface |
| `/guard/handover` | `guard/handover.tsx` | Guard handheld device on-duty interface |
| `/guard` | `guard/index.tsx` | Guard handheld device on-duty interface |
| `/guard/tabs/attendance` | `guard/tabs/attendance.tsx` | Guard handheld device on-duty interface |
| `/guard/tabs/daily-log` | `guard/tabs/daily-log.tsx` | Guard handheld device on-duty interface |
| `/guard/tabs/dashboard` | `guard/tabs/dashboard.tsx` | Guard handheld device on-duty interface |
| `/guard/tabs/handover` | `guard/tabs/handover.tsx` | Guard handheld device on-duty interface |
| `/guard/tabs/incidents` | `guard/tabs/incidents.tsx` | Guard handheld device on-duty interface |
| `/guard/tabs/patrol` | `guard/tabs/patrol.tsx` | Guard handheld device on-duty interface |
| `/guard/tabs/profile` | `guard/tabs/profile.tsx` | Guard handheld device on-duty interface |
| `/guard/tabs/scan` | `guard/tabs/scan.tsx` | Camera / QR code scanner feature |
| `/guard/tabs/sos` | `guard/tabs/sos.tsx` | Guard handheld device on-duty interface |
| `/guard/tabs/vehicles` | `guard/tabs/vehicles.tsx` | Guard handheld device on-duty interface |
| `/guard/tabs/visitors` | `guard/tabs/visitors.tsx` | Guard handheld device on-duty interface |
| `/guard/walk-in` | `guard/walk-in.tsx` | Guard handheld device on-duty interface |
| `/settings/security` | `settings/security.tsx` | Mobile-first resident touchpoint |
| `/visitors/approve-visitor` | `visitors/approve-visitor.tsx` | Mobile-first resident touchpoint |
| `/visitors/group-invite` | `visitors/group-invite.tsx` | Mobile-first resident touchpoint |
| `/visitors/intercom` | `visitors/intercom.tsx` | Native WebRTC / push call intercom |
| `/visitors/packages` | `visitors/packages.tsx` | Mobile-first resident touchpoint |
| `/visitors/pending-approvals` | `visitors/pending-approvals.tsx` | Mobile-first resident touchpoint |
| `/visitors/trusted` | `visitors/trusted.tsx` | Mobile-first resident touchpoint |
| `/visitors/watchlist` | `visitors/watchlist.tsx` | Mobile-first resident touchpoint |
| `/visitors/whitelist` | `visitors/whitelist.tsx` | Mobile-first resident touchpoint |

---

### 3.5 Home Services & Amenities

**Summary**: Web: **33** pages | Mobile: **29** screens | Shared Parity: **16** | Web Exclusive: **17** | Mobile Exclusive: **13**

#### Shared Capabilities / Direct Parity (16)

| Web Route | Web Component | Mobile Route | Mobile File | Match Type |
| :--- | :--- | :--- | :--- | :--- |
| `/services` | `ServiceBrowse` | `/services` | `services/index.tsx` | `EXACT_PATH` |
| `/services/interiors` | `InteriorsMarketplace` | `/interiors` | `interiors/index.tsx` | `SEMANTIC_SIMILAR` |
| `/services/interiors/vendors` | `InteriorVendors` | `/interiors/:projectId` | `interiors/[projectId].tsx` | `SEMANTIC_SIMILAR` |
| `/services/insta-help` | `InstaHelp` | `/services/insta-help` | `services/insta-help.tsx` | `EXACT_PATH` |
| `/services/provider` | `ProviderDashboard` | `/home-services/provider-deck` | `home-services/provider-deck.tsx` | `SEMANTIC_SIMILAR` |
| `/home-services` | `HomeServicesDashboard` | `/home-services` | `home-services/index.tsx` | `EXACT_PATH` |
| `/home-services/find-help` | `FindHomeHelp` | `/home-services/find-help` | `home-services/find-help.tsx` | `EXACT_PATH` |
| `/home-services/my-help` | `MyHomeHelp` | `/home-services/my-help` | `home-services/my-help.tsx` | `EXACT_PATH` |
| `/home-services/bookings` | `MyHomeServiceBookings` | `/home-services/bookings` | `home-services/bookings.tsx` | `EXACT_PATH` |
| `/home-services/packages` | `WorkerPackagesView` | `/home-services/packages` | `home-services/packages.tsx` | `EXACT_PATH` |
| `/bookings` | `ResourceBookingDashboard` | `/bookings` | `bookings.tsx` | `EXACT_PATH` |
| `/helpdesk` | `SmartHelpdeskDashboard` | `/helpdesk` | `helpdesk/index.tsx` | `EXACT_PATH` |
| `/vendor-portal/bookings` | `MyBookings` | `/bazaar/my-bookings` | `bazaar/my-bookings.tsx` | `COMPONENT_MATCH` |
| `/vendor-marketplace/vendor/:vendorId/book/:serviceId` | `BookingFlow` | `/vehicle-care/book` | `vehicle-care/book.tsx` | `COMPONENT_MATCH` |
| `/home-services` | `HomeServicesHub` | `/home-services/jobs` | `home-services/jobs.tsx` | `SEMANTIC_SIMILAR` |
| `/hrm/helpdesk` | `HrmHelpDeskPage` | `/hrm/helpdesk` | `hrm/helpdesk.tsx` | `EXACT_PATH` |

#### Web Exclusive Pages (17)

*Pages built in Web that do not currently have a direct screen in Mobile:*

| Web Path | Component | Likely Architectural Rationale |
| :--- | :--- | :--- |
| `/services/interiors/projects` | `InteriorProjects` | Desktop-oriented admin / multi-column view |
| `/services/interiors/projects/:id` | `InteriorProjects` | Desktop-oriented admin / multi-column view |
| `/services/requests` | `MyRequests` | Desktop-oriented admin / multi-column view |
| `/services/requests/:id` | `MyRequests` | Desktop-oriented admin / multi-column view |
| `/services/admin` | `AdminServices` | Administrative dashboard / configuration tool |
| `/home-services/requirements` | `HomeServiceRequirements` | Desktop-oriented admin / multi-column view |
| `/home-services/schedule` | `HomeServiceSchedule` | Desktop-oriented admin / multi-column view |
| `/home-services/payments` | `HomeServicePayments` | Desktop-oriented admin / multi-column view |
| `/home-services/leaves` | `HomeServiceLeaves` | Desktop-oriented admin / multi-column view |
| `/home-services/reviews` | `HomeServiceReviews` | Desktop-oriented admin / multi-column view |
| `/home-services/reports` | `HomeServiceReports` | Heavy analytical / report generation tool |
| `/home-services/admin` | `HomeServiceAdminDashboard` | Administrative dashboard / configuration tool |
| `/community/resource-booking` | `ResourceAdmin` | Desktop-oriented admin / multi-column view |
| `/vendor-portal/services` | `MyServices` | Vendor back-office desktop portal |
| `/vendor-marketplace` | `ServiceMarketplace` | Vendor back-office desktop portal |
| `/vendor-marketplace/my-bookings` | `MyBookingsResident` | Vendor back-office desktop portal |
| `/helpdesk-smart` | `SmartHelpdeskDashboard` | Desktop-oriented admin / multi-column view |

#### Mobile Exclusive Screens (13)

*Screens built in Mobile that do not currently have a direct route in Web:*

| Mobile Route | File Path | Inferred Role / Hardware Trigger |
| :--- | :--- | :--- |
| `/amc` | `amc/index.tsx` | Mobile-first resident touchpoint |
| `/amenity/checkout/:id` | `amenity/checkout/[id].tsx` | Mobile-first resident touchpoint |
| `/experiences/my-bookings` | `experiences/my-bookings.tsx` | Mobile-first resident touchpoint |
| `/health/ambulance` | `health/ambulance/index.tsx` | Mobile-first resident touchpoint |
| `/health/labs/book` | `health/labs/book.tsx` | Mobile-first resident touchpoint |
| `/home-services/plans` | `home-services/plans.tsx` | Mobile-first resident touchpoint |
| `/home-services/workers` | `home-services/workers.tsx` | Mobile-first resident touchpoint |
| `/interiors/credentials` | `interiors/credentials.tsx` | Mobile-first resident touchpoint |
| `/mobility/journeys/bookings` | `mobility/journeys/bookings.tsx` | Mobile-first resident touchpoint |
| `/tabs/bookings` | `tabs/bookings.tsx` | Mobile-first resident touchpoint |
| `/tabs/services` | `tabs/services.tsx` | Mobile-first resident touchpoint |
| `/vehicle-care/my-bookings` | `vehicle-care/my-bookings.tsx` | Mobile-first resident touchpoint |
| `/vendor/tabs/bookings` | `vendor/tabs/bookings.tsx` | Mobile-first resident touchpoint |

---

### 3.6 Food, Dining & Groceries

**Summary**: Web: **52** pages | Mobile: **21** screens | Shared Parity: **17** | Web Exclusive: **35** | Mobile Exclusive: **4**

#### Shared Capabilities / Direct Parity (17)

| Web Route | Web Component | Mobile Route | Mobile File | Match Type |
| :--- | :--- | :--- | :--- | :--- |
| `/vendor-portal/fresh/production` | `FreshProcessingProductionHub` | `/vendor/fresh/production` | `vendor/fresh/production.tsx` | `SEMANTIC_SIMILAR` |
| `/food` | `FoodDashboard` | `/food` | `food/index.tsx` | `EXACT_PATH` |
| `/food/home-chefs` | `HomeChefMarketplace` | `/food/home-chefs` | `food/home-chefs.tsx` | `EXACT_PATH` |
| `/food/subscriptions` | `MealSubscriptions` | `/food/subscriptions` | `food/subscriptions.tsx` | `EXACT_PATH` |
| `/food/grocery` | `GroceryMarketplace` | `/food/grocery` | `food/grocery.tsx` | `EXACT_PATH` |
| `/food/dining` | `DiningReservations` | `/food/dining` | `food/dining.tsx` | `EXACT_PATH` |
| `/food/pantry` | `SmartPantry` | `/food/pantry` | `food/pantry.tsx` | `EXACT_PATH` |
| `/food/fresh-kitchen` | `FreshKitchenHub` | `/fresh-kitchen` | `fresh-kitchen/index.tsx` | `SEMANTIC_SIMILAR` |
| `/food/daily-basket` | `DailyBasketManager` | `/daily-basket` | `daily-basket/index.tsx` | `SEMANTIC_SIMILAR` |
| `/food/slots` | `DeliverySlotManager` | `/food/slots` | `food/slots.tsx` | `EXACT_PATH` |
| `/food/baskets` | `RecurringBasketManager` | `/food/baskets` | `food/baskets.tsx` | `EXACT_PATH` |
| `/food/refunds` | `RefundManager` | `/food/refunds` | `food/refunds.tsx` | `EXACT_PATH` |
| `/fresh-kitchen` | `FreshKitchenHub` | `/fresh-kitchen/combo/:id` | `fresh-kitchen/combo/[id].tsx` | `SEMANTIC_SIMILAR` |
| `/daily-basket` | `DailyBasketManager` | `/daily-basket/scanner` | `daily-basket/scanner.tsx` | `SEMANTIC_SIMILAR` |
| `/wellness/food-journal` | `FoodJournal` | `/wellness/food-journal` | `wellness/food-journal.tsx` | `EXACT_PATH` |
| `/wellness/log-meal` | `MealLogger` | `/wellness/log-meal` | `wellness/log-meal.tsx` | `EXACT_PATH` |
| `/food` | `FoodOpsHub` | `/food/checkout/:id` | `food/checkout/[id].tsx` | `SEMANTIC_SIMILAR` |

#### Web Exclusive Pages (35)

*Pages built in Web that do not currently have a direct screen in Mobile:*

| Web Path | Component | Likely Architectural Rationale |
| :--- | :--- | :--- |
| `/vendor-admin/fresh` | `FreshAdminDashboard` | Administrative dashboard / configuration tool |
| `/vendor-admin/fresh/dashboard` | `FreshAdminDashboard` | Administrative dashboard / configuration tool |
| `/vendor-admin/fresh-dashboard` | `FreshAdminDashboard` | Administrative dashboard / configuration tool |
| `/vendor-admin/fresh-capabilities` | `FreshVendorVerificationHub` | Administrative dashboard / configuration tool |
| `/vendor-admin/fresh/capabilities` | `FreshVendorVerificationHub` | Administrative dashboard / configuration tool |
| `/vendor-admin/fresh/pricing` | `FreshPricingApprovalHub` | Administrative dashboard / configuration tool |
| `/vendor-admin/fresh-pricing` | `FreshPricingApprovalHub` | Administrative dashboard / configuration tool |
| `/vendor-admin/fresh/dispatch` | `FreshDispatchRoutingHub` | Administrative dashboard / configuration tool |
| `/vendor-admin/fresh-dispatch` | `FreshDispatchRoutingHub` | Administrative dashboard / configuration tool |
| `/vendor-admin/fresh/settlements` | `FreshVendorSettlementLedger` | Administrative dashboard / configuration tool |
| `/vendor-admin/fresh-settlements` | `FreshVendorSettlementLedger` | Administrative dashboard / configuration tool |
| `/vendor-portal/fresh-capabilities` | `FreshVendorCapabilityManager` | Vendor back-office desktop portal |
| `/vendor-portal/fresh/capabilities` | `FreshVendorCapabilityManager` | Vendor back-office desktop portal |
| `/vendor-portal/fresh-staff` | `FreshVendorStaffManager` | Vendor back-office desktop portal |
| `/vendor-portal/fresh/staff` | `FreshVendorStaffManager` | Vendor back-office desktop portal |
| `/vendor-portal/fresh/catalog` | `FreshProductCatalogEditor` | Vendor back-office desktop portal |
| `/vendor-portal/fresh-catalog` | `FreshProductCatalogEditor` | Vendor back-office desktop portal |
| `/vendor-portal/fresh-production` | `FreshProcessingProductionHub` | Vendor back-office desktop portal |
| `/vendor-portal/fresh/dispatch` | `FreshDispatchRoutingHub` | Vendor back-office desktop portal |
| `/vendor-portal/fresh-dispatch` | `FreshDispatchRoutingHub` | Vendor back-office desktop portal |
| `/vendor-portal/fresh/settlements` | `FreshVendorSettlementLedger` | Vendor back-office desktop portal |
| `/vendor-portal/fresh-settlements` | `FreshVendorSettlementLedger` | Vendor back-office desktop portal |
| `/food/restaurants` | `RestaurantBrowse` | Desktop-oriented admin / multi-column view |
| `/food/restaurants/:restaurantId` | `RestaurantDetail` | Desktop-oriented admin / multi-column view |
| `/food/orders` | `FoodOrders` | Desktop-oriented admin / multi-column view |
| `/food/recipes` | `RecipePlatform` | Desktop-oriented admin / multi-column view |
| `/food/nutrition` | `NutritionTracker` | Desktop-oriented admin / multi-column view |
| `/food/catering` | `CateringPlatform` | Desktop-oriented admin / multi-column view |
| `/food/profile` | `FoodProfile` | Desktop-oriented admin / multi-column view |
| `/food/analytics` | `FoodAnalyticsDashboard` | Heavy analytical / report generation tool |
| `/food/fresh-kitchen/combos/:id` | `BreakfastComboCustomizer` | Desktop-oriented admin / multi-column view |
| `/food/stock` | `StockManager` | Desktop-oriented admin / multi-column view |
| `/food/batches` | `DeliveryBatchView` | Desktop-oriented admin / multi-column view |
| `/food/prep-analytics` | `VendorPrepAnalytics` | Heavy analytical / report generation tool |
| `/fresh-kitchen/combos/:id` | `BreakfastComboCustomizer` | Desktop-oriented admin / multi-column view |

#### Mobile Exclusive Screens (4)

*Screens built in Mobile that do not currently have a direct route in Web:*

| Mobile Route | File Path | Inferred Role / Hardware Trigger |
| :--- | :--- | :--- |
| `/food/substitutes` | `food/substitutes.tsx` | Mobile-first resident touchpoint |
| `/vendor/fresh/delivery-run` | `vendor/fresh/delivery-run.tsx` | Mobile-first resident touchpoint |
| `/vendor/fresh/packing-manifest` | `vendor/fresh/packing-manifest.tsx` | Mobile-first resident touchpoint |
| `/vendor/fresh/quality-check` | `vendor/fresh/quality-check.tsx` | Mobile-first resident touchpoint |

---

### 3.7 Commerce & Marketplace

**Summary**: Web: **81** pages | Mobile: **83** screens | Shared Parity: **36** | Web Exclusive: **45** | Mobile Exclusive: **47**

#### Shared Capabilities / Direct Parity (36)

| Web Route | Web Component | Mobile Route | Mobile File | Match Type |
| :--- | :--- | :--- | :--- | :--- |
| `/marketplace` | `Marketplace` | `/marketplace` | `marketplace/index.tsx` | `EXACT_PATH` |
| `/marketplace/:id` | `ProductDetail` | `/marketplace/:id` | `marketplace/[id].tsx` | `EXACT_PATH` |
| `/marketplace/my-listings` | `MyListings` | `/marketplace/my-listings` | `marketplace/my-listings.tsx` | `EXACT_PATH` |
| `/marketplace/wishlist` | `WishlistPage` | `/marketplace/wishlist` | `marketplace/wishlist.tsx` | `EXACT_PATH` |
| `/marketplace/orders` | `OrdersPage` | `/marketplace/orders` | `marketplace/orders.tsx` | `EXACT_PATH` |
| `/marketplace/donations` | `DonationsPage` | `/marketplace/donations` | `marketplace/donations.tsx` | `EXACT_PATH` |
| `/marketplace/lost-found` | `LostAndFoundPage` | `/marketplace/lost-found` | `marketplace/lost-found.tsx` | `EXACT_PATH` |
| `/vehicle-care/vendor` | `VehicleCareVendorPortal` | `/vehicle-care/vendor` | `vehicle-care/vendor.tsx` | `EXACT_PATH` |
| `/community/procurement` | `ProcurementDashboard` | `/procurement` | `procurement/index.tsx` | `SEMANTIC_SIMILAR` |
| `/vendor-apply` | `VendorApplication` | `/vendor` | `vendor/index.tsx` | `SEMANTIC_SIMILAR` |
| `/vendor-admin/work-orders` | `WorkOrdersManagement` | `/vendor/tabs/work-orders` | `vendor/tabs/work-orders.tsx` | `SEMANTIC_SIMILAR` |
| `/vendor-admin/analytics` | `VendorAnalytics` | `/vendor/analytics` | `vendor/analytics/index.tsx` | `SEMANTIC_SIMILAR` |
| `/vendor-admin/commerce-vendors` | `CommerceVendorDirectory` | `/commerce` | `commerce/index.tsx` | `SEMANTIC_SIMILAR` |
| `/vendor-portal/availability` | `MyAvailability` | `/vendor/availability` | `vendor/availability.tsx` | `SEMANTIC_SIMILAR` |
| `/vendor-portal/products` | `VendorProductCatalog` | `/vendor/products` | `vendor/products/index.tsx` | `SEMANTIC_SIMILAR` |
| `/vendor-portal/inventory` | `VendorInventoryLedger` | `/vendor/inventory` | `vendor/inventory/index.tsx` | `SEMANTIC_SIMILAR` |
| `/vendor-portal/documents` | `MyDocuments` | `/vendor/documents` | `vendor/documents.tsx` | `SEMANTIC_SIMILAR` |
| `/vendor-portal/profile` | `VendorProfile` | `/group-buying/vendor/:id` | `group-buying/vendor/[id].tsx` | `COMPONENT_MATCH` |
| `/vendor-portal/orders/:orderId/track` | `OrderTrackingPage` | `/orders/:orderId/track` | `orders/[orderId]/track.tsx` | `SEMANTIC_SIMILAR` |
| `/vendor-portal/settlement-management` | `VendorSettlements` | `/vendor/settlements` | `vendor/settlements/index.tsx` | `COMPONENT_MATCH` |
| `/group-buying` | `GroupBuyingHub` | `/group-buying` | `group-buying/index.tsx` | `EXACT_PATH` |
| `/group-buying/deal/:dealId` | `DealDetail` | `/group-buying/deal/:id` | `group-buying/deal/[id].tsx` | `EXACT_PATH` |
| `/group-buying/checkout/:dealId` | `DealCheckout` | `/group-buying/checkout/:id` | `group-buying/checkout/[id].tsx` | `EXACT_PATH` |
| `/group-buying/almost-unlocked` | `AlmostUnlocked` | `/group-buying/almost-unlocked` | `group-buying/almost-unlocked.tsx` | `EXACT_PATH` |
| `/group-buying/festival-deals` | `FestivalDeals` | `/group-buying/festival` | `group-buying/festival.tsx` | `SEMANTIC_SIMILAR` |
| `/group-buying/monthly-baskets` | `MonthlyBaskets` | `/group-buying/baskets` | `group-buying/baskets.tsx` | `COMPONENT_MATCH` |
| `/group-buying/buy-again` | `BuyAgain` | `/group-buying/buy-again` | `group-buying/buy-again.tsx` | `EXACT_PATH` |
| `/group-buying/buying-groups` | `BuyingGroups` | `/group-buying/tower-groups` | `group-buying/tower-groups.tsx` | `SEMANTIC_SIMILAR` |
| `/group-buying/savings` | `CommunitySavingsDashboard` | `/group-buying/community-savings` | `group-buying/community-savings.tsx` | `SEMANTIC_SIMILAR` |
| `/group-buying/my-orders` | `GroupBuyingMyOrders` | `/group-buying/orders` | `group-buying/orders/index.tsx` | `SEMANTIC_SIMILAR` |
| `/group-buying/demand-board` | `DemandBoard` | `/group-buying/demand` | `group-buying/demand/index.tsx` | `COMPONENT_MATCH` |
| `/group-buying/demand/:demandId` | `DemandDetail` | `/group-buying/demand/:id` | `group-buying/demand/[id].tsx` | `EXACT_PATH` |
| `/group-buying/pickup-pass/:orderId` | `PickupPassPage` | `/group-buying/pickup/scan` | `group-buying/pickup/scan.tsx` | `SEMANTIC_SIMILAR` |
| `/group-buying/pickup-scanner` | `PickupScanner` | `/group-buying/pickup/:id` | `group-buying/pickup/[id].tsx` | `SEMANTIC_SIMILAR` |
| `/group-buying/review/:orderId` | `OrderReviewPage` | `/group-buying/orders/:id/review` | `group-buying/orders/[id]/review.tsx` | `SEMANTIC_SIMILAR` |
| `/group-buying/dispute/:orderId` | `OrderDisputePage` | `/group-buying/orders/:id/dispute` | `group-buying/orders/[id]/dispute.tsx` | `SEMANTIC_SIMILAR` |

#### Web Exclusive Pages (45)

*Pages built in Web that do not currently have a direct screen in Mobile:*

| Web Path | Component | Likely Architectural Rationale |
| :--- | :--- | :--- |
| `/vendor-admin` | `VendorAdminDashboard` | Administrative dashboard / configuration tool |
| `/vendor-admin/vendors` | `VendorDirectory` | Administrative dashboard / configuration tool |
| `/vendor-admin/registrations` | `VendorRegistrations` | Administrative dashboard / configuration tool |
| `/vendor-admin/categories` | `VendorCategories` | Administrative dashboard / configuration tool |
| `/vendor-admin/contracts` | `ContractsManagement` | Administrative dashboard / configuration tool |
| `/vendor-admin/payments` | `PaymentsManagement` | Administrative dashboard / configuration tool |
| `/vendor-admin/commerce-catalog` | `CommerceProductCatalog` | Administrative dashboard / configuration tool |
| `/vendor-admin/commerce-orders` | `VendorOrderManagement` | Administrative dashboard / configuration tool |
| `/vendor-portal` | `VendorPortalDashboard` | Vendor back-office desktop portal |
| `/vendor-portal/production-capacity` | `VendorProductionCapacityView` | Vendor back-office desktop portal |
| `/vendor-portal/capacity` | `VendorProductionCapacityView` | Vendor back-office desktop portal |
| `/vendor-portal/payments` | `MyPayments` | Vendor back-office desktop portal |
| `/vendor-portal/merchant-payments` | `VendorMerchantPayments` | Vendor back-office desktop portal |
| `/vendor-portal/verification` | `VendorVerification` | Vendor back-office desktop portal |
| `/vendor-portal/ratings` | `MyRatings` | Vendor back-office desktop portal |
| `/vendor-portal/commerce-profile` | `VendorCommerceProfile` | Vendor back-office desktop portal |
| `/vendor-portal/commerce-products` | `CommerceProductCatalog` | Vendor back-office desktop portal |
| `/vendor-portal/my-commerce-profile` | `MyCommerceProfile` | Vendor back-office desktop portal |
| `/vendor-portal/loyalty-wallet` | `LoyaltyWallet` | Vendor back-office desktop portal |
| `/vendor-portal/my-orders` | `MyOrders` | Vendor back-office desktop portal |
| `/vendor-portal/order-management` | `VendorOrderManagement` | Administrative dashboard / configuration tool |
| `/vendor-portal/grocery-orders` | `VendorGroceryOrders` | Vendor back-office desktop portal |
| `/vendor-portal/admin-settlements` | `SettlementManagement` | Administrative dashboard / configuration tool |
| `/vendor-portal/commerce-analytics` | `CommerceAnalyticsDashboard` | Vendor back-office desktop portal |
| `/vendor-portal/flash-sales` | `FlashSaleManagement` | Vendor back-office desktop portal |
| `/vendor-portal/vendor-ratings` | `VendorRatingsDashboard` | Vendor back-office desktop portal |
| `/vendor-portal/dispute-management` | `DisputeManagement` | Administrative dashboard / configuration tool |
| `/vendor-portal/commission-rules` | `CommissionRulesManager` | Vendor back-office desktop portal |
| `/vendor-portal/subscriptions` | `SubscriptionManagement` | Vendor back-office desktop portal |
| `/vendor-portal/returns` | `ReturnExchangeManagement` | Vendor back-office desktop portal |
| `/vendor-portal/wallet` | `WalletDashboard` | Vendor back-office desktop portal |
| `/vendor-portal/bulk-orders` | `BulkOrderManagement` | Vendor back-office desktop portal |
| `/vendor-portal/coupon-management` | `CouponManagement` | Administrative dashboard / configuration tool |
| `/vendor-marketplace/vendor/:vendorId` | `VendorProfilePublic` | Vendor back-office desktop portal |
| `/vendor-marketplace/favorites` | `FavoriteVendors` | Vendor back-office desktop portal |
| `/group-buying/deals` | `DealsListing` | Desktop-oriented admin / multi-column view |
| `/group-buying/ai-search` | `AIDemandSearch` | Desktop-oriented admin / multi-column view |
| `/group-buying/vendor/:vendorId` | `VendorProfilePage` | Vendor back-office desktop portal |
| `/group-buying/catalog` | `GroupBuyingCatalog` | Desktop-oriented admin / multi-column view |
| `/vendor/portal/capacity` | `VendorProductionCapacityView` | Vendor back-office desktop portal |
| `/deals/admin` | `CommerceAdminHub` | Administrative dashboard / configuration tool |
| `/commerce` | `CommerceDashboard` | Desktop-oriented admin / multi-column view |
| `/commerce-hub` | `ManaCommerceHub` | Desktop-oriented admin / multi-column view |
| `/commerce/handover` | `ManaCommerceHub` | Desktop-oriented admin / multi-column view |
| `/marketplace/group-orders` | `GroupOrdersPage` | Desktop-oriented admin / multi-column view |

#### Mobile Exclusive Screens (47)

*Screens built in Mobile that do not currently have a direct route in Web:*

| Mobile Route | File Path | Inferred Role / Hardware Trigger |
| :--- | :--- | :--- |
| `/bazaar` | `bazaar/index.tsx` | Mobile-first resident touchpoint |
| `/bazaar/:id` | `bazaar/[id].tsx` | Mobile-first resident touchpoint |
| `/finance/unified-vendors` | `finance/unified-vendors.tsx` | Mobile-first resident touchpoint |
| `/finance/vendor-bills` | `finance/vendor-bills.tsx` | Mobile-first resident touchpoint |
| `/finance/vendors` | `finance/vendors.tsx` | Mobile-first resident touchpoint |
| `/group-buying/ask-community` | `group-buying/ask-community.tsx` | Mobile-first resident touchpoint |
| `/group-buying/join-success/:orderId` | `group-buying/join-success/[orderId].tsx` | Mobile-first resident touchpoint |
| `/inventory/procurement` | `inventory/procurement.tsx` | Mobile-first resident touchpoint |
| `/kitty-party/kittyPartyVendorPackagesScreen` | `kitty-party/kittyPartyVendorPackagesScreen.tsx` | Mobile-first resident touchpoint |
| `/marketplace/create` | `marketplace/create.tsx` | Mobile-first resident touchpoint |
| `/marketplace/sellers` | `marketplace/sellers/index.tsx` | Mobile-first resident touchpoint |
| `/marketplace/sellers/:id` | `marketplace/sellers/[id].tsx` | Mobile-first resident touchpoint |
| `/offers/market-days` | `offers/market-days.tsx` | Mobile-first resident touchpoint |
| `/offers/organizer` | `offers/organizer.tsx` | Mobile-first resident touchpoint |
| `/parking/marketplace` | `parking/marketplace.tsx` | Mobile-first resident touchpoint |
| `/procurement/add-product` | `procurement/add-product.tsx` | Mobile-first resident touchpoint |
| `/procurement/analytics` | `procurement/analytics.tsx` | Mobile-first resident touchpoint |
| `/procurement/association` | `procurement/association.tsx` | Mobile-first resident touchpoint |
| `/procurement/bulkbuy` | `procurement/bulkbuy/index.tsx` | Mobile-first resident touchpoint |
| `/procurement/bulkbuy/new` | `procurement/bulkbuy/new.tsx` | Mobile-first resident touchpoint |
| `/procurement/bulkbuy/:id` | `procurement/bulkbuy/[id].tsx` | Mobile-first resident touchpoint |
| `/procurement/calendar` | `procurement/calendar/index.tsx` | Mobile-first resident touchpoint |
| `/procurement/calendar/new` | `procurement/calendar/new.tsx` | Mobile-first resident touchpoint |
| `/procurement/finance` | `procurement/finance.tsx` | Mobile-first resident touchpoint |
| `/procurement/mana-buddy` | `procurement/mana-buddy.tsx` | Mobile-first resident touchpoint |
| `/procurement/manage-suppliers` | `procurement/manage-suppliers.tsx` | Mobile-first resident touchpoint |
| `/procurement/purchase-orders` | `procurement/purchase-orders.tsx` | Mobile-first resident touchpoint |
| `/procurement/record-delivery` | `procurement/record-delivery.tsx` | Mobile-first resident touchpoint |
| `/procurement/reorder-suggestions` | `procurement/reorder-suggestions.tsx` | Mobile-first resident touchpoint |
| `/procurement/rfq/new` | `procurement/rfq/new.tsx` | Mobile-first resident touchpoint |
| `/procurement/rfq/:id` | `procurement/rfq/[id].tsx` | Mobile-first resident touchpoint |
| `/procurement/savings-dashboard` | `procurement/savings-dashboard.tsx` | Mobile-first resident touchpoint |
| `/procurement/submit-quote` | `procurement/submit-quote.tsx` | Mobile-first resident touchpoint |
| `/procurement/supplier/:id` | `procurement/supplier/[id].tsx` | Mobile-first resident touchpoint |
| `/procurement/supplier-marketplace` | `procurement/supplier-marketplace.tsx` | Mobile-first resident touchpoint |
| `/tabs/marketplace` | `tabs/marketplace.tsx` | Mobile-first resident touchpoint |
| `/vendor/deals/create` | `vendor/deals/create.tsx` | Mobile-first resident touchpoint |
| `/vendor/deals` | `vendor/deals/index.tsx` | Mobile-first resident touchpoint |
| `/vendor/deals/:id/manifest` | `vendor/deals/[id]/manifest.tsx` | Mobile-first resident touchpoint |
| `/vendor/demand/bidding` | `vendor/demand/bidding.tsx` | Mobile-first resident touchpoint |
| `/vendor/products/create` | `vendor/products/create.tsx` | Mobile-first resident touchpoint |
| `/vendor/tabs/dashboard` | `vendor/tabs/dashboard.tsx` | Mobile-first resident touchpoint |
| `/vendor/tabs/payments` | `vendor/tabs/payments.tsx` | Mobile-first resident touchpoint |
| `/vendor/tabs/profile` | `vendor/tabs/profile.tsx` | Mobile-first resident touchpoint |
| `/vendor-finance` | `vendor-finance/index.tsx` | Mobile-first resident touchpoint |
| `/vendor-finance/khata` | `vendor-finance/khata.tsx` | Indian Fintech / UPI native app integration |
| `/vendor-finance/reports` | `vendor-finance/reports.tsx` | Mobile-first resident touchpoint |

---

### 3.8 Finance, Payments & Fintech

**Summary**: Web: **29** pages | Mobile: **64** screens | Shared Parity: **18** | Web Exclusive: **11** | Mobile Exclusive: **46**

#### Shared Capabilities / Direct Parity (18)

| Web Route | Web Component | Mobile Route | Mobile File | Match Type |
| :--- | :--- | :--- | :--- | :--- |
| `/finance/expenses` | `LedgerFinance` | `/finance/expenses` | `finance/expenses.tsx` | `EXACT_PATH` |
| `/finance/invoices` | `LedgerFinance` | `/finance/invoices` | `finance/invoices.tsx` | `EXACT_PATH` |
| `/finance/accounting` | `LedgerFinance` | `/finance/accounting` | `finance/accounting.tsx` | `EXACT_PATH` |
| `/finance/budget` | `BudgetDashboard` | `/finance/budget` | `finance/budget.tsx` | `EXACT_PATH` |
| `/finance/reports` | `FinancialReports` | `/finance` | `finance/index.tsx` | `SEMANTIC_SIMILAR` |
| `/finance/billing` | `AdminBillingDashboard` | `/finance/bulk-billing` | `finance/bulk-billing.tsx` | `SEMANTIC_SIMILAR` |
| `/finance/bills` | `BillsAndAutopayDashboard` | `/personal-finance/bills` | `personal-finance/bills.tsx` | `SEMANTIC_SIMILAR` |
| `/payments` | `ManaPayHub` | `/payments` | `payments/index.tsx` | `EXACT_PATH` |
| `/split` | `ManaSplitHub` | `/split-bill` | `split-bill/index.tsx` | `SEMANTIC_SIMILAR` |
| `/split/:groupId` | `ManaSplitHub` | `/trips/split` | `trips/split.tsx` | `SEMANTIC_SIMILAR` |
| `/gold` | `GoldPortal` | `/gold` | `gold/index.tsx` | `EXACT_PATH` |
| `/fd` | `FDPortal` | `/fd` | `fd/index.tsx` | `EXACT_PATH` |
| `/loans` | `LoanPortal` | `/loans` | `loans/index.tsx` | `EXACT_PATH` |
| `/personal-finance` | `PersonalFinanceDashboard` | `/personal-finance` | `personal-finance/index.tsx` | `EXACT_PATH` |
| `/recharge` | `MobileRechargeHub` | `/recharge` | `recharge/index.tsx` | `EXACT_PATH` |
| `/kitty-party` | `KittyPartyDashboard` | `/kitty-party/kittyPartyCreateScreen` | `kitty-party/kittyPartyCreateScreen.tsx` | `SEMANTIC_SIMILAR` |
| `/kitty-party/:id` | `KittyPartyCircleDetails` | `/kitty-party/kittyPartyDetailsScreen` | `kitty-party/kittyPartyDetailsScreen.tsx` | `SEMANTIC_SIMILAR` |
| `/finance/wallet` | `CommunityWalletPage` | `/wallet` | `wallet/index.tsx` | `SEMANTIC_SIMILAR` |

#### Web Exclusive Pages (11)

*Pages built in Web that do not currently have a direct screen in Mobile:*

| Web Path | Component | Likely Architectural Rationale |
| :--- | :--- | :--- |
| `/cpos/finance` | `CPOSFinanceDashboard` | Vendor back-office desktop portal |
| `/finance/maintenance` | `MaintenanceDues` | Desktop-oriented admin / multi-column view |
| `/bills` | `BillsAndAutopayDashboard` | Desktop-oriented admin / multi-column view |
| `/split-bill` | `SplitBillPortal` | Desktop-oriented admin / multi-column view |
| `/payments-ops` | `PaymentsHub` | Administrative dashboard / configuration tool |
| `/kitty-party/discover` | `KittyPartyCircleList` | Desktop-oriented admin / multi-column view |
| `/kitty-party/create` | `KittyPartyCreateCircle` | Desktop-oriented admin / multi-column view |
| `/kitty-party/:id/ledger` | `KittyPartyLedgerView` | Desktop-oriented admin / multi-column view |
| `/kitty-party/:id/housie` | `KittyPartyHousieRoom` | Desktop-oriented admin / multi-column view |
| `/kitty-party/:id/expenses` | `KittyPartyExpenseSplitView` | Desktop-oriented admin / multi-column view |
| `/finance/compliance` | `ComplianceReportsPage` | Desktop-oriented admin / multi-column view |

#### Mobile Exclusive Screens (46)

*Screens built in Mobile that do not currently have a direct route in Web:*

| Mobile Route | File Path | Inferred Role / Hardware Trigger |
| :--- | :--- | :--- |
| `/admin-role/tabs/finance` | `admin-role/tabs/finance.tsx` | Mobile-first resident touchpoint |
| `/bbps/fetch-bill` | `bbps/fetch-bill.tsx` | Indian Fintech / UPI native app integration |
| `/bbps` | `bbps/index.tsx` | Indian Fintech / UPI native app integration |
| `/finance/accounting-periods` | `finance/accounting-periods.tsx` | Mobile-first resident touchpoint |
| `/finance/bank-reconciliation` | `finance/bank-reconciliation.tsx` | Mobile-first resident touchpoint |
| `/finance/cheque-tracking` | `finance/cheque-tracking.tsx` | Live GPS / location tracking experience |
| `/finance/ledger` | `finance/ledger.tsx` | Mobile-first resident touchpoint |
| `/finance/pg-settlements` | `finance/pg-settlements.tsx` | Mobile-first resident touchpoint |
| `/finance/society-dashboard` | `finance/society-dashboard.tsx` | Mobile-first resident touchpoint |
| `/finance/society-reports` | `finance/society-reports.tsx` | Mobile-first resident touchpoint |
| `/finance/tally-export` | `finance/tally-export.tsx` | Mobile-first resident touchpoint |
| `/finance/tds-challan` | `finance/tds-challan.tsx` | Mobile-first resident touchpoint |
| `/health/gold` | `health/gold/index.tsx` | Mobile-first resident touchpoint |
| `/kitty-party/kittyPartyExpenseScreen` | `kitty-party/kittyPartyExpenseScreen.tsx` | Mobile-first resident touchpoint |
| `/kitty-party/kittyPartyFeedScreen` | `kitty-party/kittyPartyFeedScreen.tsx` | Mobile-first resident touchpoint |
| `/kitty-party/kittyPartyHousieScreen` | `kitty-party/kittyPartyHousieScreen.tsx` | Mobile-first resident touchpoint |
| `/kitty-party/kittyPartyIndex` | `kitty-party/kittyPartyIndex.tsx` | Mobile-first resident touchpoint |
| `/kitty-party/kittyPartyLeaderboardScreen` | `kitty-party/kittyPartyLeaderboardScreen.tsx` | Mobile-first resident touchpoint |
| `/kitty-party/kittyPartyLedgerScreen` | `kitty-party/kittyPartyLedgerScreen.tsx` | Mobile-first resident touchpoint |
| `/mutual-funds` | `mutual-funds/index.tsx` | Mobile-first resident touchpoint |
| `/payment-result` | `payment-result.tsx` | Mobile-first resident touchpoint |
| `/payments/admin-report` | `payments/admin-report.tsx` | Mobile-first resident touchpoint |
| `/payments/auto-debit` | `payments/auto-debit.tsx` | Mobile-first resident touchpoint |
| `/payments/disputes` | `payments/disputes.tsx` | Mobile-first resident touchpoint |
| `/payments/history` | `payments/history.tsx` | Mobile-first resident touchpoint |
| `/payments/receipt` | `payments/receipt.tsx` | Mobile-first resident touchpoint |
| `/payments/receipts` | `payments/receipts.tsx` | Mobile-first resident touchpoint |
| `/payments/reminders` | `payments/reminders.tsx` | Mobile-first resident touchpoint |
| `/payments/rewards` | `payments/rewards.tsx` | Mobile-first resident touchpoint |
| `/payments/timeline` | `payments/timeline.tsx` | Mobile-first resident touchpoint |
| `/personal-finance/accounts` | `personal-finance/accounts.tsx` | Mobile-first resident touchpoint |
| `/personal-finance/budgets` | `personal-finance/budgets.tsx` | Mobile-first resident touchpoint |
| `/personal-finance/calendar` | `personal-finance/calendar.tsx` | Mobile-first resident touchpoint |
| `/personal-finance/categories` | `personal-finance/categories.tsx` | Mobile-first resident touchpoint |
| `/personal-finance/goals` | `personal-finance/goals.tsx` | Mobile-first resident touchpoint |
| `/personal-finance/installments` | `personal-finance/installments.tsx` | Mobile-first resident touchpoint |
| `/personal-finance/khata` | `personal-finance/khata.tsx` | Indian Fintech / UPI native app integration |
| `/personal-finance/receipts` | `personal-finance/receipts.tsx` | Mobile-first resident touchpoint |
| `/personal-finance/recurring` | `personal-finance/recurring.tsx` | Mobile-first resident touchpoint |
| `/personal-finance/reports` | `personal-finance/reports.tsx` | Mobile-first resident touchpoint |
| `/personal-finance/settings` | `personal-finance/settings.tsx` | Mobile-first resident touchpoint |
| `/personal-finance/transactions` | `personal-finance/transactions.tsx` | Mobile-first resident touchpoint |
| `/recharge/plans` | `recharge/plans.tsx` | Mobile-first resident touchpoint |
| `/scan-and-pay` | `scan-and-pay/index.tsx` | Camera / QR code scanner feature |
| `/social/:groupId` | `social/[groupId].tsx` | Indian Fintech / UPI native app integration |
| `/upi-history` | `upi-history/index.tsx` | Indian Fintech / UPI native app integration |

---

### 3.9 HRM & Workforce Operations

**Summary**: Web: **27** pages | Mobile: **24** screens | Shared Parity: **15** | Web Exclusive: **12** | Mobile Exclusive: **9**

#### Shared Capabilities / Direct Parity (15)

| Web Route | Web Component | Mobile Route | Mobile File | Match Type |
| :--- | :--- | :--- | :--- | :--- |
| `/staff` | `StaffManagement` | `/staff` | `staff/index.tsx` | `EXACT_PATH` |
| `/ops/attendance` | `StaffAttendance` | `/ops/attendance` | `ops/attendance.tsx` | `EXACT_PATH` |
| `/hrm` | `HrmDashboard` | `/hrm` | `hrm/index.tsx` | `EXACT_PATH` |
| `/hrm/attendance` | `AttendanceManagement` | `/hrm/attendance` | `hrm/attendance.tsx` | `EXACT_PATH` |
| `/hrm/leaves` | `LeaveManagement` | `/hrm/leaves` | `hrm/leaves.tsx` | `EXACT_PATH` |
| `/hrm/shifts` | `ShiftManagement` | `/hrm/shifts` | `hrm/shifts.tsx` | `EXACT_PATH` |
| `/hrm/performance` | `HrmPerformancePage` | `/hrm/performance` | `hrm/performance.tsx` | `EXACT_PATH` |
| `/hrm/expenses` | `HrmExpensePage` | `/hrm/expenses` | `hrm/expenses.tsx` | `EXACT_PATH` |
| `/hrm/tasks` | `HrmTasksPage` | `/hrm/tasks` | `hrm/tasks.tsx` | `EXACT_PATH` |
| `/hrm/analytics` | `HrmAnalyticsPage` | `/hrm/analytics` | `hrm/analytics.tsx` | `EXACT_PATH` |
| `/hrm/compliance` | `HrmCompliancePage` | `/hrm/compliance` | `hrm/compliance.tsx` | `EXACT_PATH` |
| `/hrm/workforce-pool` | `HrmWorkforcePoolPage` | `/hrm/pool` | `hrm/pool.tsx` | `SEMANTIC_SIMILAR` |
| `/hrm/duty-handover` | `HrmDutyHandoverPage` | `/hrm/handover` | `hrm/handover.tsx` | `SEMANTIC_SIMILAR` |
| `/hrm/integrations` | `HrmIntegrationsPage` | `/hrm/integrations` | `hrm/integrations.tsx` | `EXACT_PATH` |
| `/hrm/forecasting` | `HrmForecastingPage` | `/hrm/forecasting` | `hrm/forecasting.tsx` | `EXACT_PATH` |

#### Web Exclusive Pages (12)

*Pages built in Web that do not currently have a direct screen in Mobile:*

| Web Path | Component | Likely Architectural Rationale |
| :--- | :--- | :--- |
| `/hrm/employees` | `EmployeeDirectory` | Desktop-oriented admin / multi-column view |
| `/hrm/employees/:employeeId` | `EmployeeProfile` | Desktop-oriented admin / multi-column view |
| `/hrm/recruitment` | `HrmRecruitmentPage` | Desktop-oriented admin / multi-column view |
| `/hrm/learning` | `HrmLearningPage` | Desktop-oriented admin / multi-column view |
| `/hrm/payroll` | `HrmPayrollPage` | Desktop-oriented admin / multi-column view |
| `/hrm/assets` | `HrmAssetPage` | Desktop-oriented admin / multi-column view |
| `/hrm/audit` | `HrmAuditPage` | Desktop-oriented admin / multi-column view |
| `/hrm/roles` | `HrmRolesPage` | Desktop-oriented admin / multi-column view |
| `/hrm/reports` | `HrmReportsPage` | Heavy analytical / report generation tool |
| `/hrm/job-board` | `HrmJobBoardPage` | Desktop-oriented admin / multi-column view |
| `/hrm/settings` | `HrmSettings` | Desktop-oriented admin / multi-column view |
| `/hrm/org-chart` | `OrgChartPage` | Desktop-oriented admin / multi-column view |

#### Mobile Exclusive Screens (9)

*Screens built in Mobile that do not currently have a direct route in Web:*

| Mobile Route | File Path | Inferred Role / Hardware Trigger |
| :--- | :--- | :--- |
| `/hrm/apply-leave` | `hrm/apply-leave.tsx` | Mobile-first resident touchpoint |
| `/hrm/approvals` | `hrm/approvals.tsx` | Mobile-first resident touchpoint |
| `/hrm/compliance-alerts` | `hrm/compliance-alerts.tsx` | Mobile-first resident touchpoint |
| `/hrm/jobs` | `hrm/jobs.tsx` | Mobile-first resident touchpoint |
| `/hrm/payslips` | `hrm/payslips.tsx` | Mobile-first resident touchpoint |
| `/hrm/profile` | `hrm/profile.tsx` | Mobile-first resident touchpoint |
| `/hrm/recognition` | `hrm/recognition.tsx` | Mobile-first resident touchpoint |
| `/hrm/timesheets` | `hrm/timesheets.tsx` | Mobile-first resident touchpoint |
| `/staff/payroll` | `staff/payroll.tsx` | Mobile-first resident touchpoint |

---

### 3.10 Healthcare & Wellness

**Summary**: Web: **22** pages | Mobile: **40** screens | Shared Parity: **10** | Web Exclusive: **12** | Mobile Exclusive: **30**

#### Shared Capabilities / Direct Parity (10)

| Web Route | Web Component | Mobile Route | Mobile File | Match Type |
| :--- | :--- | :--- | :--- | :--- |
| `/wellness-basket` | `WellnessHub` | `/wellness-basket` | `wellness-basket/index.tsx` | `EXACT_PATH` |
| `/wellness-basket/admin` | `DietitianReviewPortal` | `/wellness` | `wellness/index.tsx` | `SEMANTIC_SIMILAR` |
| `/health` | `HealthPortal` | `/health` | `health/index.tsx` | `EXACT_PATH` |
| `/health` | `HealthDashboard` | `/health/abha` | `health/abha/index.tsx` | `SEMANTIC_SIMILAR` |
| `/wellness` | `WellnessDashboard` | `/wellness/challenges` | `wellness/challenges.tsx` | `SEMANTIC_SIMILAR` |
| `/wellness/water` | `WaterTracker` | `/wellness/water-tracker` | `wellness/water-tracker.tsx` | `COMPONENT_MATCH` |
| `/wellness/providers` | `WellnessProviders` | `/wellness/providers` | `wellness/providers.tsx` | `EXACT_PATH` |
| `/wellness/profile` | `WellnessProfilePage` | `/wellness/profile` | `wellness/profile.tsx` | `EXACT_PATH` |
| `/healthcare` | `HealthcareHub` | `/healthcare` | `healthcare/index.tsx` | `EXACT_PATH` |
| `/health/:tab` | `HealthSubRouteRedirect` | `/health/ai-assistant` | `health/ai-assistant.tsx` | `SEMANTIC_SIMILAR` |

#### Web Exclusive Pages (12)

*Pages built in Web that do not currently have a direct screen in Mobile:*

| Web Path | Component | Likely Architectural Rationale |
| :--- | :--- | :--- |
| `/wellness/challenges` | `WellnessChallenges` | Desktop-oriented admin / multi-column view |
| `/wellness/log-workout` | `WorkoutLogger` | Desktop-oriented admin / multi-column view |
| `/wellness/workouts` | `WorkoutHistory` | Desktop-oriented admin / multi-column view |
| `/wellness/body-metrics` | `BodyMetricsTimeline` | Desktop-oriented admin / multi-column view |
| `/wellness/goals` | `ActivityGoalSettings` | Desktop-oriented admin / multi-column view |
| `/wellness/steps` | `StepCounterWidget` | Desktop-oriented admin / multi-column view |
| `/wellness/devices` | `WearableDevices` | Desktop-oriented admin / multi-column view |
| `/wellness/fitness` | `UnifiedFitnessDashboard` | Desktop-oriented admin / multi-column view |
| `/wellness/trainer-programs` | `TrainerPrograms` | Desktop-oriented admin / multi-column view |
| `/wellness/trainer-programs/:id` | `TrainerProgramDetail` | Desktop-oriented admin / multi-column view |
| `/wellness/calories` | `CalorieTracker` | Desktop-oriented admin / multi-column view |
| `/healthcare-ops` | `HealthcareOpsHub` | Administrative dashboard / configuration tool |

#### Mobile Exclusive Screens (30)

*Screens built in Mobile that do not currently have a direct route in Web:*

| Mobile Route | File Path | Inferred Role / Hardware Trigger |
| :--- | :--- | :--- |
| `/health/appointments/book` | `health/appointments/book.tsx` | Mobile-first resident touchpoint |
| `/health/appointments/video-room` | `health/appointments/video-room.tsx` | Native WebRTC / push call intercom |
| `/health/appointments/:id` | `health/appointments/[id].tsx` | Mobile-first resident touchpoint |
| `/health/benefits` | `health/benefits/index.tsx` | Mobile-first resident touchpoint |
| `/health/camps` | `health/camps/index.tsx` | Mobile-first resident touchpoint |
| `/health/cancer` | `health/cancer/index.tsx` | Mobile-first resident touchpoint |
| `/health/care-journey` | `health/care-journey/index.tsx` | Mobile-first resident touchpoint |
| `/health/checkout/:id` | `health/checkout/[id].tsx` | Mobile-first resident touchpoint |
| `/health/dental` | `health/dental/index.tsx` | Mobile-first resident touchpoint |
| `/health/doctors` | `health/doctors/index.tsx` | Mobile-first resident touchpoint |
| `/health/doctors/:id` | `health/doctors/[id].tsx` | Mobile-first resident touchpoint |
| `/health/emergency` | `health/emergency.tsx` | Mobile-first resident touchpoint |
| `/health/family` | `health/family/index.tsx` | Mobile-first resident touchpoint |
| `/health/homecare` | `health/homecare/index.tsx` | Mobile-first resident touchpoint |
| `/health/hospitals` | `health/hospitals/index.tsx` | Mobile-first resident touchpoint |
| `/health/ipd` | `health/ipd/index.tsx` | Mobile-first resident touchpoint |
| `/health/labs` | `health/labs/index.tsx` | Mobile-first resident touchpoint |
| `/health/mental-health` | `health/mental-health/index.tsx` | Mobile-first resident touchpoint |
| `/health/pharmacy` | `health/pharmacy/index.tsx` | Mobile-first resident touchpoint |
| `/health/provider` | `health/provider/index.tsx` | Mobile-first resident touchpoint |
| `/health/radiology` | `health/radiology/index.tsx` | Mobile-first resident touchpoint |
| `/health/records` | `health/records/index.tsx` | Mobile-first resident touchpoint |
| `/health/surgery` | `health/surgery/index.tsx` | Mobile-first resident touchpoint |
| `/healthcare/caregiver` | `healthcare/caregiver.tsx` | Mobile-first resident touchpoint |
| `/healthcare/credentials` | `healthcare/credentials.tsx` | Mobile-first resident touchpoint |
| `/healthcare/diagnostics` | `healthcare/diagnostics.tsx` | Mobile-first resident touchpoint |
| `/healthcare/followups` | `healthcare/followups.tsx` | Mobile-first resident touchpoint |
| `/healthcare/referrals` | `healthcare/referrals.tsx` | Mobile-first resident touchpoint |
| `/wellness-basket/plan-builder` | `wellness-basket/plan-builder.tsx` | Mobile-first resident touchpoint |
| `/wellness-basket/weekly-menu` | `wellness-basket/weekly-menu.tsx` | Mobile-first resident touchpoint |

---

### 3.11 IoT & Smart Facilities

**Summary**: Web: **4** pages | Mobile: **6** screens | Shared Parity: **4** | Web Exclusive: **0** | Mobile Exclusive: **2**

#### Shared Capabilities / Direct Parity (4)

| Web Route | Web Component | Mobile Route | Mobile File | Match Type |
| :--- | :--- | :--- | :--- | :--- |
| `/iot/meters` | `SmartMeterDashboard` | `/iot/meters` | `iot/meters.tsx` | `EXACT_PATH` |
| `/automation` | `AutomationDashboard` | `/automation` | `automation/index.tsx` | `EXACT_PATH` |
| `/ops/devices` | `SmartDevicesPage` | `/devices` | `devices/index.tsx` | `SEMANTIC_SIMILAR` |
| `/ops/iot` | `IoTSensorDashboard` | `/iot` | `iot/index.tsx` | `SEMANTIC_SIMILAR` |

#### Mobile Exclusive Screens (2)

*Screens built in Mobile that do not currently have a direct route in Web:*

| Mobile Route | File Path | Inferred Role / Hardware Trigger |
| :--- | :--- | :--- |
| `/automation/builder` | `automation/builder.tsx` | Mobile-first resident touchpoint |
| `/community/iot` | `community/iot.tsx` | Mobile-first resident touchpoint |

---

### 3.12 Mobility, Parking & Commute

**Summary**: Web: **6** pages | Mobile: **42** screens | Shared Parity: **6** | Web Exclusive: **0** | Mobile Exclusive: **36**

#### Shared Capabilities / Direct Parity (6)

| Web Route | Web Component | Mobile Route | Mobile File | Match Type |
| :--- | :--- | :--- | :--- | :--- |
| `/vehicle-care` | `VehicleCareAdminDashboard` | `/vehicle-care` | `vehicle-care/index.tsx` | `EXACT_PATH` |
| `/parking` | `ParkingManagement` | `/parking` | `parking/index.tsx` | `EXACT_PATH` |
| `/parking/ev-charging` | `EvChargingManagement` | `/parking/ev-charging` | `parking/ev-charging.tsx` | `EXACT_PATH` |
| `/trips` | `ExploreTrips` | `/trips` | `trips/index.tsx` | `EXACT_PATH` |
| `/commute` | `CommuteDashboard` | `/commute` | `commute/index.tsx` | `EXACT_PATH` |
| `/mobility` | `MobilityDashboard` | `/mobility` | `mobility/index.tsx` | `EXACT_PATH` |

#### Mobile Exclusive Screens (36)

*Screens built in Mobile that do not currently have a direct route in Web:*

| Mobile Route | File Path | Inferred Role / Hardware Trigger |
| :--- | :--- | :--- |
| `/admin-role/mobility` | `admin-role/mobility.tsx` | Mobile-first resident touchpoint |
| `/commute/find-rides` | `commute/find-rides.tsx` | Live GPS / location tracking experience |
| `/commute/my-rides` | `commute/my-rides.tsx` | Live GPS / location tracking experience |
| `/commute/offer-ride` | `commute/offer-ride.tsx` | Live GPS / location tracking experience |
| `/commute/ride/:id` | `commute/ride/[id].tsx` | Live GPS / location tracking experience |
| `/mobility/airport-rides/create` | `mobility/airport-rides/create.tsx` | Live GPS / location tracking experience |
| `/mobility/airport-rides/demand` | `mobility/airport-rides/demand.tsx` | Live GPS / location tracking experience |
| `/mobility/airport-rides` | `mobility/airport-rides/index.tsx` | Live GPS / location tracking experience |
| `/mobility/airport-rides/request` | `mobility/airport-rides/request.tsx` | Live GPS / location tracking experience |
| `/mobility/book` | `mobility/book.tsx` | Mobile-first resident touchpoint |
| `/mobility/carpool` | `mobility/carpool/index.tsx` | Mobile-first resident touchpoint |
| `/mobility/driver` | `mobility/driver/index.tsx` | Mobile-first resident touchpoint |
| `/mobility/driver/onboard` | `mobility/driver/onboard.tsx` | Mobile-first resident touchpoint |
| `/mobility/history` | `mobility/history.tsx` | Mobile-first resident touchpoint |
| `/mobility/journeys` | `mobility/journeys/index.tsx` | Mobile-first resident touchpoint |
| `/mobility/journeys/offer` | `mobility/journeys/offer.tsx` | Mobile-first resident touchpoint |
| `/mobility/journeys/passengers` | `mobility/journeys/passengers.tsx` | Mobile-first resident touchpoint |
| `/mobility/journeys/proposals` | `mobility/journeys/proposals.tsx` | Mobile-first resident touchpoint |
| `/mobility/journeys/request` | `mobility/journeys/request.tsx` | Mobile-first resident touchpoint |
| `/mobility/journeys/requests` | `mobility/journeys/requests.tsx` | Mobile-first resident touchpoint |
| `/mobility/journeys/slots` | `mobility/journeys/slots.tsx` | Mobile-first resident touchpoint |
| `/mobility/ops` | `mobility/ops/index.tsx` | Mobile-first resident touchpoint |
| `/mobility/track/:id` | `mobility/track/[id].tsx` | Live GPS / location tracking experience |
| `/parking/anpr` | `parking/anpr.tsx` | Mobile-first resident touchpoint |
| `/parking/swaps-waitlist` | `parking/swaps-waitlist.tsx` | Mobile-first resident touchpoint |
| `/parking/violations` | `parking/violations.tsx` | Mobile-first resident touchpoint |
| `/profile/vehicles` | `profile/vehicles.tsx` | Mobile-first resident touchpoint |
| `/school-bus` | `school-bus/index.tsx` | Live GPS / location tracking experience |
| `/trips/checkout/:id` | `trips/checkout/[id].tsx` | Mobile-first resident touchpoint |
| `/trips/create` | `trips/create.tsx` | Mobile-first resident touchpoint |
| `/trips/flights` | `trips/flights.tsx` | Mobile-first resident touchpoint |
| `/trips/p2p` | `trips/p2p.tsx` | Mobile-first resident touchpoint |
| `/trips/roster` | `trips/roster.tsx` | Mobile-first resident touchpoint |
| `/vehicle-care/plans` | `vehicle-care/plans.tsx` | Mobile-first resident touchpoint |
| `/vehicle-care/vehicles` | `vehicle-care/vehicles.tsx` | Mobile-first resident touchpoint |
| `/vehicles` | `vehicles.tsx` | Mobile-first resident touchpoint |

---

### 3.13 Emergency & Safety

**Summary**: Web: **4** pages | Mobile: **2** screens | Shared Parity: **2** | Web Exclusive: **2** | Mobile Exclusive: **0**

#### Shared Capabilities / Direct Parity (2)

| Web Route | Web Component | Mobile Route | Mobile File | Match Type |
| :--- | :--- | :--- | :--- | :--- |
| `/emergency` | `EmergencyCenter` | `/emergency` | `emergency/index.tsx` | `EXACT_PATH` |
| `/safety` | `SafetyCommandCenter` | `/safety` | `safety/index.tsx` | `EXACT_PATH` |

#### Web Exclusive Pages (2)

*Pages built in Web that do not currently have a direct screen in Mobile:*

| Web Path | Component | Likely Architectural Rationale |
| :--- | :--- | :--- |
| `/safety/trust` | `CommunityTrustAndSafetyDashboard` | Desktop-oriented admin / multi-column view |
| `/admin/trust-safety` | `CommunityTrustAndSafetyDashboard` | Administrative dashboard / configuration tool |

---

### 3.14 Community & Social

**Summary**: Web: **17** pages | Mobile: **12** screens | Shared Parity: **6** | Web Exclusive: **11** | Mobile Exclusive: **6**

#### Shared Capabilities / Direct Parity (6)

| Web Route | Web Component | Mobile Route | Mobile File | Match Type |
| :--- | :--- | :--- | :--- | :--- |
| `/` | `Feed` | `/intelligence` | `intelligence/index.tsx` | `COMPONENT_MATCH` |
| `/feed` | `Feed` | `/tabs/feed` | `tabs/feed.tsx` | `SEMANTIC_SIMILAR` |
| `/admin/create-community` | `AdminCommunity` | `/community` | `community/index.tsx` | `SEMANTIC_SIMILAR` |
| `/pets` | `PetRegistryDashboard` | `/pets` | `pets/index.tsx` | `EXACT_PATH` |
| `/social` | `SocialCirclesPage` | `/social` | `social/index.tsx` | `EXACT_PATH` |
| `/profile/reputation` | `ReputationPage` | `/profile/reputation` | `profile/reputation.tsx` | `EXACT_PATH` |

#### Web Exclusive Pages (11)

*Pages built in Web that do not currently have a direct screen in Mobile:*

| Web Path | Component | Likely Architectural Rationale |
| :--- | :--- | :--- |
| `/community/inventory` | `InventoryDashboard` | Desktop-oriented admin / multi-column view |
| `/community/inventory-management` | `InventoryManagement` | Administrative dashboard / configuration tool |
| `/community/maintenance` | `MaintenanceDashboard` | Desktop-oriented admin / multi-column view |
| `/community/generator-maintenance` | `GeneratorMaintenanceDashboard` | Desktop-oriented admin / multi-column view |
| `/community/water-maintenance` | `WaterMaintenanceDashboard` | Desktop-oriented admin / multi-column view |
| `/community/audit` | `AssetAuditDashboard` | Desktop-oriented admin / multi-column view |
| `/cpn` | `CPNFeed` | Desktop-oriented admin / multi-column view |
| `/cpn/feed` | `CPNFeed` | Desktop-oriented admin / multi-column view |
| `/discover` | `PersonalizedFeed` | Desktop-oriented admin / multi-column view |
| `/deals/demands` | `CommunityDemandView` | Desktop-oriented admin / multi-column view |
| `/ops/community-manager` | `CommunityManagerDashboard` | Administrative dashboard / configuration tool |

#### Mobile Exclusive Screens (6)

*Screens built in Mobile that do not currently have a direct route in Web:*

| Mobile Route | File Path | Inferred Role / Hardware Trigger |
| :--- | :--- | :--- |
| `/admin/community-settings` | `admin/community-settings.tsx` | Mobile-first resident touchpoint |
| `/community/directory` | `community/directory.tsx` | Mobile-first resident touchpoint |
| `/community/insights` | `community/insights.tsx` | Mobile-first resident touchpoint |
| `/forum` | `forum/index.tsx` | Mobile-first resident touchpoint |
| `/forum/new-post` | `forum/new-post.tsx` | Mobile-first resident touchpoint |
| `/forum/:id` | `forum/[id].tsx` | Mobile-first resident touchpoint |

---

### 3.15 Governance, Notices & Docs

**Summary**: Web: **12** pages | Mobile: **13** screens | Shared Parity: **8** | Web Exclusive: **4** | Mobile Exclusive: **5**

#### Shared Capabilities / Direct Parity (8)

| Web Route | Web Component | Mobile Route | Mobile File | Match Type |
| :--- | :--- | :--- | :--- | :--- |
| `/notices` | `NoticeBoard` | `/notices` | `notices/index.tsx` | `EXACT_PATH` |
| `/polls` | `Polling` | `/polls` | `polls/index.tsx` | `EXACT_PATH` |
| `/cpos/documents` | `CPOSDocumentVault` | `/documents` | `documents/index.tsx` | `SEMANTIC_SIMILAR` |
| `/governance` | `GovernanceDashboard` | `/governance` | `governance/index.tsx` | `EXACT_PATH` |
| `/governance/meetings` | `MeetingsManagement` | `/governance/meetings` | `governance/meetings.tsx` | `EXACT_PATH` |
| `/governance/proposals` | `ProposalsHub` | `/governance/proposals` | `governance/proposals.tsx` | `EXACT_PATH` |
| `/governance/voting` | `VotingCenter` | `/governance/voting` | `governance/voting.tsx` | `EXACT_PATH` |
| `/governance/vault` | `DigitalVault` | `/governance/vault` | `governance/vault.tsx` | `EXACT_PATH` |

#### Web Exclusive Pages (4)

*Pages built in Web that do not currently have a direct screen in Mobile:*

| Web Path | Component | Likely Architectural Rationale |
| :--- | :--- | :--- |
| `/governance/dashboard` | `GovernanceDashboard` | Desktop-oriented admin / multi-column view |
| `/governance/resolutions` | `ResolutionsBoard` | Desktop-oriented admin / multi-column view |
| `/governance/committee` | `CommitteeAndElections` | Desktop-oriented admin / multi-column view |
| `/governance/noc` | `NocRequests` | Desktop-oriented admin / multi-column view |

#### Mobile Exclusive Screens (5)

*Screens built in Mobile that do not currently have a direct route in Web:*

| Mobile Route | File Path | Inferred Role / Hardware Trigger |
| :--- | :--- | :--- |
| `/admin/announcements` | `admin/announcements.tsx` | Mobile-first resident touchpoint |
| `/admin/broadcast` | `admin/broadcast.tsx` | Mobile-first resident touchpoint |
| `/governance/elections` | `governance/elections.tsx` | Mobile-first resident touchpoint |
| `/polls/create` | `polls/create.tsx` | Mobile-first resident touchpoint |
| `/polls/:id` | `polls/[id].tsx` | Mobile-first resident touchpoint |

---

### 3.16 Communication & AI Chat

**Summary**: Web: **5** pages | Mobile: **7** screens | Shared Parity: **4** | Web Exclusive: **1** | Mobile Exclusive: **3**

#### Shared Capabilities / Direct Parity (4)

| Web Route | Web Component | Mobile Route | Mobile File | Match Type |
| :--- | :--- | :--- | :--- | :--- |
| `/chat` | `Chat` | `/chat` | `chat/index.tsx` | `EXACT_PATH` |
| `/cpn/messages` | `Chat` | `/ai-chat` | `ai-chat/index.tsx` | `COMPONENT_MATCH` |
| `/settings/notifications` | `NotificationPreferenceCenter` | `/settings/notifications` | `settings/notifications.tsx` | `EXACT_PATH` |
| `/ai-chat` | `AiChatDashboard` | `/chat/:id` | `chat/[id].tsx` | `SEMANTIC_SIMILAR` |

#### Web Exclusive Pages (1)

*Pages built in Web that do not currently have a direct screen in Mobile:*

| Web Path | Component | Likely Architectural Rationale |
| :--- | :--- | :--- |
| `/flow-chatbot` | `AppFlowChatbot` | Desktop-oriented admin / multi-column view |

#### Mobile Exclusive Screens (3)

*Screens built in Mobile that do not currently have a direct route in Web:*

| Mobile Route | File Path | Inferred Role / Hardware Trigger |
| :--- | :--- | :--- |
| `/notifications` | `notifications/index.tsx` | Mobile-first resident touchpoint |
| `/notifications/preferences` | `notifications/preferences.tsx` | Mobile-first resident touchpoint |
| `/tabs/chat` | `tabs/chat.tsx` | Mobile-first resident touchpoint |

---

### 3.17 Admin, Management & Ops

**Summary**: Web: **40** pages | Mobile: **22** screens | Shared Parity: **11** | Web Exclusive: **29** | Mobile Exclusive: **11**

#### Shared Capabilities / Direct Parity (11)

| Web Route | Web Component | Mobile Route | Mobile File | Match Type |
| :--- | :--- | :--- | :--- | :--- |
| `/admin` | `AdminHub` | `/admin` | `admin/index.tsx` | `EXACT_PATH` |
| `/admin/bulk-upload` | `AdminBulkUpload` | `/admin/bulk-upload` | `admin/bulk-upload.tsx` | `EXACT_PATH` |
| `/admin/roles` | `AdminRoleManagement` | `/admin/roles` | `admin/roles.tsx` | `EXACT_PATH` |
| `/admin/audit-logs` | `AuditTrail` | `/admin/audit-logs` | `admin/audit-logs.tsx` | `EXACT_PATH` |
| `/admin/privacy` | `PrivacyAdminHub` | `/admin/privacy` | `admin/privacy.tsx` | `EXACT_PATH` |
| `/profile` | `ProfileDashboard` | `/admin-role/tabs/profile` | `admin-role/tabs/profile.tsx` | `SEMANTIC_SIMILAR` |
| `/privacy-settings` | `PrivacyHub` | `/settings` | `settings/index.tsx` | `SEMANTIC_SIMILAR` |
| `/sync` | `OfflineSyncManager` | `/settings/offline-sync` | `settings/offline-sync.tsx` | `SEMANTIC_SIMILAR` |
| `/ops/control-room` | `OpsControlRoom` | `/ops` | `ops/index.tsx` | `COMPONENT_MATCH` |
| `/ops/passes` | `DigitalPassManager` | `/ops/passes` | `ops/passes.tsx` | `EXACT_PATH` |
| `/ops/watchlist` | `WatchlistManager` | `/ops/watchlist-check` | `ops/watchlist-check.tsx` | `SEMANTIC_SIMILAR` |

#### Web Exclusive Pages (29)

*Pages built in Web that do not currently have a direct screen in Mobile:*

| Web Path | Component | Likely Architectural Rationale |
| :--- | :--- | :--- |
| `/admin/dashboards` | `SmartDashboard` | Administrative dashboard / configuration tool |
| `/admin/create-user` | `AdminCreateUser` | Administrative dashboard / configuration tool |
| `/admin/expenses` | `ExpensesDashboard` | Administrative dashboard / configuration tool |
| `/admin/email-gallery` | `EmailTemplatesTab` | Administrative dashboard / configuration tool |
| `/admin/email-templates` | `EmailTemplateBuilder` | Administrative dashboard / configuration tool |
| `/admin/deletion-requests` | `AdminDeletionRequests` | Administrative dashboard / configuration tool |
| `/admin/retention-policies` | `AdminRetentionPolicies` | Administrative dashboard / configuration tool |
| `/maintenance/schedules` | `MaintenanceScheduleAdmin` | Desktop-oriented admin / multi-column view |
| `/maintenance/generator` | `GeneratorMaintenanceDashboard` | Desktop-oriented admin / multi-column view |
| `/maintenance/water` | `WaterMaintenanceDashboard` | Desktop-oriented admin / multi-column view |
| `/architecture/logs` | `LogsDashboard` | Desktop-oriented admin / multi-column view |
| `/architecture/operations` | `PlatformOperationsConsole` | Desktop-oriented admin / multi-column view |
| `/admin/operations` | `PlatformOperationsConsole` | Administrative dashboard / configuration tool |
| `/cpos` | `CPOSDashboardPage` | Vendor back-office desktop portal |
| `/cpos/analytics` | `CPOSAnalyticsDashboard` | Vendor back-office desktop portal |
| `/cpos/rentals` | `CPOSRentalDashboard` | Vendor back-office desktop portal |
| `/my-money` | `MyMoneyDashboard` | Desktop-oriented admin / multi-column view |
| `/deals` | `OffersDashboard` | Desktop-oriented admin / multi-column view |
| `/projects` | `ProjectsDashboard` | Desktop-oriented admin / multi-column view |
| `/intelligence` | `IntelligenceDashboard` | Desktop-oriented admin / multi-column view |
| `/calendar` | `CalendarDashboard` | Desktop-oriented admin / multi-column view |
| `/ops/dashboard` | `OpsDashboardLive` | Administrative dashboard / configuration tool |
| `/ops/move-requests` | `MoveRequestManager` | Administrative dashboard / configuration tool |
| `/ops/assets` | `AssetMaintenance` | Administrative dashboard / configuration tool |
| `/ops/reports` | `RwaReports` | Administrative dashboard / configuration tool |
| `/ops/insights` | `InsightsDashboard` | Administrative dashboard / configuration tool |
| `/platform/ops` | `PlatformOpsDashboard` | Administrative dashboard / configuration tool |
| `/my-dashboard` | `ResidentDashboard` | Desktop-oriented admin / multi-column view |
| `/fm/dashboard` | `FmOpsDashboard` | Desktop-oriented admin / multi-column view |

#### Mobile Exclusive Screens (11)

*Screens built in Mobile that do not currently have a direct route in Web:*

| Mobile Route | File Path | Inferred Role / Hardware Trigger |
| :--- | :--- | :--- |
| `/admin/assign-role` | `admin/assign-role.tsx` | Mobile-first resident touchpoint |
| `/admin/members` | `admin/members.tsx` | Mobile-first resident touchpoint |
| `/admin/moderation` | `admin/moderation.tsx` | Mobile-first resident touchpoint |
| `/admin-role` | `admin-role/index.tsx` | Mobile-first resident touchpoint |
| `/admin-role/tabs/approvals` | `admin-role/tabs/approvals.tsx` | Mobile-first resident touchpoint |
| `/admin-role/tabs/dashboard` | `admin-role/tabs/dashboard.tsx` | Mobile-first resident touchpoint |
| `/inventory/audit` | `inventory/audit.tsx` | Mobile-first resident touchpoint |
| `/ops/move-request` | `ops/move-request.tsx` | Mobile-first resident touchpoint |
| `/settings/password` | `settings/password.tsx` | Mobile-first resident touchpoint |
| `/settings/privacy` | `settings/privacy.tsx` | Mobile-first resident touchpoint |
| `/sync/conflicts` | `sync/conflicts.tsx` | Mobile-first resident touchpoint |

---

### 3.18 User Profile & Settings

**Summary**: Web: **5** pages | Mobile: **7** screens | Shared Parity: **2** | Web Exclusive: **3** | Mobile Exclusive: **5**

#### Shared Capabilities / Direct Parity (2)

| Web Route | Web Component | Mobile Route | Mobile File | Match Type |
| :--- | :--- | :--- | :--- | :--- |
| `/privacy` | `PrivacyPage` | `/privacy` | `privacy/index.tsx` | `EXACT_PATH` |
| `/cpn/profile` | `MyProfessionalProfile` | `/cpn/profile` | `cpn/profile.tsx` | `EXACT_PATH` |

#### Web Exclusive Pages (3)

*Pages built in Web that do not currently have a direct screen in Mobile:*

| Web Path | Component | Likely Architectural Rationale |
| :--- | :--- | :--- |
| `/terms` | `TermsPage` | Desktop-oriented admin / multi-column view |
| `/privacy-hub` | `PrivacyHub` | Desktop-oriented admin / multi-column view |
| `/my-data` | `PrivacyHub` | Desktop-oriented admin / multi-column view |

#### Mobile Exclusive Screens (5)

*Screens built in Mobile that do not currently have a direct route in Web:*

| Mobile Route | File Path | Inferred Role / Hardware Trigger |
| :--- | :--- | :--- |
| `/profile/edit` | `profile/edit.tsx` | Mobile-first resident touchpoint |
| `/profile/entry-log` | `profile/entry-log.tsx` | Mobile-first resident touchpoint |
| `/profile/family` | `profile/family.tsx` | Mobile-first resident touchpoint |
| `/profile` | `profile/index.tsx` | Mobile-first resident touchpoint |
| `/tabs/profile` | `tabs/profile.tsx` | Mobile-first resident touchpoint |

---

### 3.19 General / Other

**Summary**: Web: **43** pages | Mobile: **50** screens | Shared Parity: **9** | Web Exclusive: **34** | Mobile Exclusive: **41**

#### Shared Capabilities / Direct Parity (9)

| Web Route | Web Component | Mobile Route | Mobile File | Match Type |
| :--- | :--- | :--- | :--- | :--- |
| `/jobs` | `Jobs` | `/jobs` | `jobs/index.tsx` | `EXACT_PATH` |
| `/cpn/directory` | `ProfessionalDirectory` | `/cpn` | `cpn/index.tsx` | `SEMANTIC_SIMILAR` |
| `/cpn/jobs` | `CPNJobs` | `/jobs/:id` | `jobs/[id].tsx` | `SEMANTIC_SIMILAR` |
| `/cpos/properties` | `CPOSPropertyListPage` | `/cpos` | `cpos/index.tsx` | `SEMANTIC_SIMILAR` |
| `/search` | `DiscoverPage` | `/discover/search` | `discover/search.tsx` | `SEMANTIC_SIMILAR` |
| `/pay` | `ManaPayHub` | `/tabs/pay` | `tabs/pay.tsx` | `SEMANTIC_SIMILAR` |
| `/insurance` | `InsurancePortal` | `/insurance` | `insurance/index.tsx` | `EXACT_PATH` |
| `/movies` | `MoviePortal` | `/movies` | `movies/index.tsx` | `EXACT_PATH` |
| `/deals/partners` | `BusinessDirectoryView` | `/deals` | `deals.tsx` | `SEMANTIC_SIMILAR` |

#### Web Exclusive Pages (34)

*Pages built in Web that do not currently have a direct screen in Mobile:*

| Web Path | Component | Likely Architectural Rationale |
| :--- | :--- | :--- |
| `/items/:id` | `AssetCheckout` | Desktop-oriented admin / multi-column view |
| `/cpn/network` | `CPNNetwork` | Desktop-oriented admin / multi-column view |
| `/cpn/referrals` | `CPNReferrals` | Desktop-oriented admin / multi-column view |
| `/cpn/freelance` | `CPNFreelance` | Desktop-oriented admin / multi-column view |
| `/cpn/mentorship` | `CPNMentorship` | Desktop-oriented admin / multi-column view |
| `/cpn/learning` | `CPNLearning` | Desktop-oriented admin / multi-column view |
| `/cpn/companies` | `CPNCompanies` | Desktop-oriented admin / multi-column view |
| `/cpn/business` | `CPNBusiness` | Desktop-oriented admin / multi-column view |
| `/cpn/startups` | `CPNStartups` | Desktop-oriented admin / multi-column view |
| `/cpn/collaborate` | `CPNCollaborate` | Desktop-oriented admin / multi-column view |
| `/cpn/resume` | `CPNResume` | Desktop-oriented admin / multi-column view |
| `/cpn/ai-assistant` | `CPNAIAssistant` | Desktop-oriented admin / multi-column view |
| `/cpn/gamification` | `CPNGamification` | Desktop-oriented admin / multi-column view |
| `/cpn/analytics` | `CPNAnalytics` | Heavy analytical / report generation tool |
| `/architecture` | `ArchitectureDocs` | Desktop-oriented admin / multi-column view |
| `/cpos/properties/new` | `CPOSPropertyCreatePage` | Vendor back-office desktop portal |
| `/cpos/properties/:propertyCode` | `CPOSPropertyDetailPage` | Vendor back-office desktop portal |
| `/cpos/ownership` | `CPOSOwnershipPage` | Vendor back-office desktop portal |
| `/cpos/occupancy` | `CPOSOccupancyPage` | Vendor back-office desktop portal |
| `/cpos/residents` | `CPOSResidentsPage` | Vendor back-office desktop portal |
| `/cpos/ai` | `CPOSAIAdvisorPage` | Vendor back-office desktop portal |
| `/cpos/crm` | `CPOSCRMPipelinePage` | Vendor back-office desktop portal |
| `/cpos/crm/leads` | `CPOSLeadsPage` | Vendor back-office desktop portal |
| `/cpos/crm/leads/:leadId` | `CPOSLeadDetailPage` | Vendor back-office desktop portal |
| `/cpos/crm/analytics` | `CPOSCRMAnalyticsPage` | Vendor back-office desktop portal |
| `/cpos/crm/brokers` | `CPOSBrokerCommissionPage` | Vendor back-office desktop portal |
| `/cpos/crm/email-templates` | `CPOSCrmEmailTemplatesPage` | Vendor back-office desktop portal |
| `/cpos/crm/leaderboard` | `CPOSCrmLeaderboardPage` | Vendor back-office desktop portal |
| `/cpos/crm/approvals` | `CPOSApprovalsPage` | Vendor back-office desktop portal |
| `/cpos/crm/drip` | `CPOSDripSequencesPage` | Vendor back-office desktop portal |
| `/cpos/crm/reports` | `CPOSCustomReportPage` | Vendor back-office desktop portal |
| `/cpos/leases` | `CPOSLeasePage` | Vendor back-office desktop portal |
| `/deals/my-claims` | `MyClaimsView` | Desktop-oriented admin / multi-column view |
| `/khatabook` | `KhataBook` | Desktop-oriented admin / multi-column view |

#### Mobile Exclusive Screens (41)

*Screens built in Mobile that do not currently have a direct route in Web:*

| Mobile Route | File Path | Inferred Role / Hardware Trigger |
| :--- | :--- | :--- |
| `/activity` | `activity.tsx` | Mobile-first resident touchpoint |
| `/calendar` | `calendar/index.tsx` | Mobile-first resident touchpoint |
| `/discover` | `discover/index.tsx` | Mobile-first resident touchpoint |
| `/experiences/buddy` | `experiences/buddy.tsx` | Mobile-first resident touchpoint |
| `/experiences/create` | `experiences/create.tsx` | Mobile-first resident touchpoint |
| `/experiences` | `experiences/index.tsx` | Mobile-first resident touchpoint |
| `/experiences/organizer` | `experiences/organizer.tsx` | Mobile-first resident touchpoint |
| `/experiences/partners` | `experiences/partners.tsx` | Mobile-first resident touchpoint |
| `/experiences/:id` | `experiences/[id].tsx` | Mobile-first resident touchpoint |
| `/facilities` | `facilities/index.tsx` | Mobile-first resident touchpoint |
| `/household` | `household/index.tsx` | Mobile-first resident touchpoint |
| `/` | `index.tsx` | Mobile-first resident touchpoint |
| `/insurance/catalogue/:category` | `insurance/catalogue/[category].tsx` | Mobile-first resident touchpoint |
| `/insurance/claims` | `insurance/claims/index.tsx` | Mobile-first resident touchpoint |
| `/insurance/compare` | `insurance/compare/index.tsx` | Mobile-first resident touchpoint |
| `/insurance/consents` | `insurance/consents.tsx` | Mobile-first resident touchpoint |
| `/insurance/group-enquiry` | `insurance/group-enquiry.tsx` | Mobile-first resident touchpoint |
| `/insurance/policies` | `insurance/policies/index.tsx` | Mobile-first resident touchpoint |
| `/insurance/policies/:id` | `insurance/policies/[id].tsx` | Mobile-first resident touchpoint |
| `/intelligence/discover` | `intelligence/discover.tsx` | Mobile-first resident touchpoint |
| `/intercom` | `intercom.tsx` | Native WebRTC / push call intercom |
| `/inventory` | `inventory/index.tsx` | Mobile-first resident touchpoint |
| `/inventory/maintenance` | `inventory/maintenance.tsx` | Mobile-first resident touchpoint |
| `/inventory/:id` | `inventory/[id].tsx` | Mobile-first resident touchpoint |
| `/jobs/create` | `jobs/create.tsx` | Mobile-first resident touchpoint |
| `/jobs/my-jobs` | `jobs/my-jobs.tsx` | Mobile-first resident touchpoint |
| `/maintenance/generator` | `maintenance/generator.tsx` | Mobile-first resident touchpoint |
| `/maintenance` | `maintenance/index.tsx` | Mobile-first resident touchpoint |
| `/maintenance/water` | `maintenance/water.tsx` | Mobile-first resident touchpoint |
| `/movies/book` | `movies/book.tsx` | Mobile-first resident touchpoint |
| `/my-money` | `my-money.tsx` | Mobile-first resident touchpoint |
| `/offers/demands` | `offers/demands.tsx` | Mobile-first resident touchpoint |
| `/offers` | `offers/index.tsx` | Mobile-first resident touchpoint |
| `/offers/my-claims` | `offers/my-claims.tsx` | Mobile-first resident touchpoint |
| `/offers/partners` | `offers/partners.tsx` | Mobile-first resident touchpoint |
| `/packages` | `packages.tsx` | Mobile-first resident touchpoint |
| `/projects/create` | `projects/create.tsx` | Mobile-first resident touchpoint |
| `/projects/detail` | `projects/detail.tsx` | Mobile-first resident touchpoint |
| `/projects` | `projects/index.tsx` | Mobile-first resident touchpoint |
| `/send-money` | `send-money/index.tsx` | Mobile-first resident touchpoint |
| `/tabs/discover` | `tabs/discover.tsx` | Mobile-first resident touchpoint |

---

## 4. Key Architectural Patterns & Strategic Differences

### 1. Intentional Platform Specialization (By Design)
Certain pages exist exclusively on Web or Mobile due to platform-specific form factors:
- **Web-Only Administrative Heavyweights**:
  - **HRM Suite**: Batch payroll processing, visual org hierarchy chart, custom report builder, compliance audit trails.
  - **Vendor Portals & Verification**: Fresh kitchen supplier verification matrix, contract management, CPOS CRM integrations.
  - **IoT Gate & Substation Dashboards**: ANPR live CCTV gate monitor, Smart meter 24-hour load curve visualizers.
- **Mobile-Only Native Experiences**:
  - **Hardware Integrations**: Camera barcode/QR scanning (gate entry pass, meal tokens), live GPS vehicle & school bus tracking.
  - **Fintech & Instant Payments**: UPI scan-and-pay, BBPS fetch-and-pay bills, micro-credit / khata ledger.
  - **Resident On-The-Go Tasks**: Video teleconsultations with community doctors, SOS siren emergency alerts.

---

### 2. High-Priority Parity Gaps

#### Category A: Missing on Mobile (Should be Ported to Mobile)
1. **Sports & Tournament Scorer**:
   - Web has live cricket and race scoring engines (`/sports/match/:matchId/score`, `/sports/race/:matchId/score`). Ground referees need these directly on their mobile phones!
2. **Event Volunteer & Expense Management**:
   - Web has `/events/volunteers`, `/events/operations`, and `/events/expenses`. Event organizers on ground need quick mobile checklists.
3. **Guard Management & Biometric Turnstiles**:
   - Web has turnstile and guard shift rosters. Security supervisors on duty need this in the mobile app.

#### Category B: Missing on Web (Should be Ported to Web)
1. **Mobility & Carpooling**:
   - Mobile has a rich 42-screen carpooling & airport ride sharing suite (`/commute/find-rides`, `/mobility/airport-rides`). Residents using desktop work computers should be able to view and book society carpools on web!
2. **School Bus Live Tracker**:
   - Mobile has `/school-bus`. Parents working from home on laptops should have a desktop browser widget to monitor child school bus ETA.
3. **Doctor Teleconsultation & Health Records**:
   - Mobile has complete clinic & lab booking (`/health/appointments`, `/health/records`). Web should offer a telehealth portal for residents preferring larger monitors for video consultations.
4. **BBPS & Utility Bill Fetch**:
   - Mobile has Bharat Bill Payment System (BBPS) integration. Desktop residents paying society dues should also be able to pay electricity, water, and broadband bills via Web.

---

## 5. Summary Statistics

- **Total Functional Domains**: 19
- **Total Combined UI Pages**: 1,039
- **Parity Ratio**: 39.8% direct / shared capability overlap.
- **Web Specialization**: 57.4% of Web pages are desktop/admin-first.
- **Mobile Specialization**: 62.8% of Mobile screens are mobile/resident-first.
