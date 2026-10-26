import { useState } from "react";
import {
  Car, Wrench, Calendar, TrendingUp, Users, CheckCircle2,
  Clock, AlertCircle, Star, ChevronRight, RefreshCw, MapPin,
} from "lucide-react";

const TABS = ["Overview", "Bookings", "Technicians", "Catalog", "Plans"] as const;
type Tab = typeof TABS[number];

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  CONFIRMED:      { bg: "rgba(59,130,246,0.1)",  text: "#3b82f6" },
  ASSIGNED:       { bg: "rgba(139,92,246,0.1)",  text: "#8b5cf6" },
  EN_ROUTE:       { bg: "rgba(245,158,11,0.1)",  text: "#f59e0b" },
  ARRIVED:        { bg: "rgba(245,158,11,0.1)",  text: "#f59e0b" },
  IN_PROGRESS:    { bg: "rgba(16,185,129,0.1)",  text: "#10b981" },
  COMPLETED:      { bg: "rgba(16,185,129,0.1)",  text: "#10b981" },
  CANCELLED:      { bg: "rgba(239,68,68,0.1)",   text: "#ef4444" },
  PENDING_PAYMENT:{ bg: "rgba(107,114,128,0.1)", text: "#6b7280" },
};

const STATS = [
  { label: "Today's Bookings", value: "24",   icon: Calendar,    color: "#3b82f6" },
  { label: "Completed",        value: "18",   icon: CheckCircle2,color: "#10b981" },
  { label: "Active Jobs",      value: "6",    icon: Wrench,      color: "#f59e0b" },
  { label: "Today's Revenue",  value: "₹14,400", icon: TrendingUp, color: "#8b5cf6" },
];

const SAMPLE_BOOKINGS = [
  { id: "VC-20261025-A1B2C3", status: "IN_PROGRESS", resident: "Rahul M.",  flat: "B-204", service: "Full Detail Wash",  vehicle: "Swift ZXi",   time: "9:00–10:30", tech: "Arjun K.", amount: "₹599" },
  { id: "VC-20261025-D4E5F6", status: "CONFIRMED",   resident: "Priya S.",  flat: "A-101", service: "Express Wash",      vehicle: "Honda City",  time: "10:00–10:30",tech: "Pending",   amount: "₹249" },
  { id: "VC-20261025-G7H8I9", status: "COMPLETED",   resident: "Anil T.",   flat: "C-305", service: "Interior Vacuum",   vehicle: "Creta",       time: "8:00–8:45",  tech: "Ravi P.",   amount: "₹299" },
  { id: "VC-20261025-J1K2L3", status: "EN_ROUTE",    resident: "Sita R.",   flat: "D-107", service: "Bike Full Service", vehicle: "Activa 125",  time: "11:00–11:45",tech: "Arjun K.", amount: "₹199" },
  { id: "VC-20261025-M4N5O6", status: "ASSIGNED",    resident: "Kumar V.",  flat: "B-302", service: "Express Wash",      vehicle: "Baleno",      time: "12:00–12:30",tech: "Ravi P.",   amount: "₹249" },
];

const TECHNICIANS = [
  { name: "Arjun Kumar",  jobs: 8, completed: 6, rating: 4.8, status: "Busy" },
  { name: "Ravi Patel",   jobs: 7, completed: 7, rating: 4.9, status: "Available" },
  { name: "Suresh Yadav", jobs: 6, completed: 4, rating: 4.6, status: "Busy" },
  { name: "Mohan Singh",  jobs: 3, completed: 3, rating: 4.7, status: "Available" },
];

const CATALOG = [
  { name: "Express Exterior Wash", duration: "30 min", price: "₹249", popular: true,  bookings: 112 },
  { name: "Interior Vacuum",       duration: "45 min", price: "₹299", popular: false, bookings: 68  },
  { name: "Full Detail Wash",      duration: "90 min", price: "₹599", popular: true,  bookings: 94  },
  { name: "Ceramic Coating",       duration: "4 hrs",  price: "₹3,499",popular: false,bookings: 12  },
  { name: "Bike Full Service Wash",duration: "45 min", price: "₹199", popular: true,  bookings: 55  },
  { name: "Engine Bay Cleaning",   duration: "60 min", price: "₹699", popular: false, bookings: 23  },
];

const PLANS = [
  { name: "Basic Plan",    freq: "Every 4 Days",  price: "₹999",  active: 34 },
  { name: "Standard Plan", freq: "Every 3 Days",  price: "₹1,299",active: 21 },
  { name: "Premium Plan",  freq: "Every 2 Days",  price: "₹1,799",active: 14 },
  { name: "Daily Shine",   freq: "Daily",         price: "₹2,999",active: 8  },
];

