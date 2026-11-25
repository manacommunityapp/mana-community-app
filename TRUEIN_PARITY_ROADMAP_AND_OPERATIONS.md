# Truein Parity & Biometric CWMS: Operational Runbook & Action Plan

This document details the enterprise features implemented to achieve parity with **Truein** (Face Attendance & Contractor Workforce Management), along with the operational runbook for physical turnstile deployment, database migrations, and production testing.

---

## 1. System Overview & Architecture

The system delivers a unified biometric access, touchless attendance, and contractor governance platform across four core tiers:

```
┌────────────────────────────────────────────────────────┐
│               MANA COMMUNITY ECOSYSTEM                 │
├────────────────────────┬───────────────────────────────┤
│ Web Admin (Vite+React) │ Mobile App (Expo+React Native)│
│ - Face Attendance Kiosk│ - Tablet Kiosk Screen         │
│ - CWMS Management      │ - Field GPS+Selfie Punch      │
│ - AI TimeGuard Monitor │ - Supervisor Crew Clock-In    │
│ - Indian Payroll / CSV │ - 30s Auto Offline Sync       │
├────────────────────────┴───────────────────────────────┤
│            BACKEND SERVICE (Spring Boot 3)             │
│ - REST Endpoints (/kiosk-attendance, /sync-punches)   │
│ - TimeGuard Anomaly Evaluator (STOMP WebSocket alerts) │
│ - Relay Pulse Unlock Broadcaster                      │
│ - Flyway Migration V516 (Agencies, Workers, Anomalies) │
├────────────────────────┬───────────────────────────────┤
│ Vision AI Engine       │ IoT Hardware Relay Bridge     │
│ - Passive Liveness     │ - Raspberry Pi BCM GPIO       │
│ - Anti-Spoof Detection │ - HTTP / IP Relays            │
│ - Multi-Role Matcher   │ - 3000ms Dry-Contact Pulse    │
└────────────────────────┴───────────────────────────────┘
```

---

## 2. What Needs To Be Done (Operational Action Items)

### Phase 1: Database Migration (Production Rollout)
1. Ensure the PostgreSQL database runs Flyway on startup, or execute:
   ```bash
   # Location: mana-community-service/src/main/resources/db/migration/
   # File: V516__cwms_and_timeguard_truein_parity.sql
   ```
2. Verify the 4 new tables:
   - `hr_contractor_agency`: Vendor/contractor agency records, contracts, and daily headcounts.
   - `hr_contractor_worker`: Biometric face template hashes, agency mappings, gate access passes.
   - `hr_timeguard_anomaly`: Audit logs for buddy-punching, geo-jumps, and liveness spoof alerts.
   - `hr_turnstile_offline_punch`: Ingest queue for offline kiosk punch synchronization.

---

### Phase 2: Physical Hardware Installation (Turnstiles & Barriers)
For gated communities and commercial premises with physical turnstiles (Tripod, Flap Barriers, Speed Gates, Mag-Locks):

1. **Edge Device Setup**:
   - Install Python 3 on a local Raspberry Pi 4 / mini-PC connected to the gate LAN.
   - Deploy `scripts/turnstile-hardware-bridge/turnstile_edge_bridge.py`.
2. **Relay Wiring**:
   - Connect Relay `NO` (Normally Open) and `COM` (Common) to the Turnstile Mainboard `OPEN_A` / `GND` trigger pins.
   - On Raspberry Pi: Wire Relay IN1 to **GPIO 17**, IN2 to **GPIO 27**, VCC to 5V, GND to GND.
3. **Run Bridge Service**:
   ```bash
   python3 turnstile_edge_bridge.py \
     --host http://<mana-community-backend-ip>:8080 \
     --community-id 1 \
     --driver gpio \
     --gpio-pins "TST-MAIN-01:17,TST-MAIN-02:27,TST-STAFF-1:22"
   ```
   *(For testing without physical hardware, run with `--driver mock`)*.

---

