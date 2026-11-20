# 🚀 n8n Sports Workflows Run Commands

This file contains all the execution commands and scripts to run, test, and validate all 7 Mana Sports AI Workflows hosted in n8n.

---

## ⚡ 1-Line Execution Commands

### Option A: Using NPM Script
```bash
npm run n8n:sports
```

### Option B: Using Node.js Runner Script (Platform Independent)
```bash
node automation/scripts/run-sports-workflows.js
```

### Option C: Using PowerShell (Windows)
```powershell
powershell -ExecutionPolicy Bypass -File automation/scripts/run-sports-workflows.ps1
```

### Option D: Using Bash (Linux / macOS / Git Bash)
```bash
bash automation/scripts/run-sports-workflows.sh
```

---

## 📋 Individual cURL Run Commands for Each Sports Workflow

### 1. Sports Registration AI Screener
Audits player registration compliance (DOB, age brackets, gender, KYC) and drafts resident WhatsApp confirmation.
```bash
curl -X POST http://localhost:5678/webhook/sports-registration-screener \
  -H "Content-Type: application/json" \
  -d '{
    "registrationId": "REG-CRIC-2026-042",
    "playerName": "Rohan Deshmukh",
    "flatNumber": "Tower B-604",
    "sport": "Cricket",
    "category": "Open Men",
    "age": 26,
    "dateOfBirth": "2000-03-14",
    "gender": "MALE",
    "rules": "Must be verified resident flat owner or registered tenant, aged 18+"
  }'
```

---

### 2. Sports Tournament AI Fixture Scheduler
Generates optimal, conflict-free match schedules across available venues and time slots with balanced rest.
```bash
curl -X POST http://localhost:5678/webhook/sports-fixture-scheduler \
  -H "Content-Type: application/json" \
  -d '{
    "tournamentName": "Mana Society Cricket Cup 2026",
    "sport": "CRICKET",
    "format": "KNOCKOUT",
    "teams": ["Tower A Titans", "Tower B Strikers", "Tower C Warriors", "Villas Knights"],
    "venues": ["Main Turf Cricket Ground", "Clubhouse Pitch"],
    "startDate": "2026-11-08",
    "timeSlots": ["07:30 AM", "10:00 AM", "03:30 PM", "06:00 PM"]
  }'
```

---

### 3. Sports Match AI Recap & Badge Awards
Analyzes concluded scorecards, generates news headlines, dramatic recaps, MVP, badge awards, and WhatsApp bulletins.
```bash
curl -X POST http://localhost:5678/webhook/sports-match-recap \
  -H "Content-Type: application/json" \
  -d '{
    "matchId": 104,
    "sport": "CRICKET",
    "tournamentName": "Mana Society Cricket Cup 2026",
    "teamA": "Tower A Titans",
    "teamB": "Tower B Strikers",
    "result": "Tower A Titans won by 4 runs on the final ball",
    "scoreSummary": {
      "titans": "148/5 in 12 overs",
      "strikers": "144/7 in 12 overs"
    },
    "topPerformers": [
      { "playerName": "Karan Mehra", "team": "Titans", "stat": "54 runs off 28 balls, 2 wickets" },
      { "playerName": "Siddharth Rao", "team": "Strikers", "stat": "42 runs off 19 balls" }
    ]
  }'
```

---

### 4. Sports Dispute Resolution & Moderation
Arbitrates match disputes (walkovers, rain rules/DLS targets) and screens reviews/content for toxicity and unsportsmanlike behavior.
```bash
curl -X POST http://localhost:5678/webhook/sports-dispute-and-moderation \
  -H "Content-Type: application/json" \
  -d '{
    "type": "DISPUTE",
    "matchId": 105,
    "tournamentName": "Mana Society Badminton Championship",
    "parties": "Team C Warriors vs Villas Knights",
    "incidentDescription": "Villas Knights captain did not report on court until 25 minutes after scheduled match time due to traffic. Team C claimed an automatic walkover under rule 4. Villas requested a rescheduled match."
  }'
```

---

### 5. Sports Auction Integrity & Anti-Collusion Auditor
Audits player auction for collusion, bid rigging, purse deficit/insolvency, and squad size parity violations.
```bash
curl -X POST http://localhost:5678/webhook/sports-auction-integrity-auditor \
  -H "Content-Type: application/json" \
  -d '{
    "auctionId": "MPL-2026-AUC",
    "tournamentName": "Mana Premier League Cricket Auction",
    "totalBudget": 100000,
    "minSquadSize": 11,
    "maxSquadSize": 15,
    "teams": [
      { "teamName": "Titans", "remainingPurse": 14000, "rosterCount": 10, "totalSpent": 86000 },
      { "teamName": "Strikers", "remainingPurse": 45000, "rosterCount": 8, "totalSpent": 55000 },
      { "teamName": "Warriors", "remainingPurse": 8000, "rosterCount": 9, "totalSpent": 92000 },
      { "teamName": "Knights", "remainingPurse": 32000, "rosterCount": 11, "totalSpent": 68000 }
    ],
    "bidHistory": [
      { "player": "Vikram Sethi", "winningTeam": "Warriors", "amount": 38000, "basePrice": 5000 },
      { "player": "Anil Kumar", "winningTeam": "Titans", "amount": 32000, "basePrice": 5000 }
    ]
  }'
```

