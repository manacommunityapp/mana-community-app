import { useState, useMemo } from "react";
import {
  Plus, Search, MoreVertical, Eye, Pencil, Copy, Trash2,
  QrCode, Download, BarChart3, FileText, CheckCircle2, Clock, XCircle,
  Archive, Globe, Link2, Users, ClipboardList, Calendar,
  ArrowUpDown, TrendingUp, Share2, Settings2,
  AlertCircle, Zap, ListChecks, ChevronRight,
} from "lucide-react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { cn } from "../ui/utils";
import { EventRegistrationFormBuilder, DEFAULT_REGISTRATION_FORM_CONFIG, type RegistrationFormConfig } from "./EventRegistrationFormBuilder";
import { FormSettingsPanel } from "./EventsFormEnhancements";

/* ─── Types ─── */
type FormStatus = "draft" | "active" | "closed" | "archived";

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
  config?: RegistrationFormConfig;
}

/* ─── Mock Data ─── */
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
  },
];

const STATUS_CONFIG: Record<FormStatus, { label: string; icon: any; bg: string; text: string; dot: string }> = {
  active:   { label: "Active",   icon: CheckCircle2, bg: "bg-emerald-50",  text: "text-emerald-700", dot: "bg-emerald-500" },
  draft:    { label: "Draft",    icon: Clock,        bg: "bg-amber-50",    text: "text-amber-700",   dot: "bg-amber-500"   },
  closed:   { label: "Closed",   icon: XCircle,      bg: "bg-slate-100",   text: "text-slate-600",   dot: "bg-slate-400"   },
  archived: { label: "Archived", icon: Archive,      bg: "bg-rose-50",     text: "text-rose-600",    dot: "bg-rose-400"    },
};

const FILTER_TABS: { id: FormStatus | "all"; label: string }[] = [
  { id: "all",      label: "All Forms"  },
  { id: "active",   label: "Active"     },
  { id: "draft",    label: "Drafts"     },
  { id: "closed",   label: "Closed"     },
  { id: "archived", label: "Archived"   },
];

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

