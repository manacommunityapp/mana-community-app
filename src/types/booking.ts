// Enums as string unions
export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CHECKED_IN' | 'CHECKED_OUT' | 'CANCELLED' | 'NO_SHOW' | 'WAITLISTED' | 'REJECTED' | 'COMPLETED';
export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'NOT_REQUIRED';
export type PaymentStatus = 'PENDING' | 'PAID' | 'REFUNDED' | 'PARTIALLY_REFUNDED' | 'WAIVED';
export type ResourceStatus = 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE' | 'RETIRED';
export type BookingType = 'SLOT_BASED' | 'HOURLY' | 'DAILY' | 'WEEKLY' | 'MONTHLY';
export type MaintenanceType = 'SCHEDULED' | 'EMERGENCY' | 'CLEANING' | 'REPAIR' | 'UPGRADE';
export type MaintenanceStatus = 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type WaitlistStatus = 'WAITING' | 'NOTIFIED' | 'CONFIRMED' | 'EXPIRED' | 'CANCELLED';
export type DiscountType = 'PERCENTAGE' | 'FIXED';
export type PricingType = 'BASE_HOURLY' | 'WEEKEND' | 'FESTIVAL' | 'MEMBER' | 'GUEST' | 'PEAK_HOUR' | 'DISCOUNT' | 'SECURITY_DEPOSIT' | 'LATE_CHARGE' | 'TAX';
export type RuleType = 'MAX_BOOKINGS' | 'MEMBERS_ONLY' | 'GUESTS_ALLOWED' | 'AGE_RESTRICTION' | 'GENDER_RESTRICTION' | 'DEPOSIT_REQUIRED' | 'SECURITY_APPROVAL' | 'COMMITTEE_APPROVAL' | 'WEEKDAY_RULE' | 'WEEKEND_RULE' | 'FESTIVAL_RULE' | 'RECURRING_RULE' | 'TIME_RESTRICTION' | 'CAPACITY_LIMIT';
export type WorkflowStepType = 'AUTO_CONFIRM' | 'PAYMENT' | 'COMMITTEE_APPROVAL' | 'SECURITY_APPROVAL' | 'ADMIN_APPROVAL' | 'DEPOSIT' | 'DOCUMENT_VERIFICATION';

// Response interfaces
export interface ResourceCategoryResponse {
  id: number;
  name: string;
  icon: string | null;
  color: string | null;
  description: string | null;
  displayOrder: number;
  status: string;
  imageUrl: string | null;
  resourceCount: number;
  communityId: number;
}

export interface ResourceResponse {
  id: number;
  name: string;
  categoryId: number;
  categoryName: string;
  categoryIcon: string | null;
  categoryColor: string | null;
  description: string | null;
  capacity: number | null;
  location: string | null;
  building: string | null;
  floor: string | null;
  latitude: number | null;
  longitude: number | null;
  openTime: string | null;
  closeTime: string | null;
  bookingDurationMinutes: number | null;
  minimumDurationMinutes: number | null;
  maximumDurationMinutes: number | null;
  bufferTimeMinutes: number | null;
  cleaningTimeMinutes: number | null;
  advanceBookingDays: number | null;
  maxBookingsPerUser: number | null;
  maxActiveBookings: number | null;
  cancellationHours: number | null;
  autoCancel: boolean;
  approvalRequired: boolean;
  depositRequired: boolean;
  paymentRequired: boolean;
  allowWaitlist: boolean;
  allowGuest: boolean;
  qrCheckIn: boolean;
  recurringBookingAllowed: boolean;
  maxCapacity: number | null;
  bookingType: BookingType;
  status: ResourceStatus;
  primaryImageUrl: string | null;
  totalBookings: number;
  activeBookings: number;
  communityId: number;
}

export interface ResourceBookingResponse {
  id: number;
  bookingNumber: string;
  resourceId: number;
  resourceName: string;
  resourceCategory: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  endDate: string | null;
  purpose: string | null;
  numberOfGuests: number | null;
  status: BookingStatus;
  approvalStatus: ApprovalStatus;
  qrCode: string | null;
  checkedInAt: string | null;
  checkedOutAt: string | null;
  totalAmount: number | null;
  depositAmount: number | null;
  taxAmount: number | null;
  discountAmount: number | null;
  paymentStatus: PaymentStatus | null;
  paymentReference: string | null;
  isRecurring: boolean;
  rating: number | null;
  ratingComment: string | null;
  bookedById: number;
  bookedByName: string;
  approvedByName: string | null;
  cancellationReason: string | null;
  equipment: EquipmentResponse[];
  createdAt: string;
  updatedAt: string | null;
}

export interface EquipmentResponse {
  id: number;
  resourceId: number;
  resourceName: string;
  quantity: number;
  notes: string | null;
}

export interface SlotResponse {
  startTime: string;
  endTime: string;
  available: boolean;
  bookingId: number | null;
  bookedByName: string | null;
}

export interface BusinessRuleResponse {
  id: number;
  resourceId: number | null;
  categoryId: number | null;
  ruleType: RuleType;
  ruleKey: string;
  ruleValue: string;
  ruleOperator: string | null;
  description: string | null;
  isActive: boolean;
  priority: number;
  validFrom: string | null;
  validTo: string | null;
}

