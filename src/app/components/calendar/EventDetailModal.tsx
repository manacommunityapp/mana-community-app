import { useState } from "react";
import { X, Bell, MapPin, ExternalLink, Clock, Calendar, Trash2, Edit2 } from "lucide-react";
import { CalendarEventDto, calendarService } from "../../../services/calendar/calendarService";
import { CALENDAR_CONFIG } from "./calendarConfig";

interface Props {
  event: CalendarEventDto;
  onClose: () => void;
  onEdit?: (event: CalendarEventDto) => void;
  onDelete?: (id: string) => void;
  onReminderChanged?: () => void;
}

const REMINDER_OPTIONS = [
  { label: "None", value: -1 },
  { label: "15 min before", value: 15 },
  { label: "30 min before", value: 30 },
  { label: "1 hour before", value: 60 },
  { label: "1 day before", value: 1440 },
];

function fmtDatetime(iso: string, tz?: string) {
  return new Date(iso).toLocaleString("en-IN", {
    weekday: "short", year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: true,
    timeZone: tz || Intl.DateTimeFormat().resolvedOptions().timeZone,
  });
}

function buildSingleIcs(event: CalendarEventDto): string {
  const esc = (s: string) => s.replace(/[,;\\]/g, "\\$&").replace(/\n/g, "\\n");
  const dtFmt = (iso: string) => iso.replace(/[-:]/g, "").replace(/\.\d+/, "");
  const lines = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Mana//Calendar//EN",
    "BEGIN:VEVENT",
    `UID:${event.id}@mana`,
    `DTSTAMP:${dtFmt(new Date().toISOString())}`,
    event.allDay ? `DTSTART;VALUE=DATE:${event.startTime.substring(0, 10).replace(/-/g, "")}` : `DTSTART:${dtFmt(event.startTime)}`,
    event.allDay ? `DTEND;VALUE=DATE:${event.endTime.substring(0, 10).replace(/-/g, "")}` : `DTEND:${dtFmt(event.endTime)}`,
    `SUMMARY:${esc(event.title)}`,
    event.description ? `DESCRIPTION:${esc(event.description)}` : "",
    event.location ? `LOCATION:${esc(event.location)}` : "",
    "END:VEVENT", "END:VCALENDAR",
  ].filter(Boolean);
  return lines.join("\r\n");
}

