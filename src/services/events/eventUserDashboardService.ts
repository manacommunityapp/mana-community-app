import { apiClient } from "../common/apiClient";

// ── Response types ───────────────────────────────────────────────────────────

export interface ActivityFlags {
  hasPooja: boolean;
  hasMeal: boolean;
  hasCultural: boolean;
}

export interface EventCardItem {
  id: number;
  title: string;
  type: string;
  status: string;
  startDate: string;
  endDate: string | null;
  startTime: string | null;
  endTime: string | null;
  location: string | null;
  city: string | null;
  imageUrl: string | null;
  priceType: string;
  price: number | null;
  registered: boolean;
  attendeeCount: number;
  maxAttendees: number | null;
  registrationDeadline: string | null;
  activitySummary: ActivityFlags;
}

export interface UserStats {
  upcomingCount: number;
  myRegistrationsCount: number;
  myPoojaCount: number;
  myMealCount: number;
  myCulturalCount: number;
}

export interface MyRegistrationItem {
  registrationId: number;
  eventId: number;
  eventTitle: string | null;
  category: string | null;
  status: string;
  registeredAt: string | null;
  eventStartDate: string | null;
}

export interface PendingItem {
  id: string;
  type: string;
  message: string;
  eventId: number | null;
  eventTitle: string | null;
  priority: string;
}

export interface DashboardPayload {
  stats: UserStats;
  upcomingEvents: EventCardItem[];
  myRegistrations: MyRegistrationItem[];
  pendingActions: PendingItem[];
}

export interface ActivityItem {
  id: number;
  activityTitle: string | null;
  status: string;
  date: string | null;
  time: string | null;
  registeredAt: string | null;
}

export interface MyActivitiesPayload {
  eventId: number;
  pooja: ActivityItem[];
  meals: ActivityItem[];
  cultural: ActivityItem[];
}

// ── Service ──────────────────────────────────────────────────────────────────

export const eventUserDashboardService = {
  /** Single mount call — replaces the 10-call fan-out. */
  getDashboard: (): Promise<DashboardPayload> =>
    apiClient.get<DashboardPayload>("/events/user-dashboard"),

  /** Full event detail — called only when the detail modal opens. */
  getEventDetail: (eventId: number): Promise<unknown> =>
    apiClient.get<unknown>(`/events/user-dashboard/${eventId}/detail`),

  /** Activity registrations for one event — lazy, modal-only. */
  getMyActivities: (eventId: number): Promise<MyActivitiesPayload> =>
    apiClient.get<MyActivitiesPayload>(`/events/user-dashboard/${eventId}/my-activities`),
};
