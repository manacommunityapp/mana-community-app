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

---

## 🍽️ Multi-Vendor B2C Food & Kitchen AI Workflows (Phase 2)

### 1-Line Execution
```bash
npm run n8n:commerce
```

### 1. Kitchen Prep Delay Sentinel
Monitors kitchen cook queues, calculates live prep delay risks, and recommends order throttling or prep buffer adjustments.
```bash
curl -X POST http://localhost:5678/webhook/food-kitchen-prep-delay-sentinel \
  -H "Content-Type: application/json" \
  -d '{
    "kitchenId": "KITCHEN-REST-101",
    "kitchenName": "Tandoori Nights & Coastal Delights",
    "activeOrdersCount": 22,
    "kitchenCapacityLimit": 20,
    "averageCookTimeMinutes": 28,
    "expectedPrepTimeMinutes": 20,
    "delayedOrders": [
      { "orderId": "ORD-FOOD-881", "elapsedMinutes": 38, "itemsCount": 4, "isRush": true }
    ]
  }'
```

---

### 2. Catering Portion & Food Waste Minimizer
Calculates precise food item portions (kg/liters), dynamic guest headcount buffers, and local charity surplus donation coordination.
```bash
curl -X POST http://localhost:5678/webhook/food-catering-portion-optimizer \
  -H "Content-Type: application/json" \
  -d '{
    "eventId": "CAT-EVT-2026-44",
    "eventName": "Grand Diwali Society Gala 2026",
    "totalGuests": 350,
    "adultsCount": 280,
    "childrenCount": 70,
    "eventDurationHours": 4,
    "menuTheme": "North & South Fusion Buffet",
    "dishes": [
      { "name": "Paneer Butter Masala", "category": "MAIN_COURSE", "baseGramsPerPerson": 180, "isPerishable": true }
    ],
    "bufferPercentage": 10
  }'
```

---

### 3. Home Chef FSSAI & Food Allergen Screener
Audits 14-digit FSSAI licenses, identifies cross-contamination risk, and generates statutory food labeling directives.
```bash
curl -X POST http://localhost:5678/webhook/food-fssai-allergen-compliance-screener \
  -H "Content-Type: application/json" \
  -d '{
    "chefId": "CHEF-HOME-55",
    "kitchenName": "Mom Traditional Chettinad Kitchen",
    "fssaiLicense": "21423010000452",
    "cuisineTypes": "South Indian, Chettinad",
    "sampleDishes": [
      { "name": "Chettinad Kozhi Curry", "ingredients": ["Chicken", "Fennel", "Sesame Oil"], "declaredAllergens": ["Sesame"] }
    ],
    "auditScope": "REGISTRATION"
  }'
```

---

### 4. Dining Reservation Yield & No-Show Guard
Optimizes table allocation yield, turnaround times, and calculates dynamic deposit requirements for peak slots.
```bash
curl -X POST http://localhost:5678/webhook/food-dining-reservation-yield-maximizer \
  -H "Content-Type: application/json" \
  -d '{
    "restaurantId": "REST-CLUB-01",
    "reservationDate": "2026-11-21",
    "slotTime": "20:00",
    "partySize": 6,
    "currentBookedCovers": 52,
    "totalCapacity": 60,
    "historicalNoShowRate": 0.14
  }'
```

---

## 🏢 CPOS Commercial Tenancy CRM AI Workflows (Phase 2)

### 5. Commercial Tenant KYC Screener
Verifies GSTIN, PAN, CIN, authorized signatory records, and calculates corporate security deposit brackets.
```bash
curl -X POST http://localhost:5678/webhook/cpos-tenant-kyc-compliance-screener \
  -H "Content-Type: application/json" \
  -d '{
    "tenantName": "Blue Tokai Coffee Roasters Pvt Ltd",
    "tradeName": "Blue Tokai Coffee",
    "pan": "AABCB1234D",
    "gstin": "29AABCB1234D1Z5",
    "cin": "U74999KA2015PTC082341",
    "authorizedSignatory": "Sandeep Varma",
    "businessNature": "Specialty Coffee Retail & Roastery",
    "requestedUnitId": "C-101",
    "proposedMonthlyRent": 125000
  }'
```

---

