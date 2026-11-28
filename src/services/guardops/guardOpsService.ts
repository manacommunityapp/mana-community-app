import axios from 'axios';

const API_BASE = '/api/guard-ops';

export interface GuardProfile {
  id: number; communityId: string; guardName: string; guardCode: string; phone: string;
  agencyName: string; photoUrl: string; rank: string; assignedGateId: string; assignedGateName: string;
  joiningDate: string; biometricRegistered: boolean; isActive: boolean;
  totalShiftsCompleted: number; incidentsClosed: number; gamificationPoints: number; performanceTier: string;
}

export interface ShiftRoster {
  id: number; communityId: string; guardId: number; guardName: string; gateId: string; gateName: string;
  shiftType: string; shiftDate: string; scheduledStart: string; scheduledEnd: string;
  actualClockIn: string; actualClockOut: string; clockInMethod: string; selfieUrl: string;
  biometricVerified: boolean; lateArrival: boolean; lateMinutes: number; status: string;
}

export interface ShiftHandover {
  id: number; communityId: string; outgoingGuardId: number; outgoingGuardName: string;
  incomingGuardId: number; incomingGuardName: string; gateId: string; gateName: string;
  handoverInitiatedAt: string; handoverCompletedAt: string;
  visitorsStillInside: number; uncollectedPackages: number; openIncidents: number;
  pendingDeliveries: number; brokenEquipmentCount: number; openItemsSummary: string;
  outgoingAcknowledged: boolean; incomingAcknowledged: boolean; supervisorVerified: boolean;
  supervisorName: string; outgoingBiometricVerified: boolean; incomingBiometricVerified: boolean;
  status: string; remarks: string;
}

export interface HandoverChecklistItem {
  id: number; handoverId: number; category: string; itemDescription: string; count: number;
  priority: string; itemStatus: string; outgoingConfirmed: boolean; incomingAcknowledged: boolean;
  actionRequired: string; remarks: string;
}

export interface DeltaSyncCursor {
  id: number; deviceId: string; guardId: string; communityId: string; syncEntity: string;
  lastCursor: string; lastSyncAt: string; recordsSynced: number; tombstonesPurged: number;
  bytesTransferred: number; bloomFilterSizeBytes: number; bloomFilterFalsePositiveRate: number;
  totalDeviceStorageMb: number; usedCacheMb: number; evictedRecords: number; status: string;
}

export interface GamificationEvent {
  id: number; guardId: number; guardName: string; communityId: string;
  achievementType: string; pointsAwarded: number; description: string; earnedAt: string;
  badgeLevel: string; badgeName: string; notified: boolean;
}

export interface SyncProtocolSpec {
  endpoint: string; cursorParam: string; tombstoneStrategy: string; bloomFilterSpec: string;
  cacheEvictionPolicy: string; maxDailyDataBudgetMb: number; estimatedDailyUsageMb: number;
  residentCount: number; vehicleCount: number; dailyHelpCount: number;
  compressionAlgorithm: string; conflictResolution: string;
}

export interface HandoverDashboard {
  totalHandoversToday: number; completedHandovers: number; pendingHandovers: number; disputedHandovers: number;
  totalOpenItems: number; criticalItems: number; avgHandoverMinutes: number;
  totalGuardsOnDuty: number; lateArrivals: number; noShows: number;
  recentHandovers: ShiftHandover[]; unresolvedItems: HandoverChecklistItem[]; topPerformers: GuardProfile[];
}

export interface SyncDashboard {
  totalDevices: number; upToDateDevices: number; staleDevices: number; errorDevices: number;
  totalRecordsSynced: number; totalTombstonesPurged: number; totalBytesTransferred: number;
  avgBloomFilterFpr: number; totalCacheUsedMb: number; totalEvictedRecords: number;
  cursors: DeltaSyncCursor[]; protocolSpec: SyncProtocolSpec;
}

export const guardOpsService = {
  getHandoverDashboard: () => axios.get<HandoverDashboard>(`${API_BASE}/handover/dashboard`).then(r => r.data),
  getSyncDashboard: () => axios.get<SyncDashboard>(`${API_BASE}/sync/dashboard`).then(r => r.data),
  getAllGuards: () => axios.get<GuardProfile[]>(`${API_BASE}/guards`).then(r => r.data),
  getLeaderboard: () => axios.get<GamificationEvent[]>(`${API_BASE}/leaderboard`).then(r => r.data),
  initiateHandover: (outId: number, inId: number, gateId: string, gateName: string, visitors: number, pkgs: number, incidents: number, deliveries: number, broken: number) =>
    axios.post(`${API_BASE}/handover/initiate`, null, { params: { outgoingGuardId: outId, incomingGuardId: inId, gateId, gateName, visitors, packages: pkgs, incidents, deliveries, brokenEquipment: broken } }).then(r => r.data),
  acknowledgeHandover: (id: number, guardId: number, isIncoming: boolean) =>
    axios.post(`${API_BASE}/handover/${id}/acknowledge`, null, { params: { guardId, isIncoming } }).then(r => r.data),
  seedDemo: () => axios.post(`${API_BASE}/seed-demo`).then(r => r.data),
};
