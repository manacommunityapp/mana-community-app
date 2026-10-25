import { useState } from "react";
import {
  Car, CheckCircle2, Clock, Navigation, MapPin, Wrench,
  Star, ChevronDown, ChevronUp, IndianRupee, User, Hash,
} from "lucide-react";

const TABS = ["Today", "Upcoming", "History"] as const;
type Tab = typeof TABS[number];

const STATUS_ORDER = ["CONFIRMED", "ASSIGNED", "EN_ROUTE", "ARRIVED", "IN_PROGRESS", "COMPLETED"];

const STATUS_CONFIG: Record<string, { label: string; color: string; action?: string }> = {
  CONFIRMED:   { label: "Confirmed",   color: "#3b82f6", action: "Accept Job" },
  ASSIGNED:    { label: "Assigned",    color: "#8b5cf6", action: "Start Route" },
  EN_ROUTE:    { label: "En Route",    color: "#f59e0b", action: "Mark Arrived" },
  ARRIVED:     { label: "Arrived",     color: "#f97316", action: "Start Service" },
  IN_PROGRESS: { label: "In Progress", color: "#10b981", action: "Complete Job" },
  COMPLETED:   { label: "Completed",   color: "#10b981" },
  CANCELLED:   { label: "Cancelled",   color: "#ef4444" },
  NO_SHOW:     { label: "No Show",     color: "#6b7280" },
};

const STATUS_TRANSITIONS: Record<string, string> = {
  CONFIRMED:   "ASSIGNED",
  ASSIGNED:    "EN_ROUTE",
  EN_ROUTE:    "ARRIVED",
  ARRIVED:     "IN_PROGRESS",
  IN_PROGRESS: "COMPLETED",
};

const CHECKLIST_ITEMS = [
  "Vehicle verified with resident",
  "Cleaning materials prepared",
  "Service completed as requested",
  "Vehicle surfaces dried & inspected",
  "Area cleaned up after service",
];

const JOBS = [
  {
    id: 1, bookingNumber: "VC-20261025-A1B2C3", status: "IN_PROGRESS",
    resident: "Rahul M.", flat: "B-204", address: "Tower B, Flat 204",
    service: "Full Detail Wash", vehicle: "Maruti Swift ZXi", vehicleType: "CAR",
    time: "9:00 AM – 10:30 AM", amount: "₹599", rating: null,
  },
  {
    id: 2, bookingNumber: "VC-20261025-D4E5F6", status: "ASSIGNED",
    resident: "Priya S.", flat: "A-101", address: "Tower A, Flat 101",
    service: "Express Exterior Wash", vehicle: "Honda City", vehicleType: "CAR",
    time: "10:00 AM – 10:30 AM", amount: "₹249", rating: null,
  },
  {
    id: 3, bookingNumber: "VC-20261025-J1K2L3", status: "EN_ROUTE",
    resident: "Sita R.", flat: "D-107", address: "Tower D, Flat 107",
    service: "Bike Full Service Wash", vehicle: "Honda Activa 125", vehicleType: "BIKE",
    time: "11:00 AM – 11:45 AM", amount: "₹199", rating: null,
  },
];

const HISTORY = [
  {
    id: 4, bookingNumber: "VC-20261025-G7H8I9", status: "COMPLETED",
    resident: "Anil T.", flat: "C-305", address: "Tower C, Flat 305",
    service: "Interior Vacuum", vehicle: "Hyundai Creta", vehicleType: "SUV",
    time: "8:00 AM – 8:45 AM", amount: "₹299", rating: 5,
  },
  {
    id: 5, bookingNumber: "VC-20261024-X9Y8Z7", status: "COMPLETED",
    resident: "Kumar V.", flat: "B-302", address: "Tower B, Flat 302",
    service: "Express Exterior Wash", vehicle: "Maruti Baleno", vehicleType: "CAR",
    time: "2:00 PM – 2:30 PM", amount: "₹249", rating: 4,
  },
];

type Job = typeof JOBS[number] & { rating: number | null };

