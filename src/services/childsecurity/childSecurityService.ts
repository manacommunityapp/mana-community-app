import axios from 'axios';

const API_BASE = '/api/child-security';

export interface ChildProfile {
  id: number;
  communityId: string;
  childName: string;
  dateOfBirth: string;
  age: number;
  flatNumber: string;
  towerName: string;
  photoUrl: string;
  schoolName: string;
  schoolGrade: string;
  busRouteId: number;
  busRouteCode: string;
  exitLockEnabled: boolean;
  busTrackingEnabled: boolean;
  status: 'ACTIVE' | 'INACTIVE' | 'GRADUATED';
}

export interface GuardianAuthorization {
  id: number;
  childId: number;
  communityId: string;
  guardianName: string;
  guardianPhone: string;
  guardianEmail: string;
  relationship: string;
  role: 'PRIMARY_PARENT' | 'SECONDARY_PARENT' | 'GRANDPARENT' | 'AUTHORIZED_PICKUP' | 'EMERGENCY_CONTACT';
  authLevel: 'FULL_APPROVE' | 'APPROVE_WITH_OTP' | 'VIEW_ONLY' | 'EMERGENCY_ONLY';
  escalationOrder: number;
  ivrEnabled: boolean;
  pushNotificationEnabled: boolean;
  isActive: boolean;
}

export interface ChildExitRequest {
  id: number;
  childId: number;
  childName: string;
  communityId: string;
  flatNumber: string;
  towerName: string;
  exitType: 'UNACCOMPANIED' | 'WITH_GUARDIAN' | 'WITH_AUTHORIZED_PICKUP' | 'SCHOOL_BUS' | 'EMERGENCY';
  status: 'PENDING' | 'APPROVED' | 'DENIED' | 'EXPIRED' | 'AUTO_LOCKED' | 'EMERGENCY_OVERRIDE';
  escalationState: 'AWAITING_PRIMARY' | 'PRIMARY_TIMEOUT_ESCALATE_BACKUP' | 'IVR_TRIGGERED' | 'IVR_CONNECTED' | 'GUARDIAN_RESPONDED' | 'ALL_ESCALATIONS_EXHAUSTED' | 'AUTO_DENY';
  guardOnDuty: string;
  gateId: string;
  requestedAt: string;
  primaryNotifiedAt: string;
  escalatedAt: string;
  ivrTriggeredAt: string;
  approvedAt: string;
  deniedAt: string;
  approvedByGuardianId: number;
  approvedByName: string;
  approvalMethod: string;
  companionName: string;
  companionPhone: string;
  companionRelation: string;
  escalationTimeoutSeconds: number;
  totalEscalationAttempts: number;
  remarks: string;
}

export interface EscalationLog {
  id: number;
  exitRequestId: number;
  guardianId: number;
  guardianName: string;
  guardianPhone: string;
  method: 'PUSH_NOTIFICATION' | 'SMS' | 'IVR_CALL' | 'WHATSAPP' | 'IN_APP_ALERT';
  outcome: 'PENDING' | 'APPROVED' | 'DENIED' | 'NO_RESPONSE' | 'CALL_FAILED' | 'VOICEMAIL';
  initiatedAt: string;
  respondedAt: string;
  responseTimeSeconds: number;
  attemptNumber: number;
  ivrCallSid: string;
  remarks: string;
}

export interface SchoolBusRoute {
  id: number;
  communityId: string;
  routeCode: string;
  schoolName: string;
  busNumber: string;
  driverName: string;
  driverPhone: string;
  attendantName: string;
  attendantPhone: string;
  rfidTagId: string;
  morningPickupTime: string;
  afternoonDropTime: string;
  totalChildren: number;
  isActive: boolean;
  currentStatus: 'NOT_STARTED' | 'EN_ROUTE_PICKUP' | 'AT_SCHOOL' | 'EN_ROUTE_DROP' | 'AT_GATE' | 'COMPLETED';
}

export interface BusBoardingLog {
  id: number;
  busRouteId: number;
  childId: number;
  childName: string;
  communityId: string;
  boardingDate: string;
  boardingType: 'MORNING_PICKUP' | 'AFTERNOON_DROP';
  boardingStatus: 'BOARDED' | 'DROPPED_SAFE' | 'ABSENT' | 'CANCELLED' | 'PARENT_PICKUP';
  boardedAt: string;
  droppedAt: string;
  droppedConfirmedBy: string;
  parentNotified: boolean;
  parentNotifiedAt: string;
  remarks: string;
}

export interface BusGateEvent {
  id: number;
  busRouteId: number;
  communityId: string;
  rfidTagId: string;
  gateId: string;
  eventType: 'RFID_ENTRY' | 'RFID_EXIT' | 'MANUAL_OVERRIDE';
  scannedAt: string;
  childrenOnBoard: number;
  childrenDropped: number;
  allParentsNotified: boolean;
  notificationsSentAt: string;
  guardOnDuty: string;
}

export interface ExitSecurityDashboard {
  totalChildren: number;
  exitLockEnabled: number;
  pendingExits: number;
  approvedToday: number;
  deniedToday: number;
  autoLockedToday: number;
  avgResponseTime: number;
  escalationRate: number;
  recentExitRequests: ChildExitRequest[];
  escalationLogs: EscalationLog[];
}

export interface BusDashboard {
  totalRoutes: number;
  activeRoutes: number;
  atGate: number;
  enRoute: number;
  completed: number;
  totalBoardedToday: number;
  safeDropoffs: number;
  pendingDropoffs: number;
  parentPickups: number;
  routes: SchoolBusRoute[];
  recentBoardings: BusBoardingLog[];
  recentGateEvents: BusGateEvent[];
}

export const childSecurityService = {
  getExitDashboard: () => axios.get<ExitSecurityDashboard>(`${API_BASE}/exit/dashboard`).then(r => r.data),
  getBusDashboard: () => axios.get<BusDashboard>(`${API_BASE}/bus/dashboard`).then(r => r.data),
  getAllChildren: () => axios.get<ChildProfile[]>(`${API_BASE}/children`).then(r => r.data),
  getAllRoutes: () => axios.get<SchoolBusRoute[]>(`${API_BASE}/bus/routes`).then(r => r.data),
  initiateExit: (childId: number, guard: string, gate: string, exitType: string, companionName?: string, companionPhone?: string, companionRelation?: string) =>
    axios.post(`${API_BASE}/exit/request`, null, { params: { childId, guard, gate, exitType, companionName, companionPhone, companionRelation } }).then(r => r.data),
  guardianRespond: (requestId: number, guardianId: number, approved: boolean) =>
    axios.post(`${API_BASE}/exit/${requestId}/respond`, null, { params: { guardianId, approved } }).then(r => r.data),
  processTimeout: (requestId: number) => axios.post(`${API_BASE}/exit/${requestId}/timeout`).then(r => r.data),
  rfidScan: (rfidTagId: string, gateId: string, guard: string) =>
    axios.post(`${API_BASE}/bus/rfid-scan`, null, { params: { rfidTagId, gateId, guard } }).then(r => r.data),
  confirmDropoff: (boardingId: number, confirmedBy: string) =>
    axios.post(`${API_BASE}/bus/boarding/${boardingId}/confirm`, null, { params: { confirmedBy } }).then(r => r.data),
  seedDemo: () => axios.post(`${API_BASE}/seed-demo`).then(r => r.data),
};
