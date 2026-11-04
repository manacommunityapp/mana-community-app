export type FreshVendorCapabilityType =
  | 'FRUIT_SUPPLIER'
  | 'VEGETABLE_SUPPLIER'
  | 'FRESH_CUT_PROCESSOR'
  | 'DAIRY_VENDOR'
  | 'BATTER_MANUFACTURER'
  | 'NUTRITION_VENDOR'
  | 'DRY_FRUIT_SUPPLIER'
  | 'CHICKEN_SUPPLIER'
  | 'MUTTON_SUPPLIER'
  | 'SEAFOOD_SUPPLIER'
  | 'HEALTHY_SNACK_VENDOR'
  | 'DELIVERY_PARTNER';

export type CapabilityStatus = 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';

export type VendorStaffRole =
  | 'VENDOR_OWNER'
  | 'VENDOR_MANAGER'
  | 'CATALOGUE_MANAGER'
  | 'INVENTORY_MANAGER'
  | 'PRODUCTION_MANAGER'
  | 'QUALITY_MANAGER'
  | 'PACKING_STAFF'
  | 'DELIVERY_STAFF'
  | 'VENDOR_ACCOUNTANT';

export interface VendorCapabilityDto {
  id: number;
  vendorId: number;
  vendorBusinessName?: string;
  capabilityType: FreshVendorCapabilityType;
  status: CapabilityStatus;
  approvedByUserId?: number;
  approvedByUserName?: string;
  approvedAt?: string;
  rejectionReason?: string;
  fssaiLicenseNumber?: string;
  fssaiValidUntil?: string;
  facilityAddress?: string;
  coldStorageAvailable: boolean;
  dailyCapacityUnits: number;
  operatingDays: string;
  createdAt: string;
}

export interface ApplyCapabilityRequest {
  vendorId: number;
  capabilityType: FreshVendorCapabilityType;
  fssaiLicenseNumber?: string;
  fssaiValidUntil?: string;
  facilityAddress?: string;
  coldStorageAvailable?: boolean;
  dailyCapacityUnits?: number;
  operatingDays?: string;
}

export interface ApproveCapabilityRequest {
  approved: boolean;
  rejectionReason?: string;
}

export interface VendorStaffDto {
  id: number;
  vendorId: number;
  vendorBusinessName?: string;
  userId: number;
  userFullName?: string;
  userEmail?: string;
  userPhone?: string;
  vendorRole: VendorStaffRole;
  isActive: boolean;
  invitedByUserId?: number;
  createdAt: string;
}

export interface InviteStaffRequest {
  vendorId: number;
  userId: number;
  vendorRole: VendorStaffRole;
}

export interface FreshVendorDashboardSummaryDto {
  vendorId: number;
  businessName?: string;
  approvedCapabilities: VendorCapabilityDto[];
  todayOrdersCount: number;
  tomorrowDemandUnits: number;
  activeBatchesCount: number;
  qualityPendingCount: number;
  dispatchPendingCount: number;
  monthToDateSales: number;
  settlementDueAmount: number;
  activeAlerts: string[];
}

export interface FreshPilotMetricsDto {
  totalPilotVendors: number;
  approvedCapabilitiesCount: number;
  activeBatchesCount: number;
  releasedBatchesCount: number;
  coldChainCompliancePercent: number;
  morningDeliveryOnTimePercent: number;
  completedDropsCount: number;
  pendingDropsCount: number;
  rejectionRatePercent: number;
  totalSettledPayouts: number;
  activePilotCommunitiesCount: number;
  pilotCommunityNames: string[];
}

// ── Multi-Document Compliance Types ───────────────────────────────────────
export type VendorDocumentType =
  | 'FSSAI_LICENSE'
  | 'GST_CERTIFICATE'
  | 'TRADE_LICENSE'
  | 'POLLUTION_NOC'
  | 'WATER_TEST_REPORT'
  | 'FSMS_CERTIFICATE';

export type DocumentVerificationStatus =
  | 'PENDING_VERIFICATION'
  | 'VERIFIED'
  | 'REJECTED'
  | 'EXPIRED';

