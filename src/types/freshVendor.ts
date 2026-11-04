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