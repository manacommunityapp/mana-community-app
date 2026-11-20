import { apiClient } from '@/services/common/apiClient';

export type PassType = 'DELIVERY' | 'DOMESTIC_WORKER' | 'GUEST' | 'VEHICLE' | 'CONTRACTOR';
export type PassStatus = 'ACTIVE' | 'USED' | 'EXPIRED' | 'REVOKED';
export type ParcelStatus = 'RECEIVED' | 'NOTIFIED' | 'PICKED_UP' | 'RETURNED' | 'LOST';
export type MoveType = 'MOVE_IN' | 'MOVE_OUT';
export type MoveStatus = 'REQUESTED' | 'APPROVED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'REJECTED';
export type AssetCategory = 'LIFT' | 'GENERATOR' | 'PUMP' | 'CCTV' | 'FIRE_SAFETY' | 'ELECTRICAL' | 'PLUMBING' | 'HVAC' | 'GATE' | 'OTHER';
export type AssetStatus = 'OPERATIONAL' | 'UNDER_MAINTENANCE' | 'OUT_OF_ORDER' | 'DECOMMISSIONED';
export type WatchlistSeverity = 'CAUTION' | 'BLOCKED';
export type WatchlistType = 'PERSON' | 'VEHICLE';
export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'HALF_DAY' | 'ON_LEAVE';
export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface OpsControlRoomSummary {
  staffOnDuty: number;
  pendingParcels: number;
  todayVisitors: number;
  overdueMaintenanceTasks: number;
  upcomingMaintenance: number;
  pendingMoveRequests: number;
  recentParcels?: ParcelDto[];
  recentPasses?: DigitalPassDto[];
}

export interface StaffAttendanceDto {
  id: number;
  staffId: number;
  staffName: string;
  role: string;
  shift: string;
  clockIn?: string;
  clockOut?: string;
  status: AttendanceStatus;
  date: string;
}

export interface LeaveRequestDto {
  id: number;
  staffId: number;
  staffName: string;
  fromDate: string;
  toDate: string;
  reason: string;
  status: LeaveStatus;
  reviewedBy?: string;
  reviewNote?: string;
}

export interface DigitalPassDto {
  id: number;
  token: string;
  flatNumber: string;
  passType: PassType;
  visitorName: string;
  vehicleNumber?: string;
  purpose?: string;
  validUntil: string;
  status: PassStatus;
  createdAt: string;
  generatedBy: string;
}

export interface ParcelDto {
  id: number;
  flatNumber: string;
  senderName: string;
  courier?: string;
  trackingNumber?: string;
  description?: string;
  status: ParcelStatus;
  otp?: string;
  receivedAt: string;
  pickedUpAt?: string;
  receivedBy: string;
}

export interface ChecklistItem {
  id: number;
  description: string;
  mandatory: boolean;
  completed: boolean;
  completedAt?: string;
}

export interface MoveRequestDto {
  id: number;
  flatNumber: string;
  residentName: string;
  moveType: MoveType;
  plannedDate: string;
  vehicleNumber?: string;
  moversCompany?: string;
  status: MoveStatus;
  checklist: ChecklistItem[];
  nocIssued: boolean;
  nocIssuedAt?: string;
  createdAt: string;
  notes?: string;
}

export interface AssetDto {
  id: number;
  name: string;
  category: AssetCategory;
  location: string;
  status: AssetStatus;
  serialNumber?: string;
  purchaseDate?: string;
  warrantyExpiry?: string;
  amcExpiry?: string;
  nextMaintenanceDate?: string;
  vendor?: string;
  notes?: string;
}

export interface MaintenanceLogDto {
  id: number;
  assetId: number;
  assetName: string;
  taskDescription: string;
  performedBy: string;
  cost?: number;
  performedAt: string;
  nextScheduled?: string;
  notes?: string;
}

export interface WatchlistEntryDto {
  id: number;
  type: WatchlistType;
  identifier: string;
  name?: string;
  reason: string;
  severity: WatchlistSeverity;
  active: boolean;
  addedBy: string;
  addedAt: string;
}

export interface WatchlistCheckResult {
  matched: boolean;
  entries: WatchlistEntryDto[];
}

export interface MonthlyReport {
  year: number;
  month: number;
  attendance: { totalStaff: number; avgPresent: number; leaveDays: number };
  parcels: { received: number; pickedUp: number; returned: number; lost: number };
  moveRequests: { moveIn: number; moveOut: number; completed: number; pending: number };
  assetMaintenance: { tasksCompleted: number; overdueTasks: number; totalCost: number };
}

