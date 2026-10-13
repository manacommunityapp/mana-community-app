import { useEffect, useState } from "react";
import {
  commerceCommissionService,
  type CommissionRuleDto,
  type CommissionRuleRequest,
} from "../../../../services/commerce/commerceCommissionService";

const CHANNELS = ["", "ONLINE", "OFFLINE", "WHATSAPP", "APP"];

const emptyForm = (): CommissionRuleRequest => ({
  ruleName: "",
  feePercent: 2.5,
  gstOnFee: false,
  priority: 100,
  active: true,
});

export default function CommissionRulesManager() {
  const [rules, setRules] = useState<CommissionRuleDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CommissionRuleDto | null>(null);
  const [form, setForm] = useState<CommissionRuleRequest>(emptyForm());
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<CommissionRuleDto | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = () => {
    setLoading(true);
    commerceCommissionService
      .getRules()
      .then(setRules)
      .catch(() => setError("Failed to load commission rules"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setDialogOpen(true);
  };

  const openEdit = (r: CommissionRuleDto) => {
    setEditing(r);
    setForm({
      ruleName: r.ruleName,
      vendorUserId: r.vendorUserId,
      category: r.category,
      channel: r.channel,
      feePercent: r.feePercent,
      gstOnFee: r.gstOnFee,
      tdsPercent: r.tdsPercent,
      priority: r.priority,
      active: r.active,
      notes: r.notes,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.ruleName.trim()) return;
    setSaving(true);
    try {
      if (editing) {
        await commerceCommissionService.updateRule(editing.id, form);
      } else {
        await commerceCommissionService.createRule(form);
      }
      setDialogOpen(false);
      load();
    } catch {
      setError("Failed to save rule");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await commerceCommissionService.deleteRule(deleteTarget.id);
      setDeleteTarget(null);
      load();
    } catch {
      setError("Failed to delete rule");
    } finally {
      setDeleting(false);
    }
  };

  const set = (k: keyof CommissionRuleRequest, v: unknown) =>
    setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Commission Rules</h1>
          <p className="text-sm text-gray-500 mt-1">
            Configure platform fee percentages by vendor, category, or channel.
            Lower priority number = higher precedence.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium"
        >
          + New Rule
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm flex justify-between">
          {error}
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">✕</button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : rules.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg font-medium">No commission rules configured</p>
          <p className="text-sm mt-1">A default 2.5% fee applies until rules are created.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                {["Rule Name", "Vendor", "Category", "Channel", "Fee %", "GST on Fee", "Priority", "Status", ""].map(
                  (h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rules.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{r.ruleName}</td>
                  <td className="px-4 py-3 text-gray-600">{r.vendorName ?? <span className="text-gray-400 italic">Any</span>}</td>
                  <td className="px-4 py-3 text-gray-600">{r.category ?? <span className="text-gray-400 italic">Any</span>}</td>
                  <td className="px-4 py-3 text-gray-600">{r.channel ?? <span className="text-gray-400 italic">All</span>}</td>
                  <td className="px-4 py-3 font-medium text-indigo-700">{r.feePercent}%</td>
                  <td className="px-4 py-3">{r.gstOnFee ? "Yes" : "No"}</td>
                  <td className="px-4 py-3 text-center">{r.priority}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        r.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {r.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEdit(r)}
                        className="text-indigo-600 hover:text-indigo-800 text-xs font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setDeleteTarget(r)}
                        className="text-red-500 hover:text-red-700 text-xs font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create / Edit Dialog */}
      {dialogOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                {editing ? "Edit Rule" : "New Commission Rule"}
              </h2>
              <button onClick={() => setDialogOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rule Name *</label>
                <input
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  value={form.ruleName}
                  onChange={(e) => set("ruleName", e.target.value)}
                  placeholder="e.g. Default Community Rate"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fee % *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    value={form.feePercent}
                    onChange={(e) => set("feePercent", parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <input
                    type="number"
                    min="1"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    value={form.priority ?? 100}
                    onChange={(e) => set("priority", parseInt(e.target.value) || 100)}
                  />
                  <p className="text-xs text-gray-400 mt-0.5">Lower = higher precedence</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vendor User ID</label>
                <input
                  type="number"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  value={form.vendorUserId ?? ""}
                  onChange={(e) => set("vendorUserId", e.target.value ? parseInt(e.target.value) : undefined)}
                  placeholder="Leave blank for all vendors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <input
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    value={form.category ?? ""}
                    onChange={(e) => set("category", e.target.value || undefined)}
                    placeholder="Leave blank for all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Channel</label>
                  <select
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    value={form.channel ?? ""}
                    onChange={(e) => set("channel", e.target.value || undefined)}
                  >
                    {CHANNELS.map((c) => (
                      <option key={c} value={c}>{c || "All channels"}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">TDS %</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  value={form.tdsPercent ?? ""}
                  onChange={(e) => set("tdsPercent", e.target.value ? parseFloat(e.target.value) : undefined)}
                  placeholder="Optional TDS deduction %"
                />
              </div>

              <div className="flex gap-6">
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    className="rounded text-indigo-600"
                    checked={form.gstOnFee ?? false}
                    onChange={(e) => set("gstOnFee", e.target.checked)}
                  />
                  GST on platform fee
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    className="rounded text-indigo-600"
                    checked={form.active ?? true}
                    onChange={(e) => set("active", e.target.checked)}
                  />
                  Active
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  rows={2}
                  value={form.notes ?? ""}
                  onChange={(e) => set("notes", e.target.value || undefined)}
                  placeholder="Optional internal note"
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => setDialogOpen(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.ruleName.trim()}
                className="px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
              >
                {saving ? "Saving…" : editing ? "Update Rule" : "Create Rule"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Deactivate Rule?</h2>
            <p className="text-sm text-gray-600">
              This will deactivate <strong>{deleteTarget.ruleName}</strong>. The rule will no longer apply to new settlements.
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? "Deactivating…" : "Deactivate"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
