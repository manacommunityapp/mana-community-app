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

## 3. Mobile-Only Features (Already in Mobile App, Not Needed in Web)

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