### 6. Lease Rent Escalation & GST Calculator
Calculates compound base rent escalation, CAM charges per sq.ft, 18% GST (CGST+SGST), and 3-year multi-year forecast schedules.
```bash
curl -X POST http://localhost:5678/webhook/cpos-lease-rent-escalation-calculator \
  -H "Content-Type: application/json" \
  -d '{
    "leaseId": "CPOS-TEN-001",
    "tenantName": "Blue Tokai Coffee Roasters Pvt Ltd",
    "unitNumber": "C-101",
    "currentBaseRent": 125000,
    "escalationRatePercent": 5.0,
    "effectiveDate": "2027-01-01",
    "leaseTermYears": 3,
    "camChargesPerSqFt": 15,
    "unitAreaSqFt": 1450,
    "gstRatePercent": 18
  }'
```

---

### 7. Commercial Unit Fitout Compliance Inspector
Validates structural load tolerances, dedicated 3-phase electrical submeters, kitchen grease trap plumbing, and fire safety sprinkler clearances.
```bash
curl -X POST http://localhost:5678/webhook/cpos-commercial-unit-fitout-inspector \
  -H "Content-Type: application/json" \
  -d '{
    "unitId": "C-101",
    "tenantName": "Blue Tokai Coffee Roasters Pvt Ltd",
    "fitoutStage": "ELECTRICAL_AND_HVAC",
    "checklistItems": [
      { "item": "Structural load test for commercial espresso machinery", "status": "PASS" },
      { "item": "Fire sprinkler heads clearance and heat detector grid", "status": "PASS" }
    ]
  }'
```

---

### 8. Commercial Tenant Churn & Renewal Predictor
Predicts tenant renewal likelihood, vacancy loss exposure, and suggests custom commercial lease retention incentives.
```bash
curl -X POST http://localhost:5678/webhook/cpos-tenant-churn-renewal-predictor \
  -H "Content-Type: application/json" \
  -d '{
    "leaseId": "CPOS-TEN-004",
    "tenantName": "Urban Fitness & Wellness Collective",
    "unitId": "C-301",
    "leaseExpiryDate": "2026-11-30",
    "paymentDelayHistoryDays": 14,
    "maintenanceTicketCount": 5,
    "footfallDropPercent": 8,
    "currentRent": 210000
  }'
```

---

## ⚡ Phase 3: Smart Infrastructure & Personal Fintech AI Workflows

Execute all 8 Smart Infrastructure and Personal Fintech workflows in a single command:

```bash
# Via npm script
npm run n8n:infra

# Or direct via node
node automation/scripts/run-infra-finance-workflows.cjs

# Or against custom remote host
N8N_URL=http://your-server:5678 npm run n8n:infra
```

### 1. AI Generator Fuel Siphon & B-Check Predictive Maintenance
```bash
curl -X POST http://localhost:5678/webhook/infra-generator-fuel-anomaly \
  -H "Content-Type: application/json" \
  -d '{
    "generatorId": "GEN-CUMMINS-500KVA",
    "modelNumber": "Cummins QSK19-G4",
    "currentRuntimeHours": 2450,
    "hoursSinceLastBCheck": 280,
    "expectedLitersPerHour": 48.0,
    "recentSessions": [
      { "runDate": "2026-11-16", "runMinutes": 180, "litersConsumed": 185.0, "averageLoadKw": 340, "startFuelPct": 88, "endFuelPct": 62 }
    ],
    "currentFuelLevelLiters": 480,
    "tankCapacityLiters": 1200
  }'
```

---

### 2. AI Community Water Loss, Borewell & Tanker Quality Sentinel
```bash
curl -X POST http://localhost:5678/webhook/infra-water-leak-sentinel \
  -H "Content-Type: application/json" \
  -d '{
    "societyId": "SOC-MANA-TWR",
    "societyName": "Mana Splendor Heights",
    "dailySupplyKLD": 180.0,
    "dailyMeteredConsumptionKLD": 138.5,
    "borewellYieldLpm": 68.0,
    "borewellBaselineLpm": 110.0,
    "tankerPurchasesThisMonth": [
      { "supplierName": "Sree Venkateswara Water Supply", "tankersCount": 14, "totalCostInr": 28000, "tdsPpm": 740, "ph": 7.9 }
    ],
    "storageTanksLevelPct": 48
  }'
```

---

### 3. AI EV Charging Peak Load Arbitrator & Smart Grid Sentinel
```bash
curl -X POST http://localhost:5678/webhook/infra-ev-charging-load-arbitrator \
  -H "Content-Type: application/json" \
  -d '{
    "gridSanctionedKw": 50.0,
    "currentBaseloadKw": 34.0,
    "solarOutputKw": 7.5,
    "chargers": [
      { "chargerId": "CHG-B1-01", "vehicleModel": "Tata Nexon EV Max", "currentDrawKw": 7.4, "requestedKwh": 22.0, "batteryLevelPct": 35, "priorityScore": 9 }
    ]
  }'
```

