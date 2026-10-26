export type VisitorType =
  | 'GUEST'
  | 'CAB'
  | 'DELIVERY'
  | 'SERVICE_TECHNICIAN'
  | 'CONTRACTOR'
  | 'HOME_MAINTENANCE'
  | 'OTHER';

export type VisitorStatus =
  | 'PRE_APPROVED'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'REJECTED'
  | 'CHECKED_IN'
  | 'CHECKED_OUT'
  | 'OVERSTAYED'
  | 'CANCELLED';

export type PassType = 'ONE_TIME' | 'MULTI_DAY' | 'RECURRING';

export interface VisitorPass {
  id: number;
  communityId: number;
  residentId: number;
  residentName: string;
  flatNumber: string;
  tower?: string;
  visitorName: string;
  visitorPhone?: string;
  visitorType: VisitorType;
  passType: PassType;
  status: VisitorStatus;
  passCode: string; // 6-digit code
  qrPayload?: string;
  vehicleNumber?: string;
  expectedGuestCount: number;
  expectedArrival: string;
  validUntil: string;
  purpose?: string;
  createdAt: string;
}

export interface VisitorLog {
  id: number;
  communityId: number;
  passId?: number;
  gateId?: number;
  visitorName: string;
  visitorPhone?: string;
  flatNumber: string;
  tower?: string;
  vehicleNumber?: string;
  entryTime: string;
  exitTime?: string;
  checkedInGuardId?: number;
  checkedOutGuardId?: number;
  entryPhotoUrl?: string;
  exitPhotoUrl?: string;
  status: VisitorStatus;
  remarks?: string;
}

export type VehicleType =
  | 'TWO_WHEELER'
  | 'FOUR_WHEELER'
  | 'EV_TWO_WHEELER'
  | 'EV_FOUR_WHEELER'
  | 'COMMERCIAL'
  | 'EMERGENCY';

export type VehicleAccessType = 'RESIDENT' | 'VISITOR' | 'STAFF' | 'VENDOR' | 'EMERGENCY';

