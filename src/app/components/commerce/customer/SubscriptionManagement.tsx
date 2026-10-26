import { useEffect, useState } from "react";
import {
  commerceSubscriptionService,
  type SubscriptionDto,
  type SubscriptionRequest,
} from "../../../../services/commerce/commerceSubscriptionService";

const FREQUENCIES = ["DAILY", "WEEKLY", "FORTNIGHTLY", "MONTHLY"];
const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-700",
  PAUSED: "bg-yellow-100 text-yellow-700",
  CANCELLED: "bg-gray-100 text-gray-500",
};

const emptyForm = (): SubscriptionRequest => ({
  productName: "",
  unitPrice: 0,
  quantity: 1,
  frequency: "WEEKLY",
});

export default function SubscriptionManagement() {
  const [subs, setSubs] = useState<SubscriptionDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState<SubscriptionRequest>(emptyForm());
  const [saving, setSaving] = useState(false);

  const [actionTarget, setActionTarget] = useState<{ sub: SubscriptionDto; action: "pause" | "resume" | "cancel" } | null>(null);
  const [acting, setActing] = useState(false);

  const load = () => {
    setLoading(true);
    commerceSubscriptionService
      .getMySubscriptions()
      .then(setSubs)
      .catch(() => setError("Failed to load subscriptions"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!form.productName.trim() || form.unitPrice <= 0) return;
    setSaving(true);
    try {
      await commerceSubscriptionService.create(form);
      setCreateOpen(false);
      setForm(emptyForm());
      load();
    } catch {
      setError("Failed to create subscription");
    } finally {
      setSaving(false);
    }
  };

  const handleAction = async () => {
    if (!actionTarget) return;
    setActing(true);
    try {
      const { sub, action } = actionTarget;
      if (action === "pause") await commerceSubscriptionService.pause(sub.subscriptionCode);
      else if (action === "resume") await commerceSubscriptionService.resume(sub.subscriptionCode);
      else await commerceSubscriptionService.cancel(sub.subscriptionCode);
      setActionTarget(null);
      load();
    } catch {
      setError("Action failed");
    } finally {
      setActing(false);
    }
  };

  const set = (k: keyof SubscriptionRequest, v: unknown) =>
    setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Subscriptions</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your recurring orders. Auto-orders are placed on the scheduled date.</p>
        </div>
        <button
          onClick={() => { setForm(emptyForm()); setCreateOpen(true); }}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium"
        >
          + New Subscription
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
      ) : subs.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-5xl mb-4">🔄</p>
          <p className="text-lg font-medium">No active subscriptions</p>
          <p className="text-sm mt-1">Subscribe to products for automatic recurring orders.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {subs.map((s) => (
            <div key={s.id} className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-gray-900 leading-tight">{s.productName}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{s.subscriptionCode}</p>
                </div>
                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${STATUS_COLORS[s.status] ?? "bg-gray-100 text-gray-500"}`}>
                  {s.status}
                </span>
              </div>

              <div className="text-sm text-gray-600 space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-400">Qty / Cycle</span>
                  <span>{s.quantity} × ₹{s.unitPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Total / Cycle</span>
                  <span className="font-medium text-indigo-700">₹{s.totalPerCycle.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Frequency</span>
                  <span>{s.frequency}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Next Order</span>
                  <span>{s.nextRunDate ?? "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Cycles</span>
                  <span>{s.completedCycles}{s.totalCycles ? ` / ${s.totalCycles}` : " / ∞"}</span>
                </div>
              </div>

              {s.status !== "CANCELLED" && (
                <div className="flex gap-2 pt-1">
                  {s.status === "ACTIVE" && (
                    <button
                      onClick={() => setActionTarget({ sub: s, action: "pause" })}
                      className="flex-1 text-xs py-1.5 rounded-lg border border-yellow-300 text-yellow-700 hover:bg-yellow-50"
                    >
                      Pause
                    </button>
                  )}
                  {s.status === "PAUSED" && (
                    <button
                      onClick={() => setActionTarget({ sub: s, action: "resume" })}
                      className="flex-1 text-xs py-1.5 rounded-lg border border-green-300 text-green-700 hover:bg-green-50"
                    >
                      Resume
                    </button>
                  )}
                  <button
                    onClick={() => setActionTarget({ sub: s, action: "cancel" })}
                    className="flex-1 text-xs py-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      {createOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">New Subscription</h2>
              <button onClick={() => setCreateOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
                <input
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  value={form.productName}
                  onChange={(e) => set("productName", e.target.value)}
                  placeholder="e.g. Fresh Milk 500ml"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit Price (₹) *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    value={form.unitPrice}
                    onChange={(e) => set("unitPrice", parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    value={form.quantity}
                    onChange={(e) => set("quantity", parseInt(e.target.value) || 1)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
                  <select
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    value={form.frequency}
                    onChange={(e) => set("frequency", e.target.value)}
                  >
                    {FREQUENCIES.map((f) => <option key={f}>{f}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    value={form.startDate ?? ""}
                    onChange={(e) => set("startDate", e.target.value || undefined)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Total Cycles</label>
                <input
                  type="number"
                  min="1"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  value={form.totalCycles ?? ""}
                  onChange={(e) => set("totalCycles", e.target.value ? parseInt(e.target.value) : undefined)}
                  placeholder="Leave blank for infinite"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Address</label>
                <textarea
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  rows={2}
                  value={form.deliveryAddress ?? ""}
                  onChange={(e) => set("deliveryAddress", e.target.value || undefined)}
                  placeholder="Optional delivery address"
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setCreateOpen(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={saving || !form.productName.trim() || form.unitPrice <= 0}
                className="px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
              >
                {saving ? "Subscribing…" : "Subscribe"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action Confirmation */}
      {actionTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 capitalize">{actionTarget.action} Subscription?</h2>
            <p className="text-sm text-gray-600">
              {actionTarget.action === "cancel"
                ? `This will permanently cancel "${actionTarget.sub.productName}". No further auto-orders will be placed.`
                : actionTarget.action === "pause"
                ? `Auto-orders for "${actionTarget.sub.productName}" will be suspended until resumed.`
                : `Auto-orders for "${actionTarget.sub.productName}" will resume from the next scheduled date.`}
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setActionTarget(null)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">
                Back
              </button>
              <button
                onClick={handleAction}
                disabled={acting}
                className={`px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50 ${
                  actionTarget.action === "cancel" ? "bg-red-600 hover:bg-red-700"
                    : actionTarget.action === "pause" ? "bg-yellow-500 hover:bg-yellow-600"
                    : "bg-green-600 hover:bg-green-700"
                }`}
              >
                {acting ? "Processing…" : `Confirm ${actionTarget.action}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