---

### 4. AI IoT Submeter Tamper & Line Loss Auditor
```bash
curl -X POST http://localhost:5678/webhook/infra-iot-submeter-tamper-auditor \
  -H "Content-Type: application/json" \
  -d '{
    "meterId": "IOT-MTR-BLK-C-204",
    "meterType": "ELECTRICITY",
    "flatNumber": "C-204",
    "historicalAvgDailyUnits": 14.5,
    "currentCycleReadings": [
      { "date": "2026-11-17", "unitsKwhOrLiters": 4.1, "peakKw": 1.2, "reversePowerDetected": true, "magnetTamperAlert": true }
    ],
    "rssiSignalStrengthDbm": -84
  }'
```

---

### 5. AI Split Debt Minimization & Direct Transfer Engine
```bash
curl -X POST http://localhost:5678/webhook/finance-split-debt-simplifier \
  -H "Content-Type: application/json" \
  -d '{
    "groupId": "GRP-GOA-2026",
    "groupName": "Society Goa Annual Trip",
    "members": [
      { "memberId": "USR-01", "name": "Rahul Sharma" },
      { "memberId": "USR-02", "name": "Ananya Iyer" }
    ],
    "rawTransactions": [
      { "fromMemberId": "USR-02", "toMemberId": "USR-01", "amountInr": 2500, "description": "Resort booking share" }
    ]
  }'
```

---

### 6. AI Household Budget Drift & Cashflow Forecaster
```bash
curl -X POST http://localhost:5678/webhook/finance-household-budget-drift \
  -H "Content-Type: application/json" \
  -d '{
    "householdId": "HH-FLAT-A-402",
    "monthlyIncomeInr": 165000,
    "monthlyBudgetCapInr": 95000,
    "daysElapsedInMonth": 21,
    "totalDaysInMonth": 30,
    "categorySpendings": [
      { "category": "Groceries & Provisions", "budgetedInr": 25000, "actualSpentInr": 27500, "recurringCount": 8 }
    ]
  }'
```

---

### 7. AI Micro-Khata Dues Auditor & Soft Collector
```bash
curl -X POST http://localhost:5678/webhook/finance-micro-khata-dues-auditor \
  -H "Content-Type: application/json" \
  -d '{
    "storeOrResidentId": "RES-BLK-A-101",
    "storeName": "Sharma Household Milk & Vegetable Khata",
    "ledgerEntries": [
      { "debtorName": "Amit Verma", "debtorFlat": "A-402", "outstandingAmountInr": 1850, "daysOverdue": 42, "lastPaymentDate": "2026-10-09" }
    ]
  }'
```

---

### 8. AI Split Bill Receipt Duplicate & Fraud Anomaly Guard
```bash
curl -X POST http://localhost:5678/webhook/finance-split-receipt-duplicate-detector \
  -H "Content-Type: application/json" \
  -d '{
    "candidateBill": {
      "title": "Clubhouse Deep Cleaning Chemicals",
      "amountInr": 4850,
      "date": "2026-11-19",
      "category": "MAINTENANCE",
      "vendorName": "CleanPro Facility Supplies",
      "contributorFlat": "B-302"
    },
    "recentCommunityBills": [
      { "id": "BILL-REC-901", "title": "Deep Cleaning Chemicals Clubhouse", "amountInr": 4850, "date": "2026-11-17", "category": "MAINTENANCE", "vendorName": "CleanPro Facility Supplies", "contributorFlat": "B-302" }
    ]
  }'
```

---

## 🚗 Phase 4: Vehicle Care, Commute, Notices & DPDP Act Privacy Workflows

### ⚡ 1-Line Runner Command:
```bash
npm run n8n:mobility
# or
node automation/scripts/run-mobility-privacy-workflows.cjs
```

---

### 1. AI Car Wash Slot Water Quota & Overdraft Auditor
```bash
curl -X POST http://localhost:5678/webhook/wash-slot-water-auditor \
  -H "Content-Type: application/json" \
  -d '{
    "vendorId": "VND-WASH-CARO-01",
    "vendorName": "Washcaro Doorstep Auto Spa",
    "dailyWaterBudgetLiters": 1200,
    "waterUsedTodayLiters": 1420,
    "slotsCompletedToday": 18,
    "averageLitersPerVehicle": 78.8,
    "greywaterRecyclingActive": true,
    "activeSlots": [
      { "slotId": "SLOT-101", "vehicleType": "SUV", "serviceType": "FOAM_DEEP_CLEAN", "litersLogged": 95 },
      { "slotId": "SLOT-102", "vehicleType": "SEDAN", "serviceType": "ECO_DRY_WASH", "litersLogged": 15 }
    ]
  }'
```

