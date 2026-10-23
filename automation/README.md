# Mana Community - AI Automation Workflow Engine (Self-Hosted n8n)

## Health and Wellness workflows

The health portal pages each have an importable workflow in `workflows/health/`; standalone wellness pages are in `workflows/wellness/`. Each accepts a POST webhook, validates JSON, and returns module-scoped assistance; most call Gemini. Configure a Gemini API key in n8n before activation.

These workflows provide administrative or general educational assistance only. Send minimum-necessary, de-identified data, obtain required consent, and keep health records out of prompts. AI output must not diagnose, interpret results, prescribe, change treatment, or make clinical decisions. Emergency workflows must never delay contact with local emergency services. Configure privacy, consent, access controls and webhook authentication before activation.

### Health module pages (`workflows/health/`)

| Workflow | Webhook | Page | Purpose |
| :--- | :--- | :--- | :--- |
| `health-dashboard.json` | POST `/webhook/health-dashboard` | Health Dashboard | Summarize appointments, family reminders, vault metadata and wellness tasks with privacy safeguards. |
| `health-doctors-clinics.json` | POST `/webhook/health-doctors-clinics` | Doctors & Clinics | Compare supplied provider details and verified credentials; do not infer clinical quality. |
| `health-camps.json` | POST `/webhook/health-camps` | Health Camps | Summarize camp registration, capacity, consent and logistics; never interpret screening results. |
| `health-family-health-hub.json` | POST `/webhook/health-family-health-hub` | Family Health Hub | Organize consent-based family care tasks using de-identified data only. |
| `health-appointments-care-journey.json` | POST `/webhook/health-appointments-care-journey` | Appointments & Journey | Summarize appointment schedules, conflicts and preparation tasks. |
| `health-private-health-vault.json` | POST `/webhook/health-private-health-vault` | Private Health Vault | Index authorized document metadata and sharing permissions; avoid document contents. |
| `health-lab-packages.json` | POST `/webhook/health-lab-packages` | Lab Packages | Compare supplied package data; flag unclear inclusions for clinician confirmation. |
| `health-benefits-wallet.json` | POST `/webhook/health-benefits-wallet` | Benefits & Wallet | Explain supplied eligibility, balance, expiry and claim requirements; do not guarantee coverage. |
| `health-preventive-wellness.json` | POST `/webhook/health-preventive-wellness` | Preventive & Wellness | Create low-risk reminders from selected goals and verified programs; no prescriptions. |
| `health-provider-operations.json` | POST `/webhook/health-provider-operations` | Provider Operations | Summarize aggregated queues and non-clinical service operations; exclude patient data. |
| `health-community-emergency.json` | POST `/webhook/health-community-emergency` | Community Emergency | Direct possible emergencies immediately to local services; never delay contact for AI. Handoff only after contact. |
| `health-ai-symptom-guide.json` | POST `/webhook/health-ai-symptom-guide` | AI Symptom Guide | Give general non-diagnostic education and clinician questions; flag emergencies. Never diagnose or prescribe. |
| `health-care-journey.json` | POST `/webhook/health-care-journey` | Care Journey | Create user-controlled checklist from provider instructions; do not change clinical plans. |
| `health-pharmacy.json` | POST `/webhook/health-pharmacy` | Pharmacy | Summarize order logistics and prescription document completeness; never recommend or dose medication. |
| `health-ambulance.json` | POST `/webhook/health-ambulance` | Ambulance | Assist non-emergency booking only. Emergencies bypass AI and go to local emergency services. |
| `health-ipd-admission.json` | POST `/webhook/health-ipd-admission` | IPD Admission | Explain supplied administrative admission checklist and logistics; defer clinical/coverage matters. |
| `health-surgery-care.json` | POST `/webhook/health-surgery-care` | Surgery Care | Organize provider-issued instructions without interpreting them; escalate clinical questions. |
| `health-dental-care.json` | POST `/webhook/health-dental-care` | Dental Care | Compare supplied provider availability and appointment logistics; no treatment advice. |
| `health-abha-health-id.json` | POST `/webhook/health-abha-health-id` | ABHA Health ID | Guide administrative steps and privacy; never request ABHA numbers, OTPs, passwords or identifiers. |
| `health-cancer-care.json` | POST `/webhook/health-cancer-care` | Cancer Care | Navigate supplied support resources and logistics; never interpret results or recommend treatment. |
| `health-mental-health.json` | POST `/webhook/health-mental-health` | Mental Health | Offer non-clinical support navigation. Imminent danger: contact crisis/emergency services and trusted person now. |
| `health-hospital-finder.json` | POST `/webhook/health-hospital-finder` | Hospital Finder | Compare supplied hospital data and flag unknowns; do not invent ratings or capabilities. |
| `health-mana-gold.json` | POST `/webhook/health-mana-gold` | Mana Gold Health Membership | Explain supplied benefits, limits and renewal; do not promise coverage or savings. |

### Wellness pages (`workflows/wellness/`)

| Workflow | Webhook | Page | Purpose |
| :--- | :--- | :--- | :--- |
| `wellness-dashboard-coach.json` | POST `/webhook/wellness-dashboard-coach` | Wellness Dashboard | Summarize opt-in logs and goals neutrally; avoid diagnosis and prescriptive targets. |
| `wellness-food-journal.json` | POST `/webhook/wellness-food-journal` | Food Journal | Categorize meal entries; nutrition context is approximate only if supported. No diet prescriptions. |
| `wellness-meal-logger.json` | POST `/webhook/wellness-meal-logger` | Meal Logger | Parse meal descriptions into editable items; estimates require confirmation; no allergy guarantees. |
| `wellness-water-tracker.json` | POST `/webhook/wellness-water-tracker` | Water Tracker | Summarize logs and user-preferred reminders; do not set medical targets. |
| `wellness-community-challenges.json` | POST `/webhook/wellness-community-challenges` | Community Challenges | Draft inclusive, accessible opt-in challenges with private, non-competitive tracking. |
| `wellness-providers.json` | POST `/webhook/wellness-providers` | Wellness Providers | Compare supplied listings and verified credentials; avoid unsupported outcome claims. |
| `wellness-profile.json` | POST `/webhook/wellness-profile` | Wellness Profile | Review optional fields and privacy settings; no health inference or target setting. |

