import { useState, useEffect, useCallback } from "react";
import {
  ShoppingCart, Clock, CheckCircle, Truck, XCircle, ChefHat,
  Package, Star, RotateCcw, Ban, AlertCircle, Sparkles, Copy, X
} from "lucide-react";
import { toast } from "react-toastify";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Skeleton } from "../ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { Input } from "../ui/input";
import { foodOrderService } from "../../../services/food/foodOrderService";
import type { FoodOrder, FoodOrderRating } from "../../../types/food";
import { WorkflowTransitionPanel } from "../workflow/WorkflowTransitionPanel";
import {
  automationService,
  type KitchenPrepDelayAuditResponse
} from "../../../services/automation/automationService";

const statusSteps = ["PLACED", "CONFIRMED", "PREPARING", "READY", "OUT_FOR_DELIVERY", "DELIVERED"];

const statusConfig: Record<string, { icon: typeof Clock; color: string; bg: string }> = {
  PLACED: { icon: Clock, color: "text-yellow-600", bg: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" },
  CONFIRMED: { icon: CheckCircle, color: "text-blue-600", bg: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  PREPARING: { icon: ChefHat, color: "text-purple-600", bg: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
  READY: { icon: Package, color: "text-cyan-600", bg: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400" },
  OUT_FOR_DELIVERY: { icon: Truck, color: "text-orange-600", bg: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" },
  DELIVERED: { icon: CheckCircle, color: "text-green-600", bg: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  CANCELLED: { icon: XCircle, color: "text-red-600", bg: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
  REFUNDED: { icon: RotateCcw, color: "text-slate-600", bg: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400" },
};

function formatPrice(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function FoodOrders() {
  const [cancelDialog, setCancelDialog] = useState<FoodOrder | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [rateDialog, setRateDialog] = useState<FoodOrder | null>(null);
  const [selectedRating, setSelectedRating] = useState(0);
  const [ratingComment, setRatingComment] = useState("");
  const [orders, setOrders] = useState<FoodOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isRating, setIsRating] = useState(false);
  const [isAuditingDelay, setIsAuditingDelay] = useState(false);
  const [delayAuditResult, setDelayAuditResult] = useState<KitchenPrepDelayAuditResponse | null>(null);
  const [showDelayModal, setShowDelayModal] = useState(false);

  const handleAuditKitchenDelay = async (order: FoodOrder) => {
    setIsAuditingDelay(true);
    try {
      const res = await automationService.auditKitchenPrepDelay({
        orderId: String(order.id),
        restaurantName: order.providerName || "Kitchen",
        items: order.items?.map(it => ({ name: it.itemName, quantity: it.quantity, prepComplexity: "MEDIUM" })),
        activeKitchenQueueCount: 8,
        riderArrivalEtaMinutes: 12
      });
      setDelayAuditResult(res);
      setShowDelayModal(true);
      toast.success("AI Kitchen status analyzed!");
    } catch {
      toast.error("Failed to check kitchen prep status.");
    } finally {
      setIsAuditingDelay(false);
    }
  };

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const res = await foodOrderService.getMyOrders();
      setOrders(res?.content ?? []);
    } catch {
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleCancel = async () => {
    if (!cancelDialog) return;
    setIsCancelling(true);
    try {
      await foodOrderService.cancelOrder(cancelDialog.id, cancelReason);
      setCancelDialog(null);
      setCancelReason("");
      fetchOrders();
    } catch (err) {
      console.error("Failed to cancel order:", err);
    } finally {
      setIsCancelling(false);
    }
  };

  const handleRate = async () => {
    if (!rateDialog) return;
    setIsRating(true);
    try {
      await foodOrderService.rateOrder(rateDialog.id, {
        overallRating: selectedRating,
        foodRating: selectedRating,
        reviewText: ratingComment,
      } as unknown as FoodOrderRating);
      setRateDialog(null);
      setSelectedRating(0);
      setRatingComment("");
      fetchOrders();
    } catch (err) {
      console.error("Failed to rate order:", err);
    } finally {
      setIsRating(false);
    }
  };

  const activeOrders = orders.filter((o) => ["PLACED", "CONFIRMED", "PREPARING", "READY", "OUT_FOR_DELIVERY"].includes(o.status));
  const pastOrders = orders.filter((o) => o.status === "DELIVERED");
  const cancelledOrders = orders.filter((o) => o.status === "CANCELLED");

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64 rounded-lg" />
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-16 text-slate-400">
        <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-40" />
        <p className="font-medium">Could not load orders</p>
        <Button variant="outline" size="sm" className="mt-4" onClick={() => fetchOrders()}>
          Retry
        </Button>
      </div>
    );
  }

  function renderOrderCard(order: FoodOrder) {
    const status = statusConfig[order.status] ?? statusConfig.PLACED;
    const StatusIcon = status.icon;
    const currentStepIndex = statusSteps.indexOf(order.status);
    const isActive = ["PLACED", "CONFIRMED", "PREPARING", "READY", "OUT_FOR_DELIVERY"].includes(order.status);
    const canCancel = ["PLACED", "CONFIRMED"].includes(order.status);

    return (
      <Card key={order.id} className="border-0 shadow-sm hover:shadow-md transition-all">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-sm">{order.providerName}</h4>
                <Badge className={`text-[10px] border-0 ${status.bg}`}>
                  <StatusIcon className="w-3 h-3 mr-1" />
                  {order.status.replace(/_/g, " ")}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {order.orderNumber} | {formatDate(order.placedAt)}
              </p>
            </div>
            <p className="text-lg font-bold">{formatPrice(order.totalAmount)}</p>
          </div>

          {/* Items */}
          <div className="space-y-1 mb-4">
            {order.items?.map((item) => (
              <div key={item.id} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-sm border ${item.isVeg ? "border-green-600" : "border-red-600"} flex items-center justify-center`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${item.isVeg ? "bg-green-600" : "bg-red-600"}`} />
                  </span>
                  {item.itemName} x{item.quantity}
                </span>
                <span className="text-slate-500">{formatPrice(item.totalPrice)}</span>
              </div>
            ))}
          </div>

          {/* Status Timeline (active orders only) */}
          {isActive && (
            <div className="mb-4">
              <div className="flex items-center gap-1">
                {statusSteps.map((step, i) => {
                  const isCompleted = i <= currentStepIndex;
                  const isCurrent = i === currentStepIndex;
                  return (
                    <div key={step} className="flex items-center flex-1">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${isCompleted ? "bg-orange-600 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-400"} ${isCurrent ? "ring-2 ring-orange-300 dark:ring-orange-800" : ""}`}>
                        {isCompleted ? <CheckCircle className="w-3.5 h-3.5" /> : i + 1}
                      </div>
                      {i < statusSteps.length - 1 && (
                        <div className={`flex-1 h-0.5 mx-1 ${i < currentStepIndex ? "bg-orange-600" : "bg-slate-200 dark:bg-slate-700"}`} />
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between mt-1">
                {statusSteps.map((step) => (
                  <span key={step} className="text-[9px] text-slate-400 text-center flex-1">
                    {step.replace(/_/g, " ").split(" ").map(w => w[0] + w.slice(1).toLowerCase()).join(" ")}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            {isActive && (
              <Button
                variant="outline" size="sm"
                className="text-indigo-600 border-indigo-200 hover:bg-indigo-50 dark:text-indigo-400 dark:border-indigo-800"
                onClick={() => handleAuditKitchenDelay(order)}
                disabled={isAuditingDelay}
              >
                <Sparkles className={`w-3 h-3 mr-1 ${isAuditingDelay ? "animate-spin text-indigo-500" : "text-indigo-600"}`} />
                AI Kitchen Status
              </Button>
            )}
            {canCancel && (
              <Button
                variant="outline" size="sm"
                className="text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-800"
                onClick={() => { setCancelDialog(order); setCancelReason(""); }}
              >
                <Ban className="w-3 h-3 mr-1" /> Cancel
              </Button>
            )}
            {order.status === "DELIVERED" && !order.rating && (
              <Button
                variant="outline" size="sm"
                className="text-amber-600 border-amber-200 hover:bg-amber-50 dark:text-amber-400"
                onClick={() => { setRateDialog(order); setSelectedRating(0); setRatingComment(""); }}
              >
                <Star className="w-3 h-3 mr-1" /> Rate Order
              </Button>
            )}
            {order.status === "DELIVERED" && (
              <Button variant="outline" size="sm" className="text-orange-600 border-orange-200 hover:bg-orange-50 dark:text-orange-400">
                <RotateCcw className="w-3 h-3 mr-1" /> Reorder
              </Button>
            )}
          </div>

          {/* Workflow status transitions */}
          <div className="mt-4">
            <WorkflowTransitionPanel
              workflowId="ORDER"
              entityId={String(order.id)}
              currentStatus={order.status}
              onStatusChanged={(s) =>
                setOrders((prev) =>
                  prev.map((x) => (x.id === order.id ? { ...x, status: s as typeof order.status } : x))
                )
              }
              compact
            />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">My Orders</h2>

      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">Active ({activeOrders.length})</TabsTrigger>
          <TabsTrigger value="past">Past ({pastOrders.length})</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled ({cancelledOrders.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-4 space-y-4">
          {activeOrders.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p className="font-medium">No active orders</p>
            </div>
          ) : activeOrders.map(renderOrderCard)}
        </TabsContent>

        <TabsContent value="past" className="mt-4 space-y-4">
          {pastOrders.length === 0 ? (
            <div className="text-center py-16 text-slate-400"><p>No past orders</p></div>
          ) : pastOrders.map(renderOrderCard)}
        </TabsContent>

        <TabsContent value="cancelled" className="mt-4 space-y-4">
          {cancelledOrders.length === 0 ? (
            <div className="text-center py-16 text-slate-400"><p>No cancelled orders</p></div>
          ) : cancelledOrders.map(renderOrderCard)}
        </TabsContent>
      </Tabs>

      {/* Cancel Dialog */}
      <Dialog open={!!cancelDialog} onOpenChange={(open) => { if (!open) { setCancelDialog(null); setCancelReason(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Order</DialogTitle>
            <DialogDescription>Cancel order {cancelDialog?.orderNumber}? This cannot be undone.</DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Input placeholder="Reason (optional)" value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setCancelDialog(null); setCancelReason(""); }}>Keep Order</Button>
            <Button
              variant="destructive"
              disabled={isCancelling}
              onClick={handleCancel}
            >
              {isCancelling ? "Cancelling…" : "Cancel Order"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rate Dialog */}
      <Dialog open={!!rateDialog} onOpenChange={(open) => { if (!open) { setRateDialog(null); setSelectedRating(0); setRatingComment(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rate Your Order</DialogTitle>
            <DialogDescription>How was your order from {rateDialog?.providerName}?</DialogDescription>
          </DialogHeader>
          <div className="flex justify-center gap-2 py-4">
            {[1, 2, 3, 4, 5].map((r) => (
              <button key={r} onClick={() => setSelectedRating(r)}>
                <Star className={`w-8 h-8 transition-colors ${r <= selectedRating ? "fill-amber-400 text-amber-400" : "text-slate-300 dark:text-slate-600"}`} />
              </button>
            ))}
          </div>
          <Input placeholder="Leave a review (optional)" value={ratingComment} onChange={(e) => setRatingComment(e.target.value)} />
          <DialogFooter>
            <Button variant="outline" onClick={() => { setRateDialog(null); setSelectedRating(0); setRatingComment(""); }}>Skip</Button>
            <Button
              className="bg-orange-600 hover:bg-orange-700 text-white"
              disabled={selectedRating === 0 || isRating}
              onClick={handleRate}
            >
              {isRating ? "Submitting…" : "Submit Rating"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* ── AI Kitchen Delay Sentinel Modal ─────────────────────────────── */}
      {showDelayModal && delayAuditResult && (
        <Dialog open={showDelayModal} onOpenChange={setShowDelayModal}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <ChefHat className="w-4 h-4" />
                </div>
                <div>
                  <DialogTitle className="text-base flex items-center gap-2">
                    Kitchen Prep Sentinel
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                      Live Queue AI
                    </span>
                  </DialogTitle>
                  <DialogDescription className="text-xs">
                    {delayAuditResult.restaurantName} • Order #{delayAuditResult.orderId}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            {/* Status Card */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#1E1E36] border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500">Kitchen Status</span>
                <div className="text-sm font-bold flex items-center gap-1.5 mt-0.5">
                  <span className={`w-2 h-2 rounded-full ${delayAuditResult.kitchenStatus === "ON_TRACK" ? "bg-emerald-500" : "bg-amber-500 animate-pulse"}`} />
                  {delayAuditResult.kitchenStatus.replace(/_/g, " ")}
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-500">Expected Delivery</span>
                <div className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                  {delayAuditResult.revisedEta}
                  {delayAuditResult.delayMinutes > 0 && (
                    <span className="text-xs text-amber-600 ml-1 font-normal">(+{delayAuditResult.delayMinutes}m)</span>
                  )}
                </div>
              </div>
            </div>

            {/* Bottleneck Analysis */}
            <div className="space-y-1.5 text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-300 text-[11px]">Throughput Assessment:</span>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed bg-slate-50 dark:bg-[#262644] p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                {delayAuditResult.bottleneckReason}
              </p>
            </div>

            {/* Mitigations */}
            {delayAuditResult.mitigationActions?.length > 0 && (
              <div className="space-y-1.5 text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300 text-[11px]">Mitigation In Progress:</span>
                <div className="space-y-1">
                  {delayAuditResult.mitigationActions.map((act, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                      {act}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Resident Reassurance Message */}
            <div className="space-y-1 text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-300 text-[11px]">Live Status Update:</span>
              <div className="p-3 bg-indigo-50/60 dark:bg-indigo-950/30 rounded-xl border border-indigo-100 dark:border-indigo-900/40 text-[11px] text-slate-700 dark:text-slate-300 font-mono">
                {delayAuditResult.customerUpdateMessage}
              </div>
            </div>

            <DialogFooter className="flex items-center justify-between sm:justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(delayAuditResult.customerUpdateMessage);
                  toast.success("Status update copied!");
                }}
              >
                <Copy className="w-3.5 h-3.5 mr-1" /> Copy Update
              </Button>
              <Button size="sm" onClick={() => setShowDelayModal(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