export interface VendorDocumentDto {
  id: number;
  vendorId: number;
  vendorBusinessName?: string;
  documentType: VendorDocumentType;
  documentNumber: string;
  validFrom?: string;
  validTo?: string;
  fileKey?: string;
  fileUrl: string;
  status: DocumentVerificationStatus;
  verifiedByUserId?: number;
  verifiedAt?: string;
  rejectionReason?: string;
  createdAt: string;
}

export interface UploadVendorDocumentRequest {
  vendorId: number;
  documentType: VendorDocumentType;
  documentNumber: string;
  validFrom?: string;
  validTo?: string;
  fileUrl: string;
  fileKey?: string;
}

export interface VerifyVendorDocumentRequest {
  status: DocumentVerificationStatus;
  rejectionReason?: string;
}

// ── Multi-City & Service Zone Types ───────────────────────────────────────
export interface FreshCityDto {
  id: number;
  code: string;
  name: string;
  state: string;
  country: string;
  isActive: boolean;
}

export interface FreshServiceZoneDto {
  id: number;
  cityId: number;
  name: string;
  code: string;
  deliveryCutoffTime?: string;
  isActive: boolean;
  postalCodes: string[];
}

export interface ServiceabilityResolutionDto {
  serviceable: boolean;
  cityCode?: string;
  cityName?: string;
  zoneCode?: string;
  zoneName?: string;
  deliveryCutoffTime?: string;
  message?: string;
}

// ── Fulfilment Group & Order Splitting Types ──────────────────────────────
export type FulfilmentGroupStatus =
  | 'CREATED'
  | 'ASSIGNED'
  | 'PICKED'
  | 'PACKED'
  | 'DISPATCHED'
  | 'DELIVERED'
  | 'CANCELLED';

export type FulfilmentItemStatus =
  | 'PENDING'
  | 'PICKED'
  | 'PACKED'
  | 'CANCELLED'
  | 'OUT_OF_STOCK';

export interface FulfilmentItemDto {
  id: number;
  fulfilmentGroupId: number;
  orderItemId: number;
  vendorProductId?: number;
  productName?: string;
  batchId?: number;
  batchNumber?: string;
  requestedQuantity: number;
  pickedQuantity?: number;
  unitOfMeasure: string;
  unitPrice: number;
  billedPrice: number;
  isWeightAdjusted: boolean;
  status: FulfilmentItemStatus;
  createdAt: string;
}

export interface FulfilmentGroupDto {
  id: number;
  groupReference: string;
  orderId: number;
  orderNumber: string;
  groupNumber: number;
  vendorId?: number;
  vendorBusinessName?: string;
  fulfilmentOwnerType: string;
  deliveryMode: string;
  status: FulfilmentGroupStatus;
  fulfilmentLocationId?: number;
  fulfilmentLocationName?: string;
  targetDeliveryTime?: string;
  dispatchedAt?: string;
  deliveredAt?: string;
  trackingReference?: string;
  handoverOtp?: string;
  qrCodeToken?: string;
  subtotalAmount: number;
  totalWeightG: number;
  requiresColdChain: boolean;
  items: FulfilmentItemDto[];
  createdAt: string;
  updatedAt: string;
}

// ── Weight Variation Ledger Types ─────────────────────────────────────────
export type WeightAdjustmentStatus =
  | 'AUTO_ADJUSTED'
  | 'REFUNDED_TO_WALLET'
  | 'CHARGED_TO_WALLET'
  | 'PENDING_CUSTOMER_APPROVAL'
  | 'REJECTED';

export interface WeightAdjustmentDto {
  id: number;
  adjustmentReference: string;
  fulfilmentItemId: number;
  orderId: number;
  orderNumber: string;
  customerId?: number;
  customerName?: string;
  requestedWeightG: number;
  actualWeightG: number;
  weightDifferenceG: number;
  weightDifferencePct: number;
  maxTolerancePct: number;
  originalAmount: number;
  adjustedAmount: number;
  refundOrChargeAmount: number;
  adjustmentStatus: WeightAdjustmentStatus;
  reason?: string;
  weighedAt: string;
}