function JobCard({ job, onStatusUpdate }: { job: Job; onStatusUpdate: (id: number, status: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const [checklist, setChecklist] = useState<boolean[]>(Array(CHECKLIST_ITEMS.length).fill(false));
  const cfg = STATUS_CONFIG[job.status] ?? { label: job.status, color: "#6b7280" };
  const stepIndex = STATUS_ORDER.indexOf(job.status);
  const nextStatus = STATUS_TRANSITIONS[job.status];
  const allChecked = checklist.every(Boolean);

  return (
    <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", marginBottom: 12, overflow: "hidden" }}>
      <div style={{ padding: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: cfg.color }} />
              <span style={{ fontSize: 11, color: cfg.color, fontWeight: 600 }}>{cfg.label}</span>
              <span style={{ fontSize: 11, color: "#9ca3af" }}>#{job.bookingNumber}</span>
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>{job.service}</div>
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>{job.amount}</div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 12 }}>
          <InfoRow icon={<User size={13} />} text={`${job.resident} · ${job.flat}`} />
          <InfoRow icon={<MapPin size={13} />} text={job.address} />
          <InfoRow icon={<Car size={13} />} text={job.vehicle} />
          <InfoRow icon={<Clock size={13} />} text={job.time} />
        </div>

        {/* Status progress dots */}
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 12 }}>
          {STATUS_ORDER.slice(0, 6).map((s, i) => (
            <div key={s} style={{ display: "flex", alignItems: "center" }}>
              <div style={{
                width: i <= stepIndex ? 10 : 8, height: i <= stepIndex ? 10 : 8,
                borderRadius: "50%",
                background: i < stepIndex ? "#10b981" : i === stepIndex ? STATUS_CONFIG[s]?.color ?? "#6b7280" : "#d1d5db",
                border: i === stepIndex ? `2px solid ${STATUS_CONFIG[s]?.color ?? "#6b7280"}` : "none",
              }} />
              {i < 5 && <div style={{ width: 14, height: 2, background: i < stepIndex ? "#10b981" : "#e5e7eb" }} />}
            </div>
          ))}
          <span style={{ fontSize: 11, color: "#9ca3af", marginLeft: 4 }}>{STATUS_ORDER[stepIndex]?.replace(/_/g, " ")}</span>
        </div>

        {/* Checklist for IN_PROGRESS */}
        {job.status === "IN_PROGRESS" && (
          <div style={{ marginBottom: 12 }}>
            <div
              onClick={() => setExpanded(!expanded)}
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", marginBottom: expanded ? 8 : 0 }}
            >
              <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>
                Completion checklist ({checklist.filter(Boolean).length}/{CHECKLIST_ITEMS.length})
              </span>
              {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>
            {expanded && (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {CHECKLIST_ITEMS.map((item, i) => (
                  <label key={i} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={checklist[i]}
                      onChange={() => setChecklist(c => c.map((v, j) => j === i ? !v : v))}
                      style={{ width: 16, height: 16, cursor: "pointer" }}
                    />
                    <span style={{ fontSize: 13, color: checklist[i] ? "#10b981" : "#374151" }}>{item}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Rating (completed) */}
        {job.status === "COMPLETED" && job.rating != null && (
          <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 10 }}>
            {[1,2,3,4,5].map(s => (
              <Star key={s} size={14} style={{ color: s <= job.rating! ? "#f59e0b" : "#d1d5db", fill: s <= job.rating! ? "#f59e0b" : "#d1d5db" }} />
            ))}
            <span style={{ fontSize: 12, color: "#6b7280", marginLeft: 4 }}>Customer rating</span>
          </div>
        )}

        {/* Action button */}
        {nextStatus && cfg.action && (
          <button
            disabled={job.status === "IN_PROGRESS" && !allChecked}
            onClick={() => onStatusUpdate(job.id, nextStatus)}
            style={{
              width: "100%", padding: "10px 0", borderRadius: 8, border: "none", cursor: job.status === "IN_PROGRESS" && !allChecked ? "not-allowed" : "pointer",
              background: job.status === "IN_PROGRESS" && !allChecked ? "#e5e7eb" : cfg.color,
              color: job.status === "IN_PROGRESS" && !allChecked ? "#9ca3af" : "#fff",
              fontWeight: 600, fontSize: 14,
            }}
          >
            {cfg.action}{job.status === "IN_PROGRESS" && !allChecked ? ` (${checklist.filter(Boolean).length}/${CHECKLIST_ITEMS.length})` : ""}
          </button>
        )}
      </div>
    </div>
  );
}

function InfoRow({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
      <span style={{ color: "#9ca3af" }}>{icon}</span>
      <span style={{ fontSize: 12, color: "#6b7280" }}>{text}</span>
    </div>
  );
}

export function VehicleCareVendorPortal() {
  const [tab, setTab] = useState<Tab>("Today");
  const [jobs, setJobs] = useState<Job[]>(JOBS as Job[]);
  const historyJobs: Job[] = HISTORY as Job[];

  const handleStatusUpdate = (id: number, newStatus: string) => {
    setJobs(prev => prev.map(j => j.id === id ? { ...j, status: newStatus } : j));
  };

  const todayJobs = jobs.filter(j => !["COMPLETED","CANCELLED","NO_SHOW"].includes(j.status));
  const upcomingJobs = jobs.filter(j => ["CONFIRMED","ASSIGNED"].includes(j.status));

  const todayCompleted = historyJobs.filter(j => j.status === "COMPLETED").length;
  const todayRevenue = historyJobs.reduce((sum, j) => sum + parseInt(j.amount.replace(/[^0-9]/g, ""), 10), 0);

  return (
    <div style={{ maxWidth: 680, margin: "0 auto", padding: "20px 16px", background: "#f8fafc", minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)", borderRadius: 16, padding: "20px", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(2,132,199,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Wrench size={22} style={{ color: "#38bdf8" }} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 17, color: "#fff" }}>Technician Portal</div>
            <div style={{ fontSize: 12, color: "#94a3b8" }}>Vehicle Care · Washcaro</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <StatChip label="Today's Jobs" value={String(jobs.length + historyJobs.length)} />
          <StatChip label="Completed" value={String(todayCompleted)} />
          <StatChip label="Revenue" value={`₹${todayRevenue.toLocaleString()}`} />
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", background: "#fff", borderRadius: 10, padding: 4, marginBottom: 16, border: "1px solid #e5e7eb" }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            flex: 1, padding: "8px 0", border: "none", borderRadius: 7, cursor: "pointer",
            background: tab === t ? "#0284c7" : "transparent",
            color: tab === t ? "#fff" : "#6b7280",
            fontWeight: tab === t ? 600 : 400, fontSize: 13,
          }}>{t}</button>
        ))}
      </div>

      {/* Content */}
      {tab === "Today" && (
        todayJobs.length === 0
          ? <EmptyState icon={<CheckCircle2 size={32} style={{ color: "#10b981" }} />} text="All done for today!" />
          : todayJobs.map(j => <JobCard key={j.id} job={j} onStatusUpdate={handleStatusUpdate} />)
      )}
      {tab === "Upcoming" && (
        upcomingJobs.length === 0
          ? <EmptyState icon={<Clock size={32} style={{ color: "#0284c7" }} />} text="No upcoming jobs" />
          : upcomingJobs.map(j => <JobCard key={j.id} job={j} onStatusUpdate={handleStatusUpdate} />)
      )}
      {tab === "History" && (
        historyJobs.length === 0
          ? <EmptyState icon={<Hash size={32} style={{ color: "#6b7280" }} />} text="No history yet" />
          : historyJobs.map(j => <JobCard key={j.id} job={j} onStatusUpdate={handleStatusUpdate} />)
      )}
    </div>
  );
}

function StatChip({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ flex: 1, background: "rgba(255,255,255,0.08)", borderRadius: 10, padding: "10px 12px" }}>
      <div style={{ fontSize: 18, fontWeight: 700, color: "#fff" }}>{value}</div>
      <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{label}</div>
    </div>
  );
}

function EmptyState({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div style={{ textAlign: "center", padding: "48px 0", color: "#9ca3af" }}>
      <div style={{ marginBottom: 12 }}>{icon}</div>
      <div style={{ fontSize: 15 }}>{text}</div>
    </div>
  );
}
