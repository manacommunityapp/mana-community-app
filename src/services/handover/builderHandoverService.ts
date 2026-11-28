import axios from 'axios';

const API = '/api/builder-handover';

// ─── Snag Types ───

export interface SnagItem {
  id: number;
  flatNumber: string;
  towerName: string;
  floorNumber: number;
  snagCode: string;
  category: string;
  severity: string;
  status: string;
  roomLocation: string;
  exactCoordinates: string;
  description: string;
  photoBeforeUrl: string;
  annotatedPhotoUrl: string;
  photoAfterUrl: string;
  reportedByName: string;
  reportedAt: string;
  assignedSubcontractorId: string;
  assignedSubcontractorName: string;
  subcontractorTrade: string;
  assignedAt: string;
  targetResolutionDate: string;
  resolvedAt: string;
  reInspectionDate: string;
  reInspectedByName: string;
  reworkCount: number;
  reInspectionCount: number;
  resolutionNotes: string;
  disputeReason: string;
  possessionBlocker: boolean;
  buyerAcknowledged: boolean;
}

export interface FlatInspection {
  id: number;
  flatNumber: string;
  towerName: string;
  floorNumber: number;
  phase: string;
  outcome: string;
  inspectorName: string;
  buyerName: string;
  scheduledAt: string;
  completedAt: string;
  durationMinutes: number;
  totalSnagsFound: number;
  criticalSnagsOpen: number;
  majorSnagsOpen: number;
  minorSnagsOpen: number;
  possessionSignOffBlocked: boolean;
  buyerSignedOff: boolean;
}

export interface SubcontractorScore {
  name: string;
  trade: string;
  totalSnags: number;
  closedSnags: number;
  reworkRatePct: number;
}

export interface SnagDashboard {
  totalSnags: number;
  openBlockers: number;
  totalReworks: number;
  avgResolveHours: number;
  byCategory: Record<string, number>;
  byStatus: Record<string, number>;
  bySeverity: Record<string, number>;
  byTower: Record<string, number>;
  subcontractorScores: Record<string, SubcontractorScore>;
  totalInspections: number;
  completedHandovers: number;
  allSnags: SnagItem[];
  possessionBlockers: SnagItem[];
  inspections: FlatInspection[];
}

// ─── Corpus Types ───

export interface CorpusFundTransaction {
  id: number;
  voucherNumber: string;
  type: string;
  status: string;
  cutoverPhase: string;
  amount: number;
  gstAmount: number;
  tdsDeducted: number;
  netAmount: number;
  description: string;
  category: string;
  transactionDate: string;
  financialYear: string;
  monthNumber: number;
  paidToOrReceivedFrom: string;
  paymentMode: string;
  disputeReason: string;
  disputeRaisedBy: string;
  disputeResolution: string;
  frozen: boolean;
}

export interface CutoverSnapshot {
  id: number;
  snapshotCode: string;
  status: string;
  cutoverDate: string;
  totalCorpusFund: number;
  maintenanceReserve: number;
  sinkingFund: number;
  repairFund: number;
  insuranceFund: number;
  totalEscrowHeld: number;
  totalExpenses18Months: number;
  totalVouchers: number;
  verifiedVouchers: number;
  disputedVouchers: number;
  pendingVouchers: number;
  openingBalanceRwa: number;
  openingBalanceFrozen: boolean;
  builderSignatoryName: string;
  rwaPresidentName: string;
  rwaTreasurerName: string;
  totalFlats: number;
  possessionCompleted: number;
  possessionPending: number;
  handoverCompletionPercent: number;
}

export interface CutoverDashboard {
  totalTransactions: number;
  totalInflows: number;
  totalOutflows: number;
  netBalance: number;
  totalGst: number;
  totalTds: number;
  amountByType: Record<string, number>;
  expenseBreakdown: Record<string, number>;
  byStatus: Record<string, number>;
  disputedCount: number;
  escrowHoldCount: number;
  latestSnapshot: CutoverSnapshot | null;
  transactions: CorpusFundTransaction[];
  disputedTransactions: CorpusFundTransaction[];
  escrowHolds: CorpusFundTransaction[];
}

// ─── API Calls ───

export const builderHandoverApi = {
  getSnagDashboard: () => axios.get<SnagDashboard>(`${API}/snags/dashboard`).then(r => r.data),
  logSnag: (data: Record<string, unknown>) => axios.post<SnagItem>(`${API}/snags/log`, data).then(r => r.data),
  assignSnag: (id: number, data: Record<string, unknown>) => axios.post<SnagItem>(`${API}/snags/${id}/assign`, data).then(r => r.data),
  startWork: (id: number) => axios.post<SnagItem>(`${API}/snags/${id}/start`).then(r => r.data),
  submitReInspection: (id: number, data: Record<string, string>) => axios.post<SnagItem>(`${API}/snags/${id}/submit-reinspection`, data).then(r => r.data),
  reInspect: (id: number, data: Record<string, unknown>) => axios.post<SnagItem>(`${API}/snags/${id}/reinspect`, data).then(r => r.data),
  canSignOff: (flat: string, tower: string) => axios.get<{ canSignOff: boolean }>(`${API}/snags/can-sign-off?flat=${flat}&tower=${tower}`).then(r => r.data),
  conductInspection: (data: Record<string, unknown>) => axios.post<FlatInspection>(`${API}/inspection/conduct`, data).then(r => r.data),

  getCorpusDashboard: () => axios.get<CutoverDashboard>(`${API}/corpus/dashboard`).then(r => r.data),
  createSnapshot: (data: Record<string, unknown>) => axios.post<CutoverSnapshot>(`${API}/corpus/snapshot`, data).then(r => r.data),
  freezeBalance: (id: number, frozenBy: string) => axios.post<CutoverSnapshot>(`${API}/corpus/snapshot/${id}/freeze`, { frozenBy }).then(r => r.data),
  disputeTransaction: (id: number, reason: string, raisedBy: string) => axios.post<CorpusFundTransaction>(`${API}/corpus/transaction/${id}/dispute`, { reason, raisedBy }).then(r => r.data),
  resolveDispute: (id: number, resolution: string) => axios.post<CorpusFundTransaction>(`${API}/corpus/transaction/${id}/resolve`, { resolution }).then(r => r.data),
  createEscrow: (data: Record<string, unknown>) => axios.post<CorpusFundTransaction>(`${API}/corpus/escrow`, data).then(r => r.data),
};