/* ─── Form Detail Drawer ─── */
function FormDetailDrawer({ form, onClose, onEdit, onPreview, onSettings }: {
  form: RegistrationForm;
  onClose: () => void;
  onEdit: () => void;
  onPreview: () => void;
  onSettings: () => void;
}) {
  const s = STATUS_CONFIG[form.status];
  const capacityPct = form.maxCapacity ? Math.round((form.responsesCount / form.maxCapacity) * 100) : null;

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
            <div className="flex items-center gap-2">
              <Badge className={cn("gap-1", s.bg, s.text)}>
                <span className={cn("w-1.5 h-1.5 rounded-full", s.dot)} />
                {s.label}
              </Badge>
              {form.allowFamily && (
                <Badge variant="outline" className="gap-1 text-violet-600 border-violet-200 bg-violet-50">
                  <Users className="w-3 h-3" /> Family
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

          {/* Response Trend (Placeholder) */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-500" /> Response Trend (Last 7 days)
            </h4>
            <div className="bg-slate-50 rounded-lg p-4 h-32 flex items-end gap-1.5">
              {[28, 45, 32, 58, 72, 48, 65].map((h, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full bg-gradient-to-t from-indigo-500 to-violet-400 rounded-t"
                    style={{ height: `${h}%` }}
                  />
                  <span className="text-[8px] text-slate-400">
                    {["M", "T", "W", "T", "F", "S", "S"][i]}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Timestamps */}
          <div className="space-y-1.5 text-xs text-slate-500">
            <p>Created: {new Date(form.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
            <p>Last Updated: {new Date(form.updatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
          </div>

          {/* Actions */}
          <div className="space-y-2">
            <Button className="w-full gap-2 bg-gradient-to-r from-indigo-600 to-violet-500 hover:from-indigo-700 hover:to-violet-600" onClick={onPreview}>
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

/* ─── Create Form Dialog ─── */
function CreateFormDialog({ onClose, onCreate }: { onClose: () => void; onCreate: (form: Partial<RegistrationForm>) => void }) {
  const [name, setName] = useState("");
  const [eventName, setEventName] = useState("");
  const [template, setTemplate] = useState<"blank" | "standard" | "minimal" | "detailed">("standard");

  const TEMPLATES = [
    { id: "blank" as const, label: "Blank Form", description: "Start from scratch with no fields", icon: FileText, fields: 0 },
    { id: "standard" as const, label: "Standard", description: "Personal info, contact, emergency contact, dietary", icon: ClipboardList, fields: 14 },
    { id: "minimal" as const, label: "Minimal", description: "Just name, email, and phone — quick registration", icon: Zap, fields: 5 },
    { id: "detailed" as const, label: "Detailed", description: "All fields including ID verification, accessibility, apparel", icon: ListChecks, fields: 22 },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-indigo-600 to-violet-500 px-6 py-4">
          <h3 className="text-lg font-bold text-white">Create Registration Form</h3>
          <p className="text-indigo-100 text-sm">Set up a new registration form for your event</p>
        </div>

        <div className="p-6 space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Form Name *</label>
            <Input
              placeholder="e.g. Ganesh Chaturthi 2026 Registration"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Event Name *</label>
            <Input
              placeholder="Select or type the event name"
              value={eventName}
              onChange={e => setEventName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Start with a Template</label>
            <div className="grid grid-cols-2 gap-2">
              {TEMPLATES.map(t => (
                <button
                  key={t.id}
                  onClick={() => setTemplate(t.id)}
                  className={cn(
                    "text-left p-3 rounded-xl border-2 transition-all",
                    template === t.id
                      ? "border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200"
                      : "border-slate-200 hover:border-indigo-200 hover:bg-slate-50"
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <t.icon className={cn("w-4 h-4", template === t.id ? "text-indigo-600" : "text-slate-400")} />
                    <span className={cn("text-sm font-semibold", template === t.id ? "text-indigo-700" : "text-slate-700")}>
                      {t.label}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500">{t.description}</p>
                  {t.fields > 0 && (
                    <p className="text-[10px] text-indigo-400 mt-1">{t.fields} fields</p>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button
              className="flex-1 bg-gradient-to-r from-indigo-600 to-violet-500 hover:from-indigo-700 hover:to-violet-600 gap-2"
              disabled={!name.trim() || !eventName.trim()}
              onClick={() => {
                onCreate({
                  name: name.trim(),
                  eventName: eventName.trim(),
                  status: "draft",
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
function FormCard({ form, onView, onPreview, onQR, onEdit, onSettings }: {
  form: RegistrationForm;
  onView: () => void;
  onPreview: () => void;
  onQR: () => void;
  onEdit: () => void;
  onSettings: () => void;
}) {
  const s = STATUS_CONFIG[form.status];
  const [menuOpen, setMenuOpen] = useState(false);
  const capacityPct = form.maxCapacity ? Math.round((form.responsesCount / form.maxCapacity) * 100) : null;

  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-[0_1px_4px_rgba(0,0,0,0.04)] hover:shadow-md transition-all group">
      {/* Header */}
      <div className="p-4 sm:p-5 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge className={cn("gap-1 text-[10px]", s.bg, s.text)}>
                <span className={cn("w-1.5 h-1.5 rounded-full", s.dot)} />
                {s.label}
              </Badge>
              {form.allowFamily && (
                <Badge variant="outline" className="gap-1 text-[10px] text-violet-600 border-violet-200 bg-violet-50">
                  <Users className="w-2.5 h-2.5" /> Family
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
                  {form.status === "active" && (
                    <button className="w-full text-left px-3 py-2 text-sm text-amber-600 hover:bg-amber-50 flex items-center gap-2">
                      <XCircle className="w-3.5 h-3.5" /> Close Registration
                    </button>
                  )}
                  {form.status === "draft" && (
                    <button className="w-full text-left px-3 py-2 text-sm text-emerald-600 hover:bg-emerald-50 flex items-center gap-2">
                      <Globe className="w-3.5 h-3.5" /> Publish
                    </button>
                  )}
                  {form.status === "closed" && (
                    <button className="w-full text-left px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 flex items-center gap-2">
                      <Archive className="w-3.5 h-3.5" /> Archive
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
      <div className="border-t border-slate-100 px-4 sm:px-5 py-2.5 flex items-center gap-2">
        <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs text-slate-500 hover:text-indigo-600" onClick={onPreview}>
          <Eye className="w-3 h-3" /> Preview
        </Button>
        <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs text-slate-500 hover:text-indigo-600" onClick={onQR}>
          <Link2 className="w-3 h-3" /> Share
        </Button>
        <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs text-slate-500 hover:text-indigo-600" onClick={onSettings}>
          <Settings2 className="w-3 h-3" /> Settings
        </Button>
        <div className="flex-1" />
        <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs text-slate-500 hover:text-indigo-600" onClick={onView}>
          Details <ChevronRight className="w-3 h-3" />
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
      {/* Header */}
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
          <Button variant="outline" size="sm" className="text-xs gap-1" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" className="text-xs gap-1 bg-gradient-to-r from-indigo-600 to-violet-500 hover:from-indigo-700 hover:to-violet-600"
            onClick={() => onSave(form, config)}>
            <CheckCircle2 className="w-3.5 h-3.5" /> Save Template
          </Button>
        </div>
      </div>

      {/* Builder */}
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
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedForm, setSelectedForm] = useState<RegistrationForm | null>(null);
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
          <Button variant="outline" size="sm" className="gap-1.5 text-xs"
            onClick={() => setShowSettings(true)}>
            <Settings2 className="w-3.5 h-3.5 text-indigo-500" />
            Settings & Enhancements
          </Button>
          <Button
            size="sm"
            className="gap-1.5 bg-gradient-to-r from-indigo-600 to-violet-500 hover:from-indigo-700 hover:to-violet-600 text-xs"
            onClick={() => setShowCreateDialog(true)}
          >
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

      {/* Filter Tabs + Search */}
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
        </div>
      </div>

      {/* Forms Grid */}
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
            <Button
              size="sm"
              className="gap-1.5 bg-gradient-to-r from-indigo-600 to-violet-500 hover:from-indigo-700 hover:to-violet-600"
              onClick={() => setShowCreateDialog(true)}
            >
              <Plus className="w-3.5 h-3.5" /> Create Your First Form
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(form => (
            <FormCard
              key={form.id}
              form={form}
              onView={() => setSelectedForm(form)}
              onPreview={() => handlePreview(form)}
              onQR={() => setQrForm(form)}
              onEdit={() => handleEditForm(form)}
              onSettings={() => setShowSettings(true)}
            />
          ))}
        </div>
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
        />
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