This directory contains the self-hosted automation infrastructure for the **Mana Community Application**. It provides zero-cost, event-driven AI workflows powered by **n8n** and free-tier LLMs (Google Gemini 3.5 Flash Lite / Groq / Ollama).

---

## 🚀 Quick Start

You can run n8n in two ways:

### Option A: Direct via Node.js (Zero Docker Needed)
If you already have Node.js installed on your machine, you can launch n8n immediately:
```bash
npx n8n
```
Or install it globally:
```bash
npm install -g n8n
n8n start
```

### Option B: Via Docker
```bash
cd automation
docker compose up -d
```
Access the n8n Visual Automation Builder at: **`http://localhost:5678`**

---

## 📦 Modular Workflows Directory Structure

All 63 workflows are segregated into dedicated, module-specific folders inside [`automation/workflows/`](file:///d:/Application/applications/mana%20community/mana-community-app/automation/workflows):

```
automation/workflows/
├── helpdesk/       (Helpdesk ticket triage & urgency scoring)
├── finance/        (Dues, bill, wallet and investment review plus receipt OCR)
├── community/      (Weekly digests & feed moderation)
├── sports/         (7 workflows: fixtures, scoring, disputes, auction, etc.)
├── auth/           (3 workflows: registration screener, login security, lockout)
├── profile/        (KYC fraud detection & directory coherence)
├── admin/          (4 workflows: KYC verify, bulk import audit, announcements, ops)
├── events/         (4 workflows: proposal screener, crowd forecast, seva allocator, post-recap)
├── experiences/    (Recommendations and itinerary drafting)
├── mobility/       (Coarse-area ride and carpool matching)
├── cpos/           (Property portfolio operations review)
├── safety/         (6 workflows: SOS dispatcher, visitor screener, ANPR enforcer, staff KYC, IoT sentinel, trust audit)
├── marketplace/    (4 workflows: listing screener, offer arbitrator, dispute arbitrator, lost & found matcher)
├── health/         (23 workflows covering the Health Dashboard and every Health Portal tab)
└── wellness/      (7 workflows covering standalone wellness pages)
```

---

## 📋 Comprehensive Workflow Inventory

### 1. Helpdesk (`workflows/helpdesk/`)
| Workflow File | Trigger Type | AI Engine | Purpose |
| :--- | :--- | :--- | :--- |
| `ticket-triage.json` | Webhook (`POST /webhook/ticket-triage`) | Gemini | Legacy intake classification for maintenance tickets. Output is advisory; staff must verify urgency and take any dispatch action. |
| `helpdesk-ai-classification.json` | Webhook (`POST /webhook/helpdesk-ai-classification`) | Gemini 2.5 Flash | Classifies subject and description into the categories and priority fields used by `ticketService.aiClassify`; flags possible hazards and returns a safe next step for human review. |
| `helpdesk-sla-and-backlog-review.json` | Webhook (`POST /webhook/helpdesk-sla-backlog-review`) | Gemini 2.5 Flash | Computes SLA state from supplied ticket deadlines, then summarizes breached, at-risk, unassigned and emergency-priority tickets for staff review. Does not update tickets or assign staff. |

Helpdesk pages: `/helpdesk` uses backend ticket routes such as `POST /api/helpdesk/tickets/ai-classify`, while `/helpdesk-smart` currently uses browser-local fallback records when its backend endpoints are unavailable. The n8n workflows are standalone and inactive on import. Set `GOOGLE_GEMINI_API_KEY` in the n8n environment and protect webhook access. Call them from a trusted server-side integration; do not put n8n credentials in browser code. Queue review accepts authorized ticket records from the caller and does not fetch or mutate tickets itself.

Example AI classification:

```bash
curl -X POST http://localhost:5678/webhook/helpdesk-ai-classification \
  -H "Content-Type: application/json" \
  -d '{"ticketId":123,"subject":"Water leaking from ceiling","description":"Continuous water dripping near a light fitting in the bathroom.","communityId":12,"location":"Tower A, Flat 302"}'
```

### Community Bylaws, Polls, Visitors, Turnstiles & Emergency

| Requested page | Found in app | Workflow |
| :--- | :--- | :--- |
| Community Bylaws & Info | No dedicated route/page found. Governance includes `/governance/vault` (Digital Vault) plus meetings, proposals, voting, resolutions and committee pages. | `workflows/community/community-bylaws-and-info-guide.json` answers only from caller-supplied approved excerpts, with citations and committee fallback. |
| Polls & Governance Decisions | Yes: `/polls` and `/governance/*` voting/proposal/resolution routes. | `workflows/community/poll-governance-decision-summary.json` summarizes aggregate poll totals; does not infer quorum or determine legal authority. |
| Gate & Visitors | Yes: `/visitors`, with visitor passes, walk-ins, check-in/out and audit routes. | Existing `workflows/safety/safety-visitor-screening-and-overstay-auditor.json` screens supplied visitor snapshots. |
| Smart Turnstiles & Gates | Yes: `/access/turnstiles`; service exposes community devices, biometric verification, access logs and device status updates. | `workflows/safety/smart-turnstile-access-review.json` reviews supplied access logs; it cannot unlock gates or modify access. |
| Emergency & SOS | Yes: `/emergency`; SOS trigger, active incidents, acknowledge, dispatch, arrival, resolution and lockdown routes. | Existing `workflows/safety/safety-emergency-sos-and-incident-dispatcher.json` provides advisory incident triage. Emergency response must not wait for AI; use established emergency procedures and local services. |

The bylaws guide and poll summary workflows are in `workflows/community/`; the turnstile review is in `workflows/safety/`. Set `GOOGLE_GEMINI_API_KEY` in n8n and protect webhook endpoints. Existing visitor and SOS workflows already cover the requested visitor and emergency areas, so no duplicate exports were added. All new workflows are inactive on import and return recommendations only. For visitor and turnstile workflows, send minimum necessary data through a trusted server-side caller; avoid biometric embeddings, face images, phone numbers, exact resident location, or individual voter records in AI prompts.

The app currently has a Governance Digital Vault, not a dedicated Bylaws & Info reader. The bylaws guide therefore needs a trusted caller to retrieve approved document excerpts and pass them in the request; it does not access the vault itself.

Example bylaws question:

```bash
curl -X POST http://localhost:5678/webhook/community-bylaws-info-guide \\
  -H "Content-Type: application/json" \\
  -d '{"question":"What is the process for booking the clubhouse?","documents":[{"title":"Community Handbook","section":"Facilities 4.2","version":"2026-01","text":"Residents may request the clubhouse through the booking portal, subject to availability and published charges."}]}'
```

Example poll results summary:

```bash
curl -X POST http://localhost:5678/webhook/poll-governance-decision-summary \\
  -H "Content-Type: application/json" \\
  -d '{"poll":{"id":44,"question":"Select the community garden design","closed":true,"anonymous":true,"options":[{"text":"Design A","voteCount":48},{"text":"Design B","voteCount":31}]}}'
```

Example turnstile log review:

```bash
curl -X POST http://localhost:5678/webhook/smart-turnstile-access-review \\
  -H "Content-Type: application/json" \\
  -d '{"communityId":12,"reviewedWindow":"last-hour","logs":[{"turnstileId":3,"turnstileName":"North Gate","personType":"RESIDENT","accessDecision":"DENIED_OUTSIDE_HOURS","failureReason":"Outside permitted hours","timestamp":"2026-10-23T10:15:00Z"}]}'
```

Example SLA review:

```bash
curl -X POST http://localhost:5678/webhook/helpdesk-sla-backlog-review \
  -H "Content-Type: application/json" \
  -d '{"tickets":[{"id":123,"ticketNumber":"HD-123","subject":"Water leak near light fitting","category":"PLUMBING","priority":"HIGH","status":"OPEN","slaDueAt":"2026-10-23T16:00:00Z","createdAt":"2026-10-23T08:00:00Z"}]}'
```

### 2. Finance (`workflows/finance/`)
| Workflow File | Trigger Type | AI Engine | Purpose |
| :--- | :--- | :--- | :--- |
| `receipt-ocr-parser.json` | Webhook (`POST /webhook/receipt-parse`) | Gemini Multimodal | Parses uploaded vendor invoices/bills, extracts merchant name, date, invoice total, tax, and auto-categorizes for society treasurers. |
| `maintenance-dues-reconciliation-assistant.json` | Webhook (`POST /webhook/maintenance-dues-reconciliation`) | Gemini 2.5 Flash | Calculates open/overdue aggregates and drafts data-quality and follow-up checks; it does not apply penalties, contact residents, or post payments. |
| `utility-bill-and-autopay-review.json` | Webhook (`POST /webhook/utility-bill-autopay-review`) | Gemini 2.5 Flash | Flags bill/mandate metadata exceptions such as cap exceedance and missing notifications; it never initiates or changes a payment or mandate. |
| `upi-wallet-transaction-review.json` | Webhook (`POST /webhook/upi-wallet-transaction-review`) | Gemini 2.5 Flash | Checks masked transactions for duplicate references, amount mismatches and reconciliation gaps; no wallet movement, refund or fraud decision. |
| `personal-finance-investment-education.json` | Webhook (`POST /webhook/personal-finance-investment-education`) | Gemini 2.5 Flash | Summarizes aggregate budgets and holdings for general education only; no product-specific buy/sell/hold advice or trade execution. |

#### Requested Finance, Health and Wellness page coverage

| Requested module | App presence | Existing or added workflow coverage |
| :--- | :--- | :--- |
| Maintenance Dues & ERP | Present at `/finance/maintenance` | Added `maintenance-dues-reconciliation-assistant.json`; caller supplies authorized invoice data. |
| Bills & Utility Payments | Present at `/finance/bills` and `/bills`; administrative billing at `/finance/billing` | Existing `receipt-ocr-parser.json` extracts invoice data; added `utility-bill-and-autopay-review.json` for bill and mandate exception review. |
| P2P UPI & Wallet | Present at `/pay` and `/payments` | Added `upi-wallet-transaction-review.json` for advisory transaction reconciliation. |
| Personal Finance & Investments | Present at `/my-money`, `/personal-finance`, and investment pages including `/mutual-funds`, `/fd`, `/loans`, `/gold`, and `/insurance` | Added `personal-finance-investment-education.json`; only de-identified aggregates and user-supplied values should be sent. |
| Mana Health | Present at `/health` | Existing page-specific workflows in `workflows/health/`, including `health-dashboard.json`; health workflows are not diagnostic or clinical decision tools. |
| Health Buddy (Wellness) | Present at `/wellness` and its food, water, challenges, providers and profile pages | Existing `workflows/wellness/` workflows cover dashboard coaching, food journal, meal logging, hydration, challenges, providers and profile. |

All Finance workflows are inactive on import. Set `GOOGLE_GEMINI_API_KEY` in the n8n environment and protect webhook endpoints. Invoke them from a trusted server-side integration, not browser code. Do not send account numbers, UPI IDs, PINs, OTPs, credentials, full statements, or resident-identifying details. AI outputs are advisory and require review by the responsible person; configure authentication, consent, retention and access controls before activation.

### 3. Community (`workflows/community/`)
| Workflow File | Trigger Type | AI Engine | Purpose |
| :--- | :--- | :--- | :--- |
| `community-weekly-digest.json` | Scheduled Cron (Every Sunday 6 PM) | Gemini 3.5 Flash Lite | Reads active announcements, polls, and sports schedules to compose a weekly digest bulletin published to the notice board. |
| `community-feed-moderator.json` | Webhook (`POST /webhook/community-feed-moderator`) | Gemini 3.5 Flash Lite | Real-time civility and safety auditor for community feed posts & comments; detects toxicity, commercial spam, panic rumors, and slurs. |

### 4. Sports (`workflows/sports/`)
| Workflow File | Trigger Type | AI Engine | Purpose |
| :--- | :--- | :--- | :--- |
| `sports-registration-screener.json` | Webhook (`POST /webhook/sports-registration-screener`) | Gemini 3.5 Flash Lite | Audits player registration compliance (DOB, age brackets, gender, KYC) and drafts instant resident WhatsApp confirmation. |
| `sports-fixture-ai-scheduler.json` | Webhook (`POST /webhook/sports-fixture-scheduler`) | Gemini 3.5 Flash Lite | Automatically generates optimal, conflict-free match schedules across available venues and time slots with rest balance. |
| `sports-match-ai-recap.json` | Webhook (`POST /webhook/sports-match-recap`) | Gemini 3.5 Flash Lite | Analyzes concluded cricket/football scorecards, generates news headlines, dramatic recaps, MVP, badge awards, and WhatsApp bulletins. |
| `sports-dispute-and-moderation.json` | Webhook (`POST /webhook/sports-dispute-and-moderation`) | Gemini 3.5 Flash Lite | Arbitrates match disputes (walkovers, rain rules/DLS targets) and screens peer ratings/reviews for toxicity and unsportsmanlike behavior. |
| `sports-auction-integrity-auditor.json` | Webhook (`POST /webhook/sports-auction-integrity-auditor`) | Gemini 3.5 Flash Lite | Audits player auction for collusion, bid rigging, purse deficit/insolvency, and squad size parity violations. |
| `sports-scoring-anomaly-detector.json` | Webhook (`POST /webhook/sports-scoring-anomaly-detector`) | Gemini 3.5 Flash Lite | Real-time integrity audit of live sports scorecards for impossible states (7+ ball overs, 11+ wickets, bowler quota breaches, score tampering). |
| `sports-contingency-rescheduler.json` | Webhook (`POST /webhook/sports-contingency-rescheduler`) | Gemini 3.5 Flash Lite | Crisis re-scheduler for rainouts or venue curfew; recalculates shortened overs, activates reserve days, and crafts captain alerts. |

### 5. Authentication & Security (`workflows/auth/`)
| Workflow File | Trigger Type | AI Engine | Purpose |
| :--- | :--- | :--- | :--- |
| `user-registration-audit-and-onboarding.json` | Webhook (`POST /webhook/user-registration-screener`) | Gemini 3.5 Flash Lite | Audits new resident registration for spam/fraud, address realism, compiles personalized role onboarding pack, and drafts WhatsApp welcome. |
| `user-login-security-and-anomaly-detector.json` | Webhook (`POST /webhook/user-login-security-audit`) | Gemini 3.5 Flash Lite | Real-time evaluation of user login telemetry for impossible travel, brute-force risk, anomalous devices, and enforces step-up OTP. |
| `auth-anomaly-and-lockout.json` | Webhook (`POST /webhook/auth-anomaly-and-lockout`) | Gemini 3.5 Flash Lite | Defends against brute-force and bot attacks on login; enforces temporary cooldowns or automated account lockout with instant alerts. |

### 6. Profile & KYC (`workflows/profile/`)
| Workflow File | Trigger Type | AI Engine | Purpose |
| :--- | :--- | :--- | :--- |
| `profile-kyc-fraud-detector.json` | Webhook (`POST /webhook/profile-kyc-fraud-detector`) | Gemini 3.5 Flash Lite | Audits resident profile and family directory for document coherence, residency legitimacy, missing emergency info, and assigns readiness score. |

### 7. Admin Hub (`workflows/admin/`)
| Workflow File | Trigger Type | AI Engine | Purpose |
| :--- | :--- | :--- | :--- |
| `admin-kyc-document-verifier.json` | Webhook (`POST /webhook/admin-kyc-verify`) | Gemini 3.5 Flash Lite | Audits resident/vendor KYC application dossiers for document tampering, name/ID mismatch, lease agreement validity, and assigns approval verdicts. |
| `admin-bulk-import-auditor.json` | Webhook (`POST /webhook/admin-bulk-import-audit`) | Gemini 3.5 Flash Lite | Pre-import gatekeeper scanning CSV/Excel batches for privilege escalation risks, flat occupancy collisions, and phone/contact data quality. |
| `admin-announcement-broadcast-optimizer.json` | Webhook (`POST /webhook/admin-announcement-optimize`) | Gemini 3.5 Flash Lite | Analyzes society circulars for clarity, legal/defamation prudence, tone, and generates multi-channel adaptations (WhatsApp, SMS, Notice Board, Push). |
| `admin-platform-ops-incident-analyzer.json` | Webhook (`POST /webhook/admin-platform-ops-analyzer`) | Gemini 3.5 Flash Lite | SRE & SOC automated diagnostics analyzing platform latency spikes, failed 5xx error clusters, and privileged audit log anomalies with runbooks. |
| `admin-architecture-change-review.json` | Webhook (`POST /webhook/admin-architecture-change-review`) | Gemini 2.5 Flash | Reviews supplied architecture-change proposals for missing evidence, security/privacy/reliability risks, and reviewer questions; never approves or deploys changes. |

### Requested Experiences, Mobility, CPN, CPOS and Platform Ops coverage

| Requested module | App presence | Existing or added workflow coverage |
| :--- | :--- | :--- |
| Experiences | `ManaExperiencesHub` and `experiencesService` exist in `src/pages/entertainment/` and `src/services/entertainment/`, but no route for the hub is registered in `src/app/routes.tsx`. | Added `workflows/experiences/experiences-recommendation-and-itinerary.json`. Route registration and server-side webhook integration remain necessary to expose it in the UI. |
| Mobility & Carpooling | Present at `/commute` and `/mobility`; commute offers/bookings and mobility carpool options are backed by app services. | Added `workflows/mobility/mobility-carpool-match-assistant.json`; ranks masked, coarse-area options and does not book rides. |
| CPN (Professional Network) | Present at `/cpn` with feed, directory/network, jobs, referrals, mentorship, learning, company/startup, collaboration and profile subpages. | Existing workflows in `workflows/professional-network/` cover feed, directory/network, profile, learning, mentorship and entrepreneurship. No duplicate CPN workflow was added. |
| Property OS (CPOS) | Present at `/cpos` with property, ownership, occupancy, residents, finance, documents, analytics and CRM routes. | Added `workflows/cpos/cpos-property-portfolio-review.json` for aggregate portfolio and operations review. |
| Platform Ops & Architecture | Admin-protected pages exist at `/architecture`, `/architecture/logs`, `/architecture/operations` and `/admin/operations`. | Existing `workflows/admin/admin-platform-ops-incident-analyzer.json` covers telemetry and privileged-audit summaries; added `admin-architecture-change-review.json` for change proposals. |

The new Experiences, Mobility, CPOS and Architecture workflows are inactive on import and return suggestions or reviews only. They do not create bookings, alter property records, approve architecture changes, run deployments or dispatch operations. Use authenticated server-side callers, send minimized and de-identified data, and require a human decision for consequential actions. For CPN, the existing exports are focused workflows rather than one workflow per individual CPN subpage.

### 8. Events Module (`workflows/events/`)
| Workflow File | Trigger Type | AI Engine | Purpose |
| :--- | :--- | :--- | :--- |
| `event-proposal-and-budget-screener.json` | Webhook (`POST /webhook/event-proposal-screener`) | Gemini 3.5 Flash Lite | Audits community festival/event proposals for venue crowd safety, budget per head, residential quiet hours (10 PM curfew), and fire/police permits. |
| `event-rsvp-and-crowd-forecaster.json` | Webhook (`POST /webhook/event-crowd-forecaster`) | Gemini 3.5 Flash Lite | Predicts actual attendee turnout applying day-of-week drop-off, calculates Annadanam/catering buffer (+15%), forecasts vehicle overflow vs basement slots. |
| `event-volunteer-and-seva-allocator.json` | Webhook (`POST /webhook/event-volunteer-allocator`) | Gemini 3.5 Flash Lite | Auto-assigns registered volunteers to departments (Food, Registration, Security, AV) based on skills and shifts; drafts personal WhatsApp duty messages. |
| `event-post-recap-and-survey-analyzer.json` | Webhook (`POST /webhook/event-post-recap`) | Gemini 3.5 Flash Lite | Synthesizes concluded event footfall, collections, and attendee ratings into a satisfaction index, extracts friction points, and crafts WhatsApp bulletins. |

### 9. Safety & Security Command Center (`workflows/safety/`)
| Workflow File | Trigger Type | AI Engine | Purpose |
| :--- | :--- | :--- | :--- |
| `safety-emergency-sos-and-incident-dispatcher.json` | Webhook (`POST /webhook/safety-emergency-sos-dispatcher`) | Gemini 3.5 Flash Lite | Real-time SOS panic triage, guard quick-response team deployment, emergency services auto-dispatch recommendation, and neighbor advisory broadcast. |
| `safety-visitor-screening-and-overstay-auditor.json` | Webhook (`POST /webhook/safety-visitor-screening-auditor`) | Gemini 3.5 Flash Lite | Screens inbound guests, delivery drivers, and contractors; flags overstay duration anomalies, delivery lingering in towers, and sends resident alerts. |
| `safety-anpr-barrier-and-parking-enforcer.json` | Webhook (`POST /webhook/safety-anpr-parking-enforcer`) | Gemini 3.5 Flash Lite | ANPR automatic boom barrier control, unauthorized parking bay encroachment audit, fire-lane blockage hazard, and progressive fine/clamp escalation. |
| `safety-domestic-staff-kyc-and-attendance-guardian.json` | Webhook (`POST /webhook/safety-staff-kyc-attendance-guardian`) | Gemini 3.5 Flash Lite | Audits domestic staff (maids, cooks, drivers) police verification status, curfew/off-hour entry anomalies, and delivers employer flat alerts. |
| `safety-iot-hardware-sentinel-and-tamper-detector.json` | Webhook (`POST /webhook/safety-iot-hardware-sentinel`) | Gemini 3.5 Flash Lite | Monitors IoT gate device telemetry (ANPR cameras, boom barriers, RFID turnstiles); detects offline heartbeat gaps, physical tampering, and dispatches repairs. |
| `safety-trust-and-privacy-compliance-auditor.json` | Webhook (`POST /webhook/safety-trust-privacy-auditor`) | Gemini 3.5 Flash Lite | DPDP Act (India) privacy compliance audit on location consent (geofence gate vs SOS vs patrol), CCTV playback logs, and resident trust score rating. |

### 10. Smart Metering & IoT (`workflows/iot/`)

The Smart Metering page is `/iot/meters` (`src/app/components/iot/SmartMeterDashboard.tsx`). The workflows use the metering service contracts in `src/services/iot/meteringService.ts`. AI workflows review supplied measurements and produce operator summaries; they do not send meter control commands. Billing mutations are isolated behind an explicit `approved: true` gate.

| Workflow File | Trigger | Purpose |
| :--- | :--- | :--- |
| `iot-meter-telemetry-anomaly-review.json` | POST `/webhook/iot-meter-telemetry-review` | Reviews an ingested or externally received meter reading for spikes, leak indicators, tamper flags, low battery and signal concerns. Returns observations and checks for an operator; it does not ingest telemetry or change a meter. |
| `iot-meter-health-summary.json` | POST `/webhook/iot-meter-health-summary` | Summarizes the community meter snapshot from `GET /api/v1/iot/metering/community/{communityId}` and highlights offline/fault/tampered devices, leaks, low battery and data quality. |
| `iot-month-end-cfbos-billing-review.json` | POST `/webhook/iot-month-end-billing-review` | Defaults to preview only. With `approved: true`, optionally closes selected meter cycles using `POST /api/v1/iot/metering/billing/{meterId}/close-month` and syncs the community to CFBOS. Requires an authorized bearer token. |

#### Workflow setup

Set `GOOGLE_GEMINI_API_KEY` in the n8n environment for AI review workflows. For the month-end flow, set `MANA_API_BASE_URL` to the backend API root (default `http://host.docker.internal:8082/api`) and `MANA_API_TOKEN` to a restricted service token, or pass `apiToken` in a protected request. Keep webhook authentication enabled at the reverse proxy or n8n ingress; do not expose service tokens in browser code or logs. These workflows are inactive on import.

The dashboard currently calls meter list, telemetry ingest, and CFBOS sync directly from the frontend. To invoke a workflow from the page, call the n8n webhook from a trusted backend or authenticated server-side proxy. Avoid calling authenticated n8n webhooks directly from the browser.

Example read-only telemetry review:

```bash
curl -X POST http://localhost:5678/webhook/iot-meter-telemetry-review \
  -H "Content-Type: application/json" \
  -d '{"meterSerialNumber":"WM-T1-103","meterType":"WATER_METER","unitNumber":"A-103","protocol":"MODBUS_TCP","pulseCount":38400,"instantaneousFlow":18.4,"batteryLevel":88,"tamperFlag":false,"previousReading":38320,"deltaConsumed":80,"anomalyDetected":true,"alertMessage":"Unusually high flow observed"}'
```

Example fleet health summary:

```bash
curl -X POST http://localhost:5678/webhook/iot-meter-health-summary \
  -H "Content-Type: application/json" \
  -d '{"communityId":12,"meters":[{"meterSerialNumber":"WM-T1-103","meterType":"WATER_METER","unitNumber":"A-103","protocol":"MODBUS_TCP","lastReading":38400,"status":"ACTIVE","batteryLevel":88,"leakDetected":true}]}'
```

Example month-end preview (no billing mutations):

```bash
curl -X POST http://localhost:5678/webhook/iot-month-end-billing-review \
  -H "Content-Type: application/json" \
  -d '{"communityId":12,"billingMonth":"2026-09","meterIds":[1,2]}'
```

---

### 11. Group Buying & Deals (`workflows/group-buying/`)

The member pages are routed under `/group-buying/*`; vendor tools also include group-buying management. The current `src/services/group-buying/groupBuyingService.ts` uses sample catalog records and browser `localStorage` for orders, reviews and disputes; it does not expose live backend endpoints. Send only current, authorized records to these advisory workflows from a trusted server-side integration. They do not place orders, change prices, publish deals, or make payment/dispute decisions.

| Workflow File | Trigger | Related Pages | Purpose |
| :--- | :--- | :--- | :--- |
| `group-buying-demand-match-assistant.json` | POST `/webhook/group-buying-demand-match` | AI Demand Search, Deals, Demand Board, Catalog | Matches a resident query against caller-supplied active deals and open demands; suggestions are grounded in the supplied catalog. |
| `group-buying-deal-quality-and-tier-auditor.json` | POST `/webhook/group-buying-deal-audit` | Deals, Deal Detail, Vendor Group Buying, Festival Deals, Monthly Baskets | Checks tier ranges and price consistency, flags unsupported savings claims and missing vendor/fulfillment information for human review. |
| `group-buying-order-dispute-triage.json` | POST `/webhook/group-buying-dispute-triage` | My Orders, Order Review, Order Dispute, Pickup Pass | Creates a neutral intake summary and evidence checklist for quality, quantity, wrong item, delay, or non-receipt cases. Payment action remains `NONE_PENDING_HUMAN_REVIEW`. |

Set `GOOGLE_GEMINI_API_KEY` in the n8n environment. All workflows are inactive on import. Protect webhook endpoints with authentication and call them through a trusted server-side proxy; do not place n8n secrets in browser code. Since this module currently stores sample deals and local orders in the browser, the frontend cannot yet automatically send authoritative records to these webhooks. A backend API for deals, orders and disputes is a prerequisite for production integration.

Example demand match:

```bash
curl -X POST http://localhost:5678/webhook/group-buying-demand-match \
  -H "Content-Type: application/json" \
  -d '{"query":"organic veggie box","deals":[{"id":"deal-001","title":"Fresh Organic Produce Box","category":"Groceries","vendor":"Green Earth Farms","tiers":[{"minQty":1,"maxQty":19,"pricePerUnit":850,"label":"Standard"}]}],"demands":[]}'
```

Example deal audit:

```bash
curl -X POST http://localhost:5678/webhook/group-buying-deal-audit \
  -H "Content-Type: application/json" \
  -d '{"deal":{"id":"deal-001","title":"Fresh Organic Produce Box","category":"Groceries","description":"Weekly seasonal produce box","vendor":"Green Earth Farms","vendorVerified":true,"currentParticipants":34,"targetParticipants":50,"mrp":1100,"savings":29,"endDate":"2026-11-01T18:00:00Z","pickupPoints":["Tower A Lobby"],"tiers":[{"minQty":1,"maxQty":19,"pricePerUnit":850,"label":"Standard"},{"minQty":20,"maxQty":39,"pricePerUnit":750,"label":"Group"},{"minQty":40,"maxQty":null,"pricePerUnit":650,"label":"Bulk"}]}}'
```

Example dispute triage:

```bash
curl -X POST http://localhost:5678/webhook/group-buying-dispute-triage \
  -H "Content-Type: application/json" \
  -d '{"dispute":{"orderId":"ORD-204","category":"QUANTITY","description":"Received one item instead of the two ordered","escrowProtected":true},"order":{"dealTitle":"Organic Produce Box","quantity":2,"fulfillment":"PICKUP","status":"READY"},"evidenceProvided":["pickup photo"]}'
```

### 12. Marketplace (`workflows/marketplace/`)
| Workflow File | Trigger Type | AI Engine | Purpose |
| :--- | :--- | :--- | :--- |
| `marketplace-listing-screener-and-price-optimizer.json` | Webhook (`POST /webhook/marketplace-listing-screener`) | Gemini 3.5 Flash Lite | Audits items for community safety & prohibited goods (weapons, hazardous chemicals, counterfeit), checks food allergen disclosures, calculates fair pre-owned pricing bands, generates SEO search tags, and scores buyer appeal. |
| `marketplace-buyer-offer-and-bargain-arbitrator.json` | Webhook (`POST /webhook/marketplace-offer-arbitrator`) | Gemini 3.5 Flash Lite | Arbitrates buyer price negotiations; detects lowballing, computes fair win-win counter-offer prices, and drafts courteous, neighborly offer messages. |
| `marketplace-dispute-and-escrow-arbitrator.json` | Webhook (`POST /webhook/marketplace-dispute-arbitrator`) | Gemini 3.5 Flash Lite | Resolves peer-to-peer item condition disputes; evaluates defect claims vs listed condition, advises fair resolution (full refund, partial refund, or return), and enforces neighborly civility. |
| `marketplace-lost-and-found-matcher.json` | Webhook (`POST /webhook/marketplace-lost-found-matcher`) | Gemini 3.5 Flash Lite | Correlates Lost & Found reports using semantic description and location proximity, scores match confidence, and crafts anti-theft challenge questions to verify rightful ownership. |

### How to Import a Workflow into n8n:
1. Open `http://localhost:5678` in your browser.
2. In the top-right corner, click **`...` (More options)** -> **Import from File**.
3. Select any `.json` file from `automation/workflows/<module>/`.
4. Click **Activate** (toggle top-right).

---

## 🧪 Testing Event Module Webhooks

### 1. Test Event Proposal & Budget Screener
```bash
curl -X POST http://localhost:5678/webhook/event-proposal-screener \
  -H "Content-Type: application/json" \
  -d '{
    "proposalId": "PROP-GCHAT-2026",
    "title": "Ganesh Chaturthi Utsav 2026",
    "category": "FESTIVAL",
    "venue": "Central Temple Lawn & Pandal",
    "expectedAttendees": 350,
    "estimatedBudget": 45000,
    "fundingSource": "SOCIETY_FUND",
    "eventStart": "2026-08-27 17:00",
    "eventEnd": "2026-08-27 22:30",
    "soundLoudspeakersPlanned": true,
    "fireOrCookingPlanned": true,
    "organizer": { "name": "Cultural Committee", "phone": "+91 98765 00000", "flatNo": "Tower A-201" }
  }'
```

**Expected AI Response:**
```json
{
  "status": "success",
  "proposalId": "PROP-GCHAT-2026",
  "eventTitle": "Ganesh Chaturthi Utsav 2026",
  "evaluation": {
    "screeningVerdict": "CONDITIONAL_APPROVAL",
    "viabilityScore": 88,
    "budgetHealth": {
      "feasibility": "FEASIBLE",
      "costPerHead": 128,
      "notes": "Cost per head of ₹128 is well within festive limits."
    },
    "safetyCompliance": {
      "curfewCompliant": true,
      "fireClearanceRequired": true,
      "crowdDensityRisk": "MODERATE",
      "noiseAdvisory": "Loudspeakers must step down below 55dB after 9:30 PM per residential quiet hours."
    },
    "permitRequirements": [
      "Fire Safety Clearance & Extinguishers at Food Stalls",
      "Estate Security Gate Headcount Log",
      "Facility Booking Approval"
    ],
    "committeeRecommendation": "Recommended for approval subject to fire clearance for the cooking pandal."
  }
}
```

### 2. Test Event RSVP & Crowd Forecaster
```bash
curl -X POST http://localhost:5678/webhook/event-crowd-forecaster \
  -H "Content-Type: application/json" \
  -d '{
    "eventId": 101,
    "eventName": "Ganesh Chaturthi Utsav 2026",
    "category": "FESTIVAL",
    "totalRsvps": 180,
    "totalDevoteesCount": 395,
    "mealRegistrations": { "lunch": 220, "dinner": 310, "prasadamTakeaway": 90 },
    "eventDay": "Sunday",
    "totalSocietyBasementParkingSlots": 75,
    "historicalShowUpRate": 85
  }'
```

**Expected AI Response:**
```json
{
  "status": "success",
  "eventId": 101,
  "eventName": "Ganesh Chaturthi Utsav 2026",
  "forecast": {
    "forecastedTurnout": 336,
    "turnoutConfidence": 89,
    "expectedShowUpRatePercent": 85,
    "peakWindow": "7:00 PM – 8:30 PM (Main Program & Dinner Rush)",
    "mealBuffer": {
      "recommendedPortions": 386,
      "bufferPercentage": 15,
      "wasteRisk": "LOW"
    },
    "parkingForecast": {
      "estimatedVehicles": 118,
      "overflowRisk": "MEDIUM",
      "overflowVehiclesCount": 43,
      "mitigation": "Station 2 volunteer marshals at Gate 2 and route 43 overflow vehicles to Club Outer Driveway."
    },
    "gateStaffRecommendation": 4,
    "organizerAlert": "Anticipating 336 attendees with peak load between 7:00 PM - 8:30 PM. Maintain 15% catering buffer (386 portions)."
  }
}
```

### 3. Test Event Volunteer & Seva Allocator
```bash
curl -X POST http://localhost:5678/webhook/event-volunteer-allocator \
  -H "Content-Type: application/json" \
  -d '{
    "eventId": 101,
    "eventName": "Ganesh Chaturthi Utsav 2026",
    "departments": [
      { "name": "Registration", "requiredCount": 4 },
      { "name": "Food & Kitchen", "requiredCount": 10 },
      { "name": "Security", "requiredCount": 6 }
    ],
    "shifts": ["Morning (6AM–2PM)", "Evening (2PM–10PM)"],
    "volunteers": [
      { "id": "V-1", "name": "Rahul Nair", "flatNo": "A-102", "preferredDepts": ["Food & Kitchen"], "preferredShifts": ["Morning (6AM–2PM)"] },
      { "id": "V-2", "name": "Meera Pillai", "flatNo": "B-405", "preferredDepts": ["Registration"], "preferredShifts": ["Morning (6AM–2PM)"] }
    ]
  }'
```

**Expected AI Response:**
```json
{
  "status": "success",
  "eventId": 101,
  "eventName": "Ganesh Chaturthi Utsav 2026",
  "roster": {
    "totalAssigned": 2,
    "unassignedCount": 0,
    "assignments": [
      { "volunteerId": "V-1", "name": "Rahul Nair", "department": "Food & Kitchen", "shift": "Morning (6AM–2PM)", "role": "Food & Kitchen Coordinator", "reason": "Preference matched" },
      { "volunteerId": "V-2", "name": "Meera Pillai", "department": "Registration", "shift": "Morning (6AM–2PM)", "role": "Registration Coordinator", "reason": "Preference matched" }
    ],
    "departmentDeficits": [
      { "department": "Registration", "needed": 4, "assigned": 1, "deficit": 3 },
      { "department": "Food & Kitchen", "needed": 10, "assigned": 1, "deficit": 9 },
      { "department": "Security", "needed": 6, "assigned": 0, "deficit": 6 }
    ],
    "shiftBalanceScore": 86,
    "sampleVolunteerBroadcast": "🙏 Dear Mana Volunteers, assignments for Ganesh Chaturthi Utsav 2026 are confirmed! Check your assigned duty department and report to the event desk 15 minutes before your shift starts. Thank you for your selfless seva! ✨"
  }
}
```

### 4. Test Event Post-Event Recap & Survey Analyzer
```bash
curl -X POST http://localhost:5678/webhook/event-post-recap \
  -H "Content-Type: application/json" \
  -d '{
    "eventId": 101,
    "eventName": "Ganesh Chaturthi Utsav 2026",
    "eventDate": "2026-08-27",
    "metrics": {
      "registeredCount": 420,
      "actualAttendedCount": 395,
      "totalDonationsCollected": 85400,
      "mealsServed": 480,
      "volunteersEngaged": 36
    },
    "attendeeFeedback": [
      { "rating": 5, "comment": "Soulful bhajans and glorious mandap decor!", "category": "Pooja" },
      { "rating": 4, "comment": "Delicious lunch, but slight line at 1:30 PM.", "category": "Food" }
    ]
  }'
```

---

## 🔌 Connecting Mana React Frontend

Import and use the client helper inside [`src/services/automation/automationService.ts`](file:///d:/Application/applications/mana%20community/mana-community-app/src/services/automation/automationService.ts):

```typescript
import { automationService } from '@/services/automation/automationService';

// 1. Audit event proposal for budget sanity & quiet hours:
const proposalReview = await automationService.screenEventProposal({
  title: 'Diwali Grand Mela 2026',
  estimatedBudget: 50000,
  expectedAttendees: 400,
  soundLoudspeakersPlanned: true,
  fireOrCookingPlanned: true,
});
console.log('Verdict:', proposalReview.evaluation.screeningVerdict);

// 2. Forecast crowd turnout, catering portions & parking overflow:
const crowdForecast = await automationService.forecastEventCrowd({
  eventName: 'Ganesh Utsav 2026',
  totalRsvps: 200,
  totalDevoteesCount: 440,
});
console.log('Buffer meals:', crowdForecast.forecast.mealBuffer.recommendedPortions);

// 3. Auto-allocate volunteers to departments & shifts:
const roster = await automationService.allocateEventVolunteers({
  eventName: 'Annual Sports Fest',
  departments: [{ name: 'Registration', requiredCount: 6 }],
  volunteers: volunteerList,
});
console.log('Shift balance:', roster.roster.shiftBalanceScore);

// 4. Generate post-event recap & WhatsApp community bulletin:
const recap = await automationService.generateEventPostRecap({
  eventName: 'Ganesh Utsav 2026',
  metrics: { registeredCount: 400, actualAttendedCount: 380, totalDonationsCollected: 75000 },
});
console.log('WhatsApp copy:', recap.recap.whatsappCommunityRecap);
```

---


---

## 🛒 Testing Marketplace Module Webhooks

### 1. Test Listing Screener & Price Optimizer
```bash
curl -X POST http://localhost:5678/webhook/marketplace-listing-screener \
  -H "Content-Type: application/json" \
  -d '{
    "listingId": "item-991",
    "title": "Wooden study desk with drawer",
    "description": "Solid teak wood study table in great shape. Light scratch on top edge.",
    "category": "Furniture",
    "originalPrice": 8500,
    "askingPrice": 3500,
    "condition": "Gently Used",
    "ageMonths": 14,
    "seller": { "name": "Vikram M", "flatNo": "Tower B-402" }
  }'
```

**Expected AI Response:**
```json
{
  "status": "success",
  "listingId": "item-991",
  "audit": {
    "safetyVerdict": "APPROVED",
    "prohibitedContent": false,
    "fairPriceRange": { "min": 2800, "max": 3800, "recommended": 3400 },
    "appealScore": 89,
    "searchTags": ["study-desk", "teak-wood", "furniture", "work-from-home"],
    "sellerAdvice": "Solid wood furniture retains strong value. Mention dimensions (L x W x H) to sell faster."
  }
}
```

### 2. Test Buyer Offer & Bargain Arbitrator
```bash
curl -X POST http://localhost:5678/webhook/marketplace-offer-arbitrator \
  -H "Content-Type: application/json" \
  -d '{
    "listingId": 205,
    "listingTitle": "Decathlon Triban RC100 Road Bike",
    "listingPrice": 14000,
    "proposedPrice": 8000,
    "category": "Sports",
    "condition": "Good Condition",
    "buyerMessage": "Hey neighbor, can you give for 8k? Pick up tonight."
  }'
```

**Expected AI Response:**
```json
{
  "status": "success",
  "negotiation": {
    "dealFairness": "lowball",
    "recommendedCounterPrice": 11500,
    "suggestedNeighborMessage": "Hi! Thanks for reaching out. Given the cycle is well maintained, the lowest I can do is ₹11,500. Let me know if you would like to test ride today!",
    "justification": "43% discount is below typical community secondary market rates of 15-20%."
  }
}
```

### 3. Test Lost & Found Correlation Matcher
```bash
curl -X POST http://localhost:5678/webhook/marketplace-lost-found-matcher \
  -H "Content-Type: application/json" \
  -d '{
    "lostItem": {
      "id": 101,
      "title": "Blue Leather Wallet with ID cards",
      "location": "Basement Parking B2",
      "description": "Lost my navy blue wallet containing Aadhaar card and apartment key fob."
    },
    "foundItem": {
      "id": 102,
      "title": "Dark blue gents wallet found near B2 pillar 14",
      "location": "Basement Parking B2",
      "description": "Found a dark blue leather wallet near elevator lobby entrance. Handed over to security desk."
    }
  }'
```

**Expected AI Response:**
```json
{
  "status": "success",
  "matchStatus": "probable_match",
  "confidenceScore": 94,
  "matchReasons": [
    "High semantic match on 'blue leather wallet' item type",
    "Exact match on location: Basement Parking B2 near elevator pillar",
    "Temporal timeline alignment within 24 hours"
  ],
  "ownershipChallengeQuestions": [
    "Ask claimant to name the specific bank/cards or ID details inside the wallet without looking",
    "Ask claimant to specify the brand logo on the wallet exterior"
  ],
  "suggestedAction": "Claimant should visit the Main Security Desk with government ID to claim the wallet."
}
```

## 🔒 Production Hardening Checklist

When deploying to a live society server:
- Set `WEBHOOK_URL=https://automation.yourdomain.com/` in `.env`.
- Place n8n behind Nginx reverse proxy with SSL (`certbot`).
- Enable webhook authentication checking using the `MANA_WEBHOOK_SECRET` header.
- For 100% offline environments, run **Ollama** alongside n8n using local open-weight models (`llama3.2`).
