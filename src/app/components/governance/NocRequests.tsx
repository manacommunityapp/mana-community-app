import { useState, useEffect, useCallback } from "react";
import {
  FileCheck, Plus, Clock, CheckCircle2, XCircle, RefreshCw, X
} from "lucide-react";
import { toast } from "react-toastify";
import {
  governanceService,
  type NocRequest,
  type NocType,
} from "../../../services/governance/governanceService";

const NOC_TYPES: { value: NocType; label: string }[] = [
  { value: "RENOVATION", label: "Renovation / Interior Work" },
  { value: "PET", label: "Pet Permission" },
  { value: "SUBLETTING", label: "Sub-letting / Tenant Registration" },
  { value: "PARKING", label: "Parking Allotment" },
  { value: "EVENT", label: "Private Event in Common Area" },
  { value: "STRUCTURAL_CHANGE", label: "Structural Change" },
  { value: "OTHER", label: "Other" },
];

const statusMeta: Record<string, { label: string; color: string }> = {
  PENDING:      { label: "Pending",      color: "bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800" },
  UNDER_REVIEW: { label: "Under Review", color: "bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800" },
  APPROVED:     { label: "Approved",     color: "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800" },
  REJECTED:     { label: "Rejected",     color: "bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800" },
};

export function NocRequests() {
  const [requests, setRequests] = useState<NocRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<{ nocType: NocType; description: string }>({
    nocType: "RENOVATION",
    description: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await governanceService.getMyNocRequests();
      setRequests(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = async () => {
    if (!form.description.trim()) { toast.error("Please describe the request."); return; }
    setSubmitting(true);
    try {
      await governanceService.submitNocRequest(form);
      toast.success("NOC request submitted.");
      setShowModal(false);
      setForm({ nocType: "RENOVATION", description: "" });
      load();
    } catch {
      toast.error("Failed to submit NOC request.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-indigo-600" /> My NOC Requests
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">No-objection certificates for renovations, pets, sub-letting and more.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="p-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer">
            <Plus className="w-3.5 h-3.5" /> New Request
          </button>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="text-center py-10"><RefreshCw className="w-6 h-6 text-indigo-400 mx-auto animate-spin" /></div>
      ) : requests.length === 0 ? (
        <div className="bg-white dark:bg-[#1E1E36] border border-slate-200 dark:border-slate-800 rounded-2xl p-10 text-center space-y-2">
          <FileCheck className="w-10 h-10 text-indigo-300 mx-auto" />
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No NOC requests yet</p>
          <p className="text-xs text-slate-400">Submit a request to get a no-objection certificate from your community.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => {
            const meta = statusMeta[req.status] ?? statusMeta.PENDING;
            return (
              <div key={req.id} className="bg-white dark:bg-[#1E1E36] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white">
                      {NOC_TYPES.find(t => t.value === req.nocType)?.label ?? req.nocType}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5 line-clamp-2">{req.description}</div>
                  </div>
                  <span className={`flex-shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-lg border ${meta.color}`}>
                    {meta.label}
                  </span>
                </div>
                {req.status === "APPROVED" && req.nocNumber && (
                  <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span className="text-xs font-bold text-emerald-800 dark:text-emerald-200">
                      NOC #{req.nocNumber}
                      {req.validUntil && ` · Valid until ${new Date(req.validUntil).toLocaleDateString("en-IN")}`}
                    </span>
                  </div>
                )}
                {req.status === "REJECTED" && req.rejectionReason && (
                  <div className="p-2.5 bg-rose-50 dark:bg-rose-950/30 rounded-xl border border-rose-200 dark:border-rose-800 flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                    <span className="text-xs text-rose-700 dark:text-rose-300">{req.rejectionReason}</span>
                  </div>
                )}
                <div className="text-[10px] text-slate-400">
                  Submitted {new Date(req.createdAt).toLocaleDateString("en-IN")}
                  {req.decidedAt && ` · Decided ${new Date(req.decidedAt).toLocaleDateString("en-IN")}`}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* New NOC Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-[#1E1E36] rounded-2xl border border-slate-200 dark:border-slate-700 p-6 w-full max-w-md space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900 dark:text-white">New NOC Request</h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Type of NOC</label>
                <select value={form.nocType}
                  onChange={e => setForm(f => ({ ...f, nocType: e.target.value as NocType }))}
                  className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#262644] text-slate-900 dark:text-white p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  {NOC_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Description</label>
                <textarea value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={4} placeholder="Describe what you need and why…"
                  className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#262644] text-slate-900 dark:text-white p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer">
                Cancel
              </button>
              <button onClick={handleSubmit} disabled={submitting}
                className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl transition-all cursor-pointer flex items-center gap-1.5">
                {submitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                Submit Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
