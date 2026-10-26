import { useState, useMemo } from "react";
import {
  CalendarDays, ChevronLeft, ChevronRight, Clock, MapPin,
  Trophy, GraduationCap, Users, ShoppingBag, Landmark, Wrench,
} from "lucide-react";

const DOMAINS = ["All", "Events", "Sports", "Academy", "Trips", "Governance", "Group Buy", "Booking", "Maintenance", "Pooja"] as const;

const DOMAIN_COLORS: Record<string, string> = {
  Events: "#ec4899", Sports: "#3b82f6", Academy: "#8b5cf6", Trips: "#10b981",
  Governance: "#f59e0b", "Group Buy": "#ef4444", Booking: "#06b6d4", Maintenance: "#64748b", Pooja: "#f97316",
};

const CALENDAR_EVENTS = [
  { day: 3, domain: "Sports", title: "Cricket League — Match 5", time: "6:00 PM", location: "Ground A" },
  { day: 5, domain: "Governance", title: "AGM Meeting", time: "10:00 AM", location: "Community Hall" },
  { day: 8, domain: "Group Buy", title: "Organic Fruits Pickup", time: "9:00 AM", location: "Gate 2 Lobby" },
  { day: 11, domain: "Events", title: "Navratri Garba Night", time: "7:00 PM", location: "Amphitheatre" },
  { day: 11, domain: "Booking", title: "Badminton Court", time: "6:00 AM", location: "Sports Complex" },
  { day: 14, domain: "Academy", title: "Yoga Workshop", time: "7:00 AM", location: "Clubhouse" },
  { day: 17, domain: "Sports", title: "Badminton Tournament", time: "5:00 PM", location: "Indoor Court" },
  { day: 20, domain: "Maintenance", title: "Water Tank Cleaning", time: "All Day", location: "Building A & B" },
  { day: 22, domain: "Trips", title: "Lonavala Day Trip", time: "7:00 AM", location: "Gate 1" },
  { day: 25, domain: "Pooja", title: "Diwali Lakshmi Puja", time: "6:30 PM", location: "Temple Area" },
  { day: 28, domain: "Events", title: "Diwali Mela", time: "4:00 PM", location: "Central Lawn" },
  { day: 31, domain: "Sports", title: "Cricket League Finals", time: "4:00 PM", location: "Ground A" },
];

const MONTH = "October";
const YEAR = 2026;
const DAYS_IN_MONTH = 31;
const FIRST_DAY_OFFSET = 3; // Oct 1, 2026 is Thursday (0=Sun)
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const TODAY = 11;

