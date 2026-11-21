/**
 * Mana Community - n8n Sports Workflows Runner
 * Executes and validates all 7 sports AI workflows against local/remote n8n instance.
 *
 * Usage:
 *   node automation/scripts/run-sports-workflows.js
 *   N8N_URL=http://localhost:5678 node automation/scripts/run-sports-workflows.js
 */

const http = require('http');
const https = require('https');

const BASE_URL = process.env.N8N_URL || 'http://localhost:5678';
const parsedUrl = new URL(BASE_URL);
const isHttps = parsedUrl.protocol === 'https:';
const client = isHttps ? https : http;

const workflows = [
  {
    id: 1,
    name: 'Sports Registration AI Screener',
    endpoint: '/webhook/sports-registration-screener',
    payload: {
      registrationId: 'REG-CRIC-2026-042',
      playerName: 'Rohan Deshmukh',
      flatNumber: 'Tower B-604',
      sport: 'Cricket',
      category: 'Open Men',
      age: 26,
      dateOfBirth: '2000-03-14',
      gender: 'MALE',
      rules: 'Must be verified resident flat owner or registered tenant, aged 18+'
    }
  },
  {
    id: 2,
    name: 'Sports Tournament AI Fixture Scheduler',
    endpoint: '/webhook/sports-fixture-scheduler',
    payload: {
      tournamentName: 'Mana Society Cricket Cup 2026',
      sport: 'CRICKET',
      format: 'KNOCKOUT',
      teams: ['Tower A Titans', 'Tower B Strikers', 'Tower C Warriors', 'Villas Knights'],
      venues: ['Main Turf Cricket Ground', 'Clubhouse Pitch'],
      startDate: '2026-11-08',
      timeSlots: ['07:30 AM', '10:00 AM', '03:30 PM', '06:00 PM']
    }
  },
  {
    id: 3,
    name: 'Sports Match AI Recap & Badge Awards',
    endpoint: '/webhook/sports-match-recap',
    payload: {
      matchId: 104,
      sport: 'CRICKET',
      tournamentName: 'Mana Society Cricket Cup 2026',
      teamA: 'Tower A Titans',
      teamB: 'Tower B Strikers',
      result: 'Tower A Titans won by 4 runs on the final ball',
      scoreSummary: {
        titans: '148/5 in 12 overs',
        strikers: '144/7 in 12 overs'
      },
      topPerformers: [
        { playerName: 'Karan Mehra', team: 'Titans', stat: '54 runs off 28 balls, 2 wickets' },
        { playerName: 'Siddharth Rao', team: 'Strikers', stat: '42 runs off 19 balls' }
      ]
    }
  },
  {
    id: 4,
    name: 'Sports Dispute Resolution & Moderation',
    endpoint: '/webhook/sports-dispute-and-moderation',
    payload: {
      type: 'DISPUTE',
      matchId: 105,
      tournamentName: 'Mana Society Badminton Championship',
      parties: 'Team C Warriors vs Villas Knights',
      incidentDescription: 'Villas Knights captain did not report on court until 25 minutes after scheduled match time due to traffic. Team C claimed an automatic walkover under rule 4. Villas requested a rescheduled match.'
    }
  },
  {
    id: 5,
    name: 'Sports Auction Integrity & Anti-Collusion Auditor',
    endpoint: '/webhook/sports-auction-integrity-auditor',
    payload: {
      auctionId: 'MPL-2026-AUC',
      tournamentName: 'Mana Premier League Cricket Auction',
      totalBudget: 100000,
      minSquadSize: 11,
      maxSquadSize: 15,
      teams: [
        { teamName: 'Titans', remainingPurse: 14000, rosterCount: 10, totalSpent: 86000 },
        { teamName: 'Strikers', remainingPurse: 45000, rosterCount: 8, totalSpent: 55000 },
        { teamName: 'Warriors', remainingPurse: 8000, rosterCount: 9, totalSpent: 92000 },
        { teamName: 'Knights', remainingPurse: 32000, rosterCount: 11, totalSpent: 68000 }
      ],
      bidHistory: [
        { player: 'Vikram Sethi', winningTeam: 'Warriors', amount: 38000, basePrice: 5000 },
        { player: 'Anil Kumar', winningTeam: 'Titans', amount: 32000, basePrice: 5000 }
      ]
    }
  },
  {
    id: 6,
    name: 'Sports Weather Delay & Emergency Contingency Rescheduler',
    endpoint: '/webhook/sports-contingency-rescheduler',
    payload: {
      tournamentName: 'Mana Weekend Football Derby',
      disruptionReason: 'Torrential downpour with waterlogging on pitch 1',
      remainingMatches: [
        { matchId: 'SF-1', teamA: 'Eagles', teamB: 'Falcons', originalTime: '04:00 PM' },
        { matchId: 'SF-2', teamA: 'Hawks', teamB: 'Panthers', originalTime: '05:30 PM' },
        { matchId: 'FINAL', teamA: 'TBD', teamB: 'TBD', originalTime: '07:30 PM' }
      ],
      availableVenues: ['Covered Turf Arena 1', 'Main Multi-Purpose Indoor Court'],
      availableHours: 3.5,
      reserveDayAvailable: true,
      curfewTime: '22:00'
    }
  },
  {
    id: 7,
    name: 'Sports Match Scoring Anomaly & Anti-Tampering Detector',
    endpoint: '/webhook/sports-scoring-anomaly-detector',
    payload: {
      matchId: 202,
      sport: 'CRICKET',
      tournamentName: 'Mana Community T10 League',
      teamA: 'Eagles',
      teamB: 'Hawks',
      maxOvers: 10,
      maxOversPerBowler: 2,
      currentScore: { runs: 88, wickets: 3, overs: '7.4' },
      ballLog: [
        { over: 7, ball: 1, bowler: 'Kunal', batsman: 'Rajesh', outcome: '1 run' },
        { over: 7, ball: 2, bowler: 'Kunal', batsman: 'Varun', outcome: 'SIX' },
        { over: 7, ball: 3, bowler: 'Kunal', batsman: 'Varun', outcome: '0' },
        { over: 7, ball: 4, bowler: 'Kunal', batsman: 'Varun', outcome: 'WICKET' }
      ]
    }
  }
];

