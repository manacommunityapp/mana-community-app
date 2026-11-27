import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Plus, Download, Loader2 } from "lucide-react";
import { CalendarEventDto, CalendarType, calendarService } from "../../../services/calendar/calendarService";
import { useCalendar } from "../../../hooks/calendar/useCalendar";
import { CalendarTypeFilter } from "./CalendarTypeFilter";
import { CalendarEventCard } from "./CalendarEventCard";
import { EventDetailModal } from "./EventDetailModal";
import { PersonalEventModal } from "./PersonalEventModal";

type ViewMode = "month" | "agenda";
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function fmtMonthYear(d: Date) {
  return `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
}

function fmtDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

function prevMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() - 1, 1);
}
function nextMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 1);
}

function getMonthCells(d: Date): (Date | null)[] {
  const year = d.getFullYear(), month = d.getMonth();
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const cells: (Date | null)[] = [];
  for (let i = 0; i < first.getDay(); i++) cells.push(null);
  for (let day = 1; day <= last.getDate(); day++) cells.push(new Date(year, month, day));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function eventsOnDay(events: CalendarEventDto[], day: Date): CalendarEventDto[] {
  return events.filter((e) => {
    const start = new Date(e.startTime);
    const end = new Date(e.endTime);
    return day >= new Date(start.getFullYear(), start.getMonth(), start.getDate()) &&
           day <= new Date(end.getFullYear(), end.getMonth(), end.getDate());
  });
}

function agendaEvents(events: CalendarEventDto[], viewDate: Date): { date: Date; events: CalendarEventDto[] }[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
  const end = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0);
  const days: { date: Date; events: CalendarEventDto[] }[] = [];
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateEvents = eventsOnDay(events, new Date(d));
    if (dateEvents.length > 0) {
      days.push({ date: new Date(d), events: dateEvents.sort((a, b) => a.startTime.localeCompare(b.startTime)) });
    }
  }
  return days;
}

export function ManaCalendar() {
  const { viewDate, setViewDate, activeCalendars, toggleCalendar, events, loading, error, reload } = useCalendar();
  const [view, setView] = useState<ViewMode>("month");
  const [selectedDay, setSelectedDay] = useState<Date | null>(new Date());
  const [selectedEvent, setSelectedEvent] = useState<CalendarEventDto | null>(null);
  const [editEvent, setEditEvent] = useState<CalendarEventDto | undefined>(undefined);
  const [showCreate, setShowCreate] = useState(false);
  const [createDate, setCreateDate] = useState<Date | undefined>(undefined);

  const cells = useMemo(() => getMonthCells(viewDate), [viewDate.getFullYear(), viewDate.getMonth()]);
  const today = new Date();

  const handleAllCalendars = () => {
    // clearing active = show all
    activeCalendars.forEach((c) => toggleCalendar(c));
  };

  const handleExportIcs = () => {
    const from = fmtDate(new Date(viewDate.getFullYear(), viewDate.getMonth(), 1));
    const to = fmtDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0));
    window.location.href = calendarService.exportIcsUrl(from, to, activeCalendars.length ? activeCalendars : undefined);
  };

  const handleDelete = async (id: string) => {
    try {
      await calendarService.deletePersonal(id);
      setSelectedEvent(null);
      reload();
    } catch {
      // silent
    }
  };

  const selectedDayEvents = selectedDay ? eventsOnDay(events, selectedDay) : [];
  const agendaDays = useMemo(() => agendaEvents(events, viewDate), [events, viewDate.getFullYear(), viewDate.getMonth()]);

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "20px 16px" }}>
      {/* Top Bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={() => setViewDate(prevMonth(viewDate))} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", padding: 4 }}>
            <ChevronLeft size={20} />
          </button>
          <span style={{ fontSize: 18, fontWeight: 800, color: "var(--text)", minWidth: 180, textAlign: "center" }}>
            {fmtMonthYear(viewDate)}
          </span>
          <button onClick={() => setViewDate(nextMonth(viewDate))} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", padding: 4 }}>
            <ChevronRight size={20} />
          </button>
          <button onClick={() => setViewDate(new Date())} style={{ fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 8, border: "1px solid rgba(148,163,184,0.2)", background: "transparent", color: "var(--muted)", cursor: "pointer" }}>
            Today
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* View toggle */}
          <div style={{ display: "flex", borderRadius: 8, border: "1px solid rgba(148,163,184,0.2)", overflow: "hidden" }}>
            {(["month", "agenda"] as ViewMode[]).map((v) => (
              <button key={v} onClick={() => setView(v)} style={{
                fontSize: 11, fontWeight: 700, padding: "6px 14px", border: "none", cursor: "pointer",
                background: view === v ? "#2563EB" : "transparent",
                color: view === v ? "#fff" : "var(--muted)",
                textTransform: "capitalize",
              }}>{v}</button>
            ))}
          </div>

          <button onClick={handleExportIcs} style={{
            fontSize: 11, fontWeight: 700, padding: "6px 12px", borderRadius: 8, border: "1px solid rgba(148,163,184,0.2)",
            background: "transparent", color: "var(--muted)", cursor: "pointer", display: "flex", alignItems: "center", gap: 5,
          }}>
            <Download size={13} /> Export ICS
          </button>

          <button onClick={() => { setCreateDate(undefined); setShowCreate(true); }} style={{
            fontSize: 11, fontWeight: 700, padding: "6px 14px", borderRadius: 8, border: "none",
            background: "#2563EB", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", gap: 5,
          }}>
            <Plus size={14} /> New Event
          </button>
        </div>
      </div>

      {/* Calendar Type Filter */}
      <div style={{ marginBottom: 16 }}>
        <CalendarTypeFilter active={activeCalendars} onToggle={toggleCalendar} onAll={handleAllCalendars} />
      </div>

      {/* Error */}
      {error && (
        <div style={{ padding: "10px 14px", borderRadius: 8, background: "#FEE2E2", color: "#DC2626", fontSize: 12, marginBottom: 12 }}>{error}</div>
      )}

      {/* Loading indicator */}
      {loading && (
        <div style={{ display: "flex", justifyContent: "center", padding: "12px 0", marginBottom: 8 }}>
          <Loader2 size={20} style={{ color: "#2563EB", animation: "spin 1s linear infinite" }} />
        </div>
      )}

      {view === "month" ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 16, alignItems: "start" }}>
          {/* Month Grid */}
          <div style={{ background: "var(--card)", borderRadius: 14, border: "1px solid rgba(148,163,184,0.1)", padding: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", textAlign: "center", marginBottom: 6 }}>
              {DAY_NAMES.map((d) => (
                <div key={d} style={{ fontSize: 10, fontWeight: 700, color: "var(--muted)", padding: "4px 0" }}>{d}</div>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
              {cells.map((day, i) => {
                if (!day) return <div key={i} />;
                const dayEvts = eventsOnDay(events, day);
                const isToday = isSameDay(day, today);
                const isSelected = selectedDay && isSameDay(day, selectedDay);
                return (
                  <div
                    key={i}
                    onClick={() => setSelectedDay(day)}
                    style={{
                      minHeight: 80, padding: "4px 5px", borderRadius: 8, cursor: "pointer",
                      background: isSelected ? "rgba(37,99,235,0.08)" : "transparent",
                      border: isToday ? "1.5px solid #2563EB" : "1px solid transparent",
                      transition: "background 0.1s",
                    }}
                  >
                    <div style={{
                      fontSize: 12, fontWeight: isToday ? 800 : 400,
                      color: isToday ? "#2563EB" : "var(--text)",
                      marginBottom: 3, textAlign: "right",
                    }}>
                      {day.getDate()}
                    </div>
                    {dayEvts.slice(0, 3).map((e) => (
                      <CalendarEventCard
                        key={e.id}
                        event={e}
                        compact
                        onClick={(ev) => { setSelectedEvent(ev); }}
                      />
                    ))}
                    {dayEvts.length > 3 && (
                      <div style={{ fontSize: 9, color: "var(--muted)", fontWeight: 700, marginTop: 2 }}>+{dayEvts.length - 3} more</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Day Detail Panel */}
          <div style={{ background: "var(--card)", borderRadius: 14, border: "1px solid rgba(148,163,184,0.1)", padding: 16 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", margin: 0 }}>
                {selectedDay ? selectedDay.toLocaleDateString("en-IN", { weekday: "long", month: "short", day: "numeric" }) : "Select a day"}
              </h3>
              {selectedDay && (
                <button
                  onClick={() => { setCreateDate(selectedDay); setShowCreate(true); }}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#2563EB" }}
                >
                  <Plus size={16} />
                </button>
              )}
            </div>
            {selectedDay && selectedDayEvents.length === 0 && (
              <div style={{ fontSize: 12, color: "var(--muted)", padding: "12px 0", textAlign: "center" }}>No events</div>
            )}
            {selectedDayEvents.map((e) => (
              <CalendarEventCard key={e.id} event={e} onClick={setSelectedEvent} />
            ))}
          </div>
        </div>
      ) : (
        /* Agenda View */
        <div style={{ background: "var(--card)", borderRadius: 14, border: "1px solid rgba(148,163,184,0.1)", padding: 16 }}>
          {agendaDays.length === 0 && !loading && (
            <div style={{ fontSize: 13, color: "var(--muted)", padding: "24px 0", textAlign: "center" }}>No events this month</div>
          )}
          {agendaDays.map(({ date, events: dayEvts }) => (
            <div key={date.toISOString()} style={{ marginBottom: 20 }}>
              <div style={{
                fontSize: 12, fontWeight: 800, color: isSameDay(date, today) ? "#2563EB" : "var(--muted)",
                marginBottom: 8, paddingBottom: 4, borderBottom: "1px solid rgba(148,163,184,0.1)",
              }}>
                {date.toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric" })}
                {isSameDay(date, today) && " · Today"}
              </div>
              {dayEvts.map((e) => <CalendarEventCard key={e.id} event={e} onClick={setSelectedEvent} />)}
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onEdit={(e) => { setEditEvent(e); setSelectedEvent(null); }}
          onDelete={handleDelete}
          onReminderChanged={reload}
        />
      )}

      {(showCreate || editEvent) && (
        <PersonalEventModal
          event={editEvent}
          defaultDate={createDate}
          onClose={() => { setShowCreate(false); setEditEvent(undefined); }}
          onSaved={() => { setShowCreate(false); setEditEvent(undefined); reload(); }}
        />
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