---

### 6. Sports Weather Delay & Emergency Contingency Rescheduler
Crisis re-scheduler for rainouts or venue curfew; recalculates shortened overs, activates reserve days, and crafts captain alerts.
```bash
curl -X POST http://localhost:5678/webhook/sports-contingency-rescheduler \
  -H "Content-Type: application/json" \
  -d '{
    "tournamentName": "Mana Weekend Football Derby",
    "disruptionReason": "Torrential downpour with waterlogging on pitch 1",
    "remainingMatches": [
      { "matchId": "SF-1", "teamA": "Eagles", "teamB": "Falcons", "originalTime": "04:00 PM" },
      { "matchId": "SF-2", "teamA": "Hawks", "teamB": "Panthers", "originalTime": "05:30 PM" },
      { "matchId": "FINAL", "teamA": "TBD", "teamB": "TBD", "originalTime": "07:30 PM" }
    ],
    "availableVenues": ["Covered Turf Arena 1", "Main Multi-Purpose Indoor Court"],
    "availableHours": 3.5,
    "reserveDayAvailable": true,
    "curfewTime": "22:00"
  }'
```

---

### 7. Sports Match Scoring Anomaly & Anti-Tampering Detector
Real-time integrity audit of live sports scorecards for impossible states (7+ ball overs, 11+ wickets, bowler quota breaches, score tampering).
```bash
curl -X POST http://localhost:5678/webhook/sports-scoring-anomaly-detector \
  -H "Content-Type: application/json" \
  -d '{
    "matchId": 202,
    "sport": "CRICKET",
    "tournamentName": "Mana Community T10 League",
    "teamA": "Eagles",
    "teamB": "Hawks",
    "maxOvers": 10,
    "maxOversPerBowler": 2,
    "currentScore": { "runs": 88, "wickets": 3, "overs": "7.4" },
    "ballLog": [
      { "over": 7, "ball": 1, "bowler": "Kunal", "batsman": "Rajesh", "outcome": "1 run" },
      { "over": 7, ball: 2, bowler: "Kunal", batsman: "Varun", outcome: "SIX" },
      { "over": 7, "ball": 3, "bowler": "Kunal", "batsman": "Varun", "outcome": "0" },
      { "over": 7, "ball": 4, "bowler": "Kunal", "batsman": "Varun", "outcome": "WICKET" }
    ]
  }'
```

---

## 🛠️ n8n Server Management Commands

### Start n8n Server
```bash
# Direct via npx
npx n8n

# Or via global installation
npm install -g n8n
n8n start

# Or via Docker
cd automation && docker compose up -d
```

### Check n8n Health Status
```bash
curl http://localhost:5678/healthz
```

### Access Web Dashboard
Open in your browser:
```
http://localhost:5678/projects/PKd830LayXwyN98T/workflows?search=sports
```

---

## 🏛️ Phase 1: Governance & Amenities Operations AI Workflows

Execute all 7 Governance and Amenity operations workflows in a single command:

```bash
# Via npm script
npm run n8n:governance

# Or direct via node
node automation/scripts/run-governance-workflows.cjs

# Or against custom remote host
N8N_URL=http://your-server:5678 npm run n8n:governance
```

### 1. AGM Quorum Sentinel & Statutory Attendance Auditor
Verifies attendee counts against community registered units and statutory bye-law quorum thresholds.
```bash
curl -X POST http://localhost:5678/webhook/governance-agm-quorum-sentinel \
  -H "Content-Type: application/json" \
  -d '{
    "meetingId": "AGM-2026-001",
    "communityName": "Mana Residency Owners Association",
    "totalRegisteredUnits": 240,
    "totalRegisteredAttendees": 82,
    "physicalAttendance": 64,
    "virtualAttendance": 18,
    "proxyCount": 12,
    "bylawQuorumPercentage": 33.33,
    "currentQuorumAchieved": 34.16,
    "meetingType": "ANNUAL_GENERAL_BODY"
  }'
```

---