---

### 2. AI Doorstep Wash Mechanic Breakdown & Rescheduling Sentinel
```bash
curl -X POST http://localhost:5678/webhook/wash-breakdown-triage \
  -H "Content-Type: application/json" \
  -d '{
    "technicianId": "TECH-RAMESH-04",
    "technicianName": "Ramesh Kumar",
    "currentLocation": "Basement 2, Tower B",
    "breakdownReason": "High-pressure washer pump motor burned out",
    "affectedSlots": [
      { "slotId": "SLOT-204", "customerFlat": "B-804", "scheduledTime": "10:30 AM", "vehicleModel": "Hyundai Creta" },
      { "slotId": "SLOT-205", "customerFlat": "C-201", "scheduledTime": "11:15 AM", "vehicleModel": "Tata Harrier" }
    ],
    "spareTechniciansAvailable": [
      { "id": "TECH-SURESH-02", "name": "Suresh Nair", "currentBay": "Basement 1, Tower A" }
    ]
  }'
```

---

### 3. AI Monthly Wash Subscription Usage & SLA Discrepancy Reconciler
```bash
curl -X POST http://localhost:5678/webhook/wash-subscription-reconciler \
  -H "Content-Type: application/json" \
  -d '{
    "vendorId": "VND-WASH-CARO-01",
    "billingCycle": "2026-11",
    "totalSubscribers": 142,
    "claimedWashesTotal": 568,
    "residentReportedMisses": 34,
    "waterUsageDiscrepancyLiters": 2400,
    "pendingBillingAmountInr": 178000
  }'
```

---

### 4. AI Commute Carpool Multi-Tower Route & Corridor Optimizer
```bash
curl -X POST http://localhost:5678/webhook/mobility-carpool-route-optimizer \
  -H "Content-Type: application/json" \
  -d '{
    "driverId": "DRV-FLAT-C-702",
    "driverName": "Amitabh Sen",
    "driverFlat": "C-702",
    "originSociety": "Mana Splendor Heights",
    "destinationHub": "Ecospace Business Park, Bellandur",
    "departureTime": "08:45 AM",
    "availableSeats": 3,
    "requestedRiders": [
      { "riderId": "RDR-A-301", "name": "Deepa Rao", "flat": "Tower A - 301", "dropPoint": "Ecospace Gate 2", "flexibilityMinutes": 10 },
      { "riderId": "RDR-B-504", "name": "Kiran George", "flat": "Tower B - 504", "dropPoint": "Ecospace Gate 1", "flexibilityMinutes": 15 },
      { "riderId": "RDR-C-102", "name": "Sameer Joshi", "flat": "Tower C - 102", "dropPoint": "RMZ Ecoworld", "flexibilityMinutes": 5 }
    ]
  }'
```

---

### 5. AI Metro Feeder & Tech Park Shuttle Demand Dispatcher
```bash
curl -X POST http://localhost:5678/webhook/mobility-shuttle-dispatcher \
  -H "Content-Type: application/json" \
  -d '{
    "shuttleId": "SHTL-METRO-01",
    "routeType": "METRO_FEEDER",
    "targetStation": "Silk Board Metro Station",
    "seatingCapacity": 22,
    "bookedSeatsCount": 18,
    "walkInQueueCount": 9,
    "trafficCongestionIndex": "MODERATE",
    "nextScheduledDeparture": "08:30 AM"
  }'
```

---

### 6. AI Society Bylaw Statutory Notice Formatter & Quorum Sentinel
```bash
curl -X POST http://localhost:5678/webhook/notice-statutory-formatter \
  -H "Content-Type: application/json" \
  -d '{
    "draftTitle": "Notice of Extraordinary General Meeting (EGM) on Solar Rooftop Capex",
    "meetingType": "EGM",
    "proposedDate": "2026-12-06",
    "noticeLeadDays": 15,
    "rawContent": "We are calling an urgent EGM to vote on approving Rs 45 Lakhs Capex for 120kW Solar Rooftop Installation across Block A, B, C.",
    "statutoryBylawReference": "Karnataka Societies Registration Act Section 11(2)"
  }'
```

---

