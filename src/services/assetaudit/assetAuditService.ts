import axios from 'axios';

const API = '/api/asset-audit';

// ─── Asset Types ───

export interface SocietyAsset {
  id: number;
  communityId: number;
  name: string;
  assetTag: string;
  qrCode: string;
  category: string;
  towerName: string;
  floorNumber: number;
  locationDescription: string;
  manufacturer: string;
  modelNumber: string;
  purchaseDate: string;
  purchaseCost: number;
  warrantyEndDate: string;
  depreciationMethod: string;
  usefulLifeYears: number;
  annualDepreciationRate: number;
  currentBookValue: number;
  status: string;
  complianceStatus: string;
  inspectionIntervalDays: number;
  lastInspectionDate: string;
  nextInspectionDue: string;
  totalInspections: number;
  overdueInspections: number;
}

export interface AssetInspection {
  id: number;
  assetId: number;
  qrCodeScanned: string;
  technicianId: string;
  technicianName: string;
  inspectionType: string;
  result: string;
  pressureReading: number;
  temperatureReading: number;
  voltageReading: number;
  runHours: number;
  partsReplacedJson: string;
  remarks: string;
  tamperDetected: boolean;
  qrMatchVerified: boolean;
  inspectedAt: string;
  inspectionDurationSec: number;
}

export interface DepreciationReport {
  assetId: number;
  assetName: string;
  purchaseCost: number;
  currentBookValue: number;
  totalDepreciation: number;
  yearsOwned: number;
  remainingLife: number;
  method: string;
}

export interface AssetDashboardSummary {
  totalAssets: number;
  byCategory: Record<string, number>;
  byStatus: Record<string, number>;
  byCompliance: Record<string, number>;
  totalPurchaseValue: number;
  totalCurrentValue: number;
  totalDepreciation: number;
  overdueInspections: number;
  nonCompliantAssets: number;
  expiringWarranties: number;
  criticalFindings: number;
  tamperEvents: number;
  totalInspections: number;
  assets: SocietyAsset[];
  overdueAssets: SocietyAsset[];
  criticalInspections: AssetInspection[];
}

// ─── Housekeeping Types ───

export interface HousekeepingTask {
  id: number;
  communityId: number;
  qrCode: string;
  locationId: string;
  locationName: string;
  locationType: string;
  towerName: string;
  floorNumber: number;
  status: string;
  priority: string;
  scheduledTime: string;
  assignedStaffId: string;
  assignedStaffName: string;
  checklistJson: string;
  completedItemsJson: string;
  startedAt: string;
  completedAt: string;
  durationMinutes: number;
  residentReported: boolean;
  residentReportQrScan: string;
  residentReportedAt: string;
  residentRemarks: string;
  escalated: boolean;
  escalationLevel: number;
  escalationReason: string;
  escalatedAt: string;
  photoBeforeUrl: string;
  photoAfterUrl: string;
  ratingScore: number;
}

export interface StaffPerformance {
  staffName: string;
  totalTasks: number;
  completedTasks: number;
  avgDurationMin: number;
  avgRating: number;
}

export interface HousekeepingDashboard {
  totalTasks: number;
  activeTasks: number;
  activeEscalations: number;
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
  byLocationType: Record<string, number>;
  avgDurationMin: number;
  residentReports: number;
  completedToday: number;
  staffPerformance: Record<string, StaffPerformance>;
  byTower: Record<string, HousekeepingTask[]>;
  activeTasks2: HousekeepingTask[];
  escalations: HousekeepingTask[];
}

// ─── API Calls ───

export const assetAuditApi = {
  getAssetDashboard: () => axios.get<AssetDashboardSummary>(`${API}/assets/dashboard`).then(r => r.data),
  scanAssetQr: (qrCode: string) => axios.get<SocietyAsset>(`${API}/assets/scan/${qrCode}`).then(r => r.data),
  recordInspection: (data: Record<string, unknown>) => axios.post<AssetInspection>(`${API}/assets/inspect`, data).then(r => r.data),
  getInspectionHistory: (assetId: number) => axios.get<AssetInspection[]>(`${API}/assets/${assetId}/inspections`).then(r => r.data),
  getDepreciation: (assetId: number) => axios.get<DepreciationReport>(`${API}/assets/${assetId}/depreciation`).then(r => r.data),

  getHousekeepingDashboard: () => axios.get<HousekeepingDashboard>(`${API}/housekeeping/dashboard`).then(r => r.data),
  reportDirty: (qrCode: string, remarks: string) => axios.post<HousekeepingTask>(`${API}/housekeeping/report-dirty`, { qrCode, remarks }).then(r => r.data),
  assignTask: (taskId: number, staffId: string, staffName: string) => axios.post<HousekeepingTask>(`${API}/housekeeping/${taskId}/assign`, { staffId, staffName }).then(r => r.data),
  startTask: (taskId: number) => axios.post<HousekeepingTask>(`${API}/housekeeping/${taskId}/start`).then(r => r.data),
  completeTask: (taskId: number, completedItems: string, photoAfterUrl: string) => axios.post<HousekeepingTask>(`${API}/housekeeping/${taskId}/complete`, { completedItems, photoAfterUrl }).then(r => r.data),
  runEscalation: () => axios.post<HousekeepingTask[]>(`${API}/housekeeping/escalate`).then(r => r.data),
  getChecklist: (locationType: string) => axios.get<string>(`${API}/housekeeping/checklist/${locationType}`).then(r => r.data),
};
