import { useEffect, useState } from "react";
import {
  commerceReturnService,
  ReturnDto,
  ReturnRequest,
} from "../../../../services/commerce/commerceReturnService";

const STATUS_COLORS: Record<string, string> = {
  REQUESTED: "bg-blue-100 text-blue-700",
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-600",
  ITEM_RECEIVED: "bg-yellow-100 text-yellow-700",
  REFUNDED: "bg-purple-100 text-purple-700",
  EXCHANGED: "bg-indigo-100 text-indigo-700",
};

const RESOLVE_STATUSES = ["APPROVED", "REJECTED", "ITEM_RECEIVED", "REFUNDED", "EXCHANGED"];
const REASONS = ["Defective product", "Wrong item delivered", "Item not as described", "Changed my mind", "Damaged packaging", "Other"];

export default function ReturnExchangeManagement() {
  const [returns, setReturns] = useState<ReturnDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [filterStatus, setFilterStatus] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState<ReturnRequest>({ orderNumber: "", returnType: "RETURN", reason: "" });
  const [saving, setSaving] = useState(false);

  const [resolveTarget, setResolveTarget] = useState<ReturnDto | null>(null);
  const [resolveStatus, setResolveStatus] = useState("APPROVED");
  const [resolveNote, setResolveNote] = useState("");
  const [resolving, setResolving] = useState(false);

  const loadAdmin = () => {
    setLoading(true);
    commerceReturnService.getAdminReturns(filterStatus || undefined)
      .then(setReturns).catch(() => setError("Failed to load")).finally(() => setLoading(false));
  };
  const loadMy = () => {
    setLoading(true);
    commerceReturnService.getMyReturns()
      .then(setReturns).catch(() => setError("Failed to load")).finally(() => setLoading(false));
  };

  useEffect(() => { isAdmin ? loadAdmin() : loadMy(); }, [isAdmin, filterStatus]);

  const handleCreate = async () => {
    if (!form.orderNumber.trim() || !form.reason) return;
    setSaving(true);
    try {
      await commerceReturnService.createReturn(form);
      setCreateOpen(false);
      setForm({ orderNumber: "", returnType: "RETURN", reason: "" });
      loadMy();
    } catch { setError("Failed to create return"); } finally { setSaving(false); }
  };

  const handleResolve = async () => {
    if (!resolveTarget) return;
    setResolving(true);
    try {
      await commerceReturnService.resolveReturn(resolveTarget.returnCode, resolveStatus, resolveNote);
      setResolveTarget(null);
      loadAdmin();
    } catch { setError("Failed to resolve"); } finally { setResolving(false); }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Returns & Exchanges</h1>
          <p className="text-sm text-gray-500 mt-1">Manage return and exchange requests.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setIsAdmin(!isAdmin)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border ${isAdmin ? "bg-indigo-600 text-white border-indigo-600" : "border-gray-300 text-gray-600"}`}>
            {isAdmin ? "Admin View" : "My Returns"}
          </button>
          {!isAdmin && (
            <button onClick={() => setCreateOpen(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium">
              + New Request
            </button>
          )}
        </div>
      </div>

      {isAdmin && (
        <div className="flex gap-2 flex-wrap">
          {["", ...RESOLVE_STATUSES, "REQUESTED"].map((s) => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`px-3 py-1 rounded-full text-xs font-medium border ${filterStatus === s ? "bg-indigo-600 text-white border-indigo-600" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
              {s || "All"}
            </button>
          ))}
        </div>
      )}

      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm flex justify-between">
        {error}<button onClick={() => setError(null)}>✕</button></div>}

      {loading ? (
        <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : returns.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-5xl mb-4">↩️</p>
          <p className="text-lg font-medium">No return requests</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>{["Code", "Order", "Customer", "Type", "Reason", "Status", ""].map(h =>
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {returns.map(r => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-600">{r.returnCode}</td>
                  <td className="px-4 py-3 text-gray-800">{r.orderNumber}</td>
                  <td className="px-4 py-3 text-gray-600">{r.customerName}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-xs font-medium ${r.returnType === "EXCHANGE" ? "bg-blue-50 text-blue-600" : "bg-orange-50 text-orange-600"}`}>{r.returnType}</span></td>
                  <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{r.reason}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[r.status] ?? "bg-gray-100 text-gray-500"}`}>{r.status}</span></td>
                  <td className="px-4 py-3">
                    {isAdmin && r.status === "REQUESTED" && (
                      <button onClick={() => { setResolveTarget(r); setResolveStatus("APPROVED"); setResolveNote(""); }}
                        className="text-indigo-600 hover:text-indigo-800 text-xs font-medium">Resolve</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Dialog */}
      {createOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">New Return / Exchange Request</h2>
              <button onClick={() => setCreateOpen(false)} className="text-gray-400">✕</button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Order Number *</label>
                <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  value={form.orderNumber} onChange={e => setForm(f => ({ ...f, orderNumber: e.target.value }))} placeholder="ORD-XXXXXXXX" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <div className="flex gap-3">
                  {["RETURN", "EXCHANGE"].map(t => (
                    <button key={t} onClick={() => setForm(f => ({ ...f, returnType: t as "RETURN" | "EXCHANGE" }))}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium border ${form.returnType === t ? "bg-indigo-600 text-white border-indigo-600" : "border-gray-200 text-gray-600"}`}>{t}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason *</label>
                <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}>
                  <option value="">Select a reason</option>
                  {REASONS.map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" rows={2}
                  value={form.description ?? ""} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
            </div>
            <div className="px-6 py-4 border-t flex justify-end gap-3">
              <button onClick={() => setCreateOpen(false)} className="px-4 py-2 text-sm text-gray-600">Cancel</button>
              <button onClick={handleCreate} disabled={saving || !form.orderNumber.trim() || !form.reason}
                className="px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
                {saving ? "Submitting…" : "Submit Request"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resolve Dialog */}
      {resolveTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h2 className="text-lg font-semibold">Resolve {resolveTarget.returnCode}</h2>
              <button onClick={() => setResolveTarget(null)} className="text-gray-400">✕</button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Status</label>
                <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  value={resolveStatus} onChange={e => setResolveStatus(e.target.value)}>
                  {RESOLVE_STATUSES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Admin Note</label>
                <textarea className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" rows={2}
                  value={resolveNote} onChange={e => setResolveNote(e.target.value)} />
              </div>
            </div>
            <div className="px-6 py-4 border-t flex justify-end gap-3">
              <button onClick={() => setResolveTarget(null)} className="px-4 py-2 text-sm text-gray-600">Cancel</button>
              <button onClick={handleResolve} disabled={resolving}
                className="px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
                {resolving ? "Saving…" : "Update Status"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
