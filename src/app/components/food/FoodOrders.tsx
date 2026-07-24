import { useState, useEffect } from "react";
import {
  ShoppingCart, Clock, CheckCircle, Truck, XCircle, ChefHat,
  Package, Star, RotateCcw, ArrowRight, Ban, Loader2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Separator } from "../ui/separator";
import { Skeleton } from "../ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import type { FoodOrder } from "../../../types/food";

const mockOrders: Partial<FoodOrder>[] = [
  {
    id: 1, orderNumber: "ORD-1042", providerName: "Spice Garden", providerType: "RESTAURANT",
    totalAmount: 520, tax: 40, deliveryFee: 30, subtotal: 450, discount: 0,
    status: "PREPARING", placedAt: "2026-07-24T10:30:00Z", paymentStatus: "PAID",
    estimatedDelivery: "2026-07-24T11:15:00Z",
    items: [
      { id: 1, itemId: 1, itemName: "Butter Chicken", quantity: 1, unitPrice: 320, totalPrice: 320, isVeg: false },
      { id: 2, itemId: 2, itemName: "Garlic Naan", quantity: 2, unitPrice: 60, totalPrice: 120, isVeg: true },
    ],
  },
  {
    id: 2, orderNumber: "ORD-1041", providerName: "Green Bowl", providerType: "RESTAURANT",
    totalAmount: 380, tax: 30, deliveryFee: 20, subtotal: 330, discount: 0,
    status: "OUT_FOR_DELIVERY", placedAt: "2026-07-24T09:00:00Z", paymentStatus: "PAID",
    estimatedDelivery: "2026-07-24T09:40:00Z",
    items: [
      { id: 3, itemId: 3, itemName: "Quinoa Buddha Bowl", quantity: 1, unitPrice: 330, totalPrice: 330, isVeg: true },
    ],
  },
  {
    id: 3, orderNumber: "ORD-1039", providerName: "Amma's Kitchen", providerType: "HOME_CHEF",
    totalAmount: 280, tax: 20, deliveryFee: 0, subtotal: 260, discount: 0,
    status: "DELIVERED", placedAt: "2026-07-23T12:00:00Z", deliveredAt: "2026-07-23T12:45:00Z", paymentStatus: "PAID",
    items: [
      { id: 4, itemId: 4, itemName: "South Indian Thali", quantity: 2, unitPrice: 130, totalPrice: 260, isVeg: true },
    ],
  },
  {
    id: 4, orderNumber: "ORD-1035", providerName: "Pizza Hub", providerType: "RESTAURANT",
    totalAmount: 650, tax: 50, deliveryFee: 30, subtotal: 570, discount: 0,
    status: "DELIVERED", placedAt: "2026-07-22T19:30:00Z", deliveredAt: "2026-07-22T20:10:00Z", paymentStatus: "PAID",
    items: [
      { id: 5, itemId: 5, itemName: "Margherita Pizza", quantity: 1, unitPrice: 350, totalPrice: 350, isVeg: true },
      { id: 6, itemId: 6, itemName: "Pepperoni Pizza", quantity: 1, unitPrice: 420, totalPrice: 420, isVeg: false },
    ],
  },
  {
    id: 5, orderNumber: "ORD-1030", providerName: "Biryani Palace", providerType: "RESTAURANT",
    totalAmount: 400, tax: 30, deliveryFee: 20, subtotal: 350, discount: 0,
    status: "CANCELLED", placedAt: "2026-07-21T13:00:00Z", cancelledAt: "2026-07-21T13:10:00Z",
    cancellationReason: "Changed my mind", paymentStatus: "REFUNDED",
    items: [
      { id: 7, itemId: 7, itemName: "Chicken Biryani", quantity: 1, unitPrice: 350, totalPrice: 350, isVeg: false },
    ],
  },
];

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
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Partial<FoodOrder>[]>([]);
  const [cancelDialog, setCancelDialog] = useState<Partial<FoodOrder> | null>(null);
  const [rateDialog, setRateDialog] = useState<Partial<FoodOrder> | null>(null);
  const [selectedRating, setSelectedRating] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setOrders(mockOrders);
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const activeOrders = orders.filter((o) => ["PLACED", "CONFIRMED", "PREPARING", "READY", "OUT_FOR_DELIVERY"].includes(o.status ?? ""));
  const pastOrders = orders.filter((o) => o.status === "DELIVERED");
  const cancelledOrders = orders.filter((o) => o.status === "CANCELLED");

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64 rounded-lg" />
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)}
      </div>
    );
  }

  function renderOrderCard(order: Partial<FoodOrder>) {
    const status = statusConfig[order.status ?? "PLACED"];
    const StatusIcon = status.icon;
    const currentStepIndex = statusSteps.indexOf(order.status ?? "PLACED");
    const isActive = ["PLACED", "CONFIRMED", "PREPARING", "READY", "OUT_FOR_DELIVERY"].includes(order.status ?? "");
    const canCancel = ["PLACED", "CONFIRMED"].includes(order.status ?? "");

    return (
      <Card key={order.id} className="border-0 shadow-sm hover:shadow-md transition-all">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-sm">{order.providerName}</h4>
                <Badge className={`text-[10px] border-0 ${status.bg}`}>
                  <StatusIcon className="w-3 h-3 mr-1" />
                  {order.status?.replace(/_/g, " ")}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {order.orderNumber} | {formatDate(order.placedAt ?? "")}
              </p>
            </div>
            <p className="text-lg font-bold">{formatPrice(order.totalAmount ?? 0)}</p>
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
          {isActive && order.status !== "CANCELLED" && (
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
                  <span key={step} className="text-[9px] text-slate-400 text-center flex-1">{step.replace(/_/g, " ").split(" ").map(w => w[0] + w.slice(1).toLowerCase()).join(" ")}</span>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            {canCancel && (
              <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-800" onClick={() => setCancelDialog(order)}>
                <Ban className="w-3 h-3 mr-1" /> Cancel
              </Button>
            )}
            {order.status === "DELIVERED" && !order.rating && (
              <Button variant="outline" size="sm" className="text-amber-600 border-amber-200 hover:bg-amber-50 dark:text-amber-400" onClick={() => { setRateDialog(order); setSelectedRating(0); }}>
                <Star className="w-3 h-3 mr-1" /> Rate Order
              </Button>
            )}
            {order.status === "DELIVERED" && (
              <Button variant="outline" size="sm" className="text-orange-600 border-orange-200 hover:bg-orange-50 dark:text-orange-400">
                <RotateCcw className="w-3 h-3 mr-1" /> Reorder
              </Button>
            )}
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
      <Dialog open={!!cancelDialog} onOpenChange={() => setCancelDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Order</DialogTitle>
            <DialogDescription>Are you sure you want to cancel order {cancelDialog?.orderNumber}? This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialog(null)}>Keep Order</Button>
            <Button variant="destructive" onClick={() => setCancelDialog(null)}>Cancel Order</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rate Dialog */}
      <Dialog open={!!rateDialog} onOpenChange={() => setRateDialog(null)}>
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
          <DialogFooter>
            <Button variant="outline" onClick={() => setRateDialog(null)}>Skip</Button>
            <Button className="bg-orange-600 hover:bg-orange-700 text-white" disabled={selectedRating === 0} onClick={() => setRateDialog(null)}>Submit Rating</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
