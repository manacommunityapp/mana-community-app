import { useState, useEffect, useCallback } from "react";
import { ShoppingBasket, Plus, Users, Clock, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "react-toastify";
import { groupOrderService, type GroupOrder, type MyGroupOrderEntry } from "../../../services/groupOrderService";
import { stompClient } from "../../../services/chat/stompClient";
import { getStoredUser } from "../../../services/common/apiClient";

const CATEGORIES = ["Groceries", "Dairy", "Produce", "Meat & Fish", "Bakery", "Snacks", "Household", "Other"] as const;

function CountdownBadge({ closesAt }: { closesAt: string }) {
  const ms = new Date(closesAt).getTime() - Date.now();
  if (ms <= 0) return <span className="text-xs text-red-500 font-medium">Closed</span>;
  const h = Math.floor(ms / 3600000);
  const d = Math.floor(h / 24);
  if (d > 0) return <span className="text-xs text-slate-500">{d}d left</span>;
  return <span className="text-xs text-orange-500 font-medium">{h}h left</span>;
}

function ProgressBar({ committed, min }: { committed: number; min: number }) {
  const pct = Math.min(100, Math.round((committed / min) * 100));
  return (
    <div className="space-y-1">
      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
        <div style={{ width: `${pct}%` }} className={`h-full rounded-full transition-all ${pct >= 100 ? "bg-green-500" : "bg-indigo-500"}`} />
      </div>
      <div className="flex justify-between text-xs text-slate-500">
        <span>{committed} committed</span>
        <span>min {min}</span>
      </div>
    </div>
  );
}

export function GroupOrdersPage() {
  const user = getStoredUser();
  const communityId: number = (user as { communityId?: number })?.communityId ?? 0;

  const [tab, setTab] = useState<"open" | "mine">("open");
  const [filterCat, setFilterCat] = useState("");
  const [orders, setOrders] = useState<GroupOrder[]>([]);
  const [myOrders, setMyOrders] = useState<MyGroupOrderEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState<number | null>(null);
  const [joinQty, setJoinQty] = useState(1);
  const [joinTarget, setJoinTarget] = useState<GroupOrder | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ title: "", category: "Groceries", itemName: "", unitPrice: "", minQuantity: "10", closesAt: "" });

  const fetchOpen = useCallback(() => {
    return groupOrderService.getOpen(communityId, filterCat || undefined)
      .then(setOrders)
      .catch(() => toast.error("Failed to load group orders"));
  }, [communityId, filterCat]);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchOpen(), groupOrderService.getMyJoined().then(setMyOrders).catch(() => {})])
      .finally(() => setLoading(false));
  }, [fetchOpen]);

  // Real-time group-order status updates via STOMP + Redis Pub/Sub
  useEffect(() => {
    if (!communityId) return;
    const unsub = stompClient.subscribe(`/topic/community/${communityId}/group-orders`, (body: unknown) => {
      const ev = body as { groupOrderId?: number; status?: string; totalCommitted?: number; message?: string };
      if (ev?.groupOrderId) {
        setOrders((prev) =>
          prev.map((o) =>
            o.id === ev.groupOrderId
              ? {
                  ...o,
                  status: ev.status ?? o.status,
                  totalCommitted: ev.totalCommitted ?? o.totalCommitted,
                }
              : o
          )
        );
      } else {
        fetchOpen();
      }
    });
    return unsub;
  }, [communityId, fetchOpen]);

  async function handleJoin() {
    if (!joinTarget) return;
    setJoining(joinTarget.id);
    try {
      await groupOrderService.join(joinTarget.id, joinQty);
      setOrders((prev) => prev.map((o) => o.id === joinTarget.id ? { ...o, totalCommitted: o.totalCommitted + joinQty } : o));
      toast.success(`Joined! Committed ${joinQty} units`);
      setJoinTarget(null);
    } catch { toast.error("Failed to join group order"); }
    setJoining(null);
  }

  async function handleCreate() {
    if (!form.title || !form.itemName || !form.closesAt) { toast.error("Please fill all required fields"); return; }
    setCreating(true);
    try {
      const o = await groupOrderService.create({
        ...form,
        unitPrice: form.unitPrice ? Number(form.unitPrice) : undefined,
        minQuantity: Number(form.minQuantity),
        communityId,
      });
      setOrders((prev) => [o, ...prev]);
      setShowCreate(false);
      toast.success("Group order created!");
    } catch { toast.error("Failed to create group order"); }
    setCreating(false);
  }

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-7 h-7 animate-spin text-indigo-400" /></div>;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShoppingBasket className="w-6 h-6 text-indigo-600" />
          <h1 className="text-xl font-bold text-slate-800">Group Orders</h1>
        </div>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
          <Plus className="w-4 h-4" /> Create Group Buy
        </button>
      </div>

      <div className="flex border-b border-slate-200">
        <button onClick={() => setTab("open")} className={`px-4 py-2 text-sm font-medium ${tab === "open" ? "text-indigo-600 border-b-2 border-indigo-600" : "text-slate-500"}`}>Open Orders</button>
        <button onClick={() => setTab("mine")} className={`px-4 py-2 text-sm font-medium ${tab === "mine" ? "text-indigo-600 border-b-2 border-indigo-600" : "text-slate-500"}`}>My Orders</button>
      </div>

      {tab === "open" && (
        <>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setFilterCat("")} className={`px-3 py-1 rounded-full text-xs font-medium border ${filterCat === "" ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-slate-600 border-slate-300"}`}>All</button>
            {CATEGORIES.map((c) => <button key={c} onClick={() => setFilterCat(c)} className={`px-3 py-1 rounded-full text-xs font-medium border ${filterCat === c ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-slate-600 border-slate-300"}`}>{c}</button>)}
          </div>

          {orders.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <AlertCircle className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">No open group orders right now.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {orders.map((o) => (
                <div key={o.id} className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 hover:shadow-sm transition">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{o.category}</span>
                      <h3 className="font-semibold text-slate-800 mt-1">{o.title}</h3>
                      <p className="text-sm text-slate-500">{o.itemName}</p>
                    </div>
                    {o.unitPrice && <p className="text-sm font-bold text-indigo-700 shrink-0">₹{o.unitPrice}<span className="text-xs font-normal text-slate-400">/unit</span></p>}
                  </div>
                  <ProgressBar committed={o.totalCommitted} min={o.minQuantity} />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {o.organizer ?? "Community"}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /><CountdownBadge closesAt={o.closesAt} /></span>
                    </div>
                    <button onClick={() => { setJoinTarget(o); setJoinQty(1); }} disabled={joining === o.id} className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                      {joining === o.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Join"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === "mine" && (
        <div className="space-y-3">
          {myOrders.length === 0 ? (
            <p className="text-center text-slate-400 text-sm py-10">You haven't joined any group orders yet.</p>
          ) : myOrders.map(({ order, quantity, paymentStatus }) => (
            <div key={order.id} className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-700 truncate">{order.title}</p>
                <p className="text-xs text-slate-500">{order.itemName} · qty {quantity}</p>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${paymentStatus === "PAID" ? "bg-green-100 text-green-700" : paymentStatus === "REFUNDED" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}>
                {paymentStatus}
              </span>
              <CheckCircle2 className={`w-5 h-5 shrink-0 ${order.status === "FUNDED" ? "text-green-500" : "text-slate-300"}`} />
            </div>
          ))}
        </div>
      )}

      {/* Join modal */}
      {joinTarget && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) setJoinTarget(null); }}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-xs space-y-4 shadow-xl">
            <h2 className="font-bold text-slate-800">Join Group Order</h2>
            <p className="text-sm text-slate-600">{joinTarget.title}</p>
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">Quantity</label>
              <div className="flex items-center gap-3">
                <button onClick={() => setJoinQty((q) => Math.max(1, q - 1))} className="w-9 h-9 rounded-lg border border-slate-300 font-bold text-lg hover:bg-slate-50">−</button>
                <span className="text-xl font-bold w-10 text-center">{joinQty}</span>
                <button onClick={() => setJoinQty((q) => q + 1)} className="w-9 h-9 rounded-lg border border-slate-300 font-bold text-lg hover:bg-slate-50">+</button>
              </div>
              {joinTarget.unitPrice && <p className="text-xs text-slate-500 mt-1">Total: ₹{joinTarget.unitPrice * joinQty}</p>}
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setJoinTarget(null)} className="px-4 py-2 bg-slate-100 rounded-lg text-sm font-medium">Cancel</button>
              <button onClick={handleJoin} disabled={!!joining} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2">
                {joining ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) setShowCreate(false); }}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm space-y-4 shadow-xl">
            <h2 className="font-bold text-slate-800">Create Group Buy</h2>
            {(["title", "itemName", "unitPrice"] as const).map((f) => (
              <input key={f} value={form[f]} onChange={(e) => setForm((p) => ({ ...p, [f]: e.target.value }))} placeholder={{ title: "Title *", itemName: "Item name *", unitPrice: "Unit price (₹, optional)" }[f]} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            ))}
            <select value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <input type="number" min={1} value={form.minQuantity} onChange={(e) => setForm((p) => ({ ...p, minQuantity: e.target.value }))} placeholder="Min quantity *" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            <input type="datetime-local" value={form.closesAt} onChange={(e) => setForm((p) => ({ ...p, closesAt: e.target.value }))} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 bg-slate-100 rounded-lg text-sm font-medium">Cancel</button>
              <button onClick={handleCreate} disabled={creating} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2">
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
