# Remaining MyGate Parity Gaps

This document tracks features that exist in MyGate but are not yet implemented in Mana Community Hub web app. All software-implementable gaps have been addressed. The items below require hardware infrastructure, third-party integrations, or are major new product verticals.

---

## 1. Hardware Infrastructure (Requires Device/Vendor SDK)

### Boom Barrier Integration
- **What MyGate does:** Real-time vehicle entry/exit via boom barrier with automatic license plate recognition and gate open/close control
- **Required:** Integration with barrier vendors (Benica, CDVI, Nortech, etc.) via their SDKs/APIs
- **Backend endpoint to add:** `POST /api/gate/barrier/open`, `GET /api/gate/barrier/status`
- **Effort:** High — vendor-specific hardware SDK per deployment

### Intercom Integration
- **What MyGate does:** Resident receives a call on their phone/app when a visitor arrives at the gate; can approve/deny entry without going to gate
- **Required:** VoIP/SIP integration or proprietary intercom system API
- **Backend endpoint to add:** `POST /api/gate/intercom/call/{visitorEntryId}`, `PUT /api/gate/intercom/{callId}/respond`
- **Effort:** High — requires VoIP infrastructure (Twilio/Exotel or hardware intercom API)

### CCTV Live Stream Integration
- **What MyGate does:** Guard and admin can view live CCTV feeds from within the app; motion alerts linked to visitor entry events
- **Required:** RTSP/HLS video stream proxy; camera onboarding per property
- **Web UI to add:** CCTV viewer page at `/security/cctv` — live feed grid, camera list, motion event timeline
- **Backend endpoint to add:** `GET /api/cctv/cameras?communityId=`, `GET /api/cctv/stream/{cameraId}` (HLS manifest URL)
- **Effort:** High — video streaming infrastructure + camera registration per community

### ANPR (Automatic Number Plate Recognition) Hardware
- **What MyGate does:** Automatic vehicle number plate reading at entry/exit via IP camera + ML model
- **Required:** ANPR camera hardware + ML inference service
- **Note:** Web app already has `AnprGateLiveMonitor` component — backend integration with real ANPR hardware needed
- **Effort:** Very high — ML model + camera hardware per gate

---

## 2. Major New Product Verticals

### Hyperlocal Commerce / MyGate Market
- **What MyGate does:** Grocery and daily essentials delivered to the community gate; resident orders within app, delivery agent drops at gate
- **Scope:** Full e-commerce vertical — product catalog, inventory, delivery partner integration, last-mile logistics
- **Effort:** Very high — separate product vertical (6–9 months)

### Enterprise Multi-Fund Accounting & GST
- **What MyGate does:** Multi-fund ledger (maintenance corpus, sinking fund, repair fund), bank reconciliation, partial payment tracking, GST invoice generation with HSN codes, detailed treasurer reports for large RWAs
- **Current state:** Mana has functional billing (invoicing, UPI collection, outstanding reports) — adequate for small/mid societies
- **Gaps to add:**
  - Multiple fund accounts per community
  - Bank statement upload + auto-reconciliation
  - GST invoice with HSN/SAC codes
  - Partial payment tracking
  - Auditor-ready financial reports
- **Effort:** High — 3–4 months of finance module work

### Inter-Society Resident Profile Portability
- **What MyGate does:** Resident moving to another MyGate-enabled society keeps their profile, vehicle records, and history
- **Requires:** Cross-community identity federation
- **Effort:** Platform-level architecture change

---

## 3. Third-Party Integrations (Software-Implementable)

### P1 — Quick Wins (plug into already-built features)

#### Sahaj Prepaid Meter Recharge (BSES Delhi)
- **What it is:** BSES Delhi/NCR's resident-facing prepaid electricity meter top-up platform. Residents recharge their meter like mobile prepaid. BSES Rajdhani and BSES Yamuna are already in the biller catalog.
- **What's missing:** The recharge *flow* — balance check, top-up via UPI/Razorpay, recharge history, low-balance alert threshold setting.
- **Backend endpoints to add:**
  - `GET /api/sahaj/balance/{consumerId}` — current meter balance + units
  - `POST /api/sahaj/recharge` — body: `{ consumerId, amount, paymentMethod }`
  - `GET /api/sahaj/recharge/history/{consumerId}` — past top-ups
  - `POST /api/sahaj/alert-threshold` — set low-balance push alert
- **Web UI to add:** Sahaj top-up card in `/recharge` or `/iot/meters` — consumer ID input, balance display, quick-recharge amounts (₹100/₹200/₹500/custom), history tab
- **Effort:** Low — BSES Rajdhani/Yamuna already in biller list; needs prepaid API adapter

#### SMS Gateway — MSG91 / Exotel / Kaleyra
- **What's missing:** SMS channels are declared in `unifiedNotificationService.ts` but no provider adapter is wired. Visitor gate pass OTPs, parcel collection OTPs, emergency alerts, payment reminders currently have no actual SMS delivery.
- **Backend work:** Add MSG91 (or Exotel) adapter in notification service — configure API key via environment variable
- **Affects:** Visitor OTP, parcel OTP, guard SOS alerts, low-balance meter alerts, payment due reminders, emergency broadcast SMS channel
- **Effort:** Low — adapter pattern already exists, just needs provider credentials and HTTP client

---

### P2 — Medium Effort

#### Smart Meter Vendor APIs (Genus, HPL, Secure Meters, Landis+Gyr)
- **What it is:** Major prepaid/smart meter manufacturers deployed in Maharashtra, Karnataka, Rajasthan, Telangana housing societies. They expose DLMS/COSEM protocol or REST APIs.
- **Current state:** Generic IoT dashboard exists with MQTT/MODBUS/HTTP_PULSE support — works with any hardware using those protocols
- **What's missing:** Vendor-specific adapters for:
  - Real-time unit consumption per flat
  - Tamper detection alerts
  - Remote disconnect/reconnect (non-payment)
  - Prepaid balance top-up per vendor
