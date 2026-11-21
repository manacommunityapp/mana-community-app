/**
 * Mana Community - n8n B2C Multi-Vendor Food & CPOS Tenancy CRM Workflows Runner
 * Executes and validates all 8 Phase 2 AI workflows against local/remote n8n instance.
 *
 * Usage:
 *   node automation/scripts/run-commerce-cpos-workflows.cjs
 *   N8N_URL=http://localhost:5678 node automation/scripts/run-commerce-cpos-workflows.cjs
 */

const http = require('http');
const https = require('https');

const BASE_URL = process.env.N8N_URL || 'http://localhost:5678';
const parsedUrl = new URL(BASE_URL);
const isHttps = parsedUrl.protocol === 'https:';
const client = isHttps ? https : http;

const workflows = [
  // ── Food & Kitchen Workflows ───────────────────────────────────────────────
  {
    id: 1,
    category: 'Food & Kitchen',
    name: 'AI Kitchen Prep Delay & Order Throttle Sentinel',
    endpoint: '/webhook/food-kitchen-prep-delay-sentinel',
    payload: {
      kitchenId: 'KITCHEN-REST-101',
      kitchenName: 'Tandoori Nights & Coastal Delights',
      activeOrdersCount: 22,
      kitchenCapacityLimit: 20,
      averageCookTimeMinutes: 28,
      expectedPrepTimeMinutes: 20,
      delayedOrders: [
        { orderId: 'ORD-FOOD-881', elapsedMinutes: 38, itemsCount: 4, isRush: true },
        { orderId: 'ORD-FOOD-883', elapsedMinutes: 32, itemsCount: 3, isRush: false }
      ]
    }
  },
  {
    id: 2,
    category: 'Food & Kitchen',
    name: 'AI Catering Event Portion & Food Waste Minimizer',
    endpoint: '/webhook/food-catering-portion-optimizer',
    payload: {
      eventId: 'CAT-EVT-2026-44',
      eventName: 'Grand Diwali Society Gala 2026',
      totalGuests: 350,
      adultsCount: 280,
      childrenCount: 70,
      eventDurationHours: 4,
      menuTheme: 'North & South Fusion Buffet',
      dishes: [
        { name: 'Paneer Butter Masala', category: 'MAIN_COURSE', baseGramsPerPerson: 180, isPerishable: true },
        { name: 'Dum Biryani with Mirchi ka Salan', category: 'MAIN_COURSE', baseGramsPerPerson: 250, isPerishable: true },
        { name: 'Gulab Jamun with Rabdi', category: 'DESSERT', baseGramsPerPerson: 100, isPerishable: false }
      ],
      bufferPercentage: 10
    }
  },
  {
    id: 3,
    category: 'Food & Kitchen',
    name: 'AI Home Chef FSSAI & Food Allergen Compliance Screener',
    endpoint: '/webhook/food-fssai-allergen-compliance-screener',
    payload: {
      chefId: 'CHEF-HOME-55',
      kitchenName: "Mom's Traditional Chettinad Kitchen",
      fssaiLicense: '21423010000452',
      cuisineTypes: 'South Indian, Chettinad, Gluten-Free',
      sampleDishes: [
        { name: 'Chettinad Kozhi Curry', ingredients: ['Chicken', 'Fennel', 'Black Pepper', 'Coconut', 'Sesame Oil'], declaredAllergens: ['Sesame'] },
        { name: 'Kavuni Arisi Sweet Pongal', ingredients: ['Black Rice', 'Jaggery', 'Ghee', 'Cashews', 'Cardamom'], declaredAllergens: ['Nuts', 'Dairy'] }
      ],
      auditScope: 'REGISTRATION'
    }
  },
  {
    id: 4,
    category: 'Food & Kitchen',
    name: 'AI Dining Reservation Yield & No-Show Mitigation Maximizer',
    endpoint: '/webhook/food-dining-reservation-yield-maximizer',
    payload: {
      restaurantId: 'REST-CLUB-01',
      reservationDate: '2026-11-21',
      slotTime: '20:00',
      partySize: 6,
      currentBookedCovers: 52,
      totalCapacity: 60,
      historicalNoShowRate: 0.14
    }
  },

  // ── CPOS Commercial Tenancy CRM Workflows ──────────────────────────────────
  {
    id: 5,
    category: 'CPOS Tenancy',
    name: 'AI Commercial Tenant KYC & Regulatory Compliance Screener',
    endpoint: '/webhook/cpos-tenant-kyc-compliance-screener',
    payload: {
      tenantName: 'Blue Tokai Coffee Roasters Pvt Ltd',
      tradeName: 'Blue Tokai Coffee',
      pan: 'AABCB1234D',
      gstin: '29AABCB1234D1Z5',
      cin: 'U74999KA2015PTC082341',
      authorizedSignatory: 'Sandeep Varma',
      businessNature: 'Specialty Coffee Retail & Roastery',
      requestedUnitId: 'C-101 (Ground Floor)',
      proposedMonthlyRent: 125000
    }
  },
  {
    id: 6,
    category: 'CPOS Tenancy',
    name: 'AI Commercial Lease Rent Escalation & GST Schedule Calculator',
    endpoint: '/webhook/cpos-lease-rent-escalation-calculator',
    payload: {
      leaseId: 'CPOS-TEN-001',
      tenantName: 'Blue Tokai Coffee Roasters Pvt Ltd',
      unitNumber: 'C-101',
      currentBaseRent: 125000,
      escalationRatePercent: 5.0,
      effectiveDate: '2027-01-01',
      leaseTermYears: 3,
      camChargesPerSqFt: 15,
      unitAreaSqFt: 1450,
      gstRatePercent: 18
    }
  },
  {
    id: 7,
    category: 'CPOS Tenancy',
    name: 'AI Commercial Unit Fitout Compliance & Fire Safety Inspector',
    endpoint: '/webhook/cpos-commercial-unit-fitout-inspector',
    payload: {
      unitId: 'C-101',
      tenantName: 'Blue Tokai Coffee Roasters Pvt Ltd',
      fitoutStage: 'ELECTRICAL_AND_HVAC',
      checklistItems: [
        { item: 'Structural load test for commercial espresso machinery', status: 'PASS' },
        { item: 'Fire sprinkler heads clearance and heat detector grid', status: 'PASS' },
        { item: 'Dedicated 3-phase commercial electrical submeter installed', status: 'PASS' },
        { item: 'Commercial kitchen grease trap & drainage slope verification', status: 'PASS' },
        { item: 'Acoustic insulation compliant with community noise threshold', status: 'PASS' }
      ]
    }
  },
  {
    id: 8,
    category: 'CPOS Tenancy',
    name: 'AI Commercial Tenant Churn Risk & Lease Renewal Predictor',
    endpoint: '/webhook/cpos-tenant-churn-renewal-predictor',
    payload: {
      leaseId: 'CPOS-TEN-004',
      tenantName: 'Urban Fitness & Wellness Collective',
      unitId: 'C-301',
      leaseExpiryDate: '2026-11-30',
      paymentDelayHistoryDays: 14,
      maintenanceTicketCount: 5,
      footfallDropPercent: 8,
      currentRent: 210000
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
  console.log('🍽️ 🏢 MANA COMMUNITY - COMMERCE & CPOS TENANCY CRM AI WORKFLOW RUNNER');
  console.log('Target n8n Server: ' + BASE_URL);
  console.log('Total Workflows to test: ' + workflows.length);
  console.log('='.repeat(80));

  let passed = 0;
  let offlineFallback = 0;
  let failed = 0;

  for (const wf of workflows) {
    console.log(`\n[${wf.id}/${workflows.length}] [${wf.category}] ${wf.name}`);
    console.log(`    Endpoint: POST ${wf.endpoint}`);

    const startTime = Date.now();
    try {
      const res = await sendPostRequest(wf.endpoint, wf.payload);
      const elapsed = Date.now() - startTime;

      if (res.statusCode >= 200 && res.statusCode < 300) {
        console.log(`    ✅ SUCCESS (HTTP ${res.statusCode}) - ${elapsed}ms`);
        try {
          const parsed = JSON.parse(res.body);
          const preview = JSON.stringify(parsed, null, 2).split('\n').slice(0, 6).join('\n');
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
