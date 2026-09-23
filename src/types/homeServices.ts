/**
 * Home Services / Community Help Type Definitions
 * Covers Categories, Workers, Skills, Availability, Packages, Bookings,
 * Schedules, Attendance, Payments, Reviews, Requirements, Reports, and Gate Passes.
 */

export type ServiceCategoryCode =
  | 'MAID'
  | 'COOK'
  | 'HOUSE_CLEANING'
  | 'UTENSIL_CLEANING'
  | 'LAUNDRY'
  | 'IRONING'
  | 'BABY_CARE'
  | 'ELDER_CARE'
  | 'DRIVER'
  | 'GARDENER'
  | 'VEHICLE_CLEANING'
  | 'BATHROOM_CLEANING'
  | 'DEEP_CLEANING'
  | 'GENERAL_HELPER'
  | 'ELECTRICIAN'
  | 'PLUMBER'
  | 'CARPENTER'
  | 'AC_SERVICE'
  | 'APPLIANCE_SERVICE'
  | 'PEST_CONTROL'
  | 'OTHER';

export interface ServiceCategory {
  id: string;
  name: string;
  code: ServiceCategoryCode;
  description: string;
  icon: string;
  supportsRecurring: boolean;
  supportsMonthly: boolean;
  supportsDaily: boolean;
  supportsHourly: boolean;
  active: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export type WorkerType = 'EXTERNAL' | 'COMMUNITY_WORKER' | 'MULTI_FLAT' | 'VENDOR_EMPLOYEE';
export type VerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED' | 'SUSPENDED' | 'EXPIRED';
export type WorkerStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'ON_LEAVE';

export interface WorkerSkill {
  id: string;
  workerId: string;
  categoryId: string;
  categoryName?: string;
  categoryCode?: ServiceCategoryCode;
  experienceYears: number;
  isPrimary: boolean;
  active: boolean;
}

export type DayOfWeek =
  | 'MONDAY'
  | 'TUESDAY'
  | 'WEDNESDAY'
  | 'THURSDAY'
  | 'FRIDAY'
  | 'SATURDAY'
  | 'SUNDAY';

export interface WorkerAvailability {
  id: string;
  workerId: string;
  dayOfWeek: DayOfWeek;
  startTime: string; // '07:00'
  endTime: string;   // '11:00'
  maxBookings: number;
  active: boolean;
}

export interface WorkerFlatAssignment {
  id: string;
  workerId: string;
  flatId: string;
  tower?: string;
  flatNumber: string;
  assignedFrom: string;
  assignedTo?: string;
  status: 'ACTIVE' | 'PAUSED' | 'ENDED';
}

export type PricingModel =
  | 'FIXED_MONTHLY'
  | 'PER_DAY'
  | 'PER_VISIT'
  | 'PER_HOUR'
  | 'PER_TASK'
  | 'FIXED_PACKAGE';

export type BookingFrequency = 'ONE_TIME' | 'DAILY' | 'WEEKLY' | 'MONTHLY';

export interface ServicePackage {
  id: string;
  workerId?: string;
  categoryId: string;
  categoryName?: string;
  name: string;
  description: string;
  includedTasks: string[];
  pricingModel: PricingModel;
  price: number;
  durationMinutes?: number;
  frequency: BookingFrequency;
  active: boolean;
  createdAt: string;
}

export interface WorkerLeave {
  id: string;
  workerId: string;
  leaveDate: string;
  reason: string;
  status: 'APPROVED' | 'PENDING';
}

export interface HomeServiceWorker {
  id: string;
  communityId: string;
  userId?: string;
  workerType: WorkerType;
  displayName: string;
  phoneMasked?: string;
  experienceYears: number;
  languages: string[];
  verificationStatus: VerificationStatus;
  mobileVerified: boolean;
  communityVerified: boolean;
  securityVerified: boolean;
  rating: number;
  reviewCount: number;
  status: WorkerStatus;
  servingSince: string;
  bio?: string;
  avatarUrl?: string;
  skills: WorkerSkill[];
  availability: WorkerAvailability[];
  flatAssignments: WorkerFlatAssignment[];
  packages?: ServicePackage[];
  leaves?: WorkerLeave[];
  createdAt: string;
  updatedAt: string;
}

export type BookingStatus =
  | 'DRAFT'
  | 'REQUESTED'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'CONFIRMED'
  | 'SCHEDULED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED_BY_RESIDENT'
  | 'CANCELLED_BY_WORKER'
  | 'NO_SHOW'
  | 'PAUSED'
  | 'EXPIRED';

export interface HomeServiceBooking {
  id: string;
  communityId: string;
  flatId: string;
  tower: string;
  flatNumber: string;
  residentUserId: string;
  residentName?: string;
  residentPhoneMasked?: string;
  workerId: string;
  workerName?: string;
  workerAvatarUrl?: string;
  categoryId: string;
  categoryName?: string;
  categoryCode?: ServiceCategoryCode;
  packageId?: string;
  packageName?: string;
  bookingType: BookingFrequency;
  pricingModel: PricingModel;
  startDate: string;
  endDate?: string;
  recurringDays: DayOfWeek[];
  startTime: string; // '08:00'
  endTime: string;   // '10:00'
  price: number;
  status: BookingStatus;
  rejectionReason?: string;
  cancellationReason?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type AttendanceStatus = 'COMPLETED' | 'ABSENT' | 'LEAVE' | 'HOLIDAY' | 'CANCELLED';

export interface ServiceAttendance {
  id: string;
  bookingId: string;
  scheduleId?: string;
  workerId: string;
  residentUserId: string;
  serviceDate: string; // 'YYYY-MM-DD'
  status: AttendanceStatus;
  checkInTime?: string;
  checkOutTime?: string;
  markedBy: 'RESIDENT' | 'WORKER' | 'SYSTEM' | 'ADMIN';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface HomeServiceSchedule {
  id: string;
  bookingId: string;
  serviceDate: string;
  startTime: string;
  endTime: string;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'MISSED' | 'CANCELLED' | 'RESCHEDULED';
  createdAt: string;
}

export interface HomeServicePayment {
  id: string;
  bookingId: string;
  billingMonth: string; // '2026-10'
  amount: number;
  paymentModel: PricingModel;
  paymentStatus: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  transactionReference?: string;
  paymentMethod?: 'UPI' | 'RESIDENT_WALLET' | 'CARD' | 'CASH' | 'GATEWAY';
  paidAt?: string;
  createdAt: string;
}

export interface HomeServiceReview {
  id: string;
  bookingId: string;
  reviewerUserId: string;
  reviewerName?: string;
  reviewerRole: 'RESIDENT' | 'WORKER';
  revieweeId: string;
  rating: number; // 1-5
  workQuality: number;
  punctuality: number;
  behaviour: number;
  reliability: number;
  comment: string;
  isAnonymous: boolean;
  status: 'PUBLISHED' | 'HIDDEN' | 'REPORTED' | 'MODERATED';
  createdAt: string;
}

export interface HomeServiceRequirement {
  id: string;
  communityId: string;
  flatId: string;
  tower: string;
  createdBy: string;
  creatorName?: string;
  categoryId: string;
  categoryName?: string;
  frequency: BookingFrequency;
  preferredDays: DayOfWeek[];
  startDate: string;
  preferredStartTime?: string;
  preferredEndTime?: string;
  budgetMin?: number;
  budgetMax?: number;
  description: string;
  status: 'OPEN' | 'ASSIGNED' | 'CLOSED' | 'CANCELLED' | 'EXPIRED';
  responsesCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface RequirementResponse {
  id: string;
  requestId: string;
  workerId: string;
  workerName: string;
  workerRating: number;
  workerReviewCount: number;
  workerExperienceYears: number;
  proposedPrice: number;
  message: string;
  status: 'SUBMITTED' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN';
  createdAt: string;
}

export interface HomeServiceReport {
  id: string;
  bookingId?: string;
  reportedBy: string;
  reportedAgainst: string;
  reportedAgainstName?: string;
  reason: string;
  description: string;
  status: 'PENDING' | 'UNDER_REVIEW' | 'RESOLVED' | 'DISMISSED';
  resolution?: string;
  resolvedBy?: string;
  createdAt: string;
  resolvedAt?: string;
}

export interface ContextualChatMessage {
  id: string;
  bookingId: string;
  senderId: string;
  senderName: string;
  senderRole: 'RESIDENT' | 'WORKER' | 'ADMIN';
  message: string;
  createdAt: string;
}

export interface GatePassRecord {
  id: string;
  workerId: string;
  workerName: string;
  qrTokenHash: string;
  validFrom: string;
  validTo: string;
  status: 'ACTIVE' | 'EXPIRED' | 'REVOKED';
  lastEntryAt?: string;
  lastExitAt?: string;
  history: Array<{
    type: 'ENTRY' | 'EXIT';
    timestamp: string;
    gateNumber: string;
    verifiedBy: string;
  }>;
}
