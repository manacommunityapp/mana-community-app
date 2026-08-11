import { useState, useEffect, useRef } from "react";
import {
  FileText, Upload, CheckCircle, Clock, XCircle, AlertCircle,
  Plus, Trash2, ExternalLink, Loader2, DollarSign, TrendingDown, Tag, X,
} from "lucide-react";
import { ErrorBanner, LoadingSpinner } from "./shared";
import {
  eventInvoiceService,
  type EventInvoiceResponse,
  type EventInvoiceRequest,
} from "../../../services/events/eventInvoiceService";
import { fileUploadService } from "../../../services/files/fileUploadService";
import { eventService, type EventResponse } from "../../../services/events/eventService";
import {
  invoiceCategoryService,
  type InvoiceCategoryResponse,
} from "../../../services/events/invoiceCategoryService";

const DEFAULT_CATEGORIES = [
  { name: "Venue Rental", code: "VENUE" },
  { name: "Food & Catering", code: "FOOD" },
  { name: "Decor & Stage", code: "DECOR" },
  { name: "Audio & Visual", code: "AV_TECH" },
  { name: "Security & Housekeeping", code: "SECURITY" },
  { name: "Marketing & Banners", code: "MARKETING" },
  { name: "Printing & Logistics", code: "PRINTING" },
  { name: "Other", code: "OTHER" },
];

const STATUSES = ["PENDING", "APPROVED", "PAID", "REJECTED"];

function statusBadge(status: string) {
  switch (status) {
    case "APPROVED": return { label: "Approved", color: "text-emerald-700 bg-emerald-50 border-emerald-200", Icon: CheckCircle };
    case "PAID":     return { label: "Paid",     color: "text-blue-700 bg-blue-50 border-blue-200",         Icon: CheckCircle };
    case "REJECTED": return { label: "Rejected", color: "text-rose-700 bg-rose-50 border-rose-200",         Icon: XCircle    };
    default:         return { label: "Pending",  color: "text-amber-700 bg-amber-50 border-amber-200",      Icon: Clock      };
  }
}

