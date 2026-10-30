import { apiClient, getStoredUser } from "../common/apiClient";

function communityId(): number {
  return getStoredUser()?.communityId ?? 0;
}

// ── Parcel Room ──────────────────────────────────────────────────────────────

export interface ParcelRecord {
  id: number;
  communityId: number;
  residentName: string | null;
  flatNumber: string | null;
  senderName: string | null;
  courierCompany: string | null;
  trackingNumber: string | null;
  status: string;
  receivedAt: string;
  collectedAt: string | null;
  notes: string | null;
  otp: string | null;
  otpExpiresAt: string | null;
}

export interface LogParcelRequest {
  communityId: number;
  flatNumber: string;
  residentName?: string;
  senderName?: string;
  courierCompany?: string;
  trackingNumber?: string;
  notes?: string;
}

export interface CollectParcelRequest {
  otp: string;
}

export const parcelService = {
  async getParcels(status?: string): Promise<ParcelRecord[]> {
    const cid = communityId();
    const q = new URLSearchParams({ communityId: String(cid) });
    if (status) q.set("status", status);
    return apiClient.get<ParcelRecord[]>(`/parcels?${q}`);
  },
  async logParcel(data: LogParcelRequest): Promise<ParcelRecord> {
    return apiClient.post<ParcelRecord>("/parcels", data);
  },
  async generateOtp(id: number): Promise<ParcelRecord> {
    return apiClient.post<ParcelRecord>(`/parcels/${id}/generate-otp`, {});
  },
  async collectParcel(id: number, otp: string): Promise<ParcelRecord> {
    return apiClient.post<ParcelRecord>(`/parcels/${id}/collect`, { otp });
  },
};

// ── Vehicle Blacklist ────────────────────────────────────────────────────────

export interface VehicleBlacklistEntry {
  id: number;
  communityId: number;
  vehicleNumber: string;
  ownerName: string | null;
  reason: string;
  blacklistedBy: string | null;
  createdAt: string;
  expiresAt: string | null;
  active: boolean;
}

export interface AddVehicleBlacklistRequest {
  communityId: number;
  vehicleNumber: string;
  ownerName?: string;
  reason: string;
  expiresAt?: string;
}

export const vehicleBlacklistService = {
  async getBlacklist(): Promise<VehicleBlacklistEntry[]> {
    const cid = communityId();
    return apiClient.get<VehicleBlacklistEntry[]>(`/vehicles/blacklist?communityId=${cid}`);
  },
  async addEntry(data: AddVehicleBlacklistRequest): Promise<VehicleBlacklistEntry> {
    return apiClient.post<VehicleBlacklistEntry>("/vehicles/blacklist", data);
  },
  async removeEntry(id: number): Promise<void> {
    return apiClient.delete(`/vehicles/blacklist/${id}`);
  },
};

// ── Visitor Blacklist ────────────────────────────────────────────────────────

export interface VisitorBlacklistEntry {
  id: number;
  communityId: number;
  visitorName: string;
  phone: string | null;
  reason: string;
  blacklistedBy: string | null;
  createdAt: string;
  active: boolean;
}

export interface AddVisitorBlacklistRequest {
  communityId: number;
  visitorName: string;
  phone?: string;
  reason: string;
}

export const visitorBlacklistService = {
  async getBlacklist(): Promise<VisitorBlacklistEntry[]> {
    const cid = communityId();
    return apiClient.get<VisitorBlacklistEntry[]>(`/visitors/blacklist?communityId=${cid}`);
  },
  async addEntry(data: AddVisitorBlacklistRequest): Promise<VisitorBlacklistEntry> {
    return apiClient.post<VisitorBlacklistEntry>("/visitors/blacklist", data);
  },
  async removeEntry(id: number): Promise<void> {
    return apiClient.delete(`/visitors/blacklist/${id}`);
  },
};

// ── Visitor Vehicle Passes ───────────────────────────────────────────────────

export interface VisitorVehiclePass {
  id: number;
  communityId: number;
  visitorName: string;
  vehicleNumber: string;
  passDate: string;
  validUntil: string | null;
  status: string;
  issuedBy: string | null;
  flatNumber: string | null;
  notes: string | null;
  createdAt: string;
}

export interface CreateVisitorVehiclePassRequest {
  communityId: number;
  visitorName: string;
  vehicleNumber: string;
  passDate: string;
  validUntil?: string;
  flatNumber?: string;
  notes?: string;
}