export function CalendarDashboard() {
  const [selectedDay, setSelectedDay] = useState<number>(TODAY);
  const [domainFilter, setDomainFilter] = useState<string>("All");
  const [mySchedule, setMySchedule] = useState(false);

  const filteredEvents = useMemo(() =>
    CALENDAR_EVENTS.filter(e => domainFilter === "All" || e.domain === domainFilter),
    [domainFilter]
  );

  const dayEvents = filteredEvents.filter(e => e.day === selectedDay);
  const eventDays = new Set(filteredEvents.map(e => e.day));

  const upcoming = filteredEvents
    .filter(e => e.day >= TODAY)
    .slice(0, 5);

  const calendarCells = useMemo(() => {
    const cells: (number | null)[] = [];
    for (let i = 0; i < FIRST_DAY_OFFSET; i++) cells.push(null);
    for (let d = 1; d <= DAYS_IN_MONTH; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, []);

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "24px 16px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: "rgba(59,130,246,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <CalendarDays size={22} style={{ color: "#3b82f6" }} />
          </div>
          <div>
            <h4 style={{ fontSize: 18, fontWeight: 800, color: "var(--text)", margin: 0 }}>Community Calendar</h4>
            <p style={{ fontSize: 12, color: "var(--muted)", margin: 0 }}>All events across your community</p>
          </div>
        </div>
        <button onClick={() => setMySchedule(!mySchedule)} style={{
          fontSize: 11, fontWeight: 700, padding: "6px 14px", borderRadius: 8,
          border: `1px solid ${mySchedule ? "var(--gold)" : "rgba(148,163,184,0.15)"}`,
          background: mySchedule ? "rgba(212,160,23,0.1)" : "transparent",
          color: mySchedule ? "var(--gold)" : "var(--muted)", cursor: "pointer",
        }}>My Schedule</button>
      </div>

      {/* Domain Filters */}
      <div style={{ display: "flex", gap: 6, marginBottom: 20, overflowX: "auto", paddingBottom: 4 }}>
        {DOMAINS.map(d => (
          <button key={d} onClick={() => setDomainFilter(d)} style={{
            fontSize: 10, fontWeight: 700, padding: "5px 12px", borderRadius: 12, whiteSpace: "nowrap",
            border: `1px solid ${domainFilter === d ? (DOMAIN_COLORS[d] || "var(--gold)") : "rgba(148,163,184,0.15)"}`,
            background: domainFilter === d ? `${DOMAIN_COLORS[d] || "var(--gold)"}15` : "transparent",
            color: domainFilter === d ? (DOMAIN_COLORS[d] || "var(--gold)") : "var(--muted)", cursor: "pointer",
          }}>{d}</button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 16, alignItems: "start" }}>
        {/* Calendar Grid */}
        <div style={{ background: "var(--card)", borderRadius: 14, border: "1px solid rgba(148,163,184,0.1)", padding: 18 }}>
          {/* Month Nav */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <button style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", padding: 4 }}><ChevronLeft size={18} /></button>
            <span style={{ fontSize: 16, fontWeight: 700, color: "var(--text)" }}>{MONTH} {YEAR}</span>
            <button style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", padding: 4 }}><ChevronRight size={18} /></button>
          </div>
          {/* Day Names */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", textAlign: "center", marginBottom: 6 }}>
            {DAY_NAMES.map(d => (
              <div key={d} style={{ fontSize: 10, fontWeight: 700, color: "var(--muted)", padding: 4 }}>{d}</div>
            ))}
          </div>
          {/* Cells */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
            {calendarCells.map((day, i) => (
              <button key={i} onClick={() => day && setSelectedDay(day)} style={{
                aspectRatio: "1", borderRadius: 8, border: "none", cursor: day ? "pointer" : "default",
                background: day === selectedDay ? "var(--gold)" : day === TODAY ? "rgba(212,160,23,0.12)" : "transparent",
                color: day === selectedDay ? "#000" : day ? "var(--text)" : "transparent",
                fontSize: 13, fontWeight: day === TODAY || day === selectedDay ? 700 : 400,
                position: "relative", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              }}>
                {day}
                {day && eventDays.has(day) && day !== selectedDay && (
                  <div style={{ display: "flex", gap: 2, position: "absolute", bottom: 3 }}>
                    {filteredEvents.filter(e => e.day === day).slice(0, 3).map((e, j) => (
                      <div key={j} style={{ width: 4, height: 4, borderRadius: "50%", background: DOMAIN_COLORS[e.domain] || "#64748b" }} />
                    ))}
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Day Detail */}
          {selectedDay && (
            <div style={{ marginTop: 16, borderTop: "1px solid rgba(148,163,184,0.1)", paddingTop: 14 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", margin: "0 0 10px" }}>{MONTH} {selectedDay}, {YEAR}</h3>
              {dayEvents.length === 0 ? (
                <div style={{ fontSize: 12, color: "var(--muted)", padding: "10px 0" }}>No events on this day</div>
              ) : dayEvents.map((e, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid rgba(148,163,184,0.06)" }}>
                  <div style={{ width: 3, height: 28, borderRadius: 2, background: DOMAIN_COLORS[e.domain] || "#64748b" }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text)" }}>{e.title}</div>
                    <div style={{ fontSize: 10, color: "var(--muted)", display: "flex", gap: 8, marginTop: 2 }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 3 }}><Clock size={9} />{e.time}</span>
                      <span style={{ display: "flex", alignItems: "center", gap: 3 }}><MapPin size={9} />{e.location}</span>
                    </div>
                  </div>
                  <span style={{ fontSize: 8, fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: `${DOMAIN_COLORS[e.domain]}15`, color: DOMAIN_COLORS[e.domain] }}>{e.domain}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming This Week */}
        <div style={{ background: "var(--card)", borderRadius: 14, border: "1px solid rgba(148,163,184,0.1)", padding: 18 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", margin: "0 0 12px" }}>Upcoming</h3>
          {upcoming.map((e, i) => (
            <div key={i} style={{ padding: "10px 0", borderBottom: "1px solid rgba(148,163,184,0.06)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: DOMAIN_COLORS[e.domain] || "#64748b" }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text)" }}>{e.title}</span>
              </div>
              <div style={{ fontSize: 10, color: "var(--muted)", paddingLeft: 12 }}>
                {MONTH} {e.day} · {e.time} · {e.location}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