### Phase 3: Tablet Kiosk Deployment (Main Gate & Reception)
1. **Mounting**: Install iPad / Android tablets (10"+ recommended) in landscape or portrait wall enclosures at entry gates (1.2m–1.5m height from ground).
2. **App Launch**:
   - Open **Mana Community Mobile** or **Mana Web App**.
   - Navigate to `/access/kiosk` (or tap **Face Kiosk** on Guard Dashboard).
3. **Security Lock**:
   - Kiosk mode is locked with Admin PIN (`1234` default; configurable in backend).
   - Exit requires entering the master security PIN.
4. **Offline Resilience**:
   - If gate Wi-Fi goes down, attendance punches are stored locally in encrypted storage.
   - The app automatically syncs punches every 30 seconds as soon as connectivity resumes.

---

### Phase 4: Contractor Workforce (CWMS) Onboarding
1. Navigate to **HRM -> Contractors (CWMS)** in the Web Admin.
2. Add Contractor Agencies (e.g. Housekeeping, Security, Horticulture, Facility Maintenance).
3. Configure **Daily Quota Limits** (e.g., Apex Facility Solutions: max 35 workers/day).
4. Enroll workers:
   - Capture facial biometric embedding.
   - Ensure DPDP Act 2023 s.6 explicit biometric consent check is recorded.
5. Setup Supervisor Mobile Access:
   - Provide security supervisors access to `/guard/contractor-crew` on their phones for 1-tap bulk crew check-in and replacement worker tagging.

---

### Phase 5: AI TimeGuard Anomaly Monitoring
1. Monitor live alerts at `/hrm/timeguard` or via the **Attendance & TimeGuard** tab.
2. Watch for:
   - `FACE_LIVENESS_FAILED`: 2D photo prints or screen replays presented to camera.
   - `BUDDY_PUNCH_SUSPECTED`: Low-confidence biometric match attempts.
   - `GEO_JUMP_SUSPECTED`: Pings at multiple gates with impossible travel speed.
   - `CONTRACTOR_QUOTA_EXCEEDED`: Agency attempting to bill for more workers than contract limit.
3. Use the **Investigate / Dismiss / Confirm Violation** workflow buttons to settle anomalies before running payroll.

---

### Phase 6: Payroll & Statutory Compliance Export
1. At month-end, navigate to **HRM -> Attendance**.
2. Select desired date or date range.
3. Click **Export Payroll** and choose:
   - **Keka Format (.csv)**: Code, Date, First In, Last Out, Total Hours, Shift Code.
   - **greytHR Swipes (.csv)**: Emp_No, Swipe_Date, Swipe_Time, Direction, Door_Name.
   - **Tally / Darwinbox (.csv)**: EmpId, AttendanceDate, PresentStatus, PayableHours, OvertimeMinutes.
   - **Govt Form D Muster Roll (.csv)**: Official Indian statutory register format with serial number, employee designation, shift timings, overtime, and compliance status.

---

## 3. Verified Codebase Artifacts

| Module | Repository | Key Files |
| :--- | :--- | :--- |
| **Web Admin** | `mana-community-app` | `src/app/components/access/FaceAttendanceKiosk.tsx`<br>`src/app/components/hrm/ContractorWorkforceManagement.tsx`<br>`src/app/components/hrm/AiTimeGuardDashboard.tsx`<br>`src/app/components/hrm/AttendanceManagement.tsx` |
| **Mobile App** | `mana-community-mobile` | `app/access/kiosk.tsx`<br>`app/hrm/punch.tsx`<br>`app/guard/contractor-crew.tsx`<br>`services/biometricAccessService.ts` |
| **Backend** | `mana-community-service` | `db/migration/V516__cwms_and_timeguard_truein_parity.sql`<br>`BiometricTurnstileController.java`<br>`HrContractorController.java`<br>`HrTimeGuardController.java`<br>`TimeGuardEvaluatorService.java` |
| **Vision Service** | `mana-community-vision-service` | `app/core/face_engine.py`<br>`app/schemas/turnstile_schema.py`<br>`app/api/turnstile_router.py`<br>`tests/test_api_endpoints.py` |
| **Hardware Bridge** | `mana-community-service` | `scripts/turnstile-hardware-bridge/turnstile_edge_bridge.py`<br>`scripts/turnstile-hardware-bridge/README.md` |
