import { Bell, MapPin } from "lucide-react";
import { CalendarEventDto } from "../../../services/calendar/calendarService";
import { CALENDAR_CONFIG } from "./calendarConfig";

interface Props {
  event: CalendarEventDto;
  compact?: boolean;
  onClick?: (event: CalendarEventDto) => void;
}

function fmtTime(iso: string, tz?: string): string {
  return new Date(iso).toLocaleTimeString("en-IN", {
    hour: "2-digit", minute: "2-digit", hour12: true,
    timeZone: tz || Intl.DateTimeFormat().resolvedOptions().timeZone,
  });
}

export function CalendarEventCard({ event, compact, onClick }: Props) {
  const cfg = CALENDAR_CONFIG[event.calendarType];

  if (compact) {
    return (
      <div
        onClick={() => onClick?.(event)}
        style={{
          display: "flex", alignItems: "center", gap: 4, cursor: "pointer",
          opacity: event.isCancelled ? 0.45 : 1,
          borderLeft: `2px solid ${event.color || cfg.color}`,
          paddingLeft: 4, marginBottom: 2,
          borderRadius: "0 4px 4px 0",
          background: `${event.color || cfg.color}12`,
        }}
      >
        <span style={{
          fontSize: 10, fontWeight: 600, color: event.color || cfg.color,
          textDecoration: event.isCancelled ? "line-through" : "none",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          maxWidth: "100%",
        }}>
          {event.title}
        </span>
      </div>
    );
  }

  return (
    <div
      onClick={() => onClick?.(event)}
      style={{
        display: "flex", alignItems: "flex-start", gap: 10,
        padding: "10px 12px", borderRadius: 10, cursor: "pointer",
        border: "1px solid rgba(148,163,184,0.1)",
        background: "var(--card)",
        opacity: event.isCancelled ? 0.5 : 1,
        marginBottom: 6,
        borderLeft: `3px solid ${event.color || cfg.color}`,
        transition: "opacity 0.1s",
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text)", textDecoration: event.isCancelled ? "line-through" : "none" }}>
            {event.title}
          </span>
          {event.hasReminder && <Bell size={11} style={{ color: event.color || cfg.color, flexShrink: 0 }} />}
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 3, flexWrap: "wrap" }}>
          {!event.allDay && (
            <span style={{ fontSize: 10, color: "var(--muted)" }}>
              {fmtTime(event.startTime, event.timezone)} – {fmtTime(event.endTime, event.timezone)}
            </span>
          )}
          {event.allDay && <span style={{ fontSize: 10, color: "var(--muted)" }}>All day</span>}
          {event.location && (
            <span style={{ fontSize: 10, color: "var(--muted)", display: "flex", alignItems: "center", gap: 2 }}>
              <MapPin size={9} /> {event.location}
            </span>
          )}
        </div>
        {event.isCancelled && (
          <span style={{ fontSize: 9, fontWeight: 700, color: "#DC2626", marginTop: 2, display: "inline-block" }}>CANCELLED</span>
        )}
      </div>
      <span style={{
        fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 10, whiteSpace: "nowrap",
        background: `${event.color || cfg.color}18`, color: event.color || cfg.color,
      }}>
        {cfg.icon} {cfg.label}
      </span>
    </div>
  );
}