export function EventDetailModal({ event, onClose, onEdit, onDelete, onReminderChanged }: Props) {
  const cfg = CALENDAR_CONFIG[event.calendarType];
  const isPersonal = event.eventSource === "PERSONAL";
  const [reminderVal, setReminderVal] = useState(event.hasReminder ? 15 : -1);
  const [savingReminder, setSavingReminder] = useState(false);

  const handleReminderSave = async () => {
    setSavingReminder(true);
    try {
      if (reminderVal === -1) {
        await calendarService.removeReminder(event.eventSource, event.sourceId);
      } else {
        await calendarService.setReminder(event.eventSource, event.sourceId, reminderVal, event.startTime);
      }
      onReminderChanged?.();
    } catch {
      // silent
    } finally {
      setSavingReminder(false);
    }
  };

  const handleAddToCalendar = () => {
    const ics = buildSingleIcs(event);
    const blob = new Blob([ics], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${event.title.replace(/\s+/g, "-")}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const isAddress = (loc: string) => /^\d|^[A-Z][a-z]+,/.test(loc);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9000,
      background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
    }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: "var(--card)", borderRadius: 16, width: "100%", maxWidth: 480,
        border: "1px solid rgba(148,163,184,0.15)", overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
      }}>
        {/* Header */}
        <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(148,163,184,0.1)", display: "flex", alignItems: "flex-start", gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span style={{
                fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 10,
                background: `${event.color || cfg.color}18`, color: event.color || cfg.color,
              }}>
                {cfg.icon} {cfg.label}
              </span>
              {event.isCancelled && (
                <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 10, background: "#FEE2E2", color: "#DC2626" }}>
                  CANCELLED
                </span>
              )}
            </div>
            <h2 style={{
              fontSize: 17, fontWeight: 800, color: "var(--text)", margin: "6px 0 0",
              textDecoration: event.isCancelled ? "line-through" : "none",
            }}>
              {event.title}
            </h2>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Date/Time */}
          <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
            <Clock size={15} style={{ color: "var(--muted)", marginTop: 1, flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 13, color: "var(--text)", fontWeight: 600 }}>
                {event.allDay ? "All day" : fmtDatetime(event.startTime, event.timezone)}
              </div>
              {!event.allDay && (
                <div style={{ fontSize: 11, color: "var(--muted)" }}>
                  to {fmtDatetime(event.endTime, event.timezone)}
                </div>
              )}
            </div>
          </div>

          {/* Location */}
          {event.location && (
            <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
              <MapPin size={15} style={{ color: "var(--muted)", marginTop: 1, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: 13, color: "var(--text)" }}>{event.location}</span>
                {isAddress(event.location) && (
                  <a
                    href={`https://maps.google.com/?q=${encodeURIComponent(event.location)}`}
                    target="_blank" rel="noreferrer"
                    style={{ display: "inline-flex", alignItems: "center", gap: 3, marginLeft: 8, fontSize: 11, color: "#2563EB" }}
                  >
                    Map <ExternalLink size={10} />
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Description */}
          {event.description && (
            <div style={{ display: "flex", gap: 8 }}>
              <Calendar size={15} style={{ color: "var(--muted)", marginTop: 1, flexShrink: 0 }} />
              <p style={{ fontSize: 13, color: "var(--muted)", margin: 0, lineHeight: 1.5 }}>{event.description}</p>
            </div>
          )}

          {/* Reminder */}
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <Bell size={15} style={{ color: "var(--muted)", flexShrink: 0 }} />
            <select
              value={reminderVal}
              onChange={(e) => setReminderVal(Number(e.target.value))}
              style={{
                flex: 1, fontSize: 12, padding: "6px 10px", borderRadius: 8,
                border: "1px solid rgba(148,163,184,0.2)", background: "var(--card)", color: "var(--text)",
              }}
            >
              {REMINDER_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <button
              onClick={handleReminderSave}
              disabled={savingReminder}
              style={{
                fontSize: 12, fontWeight: 600, padding: "6px 14px", borderRadius: 8, border: "none",
                background: "#2563EB", color: "#fff", cursor: "pointer", opacity: savingReminder ? 0.6 : 1,
              }}
            >
              Save
            </button>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: "12px 20px", borderTop: "1px solid rgba(148,163,184,0.1)",
          display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap",
        }}>
          <button
            onClick={handleAddToCalendar}
            style={{
              fontSize: 11, fontWeight: 600, padding: "7px 14px", borderRadius: 8, border: "1px solid rgba(148,163,184,0.2)",
              background: "transparent", color: "var(--muted)", cursor: "pointer", display: "flex", alignItems: "center", gap: 5,
            }}
          >
            <Calendar size={12} /> Add to phone calendar
          </button>
          <div style={{ flex: 1 }} />
          {isPersonal && onDelete && (
            <button
              onClick={() => onDelete(event.id)}
              style={{
                fontSize: 11, fontWeight: 600, padding: "7px 12px", borderRadius: 8, border: "none",
                background: "#FEE2E2", color: "#DC2626", cursor: "pointer", display: "flex", alignItems: "center", gap: 5,
              }}
            >
              <Trash2 size={12} /> Delete
            </button>
          )}
          {isPersonal && onEdit && (
            <button
              onClick={() => onEdit(event)}
              style={{
                fontSize: 11, fontWeight: 600, padding: "7px 14px", borderRadius: 8, border: "none",
                background: "#2563EB", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", gap: 5,
              }}
            >
              <Edit2 size={12} /> Edit
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
