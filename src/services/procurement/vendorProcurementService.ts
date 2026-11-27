import axios from 'axios';

const API_BASE = '/api/vendor-procurement';

export interface MatchResult {
  matched: boolean;
  resultType: string;
  details: string;
  workflowId: number | null;
}

export interface ApprovalStepResult {
  success: boolean;
  message: string;
  newStatus: string;
  nextLevel: string | null;
}

export interface PurchaseOrder {
  id: number;
  communityId: number;
  poNumber: string;
  vendorName: string;
  vendorGstin: string;
  category: string;
  totalAmount: number;
  gstAmount: number;
  netPayable: number;
  status: string;
  description: string;
  expectedDeliveryDate: string;
  raisedBy: string;
}

export interface VendorInvoice {
  id: number;
  invoiceNumber: string;
  communityId: number;
  invoiceAmount: number;
  gstAmount: number;
  tdsDeducted: number;
  netPayable: number;
  invoiceDate: string;
  dueDate: string;
  status: string;
  matchResult: string;
  matchDiscrepancy: string;
}

export interface ApprovalWorkflow {
  id: number;
  communityId: number;
  invoiceId: number;
  poNumber: string;
  invoiceNumber: string;
  amount: number;
  currentLevel: string;
  status: string;
  estateManagerId: string;
  estateManagerApprovedAt: string;
  treasurerId: string;
  treasurerApprovedAt: string;
  secretaryId: string;
  secretaryApprovedAt: string;
  rejectedBy: string;
  rejectionReason: string;
}

export interface AmcContract {
  id: number;
  communityId: number;
  contractNumber: string;
  vendorName: string;
  assetCategory: string;
  assetIdentifier: string;
  annualValue: number;
  startDate: string;
  endDate: string;
  warrantyExpiry: string;
  serviceIntervalDays: number;
  sparePartThreshold: number;
  status: string;
  renewalAlertDays: number;
  contactPerson: string;
  contactPhone: string;
  slaResponseHours: string;
}

export interface ExpiryAlert {
  contractNumber: string;
  assetIdentifier: string;
  vendorName: string;
  category: string;
  alertType: string;
  expiryDate: string;
  daysLeft: number;
  annualValue: number;
}

export interface MaintenanceSchedule {
  id: number;
  communityId: number;
  assetIdentifier: string;
  scheduledDate: string;
  status: string;
  technicianName: string;
  technicianPhone: string;
  completedAt: string;
  completionNotes: string;
  sparePartsUsed: number;
  sparePartDetails: string;
  checklistJson: string;
}

export interface MatchSummary {
  totalInvoices: number;
  matched: number;
  failed: number;
  pendingMatch: number;
  approved: number;
  pendingApproval: number;
}

export interface AmcDashboard {
  totalContracts: number;
  active: number;
  expiringSoon: number;
  expired: number;
  overdueSchedules: number;
  upcomingThisWeek: number;
  byCategory: Record<string, number>;
}

// Three-Way Matching
export const performMatch = (invoiceId: number) =>
  axios.post<MatchResult>(`${API_BASE}/match/${invoiceId}`).then(r => r.data);

export const getMatchSummary = (communityId: number) =>
  axios.get<MatchSummary>(`${API_BASE}/match/summary/${communityId}`).then(r => r.data);

export const getInvoices = (communityId: number) =>
  axios.get<VendorInvoice[]>(`${API_BASE}/invoices/${communityId}`).then(r => r.data);

export const getPurchaseOrders = (communityId: number) =>
  axios.get<PurchaseOrder[]>(`${API_BASE}/purchase-orders/${communityId}`).then(r => r.data);

// Approvals
export const processApproval = (workflowId: number, approverId: string, approved: boolean, remarks: string) =>
  axios.post<ApprovalStepResult>(`${API_BASE}/approval/${workflowId}`, { approverId, approved, remarks }).then(r => r.data);

export const getPendingApprovals = (communityId: number, level: string) =>
  axios.get<ApprovalWorkflow[]>(`${API_BASE}/approvals/pending/${communityId}`, { params: { level } }).then(r => r.data);

export const getAllApprovals = (communityId: number) =>
  axios.get<ApprovalWorkflow[]>(`${API_BASE}/approvals/${communityId}`).then(r => r.data);

// AMC Contracts
export const getContracts = (communityId: number) =>
  axios.get<AmcContract[]>(`${API_BASE}/amc/contracts/${communityId}`).then(r => r.data);

export const getExpiryAlerts = (communityId: number) =>
  axios.get<ExpiryAlert[]>(`${API_BASE}/amc/expiry-alerts/${communityId}`).then(r => r.data);

export const getAmcDashboard = (communityId: number) =>
  axios.get<AmcDashboard>(`${API_BASE}/amc/dashboard/${communityId}`).then(r => r.data);

// Maintenance
export const generateSchedules = (communityId: number, monthsAhead: number) =>
  axios.post<{ schedulesCreated: number; contractsProcessed: number }>(`${API_BASE}/maintenance/generate/${communityId}`, null, { params: { monthsAhead } }).then(r => r.data);

export const getUpcomingMaintenance = (communityId: number, days: number) =>
  axios.get<MaintenanceSchedule[]>(`${API_BASE}/maintenance/upcoming/${communityId}`, { params: { days } }).then(r => r.data);

export const getOverdueMaintenance = (communityId: number) =>
  axios.get<MaintenanceSchedule[]>(`${API_BASE}/maintenance/overdue/${communityId}`).then(r => r.data);

export const completeSchedule = (scheduleId: number, technicianName: string, notes: string, sparePartsUsed: number, sparePartDetails: string) =>
  axios.post<MaintenanceSchedule>(`${API_BASE}/maintenance/complete/${scheduleId}`, { technicianName, notes, sparePartsUsed, sparePartDetails }).then(r => r.data);

// Demo
export const seedDemoData = (communityId: number) =>
  axios.post<{ poId: number; grnId: number; invoiceId: number; message: string }>(`${API_BASE}/demo/seed/${communityId}`).then(r => r.data);
