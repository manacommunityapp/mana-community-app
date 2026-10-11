import { useState } from "react";
import {
  Car, MapPin, Clock, Users, Leaf, Search, Plus, Star, Shield,
  ChevronRight, Calendar, ArrowRight,
} from "lucide-react";

const STATS = [
  { label: "Active Rides", value: "12", icon: Car, color: "#3b82f6" },
  { label: "Seats Saved", value: "148", icon: Users, color: "#10b981" },
  { label: "CO₂ Reduced", value: "320 kg", icon: Leaf, color: "#22c55e" },
];

const RIDES = [
  { driver: "Amit P.", initials: "AP", from: "Mana Community", to: "Hinjewadi IT Park", date: "Oct 14", time: "8:30 AM", price: "₹80", seats: 2, vehicle: "Maruti Swift", rating: 4.8, ladiesOnly: false },
  { driver: "Priya K.", initials: "PK", from: "Mana Community", to: "Magarpatta City", date: "Oct 14", time: "9:00 AM", price: "₹60", seats: 3, vehicle: "Honda City", rating: 4.9, ladiesOnly: true },
  { driver: "Rahul M.", initials: "RM", from: "Mana Community", to: "Kharadi EON IT Park", date: "Oct 15", time: "8:00 AM", price: "₹50", seats: 1, vehicle: "Hyundai i20", rating: 4.7, ladiesOnly: false },
  { driver: "Sneha D.", initials: "SD", from: "Mana Community", to: "Hadapsar", date: "Oct 15", time: "9:30 AM", price: "₹40", seats: 4, vehicle: "Tata Nexon", rating: 4.6, ladiesOnly: false },
];

const MY_BOOKINGS = [
  { driver: "Vikram S.", route: "Mana → Hinjewadi", date: "Oct 12", status: "Completed", amount: "₹80" },
  { driver: "Priya K.", route: "Mana → Magarpatta", date: "Oct 14", status: "Confirmed", amount: "₹60" },
];

const MY_OFFERS = [
  { route: "Mana → Baner", date: "Oct 16", time: "8:30 AM", seats: 3, booked: 1, status: "Active" },
];

const TABS = ["Find Rides", "Offer a Ride", "My Rides"] as const;
const FILTERS = ["Morning", "Evening", "AC", "Ladies Only"];

