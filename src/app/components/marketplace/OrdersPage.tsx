import { useState, useEffect } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  Package, ShoppingBag, Truck, CheckCircle, XCircle, Clock,
  Loader2, ChevronLeft, ChevronRight, ArrowRightLeft
} from "lucide-react";
import { orderService, type OrderResponse } from "../../../services/listingService";
import { useAuth } from "../../../contexts/AuthContext";
import { CREATE_LISTING } from "../../../constants/permissions";
import type { PaginatedResponse } from "../../../types/api";

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
  PENDING: { icon: Clock, color: "text-amber-600", bg: "bg-amber-50 border-amber-200" },
  CONFIRMED: { icon: Package, color: "text-blue-600", bg: "bg-blue-50 border-blue-200" },
  DELIVERED: { icon: Truck, color: "text-violet-600", bg: "bg-violet-50 border-violet-200" },
  COMPLETED: { icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200" },
  CANCELLED: { icon: XCircle, color: "text-red-600", bg: "bg-red-50 border-red-200" },
};

export function OrdersPage() {
  const { hasPermission, user } = useAuth();
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
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-black text-[#0d0d2b]">Orders</h2>
        {isSeller && (
          <div className="flex bg-slate-100 rounded-lg p-0.5">
            <button
              onClick={() => { setTab("buying"); setPage(0); }}
              className={cn("px-4 py-1.5 text-sm font-semibold rounded-md transition-all cursor-pointer", tab === "buying" ? "bg-white text-[#0d0d2b] shadow-sm" : "text-[#6b7094]")}
            >
              Buying
            </button>
            <button
              onClick={() => { setTab("selling"); setPage(0); }}
              className={cn("px-4 py-1.5 text-sm font-semibold rounded-md transition-all cursor-pointer", tab === "selling" ? "bg-white text-[#0d0d2b] shadow-sm" : "text-[#6b7094]")}
            >
              Selling
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Package className="w-12 h-12 text-slate-300 mb-3" />
          <p className="text-[#6b7094] text-sm font-medium">No orders yet</p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {orders.map((order) => {
              const sc = statusConfig[order.status] || statusConfig.PENDING;
              const StatusIcon = sc.icon;
              const isBuyer = user?.userId && Number(user.userId) === order.buyer.id;
              return (
                <div key={order.id} className="bg-white rounded-2xl border border-slate-200 p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono text-[#6b7094]">#{order.orderNumber}</span>
                      <span className={cn("flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border", sc.bg)}>
                        <StatusIcon className={cn("w-3 h-3", sc.color)} />
                        {order.status}
                      </span>
                    </div>
                    <span className="text-xs text-[#6b7094]">{timeAgo(order.createdAt)}</span>
                  </div>

                  {/* Items */}
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 py-2">
                      <div className="w-14 h-14 rounded-lg bg-slate-50 overflow-hidden flex-shrink-0">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.listingTitle} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ShoppingBag className="w-5 h-5 text-slate-300" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[#0d0d2b] truncate">{item.listingTitle}</p>
                        <p className="text-xs text-[#6b7094]">Qty: {item.quantity} × {formatPrice(item.unitPrice)}</p>
                      </div>
                    </div>
                  ))}

                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                    <div className="text-sm">
                      <span className="text-[#6b7094]">{isBuyer ? "Seller" : "Buyer"}: </span>
                      <span className="font-semibold text-[#0d0d2b]">{isBuyer ? order.seller.fullName : order.buyer.fullName}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-black text-[#0d0d2b]">{formatPrice(order.totalAmount)}</span>
                      {/* Status actions */}
                      {tab === "selling" && order.status === "PENDING" && (
                        <button onClick={() => handleStatusUpdate(order.id, "CONFIRMED")} className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg cursor-pointer">
                          Confirm
                        </button>
                      )}
                      {tab === "selling" && order.status === "CONFIRMED" && (
                        <button onClick={() => handleStatusUpdate(order.id, "DELIVERED")} className="px-3 py-1.5 bg-violet-600 text-white text-xs font-bold rounded-lg cursor-pointer">
                          Mark Delivered
                        </button>
                      )}
                      {tab === "buying" && order.status === "DELIVERED" && (
                        <button onClick={() => handleStatusUpdate(order.id, "COMPLETED")} className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg cursor-pointer">
                          Complete
                        </button>
                      )}
                      {(order.status === "PENDING" || order.status === "CONFIRMED") && (
                        <button onClick={() => handleCancel(order.id)} className="px-3 py-1.5 text-red-600 bg-red-50 text-xs font-bold rounded-lg cursor-pointer">
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-8">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-[#6b7094] bg-white border border-slate-200 rounded-lg disabled:opacity-40 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>
              <span className="text-sm text-[#6b7094]">
                Page <span className="font-bold text-[#0d0d2b]">{page + 1}</span> of <span className="font-bold text-[#0d0d2b]">{totalPages}</span>
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-[#6b7094] bg-white border border-slate-200 rounded-lg disabled:opacity-40 cursor-pointer"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