function triggerWebhook(wf) {
  return new Promise((resolve) => {
    const postData = JSON.stringify(wf.payload);
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (isHttps ? 443 : 80),
      path: wf.endpoint,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      },
      timeout: 35000
    };

    const startTime = Date.now();
    const req = client.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        const duration = Date.now() - startTime;
        let parsed = null;
        try {
          parsed = JSON.parse(data);
        } catch {
          parsed = data;
        }
        resolve({
          id: wf.id,
          name: wf.name,
          endpoint: wf.endpoint,
          statusCode: res.statusCode,
          durationMs: duration,
          success: res.statusCode >= 200 && res.statusCode < 300,
          response: parsed
        });
      });
    });

    req.on('error', (err) => {
      resolve({
        id: wf.id,
        name: wf.name,
        endpoint: wf.endpoint,
        statusCode: 0,
        durationMs: Date.now() - startTime,
        success: false,
        error: err.message
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        id: wf.id,
        name: wf.name,
        endpoint: wf.endpoint,
        statusCode: 408,
        durationMs: Date.now() - startTime,
        success: false,
        error: 'Timeout after 35s'
      });
    });

    req.write(postData);
    req.end();
  });
}

async function checkHealth() {
  return new Promise((resolve) => {
    const req = client.get(BASE_URL + '/healthz', { timeout: 3000 }, (res) => {
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => { req.destroy(); resolve(false); });
  });
}

async function main() {
  console.log('\n' + '='.repeat(75));
  console.log('🏆 MANA COMMUNITY - N8N SPORTS WORKFLOWS RUNNER');
  console.log('   Target n8n instance:', BASE_URL);
  console.log('='.repeat(75));

  const isHealthy = await checkHealth();
  if (!isHealthy) {
    console.error('\n⚠️  Warning: Cannot reach n8n at ' + BASE_URL + '/healthz');
    console.error('   Please ensure n8n is running (e.g. "npx n8n" or "docker compose up -d").\n');
  } else {
    console.log('✅ n8n server is healthy and responding.\n');
  }

  const results = [];
  for (const wf of workflows) {
    process.stdout.write(`[${wf.id}/7] Triggering ${wf.name}... `);
    const res = await triggerWebhook(wf);
    results.push(res);
    if (res.success) {
      console.log(`✅ ${res.statusCode} OK (${res.durationMs}ms)`);
    } else {
      console.log(`❌ FAILED (${res.statusCode || 'NO_CONN'} - ${res.error || 'Server error'})`);
    }
  }

  console.log('\n' + '-'.repeat(75));
  console.log('SUMMARY TABLE:');
  console.log('-'.repeat(75));
  console.table(results.map(r => ({
    '#': r.id,
    'Workflow': r.name,
    'Status': r.statusCode,
    'Duration': `${r.durationMs}ms`,
    'Result': r.success ? 'PASSED (AI Output)' : 'FAILED'
  })));

  const passedCount = results.filter(r => r.success).length;
  console.log(`\nCompleted: ${passedCount} of ${workflows.length} workflows passed.\n`);
}

main();
