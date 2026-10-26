import React, { useState, useEffect } from "react";
import {
  Database,
  Clock,
  ShieldCheck,
  Edit2,
  RefreshCw,
  Loader2,
  Save,
  CheckCircle2,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import {
  privacyService,
  type DataRetentionPolicy,
} from "../../../../services/privacy/privacyService";

export const AdminRetentionPolicies: React.FC = () => {
  const [policies, setPolicies] = useState<DataRetentionPolicy[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit Modal State
  const [editingPolicy, setEditingPolicy] = useState<DataRetentionPolicy | null>(null);
  const [retentionDays, setRetentionDays] = useState<number>(90);
  const [actionOnExpiry, setActionOnExpiry] = useState<string>("ANONYMIZE");
  const [isActive, setIsActive] = useState<boolean>(true);
  const [description, setDescription] = useState<string>("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPolicies();
  }, []);

  const fetchPolicies = async () => {
    try {
      setLoading(true);
      const data = await privacyService.getAdminRetentionPolicies();
      setPolicies(data || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load retention policies");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEdit = (p: DataRetentionPolicy) => {
    setEditingPolicy(p);
    setRetentionDays(p.retentionPeriodDays);
    setActionOnExpiry(p.actionOnExpiry || "ANONYMIZE");
    setIsActive(p.isActive);
    setDescription(p.description || "");
  };

  const handleSavePolicy = async () => {
    if (!editingPolicy) return;
    try {
      setSaving(true);
      const updated = await privacyService.updateAdminRetentionPolicy(editingPolicy.id, {
        retentionPeriodDays: Number(retentionDays),
        actionOnExpiry,
        isActive,
        description,
      });
      toast.success(`Retention policy for ${updated.dataCategory} updated`);
      setEditingPolicy(null);
      await fetchPolicies();
    } catch (err: any) {
      toast.error(err.message || "Failed to update policy");
    } finally {
      setSaving(false);
    }
  };

  const handleQuickToggle = async (policy: DataRetentionPolicy) => {
    try {
      const updated = await privacyService.updateAdminRetentionPolicy(policy.id, {
        isActive: !policy.isActive,
      });
      toast.success(`Policy ${updated.dataCategory} ${updated.isActive ? "activated" : "deactivated"}`);
      await fetchPolicies();
    } catch (err: any) {
      toast.error(err.message || "Failed to toggle policy status");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Database className="w-5 h-5 text-emerald-600" />
            Automated Data Retention & Lifecycle Policies
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure automated daily data retention enforcement (runs daily at 2:00 AM IST).
          </p>
        </div>

        <button
          onClick={fetchPolicies}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold shadow-sm transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Info Card */}
      <div className="p-4 bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 rounded-xl flex items-start gap-3 text-xs text-emerald-900 dark:text-emerald-200">
        <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
        <p leading-relaxed>
          The automated retention engine enforces these rules on historical data. For visitor passes, phone numbers and photos are stripped after the retention window. For marketplace transactions, personal delivery addresses are cleared while preserving aggregate accounting amounts.
        </p>
      </div>

      {/* Policies List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-12 space-y-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <Loader2 className="w-7 h-7 animate-spin text-emerald-600" />
          <p className="text-xs text-slate-500">Loading retention policies...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {policies.map((p) => (
            <div
              key={p.id}
              className={`p-5 rounded-2xl border transition-all ${
                p.isActive
                  ? "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm hover:border-emerald-300"
                  : "bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-60"
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                      {p.dataCategory}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        p.actionOnExpiry === "ANONYMIZE"
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300"
                          : p.actionOnExpiry === "DELETE"
                          ? "bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-300"
                          : "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300"
                      }`}
                    >
                      {p.actionOnExpiry}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{p.description || "System data retention rule"}</p>
                </div>

                <button
                  type="button"
                  onClick={() => handleQuickToggle(p)}
                  className={`cursor-pointer transition-colors ${
                    p.isActive ? "text-emerald-600 hover:text-emerald-700" : "text-slate-400 hover:text-slate-500"
                  }`}
                  title={p.isActive ? "Disable Policy" : "Enable Policy"}
                >
                  {p.isActive ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
                </button>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                  <Clock className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {p.retentionPeriodDays >= 365
                      ? `${(p.retentionPeriodDays / 365).toFixed(0)} year(s) (${p.retentionPeriodDays} days)`
                      : `${p.retentionPeriodDays} days`}
                  </span>
                </div>

                <button
                  onClick={() => handleOpenEdit(p)}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Edit2 className="w-3 h-3" />
                  Edit Policy
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Policy Modal */}
      {editingPolicy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 rounded-xl">
                <Edit2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Edit Retention Policy: {editingPolicy.dataCategory}
                </h3>
                <p className="text-xs text-slate-500">Configure data lifecycle enforcement duration</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Retention Period (in Days):
                </label>
                <input
                  type="number"
                  min="1"
                  max="3650"
                  value={retentionDays}
                  onChange={(e) => setRetentionDays(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Action on Expiry:
                </label>
                <select
                  value={actionOnExpiry}
                  onChange={(e) => setActionOnExpiry(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="ANONYMIZE">ANONYMIZE (Strip PII, preserve aggregated record)</option>
                  <option value="DELETE">DELETE (Permanent removal)</option>
                  <option value="ARCHIVE">ARCHIVE (Cold storage audit retention)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Description:
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Visitor pass history retention..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isActiveToggle"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="isActiveToggle" className="text-slate-700 dark:text-slate-300 font-medium">
                  Enable policy for automated daily execution
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingPolicy(null)}
                disabled={saving}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSavePolicy}
                disabled={saving}
                className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg shadow-sm disabled:opacity-50"
              >
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Save Policy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
