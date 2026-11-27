import axios from 'axios';

const API_BASE = '/api/parking-ev';

export interface ParkingBay {
  id?: number;
  communityId: number;
  basement: string;
  bayNumber: string;
  bayType: string;
  vehicleClearance: string;
  maxHeightCm?: number;
  floorDistanceRank?: number;
  status: string;
  assignedFlat?: string;
  currentVehicleNumber?: string;
  hasEvCharger?: boolean;
}

export interface AllocationResult {
  allocated: boolean;
  basement: string | null;
  bayNumber: string | null;
  bookingId: number | null;
  message: string;
  remainingSpots: number;
}

export interface ReleaseResult {
  basement: string;
  bayNumber: string;
  durationMinutes: number;
  message: string;
}

export interface ParkingStatus {
  totalVisitorBays: number;
  available: number;
  occupied: number;
  activeBookings: number;
  availableByBasement: Record<string, number>;
}

export interface EvCharger {
  id?: number;
  communityId: number;
  chargerCode: string;
  powerKw: number;
  status: string;
  connectorType?: string;
  maxSessionMinutes?: number;
  overstayPenaltyPerHour?: number;
  ratePerKwh?: number;
}

export interface ReservationResult {
  startedCharging: boolean;
  sessionId: number;
  chargerCode: string | null;
  queuePosition: number;
  message: string;
}

export interface SessionEndResult {
  sessionId: number;
  energyKwh: number;
  energyCost: number;
  overstayMinutes: number;
  overstayPenalty: number;
  totalAmount: number;
  status: string;
}

export interface NotificationAction {
  channel: string;
  description: string;
  timing: string;
}

export interface ViolationResult {
  recorded: boolean;
  vehicleNumber: string;
  ownerFlat: string;
  assignedBay: string;
  violationType: string;
  isWrongSlot: boolean;
  notificationToken: string;
  message: string;
  notificationActions: NotificationAction[];
}

export interface ViolationCheckResult {
  registered: boolean;
  inCorrectSpot: boolean;
  vehicleNumber: string;
  flatNumber: string;
  assignedBay: string;
  message: string;
}

// Visitor Parking
export const allocateVisitor = (data: { vehicleNumber: string; vehicleType: string; visitorName: string; hostFlat: string; preferredBasement?: string; communityId?: string }) =>
  axios.post<AllocationResult>(`${API_BASE}/visitor/allocate`, data).then(r => r.data);

export const releaseParking = (communityId: number, vehicleNumber: string) =>
  axios.post<ReleaseResult>(`${API_BASE}/visitor/release`, { communityId: String(communityId), vehicleNumber }).then(r => r.data);

export const getParkingStatus = (communityId: number) =>
  axios.get<ParkingStatus>(`${API_BASE}/status`, { params: { communityId } }).then(r => r.data);

export const getBays = (communityId: number) =>
  axios.get<ParkingBay[]>(`${API_BASE}/bays`, { params: { communityId } }).then(r => r.data);

// EV Charging
export const reserveCharger = (data: { flatNumber: string; vehicleNumber: string; communityId?: string; userId?: string; preferredChargerId?: string }) =>
  axios.post<ReservationResult>(`${API_BASE}/ev/reserve`, data).then(r => r.data);

export const endSession = (sessionId: number) =>
  axios.post<SessionEndResult>(`${API_BASE}/ev/end-session/${sessionId}`).then(r => r.data);

export const runAutoCutoff = (communityId: number) =>
  axios.post<any[]>(`${API_BASE}/ev/auto-cutoff`, null, { params: { communityId } }).then(r => r.data);

export const getChargers = (communityId: number) =>
  axios.get<EvCharger[]>(`${API_BASE}/ev/chargers`, { params: { communityId } }).then(r => r.data);

// Violations
export const reportViolation = (data: { vehicleNumber: string; violationType: string; communityId?: string; scannedBayId?: string }) =>
  axios.post<ViolationResult>(`${API_BASE}/violation/report`, data).then(r => r.data);

export const checkVehicle = (communityId: number, vehicleNumber: string) =>
  axios.get<ViolationCheckResult>(`${API_BASE}/violation/check`, { params: { communityId, vehicleNumber } }).then(r => r.data);