### 7. AI Emergency Broadcast Panic Sanitizer & Multi-Channel Dispatcher
```bash
curl -X POST http://localhost:5678/webhook/notice-emergency-sanitizer \
  -H "Content-Type: application/json" \
  -d '{
    "incidentType": "LIFT_TRAP",
    "rawDraft": "Tower B Lift 2 fell to basement and power cut! People are suffocating hurry up send help immediately!!!",
    "reportedLocation": "Tower B Passenger Lift #2",
    "severityLevel": "HIGH",
    "requiresSmsPush": true,
    "requiresWhatsappAudio": true
  }'
```

---

### 8. AI DPDP Act 2023 Consent Audit & Expired Purpose Purge Engine
```bash
curl -X POST http://localhost:5678/webhook/privacy-dpdp-consent-auditor \
  -H "Content-Type: application/json" \
  -d '{
    "societyId": "SOC-MANA-TWR",
    "totalResidentsAudited": 480,
    "activeConsentsCount": 1420,
    "expiringConsentsCount": 24,
    "unconsentedDataCount": 2,
    "minorDataConsentsVerified": true
  }'
```

---

### 9. AI Right to Erasure & CCTV Footage Redaction Auditor
```bash
curl -X POST http://localhost:5678/webhook/privacy-cctv-redaction-auditor \
  -H "Content-Type: application/json" \
  -d '{
    "requestId": "REQ-CCTV-DEL-104",
    "requestType": "RIGHT_TO_ERASURE",
    "applicantFlat": "Tower C - 402",
    "applicantRole": "TENANT",
    "cameraZone": "Basement Parking & Lift Lobby B2",
    "incidentTimestamp": "2026-10-20T14:30:00.000Z",
    "logRetentionAgeDays": 32
  }'
```





---

# Batch 1: Safety & Security Workflows (`npm run n8n:safety`)

### 1. AI Emergency SOS & Dispatch Runbook
```bash
curl -X POST http://localhost:5678/webhook/safety-emergency-sos \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Lift Emergency Alarm Trapped Resident",
    "category": "SOS_PANIC",
    "severity": "CRITICAL",
    "flatNumber": "Tower B Passenger Lift #2",
    "tower": "Tower B",
    "description": "Resident alarm pressed for 20 seconds. Ingress door jammed between B1 and Ground.",
    "reportedByName": "Central Telemetry Sensor"
  }'
```

### 2. AI Visitor Screening & Overstay Sentinel
```bash
curl -X POST http://localhost:5678/webhook/safety-visitor-screening \
  -H "Content-Type: application/json" \
  -d '{
    "visitorName": "Rajesh Verma (Courier)",
    "visitorType": "DELIVERY",
    "flatNumber": "B-604",
    "tower": "Tower B",
    "currentDurationMinutes": 110,
    "maxPermittedMinutes": 45,
    "hostApproved": true
  }'
```

### 3. AI ANPR Barrier & Parking Enforcer
```bash
curl -X POST http://localhost:5678/webhook/safety-anpr-parking \
  -H "Content-Type: application/json" \
  -d '{
    "licensePlate": "KA03NB8841",
    "vehicleType": "FOUR_WHEELER",
    "detectedSlot": "B1-EV-02",
    "assignedSlot": "B2-C104",
    "isBlacklisted": false,
    "priorViolationsCount": 1
  }'
```

### 4. AI Staff KYC & Attendance Guardian
```bash
curl -X POST http://localhost:5678/webhook/safety-staff-kyc \
  -H "Content-Type: application/json" \
  -d '{
    "staffId": "STF-MAID-092",
    "staffName": "Lakshmi Devi",
    "serviceType": "HOUSEKEEPING",
    "kycStatus": "VERIFIED"
  }'
```

### 5. AI IoT Hardware Sentinel & Tamper Diagnostic
```bash
curl -X POST http://localhost:5678/webhook/safety-iot-hardware-sentinel \
  -H "Content-Type: application/json" \
  -d '{
    "deviceId": "DEV-BOOM-GATE1",
    "deviceType": "BOOM_BARRIER",
    "location": "Main Ingress Gate 1",
    "consecutiveMissedHeartbeats": 2,
    "lensTamperDetected": false,
    "rssiSignalDbm": -72
  }'
```

### 6. AI Trust & Privacy Compliance Auditor
```bash
curl -X POST http://localhost:5678/webhook/safety-trust-and-privacy-compliance \
  -H "Content-Type: application/json" \
  -d '{
    "auditPeriod": "CURRENT_MONTH_2026",
    "cctvStreamsCount": 24,
    "unauthorizedCctvAccessAttempts": 0,
    "activeGeofencePatrolTrackingCount": 4,
    "visitorDataRetentionDays": 30,
    "legalRetentionLimitDays": 30
  }'
```

