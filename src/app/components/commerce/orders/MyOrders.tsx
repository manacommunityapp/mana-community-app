import React, { useEffect, useState } from "react";
import {
  commerceOrderService,
  type CommerceOrderDto,
  type CommerceOrderStatus,
} from "../../../../services/commerce/commerceOrderService";
import CheckoutPayment from "./CheckoutPayment";
import CommerceInvoice from "./CommerceInvoice";

// ── Status metadata ────────────────────────────────────────────────────────

const STATUS_META: Record<
  CommerceOrderStatus,
  { label: string; color: string; step: number }
> = {
  PENDING:            { label: "Pending",           color: "text-yellow-600 bg-yellow-50 border-yellow-200",  step: 0 },
  PAYMENT_AUTHORIZED: { label: "Payment Auth",      color: "text-blue-600 bg-blue-50 border-blue-200",        step: 1 },
  CONFIRMED:          { label: "Confirmed",         color: "text-blue-700 bg-blue-50 border-blue-200",        step: 2 },
  PROCESSING:         { label: "Processing",        color: "text-indigo-600 bg-indigo-50 border-indigo-200",  step: 3 },
  ALLOCATED:          { label: "Allocated",         color: "text-indigo-700 bg-indigo-50 border-indigo-200",  step: 3 },
  PICKED:             { label: "Picked",            color: "text-indigo-700 bg-indigo-50 border-indigo-200",  step: 3 },
  READY_FOR_PICKUP:   { label: "Ready for Pickup",  color: "text-teal-700 bg-teal-50 border-teal-200",        step: 4 },
  OUT_FOR_DELIVERY:   { label: "Out for Delivery",  color: "text-orange-600 bg-orange-50 border-orange-200",  step: 5 },
  DELIVERED:          { label: "Delivered",         color: "text-green-600 bg-green-50 border-green-200",     step: 6 },
  COMPLETED:          { label: "Completed",         color: "text-green-700 bg-green-50 border-green-200",     step: 7 },
  CANCELLED:          { label: "Cancelled",         color: "text-red-600 bg-red-50 border-red-200",           step: -1 },
  REFUNDED:           { label: "Refunded",          color: "text-gray-600 bg-gray-50 border-gray-200",        step: -1 },
  DISPUTED:           { label: "Disputed",          color: "text-amber-700 bg-amber-50 border-amber-200",     step: -1 },
};

const TIMELINE_STEPS = [
  { step: 2, label: "Confirmed" },
  { step: 3, label: "Processing" },
  { step: 4, label: "Ready" },
  { step: 5, label: "Dispatched" },
  { step: 6, label: "Delivered" },
];

