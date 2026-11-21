import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router";
import { ArrowLeft, CheckCircle2, Circle, Loader2, Truck, XCircle } from "lucide-react";
import { fulfillmentService, type FulfillmentEvent, type FulfillmentEventType, type DeliveryAssignment } from "../../../../services/fulfillmentService";
import { stompClient } from "../../../../services/chat/stompClient";

const STEPS: FulfillmentEventType[] = [
  "PLACED",
  "CONFIRMED",
  "PREPARING",
  "READY",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
];

const STEP_LABELS: Record<FulfillmentEventType, { label: string; desc: string }> = {
  PLACED:           { label: "Order placed",         desc: "Your order has been received" },
  CONFIRMED:        { label: "Confirmed",             desc: "Seller has confirmed the order" },
  PREPARING:        { label: "Being prepared",        desc: "Your order is being prepared" },
  READY:            { label: "Ready",                 desc: "Order is ready for pickup/dispatch" },
  PICKED_UP:        { label: "Picked up",             desc: "Order picked up for delivery" },
  OUT_FOR_DELIVERY: { label: "Out for delivery",      desc: "On the way to you" },
  DELIVERED:        { label: "Delivered",             desc: "Order delivered successfully" },
  CANCELLED:        { label: "Cancelled",             desc: "Order has been cancelled" },
};

function stepIndex(status: FulfillmentEventType): number {
  const idx = STEPS.indexOf(status);
  return idx === -1 ? 0 : idx;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function OrderTrackingPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [timeline, setTimeline] = useState<FulfillmentEvent[]>([]);
  const [currentStatus, setCurrentStatus] = useState<FulfillmentEventType>("PLACED");
  const [delivery, setDelivery] = useState<DeliveryAssignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    if (!orderId) return;
    try {
      const [tl, status, da] = await Promise.all([
        fulfillmentService.getTimeline(orderId),
        fulfillmentService.getCurrentStatus(orderId),
        fulfillmentService.getDeliveryAssignment(orderId),
      ]);
      setTimeline(tl);
      setCurrentStatus(status);
      setDelivery(da);
      setError(null);
    } catch {
      setError("Could not load order status. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    load();
  }, [load]);

  // Real-time via WebSocket; fall back to polling
  useEffect(() => {
    if (!orderId) return;

    if (stompClient.connected) {
      const unsub = stompClient.subscribe(`/topic/orders/${orderId}/status`, (body: unknown) => {
        const data = body as { status?: FulfillmentEventType; event?: FulfillmentEvent };
        if (data.status) setCurrentStatus(data.status);
        if (data.event) setTimeline((prev) => [...prev, data.event!]);
        if (data.status === "OUT_FOR_DELIVERY" || data.status === "DELIVERED") {
          fulfillmentService.getDeliveryAssignment(orderId).then(setDelivery).catch(() => {});
        }
      });
      return unsub;
    } else {
      pollRef.current = setInterval(load, 15_000);
      return () => { if (pollRef.current) clearInterval(pollRef.current); };
    }
  }, [orderId, load]);

  const isCancelled = currentStatus === "CANCELLED";
  const activeIdx = stepIndex(currentStatus);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64 text-slate-500">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading order status…
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto p-4 sm:p-6">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-4"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <h1 className="text-xl font-bold text-slate-900 mb-1">Track Order</h1>
      <p className="text-sm text-slate-500 mb-6">Order #{orderId}</p>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
      )}

      {/* Delivery person banner */}
      {delivery && currentStatus === "OUT_FOR_DELIVERY" && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-3">
          <Truck className="w-5 h-5 text-blue-600 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-blue-900">
              {delivery.deliveryPersonName ?? "Delivery person"} is on the way
            </p>
            {delivery.deliveryPersonPhone && (
              <p className="text-xs text-blue-700 mt-0.5">{delivery.deliveryPersonPhone}</p>
            )}
            {delivery.estimatedArrival && (
              <p className="text-xs text-blue-600 mt-0.5">
                Estimated arrival: {delivery.estimatedArrival}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Stepper */}
      <div className="relative">
        {isCancelled ? (
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
            <XCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
            <div>
              <p className="font-semibold text-red-800">Order Cancelled</p>
              <p className="text-xs text-red-600 mt-0.5">
                {timeline.find((e) => e.eventType === "CANCELLED")
                  ? formatTime(timeline.find((e) => e.eventType === "CANCELLED")!.occurredAt)
                  : ""}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-0">
            {STEPS.map((step, idx) => {
              const done = idx <= activeIdx;
              const active = idx === activeIdx;
              const event = timeline.find((e) => e.eventType === step);
              const info = STEP_LABELS[step];

              return (
                <div key={step} className="flex gap-3">
                  {/* Line + circle */}
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                        done
                          ? "bg-emerald-500 border-emerald-500"
                          : "bg-white border-slate-200"
                      }`}
                    >
                      {done ? (
                        <CheckCircle2 className="w-4 h-4 text-white" />
                      ) : (
                        <Circle className="w-3 h-3 text-slate-300" />
                      )}
                    </div>
                    {idx < STEPS.length - 1 && (
                      <div
                        className={`w-0.5 flex-1 my-1 ${
                          idx < activeIdx ? "bg-emerald-400" : "bg-slate-100"
                        }`}
                        style={{ minHeight: 24 }}
                      />
                    )}
                  </div>

                  {/* Content */}
                  <div className={`pb-5 flex-1 ${idx === STEPS.length - 1 ? "pb-0" : ""}`}>
                    <p
                      className={`text-sm font-semibold leading-tight ${
                        active ? "text-emerald-700" : done ? "text-slate-800" : "text-slate-400"
                      }`}
                    >
                      {info.label}
                      {active && (
                        <span className="ml-2 text-xs font-normal text-emerald-500">● Live</span>
                      )}
                    </p>
                    <p className={`text-xs mt-0.5 ${done ? "text-slate-500" : "text-slate-300"}`}>
                      {event ? formatTime(event.occurredAt) : info.desc}
                    </p>
                    {event?.note && (
                      <p className="text-xs text-slate-500 mt-1 italic">{event.note}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