export interface RecordWeightRequest {
  fulfilmentItemId: number;
  actualWeightG: number;
  weighedByUserId?: number;
  reason?: string;
}

// ── Product Recall Engine Types ───────────────────────────────────────────
export type RecallSeverity = 'CRITICAL' | 'MAJOR' | 'MINOR';
export type RecallStatus = 'INITIATED' | 'NOTIFIED' | 'COMPLETED' | 'CANCELLED';

export interface RecallOrderDto {
  id: number;
  recallId: number;
  orderId: number;
  orderNumber: string;
  customerId?: number;
  customerName?: string;
  fulfilmentItemId?: number;
  quantity: number;
  refundAmount: number;
  customerNotified: boolean;
  refundProcessed: boolean;
  notificationSentAt?: string;
  createdAt: string;
}

export interface ProductRecallDto {
  id: number;
  recallReference: string;
  batchId?: number;
  batchNumber?: string;
  vendorProductId: number;
  productName: string;
  severity: RecallSeverity;
  reason: string;
  detailedRootCause?: string;
  initiatedByUserId: number;
  initiatedByUserName?: string;
  initiatedAt: string;
  status: RecallStatus;
  affectedOrdersCount: number;
  affectedCustomersCount: number;
  totalUnitsRecalled: number;
  totalRefundAmount: number;
  affectedOrders: RecallOrderDto[];
  createdAt: string;
}

export interface InitiateRecallRequest {
  vendorProductId: number;
  batchId?: number;
  severity: RecallSeverity;
  reason: string;
  detailedRootCause?: string;
  initiatedByUserId: number;
}

// ── Wastage & Stock Movement Types ────────────────────────────────────────
export type WastageCategory =
  | 'COLD_CHAIN_BREAK'
  | 'TRANSIT_DAMAGE'
  | 'SPOILAGE'
  | 'EXPIRY_UNSOLD'
  | 'PROCESSING_TRIM'
  | 'PQC_REJECT';

export interface ProductWastageDto {
  id: number;
  wastageReference: string;
  vendorProductId: number;
  productName: string;
  batchId?: number;
  batchNumber?: string;
  fulfilmentLocationId?: number;
  fulfilmentLocationName?: string;
  quantity: number;
  unitOfMeasure: string;
  costPricePerUnit: number;
  totalLossAmount: number;
  wastageCategory: WastageCategory;
  notes?: string;
  disposalMethod?: string;
  recordedByUserId: number;
  recordedByUserName?: string;
  recordedAt: string;
}

export interface RecordWastageRequest {
  vendorProductId: number;
  batchId?: number;
  fulfilmentLocationId?: number;
  quantity: number;
  unitOfMeasure?: string;
  costPricePerUnit?: number;
  wastageCategory: WastageCategory;
  notes?: string;
  disposalMethod?: string;
  recordedByUserId: number;
}

export type StockMovementType =
  | 'INWARD_RECEIPT'
  | 'ORDER_RESERVE'
  | 'ORDER_PICK'
  | 'ORDER_CANCEL_RESTOCK'
  | 'WASTAGE_WRITE_OFF'
  | 'RECALL_QUARANTINE'
  | 'AUDIT_ADJUSTMENT';

export interface StockMovementDto {
  id: number;
  vendorProductId: number;
  productName: string;
  batchId?: number;
  batchNumber?: string;
  fulfilmentLocationId?: number;
  fulfilmentLocationName?: string;
  movementType: StockMovementType;
  quantity: number;
  balanceAfter: number;
  unitOfMeasure: string;
  referenceType?: string;
  referenceId?: string;
  createdByUserId?: number;
  notes?: string;
  createdAt: string;
}

export interface RecordStockMovementRequest {
  vendorProductId: number;
  batchId?: number;
  fulfilmentLocationId?: number;
  movementType: StockMovementType;
  quantity: number;
  unitOfMeasure?: string;
  referenceType?: string;
  referenceId?: string;
  createdByUserId?: number;
  notes?: string;
}