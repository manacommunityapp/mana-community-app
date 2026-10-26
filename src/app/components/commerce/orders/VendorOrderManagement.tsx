import React, { useEffect, useState } from "react";
import {
  commerceOrderService,
  type CommerceOrderDto,
  type CommerceOrderStatus,
} from "../../../../services/commerce/commerceOrderService";

const STATUS_TABS: { value: CommerceOrderStatus | ""; label: string }[] = [
  { value: "", label: "All" },
  { value: "CONFIRMED", label: "New" },
  { value: "PROCESSING", label: "Processing" },
  { value: "READY_FOR_PICKUP", label: "Ready" },
  { value: "OUT_FOR_DELIVERY", label: "Dispatched" },
  { value: "DELIVERED", label: "Delivered" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
];

const STATUS_BADGE: Record<string, string> = {
  PENDING:            "bg-yellow-100 text-yellow-700",
  PAYMENT_AUTHORIZED: "bg-blue-100 text-blue-700",
  CONFIRMED:          "bg-blue-100 text-blue-800",
  PROCESSING:         "bg-indigo-100 text-indigo-700",
  READY_FOR_PICKUP:   "bg-teal-100 text-teal-700",
  OUT_FOR_DELIVERY:   "bg-orange-100 text-orange-700",
  DELIVERED:          "bg-green-100 text-green-700",
  COMPLETED:          "bg-green-200 text-green-800",
  CANCELLED:          "bg-red-100 text-red-700",
  REFUNDED:           "bg-gray-100 text-gray-600",
  DISPUTED:           "bg-amber-100 text-amber-700",
};

const NEXT_ACTIONS: Partial<Record<
  CommerceOrderStatus,
  { label: string; action: (n: string) => Promise<CommerceOrderDto>; color: string }
>> = {
  CONFIRMED: {
    label: "Start Processing",
    action: (n) => commerceOrderService.processOrder(n),
    color: "bg-indigo-600 hover:bg-indigo-700",
  },
  PROCESSING: {
    label: "Mark Ready",
    action: (n) => commerceOrderService.markReady(n),
    color: "bg-teal-600 hover:bg-teal-700",
  },
  READY_FOR_PICKUP: {
    label: "Dispatch",
    action: (n) => commerceOrderService.dispatchOrder(n),
    color: "bg-orange-500 hover:bg-orange-600",
  },
  OUT_FOR_DELIVERY: {
    label: "Mark Delivered",
    action: (n) => commerceOrderService.markDelivered(n),
    color: "bg-green-600 hover:bg-green-700",
  },
};

function Badge({ status }: { status: string }) {
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_BADGE[status] ?? "bg-gray-100 text-gray-600"}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

function OrderRow({
  order,
  onUpdated,
}: {
  order: CommerceOrderDto;
  onUpdated: () => void;
}) {
  const [acting, setActing] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const nextAction = NEXT_ACTIONS[order.status];

  const doAction = async () => {
    if (!nextAction) return;
    setActing(true);
    try {
      await nextAction.action(order.orderNumber);
      onUpdated();
    } finally {
      setActing(false);
    }
  };

  return (
    <>
      <tr
        className="hover:bg-gray-50 cursor-pointer transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        <td className="px-4 py-3 text-sm font-medium text-gray-800">{order.orderNumber}</td>
        <td className="px-4 py-3 text-sm text-gray-600">
          <div>{order.buyerName}</div>
          {order.buyerFlat && <div className="text-xs text-gray-400">Flat {order.buyerFlat}</div>}
        </td>
        <td className="px-4 py-3">
          <Badge status={order.status} />
        </td>
        <td className="px-4 py-3 text-sm text-gray-600">
          {order.items?.length ?? 0} item{order.items?.length !== 1 ? "s" : ""}
        </td>
        <td className="px-4 py-3 text-sm font-semibold text-gray-800">
          ₹{Number(order.totalAmount).toLocaleString("en-IN")}
        </td>
        <td className="px-4 py-3 text-xs text-gray-500">
          {new Date(order.createdAt).toLocaleDateString("en-IN", {
            day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
          })}
        </td>
        <td className="px-4 py-3">
          {nextAction && (
            <button
              onClick={(e) => { e.stopPropagation(); doAction(); }}
              disabled={acting}
              className={`text-xs font-medium text-white px-3 py-1.5 rounded-lg ${nextAction.color} disabled:opacity-50`}
            >
              {acting ? "…" : nextAction.label}
            </button>
          )}
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={7} className="px-4 pb-3 bg-gray-50">
            <div className="rounded-lg border border-gray-200 bg-white p-3 space-y-2">
              {order.items?.map((item, i) => (
                <div key={i} className="flex justify-between text-sm text-gray-700">
                  <span>{item.title} <span className="text-gray-400">× {item.quantity}</span></span>
                  <span>₹{Number(item.totalPrice).toLocaleString("en-IN")}</span>
                </div>
              ))}
              {order.deliveryAddress && (
                <p className="text-xs text-gray-500 mt-1">
                  📍 {order.deliveryAddress}
                </p>
              )}
              {order.notes && (
                <p className="text-xs text-blue-600 italic">Customer note: {order.notes}</p>
              )}
              {order.cancellationReason && (
                <p className="text-xs text-red-600">Cancelled: {order.cancellationReason}</p>
              )}
              {order.fulfillmentType && (
                <p className="text-xs text-gray-500">
                  Fulfillment: {order.fulfillmentType === "DELIVERY" ? "🚚 Home Delivery" : "📦 Pickup"}
                  {order.pickupSlot && ` · ${order.pickupSlot}`}
                </p>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export default function VendorOrderManagement() {
  const [orders, setOrders] = useState<CommerceOrderDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<CommerceOrderStatus | "">("");
  const [search, setSearch] = useState("");

  const load = () => {
    setLoading(true);
    commerceOrderService
      .getVendorOrders(tab || undefined)
      .then(setOrders)
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  };

  useEffect(load, [tab]);

  const filtered = orders.filter((o) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      o.orderNumber.toLowerCase().includes(q) ||
      (o.buyerName ?? "").toLowerCase().includes(q) ||
      (o.buyerFlat ?? "").toLowerCase().includes(q)
    );
  });

  // Order counts per status for tab badges
  const counts = orders.reduce<Record<string, number>>((acc, o) => {
    acc[o.status] = (acc[o.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-lg font-semibold text-gray-800">Order Management</h2>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by order no. or buyer…"
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 w-64"
        />
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {STATUS_TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              tab === t.value
                ? "bg-violet-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {t.label}
            {t.value && counts[t.value] ? (
              <span className="ml-1.5 rounded-full bg-white/20 px-1.5 py-0.5 text-[10px]">
                {counts[t.value]}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="py-12 text-center text-sm text-gray-400">Loading orders…</div>
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center text-sm text-gray-400">
          {orders.length === 0 ? "No orders yet." : "No orders match this filter."}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="min-w-full text-sm divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {["Order #", "Buyer", "Status", "Items", "Total", "Placed", "Action"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filtered.map((o) => (
                <OrderRow key={o.id} order={o} onUpdated={load} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