export interface PricingRuleResponse {
  id: number;
  resourceId: number | null;
  categoryId: number | null;
  pricingType: PricingType;
  amount: number | null;
  percentage: number | null;
  description: string | null;
  isActive: boolean;
  validFrom: string | null;
  validTo: string | null;
  dayOfWeek: string | null;
  startTime: string | null;
  endTime: string | null;
}

export interface ApprovalWorkflowResponse {
  id: number;
  resourceId: number | null;
  categoryId: number | null;
  workflowName: string;
  stepOrder: number;
  stepType: WorkflowStepType;
  stepName: string;
  isRequired: boolean;
  approverRole: string | null;
  timeoutHours: number | null;
  isActive: boolean;
}

export interface MaintenanceResponse {
  id: number;
  resourceId: number;
  resourceName: string;
  startDate: string;
  endDate: string;
  reason: string;
  maintenanceType: MaintenanceType;
  status: MaintenanceStatus;
  cost: number | null;
  vendorName: string | null;
  vendorContact: string | null;
  notes: string | null;
  isRecurring: boolean;
  createdAt: string;
}

export interface WaitlistResponse {
  id: number;
  resourceId: number;
  resourceName: string;
  userId: number;
  userName: string;
  requestedDate: string;
  requestedStartTime: string;
  requestedEndTime: string;
  status: WaitlistStatus;
  position: number;
  notifiedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}

export interface CouponResponse {
  id: number;
  code: string;
  description: string | null;
  discountType: DiscountType;
  discountValue: number;
  maxUses: number | null;
  currentUses: number;
  validFrom: string;
  validTo: string;
  minBookingAmount: number | null;
  maxDiscountAmount: number | null;
  isActive: boolean;
}

export interface BookingAnalyticsResponse {
  id: number;
  resourceId: number;
  resourceName: string;
  analyticsDate: string;
  totalBookings: number;
  confirmedBookings: number;
  cancelledBookings: number;
  noShows: number;
  revenue: number;
  occupancyPercentage: number;
  averageRating: number | null;
  peakHourStart: string | null;
  peakHourEnd: string | null;
}

export interface DashboardStatsResponse {
  totalResources: number;
  totalBookings: number;
  todayBookings: number;
  activeBookings: number;
  occupancyRate: number;
  revenue: number;
  cancellationRate: number;
  topResources: Array<{ name: string; bookings: number; revenue: number }>;
  recentBookings: ResourceBookingResponse[];
}

// Request interfaces
export interface ResourceCategoryRequest {
  name: string;
  icon?: string;
  color?: string;
  description?: string;
  displayOrder?: number;
  status?: string;
  imageUrl?: string;
}

export interface ResourceRequest {
  name: string;
  categoryId: number;
  description?: string;
  capacity?: number;
  location?: string;
  building?: string;
  floor?: string;
  latitude?: number;
  longitude?: number;
  openTime?: string;
  closeTime?: string;
  bookingDurationMinutes?: number;
  minimumDurationMinutes?: number;
  maximumDurationMinutes?: number;
  bufferTimeMinutes?: number;
  cleaningTimeMinutes?: number;
  advanceBookingDays?: number;
  maxBookingsPerUser?: number;
  maxActiveBookings?: number;
  cancellationHours?: number;
  autoCancel?: boolean;
  approvalRequired?: boolean;
  depositRequired?: boolean;
  paymentRequired?: boolean;
  allowWaitlist?: boolean;
  allowGuest?: boolean;
  qrCheckIn?: boolean;
  recurringBookingAllowed?: boolean;
  maxCapacity?: number;
  bookingType?: string;
  status?: string;
}

export interface ResourceBookingRequest {
  resourceId: number;
  bookingDate: string;
  startTime: string;
  endTime: string;
  endDate?: string;
  purpose?: string;
  numberOfGuests?: number;
  equipmentIds?: number[];
  couponCode?: string;
}

export interface BusinessRuleRequest {
  resourceId?: number;
  categoryId?: number;
  ruleType: string;
  ruleKey: string;
  ruleValue: string;
  ruleOperator?: string;
  description?: string;
  isActive?: boolean;
  priority?: number;
  validFrom?: string;
  validTo?: string;
}

export interface PricingRuleRequest {
  resourceId?: number;
  categoryId?: number;
  pricingType: string;
  amount?: number;
  percentage?: number;
  description?: string;
  isActive?: boolean;
  validFrom?: string;
  validTo?: string;
  dayOfWeek?: string;
  startTime?: string;
  endTime?: string;
}

export interface MaintenanceRequest {
  resourceId: number;
  startDate: string;
  endDate: string;
  reason: string;
  maintenanceType: string;
  cost?: number;
  vendorName?: string;
  vendorContact?: string;
  notes?: string;
  isRecurring?: boolean;
  recurringPattern?: string;
}

export interface CouponRequest {
  code: string;
  description?: string;
  discountType: string;
  discountValue: number;
  maxUses?: number;
  validFrom: string;
  validTo: string;
  minBookingAmount?: number;
  maxDiscountAmount?: number;
  isActive?: boolean;
}

// Page response wrapper
export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}
