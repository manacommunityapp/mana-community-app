import { useState, useEffect, useRef } from "react";
import { IndianRupee, Package, Plus, Download, Loader2, AlertCircle, FileText, Mail, HandHeart, Pencil, Trash2, X, Upload, CheckCircle2 } from "lucide-react";
import { useEventMock } from "./EventMockToggle";
import { eventDonationService, type EventDonationResponse } from "../../../services/events/eventDonationService";
import { eventService, type EventResponse } from "../../../services/events/eventService";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Button } from "../ui/button";
import { SponsorshipProspectusModal, SponsorshipAppealEmailModal } from "./EventsSponsors";

const donationTypes = [
  { label: "Cash",              value: "₹2,40,000", icon: IndianRupee, color: "#10b981", bg: "#ecfdf5" },
  { label: "UPI / Online",      value: "₹1,85,000", icon: IndianRupee, color: "#6366f1", bg: "#eef2ff" },
  { label: "Cheque",            value: "₹80,000",   icon: IndianRupee, color: "#0891b2", bg: "#ecfeff" },
  { label: "Material Donations",value: "₹1,15,000", icon: Package,     color: "#d97706", bg: "#fffbeb" },
];

const mockDonations: DonationRow[] = [
  { rawId: 1, id: "DON-001", donor: "Krishnamurthy S.", type: "Cash",       item: "₹25,000",         amount: 25000,  receipt: "RCP-001", date: "Aug 2",  email: "krishna@email.com", phone: "+91 98765 12345", flatNumber: "A-101", note: "", recordedBy: "", anonymous: false },
  { rawId: 2, id: "DON-002", donor: "Lakshmi Devi",     type: "Gold",       item: "50g Gold coin",   amount: 0,      receipt: "RCP-002", date: "Aug 2",  email: "", phone: "", flatNumber: "B-202", note: "Gold coin for puja", recordedBy: "", anonymous: false },
  { rawId: 3, id: "DON-003", donor: "Raghunath Rao",    type: "UPI",        item: "₹10,000",         amount: 10000,  receipt: "RCP-003", date: "Aug 1",  email: "", phone: "", flatNumber: "C-301", note: "", recordedBy: "", anonymous: false },
  { rawId: 4, id: "DON-004", donor: "Subhash Reddy",    type: "Rice",       item: "100 kg Basmati",  amount: 0,      receipt: "RCP-004", date: "Aug 1",  email: "", phone: "", flatNumber: "D-401", note: "Basmati rice for prasadam", recordedBy: "", anonymous: false },
  { rawId: 5, id: "DON-005", donor: "Venkatesha M.",    type: "Cash",       item: "₹50,000",         amount: 50000,  receipt: "RCP-005", date: "Jul 31", email: "", phone: "", flatNumber: "E-501", note: "", recordedBy: "", anonymous: false },
  { rawId: 6, id: "DON-006", donor: "Annapurna S.",     type: "Milk",       item: "500 litres",      amount: 0,      receipt: "RCP-006", date: "Jul 30", email: "", phone: "", flatNumber: "F-601", note: "", recordedBy: "", anonymous: false },
  { rawId: 7, id: "DON-007", donor: "Tirumala Trust",   type: "Cheque",     item: "₹1,00,000",       amount: 100000, receipt: "RCP-007", date: "Jul 28", email: "trust@tirumala.org", phone: "", flatNumber: "", note: "", recordedBy: "", anonymous: false },
  { rawId: 8, id: "DON-008", donor: "Chandran Pillai",  type: "Vegetables", item: "Mixed vegetables 50kg", amount: 0, receipt: "RCP-008", date: "Jul 27", email: "", phone: "", flatNumber: "G-701", note: "", recordedBy: "", anonymous: false },
];

type DonationRow = { rawId: number; id: string; donor: string; type: string; item: string; amount: number; receipt: string; date: string; email: string; phone: string; flatNumber: string; note: string; recordedBy: string; anonymous: boolean };

const typeColors: Record<string, { bg: string; text: string }> = {
  Cash:          { bg: "bg-emerald-50", text: "text-emerald-700" },
  CASH:          { bg: "bg-emerald-50", text: "text-emerald-700" },
  UPI:           { bg: "bg-indigo-50",  text: "text-indigo-700"  },
  ONLINE:        { bg: "bg-indigo-50",  text: "text-indigo-700"  },
  Cheque:        { bg: "bg-cyan-50",    text: "text-cyan-700"    },
  CHEQUE:        { bg: "bg-cyan-50",    text: "text-cyan-700"    },
  BANK_TRANSFER: { bg: "bg-sky-50",     text: "text-sky-700"     },
  Gold:          { bg: "bg-amber-50",   text: "text-amber-700"   },
  Rice:          { bg: "bg-indigo-50",  text: "text-indigo-700"  },
  Milk:          { bg: "bg-sky-50",     text: "text-sky-700"     },
  Vegetables:    { bg: "bg-lime-50",    text: "text-lime-700"    },
};

