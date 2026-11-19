import { apiClient } from '../apiClient';

export interface CourtSlotSubscription {
  id: number;
  communityId: number;
  userId: number;
  courtId: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  frequency: string;
  startDate: string;
  endDate?: string;
  active: boolean;
  createdAt: string;
}

export interface OpenPlaySession {
  id: number;
  communityId: number;
  sport: string;
  courtId: number;
  sessionDate: string;
  startTime: string;
  endTime: string;
  minPlayers: number;
  maxPlayers: number;
  skillLevel?: string;
  organizerId: number;
  status: string;
  notes?: string;
  createdAt: string;
}

export interface OpenPlayParticipant {
  id: number;
  sessionId: number;
  userId: number;
  joinedAt: string;
  confirmed: boolean;
}

export interface CourtSlotWaitlist {
  id: number;
  communityId: number;
  bookingId: number;
  userId: number;
  position: number;
  notified: boolean;
  notifiedAt?: string;
  expiresAt?: string;
  createdAt: string;
}

export interface SportsNoShowDeposit {
  id: number;
  communityId: number;
  userId: number;
  bookingId: number;
  amount: number;
  heldAt: string;
  released: boolean;
  releasedAt?: string;
  forfeited: boolean;
  forfeitedAt?: string;
  reason?: string;
}

export interface PlayerRating {
  id: number;
  communityId: number;
  ratedUserId: number;
  ratedBy: number;
  sport: string;
  sessionId?: number;
  rating: number;
  sportsmanship?: number;
  skillLevel?: number;
  comment?: string;
  createdAt: string;
}

export interface CoachPackage {
  id: number;
  communityId: number;
  coachId: number;
  sport: string;
  name: string;
  description?: string;
  sessions: number;
  durationMinutes: number;
  price: number;
  groupSize: number;
  active: boolean;
  createdAt: string;
}

export interface CoachPackageEnrollment {
  id: number;
  communityId: number;
  packageId: number;
  userId: number;
  sessionsUsed: number;
  enrolledAt: string;
  expiresAt?: string;
  active: boolean;
}

export interface RefereeAssignment {
  id: number;
  communityId: number;
  refereeId: number;
  eventId: number;
  eventType: string;
  sport: string;
  assignedAt: string;
  confirmed: boolean;
  confirmedAt?: string;
  fee?: number;
  notes?: string;
}

const BASE = '/api/sports-ops';

export const sportsOpsService = {
  // Subscriptions
  listSubscriptions: () => apiClient.get<CourtSlotSubscription[]>(`${BASE}/subscriptions`),
  mySubscriptions: () => apiClient.get<CourtSlotSubscription[]>(`${BASE}/subscriptions/my`),
  createSubscription: (data: Partial<CourtSlotSubscription>) => apiClient.post<CourtSlotSubscription>(`${BASE}/subscriptions`, data),
  cancelSubscription: (id: number) => apiClient.put<CourtSlotSubscription>(`${BASE}/subscriptions/${id}/cancel`, {}),

  // Open Play
  listOpenSessions: () => apiClient.get<OpenPlaySession[]>(`${BASE}/open-play`),
  listAllSessions: () => apiClient.get<OpenPlaySession[]>(`${BASE}/open-play/all`),
  createSession: (data: Partial<OpenPlaySession>) => apiClient.post<OpenPlaySession>(`${BASE}/open-play`, data),
  joinSession: (sessionId: number) => apiClient.post<OpenPlayParticipant>(`${BASE}/open-play/${sessionId}/join`, {}),
  closeSession: (sessionId: number) => apiClient.put<OpenPlaySession>(`${BASE}/open-play/${sessionId}/close`, {}),
  sessionParticipants: (sessionId: number) => apiClient.get<OpenPlayParticipant[]>(`${BASE}/open-play/${sessionId}/participants`),

  // Waitlist
  waitlistByBooking: (bookingId: number) => apiClient.get<CourtSlotWaitlist[]>(`${BASE}/waitlist/booking/${bookingId}`),
  myWaitlist: () => apiClient.get<CourtSlotWaitlist[]>(`${BASE}/waitlist/my`),

  // Deposits
  listDeposits: () => apiClient.get<SportsNoShowDeposit[]>(`${BASE}/deposits`),
  releaseDeposit: (id: number, reason: string) => apiClient.put<SportsNoShowDeposit>(`${BASE}/deposits/${id}/release`, { reason }),
  forfeitDeposit: (id: number, reason: string) => apiClient.put<SportsNoShowDeposit>(`${BASE}/deposits/${id}/forfeit`, { reason }),

  // Ratings
  listAllRatings: () => apiClient.get<PlayerRating[]>(`${BASE}/ratings`),
  ratingsForUser: (userId: number) => apiClient.get<PlayerRating[]>(`${BASE}/ratings/user/${userId}`),
  averageRating: (userId: number) => apiClient.get<{ userId: number; average: number }>(`${BASE}/ratings/user/${userId}/average`),
  submitRating: (data: Partial<PlayerRating>) => apiClient.post<PlayerRating>(`${BASE}/ratings`, data),

  // Coach Packages
  listPackages: () => apiClient.get<CoachPackage[]>(`${BASE}/coach-packages`),
  createPackage: (data: Partial<CoachPackage>) => apiClient.post<CoachPackage>(`${BASE}/coach-packages`, data),
  enrollPackage: (packageId: number) => apiClient.post<CoachPackageEnrollment>(`${BASE}/coach-packages/${packageId}/enroll`, {}),
  listEnrollments: () => apiClient.get<CoachPackageEnrollment[]>(`${BASE}/coach-packages/enrollments`),
  recordSession: (enrollmentId: number) => apiClient.put<CoachPackageEnrollment>(`${BASE}/coach-packages/enrollments/${enrollmentId}/record-session`, {}),

  // Referees
  listReferees: () => apiClient.get<RefereeAssignment[]>(`${BASE}/referees`),
  myRefereeAssignments: () => apiClient.get<RefereeAssignment[]>(`${BASE}/referees/my`),
  assignReferee: (data: Partial<RefereeAssignment>) => apiClient.post<RefereeAssignment>(`${BASE}/referees`, data),
  confirmReferee: (id: number) => apiClient.put<RefereeAssignment>(`${BASE}/referees/${id}/confirm`, {}),
};