export function CommuteDashboard() {
  const [tab, setTab] = useState<typeof TABS[number]>("Find Rides");
  const [search, setSearch] = useState("");
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  const toggleFilter = (f: string) =>
    setActiveFilters(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]);

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 16px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <div style={{ width: 42, height: 42, borderRadius: 12, background: "rgba(59,130,246,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Car size={22} style={{ color: "#3b82f6" }} />
        </div>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text)", margin: 0 }}>Community Rides</h1>
          <p style={{ fontSize: 12, color: "var(--muted)", margin: 0 }}>Share rides, save money, reduce emissions</p>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        {STATS.map(s => (
          <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", borderRadius: 10, background: "var(--card)", border: "1px solid rgba(148,163,184,0.1)" }}>
            <s.icon size={14} style={{ color: s.color }} />
            <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text)" }}>{s.value}</span>
            <span style={{ fontSize: 11, color: "var(--muted)" }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            fontSize: 12, fontWeight: 700, padding: "7px 16px", borderRadius: 8,
            border: `1px solid ${tab === t ? "var(--gold)" : "rgba(148,163,184,0.15)"}`,
            background: tab === t ? "rgba(212,160,23,0.1)" : "transparent",
            color: tab === t ? "var(--gold)" : "var(--muted)", cursor: "pointer",
          }}>{t}</button>
        ))}
      </div>

      {/* Find Rides */}
      {tab === "Find Rides" && (
        <div>
          <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 200, position: "relative" }}>
              <Search size={14} style={{ position: "absolute", left: 10, top: 10, color: "var(--muted)" }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search destination..."
                style={{ width: "100%", padding: "8px 8px 8px 30px", borderRadius: 8, border: "1px solid rgba(148,163,184,0.15)", background: "var(--card)", color: "var(--text)", fontSize: 12, boxSizing: "border-box" }} />
            </div>
            {FILTERS.map(f => (
              <button key={f} onClick={() => toggleFilter(f)} style={{
                fontSize: 10, fontWeight: 600, padding: "6px 12px", borderRadius: 6,
                border: `1px solid ${activeFilters.includes(f) ? "var(--gold)" : "rgba(148,163,184,0.15)"}`,
                background: activeFilters.includes(f) ? "rgba(212,160,23,0.08)" : "transparent",
                color: activeFilters.includes(f) ? "var(--gold)" : "var(--muted)", cursor: "pointer",
              }}>{f}</button>
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {RIDES.map((r, i) => (
              <div key={i} style={{ padding: 16, borderRadius: 12, background: "var(--card)", border: "1px solid rgba(148,163,184,0.1)", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(148,163,184,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "var(--muted)", flexShrink: 0 }}>{r.initials}</div>
                <div style={{ flex: 1, minWidth: 180 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", display: "flex", alignItems: "center", gap: 6 }}>
                    {r.driver}
                    <span style={{ fontSize: 10, color: "#f59e0b", display: "flex", alignItems: "center", gap: 2 }}><Star size={10} fill="#f59e0b" />{r.rating}</span>
                    {r.ladiesOnly && <span style={{ fontSize: 8, fontWeight: 700, padding: "1px 5px", borderRadius: 4, background: "rgba(236,72,153,0.1)", color: "#ec4899" }}>Ladies Only</span>}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--muted)", display: "flex", alignItems: "center", gap: 4, marginTop: 3 }}>
                    <MapPin size={10} />{r.from} <ArrowRight size={10} /> {r.to}
                  </div>
                  <div style={{ fontSize: 10, color: "var(--muted)", display: "flex", gap: 10, marginTop: 3 }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 3 }}><Calendar size={10} />{r.date}, {r.time}</span>
                    <span style={{ display: "flex", alignItems: "center", gap: 3 }}><Car size={10} />{r.vehicle}</span>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: "var(--text)" }}>{r.price}</div>
                  <div style={{ fontSize: 10, color: "var(--muted)" }}>{r.seats} seats left</div>
                  <button style={{ marginTop: 6, fontSize: 10, fontWeight: 700, padding: "5px 14px", borderRadius: 6, background: "var(--gold)", color: "#000", border: "none", cursor: "pointer" }}>Book</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Offer a Ride */}
      {tab === "Offer a Ride" && (
        <div style={{ background: "var(--card)", borderRadius: 14, border: "1px solid rgba(148,163,184,0.1)", padding: 24, maxWidth: 500 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 16px" }}>Publish a New Ride</h3>
          {["From", "To", "Date", "Time"].map(f => (
            <div key={f} style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)", display: "block", marginBottom: 4 }}>{f}</label>
              <input placeholder={f === "From" ? "Mana Community" : f === "To" ? "Destination" : f} readOnly={f === "From"}
                style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid rgba(148,163,184,0.15)", background: f === "From" ? "rgba(148,163,184,0.04)" : "var(--card)", color: "var(--text)", fontSize: 12, boxSizing: "border-box" }} />
            </div>
          ))}
          <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)", display: "block", marginBottom: 4 }}>Seats</label>
              <input type="number" defaultValue={3} style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid rgba(148,163,184,0.15)", background: "var(--card)", color: "var(--text)", fontSize: 12, boxSizing: "border-box" }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)", display: "block", marginBottom: 4 }}>Price/seat (₹)</label>
              <input type="number" defaultValue={80} style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid rgba(148,163,184,0.15)", background: "var(--card)", color: "var(--text)", fontSize: 12, boxSizing: "border-box" }} />
            </div>
          </div>
          <button style={{ width: "100%", padding: "10px 0", borderRadius: 8, background: "var(--gold)", color: "#000", fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <Plus size={14} /> Publish Ride
          </button>
        </div>
      )}

      {/* My Rides */}
      {tab === "My Rides" && (
        <div>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 10 }}>My Bookings</h3>
          {MY_BOOKINGS.map((b, i) => (
            <div key={i} style={{ padding: 14, borderRadius: 10, background: "var(--card)", border: "1px solid rgba(148,163,184,0.1)", marginBottom: 8, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text)" }}>{b.route}</div>
                <div style={{ fontSize: 10, color: "var(--muted)" }}>Driver: {b.driver} · {b.date}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 700 }}>{b.amount}</span>
                <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 4, background: b.status === "Completed" ? "rgba(148,163,184,0.1)" : "rgba(16,185,129,0.1)", color: b.status === "Completed" ? "var(--muted)" : "#10b981" }}>{b.status}</span>
              </div>
            </div>
          ))}
          <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", margin: "18px 0 10px" }}>My Offers</h3>
          {MY_OFFERS.map((o, i) => (
            <div key={i} style={{ padding: 14, borderRadius: 10, background: "var(--card)", border: "1px solid rgba(148,163,184,0.1)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text)" }}>{o.route}</div>
                <div style={{ fontSize: 10, color: "var(--muted)" }}>{o.date}, {o.time} · {o.booked}/{o.seats} booked</div>
              </div>
              <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 4, background: "rgba(16,185,129,0.1)", color: "#10b981" }}>{o.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
