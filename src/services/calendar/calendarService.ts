import { apiClient } from "../common/apiClient";

export type CalendarType =
  | "MY_CALENDAR"
  | "FAMILY_CALENDAR"
  | "COMMUNITY_CALENDAR"
  | "SPORTS_CALENDAR"
  | "PAYMENT_DUES"
  | "APPOINTMENT_CALENDAR"
  | "STAFF_SCHEDULE"
  | "TRIP_EVENT_CALENDAR";

export interface CalendarEventDto {
  id: string;
  title: string;
  description?: string;
  location?: string;
  startTime: string;
  endTime: string;
  allDay: boolean;
  timezone: string;
  calendarType: CalendarType;
  eventSource: string;
  sourceId: string;
  color: string;
  isCancelled: boolean;
  hasReminder: boolean;
  deepLinkType: string;
  deepLinkId: string;
  metadata?: Record<string, unknown>;
}

export interface PersonalEventRequest {
  title: string;
  description?: string;
  location?: string;
  startTime: string;
  endTime: string;
  allDay?: boolean;
  timezone?: string;
  calendarType: CalendarType;
  rrule?: string;
  color?: string;
}

export const calendarService = {
  getEvents: (from: string, to: string, calendars?: CalendarType[], tz?: string): Promise<CalendarEventDto[]> => {
    const params = new URLSearchParams({ from, to });
    if (calendars?.length) params.set("calendars", calendars.join(","));
    if (tz) params.set("tz", tz);
    return apiClient.get<CalendarEventDto[]>(`/calendar/events?${params}`, { bypassCache: true });
  },

  createPersonal: (req: PersonalEventRequest): Promise<CalendarEventDto> =>
    apiClient.post<CalendarEventDto>("/calendar/personal", req),

  updatePersonal: (id: string, req: PersonalEventRequest): Promise<CalendarEventDto> =>
    apiClient.put<CalendarEventDto>(`/calendar/personal/${id}`, req),

  deletePersonal: (id: string): Promise<void> =>
    apiClient.delete<void>(`/calendar/personal/${id}`),

  setReminder: (eventSource: string, sourceId: string, minutesBefore: number, eventStartTime: string): Promise<void> =>
    apiClient.post<void>("/calendar/reminders", { eventSource, sourceId, minutesBefore, eventStartTime }),

  removeReminder: (eventSource: string, sourceId: string): Promise<void> =>
    apiClient.delete<void>(`/calendar/reminders?eventSource=${eventSource}&sourceId=${sourceId}`),

  exportIcsUrl: (from: string, to: string, calendars?: CalendarType[]): string => {
    const params = new URLSearchParams({ from, to });
    if (calendars?.length) params.set("calendars", calendars.join(","));
    return `/api/calendar/ics?${params}`;
  },
};
