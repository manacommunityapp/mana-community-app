export type SportType =
  | 'BADMINTON'
  | 'TENNIS'
  | 'CRICKET'
  | 'FOOTBALL'
  | 'BASKETBALL'
  | 'SWIMMING'
  | 'SQUASH'
  | 'TABLE_TENNIS'
  | 'PICKLEBALL'
  | 'VOLLEYBALL';

export type CourtSurface =
  | 'SYNTHETIC_MAT'
  | 'WOODEN'
  | 'CLAY'
  | 'GRASS_TURF'
  | 'ACRYLIC'
  | 'CONCRETE'
  | 'TILED'
  | 'SAND';

export interface SportsAmenity {
  id: string;
  name: string;
  icon: string;
}

export interface SportsFacility {
  id: string;
  vendorId: string;
  vendorName: string;
  name: string;
  description: string;
  address: string;
  city: string;
  area: string;
  pinCode: string;
  contactPhone: string;
  contactEmail: string;
  mapLink?: string;
  openingTime: string; // HH:mm
  closingTime: string; // HH:mm
  images: string[];
  amenities: string[];
  isFederated: boolean; // Linked with apartment communities
  partnerCommunities?: string[];
  rating: number;
  totalReviews: number;
  courtsCount: number;
  status: 'ACTIVE' | 'PENDING_APPROVAL' | 'SUSPENDED';
  createdAt: string;
}

export interface SportsCourtConfig {
  id: string;
  facilityId: string;
  resourceId?: number; // Maps to Resource Booking engine
  name: string; // e.g., "Court 1 (Wooden Flooring)"
  sportType: SportType;
  surfaceType: CourtSurface;
  courtDimension?: string; // e.g., "44ft x 20ft"
  isIndoor: boolean;
  hasLighting: boolean;
  baseHourlyPrice: number;
  residentDiscountPercent: number;
  isActive: boolean;
  isMaintenance: boolean;
  maintenanceReason?: string;
  rules?: string[];
}

export interface SportsPricingRule {
  id: string;
  facilityId: string;
  courtId?: string; // null means applies to all courts in facility
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, ... 6 = Saturday
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  price: number;
  residentDiscountPercent: number;
  isPeakHour: boolean;
}

export type SlotStatus = 'OPEN' | 'HELD' | 'BOOKED' | 'MAINTENANCE' | 'CLOSED';

export interface SportsCourtSlot {
  id: string;
  courtId: string;
  facilityId: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  price: number;
  residentPrice: number;
  status: SlotStatus;
  holdExpiresAt?: string;
  bookingId?: string;
  customerName?: string;
}

export interface SportsVendorBooking {
  id: string;
  bookingNumber: string;
  courtId: string;
  courtName: string;
  facilityId: string;
  facilityName: string;
  sportType: SportType;
  bookingDate: string;
  startTime: string;
  endTime: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  unitOrCommunity?: string;
  amount: number;
  residentDiscountAmount?: number;
  status: 'CONFIRMED' | 'CHECKED_IN' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  paymentStatus: 'PAID' | 'PAY_AT_VENUE' | 'REFUNDED' | 'FAILED';
  paymentReference?: string;
  qrCode?: string;
  checkedInAt?: string;
  notes?: string;
  createdAt: string;
}

export interface SportsVendorDashboardStats {
  todayRevenue: number;
  todayBookings: number;
  courtUtilizationPercent: number;
  pendingCheckIns: number;
  activeCourtsCount: number;
  totalFacilities: number;
  monthlyRevenue: number;
  repeatCustomersCount: number;
}