export interface Vehicle {
  id: number;
  communityId: number;
  residentId?: number;
  licensePlate: string;
  rfidTagNumber?: string;
  vehicleType: VehicleType;
  accessType: VehicleAccessType;
  makeModel?: string;
  color?: string;
  flatNumber?: string;
  tower?: string;
  parkingSlotNumber?: string;
  isEv: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface VehicleAccessLog {
  id: number;
  communityId: number;
  vehicleId?: number;
  licensePlate: string;
  rfidTag?: string;
  direction: 'IN' | 'OUT';
  accessType: VehicleAccessType;
  triggerSource: 'ANPR' | 'RFID' | 'QR' | 'MANUAL';
  barrierActuated: boolean;
  isAuthorized: boolean;
  snapshotPhotoUrl?: string;
  gateName?: string;
  accessTime: string;
}

export type ParkingViolationType =
  | 'UNAUTHORIZED_SLOT'
  | 'DOUBLE_PARKING'
  | 'FIRE_LANE_BLOCK'
  | 'EV_BAY_MISUSE'
  | 'VISITOR_OVERSTAY'
  | 'SPEEDING'
  | 'HANDICAPPED_BAY_MISUSE';

export type ViolationStatus =
  | 'REPORTED'
  | 'UNDER_REVIEW'
  | 'FINED'
  | 'PAID'
  | 'WAIVED'
  | 'DISPUTED';

export interface ParkingViolation {
  id: number;
  communityId: number;
  vehicleNumber: string;
  parkingSlotNumber?: string;
  tower?: string;
  violationType: ParkingViolationType;
  status: ViolationStatus;
  description?: string;
  photoEvidenceUrl?: string;
  fineAmount: number;
  reportedByName?: string;
  reportedAt: string;
  resolvedAt?: string;
  resolutionNotes?: string;
}

export type DeliveryDropLocation =
  | 'DOORSTEP'
  | 'MAIN_GATE_LOCKER'
  | 'TOWER_LOBBY'
  | 'CLUBHOUSE';

export type DeliveryStatus =
  | 'ARRIVED_AT_GATE'
  | 'OUT_FOR_DOOR_DELIVERY'
  | 'LEFT_AT_GATE'
  | 'COLLECTED_BY_RESIDENT'
  | 'RETURNED';

export interface DeliveryLog {
  id: number;
  communityId: number;
  flatNumber: string;
  tower?: string;
  courierCompany: string;
  deliveryAgentName?: string;
  deliveryAgentPhone?: string;
  packageCount: number;
  dropLocation: DeliveryDropLocation;
  status: DeliveryStatus;
  lockerSlot?: string;
  collectionOtp: string;
  packagePhotoUrl?: string;
  gateArrivedAt: string;
  collectedAt?: string;
}

export type StaffType =
  | 'MAID'
  | 'DRIVER'
  | 'COOK'
  | 'CLEANER'
  | 'ELECTRICIAN'
  | 'PLUMBER'
  | 'GARDENER'
  | 'SECURITY_GUARD'
  | 'FACILITY_TECH';

export type VerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED' | 'SUSPENDED';

export interface DomesticStaff {
  id: number;
  communityId: number;
  staffName: string;
  phone: string;
  staffType: StaffType;
  verificationStatus: VerificationStatus;
  govtIdType?: string;
  govtIdNumber?: string;
  photoUrl?: string;
  rfidTag?: string;
  passcode?: string;
  assignedFlats?: string;
  rating: number;
  isActive: boolean;
}

export interface StaffAttendanceLog {
  id: number;
  communityId: number;
  staffId: number;
  staffName: string;
  staffType: StaffType;
  gateId?: number;
  checkInTime: string;
  checkOutTime?: string;
  durationMinutes?: number;
  verificationMethod: string;
}

export type IncidentCategory =
  | 'THEFT'
  | 'VANDALISM'
  | 'PERIMETER_BREACH'
  | 'NOISE_COMPLAINT'
  | 'TRESPASSING'
  | 'UNAUTHORIZED_DRONE'
  | 'FIRE_HAZARD'
  | 'SUSPICIOUS_ACTIVITY'
  | 'OTHER';

export type IncidentSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type IncidentStatus =
  | 'REPORTED'
  | 'INVESTIGATING'
  | 'ESCALATED'
  | 'RESOLVED'
  | 'CLOSED';

export interface SafetyIncident {
  id: number;
  communityId: number;
  incidentNumber: string;
  title: string;
  description?: string;
  category: IncidentCategory;
  severity: IncidentSeverity;
  status: IncidentStatus;
  location?: string;
  tower?: string;
  flatNumber?: string;
  reportedByName?: string;
  evidencePhotos?: string;
  resolutionNotes?: string;
  createdAt: string;
  resolvedAt?: string;
}

export interface IncidentUpdate {
  id: number;
  incidentId: number;
  authorName: string;
  authorRole?: string;
  note: string;
  timestamp: string;
}

export type DeviceType =
  | 'ANPR_CAMERA'
  | 'RFID_READER'
  | 'QR_SCANNER'
  | 'BOOM_BARRIER'
  | 'SMART_LOCK'
  | 'TURNSTILE'
  | 'CCTV_ANALYTICS'
  | 'INTERCOM';

export interface HardwareDevice {
  id: number;
  communityId: number;
  deviceName: string;
  deviceCode: string;
  deviceType: DeviceType;
  ipAddress?: string;
  location?: string;
  isOnline: boolean;
  firmwareVersion?: string;
  lastHeartbeatAt?: string;
}

export interface HardwareIntegrationResult {
  authorized: boolean;
  barrierActuated: boolean;
  matchedEntityType: string;
  entityName?: string;
  flatNumber?: string;
  message: string;
}

export interface DashboardSummary {
  activeVisitorsInside: number;
  pendingDeliveries: number;
  staffOnDuty: number;
  vehicleEntriesToday: number;
  vehicleExitsToday: number;
  activeParkingViolations: number;
  openIncidents: number;
  activeGates: number;
  recentGateActivities: VehicleAccessLog[];
}
