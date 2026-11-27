import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { CalendarEventDto, PersonalEventRequest, CalendarType, calendarService } from "../../../services/calendar/calendarService";
import { CALENDAR_CONFIG, ALL_CALENDAR_TYPES } from "./calendarConfig";

interface Props {
  event?: CalendarEventDto;
  defaultDate?: Date;
  onClose: () => void;
  onSaved: () => void;
}

const PRESET_COLORS = ["#2563EB", "#7C3AED", "#059669", "#D97706", "#DC2626", "#0891B2", "#DB2777", "#6B7280"];

type Recurrence = "NONE" | "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";

function buildRrule(rec: Recurrence): string | undefined {
  if (rec === "NONE") return undefined;
  const freqMap: Record<Recurrence, string> = { NONE: "", DAILY: "DAILY", WEEKLY: "WEEKLY", MONTHLY: "MONTHLY", YEARLY: "YEARLY" };
  return `FREQ=${freqMap[rec]}`;
}

function toLocalDT(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromLocalDT(local: string): string {
  if (!local) return "";
  return new Date(local).toISOString();
}

function defaultStart(d?: Date): string {
  const base = d ? new Date(d) : new Date();
  base.setMinutes(0, 0, 0);
  base.setHours(base.getHours() + 1);
  return toLocalDT(base.toISOString());
}

function defaultEnd(start: string): string {
  if (!start) return "";
  const d = new Date(start);
  d.setHours(d.getHours() + 1);
  return toLocalDT(d.toISOString());
}

export function PersonalEventModal({ event, defaultDate, onClose, onSaved }: Props) {
  const editing = Boolean(event);
  const [title, setTitle] = useState(event?.title ?? "");
  const [calType, setCalType] = useState<CalendarType>(event?.calendarType ?? "MY_CALENDAR");
  const [startDT, setStartDT] = useState(event ? toLocalDT(event.startTime) : defaultStart(defaultDate));
  const [endDT, setEndDT] = useState(event ? toLocalDT(event.endTime) : "");
  const [allDay, setAllDay] = useState(event?.allDay ?? false);
  const [location, setLocation] = useState(event?.location ?? "");
  const [description, setDescription] = useState(event?.description ?? "");
  const [recurrence, setRecurrence] = useState<Recurrence>("NONE");
  const [color, setColor] = useState(event?.color ?? PRESET_COLORS[0]);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!endDT && startDT) setEndDT(defaultEnd(startDT));
  }, []);

  const handleStartChange = (v: string) => {
    setStartDT(v);
    if (endDT < v) setEndDT(defaultEnd(v));
  };

  const handleSave = async () => {
    if (!title.trim()) { setErr("Title is required"); return; }
    if (!startDT) { setErr("Start time is required"); return; }
    if (!allDay && !endDT) { setErr("End time is required"); return; }

    setSaving(true);
    setErr(null);
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const req: PersonalEventRequest = {
      title: title.trim(),
      description: description.trim() || undefined,
      location: location.trim() || undefined,
      startTime: fromLocalDT(startDT),
      endTime: allDay ? fromLocalDT(startDT) : fromLocalDT(endDT),
      allDay,
      timezone: tz,
      calendarType: calType,
      rrule: buildRrule(recurrence),
      color,
    };

    try {
      if (editing && event) {
        await calendarService.updatePersonal(event.id, req);
      } else {
        await calendarService.createPersonal(req);
      }
      onSaved();
      onClose();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Failed to save event";
      setErr(msg);
    } finally {
      setSaving(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", fontSize: 13, padding: "8px 12px", borderRadius: 8, boxSizing: "border-box",
    border: "1px solid rgba(148,163,184,0.2)", background: "var(--card)", color: "var(--text)",
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9100, background: "rgba(0,0,0,0.5)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
    }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: "var(--card)", borderRadius: 16, width: "100%", maxWidth: 480, maxHeight: "90vh",
        border: "1px solid rgba(148,163,184,0.15)", overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
        display: "flex", flexDirection: "column",
      }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(148,163,184,0.1)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: "var(--text)", margin: 0 }}>
            {editing ? "Edit Event" : "New Event"}
          </h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)" }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: "16px 20px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 14 }}>
          {err && <div style={{ fontSize: 12, color: "#DC2626", padding: "8px 12px", background: "#FEE2E2", borderRadius: 8 }}>{err}</div>}

          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", display: "block", marginBottom: 5 }}>TITLE *</label>
            <input style={inputStyle} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Event title" />
          </div>

          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", display: "block", marginBottom: 5 }}>CALENDAR</label>
            <select style={inputStyle} value={calType} onChange={(e) => setCalType(e.target.value as CalendarType)}>
              {ALL_CALENDAR_TYPES.map((ct) => (
                <option key={ct} value={ct}>{CALENDAR_CONFIG[ct].icon} {CALENDAR_CONFIG[ct].label}</option>
              ))}
            </select>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input type="checkbox" id="allday" checked={allDay} onChange={(e) => setAllDay(e.target.checked)} />
            <label htmlFor="allday" style={{ fontSize: 13, color: "var(--text)", cursor: "pointer" }}>All day</label>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", display: "block", marginBottom: 5 }}>START *</label>
              <input
                style={inputStyle}
                type={allDay ? "date" : "datetime-local"}
                value={startDT}
                onChange={(e) => handleStartChange(e.target.value)}
              />
            </div>
            {!allDay && (
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", display: "block", marginBottom: 5 }}>END *</label>
                <input style={inputStyle} type="datetime-local" value={endDT} onChange={(e) => setEndDT(e.target.value)} />
              </div>
            )}
          </div>

          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", display: "block", marginBottom: 5 }}>LOCATION</label>
            <input style={inputStyle} value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Optional location" />
          </div>

          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", display: "block", marginBottom: 5 }}>DESCRIPTION</label>
            <textarea
              style={{ ...inputStyle, height: 72, resize: "vertical" }}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional notes…"
            />
          </div>

          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", display: "block", marginBottom: 5 }}>REPEAT</label>
            <select style={inputStyle} value={recurrence} onChange={(e) => setRecurrence(e.target.value as Recurrence)}>
              <option value="NONE">No repeat</option>
              <option value="DAILY">Daily</option>
              <option value="WEEKLY">Weekly</option>
              <option value="MONTHLY">Monthly</option>
              <option value="YEARLY">Yearly</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", display: "block", marginBottom: 8 }}>COLOR</label>
            <div style={{ display: "flex", gap: 8 }}>
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  style={{
                    width: 26, height: 26, borderRadius: "50%", border: color === c ? `3px solid #fff` : "2px solid transparent",
                    background: c, cursor: "pointer",
                    outline: color === c ? `2px solid ${c}` : "none",
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        <div style={{ padding: "12px 20px", borderTop: "1px solid rgba(148,163,184,0.1)", display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ fontSize: 13, padding: "8px 18px", borderRadius: 8, border: "1px solid rgba(148,163,184,0.2)", background: "transparent", color: "var(--muted)", cursor: "pointer" }}>
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{ fontSize: 13, fontWeight: 700, padding: "8px 20px", borderRadius: 8, border: "none", background: "#2563EB", color: "#fff", cursor: "pointer", opacity: saving ? 0.6 : 1 }}
          >
            {saving ? "Saving…" : editing ? "Save Changes" : "Create Event"}
          </button>
        </div>
      </div>
    </div>
  );
}