### 2. AGM Minutes of Meeting (MoM) & Action Item Extractor
Autonomous structuring of raw meeting discussion notes into formal statutory minutes and assignable action items.
```bash
curl -X POST http://localhost:5678/webhook/governance-mom-extractor \
  -H "Content-Type: application/json" \
  -d '{
    "meetingId": "AGM-2026-001",
    "title": "Annual General Meeting 2026",
    "date": "2026-11-15",
    "chairperson": "Dr. Ramesh Sharma (President)",
    "secretary": "Pooja Hegde (Hon. Secretary)",
    "agenda": ["Audit Report Review", "Lift AMC Upgrade", "Rooftop Solar Installation"],
    "rawDiscussionNotes": "President opened the meeting at 10:15 AM. Quorum confirmed with 82 members present. Accounts approved unanimously. Rooftop solar sub-committee formed to finalize vendor within 21 days."
  }'
```

---

### 3. Secret Ballot & Election Integrity Auditor
Cryptographic and statistical anomaly detector for secret voting sessions, duplicate votes, and disqualified flats.
```bash
curl -X POST http://localhost:5678/webhook/governance-secret-ballot-auditor \
  -H "Content-Type: application/json" \
  -d '{
    "voteId": "POLL-MC-2026",
    "title": "Election of MC Treasurer 2026-2028",
    "totalEligibleVoters": 240,
    "castVotes": [
      { "flatNo": "A-101", "timestamp": "2026-11-15T11:00:00Z", "choice": "Candidate 1", "ipHash": "sha256_1" },
      { "flatNo": "B-202", "timestamp": "2026-11-15T11:05:00Z", "choice": "Candidate 2", "ipHash": "sha256_2" }
    ],
    "disqualifiedFlats": []
  }'
```

---

### 4. Governance Resolution Legal & Bylaw Formatter
Formats raw society proposals into standard statutory resolutions with recitals (WHEREAS), operative clauses, and voting majority thresholds.
```bash
curl -X POST http://localhost:5678/webhook/governance-resolution-legal-formatter \
  -H "Content-Type: application/json" \
  -d '{
    "resolutionId": "RES-2026-09",
    "title": "Installation of Grid-Tied 50kWp Solar Power System",
    "rawContent": "Society approves capex of 22 Lakhs from Sinking Fund for rooftop solar panels on Block A & B. Managing Committee authorized to sign agreements.",
    "resolutionType": "SPECIAL",
    "proposedBy": "Managing Committee",
    "bylawFramework": "Model Apartment Bye-laws / Societies Act"
  }'
```

---

### 5. Amenity Hoarding & Fair-Usage Enforcer
Audits booking frequency across flats to prevent peak-hour slot monopoly and enforce community cooldown policies.
```bash
curl -X POST http://localhost:5678/webhook/amenity-fair-usage-enforcer \
  -H "Content-Type: application/json" \
  -d '{
    "resourceId": "RES-BADM-01",
    "resourceName": "Badminton Court 1",
    "targetDate": "2026-11-21",
    "recentBookingHistory": [
      { "flatNo": "B-402", "bookingsInLast7Days": 4, "peakHourBookings": 3, "isPeak": true, "requestedSlot": "19:00 - 20:00" },
      { "flatNo": "A-101", "bookingsInLast7Days": 1, "peakHourBookings": 0, "isPeak": false, "requestedSlot": "08:00 - 09:00" }
    ]
  }'
```

---

### 6. Amenity Maintenance Blackout & Auto-Rescheduler
Handles unexpected emergency facility shutdowns, generates resident broadcast notices, and calculates automated compensation/slot alternatives.
```bash
curl -X POST http://localhost:5678/webhook/amenity-blackout-rescheduler \
  -H "Content-Type: application/json" \
  -d '{
    "facilityName": "Olympic Swimming Pool",
    "incidentType": "Filter Pipe Rupture & Chemical Shock Treatment",
    "blackoutStart": "2026-11-22T06:00:00Z",
    "blackoutEnd": "2026-11-23T18:00:00Z",
    "affectedBookings": [
      { "bookingId": "BK-POOL-101", "flatNo": "A-201", "residentName": "Vikas Rao", "slot": "2026-11-22 07:00 - 08:00", "feePaid": 0 }
    ]
  }'
```

---

### 7. Amenity Security Deposit Inspection & Release Arbitrator
Inspects post-event facility handover notes, validates sound curfew / damage / cleanliness, and determines itemized deposit deduction settlements.
```bash
curl -X POST http://localhost:5678/webhook/amenity-deposit-arbitrator \
  -H "Content-Type: application/json" \
  -d '{
    "bookingId": "BK-HALL-884",
    "facilityName": "Clubhouse Multipurpose Party Hall",
    "residentFlat": "B-304",
    "residentName": "Anita Sharma",
    "securityDepositPaid": 5000,
    "preInspectionStatus": "Clean condition, walls freshly painted, audio system working.",
    "postInspectionNotes": "Sound curfew maintained. Deep cleaning completed by catering vendor. Kitchen grease trap requires specialized clearing (Rs 600). Hall returned by 23:00 curfew.",
    "photosCount": 5
  }'
```

