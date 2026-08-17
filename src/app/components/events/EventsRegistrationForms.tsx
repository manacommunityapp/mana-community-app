import { useState, useMemo, useEffect, useRef } from "react";
import {
  Plus, Search, MoreVertical, Eye, Pencil, Copy, Trash2,
  QrCode, Download, BarChart3, FileText, CheckCircle2, Clock, XCircle,
  Archive, Globe, Link2, Users, ClipboardList, Calendar,
  ArrowUpDown, TrendingUp, Share2, Settings2,
  AlertCircle, Zap, ListChecks, ChevronRight,
  LayoutGrid, List, CheckSquare, Square, Timer, Star,
  UserCheck, UserX, Hourglass, ChevronDown, X,
} from "lucide-react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { cn } from "../ui/utils";
import { EventRegistrationFormBuilder, DEFAULT_REGISTRATION_FORM_CONFIG, GANESH_CHATURTHI_FORM_CONFIG, type RegistrationFormConfig } from "./EventRegistrationFormBuilder";
import { FormSettingsPanel } from "./EventsFormEnhancements";

/* ─── Types ─── */
type FormStatus = "draft" | "active" | "closed" | "archived";
type ViewMode = "grid" | "table";
type RegistrantStatus = "approved" | "waitlisted" | "cancelled" | "pending";

interface Registrant {
  id: string;
  name: string;
  email: string;
  phone: string;
  submittedAt: string;
  status: RegistrantStatus;
  familyCount?: number;
}

interface RegistrationForm {
  id: string;
  name: string;
  eventName: string;
  eventDate: string;
  status: FormStatus;
  createdAt: string;
  updatedAt: string;
  fieldsCount: number;
  requiredFieldsCount: number;
  responsesCount: number;
  maxCapacity: number | null;
  allowFamily: boolean;
  shareableLink: string;
  conversionRate: number;
  registrationDeadline: string | null;
  isDefault?: boolean;
  config?: RegistrationFormConfig;
}

/* ─── Mock Data ─── */
const MOCK_REGISTRANTS: Registrant[] = [
  { id: "R001", name: "Arjun Mehta", email: "arjun@example.com", phone: "9876543210", submittedAt: "2026-08-01", status: "approved", familyCount: 4 },
  { id: "R002", name: "Priya Sharma", email: "priya@example.com", phone: "9812345678", submittedAt: "2026-08-02", status: "approved" },
  { id: "R003", name: "Rahul Gupta", email: "rahul@example.com", phone: "9823456789", submittedAt: "2026-08-03", status: "waitlisted", familyCount: 2 },
  { id: "R004", name: "Sneha Patel", email: "sneha@example.com", phone: "9834567890", submittedAt: "2026-08-04", status: "approved", familyCount: 3 },
  { id: "R005", name: "Vikram Rao", email: "vikram@example.com", phone: "9845678901", submittedAt: "2026-08-05", status: "cancelled" },
  { id: "R006", name: "Divya Nair", email: "divya@example.com", phone: "9856789012", submittedAt: "2026-08-06", status: "pending", familyCount: 2 },
  { id: "R007", name: "Aditya Kumar", email: "aditya@example.com", phone: "9867890123", submittedAt: "2026-08-07", status: "approved" },
  { id: "R008", name: "Meera Iyer", email: "meera@example.com", phone: "9878901234", submittedAt: "2026-08-08", status: "waitlisted", familyCount: 5 },
];

const MOCK_EVENTS = [
  "Ganesh Chaturthi Grand Festival 2026",
  "Navratri Garba Night 2026",
  "Republic Day Cultural Festival",
  "Diwali Grand Celebration 2025",
  "Annual Sports Day 2026",
  "Kids Summer Camp 2026",
  "Holi Celebration 2026",
  "Eid Mubarak Community Dinner 2026",
];

const MOCK_FORMS: RegistrationForm[] = [
  {
    id: "FORM-001",
    name: "Ganesh Chaturthi 2026 Registration",
    eventName: "Ganesh Chaturthi Grand Festival 2026",
    eventDate: "22 Aug – 31 Aug 2026",
    status: "active",
    createdAt: "2026-07-15",
    updatedAt: "2026-08-01",
    fieldsCount: 18,
    requiredFieldsCount: 8,
    responsesCount: 342,
    maxCapacity: 500,
    allowFamily: true,
    shareableLink: "/event-register/gc-2026",
    conversionRate: 78.4,
    registrationDeadline: "2026-08-20",
    isDefault: true,
    config: GANESH_CHATURTHI_FORM_CONFIG,
  },
  {
    id: "FORM-002",
    name: "Navratri Garba Night Registration",
    eventName: "Navratri Garba Night 2026",
    eventDate: "02 Oct – 11 Oct 2026",
    status: "draft",
    createdAt: "2026-08-05",
    updatedAt: "2026-08-06",
    fieldsCount: 12,
    requiredFieldsCount: 5,
    responsesCount: 0,
    maxCapacity: 300,
    allowFamily: true,
    shareableLink: "/event-register/navratri-2026",
    conversionRate: 0,
    registrationDeadline: "2026-09-28",
  },
  {
    id: "FORM-003",
    name: "Republic Day Cultural Fest",
    eventName: "Republic Day Cultural Festival",
    eventDate: "26 Jan 2026",
    status: "closed",
    createdAt: "2025-12-20",
    updatedAt: "2026-01-26",
    fieldsCount: 14,
    requiredFieldsCount: 6,
    responsesCount: 189,
    maxCapacity: 200,
    allowFamily: false,
    shareableLink: "/event-register/republic-day-2026",
    conversionRate: 94.5,
    registrationDeadline: null,
  },
  {
    id: "FORM-004",
    name: "Diwali Celebration 2025 Registration",
    eventName: "Diwali Grand Celebration 2025",
    eventDate: "20 Oct – 24 Oct 2025",
    status: "archived",
    createdAt: "2025-09-10",
    updatedAt: "2025-10-24",
    fieldsCount: 16,
    requiredFieldsCount: 7,
    responsesCount: 456,
    maxCapacity: 500,
    allowFamily: true,
    shareableLink: "/event-register/diwali-2025",
    conversionRate: 91.2,
    registrationDeadline: null,
  },
  {
    id: "FORM-005",
    name: "Society Sports Day Registration",
    eventName: "Annual Sports Day 2026",
    eventDate: "15 Sep 2026",
    status: "active",
    createdAt: "2026-07-28",
    updatedAt: "2026-08-04",
    fieldsCount: 10,
    requiredFieldsCount: 4,
    responsesCount: 87,
    maxCapacity: null,
    allowFamily: false,
    shareableLink: "/event-register/sports-day-2026",
    conversionRate: 65.2,
    registrationDeadline: "2026-09-10",
  },
  {
    id: "FORM-006",
    name: "Kids Summer Camp Enrollment",
    eventName: "Kids Summer Camp 2026",
    eventDate: "01 May – 31 May 2026",
    status: "closed",
    createdAt: "2026-03-15",
    updatedAt: "2026-05-31",
    fieldsCount: 20,
    requiredFieldsCount: 10,
    responsesCount: 124,
    maxCapacity: 150,
    allowFamily: false,
    shareableLink: "/event-register/summer-camp-2026",
    conversionRate: 82.7,
    registrationDeadline: null,
  },
];