export const visitorVehiclePassService = {
  async getPasses(date?: string): Promise<VisitorVehiclePass[]> {
    const cid = communityId();
    const q = new URLSearchParams({ communityId: String(cid) });
    if (date) q.set("date", date);
    return apiClient.get<VisitorVehiclePass[]>(`/vehicles/visitor-passes?${q}`);
  },
  async createPass(data: CreateVisitorVehiclePassRequest): Promise<VisitorVehiclePass> {
    return apiClient.post<VisitorVehiclePass>("/vehicles/visitor-passes", data);
  },
  async revokePass(id: number): Promise<void> {
    return apiClient.delete(`/vehicles/visitor-passes/${id}`);
  },
};

// ── Temporary Access Tokens ──────────────────────────────────────────────────

export interface TemporaryAccessToken {
  id: number;
  communityId: number;
  token: string;
  qrCode: string | null;
  visitorName: string;
  purpose: string | null;
  validFrom: string;
  validUntil: string;
  status: string;
  usedAt: string | null;
  createdAt: string;
}

export interface CreateTempAccessTokenRequest {
  communityId: number;
  visitorName: string;
  validFrom: string;
  validUntil: string;
  purpose?: string;
}

export const tempAccessTokenService = {
  async getTokens(): Promise<TemporaryAccessToken[]> {
    const cid = communityId();
    return apiClient.get<TemporaryAccessToken[]>(`/access/temp-passes?communityId=${cid}`);
  },
  async createToken(data: CreateTempAccessTokenRequest): Promise<TemporaryAccessToken> {
    return apiClient.post<TemporaryAccessToken>("/access/temp-passes", data);
  },
  async revokeToken(id: number): Promise<void> {
    return apiClient.delete(`/access/temp-passes/${id}`);
  },
};

// ── Access Cards ─────────────────────────────────────────────────────────────

export interface AccessCard {
  id: number;
  communityId: number;
  cardNumber: string;
  holderName: string;
  holderType: string;
  flatNumber: string | null;
  status: string;
  issuedAt: string;
  expiresAt: string | null;
  notes: string | null;
}

export interface IssueAccessCardRequest {
  communityId: number;
  cardNumber: string;
  holderName: string;
  holderType: string;
  flatNumber?: string;
  expiresAt?: string;
  notes?: string;
}

export const accessCardService = {
  async getCards(): Promise<AccessCard[]> {
    const cid = communityId();
    return apiClient.get<AccessCard[]>(`/access/cards?communityId=${cid}`);
  },
  async issueCard(data: IssueAccessCardRequest): Promise<AccessCard> {
    return apiClient.post<AccessCard>("/access/cards", data);
  },
  async updateCardStatus(id: number, status: string): Promise<AccessCard> {
    return apiClient.put<AccessCard>(`/access/cards/${id}/status`, { status });
  },
  async deactivateCard(id: number): Promise<void> {
    return apiClient.delete(`/access/cards/${id}`);
  },
};

// ── Guard SOS ────────────────────────────────────────────────────────────────

export interface GuardSosAlert {
  id: number;
  communityId: number;
  guardId: number | null;
  guardName: string | null;
  location: string | null;
  description: string | null;
  status: string;
  acknowledgedBy: string | null;
  acknowledgedAt: string | null;
  createdAt: string;
}

export const guardSosService = {
  async getActiveAlerts(): Promise<GuardSosAlert[]> {
    const cid = communityId();
    return apiClient.get<GuardSosAlert[]>(`/guard/sos/active?communityId=${cid}`);
  },
  async acknowledgeAlert(id: number): Promise<GuardSosAlert> {
    return apiClient.put<GuardSosAlert>(`/guard/sos/${id}/acknowledge`, {});
  },
};

// ── Guard Diary ──────────────────────────────────────────────────────────────

export interface GuardDiaryEntry {
  id: number;
  communityId: number;
  guardId: number | null;
  guardName: string | null;
  entryDate: string;
  category: string | null;
  description: string;
  createdAt: string;
}

export interface CreateDiaryEntryRequest {
  communityId: number;
  entryDate: string;
  category?: string;
  description: string;
}

export const guardDiaryService = {
  async getEntries(date?: string): Promise<GuardDiaryEntry[]> {
    const cid = communityId();
    const q = new URLSearchParams({ communityId: String(cid) });
    if (date) q.set("date", date);
    return apiClient.get<GuardDiaryEntry[]>(`/guard/diary?${q}`);
  },
  async addEntry(data: CreateDiaryEntryRequest): Promise<GuardDiaryEntry> {
    return apiClient.post<GuardDiaryEntry>("/guard/diary", data);
  },
};

// ── Staff Access Rules ───────────────────────────────────────────────────────

