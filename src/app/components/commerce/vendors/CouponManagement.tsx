import { useEffect, useState } from "react";
import {
  commerceCouponService,
  CouponDto,
  CouponRequest,
} from "../../../../services/commerce/commerceCouponService";

const TYPE_LABELS: Record<string, string> = { PERCENT: "%", FLAT: "₹", FREE_DELIVERY: "🚚" };

const emptyForm = (): CouponRequest => ({
  couponCode: "",
  title: "",
  couponType: "PERCENT",
  value: 10,
  validFrom: new Date().toISOString().slice(0, 16),
  validTo: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 16),
  active: true,
});

export default function CouponManagement() {
  const [coupons, setCoupons] = useState<CouponDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CouponDto | null>(null);
  const [form, setForm] = useState<CouponRequest>(emptyForm());
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<CouponDto | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = () => {
    setLoading(true);
    commerceCouponService.getAdminCoupons()
      .then(setCoupons).catch(() => setError("Failed to load coupons")).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm(emptyForm()); setDialogOpen(true); };
  const openEdit = (c: CouponDto) => {
    setEditing(c);
    setForm({
      couponCode: c.couponCode, title: c.title, description: c.description,
      couponType: c.couponType as CouponRequest["couponType"], value: c.value,
      minOrderAmount: c.minOrderAmount, maxDiscount: c.maxDiscount,
      vendorUserId: c.vendorUserId, category: c.category, channel: c.channel,
      maxUses: c.maxUses, maxUsesPerUser: c.maxUsesPerUser,
      validFrom: c.validFrom.slice(0, 16), validTo: c.validTo.slice(0, 16), active: c.active,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.couponCode.trim() || !form.title.trim()) return;
    setSaving(true);
    try {
      const payload = { ...form, validFrom: form.validFrom + ":00", validTo: form.validTo + ":00" };
      if (editing) await commerceCouponService.updateCoupon(editing.id, payload);
      else await commerceCouponService.createCoupon(payload);
      setDialogOpen(false);
      load();
    } catch { setError("Failed to save coupon"); } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await commerceCouponService.deleteCoupon(deleteTarget.id);
      setDeleteTarget(null);
      load();
    } catch { setError("Failed to deactivate"); } finally { setDeleting(false); }
  };

  const set = (k: keyof CouponRequest, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Coupon Engine</h1>
          <p className="text-sm text-gray-500 mt-1">Create and manage discount coupons for your community marketplace.</p>
        </div>
        <button onClick={openCreate} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium">
          + New Coupon
        </button>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm flex justify-between">
        {error}<button onClick={() => setError(null)}>✕</button></div>}

      {loading ? (
        <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : coupons.length === 0 ? (
        <div className="text-center py-16 text-gray-400"><p className="text-5xl mb-4">🎟️</p><p className="text-lg font-medium">No coupons yet</p></div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {coupons.map(c => (
            <div key={c.id} className={`bg-white rounded-xl border-2 p-5 space-y-3 ${c.active ? "border-indigo-100" : "border-gray-100 opacity-60"}`}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="bg-indigo-600 text-white font-bold text-sm px-3 py-0.5 rounded font-mono tracking-wider">{c.couponCode}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${c.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {c.active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-gray-800 mt-1">{c.title}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-indigo-700">{TYPE_LABELS[c.couponType]}{c.value}</p>
                  <p className="text-xs text-gray-400">{c.couponType}</p>
                </div>
              </div>
              <div className="text-xs text-gray-500 space-y-0.5">
                {c.minOrderAmount && <p>Min order: ₹{c.minOrderAmount}</p>}
                {c.maxDiscount && <p>Max discount: ₹{c.maxDiscount}</p>}
                <p>Uses: {c.usedCount}{c.maxUses ? ` / ${c.maxUses}` : " (unlimited)"}</p>
                <p>Valid: {c.validFrom.slice(0, 10)} → {c.validTo.slice(0, 10)}</p>
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={() => openEdit(c)} className="flex-1 text-xs py-1.5 rounded-lg border border-indigo-200 text-indigo-600 hover:bg-indigo-50">Edit</button>
                <button onClick={() => setDeleteTarget(c)} className="flex-1 text-xs py-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50">Deactivate</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Dialog */}
      {dialogOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h2 className="text-lg font-semibold">{editing ? "Edit Coupon" : "New Coupon"}</h2>
              <button onClick={() => setDialogOpen(false)} className="text-gray-400">✕</button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Coupon Code *</label>
                  <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm uppercase"
                    value={form.couponCode} onChange={e => set("couponCode", e.target.value.toUpperCase())} placeholder="SAVE20" disabled={!!editing} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    value={form.couponType} onChange={e => set("couponType", e.target.value)}>
                    <option value="PERCENT">Percentage off</option>
                    <option value="FLAT">Flat discount</option>
                    <option value="FREE_DELIVERY">Free delivery</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  value={form.title} onChange={e => set("title", e.target.value)} placeholder="e.g. Weekend 20% off" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Value *</label>
                  <input type="number" min="0" step="0.01" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    value={form.value} onChange={e => set("value", parseFloat(e.target.value) || 0)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Min Order (₹)</label>
                  <input type="number" min="0" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    value={form.minOrderAmount ?? ""} onChange={e => set("minOrderAmount", e.target.value ? parseFloat(e.target.value) : undefined)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Disc (₹)</label>
                  <input type="number" min="0" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    value={form.maxDiscount ?? ""} onChange={e => set("maxDiscount", e.target.value ? parseFloat(e.target.value) : undefined)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Total Uses</label>
                  <input type="number" min="1" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    value={form.maxUses ?? ""} onChange={e => set("maxUses", e.target.value ? parseInt(e.target.value) : undefined)} placeholder="Unlimited" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Uses per User</label>
                  <input type="number" min="1" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    value={form.maxUsesPerUser ?? 1} onChange={e => set("maxUsesPerUser", parseInt(e.target.value) || 1)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Valid From *</label>
                  <input type="datetime-local" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    value={form.validFrom} onChange={e => set("validFrom", e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Valid To *</label>
                  <input type="datetime-local" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    value={form.validTo} onChange={e => set("validTo", e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    value={form.category ?? ""} onChange={e => set("category", e.target.value || undefined)} placeholder="Optional" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Channel</label>
                  <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    value={form.channel ?? ""} onChange={e => set("channel", e.target.value || undefined)} placeholder="Optional" />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input type="checkbox" className="rounded text-indigo-600" checked={form.active ?? true}
                  onChange={e => set("active", e.target.checked)} />
                Active
              </label>
            </div>
            <div className="px-6 py-4 border-t flex justify-end gap-3">
              <button onClick={() => setDialogOpen(false)} className="px-4 py-2 text-sm text-gray-600">Cancel</button>
              <button onClick={handleSave} disabled={saving || !form.couponCode.trim() || !form.title.trim()}
                className="px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
                {saving ? "Saving…" : editing ? "Update Coupon" : "Create Coupon"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <h2 className="text-lg font-semibold">Deactivate Coupon?</h2>
            <p className="text-sm text-gray-600"><strong>{deleteTarget.couponCode}</strong> will no longer be usable.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 text-sm text-gray-600">Cancel</button>
              <button onClick={handleDelete} disabled={deleting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50">
                {deleting ? "Deactivating…" : "Deactivate"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