const STATUS_CONFIG: Record<string, { label: string; icon: any; bg: string; text: string; dot: string }> = {
  active:    { label: "Active",    icon: CheckCircle2, bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  draft:     { label: "Draft",     icon: Clock,        bg: "bg-amber-50",   text: "text-amber-700",   dot: "bg-amber-500"   },
  closed:    { label: "Closed",    icon: Lock,         bg: "bg-slate-100",  text: "text-slate-600",   dot: "bg-slate-400"   },
  archived:  { label: "Archived",  icon: Archive,      bg: "bg-slate-100",  text: "text-slate-500",   dot: "bg-slate-300"   },
  published: { label: "Published", icon: CheckCircle2, bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  upcoming:  { label: "Upcoming",  icon: Clock,        bg: "bg-blue-50",    text: "text-blue-700",    dot: "bg-blue-500"    },
};

const REGISTRANT_STATUS_CONFIG: Record<RegistrantStatus, { label: string; bg: string; text: string; icon: any }> = {
  approved:   { label: "Approved",   bg: "bg-emerald-50", text: "text-emerald-700", icon: UserCheck },
  waitlisted: { label: "Waitlisted", bg: "bg-amber-50",   text: "text-amber-700",   icon: Hourglass },
  cancelled:  { label: "Cancelled",  bg: "bg-rose-50",    text: "text-rose-600",    icon: UserX     },
  pending:    { label: "Pending",    bg: "bg-slate-100",  text: "text-slate-600",   icon: Clock     },
};

const FILTER_TABS: { id: FormStatus | "all"; label: string }[] = [
  { id: "all",      label: "All Forms"  },
  { id: "active",   label: "Active"     },
  { id: "draft",    label: "Drafts"     },
  { id: "closed",   label: "Closed"     },
  { id: "archived", label: "Archived"   },
];

/* ─── Helpers ─── */
function getDeadlinePill(deadline: string | null): { label: string; className: string } | null {
  if (!deadline) return null;
  const now = new Date();
  const dl = new Date(deadline);
  const diffMs = dl.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffMs < 0) {
    const elapsed = Math.abs(Math.floor(diffMs / (1000 * 60 * 60 * 24)));
    return {
      label: elapsed === 0 ? "Closed today" : `Closed ${elapsed}d ago`,
      className: "bg-slate-100 text-slate-500",
    };
  }
  if (diffDays <= 3) return { label: `${diffDays}d left`, className: "bg-rose-50 text-rose-600" };
  if (diffDays <= 7) return { label: `${diffDays}d left`, className: "bg-amber-50 text-amber-600" };
  return { label: `${diffDays}d left`, className: "bg-cyan-50 text-cyan-600" };
}

function getNextStatus(status: FormStatus): { next: FormStatus; label: string; icon: any; className: string } | null {
  if (status === "draft")   return { next: "active",   label: "Publish",  icon: Globe,   className: "text-emerald-600 hover:bg-emerald-50 border-emerald-200" };
  if (status === "active")  return { next: "closed",   label: "Close",    icon: XCircle, className: "text-amber-600 hover:bg-amber-50 border-amber-200"     };
  if (status === "closed")  return { next: "archived", label: "Archive",  icon: Archive, className: "text-slate-600 hover:bg-slate-50 border-slate-200"      };
  return null;
}

/* ─── Stats Card ─── */
function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: any; label: string; value: string | number; sub?: string; color: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 p-3 sm:p-4 shadow-[0_1px_4px_rgba(0,0,0,0.04)] hover:shadow-md transition-shadow">
      <div className="flex items-center gap-2 mb-2">
        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", color)}>
          <Icon className="w-4 h-4 text-white" />
        </div>
        <span className="text-xs font-medium text-slate-500">{label}</span>
      </div>
      <p className="text-xl sm:text-2xl font-bold text-slate-800">{value}</p>
      {sub && <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}

/* ─── QR Modal ─── */
function QRModal({ form, onClose }: { form: RegistrationForm; onClose: () => void }) {
  const fullLink = `${window.location.origin}${form.shareableLink}`;
  const [copied, setCopied] = useState(false);

  const copyLink = () => {
    navigator.clipboard.writeText(fullLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 max-w-md w-full mx-4 space-y-5" onClick={e => e.stopPropagation()}>
        <div className="text-center space-y-1">
          <h3 className="text-lg font-bold text-slate-800">Share Registration Form</h3>
          <p className="text-sm text-slate-500">{form.name}</p>
        </div>
        <div className="bg-slate-50 rounded-xl p-6 flex items-center justify-center">
          <div className="w-48 h-48 bg-white rounded-lg border-2 border-dashed border-slate-200 flex items-center justify-center">
            <div className="text-center space-y-2">
              <QrCode className="w-16 h-16 text-indigo-300 mx-auto" />
              <span className="text-[10px] text-slate-400">QR Code Preview</span>
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-medium text-slate-500">Shareable Link</label>
          <div className="flex gap-2">
            <div className="flex-1 bg-slate-50 rounded-lg px-3 py-2 text-sm text-slate-600 font-mono truncate border border-slate-200">
              {fullLink}
            </div>
            <Button size="sm" variant={copied ? "default" : "outline"} onClick={copyLink}
              className={cn("shrink-0", copied && "bg-emerald-600 hover:bg-emerald-700")}>
              {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1 gap-2" onClick={() => {}}>
            <Download className="w-4 h-4" /> Download QR
          </Button>
          <Button variant="outline" className="flex-1 gap-2" onClick={() => {}}>
            <Share2 className="w-4 h-4" /> Share via WhatsApp
          </Button>
        </div>
        <Button variant="ghost" className="w-full" onClick={onClose}>Close</Button>
      </div>
    </div>
  );
}

/* ─── Submissions Drawer ─── */
function SubmissionsDrawer({ form, onClose }: { form: RegistrationForm; onClose: () => void }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<RegistrantStatus | "all">("all");

  const filtered = useMemo(() => {
    let list = MOCK_REGISTRANTS;
    if (statusFilter !== "all") list = list.filter(r => r.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(r =>
        r.name.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        r.phone.includes(q)
      );
    }
    return list;
  }, [search, statusFilter]);

  const counts = useMemo(() => ({
    all: MOCK_REGISTRANTS.length,
    approved: MOCK_REGISTRANTS.filter(r => r.status === "approved").length,
    waitlisted: MOCK_REGISTRANTS.filter(r => r.status === "waitlisted").length,
    cancelled: MOCK_REGISTRANTS.filter(r => r.status === "cancelled").length,
    pending: MOCK_REGISTRANTS.filter(r => r.status === "pending").length,
  }), []);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white w-full max-w-2xl h-full shadow-2xl flex flex-col animate-in slide-in-from-right-full duration-300"
        onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="sticky top-0 bg-white z-10 px-5 py-4 border-b border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-bold text-slate-800 text-lg">Submissions</h3>
              <p className="text-xs text-slate-400 truncate max-w-xs">{form.name}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-1 text-xs">
                <Download className="w-3.5 h-3.5" /> Export CSV
              </Button>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <XCircle className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Status filter pills */}
          <div className="flex gap-1.5 flex-wrap mb-3">
            {(["all", "approved", "waitlisted", "pending", "cancelled"] as const).map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={cn(
                  "px-2.5 py-1 rounded-full text-[10px] font-medium border transition-all",
                  statusFilter === s
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-white text-slate-500 border-slate-200 hover:border-indigo-300"
                )}
              >
                {s === "all" ? "All" : REGISTRANT_STATUS_CONFIG[s].label}{" "}
                <span className={cn("ml-0.5", statusFilter === s ? "text-indigo-200" : "text-slate-400")}>
                  {counts[s]}
                </span>
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <Input
              className="pl-8 h-8 text-xs"
              placeholder="Search by name, email, or phone…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Registrant list */}
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-slate-400">
              <Users className="w-10 h-10 mb-2 text-slate-200" />
              <p className="text-sm font-medium">No submissions found</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {filtered.map(r => {
                const sc = REGISTRANT_STATUS_CONFIG[r.status?.toLowerCase() as RegistrantStatus] ||
                  REGISTRANT_STATUS_CONFIG[r.status as RegistrantStatus] || {
                    label: r.status || "Submitted",
                    bg: "bg-slate-100",
                    text: "text-slate-600",
                    icon: Clock,
                  };
                const Icon = sc.icon || Clock;
                return (
                  <div key={r.id} className="px-5 py-3.5 flex items-center gap-3 hover:bg-slate-50 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-violet-400 flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {r.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-slate-800 truncate">{r.name}</p>
                        {r.familyCount && (
                          <span className="text-[9px] bg-violet-50 text-violet-600 border border-violet-100 rounded-full px-1.5 py-0.5">
                            +{r.familyCount - 1} family
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400">{r.email} · {r.phone}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[9px] text-slate-400 hidden sm:block">
                        {new Date(r.submittedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      </span>
                      <Badge className={cn("gap-1 text-[9px] py-0.5", sc.bg, sc.text)}>
                        <Icon className="w-2.5 h-2.5" /> {sc.label}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer summary */}
        <div className="border-t border-slate-100 px-5 py-3 flex items-center justify-between bg-slate-50">
          <p className="text-xs text-slate-500">
            Showing <span className="font-semibold text-slate-700">{filtered.length}</span> of{" "}
            <span className="font-semibold text-slate-700">{MOCK_REGISTRANTS.length}</span> submissions
          </p>
          {form.maxCapacity && (
            <p className="text-xs text-slate-500">
              Capacity: <span className="font-semibold text-slate-700">{form.responsesCount}/{form.maxCapacity}</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Form Detail Drawer ─── */
function FormDetailDrawer({ form, onClose, onEdit, onPreview, onSettings, onViewSubmissions }: {
  form: RegistrationForm;
  onClose: () => void;
  onEdit: () => void;
  onPreview: () => void;
  onSettings: () => void;
  onViewSubmissions: () => void;
}) {
  const s = STATUS_CONFIG[form.status?.toLowerCase()] ||
    STATUS_CONFIG[form.status] ||
    STATUS_CONFIG.active || {
      label: form.status || "Active",
      icon: CheckCircle2,
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      dot: "bg-emerald-500",
    };
  const capacityPct = form.maxCapacity ? Math.round((form.responsesCount / form.maxCapacity) * 100) : null;
  const deadline = getDeadlinePill(form.registrationDeadline);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white w-full max-w-lg h-full shadow-2xl overflow-y-auto animate-in slide-in-from-right-full duration-300"
        onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-white z-10 px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-800 text-lg truncate pr-4">{form.name}</h3>
          <Button variant="ghost" size="sm" onClick={onClose} className="shrink-0">
            <XCircle className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-5 space-y-6">
          {/* Status & Event */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              {form.isDefault && (
                <Badge className="gap-1 bg-amber-500 text-white font-bold text-[10px] shadow-sm">
                  <Star className="w-3 h-3 fill-current text-white" /> Default Form
                </Badge>
              )}
              <Badge className={cn("gap-1", s.bg, s.text)}>
                <span className={cn("w-1.5 h-1.5 rounded-full", s.dot)} />
                {s.label}
              </Badge>
              {form.allowFamily && (
                <Badge variant="outline" className="gap-1 text-violet-600 border-violet-200 bg-violet-50">
                  <Users className="w-3 h-3" /> Family
                </Badge>
              )}
              {deadline && (
                <Badge variant="outline" className={cn("gap-1 border-transparent text-[10px]", deadline.className)}>
                  <Timer className="w-3 h-3" /> {deadline.label}
                </Badge>
              )}
            </div>
            <div className="bg-slate-50 rounded-lg p-3 space-y-1">
              <p className="text-sm font-semibold text-slate-700">{form.eventName}</p>
              <p className="text-xs text-slate-500 flex items-center gap-1">
                <Calendar className="w-3 h-3" /> {form.eventDate}
              </p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-indigo-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-indigo-700">{form.responsesCount}</p>
              <p className="text-xs text-indigo-500">Total Responses</p>
            </div>
            <div className="bg-violet-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-violet-700">{form.conversionRate}%</p>
              <p className="text-xs text-violet-500">Conversion Rate</p>
            </div>
            <div className="bg-cyan-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-cyan-700">{form.fieldsCount}</p>
              <p className="text-xs text-cyan-500">Total Fields</p>
            </div>
            <div className="bg-amber-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-amber-700">{form.requiredFieldsCount}</p>
              <p className="text-xs text-amber-500">Required Fields</p>
            </div>
          </div>

          {/* Capacity Bar */}
          {form.maxCapacity && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Capacity</span>
                <span className="text-xs font-semibold text-slate-700">
                  {form.responsesCount} / {form.maxCapacity}
                </span>
              </div>
              <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={cn("h-full rounded-full transition-all", capacityPct! >= 90 ? "bg-rose-500" : capacityPct! >= 70 ? "bg-amber-500" : "bg-emerald-500")}
                  style={{ width: `${Math.min(capacityPct!, 100)}%` }}
                />
              </div>
              {capacityPct! >= 90 && (
                <p className="text-[10px] text-rose-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> Almost full — consider enabling waitlist
                </p>
              )}
            </div>
          )}

          {/* Response Trend */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-500" /> Response Trend (Last 7 days)
            </h4>
            <div className="bg-slate-50 rounded-lg p-4 h-32 flex items-end gap-1.5">
              {[28, 45, 32, 58, 72, 48, 65].map((h, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full bg-gradient-to-t from-indigo-500 to-violet-400 rounded-t" style={{ height: `${h}%` }} />
                  <span className="text-[8px] text-slate-400">{["M", "T", "W", "T", "F", "S", "S"][i]}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Timestamps */}
          <div className="space-y-1.5 text-xs text-slate-500">
            <p>Created: {new Date(form.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
            <p>Last Updated: {new Date(form.updatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
            {form.registrationDeadline && (
              <p>Deadline: {new Date(form.registrationDeadline).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
            )}
          </div>

          {/* Actions */}
          <div className="space-y-2">
            <Button className="w-full gap-2 bg-gradient-to-r from-indigo-600 to-violet-500 hover:from-indigo-700 hover:to-violet-600" onClick={onViewSubmissions}>
              <ClipboardList className="w-4 h-4" /> View Submissions ({form.responsesCount})
            </Button>
            <Button variant="outline" className="w-full gap-2" onClick={onPreview}>
              <Eye className="w-4 h-4" /> Preview Form
            </Button>
            <Button variant="outline" className="w-full gap-2" onClick={() => { onClose(); onSettings(); }}>
              <Settings2 className="w-4 h-4" /> Settings & Enhancements
            </Button>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" className="gap-2" onClick={onEdit}>
                <Pencil className="w-4 h-4" /> Edit Form
              </Button>
              <Button variant="outline" className="gap-2">
                <Download className="w-4 h-4" /> Export Responses
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" className="gap-2">
                <Copy className="w-4 h-4" /> Duplicate
              </Button>
              <Button variant="outline" className="gap-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50">
                <Trash2 className="w-4 h-4" /> Delete
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Event Selector ─── */
function EventSelector({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const suggestions = useMemo(() =>
    MOCK_EVENTS.filter(e => e.toLowerCase().includes(query.toLowerCase())),
    [query]
  );

  return (
    <div className="relative" ref={ref}>
      <div className="relative">
        <Input
          placeholder="Search or type event name"
          value={query}
          onChange={e => { setQuery(e.target.value); onChange(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          className="pr-8"
        />
        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
      </div>
      {open && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-slate-200 z-50 max-h-48 overflow-y-auto">
          {suggestions.map(e => (
            <button
              key={e}
              className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors first:rounded-t-lg last:rounded-b-lg"
              onClick={() => { onChange(e); setQuery(e); setOpen(false); }}
            >
              {e}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Create Form Dialog ─── */
function CreateFormDialog({ onClose, onCreate }: { onClose: () => void; onCreate: (form: Partial<RegistrationForm>) => void }) {
  const [name, setName] = useState("Ganesh Chaturthi 2026 Registration");
  const [eventName, setEventName] = useState("Ganesh Chaturthi Grand Festival 2026");
  const [deadline, setDeadline] = useState("2026-08-20");
  const [template, setTemplate] = useState<"ganesh" | "blank" | "standard" | "minimal" | "detailed">("ganesh");

  const TEMPLATES = [
    { id: "ganesh" as const, label: "Ganesh Festival (Default)", description: "Aarti slots, Mahaprasadam passes, cultural & volunteer preferences", icon: Star, fields: 18, isDefault: true },
    { id: "standard" as const, label: "Standard", description: "Personal info, contact, emergency contact, dietary", icon: ClipboardList, fields: 14, isDefault: false },
    { id: "minimal" as const, label: "Minimal", description: "Just name, email, and phone — quick registration", icon: Zap, fields: 5, isDefault: false },
    { id: "detailed" as const, label: "Detailed", description: "All fields including ID verification, accessibility, apparel", icon: ListChecks, fields: 22, isDefault: false },
    { id: "blank" as const, label: "Blank Form", description: "Start from scratch with no fields", icon: FileText, fields: 0, isDefault: false },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-indigo-600 px-6 py-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-white">Create Registration Form</h3>
              <Badge className="bg-amber-400/30 text-amber-100 border-amber-300/40 text-[10px]">🪔 Default Template</Badge>
            </div>
            <p className="text-amber-100/90 text-xs mt-0.5">Pre-configured with Ganesh Chaturthi Grand Festival 2026 defaults</p>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Form Name *</label>
            <Input
              placeholder="e.g. Ganesh Chaturthi 2026 Registration"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Event *</label>
            <EventSelector value={eventName} onChange={setEventName} />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <Timer className="w-3.5 h-3.5 text-slate-400" /> Registration Deadline
              <span className="text-[10px] text-slate-400 font-normal">(optional)</span>
            </label>
            <Input
              type="date"
              value={deadline}
              onChange={e => setDeadline(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Select Template Preset</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {TEMPLATES.map(t => (
                <button
                  key={t.id}
                  onClick={() => setTemplate(t.id)}
                  className={cn(
                    "text-left p-3 rounded-xl border-2 transition-all relative",
                    template === t.id
                      ? "border-amber-500 bg-amber-50/60 ring-2 ring-amber-200"
                      : "border-slate-200 hover:border-amber-200 hover:bg-slate-50"
                  )}
                >
                  {t.isDefault && (
                    <span className="absolute top-2 right-2 text-[9px] font-bold px-1.5 py-0.5 bg-amber-500 text-white rounded-full flex items-center gap-0.5">
                      <Star className="w-2.5 h-2.5 fill-current" /> Default
                    </span>
                  )}
                  <div className="flex items-center gap-2 mb-1">
                    <t.icon className={cn("w-4 h-4", template === t.id ? "text-amber-600" : "text-slate-400")} />
                    <span className={cn("text-xs font-bold", template === t.id ? "text-amber-900" : "text-slate-700")}>
                      {t.label}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500">{t.description}</p>
                  {t.fields > 0 && <p className="text-[10px] text-amber-600 font-medium mt-1">{t.fields} fields configured</p>}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button
              className="flex-1 bg-gradient-to-r from-amber-600 to-indigo-600 hover:from-amber-700 hover:to-indigo-700 text-white gap-2"
              disabled={!name.trim() || !eventName.trim()}
              onClick={() => {
                onCreate({
                  name: name.trim(),
                  eventName: eventName.trim(),
                  status: "active",
                  registrationDeadline: deadline || null,
                  isDefault: template === "ganesh",
                  config: template === "ganesh" ? GANESH_CHATURTHI_FORM_CONFIG : undefined,
                  fieldsCount: template === "ganesh" ? 18 : template === "detailed" ? 22 : template === "standard" ? 14 : template === "minimal" ? 5 : 0,
                  requiredFieldsCount: template === "ganesh" ? 8 : template === "detailed" ? 10 : template === "standard" ? 6 : template === "minimal" ? 3 : 0,
                });
                onClose();
              }}
            >
              <Plus className="w-4 h-4" /> Create Form
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Form Card ─── */
function FormCard({ form, selected, onSelect, onView, onPreview, onQR, onEdit, onSettings, onStatusChange, onViewSubmissions }: {
  form: RegistrationForm;
  selected: boolean;
  onSelect: () => void;
  onView: () => void;
  onPreview: () => void;
  onQR: () => void;
  onEdit: () => void;
  onSettings: () => void;
  onStatusChange: (next: FormStatus) => void;
  onViewSubmissions: () => void;
}) {
  const s = STATUS_CONFIG[form.status?.toLowerCase()] ||
    STATUS_CONFIG[form.status] ||
    STATUS_CONFIG.active || {
      label: form.status || "Active",
      icon: CheckCircle2,
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      dot: "bg-emerald-500",
    };
  const [menuOpen, setMenuOpen] = useState(false);
  const capacityPct = form.maxCapacity ? Math.round((form.responsesCount / form.maxCapacity) * 100) : null;
  const deadline = getDeadlinePill(form.registrationDeadline);
  const nextStatus = getNextStatus(form.status);

  return (
    <div className={cn(
      "bg-white rounded-xl border shadow-[0_1px_4px_rgba(0,0,0,0.04)] hover:shadow-md transition-all group relative",
      selected ? "border-indigo-400 ring-2 ring-indigo-200" : "border-slate-100"
    )}>
      {/* Checkbox */}
      <button
        className="absolute top-3 left-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={e => { e.stopPropagation(); onSelect(); }}
        aria-label="Select form"
      >
        {selected
          ? <CheckSquare className="w-4 h-4 text-indigo-600" />
          : <Square className="w-4 h-4 text-slate-300" />
        }
      </button>
      {selected && (
        <button className="absolute top-3 left-3 z-10" onClick={e => { e.stopPropagation(); onSelect(); }}>
          <CheckSquare className="w-4 h-4 text-indigo-600" />
        </button>
      )}

      {/* Header */}
      <div className="p-4 sm:p-5 space-y-3 pl-8">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              {form.isDefault && (
                <Badge className="gap-1 text-[10px] bg-amber-500 text-white font-bold border-amber-600 shadow-sm">
                  <Star className="w-2.5 h-2.5 fill-current" /> Default Form
                </Badge>
              )}
              <Badge className={cn("gap-1 text-[10px]", s.bg, s.text)}>
                <span className={cn("w-1.5 h-1.5 rounded-full", s.dot)} />
                {s.label}
              </Badge>
              {form.allowFamily && (
                <Badge variant="outline" className="gap-1 text-[10px] text-violet-600 border-violet-200 bg-violet-50">
                  <Users className="w-2.5 h-2.5" /> Family
                </Badge>
              )}
              {deadline && (
                <Badge variant="outline" className={cn("gap-1 text-[9px] border-transparent", deadline.className)}>
                  <Timer className="w-2.5 h-2.5" /> {deadline.label}
                </Badge>
              )}
            </div>
            <h4 className="font-semibold text-slate-800 text-sm sm:text-base truncate cursor-pointer hover:text-indigo-600 transition-colors"
              onClick={onView}>
              {form.name}
            </h4>
            <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
              <Calendar className="w-3 h-3" /> {form.eventName} · {form.eventDate}
            </p>
          </div>

          <div className="relative">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setMenuOpen(!menuOpen)}>
              <MoreVertical className="w-4 h-4 text-slate-400" />
            </Button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-9 z-20 bg-white rounded-lg shadow-lg border border-slate-100 py-1 w-44">
                  <button onClick={() => { onViewSubmissions(); setMenuOpen(false); }}
                    className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                    <ClipboardList className="w-3.5 h-3.5" /> View Submissions
                  </button>
                  <button onClick={() => { onPreview(); setMenuOpen(false); }}
                    className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                    <Eye className="w-3.5 h-3.5" /> Preview
                  </button>
                  <button onClick={() => { onEdit(); setMenuOpen(false); }}
                    className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                    <Pencil className="w-3.5 h-3.5" /> Edit Form
                  </button>
                  <button onClick={() => { onQR(); setMenuOpen(false); }}
                    className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                    <QrCode className="w-3.5 h-3.5" /> Share / QR Code
                  </button>
                  <button className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                    <Copy className="w-3.5 h-3.5" /> Duplicate
                  </button>
                  <button className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                    <Download className="w-3.5 h-3.5" /> Export Responses
                  </button>
                  <hr className="my-1 border-slate-100" />
                  {nextStatus && (
                    <button
                      onClick={() => { onStatusChange(nextStatus.next); setMenuOpen(false); }}
                      className={cn("w-full text-left px-3 py-2 text-sm flex items-center gap-2", nextStatus.className.split(" ").filter(c => c.startsWith("text-")).join(" "), "hover:bg-slate-50")}
                    >
                      <nextStatus.icon className="w-3.5 h-3.5" /> {nextStatus.label}
                    </button>
                  )}
                  <button className="w-full text-left px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 flex items-center gap-2">
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <div className="bg-slate-50 rounded-lg p-2 text-center">
            <p className="text-base sm:text-lg font-bold text-slate-800">{form.responsesCount}</p>
            <p className="text-[9px] sm:text-[10px] text-slate-400">Responses</p>
          </div>
          <div className="bg-slate-50 rounded-lg p-2 text-center">
            <p className="text-base sm:text-lg font-bold text-slate-800">{form.fieldsCount}</p>
            <p className="text-[9px] sm:text-[10px] text-slate-400">Fields</p>
          </div>
          <div className="bg-slate-50 rounded-lg p-2 text-center">
            <p className={cn("text-base sm:text-lg font-bold",
              form.conversionRate >= 80 ? "text-emerald-600" : form.conversionRate >= 50 ? "text-amber-600" : "text-slate-800"
            )}>{form.conversionRate}%</p>
            <p className="text-[9px] sm:text-[10px] text-slate-400">Conversion</p>
          </div>
        </div>

        {/* Capacity */}
        {form.maxCapacity && (
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>Capacity</span>
              <span className="font-medium">{form.responsesCount}/{form.maxCapacity}</span>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={cn("h-full rounded-full transition-all",
                  capacityPct! >= 90 ? "bg-rose-500" : capacityPct! >= 70 ? "bg-amber-500" : "bg-emerald-500"
                )}
                style={{ width: `${Math.min(capacityPct!, 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="border-t border-slate-100 px-4 sm:px-5 py-2.5 flex items-center gap-1">
        <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs text-slate-500 hover:text-indigo-600" onClick={onViewSubmissions}>
          <ClipboardList className="w-3 h-3" /> Responses
        </Button>
        <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs text-slate-500 hover:text-indigo-600" onClick={onQR}>
          <Link2 className="w-3 h-3" /> Share
        </Button>
        <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs text-slate-500 hover:text-indigo-600" onClick={onSettings}>
          <Settings2 className="w-3 h-3" /> Settings
        </Button>
        <div className="flex-1" />
        {nextStatus && (
          <Button
            variant="outline"
            size="sm"
            className={cn("h-7 gap-1 text-[10px] border", nextStatus.className)}
            onClick={() => onStatusChange(nextStatus.next)}
          >
            <nextStatus.icon className="w-3 h-3" /> {nextStatus.label}
          </Button>
        )}
      </div>
    </div>
  );
}

/* ─── Table Row ─── */
function FormTableRow({ form, selected, onSelect, onView, onEdit, onStatusChange, onViewSubmissions }: {
  form: RegistrationForm;
  selected: boolean;
  onSelect: () => void;
  onView: () => void;
  onEdit: () => void;
  onStatusChange: (next: FormStatus) => void;
  onViewSubmissions: () => void;
}) {
  const s = STATUS_CONFIG[form.status?.toLowerCase()] ||
    STATUS_CONFIG[form.status] ||
    STATUS_CONFIG.active || {
      label: form.status || "Active",
      icon: CheckCircle2,
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      dot: "bg-emerald-500",
    };
  const deadline = getDeadlinePill(form.registrationDeadline);
  const nextStatus = getNextStatus(form.status);

  return (
    <tr className={cn("border-b border-slate-50 hover:bg-slate-50 transition-colors", selected && "bg-indigo-50 hover:bg-indigo-50")}>
      <td className="pl-4 py-3 w-8">
        <button onClick={e => { e.stopPropagation(); onSelect(); }}>
          {selected
            ? <CheckSquare className="w-4 h-4 text-indigo-600" />
            : <Square className="w-4 h-4 text-slate-300" />
          }
        </button>
      </td>
      <td className="py-3 pr-3 max-w-xs">
        <button className="text-left" onClick={onView}>
          <div className="flex items-center gap-1.5 truncate max-w-[220px]">
            <p className="text-sm font-semibold text-slate-800 hover:text-indigo-600 transition-colors truncate">{form.name}</p>
            {form.isDefault && (
              <Badge className="text-[8px] py-0 px-1.5 bg-amber-500 text-white font-bold shrink-0">Default</Badge>
            )}
          </div>
          <p className="text-[10px] text-slate-400 truncate max-w-[200px]">{form.eventName}</p>
        </button>
      </td>
      <td className="py-3 pr-3">
        <Badge className={cn("gap-1 text-[10px]", s.bg, s.text)}>
          <span className={cn("w-1.5 h-1.5 rounded-full", s.dot)} />
          {s.label}
        </Badge>
      </td>
      <td className="py-3 pr-3 text-sm text-slate-700 text-right">{form.responsesCount}</td>
      <td className="py-3 pr-3 text-sm text-right">
        <span className={cn(
          form.conversionRate >= 80 ? "text-emerald-600" : form.conversionRate >= 50 ? "text-amber-600" : "text-slate-600"
        )}>{form.conversionRate}%</span>
      </td>
      <td className="py-3 pr-3">
        {deadline
          ? <span className={cn("text-[10px] px-2 py-0.5 rounded-full", deadline.className)}>{deadline.label}</span>
          : <span className="text-[10px] text-slate-400">—</span>
        }
      </td>
      <td className="py-3 pr-4">
        <div className="flex items-center gap-1 justify-end">
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-slate-400 hover:text-indigo-600" onClick={onViewSubmissions}>
            <ClipboardList className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-slate-400 hover:text-indigo-600" onClick={onEdit}>
            <Pencil className="w-3.5 h-3.5" />
          </Button>
          {nextStatus && (
            <Button
              variant="outline"
              size="sm"
              className={cn("h-7 gap-1 text-[10px] border px-2", nextStatus.className)}
              onClick={() => onStatusChange(nextStatus.next)}
            >
              <nextStatus.icon className="w-3 h-3" /> {nextStatus.label}
            </Button>
          )}
        </div>
      </td>
    </tr>
  );
}

/* ─── Bulk Action Bar ─── */
function BulkActionBar({ count, onClose, onArchive, onClose2, onExport, onDelete }: {
  count: number;
  onClose: () => void;
  onArchive: () => void;
  onClose2: () => void;
  onExport: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 animate-in slide-in-from-bottom-4 duration-200">
      <div className="bg-slate-900 text-white rounded-2xl shadow-2xl px-4 py-3 flex items-center gap-3">
        <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
          <X className="w-4 h-4" />
        </button>
        <span className="text-sm font-semibold text-slate-200 pr-1 border-r border-slate-700">
          {count} selected
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1 text-xs text-slate-300 hover:text-white hover:bg-slate-800"
          onClick={onClose2}
        >
          <XCircle className="w-3.5 h-3.5" /> Close
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1 text-xs text-slate-300 hover:text-white hover:bg-slate-800"
          onClick={onArchive}
        >
          <Archive className="w-3.5 h-3.5" /> Archive
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1 text-xs text-slate-300 hover:text-white hover:bg-slate-800"
          onClick={onExport}
        >
          <Download className="w-3.5 h-3.5" /> Export CSV
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1 text-xs text-rose-400 hover:text-rose-300 hover:bg-slate-800"
          onClick={onDelete}
        >
          <Trash2 className="w-3.5 h-3.5" /> Delete
        </Button>
      </div>
    </div>
  );
}

/* ─── Form Builder Dialog ─── */
function FormBuilderDialog({ form, onClose, onSave }: {
  form: RegistrationForm;
  onClose: () => void;
  onSave: (form: RegistrationForm, config: RegistrationFormConfig) => void;
}) {
  const [config, setConfig] = useState<RegistrationFormConfig>(
    form.config ?? { ...DEFAULT_REGISTRATION_FORM_CONFIG }
  );

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">
      <div className="flex-shrink-0 border-b border-slate-100 px-4 sm:px-6 py-3 flex items-center justify-between"
        style={{ background: "linear-gradient(135deg, #eef2ff 0%, #faf5ff 40%, #ffffff 100%)" }}>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onClose} className="gap-1 text-xs text-slate-500">
            <ChevronRight className="w-4 h-4 rotate-180" /> Back
          </Button>
          <div className="h-5 w-px bg-slate-200" />
          <div>
            <h3 className="font-bold text-slate-800 text-sm sm:text-base">{form.name}</h3>
            <p className="text-[10px] text-slate-400">{form.eventName || "No event assigned"}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="text-xs gap-1" onClick={onClose}>Cancel</Button>
          <Button size="sm" className="text-xs gap-1 bg-gradient-to-r from-indigo-600 to-violet-500 hover:from-indigo-700 hover:to-violet-600"
            onClick={() => onSave(form, config)}>
            <CheckCircle2 className="w-3.5 h-3.5" /> Save Template
          </Button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        <EventRegistrationFormBuilder config={config} onChange={setConfig} />
      </div>
    </div>
  );
}

/* ─── Main Component ─── */
export function EventsRegistrationForms() {
  const [forms, setForms] = useState<RegistrationForm[]>(MOCK_FORMS);
  const [search, setSearch] = useState("");
  const [filterTab, setFilterTab] = useState<FormStatus | "all">("all");
  const [sortBy, setSortBy] = useState<"name" | "date" | "responses">("date");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedForm, setSelectedForm] = useState<RegistrationForm | null>(null);
  const [submissionsForm, setSubmissionsForm] = useState<RegistrationForm | null>(null);
  const [qrForm, setQrForm] = useState<RegistrationForm | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [builderForm, setBuilderForm] = useState<RegistrationForm | null>(null);

  const filtered = useMemo(() => {
    let list = forms;
    if (filterTab !== "all") list = list.filter(f => f.status === filterTab);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(f =>
        f.name.toLowerCase().includes(q) ||
        f.eventName.toLowerCase().includes(q) ||
        f.id.toLowerCase().includes(q)
      );
    }
    list = [...list].sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "responses") return b.responsesCount - a.responsesCount;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
    return list;
  }, [forms, filterTab, search, sortBy]);

  const stats = useMemo(() => ({
    total: forms.length,
    active: forms.filter(f => f.status === "active").length,
    totalResponses: forms.reduce((s, f) => s + f.responsesCount, 0),
    avgConversion: forms.length ? +(forms.reduce((s, f) => s + f.conversionRate, 0) / forms.length).toFixed(1) : 0,
  }), [forms]);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  const handleBulkStatusChange = (next: FormStatus) => {
    setForms(prev => prev.map(f =>
      selectedIds.has(f.id) ? { ...f, status: next, updatedAt: new Date().toISOString().split("T")[0] } : f
    ));
    clearSelection();
  };

  const handleBulkDelete = () => {
    setForms(prev => prev.filter(f => !selectedIds.has(f.id)));
    clearSelection();
  };

  const handleStatusChange = (form: RegistrationForm, next: FormStatus) => {
    setForms(prev => prev.map(f =>
      f.id === form.id ? { ...f, status: next, updatedAt: new Date().toISOString().split("T")[0] } : f
    ));
  };

  const handleCreate = (partial: Partial<RegistrationForm>) => {
    const now = new Date().toISOString().split("T")[0];
    const newForm: RegistrationForm = {
      id: `FORM-${String(forms.length + 1).padStart(3, "0")}`,
      name: partial.name ?? "Untitled Form",
      eventName: partial.eventName ?? "",
      eventDate: "TBD",
      status: "draft",
      createdAt: now,
      updatedAt: now,
      fieldsCount: 0,
      requiredFieldsCount: 0,
      responsesCount: 0,
      maxCapacity: null,
      allowFamily: false,
      shareableLink: `/event-register/${Date.now()}`,
      conversionRate: 0,
      registrationDeadline: partial.registrationDeadline ?? null,
      config: { ...DEFAULT_REGISTRATION_FORM_CONFIG },
    };
    setForms(prev => [newForm, ...prev]);
    setBuilderForm(newForm);
  };

  const handleSaveBuilder = (form: RegistrationForm, config: RegistrationFormConfig) => {
    const nonSectionFields = config.fields.filter(f => f.type !== "section");
    setForms(prev => prev.map(f => f.id === form.id ? {
      ...f,
      config,
      fieldsCount: nonSectionFields.length,
      requiredFieldsCount: nonSectionFields.filter(f => f.required).length,
      allowFamily: config.allowFamilyRegistration,
      updatedAt: new Date().toISOString().split("T")[0],
    } : f));
    setBuilderForm(null);
  };

  const handlePreview = (form: RegistrationForm) => {
    window.open(`${window.location.origin}${form.shareableLink}`, "_blank");
  };

  const handleEditForm = (form: RegistrationForm) => {
    setSelectedForm(null);
    setBuilderForm(form);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-800">Registration Forms</h2>
          <p className="text-xs sm:text-sm text-slate-500">Create, manage, and share event registration forms</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => setShowSettings(true)}>
            <Settings2 className="w-3.5 h-3.5 text-indigo-500" /> Settings & Enhancements
          </Button>
          <Button size="sm"
            className="gap-1.5 bg-gradient-to-r from-indigo-600 to-violet-500 hover:from-indigo-700 hover:to-violet-600 text-xs"
            onClick={() => setShowCreateDialog(true)}>
            <Plus className="w-3.5 h-3.5" /> New Form
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard icon={FileText} label="Total Forms" value={stats.total} sub={`${stats.active} active`} color="bg-indigo-500" />
        <StatCard icon={ClipboardList} label="Total Responses" value={stats.totalResponses.toLocaleString()} color="bg-violet-500" />
        <StatCard icon={TrendingUp} label="Avg. Conversion" value={`${stats.avgConversion}%`} color="bg-emerald-500" />
        <StatCard icon={Globe} label="Active Forms" value={stats.active} sub="currently accepting" color="bg-cyan-500" />
      </div>

      {/* Filter Tabs + Search + View Toggle */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-1 p-0.5 bg-white rounded-lg border border-slate-100 shadow-[0_1px_4px_rgba(0,0,0,0.04)] overflow-x-auto hide-scrollbar flex-1 sm:flex-none">
          {FILTER_TABS.map(t => {
            const count = t.id === "all" ? forms.length : forms.filter(f => f.status === t.id).length;
            return (
              <button
                key={t.id}
                onClick={() => setFilterTab(t.id)}
                className={cn(
                  "flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-md text-[10px] sm:text-xs font-medium transition-all whitespace-nowrap",
                  filterTab === t.id
                    ? "bg-gradient-to-r from-indigo-600 to-violet-500 text-white shadow-sm"
                    : "text-slate-500 hover:text-indigo-600 hover:bg-indigo-50"
                )}
              >
                {t.label}
                <span className={cn("text-[9px] px-1 py-0.5 rounded-full",
                  filterTab === t.id ? "bg-white/20 text-white" : "bg-slate-100 text-slate-400"
                )}>{count}</span>
              </button>
            );
          })}
        </div>

        <div className="flex gap-2 flex-1">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <Input
              className="pl-8 h-8 text-xs"
              placeholder="Search forms..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <Button variant="outline" size="sm" className="h-8 gap-1 text-xs"
            onClick={() => setSortBy(s => s === "date" ? "responses" : s === "responses" ? "name" : "date")}>
            <ArrowUpDown className="w-3 h-3" />
            {sortBy === "date" ? "Recent" : sortBy === "responses" ? "Responses" : "Name"}
          </Button>
          {/* View Toggle */}
          <div className="flex items-center bg-white border border-slate-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode("grid")}
              className={cn("p-1.5 transition-colors", viewMode === "grid" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-slate-600")}
              title="Grid view"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={cn("p-1.5 transition-colors", viewMode === "table" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-slate-600")}
              title="Table view"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Selection header */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-2 py-1.5 px-3 bg-indigo-50 rounded-lg border border-indigo-100 text-xs text-indigo-700">
          <CheckSquare className="w-3.5 h-3.5" />
          <span className="font-medium">{selectedIds.size} form{selectedIds.size > 1 ? "s" : ""} selected</span>
          <button onClick={clearSelection} className="ml-auto text-indigo-400 hover:text-indigo-700">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Forms Grid or Table */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-100 p-10 text-center">
          <FileText className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <h3 className="font-semibold text-slate-600 mb-1">
            {search.trim() ? "No forms found" : "No registration forms yet"}
          </h3>
          <p className="text-sm text-slate-400 mb-4">
            {search.trim()
              ? "Try a different search term"
              : "Create your first registration form to start collecting event registrations"
            }
          </p>
          {!search.trim() && (
            <Button size="sm"
              className="gap-1.5 bg-gradient-to-r from-indigo-600 to-violet-500 hover:from-indigo-700 hover:to-violet-600"
              onClick={() => setShowCreateDialog(true)}>
              <Plus className="w-3.5 h-3.5" /> Create Your First Form
            </Button>
          )}
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(form => (
            <FormCard
              key={form.id}
              form={form}
              selected={selectedIds.has(form.id)}
              onSelect={() => toggleSelect(form.id)}
              onView={() => setSelectedForm(form)}
              onPreview={() => handlePreview(form)}
              onQR={() => setQrForm(form)}
              onEdit={() => handleEditForm(form)}
              onSettings={() => setShowSettings(true)}
              onStatusChange={next => handleStatusChange(form, next)}
              onViewSubmissions={() => setSubmissionsForm(form)}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="pl-4 py-3 w-8">
                    <button onClick={() => {
                      if (selectedIds.size === filtered.length) clearSelection();
                      else setSelectedIds(new Set(filtered.map(f => f.id)));
                    }}>
                      {selectedIds.size === filtered.length && filtered.length > 0
                        ? <CheckSquare className="w-4 h-4 text-indigo-600" />
                        : <Square className="w-4 h-4 text-slate-300" />
                      }
                    </button>
                  </th>
                  <th className="py-3 pr-3 text-left text-xs font-semibold text-slate-500">Form</th>
                  <th className="py-3 pr-3 text-left text-xs font-semibold text-slate-500">Status</th>
                  <th className="py-3 pr-3 text-right text-xs font-semibold text-slate-500">Responses</th>
                  <th className="py-3 pr-3 text-right text-xs font-semibold text-slate-500">Conversion</th>
                  <th className="py-3 pr-3 text-left text-xs font-semibold text-slate-500">Deadline</th>
                  <th className="py-3 pr-4 text-right text-xs font-semibold text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(form => (
                  <FormTableRow
                    key={form.id}
                    form={form}
                    selected={selectedIds.has(form.id)}
                    onSelect={() => toggleSelect(form.id)}
                    onView={() => setSelectedForm(form)}
                    onEdit={() => handleEditForm(form)}
                    onStatusChange={next => handleStatusChange(form, next)}
                    onViewSubmissions={() => setSubmissionsForm(form)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <BulkActionBar
          count={selectedIds.size}
          onClose={clearSelection}
          onArchive={() => handleBulkStatusChange("archived")}
          onClose2={() => handleBulkStatusChange("closed")}
          onExport={() => { clearSelection(); }}
          onDelete={handleBulkDelete}
        />
      )}

      {/* Dialogs */}
      {showCreateDialog && (
        <CreateFormDialog onClose={() => setShowCreateDialog(false)} onCreate={handleCreate} />
      )}
      {selectedForm && (
        <FormDetailDrawer
          form={selectedForm}
          onClose={() => setSelectedForm(null)}
          onEdit={() => handleEditForm(selectedForm)}
          onPreview={() => handlePreview(selectedForm)}
          onSettings={() => { setSelectedForm(null); setShowSettings(true); }}
          onViewSubmissions={() => { setSubmissionsForm(selectedForm); setSelectedForm(null); }}
        />
      )}
      {submissionsForm && (
        <SubmissionsDrawer form={submissionsForm} onClose={() => setSubmissionsForm(null)} />
      )}
      {qrForm && (
        <QRModal form={qrForm} onClose={() => setQrForm(null)} />
      )}
      {showSettings && (
        <FormSettingsPanel onClose={() => setShowSettings(false)} />
      )}
      {builderForm && (
        <FormBuilderDialog
          form={builderForm}
          onClose={() => setBuilderForm(null)}
          onSave={handleSaveBuilder}
        />
      )}
    </div>
  );
}