export interface StaffAccessRule {
  id: number;
  staffId: number;
  staffName: string | null;
  allowedFrom: string;
  allowedUntil: string;
  daysAllowed: string[] | null;
  gateAccess: string | null;
  notes: string | null;
  createdAt: string;
}

export interface CreateStaffAccessRuleRequest {
  staffId: number;
  allowedFrom: string;
  allowedUntil: string;
  daysAllowed?: string[];
  gateAccess?: string;
  notes?: string;
}

export const staffAccessRuleService = {
  async getRules(staffId: number): Promise<StaffAccessRule[]> {
    return apiClient.get<StaffAccessRule[]>(`/staff/access-rules/${staffId}`);
  },
  async addRule(data: CreateStaffAccessRuleRequest): Promise<StaffAccessRule> {
    return apiClient.post<StaffAccessRule>("/staff/access-rules", data);
  },
  async deleteRule(id: number): Promise<void> {
    return apiClient.delete(`/staff/access-rules/${id}`);
  },
};

// ── Staff Leave ──────────────────────────────────────────────────────────────

export interface StaffLeave {
  id: number;
  staffId: number;
  staffName: string | null;
  leaveDate: string;
  leaveType: string | null;
  reason: string | null;
  status: string;
  createdAt: string;
}

export interface MarkStaffLeaveRequest {
  staffId: number;
  leaveDate: string;
  leaveType?: string;
  reason?: string;
}

export const staffLeaveService = {
  async getLeaves(staffId: number, month?: string): Promise<StaffLeave[]> {
    const q = new URLSearchParams();
    if (month) q.set("month", month);
    return apiClient.get<StaffLeave[]>(`/staff/leave/${staffId}?${q}`);
  },
  async markLeave(data: MarkStaffLeaveRequest): Promise<StaffLeave> {
    return apiClient.post<StaffLeave>("/staff/leave", data);
  },
  async cancelLeave(id: number): Promise<void> {
    return apiClient.delete(`/staff/leave/${id}`);
  },
};

// ── Guard Handover ───────────────────────────────────────────────────────────

export interface GuardHandoverRecord {
  id: number;
  communityId: number;
  guardId: number | null;
  guardName: string | null;
  nextGuardId: number | null;
  nextGuardName: string | null;
  date: string;
  shiftType: "MORNING" | "EVENING" | "NIGHT" | string;
  handoverNotes: string | null;
  pendingTasks: string[] | null;
  incidentSummary: string | null;
  status: string;
  createdAt: string;
}

export interface CreateHandoverRequest {
  communityId: number;
  date: string;
  shiftType: string;
  handoverNotes?: string;
  pendingTasks?: string[];
  incidentSummary?: string;
  nextGuardId?: number;
}

export const guardHandoverService = {
  async getHandovers(date?: string): Promise<GuardHandoverRecord[]> {
    const cid = communityId();
    const q = new URLSearchParams({ communityId: String(cid) });
    if (date) q.set("date", date);
    return apiClient.get<GuardHandoverRecord[]>(`/guard/handover?${q}`);
  },
  async createHandover(data: CreateHandoverRequest): Promise<GuardHandoverRecord> {
    return apiClient.post<GuardHandoverRecord>("/guard/handover", data);
  },
  async getHandover(id: number): Promise<GuardHandoverRecord> {
    return apiClient.get<GuardHandoverRecord>(`/guard/handover/${id}`);
  },
};

// ── Maintenance Schedule ─────────────────────────────────────────────────────

export interface MaintenanceSchedule {
  id: number;
  communityId: number;
  title: string;
  description: string | null;
  frequencyDays: number;
  nextDueDate: string;
  assignedTo: string | null;
  categoryId: number | null;
  categoryName: string | null;
  isActive: boolean;
  lastRunDate: string | null;
  createdAt: string;
}

export interface CreateMaintenanceScheduleRequest {
  communityId: number;
  title: string;
  description?: string;
  frequencyDays: number;
  nextDueDate: string;
  assignedTo?: string;
  categoryId?: number;
}

export const maintenanceScheduleService = {
  async getSchedules(): Promise<MaintenanceSchedule[]> {
    const cid = communityId();
    return apiClient.get<MaintenanceSchedule[]>(`/maintenance/schedules?communityId=${cid}`);
  },
  async createSchedule(data: CreateMaintenanceScheduleRequest): Promise<MaintenanceSchedule> {
    return apiClient.post<MaintenanceSchedule>("/maintenance/schedules", data);
  },
  async toggleSchedule(id: number): Promise<MaintenanceSchedule> {
    return apiClient.put<MaintenanceSchedule>(`/maintenance/schedules/${id}`, {});
  },
};
