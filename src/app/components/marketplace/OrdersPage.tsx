import { useState, useEffect } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  Package, ShoppingBag, Truck, CheckCircle, XCircle, Clock,
  Loader2, ChevronLeft, ChevronRight, ArrowRightLeft, ShieldCheck
} from "lucide-react";
import { orderService, type OrderResponse } from "../../../services/listingService";
import { useAuth } from "../../../contexts/AuthContext";
import { CREATE_LISTING } from "../../../constants/permissions";

function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(price);
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

const statusConfig: Record<string, { icon: typeof Clock; color: string; bg: string }> = {
  PENDING: { icon: Clock, color: "text-amber-600", bg: "bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800" },
  CONFIRMED: { icon: Package, color: "text-blue-600", bg: "bg-blue-50 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800" },
  DELIVERED: { icon: Truck, color: "text-violet-600", bg: "bg-violet-50 border-violet-200 dark:bg-violet-950/40 dark:text-violet-400 dark:border-violet-800" },
  COMPLETED: { icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800" },
  CANCELLED: { icon: XCircle, color: "text-rose-600", bg: "bg-rose-50 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800" },
};

export function OrdersPage() {
  const { hasPermission } = useAuth();
  const isSeller = hasPermission(CREATE_LISTING);
  const [tab, setTab] = useState<"buying" | "selling">("buying");
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    setLoading(true);
    const fetch = tab === "buying" ? orderService.getMyOrders(page) : orderService.getSellerOrders(page);
    fetch
      .then((data) => {
        setOrders(data.content);
        setTotalPages(data.totalPages);
      })
      .catch(() => { setOrders([]); setTotalPages(0); })
      .finally(() => setLoading(false));
  }, [tab, page]);

  const handleStatusUpdate = async (orderId: number, status: string) => {
    try {
      const updated = await orderService.updateStatus(orderId, status);
      setOrders((prev) => prev.map((o) => o.id === orderId ? updated : o));
    } catch {}
  };

  const handleCancel = async (orderId: number) => {
    if (!confirm("Cancel this order?")) return;
    try {
      await orderService.cancel(orderId);
      setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: "CANCELLED" } : o));
    } catch {}
  };

  return (
    <div className="space-y-4 text-slate-900 dark:text-white">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
          <ShoppingBag className="w-5 h-5 text-indigo-600" /> Orders History
        </h2>
        {isSeller && (
          <div className="flex bg-slate-100 dark:bg-[#262644] rounded-xl p-1 border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => { setTab("buying"); setPage(0); }}
              className={cn("px-4 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer", tab === "buying" ? "bg-white dark:bg-[#1E1E36] text-indigo-600 dark:text-indigo-400 shadow-sm" : "text-slate-500")}
            >
              My Purchases
            </button>
            <button
              onClick={() => { setTab("selling"); setPage(0); }}
              className={cn("px-4 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer", tab === "selling" ? "bg-white dark:bg-[#1E1E36] text-indigo-600 dark:text-indigo-400 shadow-sm" : "text-slate-500")}
            >
              Sales Orders
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-[#1E1E36] rounded-3xl border border-slate-200 dark:border-slate-800 text-center p-6">
          <Package className="w-12 h-12 text-slate-300 mb-3" />
          <p className="text-slate-700 dark:text-slate-300 font-bold text-sm">No orders found</p>
          <p className="text-slate-400 text-xs mt-1">Orders placed or received will appear here with live tracking.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const statusInfo = statusConfig[order.status] || statusConfig.PENDING;
            const StatusIcon = statusInfo.icon;
            const firstItem = order.items?.[0];

            return (
              <div key={order.id} className="bg-white dark:bg-[#1E1E36] rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div>
                    <span className="text-xs font-black text-slate-900 dark:text-white">Order #{order.orderNumber || order.id}</span>
                    <span className="text-[10px] text-slate-400 ml-2">Placed {timeAgo(order.createdAt)}</span>
                  </div>
                  <div className={cn("inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold w-fit", statusInfo.bg, statusInfo.color)}>
                    <StatusIcon className="w-3.5 h-3.5" />
                    {order.status}
                  </div>
                </div>

                {/* Timeline Step-by-Step Step Tracker */}
                <div className="py-2">
                  <div className="grid grid-cols-4 gap-2 text-center relative">
                    <div className={cn("flex flex-col items-center space-y-1 z-10", ["PENDING", "CONFIRMED", "DELIVERED", "COMPLETED"].includes(order.status) ? "text-indigo-600 dark:text-indigo-400" : "text-slate-300")}>
                      <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-950/60 border-2 border-indigo-600 flex items-center justify-center font-bold text-[10px]">1</div>
                      <span className="text-[10px] font-bold">Placed</span>
                    </div>
                    <div className={cn("flex flex-col items-center space-y-1 z-10", ["CONFIRMED", "DELIVERED", "COMPLETED"].includes(order.status) ? "text-indigo-600 dark:text-indigo-400" : "text-slate-300")}>
                      <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-950/60 border-2 border-indigo-600 flex items-center justify-center font-bold text-[10px]">2</div>
                      <span className="text-[10px] font-bold">Confirmed</span>
                    </div>
                    <div className={cn("flex flex-col items-center space-y-1 z-10", ["DELIVERED", "COMPLETED"].includes(order.status) ? "text-indigo-600 dark:text-indigo-400" : "text-slate-300")}>
                      <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-950/60 border-2 border-indigo-600 flex items-center justify-center font-bold text-[10px]">3</div>
                      <span className="text-[10px] font-bold">In Transit</span>
                    </div>
                    <div className={cn("flex flex-col items-center space-y-1 z-10", order.status === "COMPLETED" ? "text-emerald-600" : "text-slate-300")}>
                      <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950/60 border-2 border-emerald-600 flex items-center justify-center font-bold text-[10px]">4</div>
                      <span className="text-[10px] font-bold">Delivered</span>
                    </div>
                  </div>
                </div>

                {/* Details */}
                <div className="flex items-center justify-between bg-slate-50 dark:bg-[#262644] p-3 rounded-2xl">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">{firstItem?.listingTitle || "Marketplace Product"}</h4>
                    <p className="text-[10px] text-slate-400">Qty: {firstItem?.quantity || 1}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-indigo-600 dark:text-indigo-400">{formatPrice(order.totalAmount)}</p>
                    <p className="text-[10px] text-slate-400">{tab === "buying" ? `Seller: ${order.seller?.fullName || "Neighbor"}` : `Buyer: ${order.buyer?.fullName || "Neighbor"}`}</p>
                  </div>
                </div>

                {/* Seller Status Controllers */}
                {tab === "selling" && order.status !== "COMPLETED" && order.status !== "CANCELLED" && (
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    {order.status === "PENDING" && (
                      <button onClick={() => handleStatusUpdate(order.id, "CONFIRMED")} className="px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-xl cursor-pointer">
                        Confirm Order
                      </button>
                    )}
                    {order.status === "CONFIRMED" && (
                      <button onClick={() => handleStatusUpdate(order.id, "DELIVERED")} className="px-3 py-1.5 bg-violet-600 text-white text-xs font-bold rounded-xl cursor-pointer">
                        Mark Dispatched
                      </button>
                    )}
                    {order.status === "DELIVERED" && (
                      <button onClick={() => handleStatusUpdate(order.id, "COMPLETED")} className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-xl cursor-pointer">
                        Complete Order
                      </button>
                    )}
                    <button onClick={() => handleCancel(order.id)} className="px-3 py-1.5 bg-rose-50 text-rose-600 text-xs font-bold rounded-xl cursor-pointer">
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