function mapLiveDonations(data: EventDonationResponse[]): DonationRow[] {
  return data.map(d => ({
    rawId: d.id,
    id: `DON-${String(d.id).padStart(3, "0")}`,
    donor: d.anonymous ? "Anonymous" : d.donorName,
    type: d.paymentMethod,
    item: `₹${d.amount.toLocaleString("en-IN")}`,
    amount: d.amount,
    receipt: d.transactionRef ?? "—",
    date: new Date(d.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric" }),
    email: d.donorEmail ?? "",
    phone: d.donorPhone ?? "",
    flatNumber: d.flatNumber ?? "",
    note: d.note ?? "",
    recordedBy: d.recordedByName ?? "",
    anonymous: d.anonymous,
  }));
}

const emptyDonationForm = { eventId: "", donorName: "", donorEmail: "", donorPhone: "", flatNumber: "", amount: "", paymentMethod: "CASH", transactionRef: "", note: "", anonymous: false };

type BulkUploadResult = { total: number; saved: number; failed: number; blob: Blob } | null;

function DonationBulkUploadModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);
  const [result, setResult] = useState<BulkUploadResult>(null);
  const [error, setError] = useState("");

  const handleTemplateDownload = async () => {
    setDownloadingTemplate(true);
    try {
      await eventDonationService.downloadTemplate();
    } catch (e: any) {
      setError(e?.message || "Failed to download template");
    } finally {
      setDownloadingTemplate(false);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    setError("");
    setResult(null);
    try {
      const res = await eventDonationService.bulkUpload(selectedFile);
      setResult(res);
      if (res.saved > 0) onSaved();
    } catch (e: any) {
      setError(e?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadResult = () => {
    if (!result) return;
    const url = URL.createObjectURL(result.blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "donation_upload_result.xlsx";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <Upload className="w-4 h-4 text-indigo-600" /> Bulk Upload Donations
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Step 1: Template */}
          <div className="flex items-start gap-3 p-4 rounded-xl bg-indigo-50 border border-indigo-100">
            <div className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">1</div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-700">Download Template</p>
              <p className="text-xs text-slate-500 mt-0.5 mb-2">Fill in donor details using the Excel template</p>
              <button
                onClick={handleTemplateDownload}
                disabled={downloadingTemplate}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {downloadingTemplate ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                Download Template
              </button>
            </div>
          </div>

          {/* Step 2: Upload */}
          <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="w-6 h-6 rounded-full bg-slate-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">2</div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-700">Upload Filled Excel</p>
              <p className="text-xs text-slate-500 mt-0.5 mb-2">Only .xlsx files are supported</p>
              <div
                className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/40 transition-colors"
                onClick={() => fileRef.current?.click()}
              >
                <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                <p className="text-xs text-slate-500">
                  {selectedFile ? selectedFile.name : "Click to select .xlsx file"}
                </p>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                className="hidden"
                onChange={e => { setSelectedFile(e.target.files?.[0] ?? null); setResult(null); setError(""); }}
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 px-3 py-2 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
            </div>
          )}

          {result && (
            <div className={`rounded-xl border p-4 ${result.failed === 0 ? "bg-emerald-50 border-emerald-200" : "bg-amber-50 border-amber-200"}`}>
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className={`w-4 h-4 ${result.failed === 0 ? "text-emerald-600" : "text-amber-600"}`} />
                <span className="text-sm font-bold text-slate-700">Upload Complete</span>
              </div>
              <div className="flex gap-4 text-xs text-slate-600 mb-3">
                <span><span className="font-semibold text-emerald-700">{result.saved}</span> saved</span>
                <span><span className="font-semibold text-rose-600">{result.failed}</span> failed</span>
                <span><span className="font-semibold">{result.total}</span> total rows</span>
              </div>
              {result.failed > 0 && (
                <button
                  onClick={handleDownloadResult}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 text-white hover:bg-rose-700 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" /> Download Error Report
                </button>
              )}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors">
            Close
          </button>
          <button
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
            className="px-4 py-2 rounded-xl text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            {uploading && <Loader2 className="w-4 h-4 animate-spin" />}
            Upload & Process
          </button>
        </div>
      </div>
    </div>
  );
}

export function EventsDonations() {
  const { useMock } = useEventMock();
  const [liveDonations, setLiveDonations] = useState<DonationRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [events, setEvents] = useState<EventResponse[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [donationForm, setDonationForm] = useState(emptyDonationForm);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingDonationId, setEditingDonationId] = useState<number | null>(null);
  const [showBulkUpload, setShowBulkUpload] = useState(false);

  // Modal states
  const [prospectusOpen, setProspectusOpen] = useState(false);
  const [emailAppealOpen, setEmailAppealOpen] = useState(false);

  useEffect(() => {
    eventService.getAllEvents().then(setEvents).catch(() => {});
  }, []);

  const loadDonations = () => {
    if (useMock) return;
    setLoading(true);
    setError("");
    eventDonationService.getAll()
      .then(data => setLiveDonations(mapLiveDonations(data)))
      .catch(e => setError(e.message ?? "Failed to load donations"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadDonations();
  }, [useMock]);

  const handleAddDonation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!donationForm.donorName.trim() && !donationForm.anonymous) { setFormError("Donor name is required unless anonymous"); return; }
    if (!donationForm.donorPhone.trim()) { setFormError("Phone number is required"); return; }
    if (!donationForm.flatNumber.trim()) { setFormError("Flat number is required"); return; }
    if (!donationForm.amount || Number(donationForm.amount) <= 0) { setFormError("Amount must be greater than 0"); return; }
    if (useMock) {
      const newRow: DonationRow = {
        rawId: Date.now(),
        id: `DON-${String(Date.now()).slice(-3)}`,
        donor: donationForm.anonymous ? "Anonymous" : donationForm.donorName,
        type: donationForm.paymentMethod || "Cash",
        item: `₹${Number(donationForm.amount).toLocaleString("en-IN")}`,
        amount: Number(donationForm.amount),
        receipt: donationForm.transactionRef || "—",
        date: new Date().toLocaleDateString("en-IN", { month: "short", day: "numeric" }),
        email: donationForm.donorEmail,
        phone: donationForm.donorPhone,
        flatNumber: donationForm.flatNumber,
        note: donationForm.note,
        recordedBy: "",
        anonymous: donationForm.anonymous,
      };
      setLiveDonations(prev => [newRow, ...prev]);
      setShowAddForm(false);
      setDonationForm(emptyDonationForm);
      return;
    }
    if (!donationForm.eventId) { setFormError("Please select an event"); return; }
    setSaving(true);
    setFormError("");
    try {
      const resp = await eventDonationService.create({
        eventId: Number(donationForm.eventId),
        donorName: donationForm.anonymous ? "Anonymous" : donationForm.donorName,
        donorEmail: donationForm.donorEmail || undefined,
        donorPhone: donationForm.donorPhone || undefined,
        flatNumber: donationForm.flatNumber || undefined,
        amount: Number(donationForm.amount),
        paymentMethod: donationForm.paymentMethod || undefined,
        transactionRef: donationForm.transactionRef || undefined,
        note: donationForm.note || undefined,
        anonymous: donationForm.anonymous,
      });
      setLiveDonations(prev => [mapLiveDonations([resp])[0], ...prev]);
      setShowAddForm(false);
      setDonationForm(emptyDonationForm);
    } catch (err: any) {
      setFormError(err?.message || "Failed to record donation");
    } finally {
      setSaving(false);
    }
  };

  const openEditDonation = (d: DonationRow) => {
    setEditingDonationId(d.rawId);
    setDonationForm({
      eventId: "",
      donorName: d.anonymous ? "" : d.donor,
      donorEmail: d.email,
      donorPhone: d.phone,
      flatNumber: d.flatNumber,
      amount: String(d.amount),
      paymentMethod: d.type,
      transactionRef: d.receipt === "—" ? "" : d.receipt,
      note: d.note,
      anonymous: d.anonymous,
    });
    setFormError("");
    setShowAddForm(true);
  };

  const handleEditDonation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!donationForm.donorName.trim() && !donationForm.anonymous) { setFormError("Donor name is required unless anonymous"); return; }
    if (!donationForm.donorPhone.trim()) { setFormError("Phone number is required"); return; }
    if (!donationForm.flatNumber.trim()) { setFormError("Flat number is required"); return; }
    if (!donationForm.amount || Number(donationForm.amount) <= 0) { setFormError("Amount must be greater than 0"); return; }
    if (useMock) {
      setLiveDonations(prev => prev.map(d => d.rawId === editingDonationId ? {
        ...d,
        donor: donationForm.anonymous ? "Anonymous" : donationForm.donorName,
        type: donationForm.paymentMethod,
        item: `₹${Number(donationForm.amount).toLocaleString("en-IN")}`,
        amount: Number(donationForm.amount),
        email: donationForm.donorEmail,
        phone: donationForm.donorPhone,
        flatNumber: donationForm.flatNumber,
        note: donationForm.note,
        anonymous: donationForm.anonymous,
        receipt: donationForm.transactionRef || "—",
      } : d));
      setShowAddForm(false);
      setEditingDonationId(null);
      setDonationForm(emptyDonationForm);
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      const resp = await eventDonationService.update(editingDonationId!, {
        donorName: donationForm.anonymous ? "Anonymous" : donationForm.donorName,
        donorEmail: donationForm.donorEmail || undefined,
        donorPhone: donationForm.donorPhone || undefined,
        flatNumber: donationForm.flatNumber || undefined,
        amount: Number(donationForm.amount),
        paymentMethod: donationForm.paymentMethod || undefined,
        transactionRef: donationForm.transactionRef || undefined,
        note: donationForm.note || undefined,
        anonymous: donationForm.anonymous,
      });
      setLiveDonations(prev => prev.map(d => d.rawId === editingDonationId ? mapLiveDonations([resp])[0] : d));
      setShowAddForm(false);
      setEditingDonationId(null);
      setDonationForm(emptyDonationForm);
    } catch (err: any) {
      setFormError(err?.message || "Failed to update donation");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteDonation = async (d: DonationRow) => {
    if (!confirm(`Delete donation ${d.id} from ${d.donor}?`)) return;
    if (useMock) {
      setLiveDonations(prev => prev.filter(x => x.rawId !== d.rawId));
      return;
    }
    try {
      await eventDonationService.deleteDonation(d.rawId);
      setLiveDonations(prev => prev.filter(x => x.rawId !== d.rawId));
    } catch (err: any) {
      setError(err?.message || "Failed to delete donation");
    }
  };

  const donations = useMock ? mockDonations : liveDonations;
  const totalAmount = useMock ? 620000 : liveDonations.reduce((a, d) => a + parseInt(d.item.replace(/[^\d]/g, "") || "0"), 0);

  return (
    <div className="space-y-3 sm:space-y-6">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <HandHeart className="w-5 h-5 text-emerald-600" /> Event Donations & Seva Schemes
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Manage community donations, meal sponsorships, and broadcast appeals to members</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            size="sm"
            onClick={() => setProspectusOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 text-xs font-bold rounded-xl"
          >
            <FileText className="w-3.5 h-3.5" /> Generate Donation Prospectus
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setEmailAppealOpen(true)}
            className="border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100 text-emerald-700 gap-1.5 text-xs font-bold rounded-xl"
          >
            <Mail className="w-3.5 h-3.5 text-emerald-600" /> Send Donation Appeal
          </Button>
        </div>
      </div>
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-8 text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading donations...
        </div>
      )}

      {/* Type summary — mock only for breakdown */}
      {useMock && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
          {donationTypes.map((d) => (
            <div key={d.label} className="bg-white rounded-2xl p-2.5 sm:p-5 border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.04)]">
              <div className="w-6 h-6 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center mb-2 sm:mb-3" style={{ background: d.bg }}>
                <d.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" style={{ color: d.color }} />
              </div>
              <p className="text-base sm:text-xl font-black" style={{ color: d.color }}>{d.value}</p>
              <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wide mt-0.5 sm:mt-1">{d.label}</p>
            </div>
          ))}
        </div>
      )}

      {!useMock && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.04)] text-center">
            <p className="text-2xl font-black text-indigo-600">{donations.length}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mt-1">Total Donations</p>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.04)] text-center">
            <p className="text-2xl font-black text-emerald-600">₹{totalAmount.toLocaleString("en-IN")}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mt-1">Total Amount</p>
          </div>
        </div>
      )}

      {/* Donation progress towards goal */}
      {useMock && (
        <div className="bg-white rounded-2xl p-3 sm:p-6 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-slate-800">Total Donations vs Target</h2>
            <div>
              <span className="text-lg font-black text-rose-600">₹6.2L</span>
              <span className="text-slate-400 text-sm"> / ₹8L goal</span>
            </div>
          </div>
          <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="animate-fade-in-up h-full rounded-full bg-gradient-to-r from-rose-500 to-pink-400"
              style={{ width: "77.5%" }}
            />
          </div>
          <p className="text-xs text-slate-400 mt-2">77.5% of target achieved · ₹1.8L remaining</p>
        </div>
      )}

      {/* Donation list */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.05)] overflow-hidden">
        <div className="flex items-center justify-between px-3 sm:px-6 pt-3 sm:pt-5 pb-2 sm:pb-4 border-b border-slate-50 flex-wrap gap-2">
          <h2 className="font-bold text-slate-800 text-sm sm:text-base">Donation Ledger</h2>
          <div className="flex gap-1.5 sm:gap-2">
            <button className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl text-[10px] sm:text-xs font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all">
              <Download className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> <span className="hidden sm:inline">Export</span>
            </button>
            {!useMock && (
              <button
                onClick={() => setShowBulkUpload(true)}
                className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl text-[10px] sm:text-xs font-semibold bg-emerald-500 text-white hover:bg-emerald-600 transition-all shadow-sm">
                <Upload className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> <span className="hidden sm:inline">Bulk Upload</span><span className="sm:hidden">Bulk</span>
              </button>
            )}
            <button
              onClick={() => { setDonationForm(emptyDonationForm); setFormError(""); setShowAddForm(true); }}
              className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl text-[10px] sm:text-xs font-semibold bg-indigo-500 text-white hover:bg-indigo-600 transition-all shadow-sm">
              <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> <span className="hidden sm:inline">Record</span><span className="sm:hidden">Add</span>
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
        <Table className="text-sm">
          <TableHeader>
            <TableRow className="bg-slate-50/80 border-b border-slate-100 hover:bg-slate-50/80">
              {["ID", "Donor Name", "Type", "Item / Amount", "Receipt", "Date", "Note", "Recorded By", "Actions"].map(h => (
                <TableHead key={h} className={`px-3 sm:px-6 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap h-auto ${
                  (h === "ID" || h === "Receipt" || h === "Date" || h === "Note" || h === "Recorded By") ? "hidden lg:table-cell" : ""
                }`}>{h}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-slate-50">
            {donations.map((d) => {
              const tc = typeColors[d.type] || { bg: "bg-slate-50", text: "text-slate-600" };
              return (
                <TableRow key={d.id} className="animate-fade-in-up hover:bg-slate-50/60 transition-colors">
                  <TableCell className="px-2 sm:px-6 py-2 sm:py-3.5 font-mono text-xs text-slate-400 hidden sm:table-cell">{d.id}</TableCell>
                  <TableCell className="px-2 sm:px-6 py-2 sm:py-3.5">
                    <p className="font-semibold text-slate-800 text-xs sm:text-sm">{d.donor}</p>
                    {(d.email || d.phone) && (
                      <p className="text-[10px] text-slate-400 mt-0.5 hidden sm:block">
                        {[d.email, d.phone].filter(Boolean).join(" · ")}
                      </p>
                    )}
                  </TableCell>
                  <TableCell className="px-2 sm:px-6 py-2 sm:py-3.5">
                    <span className={`px-2 sm:px-2.5 py-1 rounded-full text-[10px] font-bold ${tc.bg} ${tc.text}`}>{d.type}</span>
                  </TableCell>
                  <TableCell className="px-2 sm:px-6 py-2 sm:py-3.5 font-semibold text-slate-700 text-xs sm:text-sm">{d.item}</TableCell>
                  <TableCell className="px-2 sm:px-6 py-2 sm:py-3.5 font-mono text-xs text-indigo-600 hidden sm:table-cell">{d.receipt}</TableCell>
                  <TableCell className="px-2 sm:px-6 py-2 sm:py-3.5 text-xs text-slate-400 hidden lg:table-cell">{d.date}</TableCell>
                  <TableCell className="px-2 sm:px-6 py-2 sm:py-3.5 text-xs text-slate-500 hidden lg:table-cell max-w-[150px] truncate">{d.note || "—"}</TableCell>
                  <TableCell className="px-2 sm:px-6 py-2 sm:py-3.5 text-xs text-slate-400 hidden lg:table-cell">{d.recordedBy || "—"}</TableCell>
                  <TableCell className="px-2 sm:px-6 py-2 sm:py-3.5">
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => openEditDonation(d)}
                        className="p-1.5 rounded-lg hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 transition-colors" title="Edit">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDeleteDonation(d)}
                        className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors" title="Delete">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <button className="text-xs font-semibold text-indigo-600 hover:underline hidden sm:inline">Receipt</button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        </div>
      </div>

      {/* Add Donation Modal */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800">{editingDonationId ? "Edit Donation" : "Record Donation"}</h3>
              <button
                type="button"
                onClick={() => { setShowAddForm(false); setEditingDonationId(null); setDonationForm(emptyDonationForm); }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={editingDonationId ? handleEditDonation : handleAddDonation} className="px-6 py-5 space-y-4">
              {formError && (
                <div className="flex items-center gap-2 px-3 py-2 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" /> {formError}
                </div>
              )}
              {!useMock && (
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-slate-600">Event *</span>
                  <select value={donationForm.eventId} onChange={e => setDonationForm(f => ({ ...f, eventId: e.target.value }))}
                    className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white" required>
                    <option value="">Select event</option>
                    {events.map(ev => <option key={ev.id} value={String(ev.id)}>{ev.title}</option>)}
                  </select>
                </label>
              )}
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                  <input type="checkbox" checked={donationForm.anonymous}
                    onChange={e => setDonationForm(f => ({ ...f, anonymous: e.target.checked }))}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-300" />
                  Anonymous donation
                </label>
              </div>
              {!donationForm.anonymous && (
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-slate-600">Donor Name *</span>
                  <input type="text" value={donationForm.donorName} onChange={e => setDonationForm(f => ({ ...f, donorName: e.target.value }))}
                    className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    placeholder="Full name of donor" required={!donationForm.anonymous} />
                </label>
              )}
              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-slate-600">Amount (₹) *</span>
                  <input type="number" value={donationForm.amount} onChange={e => setDonationForm(f => ({ ...f, amount: e.target.value }))}
                    className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    placeholder="0" min="1" required />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-slate-600">Payment Method</span>
                  <select value={donationForm.paymentMethod} onChange={e => setDonationForm(f => ({ ...f, paymentMethod: e.target.value }))}
                    className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white">
                    <option value="CASH">Cash</option>
                    <option value="UPI">UPI / Online</option>
                    <option value="CHEQUE">Cheque</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                    <option value="OTHER">Other</option>
                  </select>
                </label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-slate-600">Email</span>
                  <input type="email" value={donationForm.donorEmail} onChange={e => setDonationForm(f => ({ ...f, donorEmail: e.target.value }))}
                    className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    placeholder="donor@email.com" />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-slate-600">Phone Number *</span>
                  <input type="tel" value={donationForm.donorPhone} onChange={e => setDonationForm(f => ({ ...f, donorPhone: e.target.value }))}
                    className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    placeholder="+91 ..." required />
                </label>
              </div>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-slate-600">Flat Number *</span>
                <input type="text" value={donationForm.flatNumber} onChange={e => setDonationForm(f => ({ ...f, flatNumber: e.target.value }))}
                  className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  placeholder="e.g. A-101" required />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-slate-600">Transaction Reference</span>
                <input type="text" value={donationForm.transactionRef} onChange={e => setDonationForm(f => ({ ...f, transactionRef: e.target.value }))}
                  className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  placeholder="UPI ref / cheque no." />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-slate-600">Note</span>
                <textarea value={donationForm.note} onChange={e => setDonationForm(f => ({ ...f, note: e.target.value }))}
                  className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" rows={2}
                  placeholder="Optional note" />
              </label>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => { setShowAddForm(false); setEditingDonationId(null); setDonationForm(emptyDonationForm); }}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors">Cancel</button>
                <button type="submit" disabled={saving}
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center gap-2">
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />} {editingDonationId ? "Update Donation" : "Record Donation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Upload Modal */}
      {showBulkUpload && (
        <DonationBulkUploadModal
          onClose={() => setShowBulkUpload(false)}
          onSaved={loadDonations}
        />
      )}

      {/* Prospectus Modal */}
      <SponsorshipProspectusModal
        isOpen={prospectusOpen}
        onClose={() => setProspectusOpen(false)}
        onOpenEmailModal={() => setEmailAppealOpen(true)}
      />

      {/* Email Appeal Modal */}
      <SponsorshipAppealEmailModal
        isOpen={emailAppealOpen}
        onClose={() => setEmailAppealOpen(false)}
        eventId={events.length > 0 ? events[0].id : null}
      />
    </div>
  );
}
