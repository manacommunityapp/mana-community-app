import React, { useState, useEffect } from 'react';
import {
  Shield, Users, Clock, AlertTriangle, CheckCircle, XCircle, ArrowRight,
  Smartphone, Database, Wifi, WifiOff, Award, Star, TrendingUp, Info,
  ClipboardList, UserCheck, Package, Wrench, Eye, ChevronRight, Zap, Radio
} from 'lucide-react';
import {
  guardOpsService, HandoverDashboard, SyncDashboard, GamificationEvent,
  ShiftHandover, HandoverChecklistItem, DeltaSyncCursor, GuardProfile, SyncProtocolSpec
} from '../../../services/guardops/guardOpsService';

// ═══════════════════ DEMO DATA ═══════════════════

const DEMO_HANDOVER: HandoverDashboard = {
  totalHandoversToday: 2, completedHandovers: 1, pendingHandovers: 1, disputedHandovers: 0,
  totalOpenItems: 4, criticalItems: 2, avgHandoverMinutes: 12,
  totalGuardsOnDuty: 3, lateArrivals: 1, noShows: 0,
  recentHandovers: [
    { id: 1, communityId: 'COMM-001', outgoingGuardId: 1, outgoingGuardName: 'Rajan Kumar', incomingGuardId: 2, incomingGuardName: 'Sunil Verma', gateId: 'GATE-MAIN', gateName: 'Main Gate', handoverInitiatedAt: '2026-11-28T14:00:00', handoverCompletedAt: '2026-11-28T14:12:00', visitorsStillInside: 14, uncollectedPackages: 2, openIncidents: 1, pendingDeliveries: 3, brokenEquipmentCount: 1, openItemsSummary: '14 visitors, 2 packages, 1 incident, 3 deliveries, 1 equipment', outgoingAcknowledged: true, incomingAcknowledged: true, supervisorVerified: true, supervisorName: 'Manoj Tiwari', outgoingBiometricVerified: true, incomingBiometricVerified: true, status: 'COMPLETED', remarks: 'Smooth handover. Boom barrier repair team arriving at 10 PM.' },
    { id: 2, communityId: 'COMM-001', outgoingGuardId: 3, outgoingGuardName: 'Deepak Singh', incomingGuardId: 5, incomingGuardName: 'Anil Yadav', gateId: 'GATE-SIDE', gateName: 'Side Gate', handoverInitiatedAt: '2026-11-28T17:30:00', handoverCompletedAt: '', visitorsStillInside: 3, uncollectedPackages: 0, openIncidents: 0, pendingDeliveries: 1, brokenEquipmentCount: 0, openItemsSummary: '3 visitors, 1 pending delivery', outgoingAcknowledged: true, incomingAcknowledged: false, supervisorVerified: false, supervisorName: '', outgoingBiometricVerified: true, incomingBiometricVerified: false, status: 'INCOMING_REVIEW', remarks: '' },
  ],
  unresolvedItems: [
    { id: 3, handoverId: 1, category: 'OPEN_INCIDENTS', itemDescription: 'Main gate boom barrier motor overheating — manually operated since 3 PM', count: 1, priority: 'CRITICAL', itemStatus: 'OPEN', outgoingConfirmed: true, incomingAcknowledged: true, actionRequired: 'Repair team confirmed for 10 PM arrival.', remarks: '' },
    { id: 4, handoverId: 1, category: 'EQUIPMENT_STATUS', itemDescription: 'CCTV Camera #7 (parking area B) offline since 2 PM', count: 1, priority: 'CRITICAL', itemStatus: 'OPEN', outgoingConfirmed: true, incomingAcknowledged: true, actionRequired: 'IT ticket #4521. Extra patrol every 30 mins.', remarks: '' },
    { id: 2, handoverId: 1, category: 'UNCOLLECTED_PACKAGES', itemDescription: '2 Amazon packages for A-305 and B-102, resident not responding', count: 2, priority: 'MEDIUM', itemStatus: 'CARRIED_OVER', outgoingConfirmed: true, incomingAcknowledged: true, actionRequired: 'Retry at 9 PM', remarks: '' },
    { id: 5, handoverId: 2, category: 'VISITORS_INSIDE', itemDescription: '3 visitors: 2 domestic help, 1 guest in C-401', count: 3, priority: 'MEDIUM', itemStatus: 'OPEN', outgoingConfirmed: true, incomingAcknowledged: false, actionRequired: 'Domestic help exit by 7:30 PM', remarks: '' },
  ],
  topPerformers: [
    { id: 4, communityId: 'COMM-001', guardName: 'Manoj Tiwari', guardCode: 'GRD-004', phone: '', agencyName: 'SafeGuard', photoUrl: '', rank: 'SHIFT_SUPERVISOR', assignedGateId: 'GATE-MAIN', assignedGateName: 'Main Gate', joiningDate: '2022-08-20', biometricRegistered: true, isActive: true, totalShiftsCompleted: 1250, incidentsClosed: 89, gamificationPoints: 6100, performanceTier: 'PLATINUM' },
    { id: 1, communityId: 'COMM-001', guardName: 'Rajan Kumar', guardCode: 'GRD-001', phone: '', agencyName: 'SecureForce', photoUrl: '', rank: 'SENIOR_GUARD', assignedGateId: 'GATE-MAIN', assignedGateName: 'Main Gate', joiningDate: '2023-03-15', biometricRegistered: true, isActive: true, totalShiftsCompleted: 892, incidentsClosed: 47, gamificationPoints: 4250, performanceTier: 'PLATINUM' },
    { id: 2, communityId: 'COMM-001', guardName: 'Sunil Verma', guardCode: 'GRD-002', phone: '', agencyName: 'SecureForce', photoUrl: '', rank: 'GUARD', assignedGateId: 'GATE-MAIN', assignedGateName: 'Main Gate', joiningDate: '2024-01-10', biometricRegistered: true, isActive: true, totalShiftsCompleted: 340, incidentsClosed: 12, gamificationPoints: 1850, performanceTier: 'GOLD' },
  ]
};

