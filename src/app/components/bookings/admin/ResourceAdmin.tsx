import { useState, useEffect, useCallback } from "react";
import { cn } from "../../ui/utils";
import {
  LayoutDashboard, FolderOpen, Server, CalendarDays, DollarSign, Scale,
  Wrench, Tag, BarChart3, Plus, Pencil, Trash2, Eye, Check, X, Loader2,
  ChevronDown, Search, Filter, ArrowUpDown,
} from "lucide-react";
import type {
  ResourceCategoryResponse, ResourceResponse, ResourceBookingResponse,
  PricingRuleResponse, BusinessRuleResponse, MaintenanceResponse,
  CouponResponse, BookingAnalyticsResponse, DashboardStatsResponse,
  ResourceCategoryRequest, ResourceRequest, PricingRuleRequest,
  BusinessRuleRequest, MaintenanceRequest, CouponRequest,
  BookingStatus, ResourceStatus, BookingType, PricingType, RuleType,
  MaintenanceType, DiscountType, PageResponse,
} from "../../../../types/booking";

// ---------------------------------------------------------------------------
// Types & constants
// ---------------------------------------------------------------------------
type TabId = "dashboard" | "categories" | "resources" | "bookings" | "pricing" | "rules" | "maintenance" | "coupons" | "analytics";

const TABS: { id: TabId; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "categories", label: "Categories", icon: FolderOpen },
  { id: "resources", label: "Resources", icon: Server },
  { id: "bookings", label: "Bookings", icon: CalendarDays },
  { id: "pricing", label: "Pricing", icon: DollarSign },
  { id: "rules", label: "Rules", icon: Scale },
  { id: "maintenance", label: "Maintenance", icon: Wrench },
  { id: "coupons", label: "Coupons", icon: Tag },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
];

const BOOKING_STATUSES: BookingStatus[] = ["PENDING", "CONFIRMED", "CHECKED_IN", "CHECKED_OUT", "CANCELLED", "NO_SHOW", "WAITLISTED", "REJECTED", "COMPLETED"];
const RESOURCE_STATUSES: ResourceStatus[] = ["ACTIVE", "INACTIVE", "MAINTENANCE", "RETIRED"];
const BOOKING_TYPES: BookingType[] = ["SLOT_BASED", "HOURLY", "DAILY", "WEEKLY", "MONTHLY"];
const PRICING_TYPES: PricingType[] = ["BASE_HOURLY", "WEEKEND", "FESTIVAL", "MEMBER", "GUEST", "PEAK_HOUR", "DISCOUNT", "SECURITY_DEPOSIT", "LATE_CHARGE", "TAX"];
const RULE_TYPES: RuleType[] = ["MAX_BOOKINGS", "MEMBERS_ONLY", "GUESTS_ALLOWED", "AGE_RESTRICTION", "GENDER_RESTRICTION", "DEPOSIT_REQUIRED", "SECURITY_APPROVAL", "COMMITTEE_APPROVAL", "WEEKDAY_RULE", "WEEKEND_RULE", "FESTIVAL_RULE", "RECURRING_RULE", "TIME_RESTRICTION", "CAPACITY_LIMIT"];
const MAINTENANCE_TYPES: MaintenanceType[] = ["SCHEDULED", "EMERGENCY", "CLEANING", "REPAIR", "UPGRADE"];
const DISCOUNT_TYPES: DiscountType[] = ["PERCENTAGE", "FIXED"];

const statusColor: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  CONFIRMED: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  CHECKED_IN: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  CHECKED_OUT: "bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-400",
  CANCELLED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  NO_SHOW: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  WAITLISTED: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  REJECTED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  COMPLETED: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  ACTIVE: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  INACTIVE: "bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-400",
  MAINTENANCE: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  RETIRED: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
  PLANNED: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  IN_PROGRESS: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
};

