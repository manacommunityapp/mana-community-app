import React, { useEffect, useState } from "react";
import {
  commerceFlashSaleService,
  type CommerceFlashSaleDto,
  type FlashSaleRequest,
} from "../../../../services/commerce/commerceFlashSaleService";

const STATUS_COLOR: Record<string, string> = {
  SCHEDULED: "bg-blue-100 text-blue-700",
  ACTIVE: "bg-green-100 text-green-700",
  ENDED: "bg-gray-100 text-gray-500",
  CANCELLED: "bg-red-100 text-red-600",
};

function fmtDt(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default function FlashSaleManagement() {
  const [sales, setSales] = useState<CommerceFlashSaleDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Partial<FlashSaleRequest>>({
    discountType: "PERCENT",
  });
  const [productIdsInput, setProductIdsInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    commerceFlashSaleService.getAll()
      .then(setSales)
      .catch(() => setSales([]))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleCreate = async () => {
    if (!form.title || !form.startsAt || !form.endsAt || !form.discountValue) {
      setError("Title, start/end time, and discount value are required.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const productIds = productIdsInput
        .split(",")
        .map((s) => parseInt(s.trim(), 10))
        .filter((n) => !isNaN(n));
      await commerceFlashSaleService.create({
        ...(form as FlashSaleRequest),
        productIds: productIds.length > 0 ? productIds : undefined,
      });
      setShowForm(false);
      setForm({ discountType: "PERCENT" });
      setProductIdsInput("");
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create flash sale.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (id: number) => {
    if (!window.confirm("Cancel this flash sale?")) return;
    try {
      await commerceFlashSaleService.cancel(id);
      load();
    } catch {
      alert("Failed to cancel sale.");
    }
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">Flash Sales</h2>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="px-4 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-medium">
          + New Flash Sale
        </button>
      </div>

      {showForm && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 space-y-3">
          <p className="text-sm font-semibold text-red-800">Create Flash Sale</p>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { label: "Title", key: "title", type: "text" },
              { label: "Starts At (ISO)", key: "startsAt", type: "datetime-local" },
              { label: "Ends At (ISO)", key: "endsAt", type: "datetime-local" },
              { label: "Discount Type", key: "discountType", type: "select" },
              { label: "Discount Value", key: "discountValue", type: "number" },
              { label: "Max Quantity", key: "maxQuantity", type: "number" },
            ].map(({ label, key, type }) =>
              type === "select" ? (
                <div key={key}>
                  <label className="text-xs text-gray-600 font-medium">{label}</label>
                  <select
                    value={(form as any)[key] ?? "PERCENT"}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400">
                    <option value="PERCENT">Percent (%)</option>
                    <option value="FLAT">Flat (₹)</option>
                  </select>
                </div>
              ) : (
                <div key={key}>
                  <label className="text-xs text-gray-600 font-medium">{label}</label>
                  <input
                    type={type}
                    value={(form as any)[key] ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: type === "number" ? Number(e.target.value) : e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400" />
                </div>
              )
            )}
            <div className="sm:col-span-2">
              <label className="text-xs text-gray-600 font-medium">Product IDs (comma-separated)</label>
              <input
                type="text"
                value={productIdsInput}
                onChange={(e) => setProductIdsInput(e.target.value)}
                placeholder="e.g. 1, 5, 12"
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-gray-600 font-medium">Description (optional)</label>
              <textarea
                value={form.description ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={2}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleCreate} disabled={submitting}
              className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-medium disabled:opacity-50">
              {submitting ? "Creating…" : "Create Sale"}
            </button>
            <button onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-gray-50">
              Cancel
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center text-sm text-gray-400">Loading flash sales…</div>
      ) : sales.length === 0 ? (
        <div className="py-16 text-center text-sm text-gray-400">No flash sales yet.</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="min-w-full text-sm divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {["Title", "Start", "End", "Discount", "Items", "Status", "Action"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {sales.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{s.title}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{fmtDt(s.startsAt)}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{fmtDt(s.endsAt)}</td>
                  <td className="px-4 py-3 text-sm">
                    {s.discountType === "PERCENT" ? `${s.discountValue}%` : `₹${s.discountValue}`}
                  </td>
                  <td className="px-4 py-3 text-sm text-center">{s.items.length}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLOR[s.status] ?? ""}`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {(s.status === "ACTIVE" || s.status === "SCHEDULED") && (
                      <button onClick={() => handleCancel(s.id)}
                        className="text-xs text-red-600 border border-red-200 rounded px-2 py-1 hover:bg-red-50">
                        Cancel
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
