import { useState, useEffect, useRef } from "react";
import {
  Search, Download, QrCode, Filter, CheckCircle2, Clock, XCircle, Plus,
  Loader2, AlertCircle, X, User, Mail, Phone, MapPin, Ticket, Eye,
  Printer, FileSpreadsheet, FileText, Copy, ChevronDown, UserPlus,
  CalendarDays, Hash, CreditCard, Users, BadgeCheck, ArrowUpDown,
  UserCheck, Check, Edit3, Save, Ban, Trash2, AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { useEventMock } from "./EventMockToggle";
import { useAuth } from "../../../contexts/AuthContext";
import { eventService, type EventResponse, type RegistrationResponse } from "../../../services/events/eventService";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";
import { Textarea } from "../ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { cn } from "../ui/utils";

/* ─── Constants ─── */
const categories = ["All", "Family", "Individual", "VIP", "Volunteer", "Committee", "Sponsor", "Media"];

const mockRegistrants = [
  { id: "REG-001", name: "Ramesh Sharma",   email: "ramesh@email.com",  phone: "9876543210", category: "VIP",        tickets: 2, amount: "₹2,000", status: "Confirmed", time: "2h ago",  address: "Andheri East, Mumbai", checkedIn: true,  checkedInAt: "09:30 AM" },
  { id: "REG-002", name: "Priya Iyer",      email: "priya@email.com",   phone: "9876543211", category: "Family",     tickets: 4, amount: "₹1,600", status: "Confirmed", time: "3h ago",  address: "Bandra West, Mumbai", checkedIn: true,  checkedInAt: "10:15 AM" },
  { id: "REG-003", name: "Karan Mehta",     email: "karan@email.com",   phone: "9876543212", category: "Individual", tickets: 1, amount: "₹400",   status: "Pending",   time: "5h ago",  address: "Powai, Mumbai",       checkedIn: false },
  { id: "REG-004", name: "Neha Kulkarni",   email: "neha@email.com",    phone: "9876543213", category: "Volunteer",  tickets: 1, amount: "Free",   status: "Confirmed", time: "6h ago",  address: "Dadar, Mumbai",       checkedIn: true,  checkedInAt: "08:45 AM" },
  { id: "REG-005", name: "Arvind Patel",    email: "arvind@email.com",  phone: "9876543214", category: "Family",     tickets: 5, amount: "₹2,000", status: "Confirmed", time: "8h ago",  address: "Juhu, Mumbai",        checkedIn: false },
  { id: "REG-006", name: "Sudha Reddy",     email: "sudha@email.com",   phone: "9876543215", category: "Committee",  tickets: 1, amount: "Free",   status: "Confirmed", time: "1d ago",  address: "Worli, Mumbai",       checkedIn: true,  checkedInAt: "09:00 AM" },
  { id: "REG-007", name: "Vikram Singh",    email: "vikram@email.com",  phone: "9876543216", category: "Individual", tickets: 1, amount: "₹400",   status: "Cancelled", time: "1d ago",  address: "Malad, Mumbai",       checkedIn: false },
  { id: "REG-008", name: "Anita Desai",     email: "anita@email.com",   phone: "9876543217", category: "Sponsor",    tickets: 10,amount: "₹15,000",status: "Confirmed", time: "2d ago",  address: "Colaba, Mumbai",      checkedIn: true,  checkedInAt: "11:00 AM" },
  { id: "REG-009", name: "Media Corp TV",   email: "media@corp.com",    phone: "9876543218", category: "Media",      tickets: 3, amount: "Free",   status: "Pending",   time: "2d ago",  address: "Lower Parel, Mumbai", checkedIn: false },
  { id: "REG-010", name: "Deepak Joshi",    email: "deepak@email.com",  phone: "9876543219", category: "VIP",        tickets: 2, amount: "₹2,000", status: "Confirmed", time: "3d ago",  address: "Goregaon, Mumbai",    checkedIn: false },
];

type RegRow = {
  id: string; name: string; email: string; phone: string; category: string;
  tickets: number; amount: string; status: string; time: string; address: string;
  backendId?: number;
  checkedIn?: boolean;
  checkedInAt?: string;
};

const statusStyle: Record<string, { icon: any; bg: string; text: string }> = {
  Confirmed: { icon: CheckCircle2, bg: "bg-emerald-50", text: "text-emerald-600" },
  CONFIRMED: { icon: CheckCircle2, bg: "bg-emerald-50", text: "text-emerald-600" },
  Pending:   { icon: Clock,        bg: "bg-amber-50",   text: "text-amber-600"   },
  PENDING:   { icon: Clock,        bg: "bg-amber-50",   text: "text-amber-600"   },
  Cancelled: { icon: XCircle,      bg: "bg-rose-50",    text: "text-rose-600"    },
  CANCELLED: { icon: XCircle,      bg: "bg-rose-50",    text: "text-rose-600"    },
  REJECTED:  { icon: XCircle,      bg: "bg-rose-50",    text: "text-rose-600"    },
};

const mockCatStats = [
  { label: "Total",      value: 1842, color: "#4f46e5" },
  { label: "Family",     value: 520,  color: "#6366f1" },
  { label: "Individual", value: 680,  color: "#0891b2" },
  { label: "VIP",        value: 120,  color: "#7c3aed" },
  { label: "Volunteer",  value: 318,  color: "#10b981" },
  { label: "Other",      value: 204,  color: "#8b5cf6" },
];

function mapLiveRegistrations(data: RegistrationResponse[]): RegRow[] {
  return data.map(r => ({
    id: `REG-${String(r.id).padStart(3, "0")}`,
    name: r.userName,
    email: r.userEmail ?? "—",
    phone: "—",
    category: "—",
    tickets: 1,
    amount: "—",
    status: r.status.charAt(0) + r.status.slice(1).toLowerCase(),
    time: new Date(r.registeredAt).toLocaleDateString("en-IN", { month: "short", day: "numeric" }),
    address: "—",
    backendId: r.id,
    checkedIn: Boolean(r.checkedIn),
    checkedInAt: r.checkedInAt ?? undefined,
  }));
}

/* ─── Export Helpers ─── */
function generateCSV(rows: RegRow[], useMock: boolean): string {
  const headers = useMock
    ? ["ID", "Name", "Email", "Phone", "Category", "Tickets", "Amount", "Status", "Registered", "Checked In", "Check-In Time"]
    : ["ID", "Name", "Email", "Status", "Registered", "Checked In", "Check-In Time"];

  const lines = rows.map(r => {
    const checkInStatus = r.checkedIn ? "Yes" : "No";
    const checkInTime = r.checkedInAt || "—";
    const base = [r.id, r.name, r.email];
    if (useMock) {
      return [...base, r.phone, r.category, String(r.tickets), r.amount, r.status, r.time, checkInStatus, checkInTime]
        .map(v => `"${v.replace(/"/g, '""')}"`).join(",");
    }
    return [...base, r.status, r.time, checkInStatus, checkInTime].map(v => `"${v.replace(/"/g, '""')}"`).join(",");
  });

  return [headers.join(","), ...lines].join("\n");
}

function downloadFile(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/* ─── Export Menu ─── */
function ExportMenu({ rows, useMock, onClose }: { rows: RegRow[]; useMock: boolean; onClose: () => void }) {
  const handleCSV = () => {
    const csv = generateCSV(rows, useMock);
    downloadFile(csv, `registrants-${new Date().toISOString().slice(0, 10)}.csv`, "text/csv");
    onClose();
  };

  const handleJSON = () => {
    const json = JSON.stringify(rows, null, 2);
    downloadFile(json, `registrants-${new Date().toISOString().slice(0, 10)}.json`, "application/json");
    onClose();
  };

  const handleClipboard = () => {
    const csv = generateCSV(rows, useMock);
    navigator.clipboard.writeText(csv).catch(() => { alert("Copy failed — please use the CSV download instead."); });
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-10" onClick={onClose} />
      <div className="absolute right-0 top-full mt-1 z-20 bg-white rounded-xl shadow-lg border border-slate-100 py-1 w-52">
        <button onClick={handleCSV}
          className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2">
          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" /> Export as CSV
        </button>
        <button onClick={handleJSON}
          className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2">
          <FileText className="w-3.5 h-3.5 text-blue-500" /> Export as JSON
        </button>
        <hr className="my-1 border-slate-100" />
        <button onClick={handleClipboard}
          className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2">
          <Copy className="w-3.5 h-3.5 text-violet-500" /> Copy to Clipboard
        </button>
      </div>
    </>
  );
}

/* ─── Print Passes ─── */
function PrintPassesDialog({ registrants, onClose }: { registrants: RegRow[]; onClose: () => void }) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(registrants.filter(r => r.status === "Confirmed").map(r => r.id)));
  const [passSize, setPassSize] = useState<"standard" | "compact">("standard");
  const printRef = useRef<HTMLDivElement>(null);

  const confirmed = registrants.filter(r => r.status === "Confirmed");
  const selected = registrants.filter(r => selectedIds.has(r.id));

  const toggleAll = () => {
    if (selectedIds.size === confirmed.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(confirmed.map(r => r.id)));
    }
  };

  const toggleOne = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handlePrint = () => {
    if (!printRef.current) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`<!DOCTYPE html><html><head><title>Event Passes</title>
      <style>
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: system-ui, -apple-system, sans-serif; padding: 10mm; }
        .pass-grid { display: grid; grid-template-columns: repeat(${passSize === "compact" ? 3 : 2}, 1fr); gap: 8mm; }
        .pass { border: 2px solid #e2e8f0; border-radius: 12px; padding: ${passSize === "compact" ? "10px" : "16px"}; page-break-inside: avoid; }
        .pass-header { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px solid #f1f5f9; }
        .pass-logo { width: 28px; height: 28px; background: linear-gradient(135deg, #4f46e5, #7c3aed); border-radius: 6px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 11px; }
        .pass-event { font-size: 10px; color: #64748b; }
        .pass-name { font-size: ${passSize === "compact" ? "13px" : "15px"}; font-weight: 700; color: #1e293b; margin-bottom: 4px; }
        .pass-detail { font-size: 10px; color: #64748b; margin-bottom: 2px; display: flex; align-items: center; gap: 4px; }
        .pass-badge { display: inline-block; padding: 2px 8px; border-radius: 99px; font-size: 9px; font-weight: 700; background: #ecfdf5; color: #059669; margin-top: 6px; }
        .pass-id { font-family: monospace; font-size: 9px; color: #94a3b8; margin-top: 6px; }
        .pass-qr { width: ${passSize === "compact" ? "50px" : "64px"}; height: ${passSize === "compact" ? "50px" : "64px"}; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 8px; color: #94a3b8; }
        .pass-body { display: flex; gap: 10px; }
        .pass-info { flex: 1; }
        @media print { body { padding: 5mm; } .pass { border: 1px solid #cbd5e1; } }
      </style></head><body>
      <div class="pass-grid">${selected.map(r => `
        <div class="pass">
          <div class="pass-header">
            <div class="pass-logo">MC</div>
            <div class="pass-event">Mana Community Event Pass</div>
          </div>
          <div class="pass-body">
            <div class="pass-info">
              <div class="pass-name">${r.name}</div>
              <div class="pass-detail">${r.category !== "—" ? r.category : "Attendee"}</div>
              ${r.email !== "—" ? `<div class="pass-detail">${r.email}</div>` : ""}
              ${r.phone !== "—" ? `<div class="pass-detail">${r.phone}</div>` : ""}
              <div class="pass-badge">✓ CONFIRMED</div>
              <div class="pass-id">${r.id}</div>
            </div>
            <div class="pass-qr">QR</div>
          </div>
        </div>`).join("")}
      </div></body></html>`);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); }, 300);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-indigo-600 to-violet-500 px-6 py-4 rounded-t-2xl flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <QrCode className="w-5 h-5" /> Print Event Passes
            </h3>
            <p className="text-indigo-100 text-sm">{selectedIds.size} of {confirmed.length} confirmed registrants selected</p>
          </div>
          <button onClick={onClose} className="text-indigo-200 hover:text-white p-1"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Controls */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <button onClick={toggleAll}
                className="text-xs font-medium text-indigo-600 hover:text-indigo-700 underline">
                {selectedIds.size === confirmed.length ? "Deselect All" : "Select All Confirmed"}
              </button>
              <Badge variant="outline" className="text-[10px]">{selectedIds.size} selected</Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-500">Pass size:</span>
              {(["standard", "compact"] as const).map(s => (
                <button key={s} onClick={() => setPassSize(s)}
                  className={cn("px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all",
                    passSize === s
                      ? "bg-indigo-100 text-indigo-700 ring-1 ring-indigo-200"
                      : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                  )}>
                  {s === "standard" ? "Standard (2/row)" : "Compact (3/row)"}
                </button>
              ))}
            </div>
          </div>

          {/* Registrant checklist */}
          <div className="border border-slate-100 rounded-xl divide-y divide-slate-50 max-h-[40vh] overflow-y-auto">
            {confirmed.length === 0 ? (
              <div className="p-6 text-center text-sm text-slate-400">
                No confirmed registrants to print passes for
              </div>
            ) : confirmed.map(r => (
              <label key={r.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 cursor-pointer">
                <input type="checkbox" checked={selectedIds.has(r.id)}
                  onChange={() => toggleOne(r.id)}
                  className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 truncate">{r.name}</p>
                  <p className="text-[10px] text-slate-400">{r.id} · {r.category !== "—" ? r.category : "Attendee"}</p>
                </div>
                {r.tickets > 1 && (
                  <Badge variant="outline" className="text-[9px]">{r.tickets} tickets</Badge>
                )}
              </label>
            ))}
          </div>

          {/* Preview */}
          {selected.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] font-semibold text-slate-500 uppercase">Preview (first pass)</p>
              <div ref={printRef} className="bg-white border-2 border-slate-200 rounded-xl p-4 max-w-xs">
                <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-100">
                  <div className="w-7 h-7 rounded-md flex items-center justify-center text-white text-[10px] font-bold"
                    style={{ background: "linear-gradient(135deg, #4f46e5, #7c3aed)" }}>MC</div>
                  <span className="text-[10px] text-slate-400">Mana Community Event Pass</span>
                </div>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <p className="font-bold text-slate-800 text-sm">{selected[0].name}</p>
                    <p className="text-[10px] text-slate-500">{selected[0].category !== "—" ? selected[0].category : "Attendee"}</p>
                    {selected[0].email !== "—" && <p className="text-[10px] text-slate-400 mt-0.5">{selected[0].email}</p>}
                    <Badge className="mt-1.5 bg-emerald-50 text-emerald-600 text-[9px]">
                      <CheckCircle2 className="w-2.5 h-2.5 mr-0.5" /> CONFIRMED
                    </Badge>
                    <p className="text-[9px] text-slate-300 font-mono mt-1">{selected[0].id}</p>
                  </div>
                  <div className="w-14 h-14 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center shrink-0">
                    <QrCode className="w-6 h-6 text-slate-300" />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-slate-100 px-6 py-4 flex gap-2 shrink-0">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button
            className="flex-1 bg-gradient-to-r from-indigo-600 to-violet-500 hover:from-indigo-700 hover:to-violet-600 gap-2"
            disabled={selected.length === 0}
            onClick={handlePrint}>
            <Printer className="w-4 h-4" /> Print {selected.length} Pass{selected.length !== 1 ? "es" : ""}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ─── Add Registrant Dialog ─── */
function AddRegistrantDialog({
  useMock,
  events,
  selectedEventId,
  onAdd,
  onClose,
}: {
  useMock: boolean;
  events: EventResponse[];
  selectedEventId: number | null;
  onAdd: (row: RegRow) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    eventId: selectedEventId || (events[0]?.id ?? null),
    name: "",
    email: "",
    phone: "",
    category: "Individual",
    tickets: 1,
    amount: "Free",
    paymentStatus: "FREE",
    address: "",
    autoConfirm: true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const update = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm(prev => ({ ...prev, [k]: v }));

  const canSave = form.name.trim() && form.email.trim();

  const handleSave = async () => {
    if (!canSave || saving) return;
    setSaving(true);
    setError("");

    try {
      if (useMock) {
        const row: RegRow = {
          id: `REG-${String(Date.now()).slice(-3)}`,
          name: form.name,
          email: form.email,
          phone: form.phone || "—",
          category: form.category,
          tickets: form.tickets,
          amount: form.amount || "Free",
          status: form.autoConfirm ? "Confirmed" : "Pending",
          time: "Just now",
          address: form.address || "—",
        };
        onAdd(row);
        toast.success(`Registration added for ${form.name}`);
        onClose();
        return;
      }

      const activeEvent = events.find(e => e.id === Number(form.eventId)) || events[0];
      const feeNum = form.amount && form.amount.toLowerCase() !== "free" ? Number(form.amount.replace(/\D/g, "")) : 0;
      const eventTimeStr = activeEvent?.startTime ? (activeEvent.endTime ? `${activeEvent.startTime} - ${activeEvent.endTime}` : activeEvent.startTime) : ((activeEvent as any)?.time || "All Day");
      const eventDateStr = activeEvent?.startDate || new Date().toISOString().slice(0, 10);

      const payload = {
        activityId: activeEvent?.id != null ? `event-${activeEvent.id}` : undefined,
        mainEventId: activeEvent?.id,
        eventId: activeEvent?.id,
        activityTitle: activeEvent?.title || "Community Event",
        eventName: activeEvent?.title || "Community Event",
        category: form.category || "General",
        passType: form.category || "General",
        participantName: form.name.trim(),
        primaryName: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        devoteeCount: Math.max(1, Number(form.tickets) || 1),
        membersCount: Math.max(1, Number(form.tickets) || 1),
        attendingDevotees: form.name.trim(),
        membersJson: JSON.stringify([{ name: form.name.trim(), gender: "Male", relationship: "Self" }]),
        bookingFee: feeNum,
        paymentStatus: feeNum > 0 ? form.paymentStatus : "FREE",
        paymentMethod: "Cash",
        status: form.autoConfirm ? "CONFIRMED" : "PENDING",
        venue: activeEvent?.venue || "Community Center",
        eventDate: eventDateStr,
        eventTime: eventTimeStr,
        flatNo: form.address?.trim() || undefined,
        notes: form.address?.trim() || undefined,
      };

      const created = await eventService.adminCreateRegistration(payload);
      const row: RegRow = {
        id: created.regCode || `REG-${String(created.id || Date.now()).slice(-3)}`,
        name: form.name,
        email: form.email,
        phone: form.phone || "—",
        category: form.category,
        tickets: form.tickets,
        amount: feeNum > 0 ? `₹${feeNum}` : "Free",
        status: form.autoConfirm ? "Confirmed" : "Pending",
        time: "Just now",
        address: form.address || "—",
        backendId: created.id,
      };
      onAdd(row);
      toast.success(`Registration created for ${form.name}`);
      window.dispatchEvent(new CustomEvent("mana_event_registration_updated"));
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to create registration");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-indigo-600 to-violet-500 px-6 py-4 flex items-center justify-between shrink-0">
          <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <UserPlus className="w-5 h-5" /> Add Event Registration
          </h3>
          <button onClick={onClose} className="text-indigo-200 hover:text-white p-1 cursor-pointer"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-center gap-2 text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}

          {!useMock && events.length > 0 && (
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                <Ticket className="w-3.5 h-3.5 text-indigo-500" /> Event
              </Label>
              <select
                className="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs sm:text-sm bg-white"
                value={form.eventId ?? ""}
                onChange={e => update("eventId", Number(e.target.value))}
              >
                {events
                  .filter(ev => String(ev.status || "").toUpperCase() !== "CANCELLED")
                  .map(ev => (
                    <option key={ev.id} value={ev.id}>{ev.title}</option>
                  ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                <User className="w-3 h-3" /> Full Name <span className="text-rose-400">*</span>
              </Label>
              <Input className="text-xs sm:text-sm rounded-xl" placeholder="Enter full name"
                value={form.name} onChange={e => update("name", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                <Mail className="w-3 h-3" /> Email <span className="text-rose-400">*</span>
              </Label>
              <Input className="text-xs sm:text-sm rounded-xl" type="email" placeholder="email@example.com"
                value={form.email} onChange={e => update("email", e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                <Phone className="w-3 h-3" /> Phone Number
              </Label>
              <Input className="text-xs sm:text-sm rounded-xl" placeholder="10-digit number"
                value={form.phone} onChange={e => update("phone", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                <Ticket className="w-3 h-3" /> Category
              </Label>
              <select className="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs sm:text-sm bg-white"
                value={form.category} onChange={e => update("category", e.target.value)}>
                {categories.filter(c => c !== "All").map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                <Hash className="w-3 h-3" /> Tickets / Attendees
              </Label>
              <Input
                className="text-xs sm:text-sm rounded-xl"
                type="number"
                min={1}
                max={50}
                value={form.tickets}
                onKeyDown={(e) => {
                  if (e.key === "-" || e.key === "e" || e.key === "+") e.preventDefault();
                }}
                onChange={e => update("tickets", Math.max(1, Math.min(50, parseInt(e.target.value, 10) || 1)))}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                <CreditCard className="w-3 h-3" /> Fee / Amount
              </Label>
              <Input
                className="text-xs sm:text-sm rounded-xl"
                placeholder="e.g. 500 or Free"
                value={form.amount}
                onKeyDown={(e) => {
                  if (e.key === "-") e.preventDefault();
                }}
                onChange={e => update("amount", e.target.value.replace(/-/g, ""))}
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
              <MapPin className="w-3 h-3" /> Address / Notes
            </Label>
            <Input className="text-xs sm:text-sm rounded-xl" placeholder="Flat No / Wing / Notes"
              value={form.address} onChange={e => update("address", e.target.value)} />
          </div>

          <div className="flex items-center justify-between p-3 bg-indigo-50/70 rounded-xl border border-indigo-100">
            <div>
              <p className="text-xs font-bold text-slate-700">Auto-confirm registration</p>
              <p className="text-[10px] text-slate-400">Mark registration as confirmed immediately</p>
            </div>
            <Switch checked={form.autoConfirm} onCheckedChange={v => update("autoConfirm", v)} />
          </div>
        </div>

        <div className="border-t border-slate-100 px-6 py-4 flex gap-2 shrink-0">
          <Button variant="outline" className="flex-1 rounded-xl" onClick={onClose}>Cancel</Button>
          <Button
            className="flex-1 bg-gradient-to-r from-indigo-600 to-violet-500 hover:from-indigo-700 hover:to-violet-600 gap-2 rounded-xl"
            disabled={!canSave || saving}
            onClick={handleSave}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
            {saving ? "Adding..." : "Add Registrant"}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ─── Edit Registrant Dialog ─── */
function EditRegistrantDialog({
  row,
  useMock,
  onSave,
  onClose,
}: {
  row: RegRow;
  useMock: boolean;
  onSave: (updated: RegRow) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    name: row.name,
    email: row.email === "—" ? "" : row.email,
    phone: row.phone === "—" ? "" : row.phone,
    category: row.category === "—" ? "Individual" : row.category,
    tickets: row.tickets || 1,
    amount: row.amount === "—" ? "Free" : row.amount,
    status: row.status,
    address: row.address === "—" ? "" : row.address,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const update = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm(prev => ({ ...prev, [k]: v }));

  const handleUpdate = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    setError("");

    try {
      const updatedRow: RegRow = {
        ...row,
        name: form.name.trim(),
        email: form.email.trim() || "—",
        phone: form.phone.trim() || "—",
        category: form.category,
        tickets: Math.max(1, Number(form.tickets) || 1),
        amount: form.amount.trim() || "Free",
        status: form.status,
        address: form.address.trim() || "—",
      };

      if (!useMock && row.backendId) {
        const feeNum = form.amount && form.amount.toLowerCase() !== "free" ? Number(form.amount.replace(/\D/g, "")) : 0;
        await eventService.updateRegistration(row.backendId, {
          participantName: form.name.trim(),
          category: form.category,
          devoteeCount: Math.max(1, Number(form.tickets) || 1),
          bookingFee: feeNum,
          status: form.status.toUpperCase(),
          notes: form.address.trim() || undefined,
        });
      }

      onSave(updatedRow);
      toast.success(`Registration updated for ${form.name}`);
      window.dispatchEvent(new CustomEvent("mana_event_registration_updated"));
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to update registration");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-indigo-600 to-violet-500 px-6 py-4 flex items-center justify-between shrink-0">
          <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <Edit3 className="w-5 h-5" /> Edit Registration ({row.id})
          </h3>
          <button onClick={onClose} className="text-indigo-200 hover:text-white p-1 cursor-pointer"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-center gap-2 text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                <User className="w-3 h-3" /> Full Name *
              </Label>
              <Input className="text-xs sm:text-sm rounded-xl"
                value={form.name} onChange={e => update("name", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                <Mail className="w-3 h-3" /> Email
              </Label>
              <Input className="text-xs sm:text-sm rounded-xl" type="email"
                value={form.email} onChange={e => update("email", e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                <Phone className="w-3 h-3" /> Phone Number
              </Label>
              <Input className="text-xs sm:text-sm rounded-xl"
                value={form.phone} onChange={e => update("phone", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                <Ticket className="w-3 h-3" /> Category
              </Label>
              <select className="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs sm:text-sm bg-white"
                value={form.category} onChange={e => update("category", e.target.value)}>
                {categories.filter(c => c !== "All").map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                <Hash className="w-3 h-3" /> Tickets / Devotees
              </Label>
              <Input
                className="text-xs sm:text-sm rounded-xl"
                type="number"
                min={1}
                max={50}
                value={form.tickets}
                onKeyDown={(e) => {
                  if (e.key === "-" || e.key === "e" || e.key === "+") e.preventDefault();
                }}
                onChange={e => update("tickets", Math.max(1, Math.min(50, parseInt(e.target.value, 10) || 1)))}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                <CreditCard className="w-3 h-3" /> Fee / Amount
              </Label>
              <Input
                className="text-xs sm:text-sm rounded-xl"
                value={form.amount}
                onKeyDown={(e) => {
                  if (e.key === "-") e.preventDefault();
                }}
                onChange={e => update("amount", e.target.value.replace(/-/g, ""))}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                <BadgeCheck className="w-3 h-3" /> Status
              </Label>
              <select className="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs sm:text-sm bg-white"
                value={form.status} onChange={e => update("status", e.target.value)}>
                <option value="Confirmed">Confirmed</option>
                <option value="Pending">Pending</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
              <MapPin className="w-3 h-3" /> Address / Notes
            </Label>
            <Input className="text-xs sm:text-sm rounded-xl"
              value={form.address} onChange={e => update("address", e.target.value)} />
          </div>
        </div>

        <div className="border-t border-slate-100 px-6 py-4 flex gap-2 shrink-0">
          <Button variant="outline" className="flex-1 rounded-xl" onClick={onClose}>Cancel</Button>
          <Button
            className="flex-1 bg-gradient-to-r from-indigo-600 to-violet-500 hover:from-indigo-700 hover:to-violet-600 gap-2 rounded-xl"
            disabled={!form.name.trim() || saving}
            onClick={handleUpdate}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ─── View Registrant Drawer ─── */
function ViewRegistrantDrawer({
  row,
  useMock,
  isAdmin,
  onClose,
  onEdit,
  onCancel,
  onDelete,
  onConfirm,
  onReject,
  onToggleCheckIn,
}: {
  row: RegRow;
  useMock: boolean;
  isAdmin: boolean;
  onClose: () => void;
  onEdit: (r: RegRow) => void;
  onCancel: (r: RegRow) => void;
  onDelete: (r: RegRow) => void;
  onConfirm: (r: RegRow) => void;
  onReject: (r: RegRow) => void;
  onToggleCheckIn: (r: RegRow) => void;
}) {
  const ss = statusStyle[row.status] ?? statusStyle.Pending;
  const isCancelled = row.status.toLowerCase() === "cancelled" || row.status.toLowerCase() === "rejected";

  const details = [
    { label: "Registration ID", value: row.id, icon: Hash },
    { label: "Full Name", value: row.name, icon: User },
    { label: "Email", value: row.email, icon: Mail },
    { label: "Phone", value: row.phone, icon: Phone },
    { label: "Category", value: row.category, icon: Ticket },
    { label: "Tickets", value: String(row.tickets), icon: Users },
    { label: "Amount", value: row.amount, icon: CreditCard },
    { label: "Address", value: row.address, icon: MapPin },
    { label: "Registered", value: row.time, icon: CalendarDays },
  ].filter(d => d.value && d.value !== "—");

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col animate-in slide-in-from-right" onClick={e => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-indigo-600 to-violet-500 px-6 py-4 flex items-center justify-between shrink-0">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Eye className="w-5 h-5" /> Registrant Details
          </h3>
          <button onClick={onClose} className="text-indigo-200 hover:text-white p-1 cursor-pointer"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          <div className="bg-slate-50 rounded-xl p-4 text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white text-2xl font-bold mx-auto mb-3">
              {row.name.charAt(0)}
            </div>
            <h4 className="font-bold text-slate-800 text-lg">{row.name}</h4>
            <div className="flex items-center justify-center gap-2 mt-2">
              <span className={cn("inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold", ss.bg, ss.text)}>
                <ss.icon className="w-3 h-3" /> {row.status}
              </span>
              <span className={cn(
                "inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold",
                row.checkedIn ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
              )}>
                {row.checkedIn ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <UserCheck className="w-3 h-3 text-slate-400" />}
                {row.checkedIn ? `Checked In${row.checkedInAt ? ` (${row.checkedInAt})` : ""}` : "Not Checked In"}
              </span>
            </div>
          </div>

          <div className={cn(
            "p-4 rounded-xl border flex items-center justify-between gap-3",
            row.checkedIn ? "bg-emerald-50/70 border-emerald-200" : "bg-indigo-50/70 border-indigo-200"
          )}>
            <div>
              <p className="text-xs font-bold text-slate-800">Event Check-In Status</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {row.checkedIn
                  ? `Attendee checked in on event day${row.checkedInAt ? ` at ${row.checkedInAt}` : ""}`
                  : "Mark attendee as present when they arrive at the venue"}
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => onToggleCheckIn(row)}
              className={cn(
                "gap-1.5 text-xs font-bold shadow-sm h-8",
                row.checkedIn
                  ? "bg-rose-500 hover:bg-rose-600 text-white"
                  : "bg-emerald-600 hover:bg-emerald-700 text-white"
              )}
            >
              {row.checkedIn ? (
                <>
                  <XCircle className="w-3.5 h-3.5" /> Check Out
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" /> Check In
                </>
              )}
            </Button>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-slate-700">Admin Actions</span>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => { onEdit(row); onClose(); }}
                className="h-8 gap-1 text-xs font-semibold text-indigo-600 border-indigo-200 hover:bg-indigo-50"
              >
                <Edit3 className="w-3.5 h-3.5" /> Edit
              </Button>
              {!isCancelled && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { onCancel(row); onClose(); }}
                  className="h-8 gap-1 text-xs font-semibold text-amber-600 border-amber-200 hover:bg-amber-50"
                >
                  <Ban className="w-3.5 h-3.5" /> Cancel
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => { onDelete(row); onClose(); }}
                className="h-8 gap-1 text-xs font-semibold text-rose-600 border-rose-200 hover:bg-rose-50"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            {details.map(d => (
              <div key={d.label} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-100">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                  <d.icon className="w-4 h-4 text-indigo-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-slate-400 uppercase">{d.label}</p>
                  <p className="text-sm font-medium text-slate-700 truncate">{d.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {!useMock && row.status === "Pending" && (
          <div className="border-t border-slate-100 px-6 py-4 flex gap-2 shrink-0">
            <Button variant="outline" className="flex-1 gap-1 text-rose-600 border-rose-200 hover:bg-rose-50" onClick={() => { onReject(row); onClose(); }}>
              <XCircle className="w-4 h-4" /> Reject
            </Button>
            <Button className="flex-1 gap-1 bg-emerald-600 hover:bg-emerald-700" onClick={() => { onConfirm(row); onClose(); }}>
              <CheckCircle2 className="w-4 h-4" /> Confirm
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Main Component ─── */
export function EventsRegistration() {
  const { useMock } = useEventMock();
  const { isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState("All");
  const [checkInFilter, setCheckInFilter] = useState<"all" | "checked_in" | "not_checked_in">("all");
  const [search, setSearch] = useState("");
  const [events, setEvents] = useState<EventResponse[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [liveRegistrants, setLiveRegistrants] = useState<RegRow[]>([]);
  const [addedMockRows, setAddedMockRows] = useState<RegRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [checkingInId, setCheckingInId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [showExport, setShowExport] = useState(false);
  const [showPrintPasses, setShowPrintPasses] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingRow, setEditingRow] = useState<RegRow | null>(null);
  const [cancelConfirmRow, setCancelConfirmRow] = useState<RegRow | null>(null);
  const [deleteConfirmRow, setDeleteConfirmRow] = useState<RegRow | null>(null);
  const [processingAction, setProcessingAction] = useState(false);
  const [viewRow, setViewRow] = useState<RegRow | null>(null);
  const [sortBy, setSortBy] = useState<"time" | "name" | "status" | "checkin">("time");

  const loadRegistrations = () => {
    if (useMock || !selectedEventId) {
      setLiveRegistrants([]);
      return;
    }
    setLoading(true);
    setError("");
    eventService.getEventRegistrations(selectedEventId)
      .then(data => {
        const activeRows = (data || []).filter((r: any) => String(r.status || "").toUpperCase() !== "CANCELLED");
        setLiveRegistrants(mapLiveRegistrations(activeRows));
      })
      .catch(e => setError(e.message ?? "Failed to load registrations"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (useMock) return;
    eventService.getAllEvents()
      .then(evts => {
        const activeEvents = (evts || []).filter(e => String(e.status || "").toUpperCase() !== "CANCELLED");
        setEvents(activeEvents);
        if (activeEvents.length > 0) {
          setSelectedEventId(prev => (prev && activeEvents.some(e => e.id === prev) ? prev : activeEvents[0].id));
        } else {
          setSelectedEventId(null);
          setLiveRegistrants([]);
        }
      })
      .catch(e => setError(e?.message ?? "Failed to load events"));
  }, [useMock]);

  useEffect(() => {
    loadRegistrations();
  }, [useMock, selectedEventId]);

  useEffect(() => {
    window.addEventListener("mana_event_registration_updated", loadRegistrations);
    return () => {
      window.removeEventListener("mana_event_registration_updated", loadRegistrations);
    };
  }, [selectedEventId, useMock]);

  const registrants = useMock ? [...addedMockRows, ...mockRegistrants] : liveRegistrants;

  const filtered = registrants
    .filter(r => {
      const matchCategory = activeTab === "All" || r.category === activeTab;
      const matchSearch =
        r.name.toLowerCase().includes(search.toLowerCase()) ||
        r.id.toLowerCase().includes(search.toLowerCase()) ||
        r.email.toLowerCase().includes(search.toLowerCase()) ||
        r.phone.toLowerCase().includes(search.toLowerCase());

      const matchCheckIn =
        checkInFilter === "all" ||
        (checkInFilter === "checked_in" && r.checkedIn) ||
        (checkInFilter === "not_checked_in" && !r.checkedIn);

      return matchCategory && matchSearch && matchCheckIn;
    })
    .sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "status") return a.status.localeCompare(b.status);
      if (sortBy === "checkin") return Number(b.checkedIn) - Number(a.checkedIn);
      if (sortBy === "time") {
        const aMs = new Date(a.checkedInAt || a.time || 0).getTime();
        const bMs = new Date(b.checkedInAt || b.time || 0).getTime();
        return bMs - aMs;
      }
      return 0;
    });

  const activeRegistrants = registrants.filter(r => {
    const s = String(r.status || "").toUpperCase();
    return s !== "CANCELLED" && s !== "REJECTED";
  });
  const checkedInCount = activeRegistrants.filter(r => r.checkedIn).length;
  const totalCount = activeRegistrants.length;
  const checkedInPct = totalCount > 0 ? Math.round((checkedInCount / totalCount) * 100) : 0;

  const catStats = [
    { label: "Total Registrations", value: totalCount, color: "#4f46e5" },
    { label: "Checked In", value: checkedInCount, color: "#10b981" },
    { label: "Confirmed", value: activeRegistrants.filter(r => r.status === "Confirmed" || r.status === "CONFIRMED").length, color: "#0891b2" },
    { label: "Pending", value: activeRegistrants.filter(r => r.status === "Pending" || r.status === "PENDING").length, color: "#f59e0b" },
  ];

  const handleAddRegistrant = (row: RegRow) => {
    if (useMock) {
      setAddedMockRows(prev => [row, ...prev]);
    } else {
      setLiveRegistrants(prev => [row, ...prev]);
    }
  };

  const handleUpdateRegistrant = (updated: RegRow) => {
    if (useMock) {
      setAddedMockRows(prev => prev.map(r => r.id === updated.id ? updated : r));
    } else {
      setLiveRegistrants(prev => prev.map(r => r.id === updated.id ? updated : r));
    }
  };

  const handleConfirmCancelRegistration = async () => {
    if (!cancelConfirmRow) return;
    setProcessingAction(true);
    try {
      if (useMock) {
        setAddedMockRows(prev => prev.map(r => r.id === cancelConfirmRow.id ? { ...r, status: "Cancelled" } : r));
      } else if (cancelConfirmRow.backendId) {
        await eventService.cancelRegistration(cancelConfirmRow.backendId, undefined, "general");
        setLiveRegistrants(prev => prev.filter(r => r.id !== cancelConfirmRow.id));
      }
      toast.success(`Registration cancelled for ${cancelConfirmRow.name}`);
      setCancelConfirmRow(null);
      window.dispatchEvent(new CustomEvent("mana_event_registration_updated"));
    } catch (err: any) {
      toast.error(err?.message || "Failed to cancel registration");
    } finally {
      setProcessingAction(false);
    }
  };

  const handleConfirmDeleteRegistration = async () => {
    if (!deleteConfirmRow) return;
    setProcessingAction(true);
    try {
      if (useMock) {
        setAddedMockRows(prev => prev.filter(r => r.id !== deleteConfirmRow.id));
      } else if (deleteConfirmRow.backendId) {
        await eventService.deleteRegistrationPermanent(deleteConfirmRow.backendId, "general");
        setLiveRegistrants(prev => prev.filter(r => r.id !== deleteConfirmRow.id));
      }
      toast.success(`Registration permanently deleted for ${deleteConfirmRow.name}`);
      setDeleteConfirmRow(null);
      window.dispatchEvent(new CustomEvent("mana_event_registration_updated"));
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete registration");
    } finally {
      setProcessingAction(false);
    }
  };

  const handleConfirm = async (row: RegRow) => {
    if (!row.backendId) { toast.error("Registration ID not available"); return; }
    try {
      await eventService.confirmRegistration(row.backendId);
      setLiveRegistrants(prev => prev.map(r => r.id === row.id ? { ...r, status: "Confirmed" } : r));
      toast.success(`Confirmed ${row.name}'s registration`);
    } catch (err: any) {
      toast.error(err?.message || "Failed to confirm registration");
    }
  };

  const handleReject = async (row: RegRow) => {
    if (!row.backendId) { toast.error("Registration ID not available"); return; }
    try {
      await eventService.rejectRegistration(row.backendId);
      setLiveRegistrants(prev => prev.map(r => r.id === row.id ? { ...r, status: "Cancelled" } : r));
      toast.success(`Rejected ${row.name}'s registration`);
    } catch (err: any) {
      toast.error(err?.message || "Failed to reject registration");
    }
  };

  const handleToggleCheckIn = async (row: RegRow) => {
    const nextCheckIn = !row.checkedIn;
    const nowTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    if (useMock) {
      setAddedMockRows(prev =>
        prev.map(r => r.id === row.id ? { ...r, checkedIn: nextCheckIn, checkedInAt: nextCheckIn ? nowTime : undefined } : r)
      );
      toast.success(`${row.name} marked as ${nextCheckIn ? "Checked In" : "Checked Out"}`);
      return;
    }

    if (!row.backendId) {
      toast.error("Registration ID not found for check-in");
      return;
    }

    setCheckingInId(row.id);
    try {
      await eventService.toggleCheckIn(row.backendId, nextCheckIn);
      setLiveRegistrants(prev =>
        prev.map(r =>
          r.id === row.id
            ? { ...r, checkedIn: nextCheckIn, checkedInAt: nextCheckIn ? nowTime : undefined }
            : r
        )
      );
      toast.success(`${row.name} marked as ${nextCheckIn ? "Checked In" : "Checked Out"}`);
    } catch (err: any) {
      toast.error(err?.message || "Failed to update check-in status");
    } finally {
      setCheckingInId(null);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-center gap-2 text-xs sm:text-sm text-rose-700">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {!useMock && events.length > 1 && (
        <select
          value={selectedEventId ?? ""}
          onChange={e => setSelectedEventId(Number(e.target.value))}
          className="w-full max-w-xs px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white"
        >
          {events.map(ev => (
            <option key={ev.id} value={ev.id}>{ev.title}</option>
          ))}
        </select>
      )}

      <div className="grid gap-2 sm:gap-4 grid-cols-2 sm:grid-cols-4">
        {catStats.map((s) => (
          <div key={s.label} className="bg-white rounded-2xl p-2.5 sm:p-4 border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.04)] text-center">
            <p className="text-lg sm:text-2xl font-black tabular-nums" style={{ color: s.color }}>
              {s.value.toLocaleString()}
              {s.label === "Checked In" && totalCount > 0 && (
                <span className="text-xs font-semibold text-slate-400 block sm:inline sm:ml-1">({checkedInPct}%)</span>
              )}
            </p>
            <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wide mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.05)] overflow-hidden">
        <div className="px-3 sm:px-6 pt-3 sm:pt-5 pb-2 sm:pb-4 border-b border-slate-50 space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2 sm:gap-3">
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-slate-800">Registrant List</h2>
              <Badge variant="outline" className="text-[9px]">{filtered.length}</Badge>
              <Badge className="bg-emerald-50 text-emerald-700 text-[10px] font-bold border-emerald-200">
                <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
                {checkedInCount} of {totalCount} checked in
              </Badge>
            </div>
            <div className="flex gap-1.5 sm:gap-2">
              <div className="relative">
                <Button variant="ghost" size="sm"
                  onClick={() => setShowExport(!showExport)}
                  className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl text-[10px] sm:text-xs font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 h-auto cursor-pointer">
                  <Download className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  <span className="hidden sm:inline">Export</span>
                  <ChevronDown className="w-2.5 h-2.5" />
                </Button>
                {showExport && <ExportMenu rows={filtered} useMock={useMock} onClose={() => setShowExport(false)} />}
              </div>
              <Button variant="ghost" size="sm"
                onClick={() => setShowPrintPasses(true)}
                className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl text-[10px] sm:text-xs font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 h-auto cursor-pointer">
                <QrCode className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span className="hidden sm:inline">Print Passes</span>
              </Button>
              <Button size="sm"
                onClick={() => setShowAddDialog(true)}
                className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl text-[10px] sm:text-xs font-semibold bg-indigo-500 text-white hover:bg-indigo-600 shadow-sm h-auto cursor-pointer">
                <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> Add Registrant
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 flex-1 min-w-48 max-w-64">
              <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <Input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search by name, email, or ID..."
                className="bg-transparent border-none shadow-none h-auto p-0 text-sm outline-none flex-1 placeholder-slate-400 text-slate-700 focus-visible:ring-0" />
            </div>

            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setCheckInFilter("all")}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                  checkInFilter === "all" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-800"
                )}
              >
                All
              </button>
              <button
                onClick={() => setCheckInFilter("checked_in")}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer",
                  checkInFilter === "checked_in" ? "bg-emerald-600 text-white shadow-xs" : "text-slate-500 hover:text-slate-800"
                )}
              >
                <Check className="w-3 h-3" /> Checked In ({checkedInCount})
              </button>
              <button
                onClick={() => setCheckInFilter("not_checked_in")}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer",
                  checkInFilter === "not_checked_in" ? "bg-amber-600 text-white shadow-xs" : "text-slate-500 hover:text-slate-800"
                )}
              >
                Pending Check-In ({totalCount - checkedInCount})
              </button>
            </div>

            <Button variant="ghost" size="sm" onClick={() => setSortBy(s => s === "time" ? "name" : s === "name" ? "status" : s === "status" ? "checkin" : "time")}
              className="h-8 gap-1 text-xs text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer">
              <ArrowUpDown className="w-3 h-3" />
              {sortBy === "time" ? "Time" : sortBy === "name" ? "Name" : sortBy === "status" ? "Status" : "Check-in"}
            </Button>

            {categories.length > 1 && (
              <div className="flex gap-1.5 flex-wrap">
                {categories.map(c => (
                  <button key={c} onClick={() => setActiveTab(c)}
                    className={cn(
                      "px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer",
                      activeTab === c ? "bg-indigo-500 text-white shadow-sm" : "bg-slate-100 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600"
                    )}>
                    {c}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table className="text-sm">
            <TableHeader>
              <TableRow className="bg-slate-50/80 border-b border-slate-100 hover:bg-slate-50/80">
                {["ID", "Name", "Category", "Tickets", "Amount", "Status", "Check-In", "Time", "Actions"].map(h => (
                  <TableHead key={h!} className={`px-3 sm:px-6 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap h-auto ${
                    (h === "ID" || h === "Time" || h === "Tickets") ? "hidden sm:table-cell" : ""
                  }`}>{h}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-slate-50">
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-slate-400 text-sm">
                    {search.trim() || checkInFilter !== "all"
                      ? "No registrants found matching your search or check-in filter"
                      : "No registrants yet"}
                  </TableCell>
                </TableRow>
              ) : filtered.map((r) => {
                const ss = statusStyle[r.status] ?? statusStyle.Pending;
                const isCheckingIn = checkingInId === r.id;
                const isCancelled = r.status.toLowerCase() === "cancelled" || r.status.toLowerCase() === "rejected";

                return (
                  <TableRow key={r.id} className={cn("animate-fade-in-up hover:bg-slate-50/60 transition-colors", isCancelled && "opacity-60 bg-rose-50/20")}>
                    <TableCell className="px-2 sm:px-6 py-2 sm:py-3.5 font-mono text-xs text-slate-400 hidden sm:table-cell">{r.id}</TableCell>
                    <TableCell className="px-2 sm:px-6 py-2 sm:py-3.5">
                      <div>
                        <p className="font-semibold text-slate-800 text-xs sm:text-sm">{r.name}</p>
                        <p className="text-[10px] text-slate-400 hidden sm:block">{r.email}</p>
                      </div>
                    </TableCell>
                    <TableCell className="px-2 sm:px-6 py-2 sm:py-3.5">
                      <span className="px-2 sm:px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-600">{r.category || "—"}</span>
                    </TableCell>
                    <TableCell className="px-2 sm:px-6 py-2 sm:py-3.5 text-slate-600 font-medium tabular-nums hidden sm:table-cell">{r.tickets ?? "—"}</TableCell>
                    <TableCell className="px-2 sm:px-6 py-2 sm:py-3.5 font-bold text-slate-800 tabular-nums">{r.amount ?? "—"}</TableCell>
                    <TableCell className="px-2 sm:px-6 py-2 sm:py-3.5">
                      <span className={`flex items-center gap-1.5 w-fit px-2 sm:px-2.5 py-1 rounded-full text-[10px] font-bold ${ss.bg} ${ss.text}`}>
                        <ss.icon className="w-3 h-3" /> {r.status}
                      </span>
                    </TableCell>

                    <TableCell className="px-2 sm:px-6 py-2 sm:py-3.5">
                      {r.checkedIn ? (
                        <button
                          type="button"
                          onClick={() => handleToggleCheckIn(r)}
                          disabled={isCheckingIn}
                          className="group flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-50 text-emerald-700 hover:bg-rose-50 hover:text-rose-600 transition-all border border-emerald-200 hover:border-rose-200 cursor-pointer shadow-2xs"
                          title="Click to check out attendee"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 group-hover:hidden shrink-0" />
                          <XCircle className="w-3.5 h-3.5 text-rose-500 hidden group-hover:block shrink-0" />
                          <span className="group-hover:hidden">Checked In</span>
                          <span className="hidden group-hover:inline">Check Out</span>
                          {r.checkedInAt && (
                            <span className="text-[9px] text-emerald-600/75 font-normal ml-0.5 hidden md:inline">({r.checkedInAt})</span>
                          )}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleToggleCheckIn(r)}
                          disabled={isCheckingIn}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 text-slate-600 hover:bg-emerald-600 hover:text-white transition-all border border-slate-200 hover:border-emerald-600 cursor-pointer shadow-2xs"
                          title="Click to mark attendee as checked in"
                        >
                          {isCheckingIn ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <UserCheck className="w-3.5 h-3.5 text-slate-400 group-hover:text-white" />
                          )}
                          <span>Check In</span>
                        </button>
                      )}
                    </TableCell>

                    <TableCell className="px-2 sm:px-6 py-2 sm:py-3.5 text-xs text-slate-400 hidden sm:table-cell">{r.time}</TableCell>
                    <TableCell className="px-2 sm:px-6 py-2 sm:py-3.5">
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => setViewRow(r)} className="text-xs font-semibold text-indigo-600 hover:underline cursor-pointer" title="View details">View</button>

                        {isAdmin && (
                          <button
                            onClick={() => setEditingRow(r)}
                            className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors cursor-pointer"
                            title="Edit registration"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {isAdmin && !useMock && r.status === "Pending" && (
                          <>
                            <button onClick={() => handleConfirm(r)} className="text-xs font-semibold text-emerald-600 hover:underline cursor-pointer">Confirm</button>
                            <button onClick={() => handleReject(r)} className="text-xs font-semibold text-rose-600 hover:underline cursor-pointer">Reject</button>
                          </>
                        )}

                        {isAdmin && !isCancelled && (
                          <button
                            onClick={() => setCancelConfirmRow(r)}
                            className="p-1 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-colors cursor-pointer"
                            title="Cancel registration"
                          >
                            <Ban className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {isAdmin && (
                          <button
                            onClick={() => setDeleteConfirmRow(r)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                            title="Permanently delete record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        <div className="px-3 sm:px-6 py-3 sm:py-4 border-t border-slate-50 flex items-center justify-between text-xs text-slate-400">
          <span>Showing {filtered.length} of {registrants.length} registrants</span>
          <div className="flex items-center gap-2">
            <Badge className="bg-emerald-50 text-emerald-700 text-[9px] gap-1 font-bold">
              <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" /> {checkedInCount} checked in
            </Badge>
          </div>
        </div>
      </div>

      {showPrintPasses && <PrintPassesDialog registrants={registrants} onClose={() => setShowPrintPasses(false)} />}
      {showAddDialog && (
        <AddRegistrantDialog
          useMock={useMock}
          events={events}
          selectedEventId={selectedEventId}
          onAdd={handleAddRegistrant}
          onClose={() => setShowAddDialog(false)}
        />
      )}
      {editingRow && (
        <EditRegistrantDialog
          row={editingRow}
          useMock={useMock}
          onSave={handleUpdateRegistrant}
          onClose={() => setEditingRow(null)}
        />
      )}
      {viewRow && (
        <ViewRegistrantDrawer
          row={viewRow}
          useMock={useMock}
          onClose={() => setViewRow(null)}
          onEdit={r => setEditingRow(r)}
          onCancel={r => setCancelConfirmRow(r)}
          onDelete={r => setDeleteConfirmRow(r)}
          onConfirm={handleConfirm}
          onReject={handleReject}
          onToggleCheckIn={handleToggleCheckIn}
        />
      )}

      {cancelConfirmRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl border border-slate-100 text-center">
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
              <Ban className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base">Cancel Event Registration?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to cancel the registration for <strong>{cancelConfirmRow.name}</strong> ({cancelConfirmRow.id})?
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCancelConfirmRow(null)}
                className="flex-1 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Keep Active
              </button>
              <button
                type="button"
                disabled={processingAction}
                onClick={handleConfirmCancelRegistration}
                className="flex-1 px-4 py-2 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-60 flex items-center justify-center gap-1.5"
              >
                {processingAction ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Ban className="w-3.5 h-3.5" />}
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirmRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl border border-slate-100 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base">Permanently Delete Record?</h3>
              <p className="text-xs text-slate-500 mt-1">
                This will permanently remove the registration record for <strong>{deleteConfirmRow.name}</strong> ({deleteConfirmRow.id}) from the database. This action cannot be undone.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmRow(null)}
                className="flex-1 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={processingAction}
                onClick={handleConfirmDeleteRegistration}
                className="flex-1 px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-60 flex items-center justify-center gap-1.5"
              >
                {processingAction ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
