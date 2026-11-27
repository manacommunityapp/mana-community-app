# PowerShell Script: Trigger All 7 Mana Sports Workflows on n8n
param(
    [string]$BaseUrl = "http://localhost:5678"
)

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "🏆 Triggering Mana Sports Workflows on: $BaseUrl" -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan

$workflows = @(
    @{
        Name = "1. Sports Registration AI Screener"
        Endpoint = "$BaseUrl/webhook/sports-registration-screener"
        Body = @{
            registrationId = "REG-CRIC-2026-042"
            playerName = "Rohan Deshmukh"
            flatNumber = "Tower B-604"
            sport = "Cricket"
            category = "Open Men"
            age = 26
            dateOfBirth = "2000-03-14"
            gender = "MALE"
            rules = "Must be verified resident flat owner or registered tenant, aged 18+"
        }
    },
    @{
        Name = "2. Sports Tournament AI Fixture Scheduler"
        Endpoint = "$BaseUrl/webhook/sports-fixture-scheduler"
        Body = @{
            tournamentName = "Mana Society Cricket Cup 2026"
            sport = "CRICKET"
            format = "KNOCKOUT"
            teams = @("Tower A Titans", "Tower B Strikers", "Tower C Warriors", "Villas Knights")
            venues = @("Main Turf Cricket Ground", "Clubhouse Pitch")
            startDate = "2026-11-08"
            timeSlots = @("07:30 AM", "10:00 AM", "03:30 PM", "06:00 PM")
        }
    },
    @{
        Name = "3. Sports Match AI Recap & Badge Awards"
        Endpoint = "$BaseUrl/webhook/sports-match-recap"
        Body = @{
            matchId = 104
            sport = "CRICKET"
            tournamentName = "Mana Society Cricket Cup 2026"
            teamA = "Tower A Titans"
            teamB = "Tower B Strikers"
            result = "Tower A Titans won by 4 runs on the final ball"
            scoreSummary = @{ titans = "148/5 in 12 overs"; strikers = "144/7 in 12 overs" }
            topPerformers = @(
                @{ playerName = "Karan Mehra"; team = "Titans"; stat = "54 runs off 28 balls, 2 wickets" }
            )
        }
    },
    @{
        Name = "4. Sports Dispute Resolution & Moderation"
        Endpoint = "$BaseUrl/webhook/sports-dispute-and-moderation"
        Body = @{
            type = "DISPUTE"
            matchId = 105
            tournamentName = "Mana Society Badminton Championship"
            parties = "Team C Warriors vs Villas Knights"
            incidentDescription = "Villas Knights arrived 25 minutes after match start due to traffic. Team C claimed automatic walkover."
        }
    },
    @{
        Name = "5. Sports Auction Integrity & Anti-Collusion Auditor"
        Endpoint = "$BaseUrl/webhook/sports-auction-integrity-auditor"
        Body = @{
            auctionId = "MPL-2026-AUC"
            tournamentName = "Mana Premier League Cricket Auction"
            totalBudget = 100000
            minSquadSize = 11
            maxSquadSize = 15
            teams = @(
                @{ teamName = "Titans"; remainingPurse = 14000; rosterCount = 10; totalSpent = 86000 },
                @{ teamName = "Warriors"; remainingPurse = 8000; rosterCount = 9; totalSpent = 92000 }
            )
            bidHistory = @(
                @{ player = "Vikram Sethi"; winningTeam = "Warriors"; amount = 38000; basePrice = 5000 }
            )
        }
    },
    @{
        Name = "6. Sports Weather Delay & Emergency Contingency Rescheduler"
        Endpoint = "$BaseUrl/webhook/sports-contingency-rescheduler"
        Body = @{
            tournamentName = "Mana Weekend Football Derby"
            disruptionReason = "Torrential downpour with waterlogging on pitch 1"
            remainingMatches = @(
                @{ matchId = "SF-1"; teamA = "Eagles"; teamB = "Falcons"; originalTime = "04:00 PM" }
            )
            availableVenues = @("Covered Turf Arena 1", "Main Multi-Purpose Indoor Court")
            availableHours = 3.5
            reserveDayAvailable = $true
            curfewTime = "22:00"
        }
    },
    @{
        Name = "7. Sports Match Scoring Anomaly & Anti-Tampering Detector"
        Endpoint = "$BaseUrl/webhook/sports-scoring-anomaly-detector"
        Body = @{
            matchId = 202
            sport = "CRICKET"
            tournamentName = "Mana Community T10 League"
            teamA = "Eagles"
            teamB = "Hawks"
            maxOvers = 10
            maxOversPerBowler = 2
            currentScore = @{ runs = 88; wickets = 3; overs = "7.4" }
            ballLog = @(
                @{ over = 7; ball = 1; bowler = "Kunal"; batsman = "Rajesh"; outcome = "1 run" },
                @{ over = 7; ball = 2; bowler = "Kunal"; batsman = "Varun"; outcome = "SIX" }
            )
        }
    }
)

foreach ($wf in $workflows) {
    Write-Host "\nTriggering $($wf.Name)..." -ForegroundColor Yellow
    try {
        $json = $wf.Body | ConvertTo-Json -Depth 5
        $res = Invoke-RestMethod -Uri $wf.Endpoint -Method Post -Body $json -ContentType "application/json" -TimeoutSec 35
        Write-Host "✔ SUCCESS: $($res.status)" -ForegroundColor Green
        $res | ConvertTo-Json -Depth 3 | Write-Output
    } catch {
        Write-Host "✖ FAILED: $_" -ForegroundColor Red
    }
}

Write-Host "\n=================================================================" -ForegroundColor Cyan
Write-Host "✅ All 7 sports workflows execution finished!" -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan
