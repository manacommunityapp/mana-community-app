import axios from 'axios';

const API_BASE = '/api/tenancy';

// === Tenant Record Types ===
export type TenantStatus = 'KYC_PENDING' | 'KYC_IN_REVIEW' | 'ACTIVE' | 'MOVE_OUT_INITIATED' | 'MOVE_OUT_IN_PROGRESS' | 'MOVED_OUT' | 'REJECTED';
export type KycStatus = 'NOT_STARTED' | 'DOCUMENTS_UPLOADED' | 'OCR_PROCESSING' | 'VERIFICATION_PENDING' | 'MC_REVIEW' | 'APPROVED' | 'REJECTED' | 'EXPIRED';

export interface TenantRecord {
  id: number;
  communityId: number;
  flatNumber: string;
  towerName: string;
  tenantName: string;
  tenantPhone: string;
  tenantEmail: string;
  ownerId: number;
  status: TenantStatus;
  moveInDate: string;
  moveOutDate: string;
  leaseStartDate: string;
  leaseEndDate: string;
  appAccessActive: boolean;
  activeRfidTags: number;
  linkedDailyHelps: number;
  pendingDues: number;
  kycStatus: KycStatus;
}

// === Move-Out Saga Types ===
export type SagaStatus = 'INITIATED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'COMPENSATING' | 'COMPENSATED';
export type StepStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'COMPENSATED' | 'SKIPPED';

export interface MoveOutSaga {
  id: number;
  tenantRecordId: number;
  flatNumber: string;
  towerName: string;
  overallStatus: SagaStatus;
  duesVerification: StepStatus;
  pendingAmount: number;
  duesCheckedAt: string;
  appAccessRevocation: StepStatus;
  accessRevokedAt: string;
  rfidDeactivation: StepStatus;
  tagsDeactivated: number;
  totalTags: number;
  rfidDeactivatedAt: string;
  dailyHelpUnlinking: StepStatus;
  helpsUnlinked: number;
  helpsUnlinkedAt: string;
  gatePassIssuance: StepStatus;
  gatePassNumber: string;
  gatePassIssuedAt: string;
  auditPreservation: StepStatus;
  auditRecordsArchived: number;
  auditPreservedAt: string;
  failedStep: string;
  failureReason: string;
  compensationLog: string;
  completedAt: string;
}

export interface SagaSummary {
  completed: number;
  inProgress: number;
  failed: number;
  avgCompletionMinutes: number;
  sagas: MoveOutSaga[];
}

// === Document Types ===
export type DocumentType = 'AADHAAR' | 'RENTAL_AGREEMENT' | 'POLICE_VERIFICATION' | 'PAN_CARD' | 'PASSPORT' | 'OWNER_NOC' | 'UTILITY_BILL';
export type VerificationStatus = 'UPLOADED' | 'OCR_QUEUED' | 'OCR_COMPLETE' | 'PII_ENCRYPTED' | 'WATERMARK_GENERATED' | 'MC_REVIEW_PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';

export interface TenantDocument {
  id: number;
  tenantRecordId: number;
  documentType: DocumentType;
  originalFileName: string;
  encryptedStoragePath: string;
  watermarkedPreviewPath: string;
  encryptionKeyRef: string;
  verificationStatus: VerificationStatus;
  ocrExtractedData: string;
  ocrConfidenceScore: number;
  ocrProcessedAt: string;
  verifierRemarks: string;
  verifiedBy: string;
  verifiedAt: string;
  documentExpiryDate: string;
  expiryReminderSent: boolean;
  expiryReminderDate: string;
}

export interface ExpiryAlert {
  documentId: number;
  tenantRecordId: number;
  documentType: string;
  expiryDate: string;
  daysRemaining: number;
  severity: string;
}

export interface DocumentPipelineSummary {
  byStatus: Record<string, number>;
  byType: Record<string, number>;
  avgOcrConfidence: number;
  pendingMcReview: number;
  expiryAlerts: ExpiryAlert[];
  documents: TenantDocument[];
}

// === Slot Types ===
export type SlotType = 'MOVE_IN' | 'MOVE_OUT';
export type SlotStatus = 'REQUESTED' | 'APPROVED' | 'GATE_PASS_ISSUED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'REJECTED';

