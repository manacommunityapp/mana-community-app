import { apiClient } from "./common/apiClient";
import type {
  CalendarDomain,
  CalendarEventItem,
  CreateCalendarEventRequest,
  CalendarMonthSummary,
} from "../types/manaCalendar";

export const manaCalendarService = {
  getTimeline: async (params?: {
    from?: string;
    to?: string;
    domain?: CalendarDomain;
    onlyMine?: boolean;
    q?: string;
  }): Promise<CalendarEventItem[]> => {
    const qp = new URLSearchParams();
    if (params?.from) qp.append("from", params.from);
    if (params?.to) qp.append("to", params.to);
    if (params?.domain) qp.append("domain", params.domain);
    if (params?.onlyMine) qp.append("onlyMine", "true");
    if (params?.q) qp.append("q", params.q);

    return apiClient.get<CalendarEventItem[]>(`/calendar/timeline?${qp.toString()}`);
  },

  createEvent: async (req: CreateCalendarEventRequest): Promise<CalendarEventItem> => {
    return apiClient.post<CalendarEventItem>("/calendar/events", req);
  },

  getMonthSummary: async (month?: string): Promise<CalendarMonthSummary> => {
    const q = month ? `?month=${month}` : "";
    return apiClient.get<CalendarMonthSummary>(`/calendar/month-summary${q}`);
  },
};
