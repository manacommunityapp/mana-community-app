import { apiClient } from "../common/apiClient";

export interface EventProgramResponse {
  id: number;
  eventId: number;
  eventTitle: string;
  dayLabel: string | null;
  dayDate: string | null;
  title: string;
  programType: string | null;
  activityType?: string | null;
  startTime: string | null;
  duration: string | null;
  venue: string | null;
  performer: string | null;
  judge: string | null;
  sortOrder: number;
  capacity: number | null;
  requiresRegistration: boolean;
  requiresApproval: boolean;
  allowWaitlist: boolean;
  maxPerRegistration: number;
  registeredCount?: number;
  spotsLeft?: number;
  slotStatus?: string;
  waitlistEnabled?: boolean;
  createdAt: string;
}

export interface EventProgramRequest {
  eventId: number;
  title: string;
  dayLabel?: string;
  dayDate?: string;
  programType?: string;
  activityType?: string;
  startTime?: string;
  duration?: string;
  venue?: string;
  performer?: string;
  judge?: string;
  sortOrder?: number;
  capacity?: number;
  requiresRegistration?: boolean;
  requiresApproval?: boolean;
  allowWaitlist?: boolean;
  maxPerRegistration?: number;
  waitlistEnabled?: boolean;
}

export interface ActivityRegistrationParticipant {
  fullName: string;
  age?: number;
  gender?: string;
  relationship?: string;
  email?: string;
  phone?: string;
  customData?: Record<string, unknown>;
}

export interface ActivityRegistrationRequest {
  headCount?: number;
  registrationType?: string;
  primaryName?: string;
  primaryEmail?: string;
  primaryPhone?: string;
  idempotencyKey?: string;
  customData?: Record<string, unknown>;
  participants?: ActivityRegistrationParticipant[];
}

export interface ActivityRegistrationResponse {
  id: number;
  programId: number;
  programTitle: string;
  eventId: number;
  eventTitle: string;
  userId: number;
  userName: string;
  userEmail: string;
  headCount: number;
  registrationType: string;
  primaryName: string | null;
  primaryEmail: string | null;
  primaryPhone: string | null;
  status: string;
  spotsLeft: number;
  waitlistPosition: number | null;
  decisionReason: string | null;
  approvedById: number | null;
  approvedByName: string | null;
  approvedAt: string | null;
  registeredAt: string;
  participants: ActivityRegistrationParticipant[];
  customData: Record<string, unknown>;
}

export interface MealRegistrationRequest {
  eventId: number;
  dietaryPref: string;
  allergies?: string;
  meals: { date: string; lunch: boolean; dinner: boolean; headCount: number }[];
}

export interface MealRegistrationResponse {
  eventId: number;
  userId: number;
  dietaryPref: string | null;
  allergies: string | null;
  meals: { date: string; lunch: boolean; dinner: boolean; headCount: number }[];
}

export interface MealSummaryResponse {
  eventId: number;
  days: { date: string; lunch: MealBreakdown; dinner: MealBreakdown }[];
}

interface MealBreakdown {
  totalHeads: number;
  veg: number;
  vegan: number;
  jain: number;
  nonveg: number;
}

export const eventProgramService = {
  async getByEvent(eventId: number, dayLabel?: string): Promise<EventProgramResponse[]> {
    let qs = `?eventId=${eventId}`;
    if (dayLabel) qs += `&dayLabel=${encodeURIComponent(dayLabel)}`;
    return apiClient.get<EventProgramResponse[]>(`/events/programs${qs}`);
  },

  async create(data: EventProgramRequest): Promise<EventProgramResponse> {
    return apiClient.post<EventProgramResponse>("/events/programs", data);
  },

  async update(id: number, data: EventProgramRequest): Promise<EventProgramResponse> {
    return apiClient.put<EventProgramResponse>(`/events/programs/${id}`, data);
  },

  async deleteProgram(id: number): Promise<void> {
    await apiClient.delete<void>(`/events/programs/${id}`);
  },

  async joinActivity(programId: number, headCount = 1): Promise<ActivityRegistrationResponse> {
    return this.registerActivity(programId, { headCount });
  },

  async registerActivity(programId: number, data: ActivityRegistrationRequest): Promise<ActivityRegistrationResponse> {
    return apiClient.post<ActivityRegistrationResponse>(
      `/events/programs/${programId}/registrations`,
      data,
    );
  },

  async cancelActivityRegistration(registrationId: number): Promise<ActivityRegistrationResponse> {
    return apiClient.put<ActivityRegistrationResponse>(`/events/activity-registrations/${registrationId}/cancel`, {});
  },

  async approveActivityRegistration(registrationId: number): Promise<ActivityRegistrationResponse> {
    return apiClient.put<ActivityRegistrationResponse>(`/events/activity-registrations/${registrationId}/approve`, {});
  },

  async rejectActivityRegistration(registrationId: number, reason?: string): Promise<ActivityRegistrationResponse> {
    return apiClient.put<ActivityRegistrationResponse>(
      `/events/activity-registrations/${registrationId}/reject`,
      reason ? { reason } : {},
    );
  },

  async leaveActivity(programId: number): Promise<void> {
    const registrations = await this.getActivityRegistrations(programId);
    const mine = registrations[0];
    if (mine) await this.cancelActivityRegistration(mine.id);
  },

  async getActivityRegistrations(programId: number): Promise<ActivityRegistrationResponse[]> {
    return apiClient.get<ActivityRegistrationResponse[]>(
      `/events/programs/${programId}/registrations`,
    );
  },

  async saveMeals(eventId: number, data: MealRegistrationRequest): Promise<MealRegistrationResponse> {
    return apiClient.post<MealRegistrationResponse>(`/events/${eventId}/meals`, data);
  },

  async getUserMeals(eventId: number): Promise<MealRegistrationResponse> {
    return apiClient.get<MealRegistrationResponse>(`/events/${eventId}/meals`);
  },

  async getMealSummary(eventId: number): Promise<MealSummaryResponse> {
    return apiClient.get<MealSummaryResponse>(`/events/${eventId}/meals/summary`);
  },
};
