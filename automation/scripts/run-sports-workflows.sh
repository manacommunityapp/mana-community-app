#!/usr/bin/env bash
# Mana Community - Run All 7 Sports Workflows via cURL
set -e

N8N_BASE_URL="${N8N_URL:-http://localhost:5678}"
echo "================================================================="
echo "🏆 Triggering Mana Sports Workflows on: $N8N_BASE_URL"
echo "================================================================="

echo ""
echo "[1/7] 1. Sports Registration AI Screener..."
curl -s -X POST "$N8N_BASE_URL/webhook/sports-registration-screener" \
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
  }' | jq . || cat

echo ""
echo "[2/7] 2. Sports Tournament AI Fixture Scheduler..."
curl -s -X POST "$N8N_BASE_URL/webhook/sports-fixture-scheduler" \
  -H "Content-Type: application/json" \
  -d '{
    "tournamentName": "Mana Society Cricket Cup 2026",
    "sport": "CRICKET",
    "format": "KNOCKOUT",
    "teams": ["Tower A Titans", "Tower B Strikers", "Tower C Warriors", "Villas Knights"],
    "venues": ["Main Turf Cricket Ground", "Clubhouse Pitch"],
    "startDate": "2026-11-08",
    "timeSlots": ["07:30 AM", "10:00 AM", "03:30 PM", "06:00 PM"]
  }' | jq . || cat

echo ""
echo "[3/7] 3. Sports Match AI Recap & Badge Awards..."
curl -s -X POST "$N8N_BASE_URL/webhook/sports-match-recap" \
  -H "Content-Type: application/json" \
  -d '{
    "matchId": 104,
    "sport": "CRICKET",
    "tournamentName": "Mana Society Cricket Cup 2026",
    "teamA": "Tower A Titans",
    "teamB": "Tower B Strikers",
    "result": "Tower A Titans won by 4 runs on the final ball",
    "scoreSummary": { "titans": "148/5 in 12 overs", "strikers": "144/7 in 12 overs" },
    "topPerformers": [
      { "playerName": "Karan Mehra", "team": "Titans", "stat": "54 runs off 28 balls, 2 wickets" }
    ]
  }' | jq . || cat

echo ""
echo "[4/7] 4. Sports Dispute Resolution & Moderation..."
curl -s -X POST "$N8N_BASE_URL/webhook/sports-dispute-and-moderation" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "DISPUTE",
    "matchId": 105,
    "tournamentName": "Mana Society Badminton Championship",
    "parties": "Team C Warriors vs Villas Knights",
    "incidentDescription": "Villas Knights arrived 25 minutes after match start due to traffic. Team C claimed automatic walkover."
  }' | jq . || cat

echo ""
echo "[5/7] 5. Sports Auction Integrity & Anti-Collusion Auditor..."
curl -s -X POST "$N8N_BASE_URL/webhook/sports-auction-integrity-auditor" \
  -H "Content-Type: application/json" \
  -d '{
    "auctionId": "MPL-2026-AUC",
    "tournamentName": "Mana Premier League Cricket Auction",
    "totalBudget": 100000,
    "minSquadSize": 11,
    "maxSquadSize": 15,
    "teams": [
      { "teamName": "Titans", "remainingPurse": 14000, "rosterCount": 10, "totalSpent": 86000 },
      { "teamName": "Warriors", "remainingPurse": 8000, "rosterCount": 9, "totalSpent": 92000 }
    ],
    "bidHistory": [
      { "player": "Vikram Sethi", "winningTeam": "Warriors", "amount": 38000, "basePrice": 5000 }
    ]
  }' | jq . || cat

echo ""
echo "[6/7] 6. Sports Weather Delay & Emergency Contingency Rescheduler..."
curl -s -X POST "$N8N_BASE_URL/webhook/sports-contingency-rescheduler" \
  -H "Content-Type: application/json" \
  -d '{
    "tournamentName": "Mana Weekend Football Derby",
    "disruptionReason": "Torrential downpour with waterlogging on pitch 1",
    "remainingMatches": [
      { "matchId": "SF-1", "teamA": "Eagles", "teamB": "Falcons", "originalTime": "04:00 PM" }
    ],
    "availableVenues": ["Covered Turf Arena 1", "Main Multi-Purpose Indoor Court"],
    "availableHours": 3.5,
    "reserveDayAvailable": true,
    "curfewTime": "22:00"
  }' | jq . || cat

echo ""
echo "[7/7] 7. Sports Match Scoring Anomaly & Anti-Tampering Detector..."
curl -s -X POST "$N8N_BASE_URL/webhook/sports-scoring-anomaly-detector" \
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
      { "over": 7, "ball": 2, "bowler": "Kunal", "batsman": "Varun", "outcome": "SIX" }
    ]
  }' | jq . || cat

echo ""
echo "================================================================="
echo "✅ All 7 sports workflows triggered successfully!"
echo "================================================================="
