import { apiClient } from "../common/apiClient";

export interface EventProgramResponse {
  id: number;
  eventId: number;
  eventTitle: string;
  dayLabel: string | null;
  dayDate: string | null;
  title: string;
  programType: string | null;
  activityType: string | null;
  startTime: string | null;
  duration: string | null;
  venue: string | null;
  performer: string | null;
  judge: string | null;
  sortOrder: number;
  capacity: number | null;
  requiresRegistration: boolean;
  registeredCount: number;
  spotsLeft: number;
  slotStatus: string;
  waitlistEnabled: boolean;
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
  waitlistEnabled?: boolean;
}

export interface ActivityRegistrationResponse {
  id: number;
  programId: number;
  programTitle: string;
  userId: number;
  userName: string;
  headCount: number;
  status: string;
  spotsLeft: number;
  registeredAt: string;
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
    return apiClient.post<ActivityRegistrationResponse>(
      `/events/programs/${programId}/register`,
      { headCount },
    );
  },

  async leaveActivity(programId: number): Promise<void> {
    await apiClient.delete<void>(`/events/programs/${programId}/register`);
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
