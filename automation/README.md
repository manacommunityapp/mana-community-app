# Mana Community - AI Automation Workflow Engine (Self-Hosted n8n)

This directory contains the self-hosted automation infrastructure for the **Mana Community Application**. It provides zero-cost, event-driven AI workflows powered by **n8n** and free-tier LLMs (Google Gemini 1.5 Flash / Groq / Ollama).

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

## 📦 Pre-Built Workflows Included

The [`workflows/`](file:///d:/Application/applications/mana%20community/mana-community-app/automation/workflows) folder contains ready-to-import workflows:

| Workflow File | Trigger Type | AI Engine | Purpose |
| :--- | :--- | :--- | :--- |
| `ticket-triage.json` | Webhook (`POST /webhook/ticket-triage`) | Gemini 3.5 Flash Lite | Automatically analyzes helpdesk complaints, scores urgency (CRITICAL/HIGH/MED/LOW), selects the department (Plumbing, Electrical, Elevator), and suggests resolution actions. |
| `receipt-ocr-parser.json` | Webhook (`POST /webhook/receipt-parse`) | Gemini Multimodal | Parses uploaded vendor invoices/bills, extracts merchant name, date, invoice total, tax, and auto-categorizes for society treasurers. |
| `community-weekly-digest.json` | Scheduled Cron (Every Sunday 6 PM) | Gemini 3.5 Flash Lite | Reads active announcements, polls, and sports schedules to compose a weekly digest bulletin published to the notice board. |
| `sports-registration-screener.json` | Webhook (`POST /webhook/sports-registration-screener`) | Gemini 3.5 Flash Lite | Audits player registration compliance (DOB, age brackets, gender, KYC) and drafts instant resident WhatsApp confirmation. |
| `sports-fixture-ai-scheduler.json` | Webhook (`POST /webhook/sports-fixture-scheduler`) | Gemini 3.5 Flash Lite | Automatically generates optimal, conflict-free match schedules across available venues and time slots with rest balance. |
| `sports-match-ai-recap.json` | Webhook (`POST /webhook/sports-match-recap`) | Gemini 3.5 Flash Lite | Analyzes concluded cricket/football/badminton scorecards, generates news headlines, dramatic recaps, key turning moments, MVP, badge recommendations, and WhatsApp bulletins. |
| `sports-dispute-and-moderation.json` | Webhook (`POST /webhook/sports-dispute-and-moderation`) | Gemini 3.5 Flash Lite | Arbitrates match disputes (15-min walkovers, rain rules/DLS targets) and screens peer ratings/reviews for toxicity and unsportsmanlike behavior. |
| `sports-auction-integrity-auditor.json` | Webhook (`POST /webhook/sports-auction-integrity-auditor`) | Gemini 3.5 Flash Lite | Audits player auction for collusion, bid rigging, purse deficit/insolvency, and squad size parity violations. |
| `sports-scoring-anomaly-detector.json` | Webhook (`POST /webhook/sports-scoring-anomaly-detector`) | Gemini 3.5 Flash Lite | Real-time integrity audit of live cricket/sports scorecards for impossible states (7+ ball overs, 11+ wickets, bowler quota breaches, score tampering). |
| `sports-contingency-rescheduler.json` | Webhook (`POST /webhook/sports-contingency-rescheduler`) | Gemini 3.5 Flash Lite | Crisis re-scheduler for rainouts, storm delays, or venue curfew; recalculates shortened overs, activates reserve days, and crafts captain alerts. |
| `user-registration-audit-and-onboarding.json` | Webhook (`POST /webhook/user-registration-screener`) | Gemini 3.5 Flash Lite | Audits new resident registration for spam/fraud, address realism, assigns KYC eligibility, compiles personalized role onboarding pack, and drafts resident WhatsApp welcome. |
| `user-login-security-and-anomaly-detector.json` | Webhook (`POST /webhook/user-login-security-audit`) | Gemini 3.5 Flash Lite | Real-time evaluation of user login telemetry for impossible travel, brute-force risk, anomalous devices, enforces step-up OTP, and drafts instant security alerts. |

### How to Import a Workflow into n8n:
1. Open `http://localhost:5678` in your browser.
2. In the top-right corner, click **`...` (More options)** -> **Import from File**.
3. Select any `.json` file from `automation/workflows/`.
4. Click **Activate** (toggle top-right).

---

## 🧪 Testing Webhooks

### 1. Test Helpdesk Ticket Triage
```bash
curl -X POST http://localhost:5678/webhook/ticket-triage \
  -H "Content-Type: application/json" \
  -d '{
    "ticketId": 101,
    "title": "Water leaking from ceiling",
    "description": "Continuous water drip in Tower 3 Basement near EV charging station B4. Water pooling on electric conduits.",
    "category": "Plumbing",
    "location": "Tower 3, Basement 1"
  }'
```

**Expected AI Response:**
```json
{
  "status": "success",
  "ticketId": 101,
  "analysis": {
    "urgency": "CRITICAL",
    "assignedDepartment": "Plumbing",
    "suggestedAction": "Immediately isolate main basement supply valve and inspect ceiling conduits for electrical short-circuit risk.",
    "estimatedResolutionHours": 2,
    "safetyHazard": true
  }
}
```

### 2. Test Receipt Parser (JSON / Base64)
```bash
curl -X POST http://localhost:5678/webhook/receipt-parse \
  -H "Content-Type: application/json" \
  -d '{
    "expenseId": 502,
    "imageUrl": "https://example.com/receipt-sample.jpg"
  }'
```

### 3. Test Sports Match AI Recap & Badge Awards
```bash
curl -X POST http://localhost:5678/webhook/sports-match-recap \
  -H "Content-Type: application/json" \
  -d '{
    "matchId": 204,
    "sport": "CRICKET",
    "tournamentName": "Mana Monsoon Trophy 2026",
    "teamA": "Titans",
    "teamB": "Strikers",
    "result": "Titans won by 3 runs",
    "scoreSummary": {
      "titans": "148/4 in 15 overs",
      "strikers": "145/7 in 15 overs"
    },
    "topPerformers": [
      { "playerName": "Rohan Sharma", "stats": "68 runs (34 balls) and 2 wickets" },
      { "playerName": "Vikram Patel", "stats": "52 runs (29 balls)" }
    ]
  }'
```

### 4. Test User Registration Screener & Onboarding
```bash
curl -X POST http://localhost:5678/webhook/user-registration-screener \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 108,
    "fullName": "Sunil Kumar Reddy K",
    "email": "sunil.reddy@example.com",
    "phone": "+919876543210",
    "communityCode": "MANA-BLR-01",
    "communityName": "Mana Uber Verdant",
    "communityType": "GATED_APARTMENTS",
    "userType": "OWNER",
    "block": "Tower B",
    "flatNo": "402",
    "gender": "MALE",
    "dob": "1990-05-15",
    "interests": ["Cricket", "Badminton", "EV Charging", "Cultural Events"],
    "emergencyContact": { "name": "Kavitha Reddy", "phone": "+919876543211", "relation": "Spouse" },
    "ipAddress": "49.207.214.50",
    "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
  }'
```

**Expected AI Response:**
```json
{
  "status": "success",
  "registrationId": 108,
  "auditedAt": "2026-10-23T00:50:00.000Z",
  "residentName": "Sunil Kumar Reddy K",
  "flatIdentifier": "Tower B-402",
  "communityCode": "MANA-BLR-01",
  "audit": {
    "eligibilityStatus": "APPROVED",
    "confidenceScore": 0.98,
    "riskScore": 4,
    "auditSummary": "Legitimate resident identity with standard residential unit allocation and verified telecom coordinates.",
    "adminChecklist": [
      { "check": "Email & Domain Legitimacy", "status": "PASS", "detail": "Valid personal domain format" },
      { "check": "Phone Number Format & Regional Code", "status": "PASS", "detail": "Valid Indian mobile format" },
      { "check": "Unit & Block Structural Alignment", "status": "PASS", "detail": "Matches Tower B floor plan" },
      { "check": "Residency Role Documentation", "status": "PASS", "detail": "Owner registry pre-cleared" }
    ],
    "onboardingPack": {
      "welcomeTitle": "Welcome home to Mana Uber Verdant!",
      "residentCategory": "OWNER",
      "moveInPassRequired": false,
      "documentsRequested": [],
      "amenityAccessRecommendations": ["Clubhouse Pool", "Badminton Court 1 & 2", "Tower B EV Charging Bay"],
      "recommendedClubs": ["Mana Cricket Club", "Green Living & EV Forum", "Cultural Committee"],
      "societyGuidelines": [
        "Quiet hours: 10:00 PM – 6:00 AM",
        "Segregate wet/dry waste before 8:30 AM doorstep pickup",
        "Visitor gate passes generate instantly from the Mana app"
      ]
    },
    "whatsappWelcomeMessage": "🏡 Welcome Sunil Kumar Reddy K to Mana Uber Verdant! Your owner portal is now live. Reserve badminton slots, manage visitor entry, and pay society dues directly from the Mana Community App.",
    "immediateActionForAdmin": "Auto-approved. Unit linked to Tower B-402."
  }
}
```

### 5. Test User Login Security & Anomaly Detector
```bash
curl -X POST http://localhost:5678/webhook/user-login-security-audit \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 108,
    "identifier": "sunil.reddy@example.com",
    "fullName": "Sunil Kumar Reddy K",
    "flatIdentifier": "Tower B-402",
    "loginTime": "2026-10-23T00:50:00Z",
    "ipAddress": "103.21.124.8",
    "location": { "city": "Bangalore", "country": "IN", "isp": "ACT Fibernet" },
    "device": { "browser": "Chrome", "os": "Windows", "deviceType": "Desktop", "userAgent": "Mozilla/5.0" },
    "isNewDevice": true,
    "failedAttemptsPrior": 0,
    "lastLoginTime": "2026-10-22T18:00:00Z",
    "lastLoginLocation": { "city": "Bangalore", "country": "IN" },
    "loginStatus": "SUCCESS"
  }'
```

**Expected AI Response:**
```json
{
  "status": "success",
  "userId": 108,
  "identifier": "sunil.reddy@example.com",
  "evaluatedAt": "2026-10-23T00:50:01.000Z",
  "security": {
    "riskLevel": "LOW",
    "riskScore": 15,
    "isAnomalous": false,
    "recommendedAction": "ALLOW",
    "threatFactors": ["New browser instance detected on known ISP subnet"],
    "telemetryAudit": {
      "impossibleTravelDetected": false,
      "newDeviceEncountered": true,
      "bruteForceRisk": false,
      "locationDiscrepancy": "Bangalore to Bangalore (0 km/h)"
    },
    "securityAlertMessage": "🔔 New login to your Mana Community account from Chrome (Windows) in Bangalore at 12:50 AM. If this was not you, tap here to lock your account.",
    "contextualGreeting": "Welcome back Sunil Kumar Reddy! 👋 Your society sports registration for LE 2026 Fest is active.",
    "adminAuditNote": "Authorized session with new device fingerprint on residential network."
  }
}
```

---

## 🔌 Connecting Mana React Frontend

Import and use the client helper inside [`src/services/automation/automationService.ts`](file:///d:/Application/applications/mana%20community/mana-community-app/src/services/automation/automationService.ts):

```typescript
import { automationService } from '@/services/automation/automationService';

// 1. Audit and onboard a newly registered resident:
const regAudit = await automationService.auditUserRegistration({
  userId: newUser.id,
  fullName: newUser.fullName,
  email: newUser.email,
  phone: newUser.phone,
  communityCode: newUser.communityCode,
  userType: newUser.userType,
  block: newUser.block,
  flatNo: newUser.flatNo,
  interests: ['Cricket', 'EV Charging'],
});

console.log('Eligibility:', regAudit.audit.eligibilityStatus);
console.log('Onboarding Pack:', regAudit.audit.onboardingPack);

// 2. Security audit during user login:
const loginSecurity = await automationService.auditUserLogin({
  userId: user.id,
  identifier: credentials.identifier,
  fullName: user.fullName,
  ipAddress: '103.21.124.8',
  isNewDevice: true,
  loginStatus: 'SUCCESS',
});

if (loginSecurity.security.recommendedAction === 'REQUIRE_STEP_UP_OTP') {
  // Trigger secondary verification challenge
}
```

---

## 🔒 Production Hardening Checklist

When deploying to a live society server:
- Set `WEBHOOK_URL=https://automation.yourdomain.com/` in `.env`.
- Place n8n behind Nginx reverse proxy with SSL (`certbot`).
- Enable webhook authentication checking using the `MANA_WEBHOOK_SECRET` header.
- For 100% offline environments, run **Ollama** alongside n8n using local open-weight models (`llama3.2`).