const DEMO_SYNC: SyncDashboard = {
  totalDevices: 3, upToDateDevices: 2, staleDevices: 1, errorDevices: 1,
  totalRecordsSynced: 107100, totalTombstonesPurged: 8760, totalBytesTransferred: 4854000,
  avgBloomFilterFpr: 0.011, totalCacheUsedMb: 2184, totalEvictedRecords: 1460,
  cursors: [
    { id: 1, deviceId: 'TABLET-GATE-1', guardId: 'GRD-001', communityId: 'COMM-001', syncEntity: 'RESIDENTS', lastCursor: '2026-11-28T17:45:00:seq-1000', lastSyncAt: '2026-11-28T17:45:00', recordsSynced: 12000, tombstonesPurged: 230, bytesTransferred: 850000, bloomFilterSizeBytes: 15000, bloomFilterFalsePositiveRate: 0.008, totalDeviceStorageMb: 16384, usedCacheMb: 280, evictedRecords: 0, status: 'UP_TO_DATE' },
    { id: 2, deviceId: 'TABLET-GATE-1', guardId: 'GRD-001', communityId: 'COMM-001', syncEntity: 'VEHICLES', lastCursor: '2026-11-28T17:44:00:seq-1100', lastSyncAt: '2026-11-28T17:44:00', recordsSynced: 8000, tombstonesPurged: 180, bytesTransferred: 620000, bloomFilterSizeBytes: 10000, bloomFilterFalsePositiveRate: 0.009, totalDeviceStorageMb: 16384, usedCacheMb: 190, evictedRecords: 0, status: 'UP_TO_DATE' },
    { id: 3, deviceId: 'TABLET-GATE-1', guardId: 'GRD-001', communityId: 'COMM-001', syncEntity: 'DAILY_HELP', lastCursor: '2026-11-28T17:43:00:seq-1200', lastSyncAt: '2026-11-28T17:43:00', recordsSynced: 3000, tombstonesPurged: 450, bytesTransferred: 280000, bloomFilterSizeBytes: 3750, bloomFilterFalsePositiveRate: 0.007, totalDeviceStorageMb: 16384, usedCacheMb: 85, evictedRecords: 0, status: 'UP_TO_DATE' },
    { id: 10, deviceId: 'TABLET-GATE-3', guardId: 'GRD-003', communityId: 'COMM-001', syncEntity: 'DAILY_HELP', lastCursor: '2026-11-28T16:00:00:seq-900', lastSyncAt: '2026-11-28T16:00:00', recordsSynced: 3000, tombstonesPurged: 450, bytesTransferred: 93333, bloomFilterSizeBytes: 3750, bloomFilterFalsePositiveRate: 0.007, totalDeviceStorageMb: 16384, usedCacheMb: 85, evictedRecords: 225, status: 'STALE' },
    { id: 12, deviceId: 'TABLET-GATE-2', guardId: 'GRD-002', communityId: 'COMM-001', syncEntity: 'PACKAGES_PENDING', lastCursor: '2026-11-28T17:00:00:seq-500', lastSyncAt: '2026-11-28T17:00:00', recordsSynced: 120, tombstonesPurged: 800, bytesTransferred: 6000, bloomFilterSizeBytes: 150, bloomFilterFalsePositiveRate: 0.015, totalDeviceStorageMb: 16384, usedCacheMb: 3, evictedRecords: 400, status: 'ERROR' },
  ],
  protocolSpec: {
    endpoint: 'GET /api/guard-ops/sync?entity={type}&since_cursor={cursor}&device_id={id}',
    cursorParam: 'since_cursor (ISO-8601 timestamp + sequence number)',
    tombstoneStrategy: 'Soft-delete with tombstone markers. Tombstones retained 30 days, then purged. Client receives tombstone records with _deleted=true flag.',
    bloomFilterSpec: 'Bloom filter per entity: 10-bit-per-element, 3 hash functions (murmur3). FPR ~0.82%. Client sends Bloom filter of known IDs; server returns only IDs NOT in the filter.',
    cacheEvictionPolicy: 'LRU with priority tiers: Tier 1 (residents, expected visitors) = never evict; Tier 2 (vehicles, daily help) = evict after 7 days inactive; Tier 3 (historical visitors) = evict after 24 hours',
    maxDailyDataBudgetMb: 5, estimatedDailyUsageMb: 3,
    residentCount: 12000, vehicleCount: 8000, dailyHelpCount: 3000,
    compressionAlgorithm: 'gzip — 60-70% compression on JSON payloads',
    conflictResolution: 'Last-write-wins with server timestamp. Conflicts logged for supervisor review.'
  }
};

