import { useState, useEffect, useCallback } from "react";
import { Package, Plus, X, Loader2, QrCode, Trash2 } from "lucide-react";
import {
  parcelService,
  type ParcelRecord,
  type LogParcelRequest,
} from "../../../services/security/securityService";
import { getStoredUser } from "../../../services/common/apiClient";

const statusColors: Record<string, { bg: string; text: string; label: string }> = {
  PENDING: { bg: "bg-amber-50 border-amber-200", text: "text-amber-700", label: "Pending" },
  OTP_SENT: { bg: "bg-blue-50 border-blue-200", text: "text-blue-700", label: "OTP Sent" },
  COLLECTED: { bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-700", label: "Collected" },
};

export function ParcelRoom() {
  const [parcels, setParcels] = useState<ParcelRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("PENDING");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Partial<LogParcelRequest>>({});
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { setParcels(await parcelService.getParcels(filter || undefined)); } catch { setParcels([]); }
    finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const handleLog = async () => {
    if (!form.flatNumber) return;
    setSaving(true);
    try {
      const user = getStoredUser() as { communityId?: number } | null;
      await parcelService.logParcel({ communityId: user?.communityId ?? 0, flatNumber: form.flatNumber, ...form });
      setForm({});
      setShowForm(false);
      load();
    } catch { alert("Failed to log parcel."); }
    finally { setSaving(false); }
  };

  const handleGenOtp = async (id: number) => {
    try { await parcelService.generateOtp(id); load(); } catch { alert("Failed to generate OTP."); }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Package className="w-6 h-6 text-blue-600" /> Parcel Room
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">Log incoming parcels and manage OTP-based collection</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" /> Log Parcel
        </button>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {["PENDING", "OTP_SENT", "COLLECTED", ""].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
              filter === s
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-slate-600 border-slate-200 hover:border-blue-300"
            }`}
          >
            {s || "All"}
          </button>
        ))}
      </div>

      {/* Log form */}
      {showForm && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">Log New Parcel</h3>
            <button onClick={() => setShowForm(false)} className="p-1 rounded hover:bg-slate-200">
              <X className="w-4 h-4 text-slate-500" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Flat Number *</label>
              <input value={form.flatNumber ?? ""} onChange={(e) => setForm({ ...form, flatNumber: e.target.value })}
                placeholder="e.g. A-101"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Resident Name</label>
              <input value={form.residentName ?? ""} onChange={(e) => setForm({ ...form, residentName: e.target.value })}
                placeholder="e.g. Rahul Sharma"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Courier Company</label>
              <input value={form.courierCompany ?? ""} onChange={(e) => setForm({ ...form, courierCompany: e.target.value })}
                placeholder="e.g. Amazon, Flipkart"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tracking Number</label>
              <input value={form.trackingNumber ?? ""} onChange={(e) => setForm({ ...form, trackingNumber: e.target.value })}
                placeholder="Tracking ID"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowForm(false)}
              className="px-4 py-2 border border-slate-200 text-slate-700 text-sm rounded-lg hover:bg-slate-50">Cancel</button>
            <button onClick={handleLog} disabled={saving || !form.flatNumber}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {saving ? <Loader2 className="w-4 h-4 animate-spin inline" /> : "Log Parcel"}
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
      ) : parcels.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No parcels found</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {["Flat", "Resident", "Courier", "Tracking", "Received", "Status", "Actions"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {parcels.map((p) => {
                const s = statusColors[p.status] ?? { bg: "bg-slate-50", text: "text-slate-600", label: p.status };
                return (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">{p.flatNumber}</td>
                    <td className="px-4 py-3 text-slate-700">{p.residentName ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-600">{p.courierCompany ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-500 font-mono text-xs">{p.trackingNumber ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-500">{new Date(p.receivedAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${s.bg} ${s.text}`}>
                        {s.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {p.status === "PENDING" && (
                        <button onClick={() => handleGenOtp(p.id)}
                          className="flex items-center gap-1 text-xs px-2 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded hover:bg-blue-100">
                          <QrCode className="w-3 h-3" /> Send OTP
                        </button>
                      )}
                      {p.status === "OTP_SENT" && p.otp && (
                        <span className="text-xs font-mono bg-amber-50 border border-amber-200 text-amber-800 px-2 py-1 rounded">
                          OTP: {p.otp}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