function StatCard({ stat }: { stat: typeof STATS[number] }) {
  const Icon = stat.icon;
  return (
    <div style={{ background: "#fff", borderRadius: 12, padding: "16px 20px", border: "1px solid #e5e7eb", flex: 1 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: `${stat.color}1a`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={18} style={{ color: stat.color }} />
        </div>
        <span style={{ fontSize: 13, color: "#6b7280" }}>{stat.label}</span>
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, color: "#111827" }}>{stat.value}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const c = STATUS_COLORS[status] ?? { bg: "rgba(107,114,128,0.1)", text: "#6b7280" };
  return (
    <span style={{ background: c.bg, color: c.text, borderRadius: 6, padding: "3px 8px", fontSize: 11, fontWeight: 600, whiteSpace: "nowrap" }}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

export function VehicleCareAdminDashboard() {
  const [tab, setTab] = useState<Tab>("Overview");

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 16px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: "rgba(2,132,199,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Car size={22} style={{ color: "#0284c7" }} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 18, color: "#111827" }}>Vehicle Care</div>
            <div style={{ fontSize: 12, color: "#6b7280" }}>Powered by Washcaro · Admin Dashboard</div>
          </div>
        </div>
        <button style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8, border: "1px solid #e5e7eb", background: "#fff", cursor: "pointer", fontSize: 13 }}>
          <RefreshCw size={14} />Refresh
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, borderBottom: "1px solid #e5e7eb", paddingBottom: 1 }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: "8px 16px", border: "none", background: "none", cursor: "pointer",
            fontSize: 14, fontWeight: tab === t ? 600 : 400,
            color: tab === t ? "#0284c7" : "#6b7280",
            borderBottom: tab === t ? "2px solid #0284c7" : "2px solid transparent",
          }}>{t}</button>
        ))}
      </div>

      {/* Overview */}
      {tab === "Overview" && (
        <>
          <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
            {STATS.map(s => <StatCard key={s.label} stat={s} />)}
          </div>
          <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontWeight: 600, fontSize: 15 }}>Today's Bookings</span>
              <button onClick={() => setTab("Bookings")} style={{ fontSize: 12, color: "#0284c7", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                View all <ChevronRight size={14} />
              </button>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f9fafb" }}>
                  {["Booking #", "Resident", "Service", "Vehicle", "Time", "Technician", "Amount", "Status"].map(h => (
                    <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 12, color: "#6b7280", fontWeight: 500, whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SAMPLE_BOOKINGS.map((b, i) => (
                  <tr key={b.id} style={{ borderTop: i > 0 ? "1px solid #f3f4f6" : "none" }}>
                    <td style={{ padding: "12px 14px", fontSize: 12, color: "#374151", fontFamily: "monospace" }}>{b.id}</td>
                    <td style={{ padding: "12px 14px" }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{b.resident}</div>
                      <div style={{ fontSize: 11, color: "#9ca3af" }}>{b.flat}</div>
                    </td>
                    <td style={{ padding: "12px 14px", fontSize: 13, color: "#374151" }}>{b.service}</td>
                    <td style={{ padding: "12px 14px", fontSize: 13, color: "#374151" }}>{b.vehicle}</td>
                    <td style={{ padding: "12px 14px", fontSize: 12, color: "#6b7280", whiteSpace: "nowrap" }}>{b.time}</td>
                    <td style={{ padding: "12px 14px", fontSize: 13, color: "#374151" }}>{b.tech}</td>
                    <td style={{ padding: "12px 14px", fontSize: 13, fontWeight: 600, color: "#111827" }}>{b.amount}</td>
                    <td style={{ padding: "12px 14px" }}><StatusBadge status={b.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Bookings tab */}
      {tab === "Bookings" && (
        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #f3f4f6" }}>
            <span style={{ fontWeight: 600, fontSize: 15 }}>All Bookings</span>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f9fafb" }}>
                {["Booking #", "Resident", "Service", "Vehicle", "Time", "Technician", "Amount", "Status"].map(h => (
                  <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 12, color: "#6b7280", fontWeight: 500 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SAMPLE_BOOKINGS.map((b, i) => (
                <tr key={b.id} style={{ borderTop: i > 0 ? "1px solid #f3f4f6" : "none" }}>
                  <td style={{ padding: "12px 14px", fontSize: 12, color: "#374151", fontFamily: "monospace" }}>{b.id}</td>
                  <td style={{ padding: "12px 14px" }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{b.resident}</div>
                    <div style={{ fontSize: 11, color: "#9ca3af" }}>{b.flat}</div>
                  </td>
                  <td style={{ padding: "12px 14px", fontSize: 13 }}>{b.service}</td>
                  <td style={{ padding: "12px 14px", fontSize: 13 }}>{b.vehicle}</td>
                  <td style={{ padding: "12px 14px", fontSize: 12, color: "#6b7280" }}>{b.time}</td>
                  <td style={{ padding: "12px 14px", fontSize: 13 }}>{b.tech}</td>
                  <td style={{ padding: "12px 14px", fontSize: 13, fontWeight: 600 }}>{b.amount}</td>
                  <td style={{ padding: "12px 14px" }}><StatusBadge status={b.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Technicians tab */}
      {tab === "Technicians" && (
        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #f3f4f6" }}>
            <span style={{ fontWeight: 600, fontSize: 15 }}>Technician Performance — Today</span>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f9fafb" }}>
                {["Technician", "Assigned", "Completed", "Rating", "Status"].map(h => (
                  <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 12, color: "#6b7280", fontWeight: 500 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TECHNICIANS.map((t, i) => (
                <tr key={t.name} style={{ borderTop: i > 0 ? "1px solid #f3f4f6" : "none" }}>
                  <td style={{ padding: "12px 14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(2,132,199,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#0284c7" }}>
                        {t.name.charAt(0)}
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>{t.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: "12px 14px", fontSize: 14, color: "#374151" }}>{t.jobs}</td>
                  <td style={{ padding: "12px 14px", fontSize: 14, color: "#374151" }}>{t.completed}</td>
                  <td style={{ padding: "12px 14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <Star size={13} style={{ color: "#f59e0b", fill: "#f59e0b" }} />
                      <span style={{ fontSize: 14, fontWeight: 600 }}>{t.rating}</span>
                    </div>
                  </td>
                  <td style={{ padding: "12px 14px" }}>
                    <span style={{
                      background: t.status === "Available" ? "rgba(16,185,129,0.1)" : "rgba(245,158,11,0.1)",
                      color: t.status === "Available" ? "#10b981" : "#f59e0b",
                      borderRadius: 6, padding: "3px 10px", fontSize: 12, fontWeight: 600
                    }}>{t.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Catalog tab */}
      {tab === "Catalog" && (
        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontWeight: 600, fontSize: 15 }}>Service Catalog</span>
            <button style={{ padding: "7px 14px", borderRadius: 8, background: "#0284c7", color: "#fff", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>+ Add Service</button>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f9fafb" }}>
                {["Service", "Duration", "Community Price", "Popular", "Bookings MTD"].map(h => (
                  <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 12, color: "#6b7280", fontWeight: 500 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CATALOG.map((c, i) => (
                <tr key={c.name} style={{ borderTop: i > 0 ? "1px solid #f3f4f6" : "none" }}>
                  <td style={{ padding: "12px 14px", fontSize: 14, fontWeight: 600, color: "#111827" }}>{c.name}</td>
                  <td style={{ padding: "12px 14px", fontSize: 13, color: "#6b7280" }}>{c.duration}</td>
                  <td style={{ padding: "12px 14px", fontSize: 14, fontWeight: 600, color: "#111827" }}>{c.price}</td>
                  <td style={{ padding: "12px 14px" }}>
                    {c.popular && <span style={{ background: "rgba(16,185,129,0.1)", color: "#10b981", borderRadius: 6, padding: "3px 8px", fontSize: 11, fontWeight: 600 }}>Popular</span>}
                  </td>
                  <td style={{ padding: "12px 14px", fontSize: 14, color: "#374151" }}>{c.bookings}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Plans tab */}
      {tab === "Plans" && (
        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #f3f4f6" }}>
            <span style={{ fontWeight: 600, fontSize: 15 }}>Wash Plan Subscriptions</span>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f9fafb" }}>
                {["Plan", "Frequency", "Monthly Price", "Active Subscribers"].map(h => (
                  <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 12, color: "#6b7280", fontWeight: 500 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PLANS.map((p, i) => (
                <tr key={p.name} style={{ borderTop: i > 0 ? "1px solid #f3f4f6" : "none" }}>
                  <td style={{ padding: "12px 14px", fontSize: 14, fontWeight: 600, color: "#111827" }}>{p.name}</td>
                  <td style={{ padding: "12px 14px", fontSize: 13, color: "#6b7280" }}>{p.freq}</td>
                  <td style={{ padding: "12px 14px", fontSize: 14, fontWeight: 600, color: "#111827" }}>{p.price}</td>
                  <td style={{ padding: "12px 14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <Users size={14} style={{ color: "#0284c7" }} />
                      <span style={{ fontSize: 14, color: "#374151" }}>{p.active}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
