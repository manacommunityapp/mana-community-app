import { useCallback, useEffect, useState } from "react";
import { RefreshCw, ShoppingBag, Truck } from "lucide-react";
import { toast } from "sonner";
import { foodGroceryService } from "../../../../services/food/foodGroceryService";
import type { GroceryOrder } from "../../../../types/food";

const NEXT_STATUS: Record<string, { value: string; label: string }> = {
  PLACED: { value: "CONFIRMED", label: "Accept order" },
  CONFIRMED: { value: "PACKING", label: "Start packing" },
  PACKING: { value: "OUT_FOR_DELIVERY", label: "Dispatch" },
  OUT_FOR_DELIVERY: { value: "DELIVERED", label: "Mark delivered" },
};

export function VendorGroceryOrders() {
  const [orders, setOrders] = useState<GroceryOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingOrderId, setUpdatingOrderId] = useState<number | null>(null);
  const [error, setError] = useState("");

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const page = await foodGroceryService.getVendorGroceryOrders(0, 100);
      setOrders(page.content ?? []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load grocery orders.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadOrders(); }, [loadOrders]);

  const advanceOrder = async (order: GroceryOrder) => {
    const next = NEXT_STATUS[order.status];
    if (!next) return;
    setUpdatingOrderId(order.id);
    try {
      await foodGroceryService.updateVendorGroceryOrderStatus(order.id, next.value);
      toast.success(`Order ${order.orderNumber} updated.`);
      await loadOrders();
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Could not update this order.");
    } finally {
      setUpdatingOrderId(null);
    }
  };

  return (
    <section className="space-y-5">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-black text-slate-900"><ShoppingBag className="h-5 w-5 text-indigo-600" />Grocery Orders</h1>
          <p className="mt-1 text-sm text-slate-500">Review and fulfil orders placed with your grocery store.</p>
        </div>
        <button onClick={() => void loadOrders()} disabled={loading} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 disabled:opacity-50">
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />Refresh
        </button>
      </header>

      {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">Loading grocery orders…</div>
      ) : orders.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">No grocery orders for your store yet.</div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const next = NEXT_STATUS[order.status];
            return (
              <article key={order.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-bold text-slate-900">{order.orderNumber}</h2>
                      <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700">{order.status.replaceAll("_", " ")}</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{order.createdAt ? new Date(order.createdAt).toLocaleString("en-IN") : ""}</p>
                  </div>
                  <div className="text-right">
                    <div className="font-black text-slate-900">₹{Number(order.totalAmount).toLocaleString("en-IN")}</div>
                    {order.deliverySlot && <p className="mt-1 inline-flex items-center gap-1 text-xs text-slate-500"><Truck className="h-3.5 w-3.5" />{new Date(order.deliverySlot).toLocaleString("en-IN")}</p>}
                  </div>
                </div>

                <div className="mt-3 space-y-1 border-t border-slate-100 pt-3">
                  {(order.items ?? []).map((item) => (
                    <div key={item.id} className="flex justify-between gap-4 text-sm text-slate-700">
                      <span>{item.productName} <span className="text-slate-400">× {item.quantity}</span></span>
                      <span className="font-semibold">₹{Number(item.totalPrice).toLocaleString("en-IN")}</span>
                    </div>
                  ))}
                </div>

                {order.deliveryAddress && <p className="mt-3 text-xs text-slate-500">Delivery address: {order.deliveryAddress}</p>}
                {next && (
                  <div className="mt-3 flex justify-end">
                    <button onClick={() => void advanceOrder(order)} disabled={updatingOrderId === order.id} className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-50">
                      {updatingOrderId === order.id ? "Saving…" : next.label}
                    </button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