---

# Batch 2: Community Services Workflows (`npm run n8n:services`)

### 1. AI Pet Passport & Vaccination Assistant
```bash
curl -X POST http://localhost:5678/webhook/pet-registry-assistant \
  -H "Content-Type: application/json" \
  -d '{
    "petName": "Bruno",
    "species": "DOG",
    "breed": "Golden Retriever",
    "ownerFlat": "Tower A - 402",
    "ownerName": "Vikram Singh",
    "vaccinationStatus": "UP_TO_DATE"
  }'
```

### 2. AI Lost Pet Emergency Alert Broadcaster
```bash
curl -X POST http://localhost:5678/webhook/lost-pet-community-alert \
  -H "Content-Type: application/json" \
  -d '{
    "petName": "Milo",
    "species": "Cat",
    "breed": "Persian Longhair",
    "colorAndMarkings": "White with ginger ears",
    "lastSeenLocation": "Podium Garden near Tower B",
    "ownerFlat": "Tower B - 604"
  }'
```

### 3. AI IoT Meter Fleet Health Summary
```bash
curl -X POST http://localhost:5678/webhook/iot-meter-health-summary \
  -H "Content-Type: application/json" \
  -d '{
    "communityId": "1",
    "meters": [
      { "meterSerialNumber": "WM-T1-101", "meterType": "WATER", "unitNumber": "T1-101", "blockName": "Tower 1", "status": "ACTIVE", "lastReading": 1240 }
    ]
  }'
```

### 4. AI Group Buying Deal Quality & Tier Pricing Auditor
```bash
curl -X POST http://localhost:5678/webhook/group-buying-deal-audit \
  -H "Content-Type: application/json" \
  -d '{
    "deal": {
      "title": "Ratnagiri Alphonso Mangoes",
      "description": "Direct farm fresh Alphonso box",
      "mrp": 3200,
      "tiers": [{ "minQty": 1, "pricePerUnit": 2600 }, { "minQty": 10, "pricePerUnit": 2200 }]
    }
  }'
```

### 5. AI Community Neighbor Job Referral Matcher
```bash
curl -X POST http://localhost:5678/webhook/referral-match-assistant \
  -H "Content-Type: application/json" \
  -d '{
    "candidateId": "RES-091",
    "skills": ["Golang", "Kubernetes"],
    "targetCompanies": ["Google", "Microsoft"],
    "targetRoles": ["Backend Engineer"]
  }'
```

### 6. AI Society Inventory Stockout Sentinel
```bash
curl -X POST http://localhost:5678/webhook/inventory-dashboard \
  -H "Content-Type: application/json" \
  -d '{
    "societyId": "SOC-MANA-TWR",
    "criticalStockThreshold": 5,
    "categories": ["Water Treatment Chemicals", "Electrical Spares"]
  }'
```

---

# Batch 3: Extended Enterprise Workflows (`npm run n8n:extended`)

### 1. AI Maintenance Dues Aging & Reconciliation
```bash
curl -X POST http://localhost:5678/webhook/maintenance-dues-reconciliation \
  -H "Content-Type: application/json" \
  -d '{
    "invoices": [
      { "invoiceNumber": "INV-2026-001", "totalAmount": 4500, "status": "PAID" },
      { "invoiceNumber": "INV-2026-002", "totalAmount": 4500, "status": "OPEN" }
    ]
  }'
```

### 2. AI Utility Bill & Autopay Spike Review
```bash
curl -X POST http://localhost:5678/webhook/utility-bill-autopay-review \
  -H "Content-Type: application/json" \
  -d '{
    "utilityType": "BESCOM_POWER",
    "consumerNumber": "BES-7789421",
    "billedAmountInr": 3450,
    "dueByDate": "2026-11-28",
    "autopayEnabled": true
  }'
```

### 3. AI Group Health Policy & Claims Assistant
```bash
curl -X POST http://localhost:5678/webhook/claims-assistant \
  -H "Content-Type: application/json" \
  -d '{
    "policyNumber": "GHI-MANA-2026-44",
    "insuredPerson": "Ananya Sharma",
    "hospitalName": "Manipal Hospital Sarjapur",
    "treatmentType": "Emergency Daycare Procedure",
    "estimatedClaimAmountInr": 45000
  }'
```
