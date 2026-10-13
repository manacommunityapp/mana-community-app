import { useEffect, useState } from "react";
import {
  commerceBulkOrderService,
  type BulkOrderDto,
  type BulkOrderRequest,
} from "../../../../services/commerce/commerceBulkOrderService";

const STATUS_COLORS: Record<string, string> = {
  REQUESTED: "bg-blue-100 text-blue-700",
  QUOTED: "bg-yellow-100 text-yellow-700",
  APPROVED: "bg-green-100 text-green-700",
  FULFILLED: "bg-purple-100 text-purple-700",
  CANCELLED: "bg-gray-100 text-gray-500",
};
const ADMIN_STATUSES = ["QUOTED", "APPROVED", "FULFILLED", "CANCELLED"];

interface BulkItem { productName: string; sku?: string; qty: number; unitPrice: number; }

export default function BulkOrderManagement() {
  const [orders, setOrders] = useState<BulkOrderDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [items, setItems] = useState<BulkItem[]>([{ productName: "", qty: 1, unitPrice: 0 }]);
  const [req, setReq] = useState<Omit<BulkOrderRequest, "itemsJson">>({});
  const [saving, setSaving] = useState(false);

  const [adminTarget, setAdminTarget] = useState<BulkOrderDto | null>(null);
  const [adminStatus, setAdminStatus] = useState("QUOTED");
  const [adminNote, setAdminNote] = useState("");
  const [quoteAmt, setQuoteAmt] = useState("");
  const [acting, setActing] = useState(false);

  const load = () => {
    setLoading(true);
    (isAdmin ? commerceBulkOrderService.getAdminBulkOrders() : commerceBulkOrderService.getMyBulkOrders())
      .then(setOrders).catch(() => setError("Failed to load")).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [isAdmin]);

  const handleCreate = async () => {
    if (items.every(i => !i.productName.trim())) return;
    setSaving(true);
    try {
      const payload: BulkOrderRequest = { ...req, itemsJson: JSON.stringify(items.filter(i => i.productName.trim())) };
      await commerceBulkOrderService.create(payload);
      setCreateOpen(false);
      setItems([{ productName: "", qty: 1, unitPrice: 0 }]);
      setReq({});
      loadMy();
    } catch { setError("Failed to create bulk order"); } finally { setSaving(false); }
  };
  const loadMy = () => {
    setLoading(true);
    commerceBulkOrderService.getMyBulkOrders().then(setOrders).catch(() => {}).finally(() => setLoading(false));
  };

  const handleAdminUpdate = async () => {
    if (!adminTarget) return;
    setActing(true);
    try {
      if (quoteAmt) await commerceBulkOrderService.updateBulkOrder(adminTarget.bulkOrderCode, { quotedAmount: parseFloat(quoteAmt), adminNote });
      await commerceBulkOrderService.updateStatus(adminTarget.bulkOrderCode, adminStatus);
      setAdminTarget(null);
      load();
    } catch { setError("Update failed"); } finally { setActing(false); }
  };

  const addItem = () => setItems(i => [...i, { productName: "", qty: 1, unitPrice: 0 }]);
  const removeItem = (idx: number) => setItems(i => i.filter((_, n) => n !== idx));
  const setItem = (idx: number, k: keyof BulkItem, v: string | number) =>
    setItems(i => i.map((it, n) => n === idx ? { ...it, [k]: v } : it));

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bulk Orders</h1>
          <p className="text-sm text-gray-500 mt-1">Request large quantity orders with custom pricing.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setIsAdmin(!isAdmin)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border ${isAdmin ? "bg-indigo-600 text-white border-indigo-600" : "border-gray-300 text-gray-600"}`}>
            {isAdmin ? "Admin View" : "My Orders"}
          </button>
          {!isAdmin && (
            <button onClick={() => setCreateOpen(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium">
              + Bulk Request
            </button>
          )}
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm flex justify-between">
        {error}<button onClick={() => setError(null)}>✕</button></div>}

      {loading ? (
        <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16 text-gray-400"><p className="text-5xl mb-4">📦</p><p className="text-lg font-medium">No bulk orders</p></div>
      ) : (
        <div className="space-y-4">
          {orders.map(o => (
            <div key={o.id} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-gray-900">{o.bulkOrderCode}</p>
                  <p className="text-sm text-gray-500 mt-0.5">By {o.customerName} · {o.createdAt?.slice(0, 10)}</p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[o.status] ?? "bg-gray-100 text-gray-500"}`}>{o.status}</span>
              </div>
              <div className="mt-3 text-sm text-gray-600 grid grid-cols-2 gap-2">
                {o.quotedAmount && <span>Quoted: <strong className="text-indigo-700">₹{o.quotedAmount}</strong></span>}
                {o.requestedDate && <span>Requested: {o.requestedDate}</span>}
                {o.customerNote && <span className="col-span-2 text-gray-400 italic">"{o.customerNote}"</span>}
                {o.adminNote && <span className="col-span-2 text-gray-600">Admin: {o.adminNote}</span>}
              </div>
              {isAdmin && o.status !== "FULFILLED" && o.status !== "CANCELLED" && (
                <div className="mt-3">
                  <button onClick={() => { setAdminTarget(o); setAdminStatus("QUOTED"); setAdminNote(o.adminNote ?? ""); setQuoteAmt(o.quotedAmount?.toString() ?? ""); }}
                    className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">Update Status</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      {createOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h2 className="text-lg font-semibold">New Bulk Order Request</h2>
              <button onClick={() => setCreateOpen(false)} className="text-gray-400">✕</button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">Items *</label>
                  <button onClick={addItem} className="text-xs text-indigo-600 hover:text-indigo-800">+ Add Item</button>
                </div>
                <div className="space-y-2">
                  {items.map((it, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                      <input className="col-span-5 border border-gray-200 rounded px-2 py-1.5 text-sm" placeholder="Product name"
                        value={it.productName} onChange={e => setItem(idx, "productName", e.target.value)} />
                      <input type="number" min="1" className="col-span-2 border border-gray-200 rounded px-2 py-1.5 text-sm" placeholder="Qty"
                        value={it.qty} onChange={e => setItem(idx, "qty", parseInt(e.target.value) || 1)} />
                      <input type="number" min="0" step="0.01" className="col-span-3 border border-gray-200 rounded px-2 py-1.5 text-sm" placeholder="Price"
                        value={it.unitPrice} onChange={e => setItem(idx, "unitPrice", parseFloat(e.target.value) || 0)} />
                      <button onClick={() => removeItem(idx)} className="col-span-2 text-red-400 hover:text-red-600 text-sm">Remove</button>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Address</label>
                <textarea className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" rows={2}
                  value={req.deliveryAddress ?? ""} onChange={e => setReq(r => ({ ...r, deliveryAddress: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Requested Delivery Date</label>
                <input type="date" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  value={req.requestedDate ?? ""} onChange={e => setReq(r => ({ ...r, requestedDate: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
                <textarea className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" rows={2}
                  value={req.customerNote ?? ""} onChange={e => setReq(r => ({ ...r, customerNote: e.target.value }))} />
              </div>
            </div>
            <div className="px-6 py-4 border-t flex justify-end gap-3">
              <button onClick={() => setCreateOpen(false)} className="px-4 py-2 text-sm text-gray-600">Cancel</button>
              <button onClick={handleCreate} disabled={saving || items.every(i => !i.productName.trim())}
                className="px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium disabled:opacity-50">
                {saving ? "Submitting…" : "Submit Request"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Update Dialog */}
      {adminTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h2 className="text-lg font-semibold">Update {adminTarget.bulkOrderCode}</h2>
              <button onClick={() => setAdminTarget(null)} className="text-gray-400">✕</button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  value={adminStatus} onChange={e => setAdminStatus(e.target.value)}>
                  {ADMIN_STATUSES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quoted Amount (₹)</label>
                <input type="number" min="0" step="0.01" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  value={quoteAmt} onChange={e => setQuoteAmt(e.target.value)} placeholder="Optional price quote" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Admin Note</label>
                <textarea className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" rows={2}
                  value={adminNote} onChange={e => setAdminNote(e.target.value)} />
              </div>
            </div>
            <div className="px-6 py-4 border-t flex justify-end gap-3">
              <button onClick={() => setAdminTarget(null)} className="px-4 py-2 text-sm text-gray-600">Cancel</button>
              <button onClick={handleAdminUpdate} disabled={acting}
                className="px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium disabled:opacity-50">
                {acting ? "Saving…" : "Update"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