// ---------------------------------------------------------------------------
// Shared small components
// ---------------------------------------------------------------------------
function Badge({ status }: { status: string }) {
  return (
    <span className={cn("inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold", statusColor[status] ?? "bg-muted text-muted-foreground")}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

function Spinner() {
  return <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />;
}

function EmptyState({ message }: { message: string }) {
  return <div className="py-16 text-center text-sm text-muted-foreground">{message}</div>;
}

function ConfirmDialog({ message, onConfirm, onCancel }: { message: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card rounded-2xl shadow-2xl border border-border p-6 max-w-sm w-full mx-4">
        <p className="text-sm text-foreground mb-5">{message}</p>
        <div className="flex justify-end gap-2">
          <button onClick={onCancel} className="bg-muted text-foreground rounded-xl px-4 py-2.5 text-sm font-bold hover:bg-muted/80">Cancel</button>
          <button onClick={onConfirm} className="bg-red-500 text-white rounded-xl px-4 py-2.5 text-sm font-bold">Delete</button>
        </div>
      </div>
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-card rounded-2xl shadow-2xl border border-border max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h3 className="text-lg font-bold text-foreground">{title}</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

const inputCls = "bg-input border border-border rounded-xl px-3 py-2.5 text-sm w-full text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40";
const labelCls = "block text-sm font-medium text-foreground mb-1";
const sectionCls = "text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3 mt-6 first:mt-0";
const primaryBtn = "bg-primary text-white rounded-xl px-4 py-2.5 text-sm font-bold hover:bg-primary/90 inline-flex items-center gap-1.5";
const secondaryBtn = "bg-muted text-foreground rounded-xl px-4 py-2.5 text-sm font-bold hover:bg-muted/80 inline-flex items-center gap-1.5";
const dangerBtn = "bg-red-500 text-white rounded-xl px-4 py-2.5 text-sm font-bold inline-flex items-center gap-1.5";

// ---------------------------------------------------------------------------
// Mock service layer - replace with real API calls
// ---------------------------------------------------------------------------
const wait = (ms = 400) => new Promise((r) => setTimeout(r, ms));

const mockDashboard: DashboardStatsResponse = {
  totalResources: 24, totalBookings: 186, todayBookings: 12, activeBookings: 8,
  occupancyRate: 73.5, revenue: 42500, cancellationRate: 4.2,
  topResources: [
    { name: "Tennis Court A", bookings: 48, revenue: 12000 },
    { name: "Banquet Hall", bookings: 22, revenue: 18500 },
  ],
  recentBookings: [],
};

function useMockData<T>(initial: T) {
  const [data, setData] = useState<T>(initial);
  const [loading, setLoading] = useState(true);
  useEffect(() => { const t = setTimeout(() => setLoading(false), 600); return () => clearTimeout(t); }, []);
  return { data, setData, loading };
}

// ---------------------------------------------------------------------------
// Tab content components
// ---------------------------------------------------------------------------

function DashboardTab() {
  const { loading } = useMockData(mockDashboard);
  const stats = mockDashboard;

  if (loading) return <div className="flex justify-center py-20"><Spinner /></div>;

  const cards = [
    { label: "Total Resources", value: stats.totalResources, icon: Server },
    { label: "Bookings (Month)", value: stats.totalBookings, icon: CalendarDays },
    { label: "Revenue (Month)", value: `$${stats.revenue.toLocaleString()}`, icon: DollarSign },
    { label: "Occupancy Rate", value: `${stats.occupancyRate}%`, icon: BarChart3 },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="bg-card border border-border rounded-2xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">{c.label}</span>
              <c.icon className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-2xl font-black text-foreground">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-card border border-border rounded-2xl shadow-sm p-6">
        <h3 className="text-base font-bold text-foreground mb-4">Top Resources</h3>
        {stats.topResources.length === 0 ? <EmptyState message="No data yet" /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="bg-muted/50 text-left"><th className="px-4 py-2 font-medium">Resource</th><th className="px-4 py-2 font-medium">Bookings</th><th className="px-4 py-2 font-medium">Revenue</th></tr></thead>
              <tbody>{stats.topResources.map((r) => (
                <tr key={r.name} className="border-t border-border hover:bg-muted/30">
                  <td className="px-4 py-2">{r.name}</td><td className="px-4 py-2">{r.bookings}</td><td className="px-4 py-2">${r.revenue.toLocaleString()}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <button className={primaryBtn}><Plus className="h-4 w-4" /> Add Resource</button>
        <button className={secondaryBtn}><Plus className="h-4 w-4" /> Add Category</button>
        <button className={secondaryBtn}><Eye className="h-4 w-4" /> View All Bookings</button>
      </div>
    </div>
  );
}

// ---- Categories Tab ----
function CategoriesTab() {
  const [categories, setCategories] = useState<ResourceCategoryResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ResourceCategoryResponse | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [form, setForm] = useState<ResourceCategoryRequest>({ name: "", icon: "", color: "#3b82f6", description: "", displayOrder: 0, status: "ACTIVE", imageUrl: "" });

  useEffect(() => { setTimeout(() => setLoading(false), 500); }, []);

  const openEdit = (cat: ResourceCategoryResponse) => {
    setEditing(cat);
    setForm({ name: cat.name, icon: cat.icon ?? "", color: cat.color ?? "#3b82f6", description: cat.description ?? "", displayOrder: cat.displayOrder, status: cat.status, imageUrl: cat.imageUrl ?? "" });
    setShowForm(true);
  };

  const openNew = () => {
    setEditing(null);
    setForm({ name: "", icon: "", color: "#3b82f6", description: "", displayOrder: 0, status: "ACTIVE", imageUrl: "" });
    setShowForm(true);
  };

  const handleSave = async () => {
    await wait();
    if (editing) {
      setCategories((prev) => prev.map((c) => c.id === editing.id ? { ...c, ...form } as ResourceCategoryResponse : c));
    } else {
      setCategories((prev) => [...prev, { id: Date.now(), ...form, resourceCount: 0, communityId: 1 } as ResourceCategoryResponse]);
    }
    setShowForm(false);
  };

  const handleDelete = async (id: number) => {
    await wait();
    setCategories((prev) => prev.filter((c) => c.id !== id));
    setDeleting(null);
  };

  if (loading) return <div className="flex justify-center py-20"><Spinner /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-foreground">Resource Categories</h3>
        <button onClick={openNew} className={primaryBtn}><Plus className="h-4 w-4" /> Add Category</button>
      </div>

      {categories.length === 0 ? <EmptyState message="No categories created yet. Add your first category to get started." /> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat) => (
            <div key={cat.id} className="bg-card border border-border rounded-2xl shadow-sm p-5">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  {cat.color && <span className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />}
                  <h4 className="font-bold text-foreground">{cat.name}</h4>
                </div>
                <Badge status={cat.status} />
              </div>
              {cat.description && <p className="text-sm text-muted-foreground mb-3">{cat.description}</p>}
              <p className="text-xs text-muted-foreground mb-3">{cat.resourceCount} resources</p>
              <div className="flex gap-2">
                <button onClick={() => openEdit(cat)} className={secondaryBtn}><Pencil className="h-3.5 w-3.5" /> Edit</button>
                <button onClick={() => setDeleting(cat.id)} className={dangerBtn}><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <Modal title={editing ? "Edit Category" : "New Category"} onClose={() => setShowForm(false)}>
          <div className="space-y-4">
            <div><label className={labelCls}>Name</label><input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className={labelCls}>Icon</label><input className={inputCls} value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} placeholder="e.g. tennis-ball" /></div>
              <div><label className={labelCls}>Color</label><input type="color" className={cn(inputCls, "h-10 p-1")} value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} /></div>
            </div>
            <div><label className={labelCls}>Description</label><textarea className={cn(inputCls, "min-h-[80px]")} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className={labelCls}>Display Order</label><input type="number" className={inputCls} value={form.displayOrder} onChange={(e) => setForm({ ...form, displayOrder: Number(e.target.value) })} /></div>
              <div>
                <label className={labelCls}>Status</label>
                <select className={inputCls} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  <option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option>
                </select>
              </div>
            </div>
            <div><label className={labelCls}>Image URL</label><input className={inputCls} value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} /></div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShowForm(false)} className={secondaryBtn}>Cancel</button>
              <button onClick={handleSave} className={primaryBtn}>{editing ? "Save Changes" : "Create Category"}</button>
            </div>
          </div>
        </Modal>
      )}

      {deleting !== null && <ConfirmDialog message="Are you sure you want to delete this category? All associated resources will be unlinked." onConfirm={() => handleDelete(deleting)} onCancel={() => setDeleting(null)} />}
    </div>
  );
}

// ---- Resources Tab ----
function ResourcesTab() {
  const [resources, setResources] = useState<ResourceResponse[]>([]);
  const [categories] = useState<ResourceCategoryResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ResourceResponse | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [filterCategory, setFilterCategory] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [search, setSearch] = useState("");

  const defaultForm: ResourceRequest = { name: "", categoryId: 0, description: "", capacity: undefined, location: "", building: "", floor: "", latitude: undefined, longitude: undefined, openTime: "08:00", closeTime: "22:00", bookingDurationMinutes: 60, minimumDurationMinutes: 30, maximumDurationMinutes: 240, bufferTimeMinutes: 15, cleaningTimeMinutes: 0, advanceBookingDays: 30, maxBookingsPerUser: 5, maxActiveBookings: 2, cancellationHours: 24, autoCancel: true, approvalRequired: false, depositRequired: false, paymentRequired: true, allowWaitlist: true, allowGuest: false, qrCheckIn: false, recurringBookingAllowed: false, maxCapacity: undefined, bookingType: "HOURLY", status: "ACTIVE" };
  const [form, setForm] = useState<ResourceRequest>(defaultForm);

  useEffect(() => { setTimeout(() => setLoading(false), 500); }, []);

  const filtered = resources.filter((r) => {
    if (filterCategory && r.categoryName !== filterCategory) return false;
    if (filterStatus && r.status !== filterStatus) return false;
    if (search && !r.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const openNew = () => { setEditing(null); setForm(defaultForm); setShowForm(true); };
  const openEdit = (res: ResourceResponse) => {
    setEditing(res);
    setForm({ name: res.name, categoryId: res.categoryId, description: res.description ?? "", capacity: res.capacity ?? undefined, location: res.location ?? "", building: res.building ?? "", floor: res.floor ?? "", latitude: res.latitude ?? undefined, longitude: res.longitude ?? undefined, openTime: res.openTime ?? "08:00", closeTime: res.closeTime ?? "22:00", bookingDurationMinutes: res.bookingDurationMinutes ?? 60, minimumDurationMinutes: res.minimumDurationMinutes ?? 30, maximumDurationMinutes: res.maximumDurationMinutes ?? 240, bufferTimeMinutes: res.bufferTimeMinutes ?? 15, cleaningTimeMinutes: res.cleaningTimeMinutes ?? 0, advanceBookingDays: res.advanceBookingDays ?? 30, maxBookingsPerUser: res.maxBookingsPerUser ?? 5, maxActiveBookings: res.maxActiveBookings ?? 2, cancellationHours: res.cancellationHours ?? 24, autoCancel: res.autoCancel, approvalRequired: res.approvalRequired, depositRequired: res.depositRequired, paymentRequired: res.paymentRequired, allowWaitlist: res.allowWaitlist, allowGuest: res.allowGuest, qrCheckIn: res.qrCheckIn, recurringBookingAllowed: res.recurringBookingAllowed, maxCapacity: res.maxCapacity ?? undefined, bookingType: res.bookingType, status: res.status });
    setShowForm(true);
  };

  const handleSave = async () => { await wait(); setShowForm(false); };
  const handleDelete = async (id: number) => { await wait(); setResources((p) => p.filter((r) => r.id !== id)); setDeleting(null); };
  const toggleActive = (id: number) => setResources((p) => p.map((r) => r.id === id ? { ...r, status: r.status === "ACTIVE" ? "INACTIVE" as ResourceStatus : "ACTIVE" as ResourceStatus } : r));

  const toggleField = (key: keyof ResourceRequest) => setForm((f) => ({ ...f, [key]: !f[key] }));
  const setField = (key: keyof ResourceRequest, val: unknown) => setForm((f) => ({ ...f, [key]: val }));

  if (loading) return <div className="flex justify-center py-20"><Spinner /></div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h3 className="text-lg font-bold text-foreground">Resources</h3>
        <button onClick={openNew} className={primaryBtn}><Plus className="h-4 w-4" /> Add Resource</button>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input className={cn(inputCls, "pl-9 w-56")} placeholder="Search resources..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className={cn(inputCls, "w-44")} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="">All Statuses</option>
          {RESOURCE_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select className={cn(inputCls, "w-44")} value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
          <option value="">All Categories</option>
          {categories.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? <EmptyState message="No resources found. Create your first resource to begin." /> : (
        <div className="bg-card rounded-2xl border border-border overflow-hidden overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-muted/50 text-left">
              <th className="px-4 py-3 font-medium">Name</th><th className="px-4 py-3 font-medium">Category</th><th className="px-4 py-3 font-medium">Type</th><th className="px-4 py-3 font-medium">Capacity</th><th className="px-4 py-3 font-medium">Status</th><th className="px-4 py-3 font-medium">Bookings</th><th className="px-4 py-3 font-medium">Actions</th>
            </tr></thead>
            <tbody>{filtered.map((r) => (
              <tr key={r.id} className="border-t border-border hover:bg-muted/30">
                <td className="px-4 py-3 font-medium">{r.name}</td>
                <td className="px-4 py-3">{r.categoryName}</td>
                <td className="px-4 py-3">{r.bookingType}</td>
                <td className="px-4 py-3">{r.maxCapacity ?? "-"}</td>
                <td className="px-4 py-3"><Badge status={r.status} /></td>
                <td className="px-4 py-3">{r.totalBookings}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(r)} className="p-1.5 rounded-lg hover:bg-muted"><Pencil className="h-3.5 w-3.5" /></button>
                    <button onClick={() => toggleActive(r.id)} className="p-1.5 rounded-lg hover:bg-muted">{r.status === "ACTIVE" ? <X className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" />}</button>
                    <button onClick={() => setDeleting(r.id)} className="p-1.5 rounded-lg hover:bg-muted text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}

      {showForm && (
        <Modal title={editing ? "Edit Resource" : "New Resource"} onClose={() => setShowForm(false)}>
          <div className="space-y-2">
            <p className={sectionCls}>Basic Info</p>
            <div><label className={labelCls}>Name</label><input className={inputCls} value={form.name} onChange={(e) => setField("name", e.target.value)} /></div>
            <div><label className={labelCls}>Category</label>
              <select className={inputCls} value={form.categoryId} onChange={(e) => setField("categoryId", Number(e.target.value))}>
                <option value={0}>Select category...</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div><label className={labelCls}>Description</label><textarea className={cn(inputCls, "min-h-[60px]")} value={form.description ?? ""} onChange={(e) => setField("description", e.target.value)} /></div>

            <p className={sectionCls}>Location</p>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={labelCls}>Building</label><input className={inputCls} value={form.building ?? ""} onChange={(e) => setField("building", e.target.value)} /></div>
              <div><label className={labelCls}>Floor</label><input className={inputCls} value={form.floor ?? ""} onChange={(e) => setField("floor", e.target.value)} /></div>
            </div>
            <div><label className={labelCls}>Location</label><input className={inputCls} value={form.location ?? ""} onChange={(e) => setField("location", e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={labelCls}>Latitude</label><input type="number" step="any" className={inputCls} value={form.latitude ?? ""} onChange={(e) => setField("latitude", e.target.value ? Number(e.target.value) : undefined)} /></div>
              <div><label className={labelCls}>Longitude</label><input type="number" step="any" className={inputCls} value={form.longitude ?? ""} onChange={(e) => setField("longitude", e.target.value ? Number(e.target.value) : undefined)} /></div>
            </div>

            <p className={sectionCls}>Timing</p>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={labelCls}>Open Time</label><input type="time" className={inputCls} value={form.openTime ?? ""} onChange={(e) => setField("openTime", e.target.value)} /></div>
              <div><label className={labelCls}>Close Time</label><input type="time" className={inputCls} value={form.closeTime ?? ""} onChange={(e) => setField("closeTime", e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><label className={labelCls}>Duration (min)</label><input type="number" className={inputCls} value={form.bookingDurationMinutes ?? ""} onChange={(e) => setField("bookingDurationMinutes", Number(e.target.value))} /></div>
              <div><label className={labelCls}>Min (min)</label><input type="number" className={inputCls} value={form.minimumDurationMinutes ?? ""} onChange={(e) => setField("minimumDurationMinutes", Number(e.target.value))} /></div>
              <div><label className={labelCls}>Max (min)</label><input type="number" className={inputCls} value={form.maximumDurationMinutes ?? ""} onChange={(e) => setField("maximumDurationMinutes", Number(e.target.value))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={labelCls}>Buffer (min)</label><input type="number" className={inputCls} value={form.bufferTimeMinutes ?? ""} onChange={(e) => setField("bufferTimeMinutes", Number(e.target.value))} /></div>
              <div><label className={labelCls}>Cleaning (min)</label><input type="number" className={inputCls} value={form.cleaningTimeMinutes ?? ""} onChange={(e) => setField("cleaningTimeMinutes", Number(e.target.value))} /></div>
            </div>

            <p className={sectionCls}>Booking Rules</p>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={labelCls}>Advance Days</label><input type="number" className={inputCls} value={form.advanceBookingDays ?? ""} onChange={(e) => setField("advanceBookingDays", Number(e.target.value))} /></div>
              <div><label className={labelCls}>Max Per User</label><input type="number" className={inputCls} value={form.maxBookingsPerUser ?? ""} onChange={(e) => setField("maxBookingsPerUser", Number(e.target.value))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={labelCls}>Max Active</label><input type="number" className={inputCls} value={form.maxActiveBookings ?? ""} onChange={(e) => setField("maxActiveBookings", Number(e.target.value))} /></div>
              <div><label className={labelCls}>Cancel Hours</label><input type="number" className={inputCls} value={form.cancellationHours ?? ""} onChange={(e) => setField("cancellationHours", Number(e.target.value))} /></div>
            </div>

            <p className={sectionCls}>Features</p>
            <div className="grid grid-cols-2 gap-3">
              {(["autoCancel", "approvalRequired", "depositRequired", "paymentRequired", "allowWaitlist", "allowGuest", "qrCheckIn", "recurringBookingAllowed"] as const).map((key) => (
                <label key={key} className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                  <input type="checkbox" checked={!!form[key]} onChange={() => toggleField(key)} className="rounded border-border" />
                  {key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase())}
                </label>
              ))}
            </div>

            <p className={sectionCls}>Capacity & Type</p>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={labelCls}>Max Capacity</label><input type="number" className={inputCls} value={form.maxCapacity ?? ""} onChange={(e) => setField("maxCapacity", e.target.value ? Number(e.target.value) : undefined)} /></div>
              <div><label className={labelCls}>Booking Type</label>
                <select className={inputCls} value={form.bookingType ?? "HOURLY"} onChange={(e) => setField("bookingType", e.target.value)}>
                  {BOOKING_TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <button onClick={() => setShowForm(false)} className={secondaryBtn}>Cancel</button>
              <button onClick={handleSave} className={primaryBtn}>{editing ? "Save Changes" : "Create Resource"}</button>
            </div>
          </div>
        </Modal>
      )}

      {deleting !== null && <ConfirmDialog message="Are you sure you want to delete this resource? All associated bookings will be affected." onConfirm={() => handleDelete(deleting)} onCancel={() => setDeleting(null)} />}
    </div>
  );
}

// ---- Bookings Tab ----
function BookingsTab() {
  const [bookings, setBookings] = useState<ResourceBookingResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("");
  const [page, setPage] = useState(0);
  const pageSize = 10;

  useEffect(() => { setTimeout(() => setLoading(false), 500); }, []);

  const filtered = bookings.filter((b) => !filterStatus || b.status === filterStatus);
  const paged = filtered.slice(page * pageSize, (page + 1) * pageSize);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  const updateStatus = (id: number, status: BookingStatus) => {
    setBookings((prev) => prev.map((b) => b.id === id ? { ...b, status } : b));
  };

  if (loading) return <div className="flex justify-center py-20"><Spinner /></div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h3 className="text-lg font-bold text-foreground">All Bookings</h3>
        <div className="flex gap-3">
          <select className={cn(inputCls, "w-40")} value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(0); }}>
            <option value="">All Statuses</option>
            {BOOKING_STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
          </select>
        </div>
      </div>

      {filtered.length === 0 ? <EmptyState message="No bookings found." /> : (
        <div className="bg-card rounded-2xl border border-border overflow-hidden overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-muted/50 text-left">
              <th className="px-4 py-3 font-medium">Booking #</th><th className="px-4 py-3 font-medium">Resource</th><th className="px-4 py-3 font-medium">User</th><th className="px-4 py-3 font-medium">Date</th><th className="px-4 py-3 font-medium">Time</th><th className="px-4 py-3 font-medium">Status</th><th className="px-4 py-3 font-medium">Amount</th><th className="px-4 py-3 font-medium">Actions</th>
            </tr></thead>
            <tbody>{paged.map((b) => (
              <tr key={b.id} className="border-t border-border hover:bg-muted/30">
                <td className="px-4 py-3 font-mono text-xs">{b.bookingNumber}</td>
                <td className="px-4 py-3">{b.resourceName}</td>
                <td className="px-4 py-3">{b.bookedByName}</td>
                <td className="px-4 py-3">{b.bookingDate}</td>
                <td className="px-4 py-3">{b.startTime} - {b.endTime}</td>
                <td className="px-4 py-3"><Badge status={b.status} /></td>
                <td className="px-4 py-3">{b.totalAmount != null ? `$${b.totalAmount}` : "-"}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    {b.status === "PENDING" && (
                      <>
                        <button onClick={() => updateStatus(b.id, "CONFIRMED")} className="p-1.5 rounded-lg hover:bg-muted text-green-600" title="Approve"><Check className="h-3.5 w-3.5" /></button>
                        <button onClick={() => updateStatus(b.id, "REJECTED")} className="p-1.5 rounded-lg hover:bg-muted text-red-500" title="Reject"><X className="h-3.5 w-3.5" /></button>
                      </>
                    )}
                    {!["CANCELLED", "COMPLETED", "REJECTED"].includes(b.status) && (
                      <button onClick={() => updateStatus(b.id, "CANCELLED")} className="p-1.5 rounded-lg hover:bg-muted text-red-500" title="Cancel"><Trash2 className="h-3.5 w-3.5" /></button>
                    )}
                    <button className="p-1.5 rounded-lg hover:bg-muted" title="View Details"><Eye className="h-3.5 w-3.5" /></button>
                  </div>
                </td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0} className={cn(secondaryBtn, "disabled:opacity-40")}>Prev</button>
          <span className="text-sm text-muted-foreground">Page {page + 1} of {totalPages}</span>
          <button onClick={() => setPage(Math.min(totalPages - 1, page + 1))} disabled={page >= totalPages - 1} className={cn(secondaryBtn, "disabled:opacity-40")}>Next</button>
        </div>
      )}
    </div>
  );
}

// ---- Pricing Tab ----
function PricingTab() {
  const [rules, setRules] = useState<PricingRuleResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<PricingRuleResponse | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [form, setForm] = useState<PricingRuleRequest>({ pricingType: "BASE_HOURLY", amount: 0, description: "" });

  useEffect(() => { setTimeout(() => setLoading(false), 500); }, []);

  const openNew = () => { setEditing(null); setForm({ pricingType: "BASE_HOURLY", amount: 0, description: "" }); setShowForm(true); };
  const openEdit = (rule: PricingRuleResponse) => {
    setEditing(rule);
    setForm({ resourceId: rule.resourceId ?? undefined, categoryId: rule.categoryId ?? undefined, pricingType: rule.pricingType, amount: rule.amount ?? undefined, percentage: rule.percentage ?? undefined, description: rule.description ?? "", validFrom: rule.validFrom ?? undefined, validTo: rule.validTo ?? undefined, dayOfWeek: rule.dayOfWeek ?? undefined, startTime: rule.startTime ?? undefined, endTime: rule.endTime ?? undefined });
    setShowForm(true);
  };
  const handleSave = async () => { await wait(); setShowForm(false); };
  const handleDelete = async (id: number) => { await wait(); setRules((p) => p.filter((r) => r.id !== id)); setDeleting(null); };
  const setField = (key: keyof PricingRuleRequest, val: unknown) => setForm((f) => ({ ...f, [key]: val }));

  if (loading) return <div className="flex justify-center py-20"><Spinner /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-foreground">Pricing Rules</h3>
        <button onClick={openNew} className={primaryBtn}><Plus className="h-4 w-4" /> Add Rule</button>
      </div>

      {rules.length === 0 ? <EmptyState message="No pricing rules configured." /> : (
        <div className="bg-card rounded-2xl border border-border overflow-hidden overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-muted/50 text-left">
              <th className="px-4 py-3 font-medium">Type</th><th className="px-4 py-3 font-medium">Amount</th><th className="px-4 py-3 font-medium">%</th><th className="px-4 py-3 font-medium">Description</th><th className="px-4 py-3 font-medium">Valid</th><th className="px-4 py-3 font-medium">Actions</th>
            </tr></thead>
            <tbody>{rules.map((r) => (
              <tr key={r.id} className="border-t border-border hover:bg-muted/30">
                <td className="px-4 py-3"><Badge status={r.pricingType} /></td>
                <td className="px-4 py-3">{r.amount != null ? `$${r.amount}` : "-"}</td>
                <td className="px-4 py-3">{r.percentage != null ? `${r.percentage}%` : "-"}</td>
                <td className="px-4 py-3">{r.description ?? "-"}</td>
                <td className="px-4 py-3 text-xs">{r.validFrom ?? "Always"}{r.validTo ? ` - ${r.validTo}` : ""}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(r)} className="p-1.5 rounded-lg hover:bg-muted"><Pencil className="h-3.5 w-3.5" /></button>
                    <button onClick={() => setDeleting(r.id)} className="p-1.5 rounded-lg hover:bg-muted text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}

      {showForm && (
        <Modal title={editing ? "Edit Pricing Rule" : "New Pricing Rule"} onClose={() => setShowForm(false)}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div><label className={labelCls}>Resource ID (optional)</label><input type="number" className={inputCls} value={form.resourceId ?? ""} onChange={(e) => setField("resourceId", e.target.value ? Number(e.target.value) : undefined)} /></div>
              <div><label className={labelCls}>Category ID (optional)</label><input type="number" className={inputCls} value={form.categoryId ?? ""} onChange={(e) => setField("categoryId", e.target.value ? Number(e.target.value) : undefined)} /></div>
            </div>
            <div><label className={labelCls}>Pricing Type</label>
              <select className={inputCls} value={form.pricingType} onChange={(e) => setField("pricingType", e.target.value)}>
                {PRICING_TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={labelCls}>Amount</label><input type="number" step="0.01" className={inputCls} value={form.amount ?? ""} onChange={(e) => setField("amount", e.target.value ? Number(e.target.value) : undefined)} /></div>
              <div><label className={labelCls}>Percentage</label><input type="number" step="0.01" className={inputCls} value={form.percentage ?? ""} onChange={(e) => setField("percentage", e.target.value ? Number(e.target.value) : undefined)} /></div>
            </div>
            <div><label className={labelCls}>Description</label><input className={inputCls} value={form.description ?? ""} onChange={(e) => setField("description", e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={labelCls}>Valid From</label><input type="date" className={inputCls} value={form.validFrom ?? ""} onChange={(e) => setField("validFrom", e.target.value)} /></div>
              <div><label className={labelCls}>Valid To</label><input type="date" className={inputCls} value={form.validTo ?? ""} onChange={(e) => setField("validTo", e.target.value)} /></div>
            </div>
            <div><label className={labelCls}>Day of Week</label><input className={inputCls} value={form.dayOfWeek ?? ""} onChange={(e) => setField("dayOfWeek", e.target.value)} placeholder="e.g. MONDAY, WEEKEND" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={labelCls}>Start Time</label><input type="time" className={inputCls} value={form.startTime ?? ""} onChange={(e) => setField("startTime", e.target.value)} /></div>
              <div><label className={labelCls}>End Time</label><input type="time" className={inputCls} value={form.endTime ?? ""} onChange={(e) => setField("endTime", e.target.value)} /></div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShowForm(false)} className={secondaryBtn}>Cancel</button>
              <button onClick={handleSave} className={primaryBtn}>{editing ? "Save Changes" : "Create Rule"}</button>
            </div>
          </div>
        </Modal>
      )}
      {deleting !== null && <ConfirmDialog message="Delete this pricing rule?" onConfirm={() => handleDelete(deleting)} onCancel={() => setDeleting(null)} />}
    </div>
  );
}

// ---- Rules Tab ----
function RulesTab() {
  const [rules, setRules] = useState<BusinessRuleResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<BusinessRuleResponse | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [form, setForm] = useState<BusinessRuleRequest>({ ruleType: "MAX_BOOKINGS", ruleKey: "", ruleValue: "" });

  useEffect(() => { setTimeout(() => setLoading(false), 500); }, []);

  const openNew = () => { setEditing(null); setForm({ ruleType: "MAX_BOOKINGS", ruleKey: "", ruleValue: "" }); setShowForm(true); };
  const openEdit = (rule: BusinessRuleResponse) => {
    setEditing(rule);
    setForm({ resourceId: rule.resourceId ?? undefined, categoryId: rule.categoryId ?? undefined, ruleType: rule.ruleType, ruleKey: rule.ruleKey, ruleValue: rule.ruleValue, ruleOperator: rule.ruleOperator ?? undefined, description: rule.description ?? undefined, isActive: rule.isActive, priority: rule.priority, validFrom: rule.validFrom ?? undefined, validTo: rule.validTo ?? undefined });
    setShowForm(true);
  };
  const handleSave = async () => { await wait(); setShowForm(false); };
  const handleDelete = async (id: number) => { await wait(); setRules((p) => p.filter((r) => r.id !== id)); setDeleting(null); };
  const setField = (key: keyof BusinessRuleRequest, val: unknown) => setForm((f) => ({ ...f, [key]: val }));

  if (loading) return <div className="flex justify-center py-20"><Spinner /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-foreground">Business Rules</h3>
        <button onClick={openNew} className={primaryBtn}><Plus className="h-4 w-4" /> Add Rule</button>
      </div>

      {rules.length === 0 ? <EmptyState message="No business rules defined." /> : (
        <div className="bg-card rounded-2xl border border-border overflow-hidden overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-muted/50 text-left">
              <th className="px-4 py-3 font-medium">Type</th><th className="px-4 py-3 font-medium">Key</th><th className="px-4 py-3 font-medium">Value</th><th className="px-4 py-3 font-medium">Priority</th><th className="px-4 py-3 font-medium">Active</th><th className="px-4 py-3 font-medium">Actions</th>
            </tr></thead>
            <tbody>{rules.map((r) => (
              <tr key={r.id} className="border-t border-border hover:bg-muted/30">
                <td className="px-4 py-3">{r.ruleType.replace(/_/g, " ")}</td>
                <td className="px-4 py-3 font-mono text-xs">{r.ruleKey}</td>
                <td className="px-4 py-3">{r.ruleValue}</td>
                <td className="px-4 py-3">{r.priority}</td>
                <td className="px-4 py-3">{r.isActive ? <Check className="h-4 w-4 text-green-600" /> : <X className="h-4 w-4 text-red-500" />}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(r)} className="p-1.5 rounded-lg hover:bg-muted"><Pencil className="h-3.5 w-3.5" /></button>
                    <button onClick={() => setDeleting(r.id)} className="p-1.5 rounded-lg hover:bg-muted text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}

      {showForm && (
        <Modal title={editing ? "Edit Business Rule" : "New Business Rule"} onClose={() => setShowForm(false)}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div><label className={labelCls}>Resource ID (optional)</label><input type="number" className={inputCls} value={form.resourceId ?? ""} onChange={(e) => setField("resourceId", e.target.value ? Number(e.target.value) : undefined)} /></div>
              <div><label className={labelCls}>Category ID (optional)</label><input type="number" className={inputCls} value={form.categoryId ?? ""} onChange={(e) => setField("categoryId", e.target.value ? Number(e.target.value) : undefined)} /></div>
            </div>
            <div><label className={labelCls}>Rule Type</label>
              <select className={inputCls} value={form.ruleType} onChange={(e) => setField("ruleType", e.target.value)}>
                {RULE_TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={labelCls}>Key</label><input className={inputCls} value={form.ruleKey} onChange={(e) => setField("ruleKey", e.target.value)} /></div>
              <div><label className={labelCls}>Operator</label><input className={inputCls} value={form.ruleOperator ?? ""} onChange={(e) => setField("ruleOperator", e.target.value)} placeholder="e.g. EQ, GT, LT" /></div>
            </div>
            <div><label className={labelCls}>Value</label><input className={inputCls} value={form.ruleValue} onChange={(e) => setField("ruleValue", e.target.value)} /></div>
            <div><label className={labelCls}>Description</label><textarea className={cn(inputCls, "min-h-[60px]")} value={form.description ?? ""} onChange={(e) => setField("description", e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={labelCls}>Priority</label><input type="number" className={inputCls} value={form.priority ?? 0} onChange={(e) => setField("priority", Number(e.target.value))} /></div>
              <div className="flex items-end pb-1">
                <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                  <input type="checkbox" checked={form.isActive !== false} onChange={() => setField("isActive", !form.isActive)} className="rounded border-border" />Active
                </label>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={labelCls}>Valid From</label><input type="date" className={inputCls} value={form.validFrom ?? ""} onChange={(e) => setField("validFrom", e.target.value)} /></div>
              <div><label className={labelCls}>Valid To</label><input type="date" className={inputCls} value={form.validTo ?? ""} onChange={(e) => setField("validTo", e.target.value)} /></div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShowForm(false)} className={secondaryBtn}>Cancel</button>
              <button onClick={handleSave} className={primaryBtn}>{editing ? "Save Changes" : "Create Rule"}</button>
            </div>
          </div>
        </Modal>
      )}
      {deleting !== null && <ConfirmDialog message="Delete this business rule?" onConfirm={() => handleDelete(deleting)} onCancel={() => setDeleting(null)} />}
    </div>
  );
}

// ---- Maintenance Tab ----
function MaintenanceTab() {
  const [records, setRecords] = useState<MaintenanceResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<MaintenanceResponse | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [form, setForm] = useState<MaintenanceRequest>({ resourceId: 0, startDate: "", endDate: "", reason: "", maintenanceType: "SCHEDULED" });

  useEffect(() => { setTimeout(() => setLoading(false), 500); }, []);

  const openNew = () => { setEditing(null); setForm({ resourceId: 0, startDate: "", endDate: "", reason: "", maintenanceType: "SCHEDULED" }); setShowForm(true); };
  const openEdit = (m: MaintenanceResponse) => {
    setEditing(m);
    setForm({ resourceId: m.resourceId, startDate: m.startDate, endDate: m.endDate, reason: m.reason, maintenanceType: m.maintenanceType, cost: m.cost ?? undefined, vendorName: m.vendorName ?? undefined, vendorContact: m.vendorContact ?? undefined, notes: m.notes ?? undefined });
    setShowForm(true);
  };
  const handleSave = async () => { await wait(); setShowForm(false); };
  const handleDelete = async (id: number) => { await wait(); setRecords((p) => p.filter((r) => r.id !== id)); setDeleting(null); };
  const setField = (key: keyof MaintenanceRequest, val: unknown) => setForm((f) => ({ ...f, [key]: val }));

  if (loading) return <div className="flex justify-center py-20"><Spinner /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-foreground">Maintenance Schedules</h3>
        <button onClick={openNew} className={primaryBtn}><Plus className="h-4 w-4" /> Schedule Maintenance</button>
      </div>

      {records.length === 0 ? <EmptyState message="No maintenance windows scheduled." /> : (
        <div className="space-y-3">
          {records.map((m) => (
            <div key={m.id} className="bg-card border border-border rounded-2xl shadow-sm p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-bold text-foreground">{m.resourceName}</h4>
                    <Badge status={m.status} />
                    <Badge status={m.maintenanceType} />
                  </div>
                  <p className="text-sm text-muted-foreground">{m.reason}</p>
                  <p className="text-xs text-muted-foreground mt-1">{m.startDate} - {m.endDate}{m.cost ? ` | Cost: $${m.cost}` : ""}{m.vendorName ? ` | Vendor: ${m.vendorName}` : ""}</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(m)} className="p-1.5 rounded-lg hover:bg-muted"><Pencil className="h-3.5 w-3.5" /></button>
                  <button onClick={() => setDeleting(m.id)} className="p-1.5 rounded-lg hover:bg-muted text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <Modal title={editing ? "Edit Maintenance" : "Schedule Maintenance"} onClose={() => setShowForm(false)}>
          <div className="space-y-4">
            <div><label className={labelCls}>Resource ID</label><input type="number" className={inputCls} value={form.resourceId || ""} onChange={(e) => setField("resourceId", Number(e.target.value))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={labelCls}>Start Date</label><input type="date" className={inputCls} value={form.startDate} onChange={(e) => setField("startDate", e.target.value)} /></div>
              <div><label className={labelCls}>End Date</label><input type="date" className={inputCls} value={form.endDate} onChange={(e) => setField("endDate", e.target.value)} /></div>
            </div>
            <div><label className={labelCls}>Reason</label><textarea className={cn(inputCls, "min-h-[60px]")} value={form.reason} onChange={(e) => setField("reason", e.target.value)} /></div>
            <div><label className={labelCls}>Type</label>
              <select className={inputCls} value={form.maintenanceType} onChange={(e) => setField("maintenanceType", e.target.value)}>
                {MAINTENANCE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={labelCls}>Cost</label><input type="number" step="0.01" className={inputCls} value={form.cost ?? ""} onChange={(e) => setField("cost", e.target.value ? Number(e.target.value) : undefined)} /></div>
              <div><label className={labelCls}>Vendor Name</label><input className={inputCls} value={form.vendorName ?? ""} onChange={(e) => setField("vendorName", e.target.value)} /></div>
            </div>
            <div><label className={labelCls}>Notes</label><textarea className={cn(inputCls, "min-h-[60px]")} value={form.notes ?? ""} onChange={(e) => setField("notes", e.target.value)} /></div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShowForm(false)} className={secondaryBtn}>Cancel</button>
              <button onClick={handleSave} className={primaryBtn}>{editing ? "Save Changes" : "Create"}</button>
            </div>
          </div>
        </Modal>
      )}
      {deleting !== null && <ConfirmDialog message="Delete this maintenance record?" onConfirm={() => handleDelete(deleting)} onCancel={() => setDeleting(null)} />}
    </div>
  );
}

// ---- Coupons Tab ----
function CouponsTab() {
  const [coupons, setCoupons] = useState<CouponResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<CouponResponse | null>(null);
  const [form, setForm] = useState<CouponRequest>({ code: "", discountType: "PERCENTAGE", discountValue: 0, validFrom: "", validTo: "" });

  useEffect(() => { setTimeout(() => setLoading(false), 500); }, []);

  const openNew = () => { setEditing(null); setForm({ code: "", discountType: "PERCENTAGE", discountValue: 0, validFrom: "", validTo: "" }); setShowForm(true); };
  const openEdit = (c: CouponResponse) => {
    setEditing(c);
    setForm({ code: c.code, description: c.description ?? undefined, discountType: c.discountType, discountValue: c.discountValue, maxUses: c.maxUses ?? undefined, validFrom: c.validFrom, validTo: c.validTo, minBookingAmount: c.minBookingAmount ?? undefined, maxDiscountAmount: c.maxDiscountAmount ?? undefined, isActive: c.isActive });
    setShowForm(true);
  };
  const handleSave = async () => { await wait(); setShowForm(false); };
  const setField = (key: keyof CouponRequest, val: unknown) => setForm((f) => ({ ...f, [key]: val }));

  if (loading) return <div className="flex justify-center py-20"><Spinner /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-foreground">Coupons</h3>
        <button onClick={openNew} className={primaryBtn}><Plus className="h-4 w-4" /> Add Coupon</button>
      </div>

      {coupons.length === 0 ? <EmptyState message="No coupons created yet." /> : (
        <div className="bg-card rounded-2xl border border-border overflow-hidden overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-muted/50 text-left">
              <th className="px-4 py-3 font-medium">Code</th><th className="px-4 py-3 font-medium">Type</th><th className="px-4 py-3 font-medium">Value</th><th className="px-4 py-3 font-medium">Uses</th><th className="px-4 py-3 font-medium">Valid</th><th className="px-4 py-3 font-medium">Active</th><th className="px-4 py-3 font-medium">Actions</th>
            </tr></thead>
            <tbody>{coupons.map((c) => (
              <tr key={c.id} className="border-t border-border hover:bg-muted/30">
                <td className="px-4 py-3 font-mono font-bold">{c.code}</td>
                <td className="px-4 py-3">{c.discountType}</td>
                <td className="px-4 py-3">{c.discountType === "PERCENTAGE" ? `${c.discountValue}%` : `$${c.discountValue}`}</td>
                <td className="px-4 py-3">{c.currentUses}{c.maxUses ? ` / ${c.maxUses}` : ""}</td>
                <td className="px-4 py-3 text-xs">{c.validFrom} - {c.validTo}</td>
                <td className="px-4 py-3">{c.isActive ? <Check className="h-4 w-4 text-green-600" /> : <X className="h-4 w-4 text-red-500" />}</td>
                <td className="px-4 py-3">
                  <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg hover:bg-muted"><Pencil className="h-3.5 w-3.5" /></button>
                </td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}

      {showForm && (
        <Modal title={editing ? "Edit Coupon" : "New Coupon"} onClose={() => setShowForm(false)}>
          <div className="space-y-4">
            <div><label className={labelCls}>Code</label><input className={cn(inputCls, "uppercase font-mono")} value={form.code} onChange={(e) => setField("code", e.target.value.toUpperCase())} /></div>
            <div><label className={labelCls}>Description</label><input className={inputCls} value={form.description ?? ""} onChange={(e) => setField("description", e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={labelCls}>Discount Type</label>
                <select className={inputCls} value={form.discountType} onChange={(e) => setField("discountType", e.target.value)}>
                  {DISCOUNT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div><label className={labelCls}>Value</label><input type="number" step="0.01" className={inputCls} value={form.discountValue} onChange={(e) => setField("discountValue", Number(e.target.value))} /></div>
            </div>
            <div><label className={labelCls}>Max Uses</label><input type="number" className={inputCls} value={form.maxUses ?? ""} onChange={(e) => setField("maxUses", e.target.value ? Number(e.target.value) : undefined)} placeholder="Leave empty for unlimited" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={labelCls}>Valid From</label><input type="date" className={inputCls} value={form.validFrom} onChange={(e) => setField("validFrom", e.target.value)} /></div>
              <div><label className={labelCls}>Valid To</label><input type="date" className={inputCls} value={form.validTo} onChange={(e) => setField("validTo", e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={labelCls}>Min Booking Amount</label><input type="number" step="0.01" className={inputCls} value={form.minBookingAmount ?? ""} onChange={(e) => setField("minBookingAmount", e.target.value ? Number(e.target.value) : undefined)} /></div>
              <div><label className={labelCls}>Max Discount Amount</label><input type="number" step="0.01" className={inputCls} value={form.maxDiscountAmount ?? ""} onChange={(e) => setField("maxDiscountAmount", e.target.value ? Number(e.target.value) : undefined)} /></div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShowForm(false)} className={secondaryBtn}>Cancel</button>
              <button onClick={handleSave} className={primaryBtn}>{editing ? "Save Changes" : "Create Coupon"}</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ---- Analytics Tab ----
function AnalyticsTab() {
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => { setTimeout(() => setLoading(false), 500); }, []);

  if (loading) return <div className="flex justify-center py-20"><Spinner /></div>;

  const metrics = [
    { label: "Avg. Occupancy", value: "73.5%" },
    { label: "Total Revenue", value: "$42,500" },
    { label: "Bookings This Period", value: "186" },
    { label: "Cancellation Rate", value: "4.2%" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h3 className="text-lg font-bold text-foreground">Analytics & Reports</h3>
        <div className="flex gap-3">
          <input type="date" className={cn(inputCls, "w-40")} value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          <input type="date" className={cn(inputCls, "w-40")} value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m) => (
          <div key={m.label} className="bg-card border border-border rounded-2xl shadow-sm p-6">
            <p className="text-sm text-muted-foreground mb-1">{m.label}</p>
            <p className="text-2xl font-black text-foreground">{m.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {["Occupancy Rate Over Time", "Revenue Trends", "Top Resources by Bookings", "Bookings Per Day"].map((title) => (
          <div key={title} className="bg-card border border-border rounded-2xl shadow-sm p-6">
            <h4 className="text-sm font-bold text-foreground mb-4">{title}</h4>
            <div className="h-48 flex items-center justify-center rounded-xl bg-muted/30 border border-dashed border-border">
              <div className="text-center">
                <BarChart3 className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Chart placeholder</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export function ResourceAdmin() {
  const [activeTab, setActiveTab] = useState<TabId>("dashboard");

  const renderTab = () => {
    switch (activeTab) {
      case "dashboard": return <DashboardTab />;
      case "categories": return <CategoriesTab />;
      case "resources": return <ResourcesTab />;
      case "bookings": return <BookingsTab />;
      case "pricing": return <PricingTab />;
      case "rules": return <RulesTab />;
      case "maintenance": return <MaintenanceTab />;
      case "coupons": return <CouponsTab />;
      case "analytics": return <AnalyticsTab />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1400px] mx-auto px-4 py-6">
        <h1 className="text-2xl font-black text-foreground mb-6">Resource Booking Admin</h1>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar - vertical on desktop */}
          <nav className="hidden md:block w-56 shrink-0">
            <div className="bg-card border border-border rounded-2xl shadow-sm p-2 sticky top-6">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left",
                    activeTab === tab.id
                      ? "bg-primary text-white"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <tab.icon className="h-4 w-4 shrink-0" />
                  {tab.label}
                </button>
              ))}
            </div>
          </nav>

          {/* Mobile horizontal tab bar */}
          <nav className="md:hidden overflow-x-auto -mx-4 px-4">
            <div className="flex gap-1 bg-card border border-border rounded-2xl shadow-sm p-1.5 min-w-max">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors whitespace-nowrap",
                    activeTab === tab.id
                      ? "bg-primary text-white"
                      : "text-muted-foreground hover:bg-muted"
                  )}
                >
                  <tab.icon className="h-3.5 w-3.5 shrink-0" />
                  {tab.label}
                </button>
              ))}
            </div>
          </nav>

          {/* Content area */}
          <main className="flex-1 min-w-0">{renderTab()}</main>
        </div>
      </div>
    </div>
  );
}