const DEMO_GAMIFICATION: GamificationEvent[] = [
  { id: 1, guardId: 1, guardName: 'Rajan Kumar', communityId: 'COMM-001', achievementType: 'MONTHLY_ATTENDANCE_100', pointsAwarded: 500, description: '100% attendance for November 2026', earnedAt: '2026-11-27T08:00:00', badgeLevel: 'GOLD_BADGE', badgeName: 'Perfect Month', notified: true },
  { id: 3, guardId: 4, guardName: 'Manoj Tiwari', communityId: 'COMM-001', achievementType: 'EMERGENCY_RESPONSE', pointsAwarded: 200, description: 'Handled gas leak emergency: evacuated 20 residents in 8 minutes', earnedAt: '2026-11-23T10:00:00', badgeLevel: 'DIAMOND_BADGE', badgeName: 'Emergency Hero', notified: true },
  { id: 4, guardId: 2, guardName: 'Sunil Verma', communityId: 'COMM-001', achievementType: 'FAST_VISITOR_PROCESSING', pointsAwarded: 25, description: 'Processed 50 visitors in under 2 minutes avg', earnedAt: '2026-11-26T14:00:00', badgeLevel: 'SILVER_BADGE', badgeName: 'Speed Gate', notified: true },
  { id: 5, guardId: 3, guardName: 'Deepak Singh', communityId: 'COMM-001', achievementType: 'PACKAGE_DELIVERY_STREAK', pointsAwarded: 30, description: 'Zero lost packages for 90 days', earnedAt: '2026-11-25T16:00:00', badgeLevel: 'BRONZE_BADGE', badgeName: 'Package Pro', notified: true },
  { id: 6, guardId: 4, guardName: 'Manoj Tiwari', communityId: 'COMM-001', achievementType: 'TRAINING_COMPLETED', pointsAwarded: 100, description: 'Completed Fire Safety & First Aid certification', earnedAt: '2026-11-18T10:00:00', badgeLevel: 'GOLD_BADGE', badgeName: 'Safety Expert', notified: true },
];

// ═══════════════════ HELPERS ═══════════════════