const communityOpsService = {
  // Control room
  getControlRoomSummary: () => apiClient.get<OpsControlRoomSummary>('/ops/control-room/summary'),

  // Staff attendance
  getTodayAttendance: () => apiClient.get<StaffAttendanceDto[]>('/staff/attendance/today'),
  getAttendanceReport: (from: string, to: string) =>
    apiClient.get<StaffAttendanceDto[]>(`/staff/attendance/report?from=${from}&to=${to}`),
  markAttendance: (staffId: number, status: AttendanceStatus, date: string) =>
    apiClient.post('/staff/attendance/mark', { staffId, status, date }),
  clockIn: (staffId: number) => apiClient.post('/staff/attendance/clock-in', { staffId }),
  clockOut: (staffId: number) => apiClient.post('/staff/attendance/clock-out', { staffId }),
  getPendingLeaves: () => apiClient.get<LeaveRequestDto[]>('/staff/leave/pending'),
  submitLeave: (req: { staffId: number; fromDate: string; toDate: string; reason: string }) =>
    apiClient.post<LeaveRequestDto>('/staff/leave', req),
  reviewLeave: (id: number, approved: boolean, note?: string) =>
    apiClient.put(`/staff/leave/${id}/review`, { approved, note }),

  // Digital passes
  getActivePasses: () => apiClient.get<DigitalPassDto[]>('/digital-pass/my'),
  getPassesByFlat: (flatNumber: string) => apiClient.get<DigitalPassDto[]>(`/digital-pass/flat/${flatNumber}`),
  generatePass: (req: {
    flatNumber: string; passType: PassType; visitorName: string;
    vehicleNumber?: string; purpose?: string; validHours: number;
  }) => apiClient.post<DigitalPassDto>('/digital-pass', req),
  revokePass: (id: number) => apiClient.delete(`/digital-pass/${id}`),
  scanPass: (token: string) => apiClient.post<DigitalPassDto>('/digital-pass/scan', { token }),

  // Parcels
  receiveParcels: (req: {
    flatNumber: string; senderName: string; courier?: string;
    trackingNumber?: string; description?: string;
  }) => apiClient.post<ParcelDto>('/parcels/receive', req),
  getPendingParcels: () => apiClient.get<ParcelDto[]>('/parcels/pending'),
  getMyParcels: () => apiClient.get<ParcelDto[]>('/parcels/my'),
  acknowledgeParcel: (id: number, otp: string) =>
    apiClient.post(`/parcels/${id}/acknowledge`, { otp }),

  // Move requests
  createMoveRequest: (req: {
    moveType: MoveType; plannedDate: string; vehicleNumber?: string; moversCompany?: string; notes?: string;
  }) => apiClient.post<MoveRequestDto>('/move-requests', req),
  getAllMoveRequests: (status?: MoveStatus) =>
    apiClient.get<MoveRequestDto[]>(`/move-requests${status ? `?status=${status}` : ''}`),
  getMyMoveRequests: () => apiClient.get<MoveRequestDto[]>('/move-requests/my'),
  approveMoveRequest: (id: number) => apiClient.put(`/move-requests/${id}/approve`, {}),
  rejectMoveRequest: (id: number, reason: string) =>
    apiClient.put(`/move-requests/${id}/reject`, { reason }),
  updateChecklistItem: (id: number, itemId: number, completed: boolean) =>
    apiClient.put(`/move-requests/${id}/checklist/${itemId}`, { completed }),
  issueNoc: (id: number) => apiClient.post(`/move-requests/${id}/noc`, {}),

  // Assets
  getAssets: () => apiClient.get<AssetDto[]>('/assets'),
  createAsset: (req: Omit<AssetDto, 'id'>) => apiClient.post<AssetDto>('/assets', req),
  getOverdueAssets: () => apiClient.get<AssetDto[]>('/assets/overdue'),
  getUpcomingMaintenance: (days = 7) => apiClient.get<AssetDto[]>(`/assets/upcoming?days=${days}`),
  logMaintenance: (assetId: number, req: {
    taskDescription: string; performedBy: string; cost?: number;
    performedAt: string; nextScheduled?: string; notes?: string;
  }) => apiClient.post<MaintenanceLogDto>(`/assets/${assetId}/maintenance`, req),
  getMaintenanceHistory: (assetId: number) =>
    apiClient.get<MaintenanceLogDto[]>(`/assets/${assetId}/maintenance`),

  // Watchlist
  getWatchlist: () => apiClient.get<WatchlistEntryDto[]>('/watchlist'),
  addWatchlistEntry: (req: {
    type: WatchlistType; identifier: string; name?: string; reason: string; severity: WatchlistSeverity;
  }) => apiClient.post<WatchlistEntryDto>('/watchlist', req),
  checkWatchlist: (query: string) =>
    apiClient.post<WatchlistCheckResult>('/watchlist/check', { query }),
  removeWatchlistEntry: (id: number) => apiClient.delete(`/watchlist/${id}`),

  // Reports
  getMonthlyReport: (year: number, month: number) =>
    apiClient.get<MonthlyReport>(`/ops/reports/monthly?year=${year}&month=${month}`),
};

export default communityOpsService;
