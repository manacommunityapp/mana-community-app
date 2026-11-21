import { useState, useEffect, useCallback } from "react";
import {
  Car, Wrench, Calendar, TrendingUp, Users, CheckCircle2,
  Clock, AlertCircle, Star, ChevronRight, RefreshCw, MapPin, Sparkles, ShieldCheck
} from "lucide-react";
import {
  vehicleCareService,
  type VehicleCareBookingResponse,
  type VehicleServiceCatalogResponse,
  type VehicleCarePlanCatalogResponse,
} from "../../../services/vehicleCareService";
import {
  automationService,
  type WashSlotWaterAuditResponse,
  type WashSubscriptionReconcileResponse,
} from "../../../services/automation/automationService";

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

const DEFAULT_STATS = [
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

const DEFAULT_CATALOG = [
  { name: "Express Exterior Wash", duration: "30 min", price: "₹249", popular: true,  bookings: 112 },
  { name: "Interior Vacuum",       duration: "45 min", price: "₹299", popular: false, bookings: 68  },
  { name: "Full Detail Wash",      duration: "90 min", price: "₹599", popular: true,  bookings: 94  },
  { name: "Ceramic Coating",       duration: "4 hrs",  price: "₹3,499",popular: false,bookings: 12  },
  { name: "Bike Full Service Wash",duration: "45 min", price: "₹199", popular: true,  bookings: 55  },
  { name: "Engine Bay Cleaning",   duration: "60 min", price: "₹699", popular: false, bookings: 23  },
];

const DEFAULT_PLANS = [
  { name: "Basic Plan",    freq: "Every 4 Days",  price: "₹999",  active: 34 },
  { name: "Standard Plan", freq: "Every 3 Days",  price: "₹1,299",active: 21 },
  { name: "Premium Plan",  freq: "Every 2 Days",  price: "₹1,799",active: 14 },
  { name: "Daily Shine",   freq: "Daily",         price: "₹2,999",active: 8  },
];

function StatCard({ stat }: { stat: typeof DEFAULT_STATS[number] }) {
  const Icon = stat.icon;
  return (
    <div style={{ background: "#fff", borderRadius: 12, padding: "16px 20px", border: "1px solid #e5e7eb", flex: 1, minWidth: 200 }}>
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
  const [liveBookings, setLiveBookings] = useState<any[]>(SAMPLE_BOOKINGS);
  const [catalogItems, setCatalogItems] = useState<any[]>(DEFAULT_CATALOG);
  const [planItems, setPlanItems] = useState<any[]>(DEFAULT_PLANS);
  const [loading, setLoading] = useState(false);

  // AI Wash Slot & Recycled Water Quota Auditor
  const [isAuditingWater, setIsAuditingWater] = useState(false);
  const [waterResult, setWaterResult] = useState<WashSlotWaterAuditResponse | null>(null);
  const [showWaterModal, setShowWaterModal] = useState(false);

  // AI Vendor Subscription & QC Reconciler
  const [isReconciling, setIsReconciling] = useState(false);
  const [reconcileResult, setReconcileResult] = useState<WashSubscriptionReconcileResponse | null>(null);
  const [showReconcileModal, setShowReconcileModal] = useState(false);

  const handleAuditWater = async () => {
    setIsAuditingWater(true);
    try {
      const res = await automationService.auditWashSlotWaterRecycling({
        bookingId: "VC-SLOT-AUDIT-TODAY",
        vehicleType: "SUV",
        vehicleNumber: "KA-01-MJ-8890",
        parkingSlot: "Basement B2 Bay 14",
        washType: "WATERLESS_ECO_FOAM",
        preferredTimeSlot: "06:30 AM - 07:15 AM",
        allocatedBasementBay: "Bay 14-18 Wash Corridor"
      });
      setWaterResult(res);
      setShowWaterModal(true);
    } catch (err) {
      console.error("AI Water Quota Audit error:", err);
    } finally {
      setIsAuditingWater(false);
    }
  };

  const handleReconcileVendor = async () => {
    setIsReconciling(true);
    try {
      const res = await automationService.reconcileWashSubscription({
        subscriptionId: "SUB-WASHCARO-NOV-2026",
        vendorId: "VEND-WASHCARO-01",
        vendorName: "Washcaro Doorstep Operations Pvt Ltd",
        residentFlat: "Society Aggregated Fleet",
        scheduledWashes: 240,
        completedWashes: 228,
        residentRatingAvg: 4.75,
        reportedMissedDates: ["2026-11-04 (Heavy Rain)", "2026-11-12 (Staff Shift)"]
      });
      setReconcileResult(res);
      setShowReconcileModal(true);
    } catch (err) {
      console.error("AI Subscription Reconcile error:", err);
    } finally {
      setIsReconciling(false);
    }
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [bookingsPage, catalogRes, plansRes] = await Promise.allSettled([
        vehicleCareService.getAdminBookings("ALL", 0, 50),
        vehicleCareService.getCatalog(),
        vehicleCareService.getPlanCatalog(),
      ]);

      if (bookingsPage.status === "fulfilled" && bookingsPage.value?.content?.length) {
        setLiveBookings(bookingsPage.value.content.map((b: VehicleCareBookingResponse) => ({
          id: b.bookingNumber || `VC-${b.id}`,
          status: b.status || "CONFIRMED",
          resident: b.vehicleNickname || "Resident",
          flat: b.locationNotes || "Apartment",
          service: b.serviceName || "Wash Service",
          vehicle: b.vehicleDisplay || b.vehiclePlate || "Vehicle",
          time: `${b.scheduledStart || b.startTime || "09:00"}–${b.scheduledEnd || b.endTime || "10:00"}`,
          tech: b.technicianName || "Unassigned",
          amount: `₹${b.totalAmount || b.paidAmount || 0}`,
        })));
      }

      if (catalogRes.status === "fulfilled" && catalogRes.value?.length) {
        setCatalogItems(catalogRes.value.map((c: VehicleServiceCatalogResponse) => ({
          name: c.name,
          duration: `${c.durationMinutes || 30} min`,
          price: `₹${c.communityPrice || c.basePrice}`,
          popular: !!c.isPopular,
          bookings: 45,
        })));
      }

      if (plansRes.status === "fulfilled" && plansRes.value?.length) {
        setPlanItems(plansRes.value.map((p: VehicleCarePlanCatalogResponse) => ({
          name: p.name,
          freq: p.frequencyLabel || p.frequency || "Monthly",
          price: `₹${p.price}`,
          active: p.creditsPerCycle || p.washesPerMonth || 12,
        })));
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const stats = [
    { label: "Today's Bookings", value: String(liveBookings.length), icon: Calendar, color: "#3b82f6" },
    { label: "Completed", value: String(liveBookings.filter(b => b.status === "COMPLETED").length), icon: CheckCircle2, color: "#10b981" },
    { label: "Active Jobs", value: String(liveBookings.filter(b => ["CONFIRMED", "ASSIGNED", "EN_ROUTE", "ARRIVED", "IN_PROGRESS"].includes(b.status)).length), icon: Wrench, color: "#f59e0b" },
    {
      label: "Total Revenue",
      value: `₹${liveBookings.reduce((sum, b) => {
        const val = parseInt(b.amount?.replace(/[^\d]/g, "") || "0", 10);
        return sum + (isNaN(val) ? 0 : val);
      }, 0).toLocaleString("en-IN")}`,
      icon: TrendingUp,
      color: "#8b5cf6"
    },
  ];

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
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <button
            onClick={handleAuditWater}
            disabled={isAuditingWater}
            style={{
              display: "flex", alignItems: "center", gap: 6, padding: "8px 12px",
              borderRadius: 8, border: "1px solid #7dd3fc", background: "#f0f9ff",
              color: "#0369a1", cursor: isAuditingWater ? "not-allowed" : "pointer",
              fontSize: 12, fontWeight: 600
            }}
          >
            <Sparkles size={14} style={{ color: "#0284c7" }} />
            {isAuditingWater ? "Auditing Water Quota..." : "AI Water Quota"}
          </button>
          <button
            onClick={handleReconcileVendor}
            disabled={isReconciling}
            style={{
              display: "flex", alignItems: "center", gap: 6, padding: "8px 12px",
              borderRadius: 8, border: "1px solid #c4b5fd", background: "#f5f3ff",
              color: "#6d28d9", cursor: isReconciling ? "not-allowed" : "pointer",
              fontSize: 12, fontWeight: 600
            }}
          >
            <Sparkles size={14} style={{ color: "#7c3aed" }} />
            {isReconciling ? "Reconciling..." : "AI Vendor Reconcile"}
          </button>
          <button onClick={loadData} disabled={loading} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8, border: "1px solid #e5e7eb", background: "#fff", cursor: loading ? "not-allowed" : "pointer", fontSize: 13, opacity: loading ? 0.7 : 1 }}>
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />{loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
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
            {stats.map(s => <StatCard key={s.label} stat={s} />)}
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
                {liveBookings.map((b, i) => (
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
              {liveBookings.map((b, i) => (
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
              {catalogItems.map((c, i) => (
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
              {planItems.map((p, i) => (
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

      {/* AI Water Quota & Eco Wash Modal */}
      {showWaterModal && waterResult && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={(e) => { if (e.target === e.currentTarget) setShowWaterModal(false); }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 24, maxWidth: 540, width: "100%", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #e5e7eb", paddingBottom: 12, marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Sparkles size={20} style={{ color: "#0284c7" }} />
                <span style={{ fontWeight: 700, fontSize: 16, color: "#111827" }}>AI Doorstep Wash & Water Quota Audit</span>
              </div>
              <span style={{
                fontSize: 11, fontWeight: 700, padding: "4px 8px", borderRadius: 20,
                background: waterResult.slotApproved ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)",
                color: waterResult.slotApproved ? "#10b981" : "#ef4444"
              }}>
                {waterResult.waterComplianceStatus.replace("_", " ")}
              </span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, background: "#f8fafc", padding: 12, borderRadius: 12, marginBottom: 16, border: "1px solid #e2e8f0" }}>
              <div>
                <span style={{ fontSize: 11, color: "#64748b", display: "block" }}>RECYCLED WATER</span>
                <span style={{ fontWeight: 700, fontSize: 14, color: "#0284c7" }}>{waterResult.allocatedLitersRecycled} Liters</span>
              </div>
              <div>
                <span style={{ fontSize: 11, color: "#64748b", display: "block" }}>FRESHWATER USED</span>
                <span style={{ fontWeight: 700, fontSize: 14, color: "#10b981" }}>{waterResult.allocatedFreshwaterLiters} Liters</span>
              </div>
              <div>
                <span style={{ fontSize: 11, color: "#64748b", display: "block" }}>WATER SAVED</span>
                <span style={{ fontWeight: 700, fontSize: 14, color: "#059669" }}>+{waterResult.waterSavedVsTraditionalWashLiters} L</span>
              </div>
            </div>

            <div style={{ background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 12, padding: 12, marginBottom: 16, fontSize: 12, color: "#0369a1" }}>
              <div style={{ fontWeight: 600, marginBottom: 4, display: "flex", justifyContent: "space-between" }}>
                <span>Optimal Slot Window: {waterResult.slotTimeRecommended}</span>
                <span style={{ background: "#e0f2fe", padding: "2px 6px", borderRadius: 4, fontSize: 10 }}>{waterResult.ecoCertificationTag}</span>
              </div>
              <div>Basement B2 runoff drainage clear: {waterResult.basementDrainageClearance ? "Yes (Certified)" : "No"}</div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#374151", textTransform: "uppercase", display: "block", marginBottom: 6 }}>Eco-Wash Protocols</span>
              {waterResult.recommendations?.map((r, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#4b5563", marginBottom: 4 }}>
                  <ShieldCheck size={14} style={{ color: "#0284c7", flexShrink: 0 }} />
                  <span>{r}</span>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowWaterModal(false)}
                style={{ padding: "8px 16px", borderRadius: 8, background: "#0284c7", color: "#fff", border: "none", fontWeight: 600, fontSize: 13, cursor: "pointer" }}
              >
                Approve & Enforce Slot
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Vendor Subscription Reconciler Modal */}
      {showReconcileModal && reconcileResult && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={(e) => { if (e.target === e.currentTarget) setShowReconcileModal(false); }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 24, maxWidth: 540, width: "100%", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #e5e7eb", paddingBottom: 12, marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Sparkles size={20} style={{ color: "#7c3aed" }} />
                <span style={{ fontWeight: 700, fontSize: 16, color: "#111827" }}>AI Wash Vendor QC & Attendance Audit</span>
              </div>
              <span style={{
                fontSize: 11, fontWeight: 700, padding: "4px 8px", borderRadius: 20,
                background: "rgba(124,58,237,0.12)", color: "#7c3aed"
              }}>
                {reconcileResult.reconciliationVerdict}
              </span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, background: "#f8fafc", padding: 12, borderRadius: 12, marginBottom: 16, border: "1px solid #e2e8f0" }}>
              <div>
                <span style={{ fontSize: 11, color: "#64748b", display: "block" }}>SCHEDULED / DONE</span>
                <span style={{ fontWeight: 700, fontSize: 14, color: "#111827" }}>{reconcileResult.scheduledWashes} / {reconcileResult.completedWashes}</span>
              </div>
              <div>
                <span style={{ fontSize: 11, color: "#64748b", display: "block" }}>MISSED (VENDOR FAULT)</span>
                <span style={{ fontWeight: 700, fontSize: 14, color: "#ef4444" }}>{reconcileResult.missedWashesVendorFault} Days</span>
              </div>
              <div>
                <span style={{ fontSize: 11, color: "#64748b", display: "block" }}>AUTO-CREDIT REFUND</span>
                <span style={{ fontWeight: 700, fontSize: 14, color: "#10b981" }}>₹{reconcileResult.compensatoryCreditInr}</span>
              </div>
            </div>

            <div style={{ background: "#faf5ff", border: "1px solid #e9d5ff", borderRadius: 12, padding: 12, marginBottom: 16, fontSize: 12, color: "#6b21a8" }}>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>Audit Findings & Streak Bonus</div>
              <p style={{ margin: 0, lineHeight: 1.5 }}>{reconcileResult.auditSummary}</p>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button
                onClick={() => setShowReconcileModal(false)}
                style={{ padding: "8px 16px", borderRadius: 8, background: "#f3f4f6", color: "#374151", border: "none", fontWeight: 600, fontSize: 13, cursor: "pointer" }}
              >
                Close
              </button>
              <button
                onClick={() => {
                  alert(`Compensatory credit of ₹${reconcileResult.compensatoryCreditInr} credited to fleet accounts!`);
                  setShowReconcileModal(false);
                }}
                style={{ padding: "8px 16px", borderRadius: 8, background: "#7c3aed", color: "#fff", border: "none", fontWeight: 600, fontSize: 13, cursor: "pointer" }}
              >
                Disburse Credits & Settle
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