- **Backend endpoints to add:** Vendor adapter layer on top of existing `/api/iot/meters` — `GET /api/iot/meters/{meterId}/vendor-data`, `POST /api/iot/meters/{meterId}/disconnect`
- **Vendors to integrate:** Genus Energy (Jaipur), HPL Electric (Delhi), Secure Meters (Udaipur), Landis+Gyr (pan-India)
- **Effort:** Medium — DLMS/COSEM parsing library + per-vendor REST API credentials

#### Tally ERP Export
- **What it is:** Tally ERP9 / TallyPrime — used by virtually every Indian society treasurer for bookkeeping. Societies need to import maintenance collections and expenses into Tally.
- **What's missing:** Export button in Finance module generating Tally-compatible XML/CSV ledger entries
- **Format:** Tally XML (voucher entries for receipts and payments) or CSV with debit/credit columns matching Tally's import format
- **Web UI to add:** "Export to Tally" button in Finance → date range picker → download XML/CSV
- **Backend endpoint to add:** `GET /api/finance/export/tally?communityId=&from=&to=` — returns Tally XML
- **Effort:** Low-medium — XML generation, no external API needed

#### DigiLocker / Aadhaar eKYC
- **What it is:** Government of India's digital document wallet. Used for resident onboarding KYC — pulls Aadhaar, voter ID, driving licence, property documents directly from DigiLocker.
- **Current state:** `aadhaarVerified` and `kycStatus` fields exist in API types but no OAuth flow is implemented
- **What's missing:** DigiLocker OAuth 2.0 flow, document pull, KYC status update
- **Backend endpoints to add:**
  - `GET /api/kyc/digilocker/auth-url` — returns OAuth redirect URL
  - `POST /api/kyc/digilocker/callback` — handle OAuth callback, pull documents
  - `GET /api/kyc/status/{residentId}` — current KYC status
- **Web UI to add:** "Verify with DigiLocker" button in resident onboarding / KYC section → opens DigiLocker OAuth → returns with verified documents
- **Effort:** Medium — DigiLocker API partner registration required + OAuth 2.0 flow

---

### P3 — Compliance & Hardware

#### RERA Compliance Dashboard
- **What it is:** Real Estate Regulatory Authority — mandatory for housing societies with >8 units or >500 sq m. Requires annual maintenance fund disclosures, project registration number display, and auditor reports.
- **What's missing:** RERA registration info display, annual disclosure document upload/download, maintenance fund audit report generation
- **Web UI to add:** `/admin/rera` page with:
  - RERA registration number + QR code
  - Annual disclosure filing status per year
  - Document vault for RERA filings (link to existing DigitalVault)
  - Maintenance fund statement (auto-generated from Finance module)
- **Effort:** Medium — no external API; content management + document generation

#### ZKTeco / ESSL Biometric Hardware (Guard Attendance)
- **What it is:** ZKTeco and ESSL are the dominant biometric (fingerprint/face) attendance device brands in Indian offices and gated communities. Guard clock-in is currently app-based — hardware biometric gives tamper-proof attendance.
- **What's missing:** Hardware SDK integration for biometric punch-in/out, sync with guard attendance module
- **Backend endpoints to add:** Webhook receiver for ZKTeco push events `POST /api/guard/biometric/punch`; ZKTeco SDK pull `GET /api/guard/biometric/sync`
- **Effort:** High — requires device hardware + ZKTeco/ESSL SDK license

---

## 4. Already Built (confirmed in audit)

These were suspected missing but are actually implemented:

| Integration | File | Status |
|---|---|---|
| BBPS (utility bill payments) | `src/services/finance/billerService.ts` | ✅ Full — BSES, BESCOM, MSEDCL, TNEB, MGL, water, broadband, DTH, FASTag, municipal tax |
| NACH / eNACH / UPI Autopay | `src/services/finance/manaBillsAutopayService.ts` | ✅ Full — mandate create/pause/revoke, pre-debit notifications |
| Razorpay / Cashfree / ManaPay | payment services | ✅ Full payment gateways |
| Generic IoT Smart Meters | `src/app/components/iot/SmartMeterDashboard.tsx` | ✅ MQTT, MODBUS_TCP, MODBUS_RTU, HTTP_PULSE |
| Property portals (CRM) | `PortalIntegrationsPage.tsx` | ✅ 99acres, MagicBricks, Housing.com, NoBroker, Facebook Ads |
| WhatsApp / SMS channels (declared) | `unifiedNotificationService.ts` | ⚠️ Declared but no provider adapter wired |

---

## 5. Mobile-Only Features (Already in Mobile App, Not Needed in Web)

| Feature | Mobile Status | Web Status | Notes |
|---|---|---|---|
| Real-time entry push alerts | ✅ Mobile guard app | N/A — web admin only | Gate alerts are guard/resident mobile features |
| Guard patrol GPS tracking | ✅ Mobile guard app | ✅ Web patrol log | GPS coordinates captured on mobile, web shows log |
| Offline sync for gate entry | ✅ Mobile app | N/A | Web requires connectivity |

---

## Summary

| Category | Count | Effort |
|---|---|---|
| Hardware integrations | 4 | High — vendor-specific |
| New product verticals | 3 | Very high — months each |
| Mobile-only (no web needed) | 3 | N/A |

All software-implementable gaps (14 features across 5 partial modules + 9 missing modules) have been implemented in PR #325.
