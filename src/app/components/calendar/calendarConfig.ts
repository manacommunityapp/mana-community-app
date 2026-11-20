import { CalendarType } from "../../../services/calendar/calendarService";

export const CALENDAR_CONFIG: Record<CalendarType, { label: string; color: string; icon: string }> = {
  MY_CALENDAR:          { label: "My Calendar",    color: "#2563EB", icon: "📅" },
  FAMILY_CALENDAR:      { label: "Family",         color: "#7C3AED", icon: "👨‍👩‍👧" },
  COMMUNITY_CALENDAR:   { label: "Community",      color: "#059669", icon: "🏘️" },
  SPORTS_CALENDAR:      { label: "Sports",         color: "#D97706", icon: "⚽" },
  PAYMENT_DUES:         { label: "Payments",       color: "#DC2626", icon: "💳" },
  APPOINTMENT_CALENDAR: { label: "Appointments",   color: "#0891B2", icon: "🩺" },
  STAFF_SCHEDULE:       { label: "Staff",          color: "#6B7280", icon: "🔧" },
  TRIP_EVENT_CALENDAR:  { label: "Trips & Events", color: "#DB2777", icon: "✈️" },
};

export const ALL_CALENDAR_TYPES = Object.keys(CALENDAR_CONFIG) as CalendarType[];