const statusColor = (s: string) => {
  const m: Record<string, string> = {
    COMPLETED: 'bg-green-100 text-green-800', INCOMING_REVIEW: 'bg-yellow-100 text-yellow-800',
    CHECKLIST_PENDING: 'bg-orange-100 text-orange-800', ACKNOWLEDGED: 'bg-blue-100 text-blue-800',
    DISPUTED: 'bg-red-100 text-red-800', INITIATED: 'bg-gray-100 text-gray-800',
    OPEN: 'bg-red-100 text-red-800', CARRIED_OVER: 'bg-orange-100 text-orange-800',
    RESOLVED: 'bg-green-100 text-green-800',
    UP_TO_DATE: 'bg-green-100 text-green-800', SYNCING: 'bg-blue-100 text-blue-800',
    STALE: 'bg-yellow-100 text-yellow-800', ERROR: 'bg-red-100 text-red-800',
    CRITICAL: 'bg-red-100 text-red-800', HIGH: 'bg-orange-100 text-orange-800',
    MEDIUM: 'bg-yellow-100 text-yellow-800', LOW: 'bg-blue-100 text-blue-800',
    PLATINUM: 'bg-purple-100 text-purple-800', GOLD: 'bg-yellow-100 text-yellow-800',
    SILVER: 'bg-gray-200 text-gray-700', BRONZE: 'bg-orange-100 text-orange-700',
    ON_DUTY: 'bg-green-100 text-green-800', SCHEDULED: 'bg-blue-100 text-blue-800',
    HANDOVER_PENDING: 'bg-yellow-100 text-yellow-800', NO_SHOW: 'bg-red-100 text-red-800',
  };
  return m[s] || 'bg-gray-100 text-gray-800';
};

const badgeIcon = (level: string) => {
  switch (level) {
    case 'DIAMOND_BADGE': return '💎';
    case 'GOLD_BADGE': return '🥇';
    case 'SILVER_BADGE': return '🥈';
    case 'BRONZE_BADGE': return '🥉';
    default: return '⭐';
  }
};