export interface MoveSlot {
  id: number;
  communityId: number;
  towerName: string;
  slotDate: string;
  startTime: string;
  endTime: string;
  slotType: SlotType;
  flatNumber: string;
  tenantRecordId: number;
  serviceElevatorId: string;
  gatePassIssued: boolean;
  gatePassNumber: string;
  status: SlotStatus;
  vehicleNumber: string;
  vehicleType: string;
  driverName: string;
  driverPhone: string;
}

export interface TimeWindow { start: string; end: string; }

export interface SlotAvailability {
  tower: string;
  date: string;
  type: SlotType;
  slotsUsed: number;
  maxSlots: number;
  available: boolean;
  availableWindows: TimeWindow[];
  availableElevators: string[];
}

export interface TowerCapacity {
  tower: string;
  moveIns: number;
  moveOuts: number;
  maxPerDay: number;
  slots: MoveSlot[];
}

export interface ElevatorUtilization { elevatorId: string; bookings: number; hoursBooked: number; }

export interface SlotScheduleSummary {
  date: string;
  totalSlots: number;
  towerCapacities: Record<string, TowerCapacity>;
  elevatorUtilization: ElevatorUtilization[];
  allSlots: MoveSlot[];
}

// === API Calls ===

export const seedDemoData = () => axios.post<string>(`${API_BASE}/seed`).then(r => r.data);
export const getAllTenants = () => axios.get<TenantRecord[]>(`${API_BASE}/tenants`).then(r => r.data);
export const getTenant = (id: number) => axios.get<TenantRecord>(`${API_BASE}/tenants/${id}`).then(r => r.data);

// Move-Out Saga
export const initiateMoveOut = (tenantId: number) => axios.post<MoveOutSaga>(`${API_BASE}/move-out/initiate/${tenantId}`).then(r => r.data);
export const executeMoveOut = (sagaId: number) => axios.post<MoveOutSaga>(`${API_BASE}/move-out/execute/${sagaId}`).then(r => r.data);
export const compensateMoveOut = (sagaId: number) => axios.post<MoveOutSaga>(`${API_BASE}/move-out/compensate/${sagaId}`).then(r => r.data);
export const getSagaSummary = (communityId?: number) => axios.get<SagaSummary>(`${API_BASE}/move-out/summary`, { params: { communityId } }).then(r => r.data);

// Documents
export const uploadDocument = (tenantRecordId: number, documentType: DocumentType, fileName: string) =>
  axios.post<TenantDocument>(`${API_BASE}/documents/upload`, { tenantRecordId, documentType, fileName }).then(r => r.data);
export const reviewDocument = (documentId: number, approved: boolean, remarks: string, reviewerName: string) =>
  axios.post<TenantDocument>(`${API_BASE}/documents/review/${documentId}`, { approved, remarks, reviewerName }).then(r => r.data);
export const getDocumentPipeline = () => axios.get<DocumentPipelineSummary>(`${API_BASE}/documents/pipeline`).then(r => r.data);
export const getExpiryAlerts = () => axios.get<ExpiryAlert[]>(`${API_BASE}/documents/expiry-alerts`).then(r => r.data);

// Slots
export const checkSlotAvailability = (tower: string, date: string, type: SlotType) =>
  axios.get<SlotAvailability>(`${API_BASE}/slots/availability`, { params: { tower, date, type } }).then(r => r.data);
export const bookSlot = (req: { communityId: number; tower: string; flatNumber: string; tenantRecordId: number;
  date: string; startTime: string; type: SlotType; vehicleNumber: string; vehicleType: string; driverName: string; driverPhone: string }) =>
  axios.post<MoveSlot>(`${API_BASE}/slots/book`, req).then(r => r.data);
export const issueGatePass = (slotId: number) => axios.post<MoveSlot>(`${API_BASE}/slots/gate-pass/${slotId}`).then(r => r.data);
export const validateGatePass = (gatePass: string) => axios.post<MoveSlot>(`${API_BASE}/slots/validate-pass`, null, { params: { gatePass } }).then(r => r.data);
export const getDaySchedule = (communityId?: number, date?: string) =>
  axios.get<SlotScheduleSummary>(`${API_BASE}/slots/schedule`, { params: { communityId, date } }).then(r => r.data);