function StatusBadge({ status }: { status: CommerceOrderStatus }) {
  const meta = STATUS_META[status] ?? { label: status, color: "text-gray-600 bg-gray-50 border-gray-200" };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${meta.color}`}>
      {meta.label}
    </span>
  );
}

function OrderTimeline({ status }: { status: CommerceOrderStatus }) {
  const currentStep = STATUS_META[status]?.step ?? 0;
  if (currentStep < 0) return null;

  return (
    <div className="flex items-center gap-1 mt-2">
      {TIMELINE_STEPS.map((s, idx) => {
        const done = currentStep >= s.step;
        const active = currentStep === s.step;
        return (
          <React.Fragment key={s.step}>
            <div className="flex flex-col items-center">
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-xs ${
                  done
                    ? "bg-violet-600 border-violet-600 text-white"
                    : "bg-white border-gray-300 text-gray-400"
                } ${active ? "ring-2 ring-violet-300" : ""}`}
              >
                {done ? "✓" : ""}
              </div>
              <span className={`text-[10px] mt-0.5 ${done ? "text-violet-700 font-medium" : "text-gray-400"}`}>
                {s.label}
              </span>
            </div>
            {idx < TIMELINE_STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mt-[-12px] ${currentStep > s.step ? "bg-violet-600" : "bg-gray-200"}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function OrderCard({
  order,
  onCancel,
  onRefresh,
}: {
  order: CommerceOrderDto;
  onCancel: (orderNumber: string) => void;
  onRefresh: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);
  const canCancel = ["PENDING", "CONFIRMED"].includes(order.status);
  const canPay = order.status === "PENDING";
  const isCompleted = order.status === "COMPLETED";

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <div
        className="flex items-start justify-between p-4 cursor-pointer hover:bg-gray-50"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-800">{order.orderNumber}</span>
            <StatusBadge status={order.status} />
          </div>
          <div className="text-xs text-gray-500">
            {order.vendorName && <span className="mr-2">🏪 {order.vendorName}</span>}
            <span>{order.items?.length ?? 0} item{order.items?.length !== 1 ? "s" : ""}</span>
            {order.createdAt && (
              <span className="ml-2">
                · {new Date(order.createdAt).toLocaleDateString("en-IN", {
                  day: "numeric", month: "short", year: "numeric",
                })}
              </span>
            )}
          </div>
          <OrderTimeline status={order.status} />
        </div>
        <div className="text-right ml-4 shrink-0">
          <div className="text-sm font-bold text-gray-800">
            ₹{Number(order.totalAmount).toLocaleString("en-IN")}
          </div>
          <div className="text-xs text-gray-400 mt-0.5">
            {order.fulfillmentType === "DELIVERY" ? "🚚 Delivery" : "📦 Pickup"}
          </div>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-gray-100 p-4 space-y-3 bg-gray-50">
          {/* Items */}
          <div className="space-y-2">
            {order.items?.map((item, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  {item.imageUrl && (
                    <img src={item.imageUrl} alt={item.title} className="w-8 h-8 rounded object-cover border border-gray-200" />
                  )}
                  <span className="text-gray-700">{item.title}</span>
                  <span className="text-gray-400">× {item.quantity}</span>
                </div>
                <span className="font-medium text-gray-700">₹{Number(item.totalPrice).toLocaleString("en-IN")}</span>
              </div>
            ))}
          </div>

          {/* Price breakdown */}
          <div className="rounded-lg bg-white border border-gray-200 p-3 text-xs space-y-1">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>₹{Number(order.subtotalAmount).toLocaleString("en-IN")}</span>
            </div>
            {Number(order.discountAmount) > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount</span>
                <span>−₹{Number(order.discountAmount).toLocaleString("en-IN")}</span>
              </div>
            )}
            {Number(order.deliveryFee) > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>Delivery</span>
                <span>₹{Number(order.deliveryFee).toLocaleString("en-IN")}</span>
              </div>
            )}
            <div className="flex justify-between font-semibold text-gray-800 border-t border-gray-100 pt-1">
              <span>Total</span>
              <span>₹{Number(order.totalAmount).toLocaleString("en-IN")}</span>
            </div>
          </div>

          {/* OTP for pickup */}
          {order.handoverOtp && order.status !== "COMPLETED" && (
            <div className="rounded-lg bg-violet-50 border border-violet-200 p-3 flex items-center gap-3">
              <div>
                <p className="text-xs font-semibold text-violet-700">Handover OTP</p>
                <p className="text-2xl font-bold text-violet-800 tracking-widest">{order.handoverOtp}</p>
                <p className="text-xs text-violet-500">Show this to the seller at pickup</p>
              </div>
            </div>
          )}

          {/* Cancellation reason */}
          {order.cancellationReason && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
              <span className="font-semibold">Cancellation reason: </span>{order.cancellationReason}
            </div>
          )}

          {/* Vendor notes */}
          {order.vendorNotes && (
            <div className="text-xs text-gray-500 italic">Vendor note: {order.vendorNotes}</div>
          )}

          {/* Payment section */}
          {canPay && (
            <div>
              {showPayment ? (
                <CheckoutPayment
                  order={order}
                  onSuccess={() => { setShowPayment(false); onRefresh(); }}
                  onDismiss={() => setShowPayment(false)}
                  onError={() => setShowPayment(false)}
                />
              ) : (
                <button
                  onClick={(e) => { e.stopPropagation(); setShowPayment(true); }}
                  className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold text-sm"
                >
                  Pay ₹{Number(order.totalAmount).toLocaleString("en-IN")}
                </button>
              )}
            </div>
          )}

          {/* Invoice section for completed orders */}
          {isCompleted && (
            <div>
              <button
                onClick={(e) => { e.stopPropagation(); setShowInvoice((v) => !v); }}
                className="text-xs font-medium text-violet-700 border border-violet-200 rounded px-3 py-1.5 hover:bg-violet-50"
              >
                {showInvoice ? "Hide Invoice" : "View Invoice"}
              </button>
              {showInvoice && (
                <div className="mt-3">
                  <CommerceInvoice orderNumber={order.orderNumber} />
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          {canCancel && (
            <div className="flex gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCancel(order.orderNumber);
                }}
                className="text-xs font-medium text-red-600 hover:text-red-800 border border-red-200 rounded px-3 py-1.5 hover:bg-red-50"
              >
                Cancel Order
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function MyOrders() {
  const [orders, setOrders] = useState<CommerceOrderDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<CommerceOrderStatus | "">("");

  const load = () => {
    setLoading(true);
    commerceOrderService
      .getMyOrders()
      .then(setOrders)
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleCancel = async (orderNumber: string) => {
    const reason = window.prompt("Reason for cancellation (optional):") ?? "Cancelled by customer";
    await commerceOrderService.cancelOrder(orderNumber, reason);
    load();
  };

  const filtered = filter ? orders.filter((o) => o.status === filter) : orders;

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">My Orders</h2>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as CommerceOrderStatus | "")}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
        >
          <option value="">All Orders</option>
          {(Object.keys(STATUS_META) as CommerceOrderStatus[]).map((s) => (
            <option key={s} value={s}>{STATUS_META[s].label}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="py-16 text-center text-sm text-gray-400">Loading your orders…</div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center text-sm text-gray-400">
          {orders.length === 0 ? "No orders yet." : "No orders match this filter."}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((o) => (
            <OrderCard key={o.id} order={o} onCancel={handleCancel} onRefresh={load} />
          ))}
        </div>
      )}
    </div>
  );
}
