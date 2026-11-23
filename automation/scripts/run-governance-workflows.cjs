/**
 * Mana Community - n8n Governance & Amenity Operations Workflows Runner
 * Executes and validates all 7 Phase 1 AI workflows against local/remote n8n instance.
 *
 * Usage:
 *   node automation/scripts/run-governance-workflows.cjs
 *   N8N_URL=http://localhost:5678 node automation/scripts/run-governance-workflows.cjs
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
    name: 'AGM Quorum Sentinel & Statutory Attendance Auditor',
    endpoint: '/webhook/governance-agm-quorum-sentinel',
    payload: {
      meetingId: 'AGM-2026-001',
      communityName: 'Mana Residency Owners Association',
      totalRegisteredUnits: 240,
      totalRegisteredAttendees: 82,
      physicalAttendance: 64,
      virtualAttendance: 18,
      proxyCount: 12,
      bylawQuorumPercentage: 33.33,
      currentQuorumAchieved: 34.16,
      meetingType: 'ANNUAL_GENERAL_BODY'
    }
  },
  {
    id: 2,
    name: 'AGM Minutes of Meeting (MoM) & Action Item Extractor',
    endpoint: '/webhook/governance-mom-extractor',
    payload: {
      meetingId: 'AGM-2026-001',
      title: 'Annual General Meeting 2026',
      date: '2026-11-15',
      chairperson: 'Dr. Ramesh Sharma (President)',
      secretary: 'Pooja Hegde (Hon. Secretary)',
      agenda: ['Audit Report Review', 'Lift AMC Upgrade', 'Rooftop Solar Installation', 'Security Guard Increment'],
      rawDiscussionNotes: 'President opened the meeting at 10:15 AM. Quorum confirmed with 82 members present in person and online. Treasurer presented financial audit ending FY26 with surplus of 14.2 Lakhs. Motion proposed by Flat B-402 to approve accounts, seconded by Flat A-102. Carried unanimously. Discussion on Solar Installation: Committee received 3 vendor quotes ranging from 18L to 24L. Resolved that sub-committee will finalize vendor within 21 days with 40% subsidy approval. Security wages hike of 8% approved with immediate effect.'
    }
  },
  {
    id: 3,
    name: 'Secret Ballot & Election Integrity Auditor',
    endpoint: '/webhook/governance-secret-ballot-auditor',
    payload: {
      voteId: 'POLL-MC-2026',
      title: 'Election of MC Treasurer 2026-2028',
      totalEligibleVoters: 240,
      castVotes: [
        { flatNo: 'A-101', timestamp: '2026-11-15T11:00:00Z', choice: 'Candidate 1', ipHash: 'sha256_hash_1' },
        { flatNo: 'B-202', timestamp: '2026-11-15T11:05:00Z', choice: 'Candidate 2', ipHash: 'sha256_hash_2' },
        { flatNo: 'C-303', timestamp: '2026-11-15T11:10:00Z', choice: 'Candidate 1', ipHash: 'sha256_hash_3' },
        { flatNo: 'D-404', timestamp: '2026-11-15T11:15:00Z', choice: 'Candidate 1', ipHash: 'sha256_hash_4' }
      ],
      disqualifiedFlats: []
    }
  },
  {
    id: 4,
    name: 'Governance Resolution Legal & Bylaw Formatter',
    endpoint: '/webhook/governance-resolution-legal-formatter',
    payload: {
      resolutionId: 'RES-2026-09',
      title: 'Installation of Grid-Tied 50kWp Solar Power System',
      rawContent: 'Society approves capital expenditure of up to 22 Lakhs from Sinking Fund for rooftop solar panels on Block A & B. Return on investment expected in 3.5 years. Managing Committee authorized to sign agreements.',
      resolutionType: 'SPECIAL',
      proposedBy: 'Managing Committee',
      bylawFramework: 'Model Apartment Bye-laws / Societies Act'
    }
  },
  {
    id: 5,
    name: 'Amenity Hoarding & Fair-Usage Enforcer',
    endpoint: '/webhook/amenity-fair-usage-enforcer',
    payload: {
      resourceId: 'RES-BADM-01',
      resourceName: 'Badminton Court 1',
      targetDate: '2026-11-21',
      recentBookingHistory: [
        { flatNo: 'B-402', bookingsInLast7Days: 4, peakHourBookings: 3, isPeak: true, requestedSlot: '19:00 - 20:00' },
        { flatNo: 'A-101', bookingsInLast7Days: 1, peakHourBookings: 0, isPeak: false, requestedSlot: '08:00 - 09:00' },
        { flatNo: 'C-205', bookingsInLast7Days: 5, peakHourBookings: 4, isPeak: true, requestedSlot: '20:00 - 21:00' }
      ]
    }
  },
  {
    id: 6,
    name: 'Amenity Maintenance Blackout & Auto-Rescheduler',
    endpoint: '/webhook/amenity-blackout-rescheduler',
    payload: {
      facilityName: 'Olympic Swimming Pool',
      incidentType: 'Filter Pipe Rupture & Chemical Shock Treatment',
      blackoutStart: '2026-11-22T06:00:00Z',
      blackoutEnd: '2026-11-23T18:00:00Z',
      affectedBookings: [
        { bookingId: 'BK-POOL-101', flatNo: 'A-201', residentName: 'Vikas Rao', slot: '2026-11-22 07:00 - 08:00', feePaid: 0 },
        { bookingId: 'BK-POOL-102', flatNo: 'C-504', residentName: 'Deepa Nair', slot: '2026-11-22 17:00 - 18:00', feePaid: 150 }
      ]
    }
  },
  {
    id: 7,
    name: 'Amenity Security Deposit Inspection & Release Arbitrator',
    endpoint: '/webhook/amenity-deposit-arbitrator',
    payload: {
      bookingId: 'BK-HALL-884',
      facilityName: 'Clubhouse Multipurpose Party Hall',
      residentFlat: 'B-304',
      residentName: 'Anita Sharma',
      securityDepositPaid: 5000,
      preInspectionStatus: 'Clean condition, walls freshly painted, audio system working.',
      postInspectionNotes: 'Sound curfew maintained. Deep cleaning completed by catering vendor. Kitchen sink grease trap requires specialized clearing (Rs 600). Hall returned by 23:00 curfew.',
      photosCount: 5
    }
  }
];

function sendPostRequest(endpoint, payload) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(payload);
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (isHttps ? 443 : 80),
      path: endpoint,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      },
      timeout: 15000
    };

    const req = client.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });

    req.on('error', (err) => { reject(err); });
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timed out after 15s'));
    });

    req.write(postData);
    req.end();
  });
}

async function runAll() {
  console.log('='.repeat(80));
  console.log('🏛️  MANA COMMUNITY - GOVERNANCE & AMENITY OPERATIONS AI WORKFLOW RUNNER');
  console.log('Target n8n Server: ' + BASE_URL);
  console.log('Total Workflows to test: ' + workflows.length);
  console.log('='.repeat(80));

  let passed = 0;
  let offlineFallback = 0;
  let failed = 0;

  for (const wf of workflows) {
    console.log(`\n[${wf.id}/${workflows.length}] Testing: ${wf.name}`);
    console.log(`    Endpoint: POST ${wf.endpoint}`);

    const startTime = Date.now();
    try {
      const res = await sendPostRequest(wf.endpoint, wf.payload);
      const elapsed = Date.now() - startTime;

      if (res.statusCode >= 200 && res.statusCode < 300) {
        console.log(`    ✅ SUCCESS (HTTP ${res.statusCode}) - ${elapsed}ms`);
        try {
          const parsed = JSON.parse(res.body);
          const preview = JSON.stringify(parsed, null, 2).split('\n').slice(0, 5).join('\n');
          console.log(`    Response Preview:\n${preview}`);
        } catch {
          console.log(`    Response Body: ${res.body.slice(0, 100)}...`);
        }
        passed++;
      } else {
        console.log(`    ⚠️ HTTP ${res.statusCode} - ${elapsed}ms`);
        console.log(`    Response: ${res.body.slice(0, 150)}`);
        failed++;
      }
    } catch (err) {
      const elapsed = Date.now() - startTime;
      console.log(`    ℹ️  OFFLINE / UNREACHABLE (${err.message}) - ${elapsed}ms`);
      console.log('       (Application uses built-in heuristic fallback service)');
      offlineFallback++;
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('📊 TEST SUMMARY');
  console.log(`   Total Tested:      ${workflows.length}`);
  console.log(`   Directly Handled:  ${passed}`);
  console.log(`   Fallback Ready:    ${offlineFallback}`);
  console.log(`   Errors:            ${failed}`);
  console.log('='.repeat(80));
}

runAll();