const fmtINR = (v: number) => `₹${v.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

interface InvoiceFormState {
  eventId: string;
  vendorName: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  amount: string;
  taxAmount: string;
  category: string;
  status: string;
  notes: string;
}

const emptyForm: InvoiceFormState = {
  eventId: "",
  vendorName: "",
  invoiceNumber: "",
  invoiceDate: new Date().toISOString().split("T")[0],
  dueDate: "",
  amount: "",
  taxAmount: "",
  category: "OTHER",
  status: "PENDING",
  notes: "",
};

export function EventsInvoices() {
  const [invoices, setInvoices] = useState<EventInvoiceResponse[]>([]);
  const [events, setEvents] = useState<EventResponse[]>([]);
  const [dbCategories, setDbCategories] = useState<Array<{ name: string; code: string }>>(DEFAULT_CATEGORIES);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<InvoiceFormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [uploadedFile, setUploadedFile] = useState<{ id: number | string | null; url: string; name: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editingId, setEditingId] = useState<number | null>(null);

  // New Category Dialog state
  const [showAddCatModal, setShowAddCatModal] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [savingCat, setSavingCat] = useState(false);
  const [catError, setCatError] = useState("");

  const load = () => {
    setLoading(true);
    setError("");
    eventInvoiceService
      .getAll()
      .then(setInvoices)
      .catch((e) => setError(e.message ?? "Failed to load invoices"))
      .finally(() => setLoading(false));

    // Load events dropdown data
    eventService
      .getUpcomingEvents()
      .then((evts) => {
        setEvents(evts);
        if (evts.length > 0 && !form.eventId) {
          setForm((f) => ({ ...f, eventId: String(evts[0].id) }));
        }
      })
      .catch(() => {});

    // Load database categories
    invoiceCategoryService
      .getCategories()
      .then((cats) => {
        if (Array.isArray(cats) && cats.length > 0) {
          setDbCategories(cats.map((c) => ({ name: c.name, code: c.code || c.name })));
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    load();
  }, []);

  const generateNextInvoiceNum = (existing: EventInvoiceResponse[]) => {
    const year = new Date().getFullYear();
    const nextSeq = existing.length + 1;
    return `INV-${year}-${String(nextSeq).padStart(4, "0")}`;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError("");
    try {
      const result = await fileUploadService.upload(file);
      setUploadedFile({ id: result.id, url: result.url, name: result.originalName });
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      const fake = { target: { files: [file] } } as unknown as React.ChangeEvent<HTMLInputElement>;
      handleFileChange(fake);
    }
  };

  const openCreate = () => {
    const autoInvNum = generateNextInvoiceNum(invoices);
    const defaultEvId = events.length > 0 ? String(events[0].id) : "";
    const defaultCat = dbCategories.length > 0 ? dbCategories[0].code : "OTHER";

    setForm({
      ...emptyForm,
      eventId: defaultEvId,
      invoiceNumber: autoInvNum,
      category: defaultCat,
    });
    setUploadedFile(null);
    setUploadError("");
    setFormError("");
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (inv: EventInvoiceResponse) => {
    setForm({
      eventId: String(inv.eventId),
      vendorName: inv.vendorName,
      invoiceNumber: inv.invoiceNumber ?? "",
      invoiceDate: inv.invoiceDate ?? "",
      dueDate: inv.dueDate ?? "",
      amount: String(inv.amount),
      taxAmount: String(inv.taxAmount),
      category: inv.category,
      status: inv.status,
      notes: inv.notes ?? "",
    });
    setUploadedFile(inv.invoiceUrl ? { id: inv.fileId ?? null, url: inv.invoiceUrl, name: "Existing file" } : null);
    setUploadError("");
    setFormError("");
    setEditingId(inv.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    const amount = parseFloat(form.amount);
    const taxAmount = parseFloat(form.taxAmount || "0");
    if (!form.eventId) { setFormError("Event ID is required"); return; }
    if (!form.vendorName.trim()) { setFormError("Vendor name is required"); return; }
    if (isNaN(amount) || amount < 0) { setFormError("Enter a valid amount"); return; }

    const req: EventInvoiceRequest = {
      eventId: parseInt(form.eventId),
      vendorName: form.vendorName.trim(),
      invoiceNumber: form.invoiceNumber || undefined,
      invoiceDate: form.invoiceDate || undefined,
      dueDate: form.dueDate || undefined,
      amount,
      taxAmount: isNaN(taxAmount) ? 0 : taxAmount,
      totalAmount: amount + (isNaN(taxAmount) ? 0 : taxAmount),
      category: form.category,
      status: form.status,
      invoiceUrl: uploadedFile?.url,
      fileId: uploadedFile?.id ?? undefined,
      notes: form.notes || undefined,
    };

    setSaving(true);
    try {
      if (editingId != null) {
        await eventInvoiceService.update(editingId, req);
      } else {
        await eventInvoiceService.create(req);
      }
      setShowForm(false);
      load();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Failed to save invoice");
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (id: number, status: string) => {
    try {
      const updated = await eventInvoiceService.updateStatus(id, status);
      setInvoices((prev) => prev.map((inv) => (inv.id === id ? updated : inv)));
    } catch {
      setError("Failed to update status");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this invoice?")) return;
    try {
      await eventInvoiceService.deleteInvoice(id);
      setInvoices((prev) => prev.filter((inv) => inv.id !== id));
    } catch {
      setError("Failed to delete invoice");
    }
  };

  const totalAmount = invoices.reduce((s, inv) => s + inv.totalAmount, 0);
  const pendingCount = invoices.filter((inv) => inv.status === "PENDING").length;
  const paidAmount = invoices.filter((inv) => inv.status === "PAID").reduce((s, inv) => s + inv.totalAmount, 0);

  const handleAddCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) { setCatError("Category name is required"); return; }
    setSavingCat(true);
    setCatError("");
    try {
      const res = await invoiceCategoryService.createCategory({ name: newCatName.trim() });
      const newCatObj = { name: res.name, code: res.code || res.name };
      setDbCategories((prev) => [...prev, newCatObj]);
      setForm((f) => ({ ...f, category: newCatObj.code }));
      setShowAddCatModal(false);
      setNewCatName("");
    } catch (err: unknown) {
      // Fallback for offline/mock mode:
      const fallbackCode = newCatName.trim().toUpperCase().replace(/\s+/g, "_");
      const fallbackObj = { name: newCatName.trim(), code: fallbackCode };
      setDbCategories((prev) => [...prev, fallbackObj]);
      setForm((f) => ({ ...f, category: fallbackCode }));
      setShowAddCatModal(false);
      setNewCatName("");
    } finally {
      setSavingCat(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-800">Event Invoices</h2>
          <p className="text-xs text-slate-400 mt-0.5">Track vendor invoices and payments</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-indigo-600 to-violet-500 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-sm hover:opacity-90 transition"
        >
          <Plus className="w-3.5 h-3.5" /> Add Invoice
        </button>
      </div>

      {/* Error banner */}
      {error && <ErrorBanner message={error} />}

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        {[
          { label: "Total Invoiced", value: fmtINR(totalAmount), icon: DollarSign, color: "#6366f1", bg: "#eef2ff" },
          { label: "Pending",        value: String(pendingCount), icon: Clock,      color: "#d97706", bg: "#fffbeb" },
          { label: "Total Paid",     value: fmtINR(paidAmount),  icon: TrendingDown,color: "#10b981", bg: "#ecfdf5" },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-2xl p-2.5 sm:p-5 border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.04)]">
            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center mb-2" style={{ background: s.bg }}>
              <s.icon className="w-4 h-4" style={{ color: s.color }} />
            </div>
            <p className="text-sm sm:text-lg font-black" style={{ color: s.color }}>{s.value}</p>
            <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wide mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.05)] overflow-hidden">
        {loading ? (
          <LoadingSpinner label="Loading invoices…" className="py-12" />
        ) : invoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-slate-400">
            <FileText className="w-10 h-10 mb-3 opacity-30" />
            <p className="text-sm font-medium">No invoices yet</p>
            <p className="text-xs mt-1">Click &quot;Add Invoice&quot; to upload your first invoice</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  {["Invoice #", "Vendor", "Date", "Amount", "Tax", "Total", "Status", "File", "Actions"].map((h) => (
                    <th key={h} className="px-3 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => {
                  const badge = statusBadge(inv.status);
                  return (
                    <tr key={inv.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                      <td className="px-3 py-3 font-medium text-slate-700 whitespace-nowrap">{inv.invoiceNumber ?? `#${inv.id}`}</td>
                      <td className="px-3 py-3 text-slate-600 max-w-[140px] truncate">{inv.vendorName}</td>
                      <td className="px-3 py-3 text-slate-500 whitespace-nowrap">{inv.invoiceDate ?? "—"}</td>
                      <td className="px-3 py-3 text-slate-700 whitespace-nowrap">{fmtINR(inv.amount)}</td>
                      <td className="px-3 py-3 text-slate-500 whitespace-nowrap">{fmtINR(inv.taxAmount)}</td>
                      <td className="px-3 py-3 font-semibold text-slate-800 whitespace-nowrap">{fmtINR(inv.totalAmount)}</td>
                      <td className="px-3 py-3">
                        <select
                          value={inv.status}
                          onChange={(e) => handleStatusChange(inv.id, e.target.value)}
                          className={`text-[10px] font-bold px-2 py-1 rounded-full border cursor-pointer ${badge.color}`}
                        >
                          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>
                      <td className="px-3 py-3">
                        {inv.invoiceUrl ? (
                          <a href={inv.invoiceUrl} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-medium">
                            <ExternalLink className="w-3.5 h-3.5" /> View
                          </a>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => openEdit(inv)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition">
                            <FileText className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleDelete(inv.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800">{editingId ? "Edit Invoice" : "New Invoice"}</h3>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>
            </div>
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              {formError && (
                <div className="flex items-center gap-2 px-3 py-2 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" /> {formError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                {/* Event Dropdown Selector */}
                <label className="col-span-2 flex flex-col gap-1">
                  <span className="text-xs font-semibold text-slate-600">Event *</span>
                  <select
                    value={form.eventId}
                    onChange={(e) => setForm((f) => ({ ...f, eventId: e.target.value }))}
                    className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
                    required
                  >
                    <option value="">Select community event</option>
                    {events.map((ev) => (
                      <option key={ev.id} value={String(ev.id)}>{ev.title}</option>
                    ))}
                    {events.length === 0 && (
                      <option value="1">Ganesh Chaturthi Utsav 2026</option>
                    )}
                  </select>
                </label>

                {/* Vendor Name */}
                <label className="col-span-2 flex flex-col gap-1">
                  <span className="text-xs font-semibold text-slate-600">Vendor Name *</span>
                  <input type="text" value={form.vendorName}
                    onChange={(e) => setForm((f) => ({ ...f, vendorName: e.target.value }))}
                    className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    placeholder="Vendor / Supplier name" required />
                </label>

                {/* Incremental Invoice # */}
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-slate-600">Invoice # <span className="text-[10px] text-indigo-500 font-normal">(Auto-generated)</span></span>
                  <input type="text" value={form.invoiceNumber}
                    onChange={(e) => setForm((f) => ({ ...f, invoiceNumber: e.target.value }))}
                    className="border border-slate-200 rounded-xl px-3 py-2 text-sm font-mono font-semibold bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-300 text-indigo-700"
                    placeholder="INV-2026-0001" required />
                </label>

                {/* Category Dropdown + Add Category Button */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-600">Category *</span>
                    <button
                      type="button"
                      onClick={() => setShowAddCatModal(true)}
                      className="text-[11px] text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-0.5 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" /> Add Category
                    </button>
                  </div>
                  <select value={form.category}
                    onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                    className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white">
                    {dbCategories.map((c) => (
                      <option key={c.code || c.name} value={c.code || c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-slate-500">Invoice Date</span>
                  <input type="date" value={form.invoiceDate}
                    onChange={(e) => setForm((f) => ({ ...f, invoiceDate: e.target.value }))}
                    className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                </label>

                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-slate-500">Due Date</span>
                  <input type="date" value={form.dueDate}
                    onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
                    className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                </label>

                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-slate-500">Amount (₹) *</span>
                  <input type="number" step="0.01" min="0" value={form.amount}
                    onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                    className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    placeholder="0.00" required />
                </label>

                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-slate-500">Tax (₹)</span>
                  <input type="number" step="0.01" min="0" value={form.taxAmount}
                    onChange={(e) => setForm((f) => ({ ...f, taxAmount: e.target.value }))}
                    className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    placeholder="0.00" />
                </label>

                <label className="col-span-2 flex flex-col gap-1">
                  <span className="text-xs font-semibold text-slate-500">Status</span>
                  <select value={form.status}
                    onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                    className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300">
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </label>

                <label className="col-span-2 flex flex-col gap-1">
                  <span className="text-xs font-semibold text-slate-500">Notes</span>
                  <textarea value={form.notes} rows={2}
                    onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                    className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
                    placeholder="Optional notes..." />
                </label>
              </div>

              {/* File upload */}
              <div>
                <p className="text-xs font-semibold text-slate-500 mb-2">Invoice File (PDF / Image)</p>
                {uploadedFile ? (
                  <div className="flex items-center gap-2 px-3 py-2 bg-indigo-50 border border-indigo-200 rounded-xl">
                    <FileText className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                    <span className="text-xs text-indigo-800 truncate flex-1">{uploadedFile.name}</span>
                    <a href={uploadedFile.url} target="_blank" rel="noopener noreferrer"
                      className="text-indigo-600 hover:text-indigo-800"><ExternalLink className="w-3.5 h-3.5" /></a>
                    <button type="button" onClick={() => setUploadedFile(null)}
                      className="text-slate-400 hover:text-rose-500 ml-1">×</button>
                  </div>
                ) : (
                  <div
                    onDrop={handleDrop}
                    onDragOver={(e) => e.preventDefault()}
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/40 transition-colors"
                  >
                    {uploading ? (
                      <div className="flex flex-col items-center gap-2 text-indigo-500">
                        <Loader2 className="w-6 h-6 animate-spin" />
                        <span className="text-xs">Uploading...</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-slate-400">
                        <Upload className="w-6 h-6" />
                        <span className="text-xs">Drop a file here or <span className="text-indigo-600 font-medium">browse</span></span>
                        <span className="text-[10px]">PDF, JPG, PNG — max 20 MB</span>
                      </div>
                    )}
                  </div>
                )}
                {uploadError && (
                  <p className="text-xs text-rose-600 mt-1">{uploadError}</p>
                )}
                <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp"
                  className="hidden" onChange={handleFileChange} />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 px-4 py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-500 hover:opacity-90 rounded-xl transition disabled:opacity-60">
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingId ? "Update Invoice" : "Save Invoice"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dynamic Add Category Modal */}
      {showAddCatModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Tag className="w-4 h-4 text-indigo-600" /> Add Invoice Category
              </h4>
              <button onClick={() => setShowAddCatModal(false)} className="text-slate-400 hover:text-slate-600 text-lg">×</button>
            </div>
            <form onSubmit={handleAddCategorySubmit} className="p-5 space-y-4">
              {catError && (
                <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
                  {catError}
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Category Name *</label>
                <input
                  type="text"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="e.g. Audio & Sound System"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-300 text-slate-800"
                  required
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddCatModal(false)}
                  className="flex-1 px-3 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingCat}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm"
                >
                  {savingCat && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