function StatCard({ icon: Icon, label, value, color, sub }: { icon: React.ElementType; label: string; value: string | number; color: string; sub?: string }) {
  const bg: Record<string, string> = { blue: 'bg-blue-50', green: 'bg-green-50', red: 'bg-red-50', yellow: 'bg-yellow-50', purple: 'bg-purple-50', indigo: 'bg-indigo-50', orange: 'bg-orange-50', gray: 'bg-gray-50' };
  const fg: Record<string, string> = { blue: 'text-blue-600', green: 'text-green-600', red: 'text-red-600', yellow: 'text-yellow-600', purple: 'text-purple-600', indigo: 'text-indigo-600', orange: 'text-orange-600', gray: 'text-gray-600' };
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${bg[color]}`}><Icon className={`w-5 h-5 ${fg[color]}`} /></div>
        <div>
          <div className="text-2xl font-bold text-gray-900">{value}</div>
          <div className="text-xs text-gray-500">{label}</div>
          {sub && <div className="text-[10px] text-gray-400 mt-0.5">{sub}</div>}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════ MAIN ═══════════════════

export default function GuardOpsDashboard() {
  const [tab, setTab] = useState<'handover' | 'sync' | 'gamification' | 'architecture'>('handover');
  const [handover, setHandover] = useState<HandoverDashboard>(DEMO_HANDOVER);
  const [sync, setSync] = useState<SyncDashboard>(DEMO_SYNC);
  const [gamification, setGamification] = useState<GamificationEvent[]>(DEMO_GAMIFICATION);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [h, s, g] = await Promise.all([
          guardOpsService.getHandoverDashboard(), guardOpsService.getSyncDashboard(), guardOpsService.getLeaderboard(),
        ]);
        setHandover(h); setSync(s); setGamification(g);
      } catch { /* demo fallback */ }
      finally { setLoading(false); }
    })();
  }, []);

  const tabs = [
    { key: 'handover' as const, label: 'Shift Handover & Roster', icon: ClipboardList },
    { key: 'sync' as const, label: 'Offline Sync & Delta Protocol', icon: Smartphone },
    { key: 'gamification' as const, label: 'Guard Leaderboard', icon: Award },
    { key: 'architecture' as const, label: 'Architecture', icon: Info },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="w-7 h-7 text-emerald-600" />
            Guard Performance & Shift Operations
          </h1>
          <p className="text-sm text-gray-500 mt-1">Shift handover, offline delta-sync, gamification leaderboard</p>
        </div>
        {loading && <span className="text-sm text-gray-400 animate-pulse">Loading live data...</span>}
      </div>

      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 py-3 px-1 border-b-2 text-sm font-medium transition-colors ${
                tab === t.key ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}>
              <t.icon className="w-4 h-4" />{t.label}
            </button>
          ))}
        </nav>
      </div>

      {tab === 'handover' && <HandoverTab data={handover} />}
      {tab === 'sync' && <SyncTab data={sync} />}
      {tab === 'gamification' && <GamificationTab data={gamification} performers={handover.topPerformers} />}
      {tab === 'architecture' && <ArchitectureTab />}
    </div>
  );
}

// ═══════════════════ HANDOVER TAB ═══════════════════

function HandoverTab({ data }: { data: HandoverDashboard }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={ClipboardList} label="Handovers Today" value={data.totalHandoversToday} color="blue" />
        <StatCard icon={CheckCircle} label="Completed" value={data.completedHandovers} color="green" />
        <StatCard icon={Clock} label="Pending" value={data.pendingHandovers} color="yellow" />
        <StatCard icon={AlertTriangle} label="Critical Items" value={data.criticalItems} color="red" />
        <StatCard icon={Users} label="Guards On Duty" value={data.totalGuardsOnDuty} color="indigo" />
        <StatCard icon={Clock} label="Late Arrivals" value={data.lateArrivals} color="orange" />
        <StatCard icon={XCircle} label="No Shows" value={data.noShows} color="red" />
        <StatCard icon={Clock} label="Avg Handover" value={`${data.avgHandoverMinutes}min`} color="purple" />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-blue-500" /> Recent Handovers
          </h3>
        </div>
        <div className="p-4 space-y-4">
          {data.recentHandovers.map(h => (
            <div key={h.id} className="p-4 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-gray-900">{h.gateName}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(h.status)}`}>{h.status.replace(/_/g, ' ')}</span>
                </div>
                <span className="text-xs text-gray-400">{new Date(h.handoverInitiatedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                <UserCheck className="w-4 h-4" />
                <span>{h.outgoingGuardName}</span>
                <ArrowRight className="w-4 h-4 text-gray-400" />
                <span>{h.incomingGuardName}</span>
                {h.supervisorVerified && <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700">Supervisor Verified</span>}
              </div>
              <div className="grid grid-cols-5 gap-2 text-xs">
                <div className="bg-gray-50 rounded p-2 text-center"><Eye className="w-3 h-3 mx-auto mb-1 text-blue-500" /><div className="font-bold">{h.visitorsStillInside}</div><div className="text-gray-500">Visitors</div></div>
                <div className="bg-gray-50 rounded p-2 text-center"><Package className="w-3 h-3 mx-auto mb-1 text-orange-500" /><div className="font-bold">{h.uncollectedPackages}</div><div className="text-gray-500">Packages</div></div>
                <div className="bg-gray-50 rounded p-2 text-center"><AlertTriangle className="w-3 h-3 mx-auto mb-1 text-red-500" /><div className="font-bold">{h.openIncidents}</div><div className="text-gray-500">Incidents</div></div>
                <div className="bg-gray-50 rounded p-2 text-center"><Clock className="w-3 h-3 mx-auto mb-1 text-yellow-500" /><div className="font-bold">{h.pendingDeliveries}</div><div className="text-gray-500">Deliveries</div></div>
                <div className="bg-gray-50 rounded p-2 text-center"><Wrench className="w-3 h-3 mx-auto mb-1 text-gray-500" /><div className="font-bold">{h.brokenEquipmentCount}</div><div className="text-gray-500">Equipment</div></div>
              </div>
              <div className="flex gap-4 mt-3 text-xs">
                <span className={h.outgoingBiometricVerified ? 'text-green-600' : 'text-gray-400'}>{h.outgoingBiometricVerified ? '✓' : '○'} Outgoing biometric</span>
                <span className={h.incomingBiometricVerified ? 'text-green-600' : 'text-gray-400'}>{h.incomingBiometricVerified ? '✓' : '○'} Incoming biometric</span>
              </div>
              {h.remarks && <div className="mt-2 text-xs text-gray-500 italic">{h.remarks}</div>}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" /> Unresolved Handover Items
          </h3>
        </div>
        <div className="p-4 space-y-2">
          {data.unresolvedItems.map(item => (
            <div key={item.id} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100">
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${statusColor(item.priority)}`}>{item.priority}</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-gray-900">{item.itemDescription}</div>
                {item.actionRequired && <div className="text-xs text-blue-600 mt-1 flex items-center gap-1"><ArrowRight className="w-3 h-3" /> {item.actionRequired}</div>}
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                  <span className={`px-1.5 py-0.5 rounded text-xs ${statusColor(item.itemStatus)}`}>{item.itemStatus.replace(/_/g, ' ')}</span>
                  <span>{item.category.replace(/_/g, ' ')}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════ SYNC TAB ═══════════════════

function SyncTab({ data }: { data: SyncDashboard }) {
  const spec = data.protocolSpec;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Smartphone} label="Devices" value={data.totalDevices} color="blue" />
        <StatCard icon={Wifi} label="Up to Date" value={data.upToDateDevices} color="green" />
        <StatCard icon={WifiOff} label="Stale" value={data.staleDevices} color="yellow" />
        <StatCard icon={XCircle} label="Errors" value={data.errorDevices} color="red" />
        <StatCard icon={Database} label="Records Synced" value={(data.totalRecordsSynced / 1000).toFixed(0) + 'K'} color="indigo" />
        <StatCard icon={Zap} label="Daily Data" value={`${spec.estimatedDailyUsageMb}MB / ${spec.maxDailyDataBudgetMb}MB`} color="purple" />
        <StatCard icon={Radio} label="Bloom FPR" value={`${(data.avgBloomFilterFpr * 100).toFixed(2)}%`} color="orange" />
        <StatCard icon={Database} label="Cache Used" value={`${data.totalCacheUsedMb}MB`} color="gray" />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2"><Database className="w-5 h-5 text-indigo-500" /> Device Sync Status</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600"><tr>
              <th className="px-4 py-3 text-left">Device</th><th className="px-4 py-3 text-left">Entity</th>
              <th className="px-4 py-3 text-left">Status</th><th className="px-4 py-3 text-left">Records</th>
              <th className="px-4 py-3 text-left">Tombstones</th><th className="px-4 py-3 text-left">Cache</th>
              <th className="px-4 py-3 text-left">Bloom FPR</th><th className="px-4 py-3 text-left">Last Sync</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-100">
              {data.cursors.map(c => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs">{c.deviceId}</td>
                  <td className="px-4 py-3 text-xs">{c.syncEntity.replace(/_/g, ' ')}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(c.status)}`}>{c.status.replace(/_/g, ' ')}</span></td>
                  <td className="px-4 py-3 text-xs">{c.recordsSynced.toLocaleString()}</td>
                  <td className="px-4 py-3 text-xs">{c.tombstonesPurged}</td>
                  <td className="px-4 py-3 text-xs">{c.usedCacheMb}MB</td>
                  <td className="px-4 py-3 text-xs">{(c.bloomFilterFalsePositiveRate * 100).toFixed(2)}%</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{new Date(c.lastSyncAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2"><Info className="w-5 h-5 text-blue-500" /> Delta Sync Protocol Specification</h3>
        <div className="grid gap-4 md:grid-cols-2">
          {[
            { label: 'Endpoint', value: spec.endpoint },
            { label: 'Cursor Strategy', value: spec.cursorParam },
            { label: 'Tombstone Handling', value: spec.tombstoneStrategy },
            { label: 'Bloom Filter', value: spec.bloomFilterSpec },
            { label: 'Cache Eviction', value: spec.cacheEvictionPolicy },
            { label: 'Compression', value: spec.compressionAlgorithm },
            { label: 'Conflict Resolution', value: spec.conflictResolution },
            { label: 'Data Budget', value: `${spec.residentCount.toLocaleString()} residents + ${spec.vehicleCount.toLocaleString()} vehicles + ${spec.dailyHelpCount.toLocaleString()} daily help → <${spec.maxDailyDataBudgetMb}MB/day` },
          ].map((item, i) => (
            <div key={i} className="bg-gray-50 rounded-lg p-3">
              <div className="text-xs font-semibold text-gray-500 uppercase mb-1">{item.label}</div>
              <div className="text-sm text-gray-700">{item.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════ GAMIFICATION TAB ═══════════════════

function GamificationTab({ data, performers }: { data: GamificationEvent[]; performers: GuardProfile[] }) {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2"><Award className="w-5 h-5 text-yellow-500" /> Performance Leaderboard</h3>
        </div>
        <div className="p-4 space-y-3">
          {performers.map((g, i) => (
            <div key={g.id} className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 hover:border-yellow-200 transition-colors">
              <div className="text-2xl font-bold text-gray-300 w-8 text-center">#{i + 1}</div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900">{g.guardName}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(g.performanceTier)}`}>{g.performanceTier}</span>
                  <span className="text-xs text-gray-500">{g.rank.replace(/_/g, ' ')}</span>
                </div>
                <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                  <span>{g.totalShiftsCompleted} shifts</span>
                  <span>{g.incidentsClosed} incidents closed</span>
                  <span>{g.assignedGateName}</span>
                  <span>{g.agencyName}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-yellow-600">{g.gamificationPoints.toLocaleString()}</div>
                <div className="text-xs text-gray-500">points</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2"><Star className="w-5 h-5 text-indigo-500" /> Recent Achievements</h3>
        </div>
        <div className="p-4 space-y-3">
          {data.map(evt => (
            <div key={evt.id} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100">
              <div className="text-2xl">{badgeIcon(evt.badgeLevel)}</div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">{evt.guardName}</span>
                  {evt.badgeName && <span className="px-2 py-0.5 rounded-full text-xs bg-indigo-100 text-indigo-700">{evt.badgeName}</span>}
                  <span className="text-xs font-bold text-yellow-600">+{evt.pointsAwarded} pts</span>
                </div>
                <div className="text-sm text-gray-600 mt-0.5">{evt.description}</div>
                <div className="text-xs text-gray-400 mt-1">{evt.achievementType.replace(/_/g, ' ')} • {new Date(evt.earnedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════ ARCHITECTURE TAB ═══════════════════

function ArchitectureTab() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2"><ClipboardList className="w-5 h-5 text-blue-500" /> Shift Handover Workflow</h3>
        <div className="bg-gray-50 rounded-lg p-4 font-mono text-xs leading-relaxed">
          <pre className="whitespace-pre-wrap text-gray-700">{`
┌──────────────────┐          ┌──────────────────────────────────────┐
│ Outgoing Guard   │──────────│ HANDOVER INITIATION                  │
│ Shift Ends       │          │                                      │
│ (e.g., 8:00 PM)  │          │ System auto-generates checklist:     │
│                  │          │ ✗ 14 visitors still inside           │
│ Biometric/Selfie │          │ ✗ 2 uncollected packages             │
│ Clock-out        │          │ ✗ 1 broken boom barrier (CRITICAL)   │
└──────────────────┘          │ ✗ 3 pending deliveries               │
                              │ ✗ CCTV #7 offline (CRITICAL)         │
                              └──────────────┬───────────────────────┘
                                             │
                              ┌──────────────▼───────────────────────┐
                              │ OUTGOING GUARD CONFIRMS               │
                              │                                      │
                              │ Must acknowledge each item:           │
                              │ "Yes, boom barrier is manual since 3PM│
                              │  Repair team coming at 10 PM"         │
                              └──────────────┬───────────────────────┘
                                             │
                              ┌──────────────▼───────────────────────┐
                              │ INCOMING GUARD REVIEWS                │
                              │                                      │
                              │ Biometric/Selfie verification         │
                              │ Must acknowledge ALL unresolved items │
                              │ Cannot skip CRITICAL items            │
                              └──────────────┬───────────────────────┘
                                             │
                              ┌──────────────▼───────────────────────┐
                              │ SUPERVISOR VERIFICATION (optional)    │
                              │                                      │
                              │ Supervisor signs off if >5 open items│
                              │ or any CRITICAL equipment issues      │
                              └──────────────┬───────────────────────┘
                                             │
                              ┌──────────────▼───────────────────────┐
                              │ HANDOVER COMPLETED                    │
                              │                                      │
                              │ Gamification: +50 points for clean   │
                              │ handover. Disputed handovers logged  │
                              │ for agency review.                    │
                              └──────────────────────────────────────┘
          `}</pre>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2"><Smartphone className="w-5 h-5 text-indigo-500" /> Delta Sync Protocol with Bloom Filters</h3>
        <div className="bg-gray-50 rounded-lg p-4 font-mono text-xs leading-relaxed">
          <pre className="whitespace-pre-wrap text-gray-700">{`
Guard Tablet (16GB)              Server (12,000 residents + 8,000 vehicles)
━━━━━━━━━━━━━━━━━━              ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Step 1: Build Bloom Filter of known IDs
┌─────────────────────┐
│ Local SQLite cache:  │
│ 12,000 resident IDs  │───────▶ Bloom filter: 15KB
│ 10 bits/element      │         (murmur3 × 3 hashes)
│ FPR: ~0.82%          │         FPR means ~98 false
│                      │         positives per 12,000
└─────────────────────┘

Step 2: Send delta-sync request
GET /sync?entity=RESIDENTS
        &since_cursor=2026-11-28T17:00:00:seq-4521
        &device_id=TABLET-GATE-1
        &bloom_filter=<base64-encoded-15KB>

Step 3: Server-side processing
┌────────────────────────────────────────────────┐
│ 1. Filter records updated since cursor          │
│ 2. For each record ID, check Bloom filter:      │
│    - ID IN filter → client likely has it → SKIP │
│    - ID NOT in filter → client missing → SEND   │
│ 3. Include tombstones (_deleted=true) for        │
│    records deleted since cursor                  │
│ 4. gzip compress response (60-70% savings)       │
│ 5. Return new cursor for next sync               │
└────────────────────────────────────────────────┘

Step 4: Response (< 50KB typical delta)
{ cursor: "2026-11-28T17:45:00:seq-4580",
  records: [3 new, 5 updated, 2 tombstones],
  bytes: 48000 }

Step 5: Client applies delta
┌────────────────────────────────────────────────┐
│ INSERT/UPDATE new records into SQLite            │
│ DELETE records with _deleted=true                │
│ Evict LRU cache entries if storage > threshold   │
│   Tier 1 (residents): never evict                │
│   Tier 2 (vehicles): evict after 7 days inactive│
│   Tier 3 (old visitors): evict after 24 hours   │
└────────────────────────────────────────────────┘

Daily data budget: ~3MB actual / 5MB max
  Residents: ~850KB (230 changes/day)
  Vehicles: ~620KB (180 changes/day)
  Daily Help: ~280KB (450 changes/day — high turnover)
          `}</pre>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2"><Zap className="w-5 h-5 text-yellow-500" /> Design Decisions</h3>
        <div className="grid gap-4 md:grid-cols-2">
          {[
            { title: 'Forced Acknowledgment', desc: 'Incoming guards cannot complete handover without acknowledging every unresolved item, especially CRITICAL ones. This creates accountability — no "I didn\'t know about the broken barrier" after an incident.' },
            { title: 'Biometric + Selfie Dual Verification', desc: 'Clock-in supports biometric (primary) and selfie+GPS (fallback when biometric reader fails). Both produce tamper-evident records. Supervisor override is logged separately for audit.' },
            { title: 'Bloom Filter over Full Sync', desc: 'Full sync of 12K residents = 850KB. With Bloom filter delta, daily sync is ~3MB total across all entities. 10 bits/element with 3 hash functions gives 0.82% false positive rate — meaning ~98 unnecessary record checks per 12K, acceptable for the 60-70% bandwidth savings.' },
            { title: 'Cursor-Based Pagination', desc: 'Cursors use composite keys (timestamp + sequence number) to handle exact-timestamp collisions. Server never skips records, and clients resume from exactly where they left off after network interruption.' },
            { title: 'Tiered Cache Eviction', desc: 'Residents and expected visitors (Tier 1) are never evicted — a guard must always be able to verify a resident. Vehicles and daily help (Tier 2) evict after 7 days inactive. Historical visitor logs (Tier 3) evict after 24 hours. This keeps 16GB tablets under 2GB cache.' },
            { title: 'Gamification Points System', desc: 'Points awarded for measurable actions: on-time clock-in, clean handovers, fast visitor processing, zero-incident shifts. Leaderboard drives healthy competition across 500K+ guards. Badges visible to residents build trust.' },
          ].map((d, i) => (
            <div key={i} className="bg-gray-50 rounded-lg p-4">
              <div className="font-semibold text-gray-900 text-sm mb-1">{d.title}</div>
              <div className="text-xs text-gray-600 leading-relaxed">{d.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
