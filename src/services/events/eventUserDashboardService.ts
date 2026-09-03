import { apiClient } from "../common/apiClient";

// ── Response types ───────────────────────────────────────────────────────────

export interface ActivityFlags {
  hasPooja: boolean;
  hasMeal: boolean;
  hasCultural: boolean;
  poojaCount?: number;
  mealCount?: number;
  culturalCount?: number;
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
  needsRegistration?: boolean;
  requiresRegistration?: boolean;
  isRegistrationRequired?: boolean;
  activitySummary: ActivityFlags;
}

export interface UserPassSummaryView {
  totalPasses: number;
  poojaPasses: number;
  mealPasses: number;
  culturalPasses: number;
  generalPasses: number;
}

export interface UserStats {
  upcomingCount: number;
  myRegistrationsCount: number;
  myPoojaCount: number;
  myMealCount: number;
  myCulturalCount: number;
  totalPassesCount?: number;
  myPoojaPassesCount?: number;
  myMealPassesCount?: number;
  myCulturalPassesCount?: number;
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

export interface FamilyMemberItem {
  id: number;
  name: string;
  relation?: string | null;
  age?: number | null;
  gender?: string | null;
  gothram?: string | null;
  phone?: string | null;
  dob?: string | null;
}

export interface DashboardPayload {
  stats: UserStats;
  upcomingEvents: EventCardItem[];
  myRegistrations: MyRegistrationItem[];
  pendingActions: PendingItem[];
  passSummary?: UserPassSummaryView | null;
  familyMembers?: FamilyMemberItem[];
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

export interface PoojaScheduledActivityView {
  id: number;
  name: string;
  type: string;
  date: string | null;
  endDate: string | null;
  startTime: string | null;
  endTime: string | null;
  isFree: boolean;
  fee: number;
  slots: number;
  needsRegistration: boolean;
  status: string;
}

export interface LunchDinnerDashboardView {
  id: number;
  name: string;
  mealType: string;
  date: string | null;
  startTime: string | null;
  endTime: string | null;
  venue: string | null;
  targetPlates: number | null;
  isFree: boolean;
  fee: number | null;
  dietType: string | null;
  needsRegistration: boolean;
}

export interface CulturalScheduledActivityView {
  id: number;
  name: string;
  category: string;
  perfType: string | null;
  ageGroup: string | null;
  date: string | null;
  startTime: string | null;
  duration: number | null;
  stage: string | null;
  needsRegistration: boolean;
  capacity: number | null;
  regDeadline: string | null;
  sortOrder: number | null;
  status: string;
}

export interface ScheduledActivitiesPayload {
  eventId: number;
  livePoojaCount: number;
  liveMealCount: number;
  liveCulturalCount: number;
  poojaActivities: PoojaScheduledActivityView[];
  meals: LunchDinnerDashboardView[];
  culturalActivities: CulturalScheduledActivityView[];
}

// ── Service ──────────────────────────────────────────────────────────────────

export const eventUserDashboardService = {
  /** Single mount call — returns consolidated dashboard, events, and pass summary. */
  getDashboard: (): Promise<DashboardPayload> =>
    apiClient.get<DashboardPayload>("/events/user-dashboard"),

  /** Full event detail — called only when the detail modal opens. */
  getEventDetail: (eventId: number): Promise<unknown> =>
    apiClient.get<unknown>(`/events/user-dashboard/${eventId}/detail`),

  /** Activity registrations for one event — lazy, modal-only. */
  getMyActivities: (eventId: number): Promise<MyActivitiesPayload> =>
    apiClient.get<MyActivitiesPayload>(`/events/user-dashboard/${eventId}/my-activities`),

  /** Consolidated scheduled activities (pooja, meal, cultural) for an event. */
  getScheduledActivities: (eventId: number): Promise<ScheduledActivitiesPayload> =>
    apiClient.get<ScheduledActivitiesPayload>(`/events/user-dashboard/${eventId}/scheduled-activities`),

  /** Live scheduled Pooja / Seva activities for an event. */
  getPoojaActivities: (eventId: number): Promise<PoojaScheduledActivityView[]> =>
    apiClient.get<PoojaScheduledActivityView[]>(`/events/user-dashboard/${eventId}/pooja-activities`),

  /** Live scheduled Lunch / Dinner meal activities for an event. */
  getMealActivities: (eventId: number): Promise<LunchDinnerDashboardView[]> =>
    apiClient.get<LunchDinnerDashboardView[]>(`/events/user-dashboard/${eventId}/meal-activities`),

  /** Live scheduled Cultural activities for an event (registration-required only). */
  getCulturalActivities: (eventId: number): Promise<CulturalScheduledActivityView[]> =>
    apiClient.get<CulturalScheduledActivityView[]>(`/events/user-dashboard/${eventId}/cultural-activities`),

  // ── All-activities variants (needsRegistration = true AND false) ────────────

  /** ALL scheduled activities (pooja, meals, cultural) — including open-to-all (needsRegistration = false). */
  getAllScheduledActivities: (eventId: number): Promise<ScheduledActivitiesPayload> =>
    apiClient.get<ScheduledActivitiesPayload>(`/events/user-dashboard/${eventId}/all-scheduled-activities`),

  /** ALL active pooja/seva activities — including open-to-all sevas. */
  getAllPoojaActivities: (eventId: number): Promise<PoojaScheduledActivityView[]> =>
    apiClient.get<PoojaScheduledActivityView[]>(`/events/user-dashboard/${eventId}/all-pooja-activities`),

  /** ALL active upcoming meals — including open/free meals. */
  getAllMealActivities: (eventId: number): Promise<LunchDinnerDashboardView[]> =>
    apiClient.get<LunchDinnerDashboardView[]>(`/events/user-dashboard/${eventId}/all-meal-activities`),

  /** ALL active upcoming cultural activities — including open performances. */
  getAllCulturalActivities: (eventId: number): Promise<CulturalScheduledActivityView[]> =>
    apiClient.get<CulturalScheduledActivityView[]>(`/events/user-dashboard/${eventId}/all-cultural-activities`),

  // ── Open-to-all variants (needsRegistration = false only) ───────────────────

  /** Open-to-all scheduled activities (pooja, meals, cultural) where registration is NOT required. */
  getOpenScheduledActivities: (eventId: number): Promise<ScheduledActivitiesPayload> =>
    apiClient.get<ScheduledActivitiesPayload>(`/events/user-dashboard/${eventId}/open-scheduled-activities`),

  /** User's pass and devotee breakdown across the community or scoped to an event. */
  getPassesSummary: (eventId?: number): Promise<UserPassSummaryView> =>
    apiClient.get<UserPassSummaryView>(
      eventId != null
        ? `/events/user-dashboard/${eventId}/passes-summary`
        : `/events/user-dashboard/passes-summary`
    ),

  /** Fast slim family members list for devotee selection. */
  getFamilyMembers: (): Promise<FamilyMemberItem[]> =>
    apiClient.get<FamilyMemberItem[]>("/events/user-dashboard/family-members"),
};

