import { useState, useEffect } from "react";
import {
  X, ShoppingCart, CheckCircle2, AlertCircle, Loader2, ArrowRight,
} from "lucide-react";
import { Button } from "../ui/button";
import { useAuth } from "../../../contexts/AuthContext";
import { useCheckoutOptions } from "../../../hooks/payments/useCheckoutOptions";
import { PaymentGatewaySelector } from "../payments/PaymentGatewaySelector";
import { PaymentStatusBadge } from "../payments/PaymentStatusBadge";
import { ManaPayCheckoutModal } from "../payments/unified/ManaPayCheckoutModal";
import { unifiedPaymentService, type PaymentOrder } from "../../../services/payments/unifiedPaymentService";
import { foodOrderService } from "../../../services/food/foodOrderService";
import type { FoodOrderRequest } from "../../../types/food";

interface CartItem {
  itemId: number;
  name: string;
  quantity: number;
  unitPrice: number;
}

interface FoodCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderComplete: (orderId: number) => void;
  orderRequest: FoodOrderRequest;
  cartItems: CartItem[];
  restaurantName: string;
  estimatedTotal: number;
}

export function FoodCheckoutModal({
  isOpen,
  onClose,
  onOrderComplete,
  orderRequest,
  cartItems,
  restaurantName,
  estimatedTotal,
}: FoodCheckoutModalProps) {
  const { user } = useAuth();
  const communityId = user?.communityId as number;
  const { options, loading: optionsLoading, error: optionsError, retry } = useCheckoutOptions();
  const [selectedGateway, setSelectedGateway] = useState<string>("");
  const [selectedManualMode, setSelectedManualMode] = useState<string | undefined>();
  const [step, setStep] = useState<"summary" | "paying" | "done" | "error">("summary");
  const [foodOrder, setFoodOrder] = useState<{ id: number; totalAmount: number; orderNumber: string } | null>(null);
  const [paymentOrder, setPaymentOrder] = useState<PaymentOrder | null>(null);
  const [showManaPayModal, setShowManaPayModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);

  useEffect(() => {
    if (options?.defaultGateway && !selectedGateway) {
      setSelectedGateway(options.defaultGateway);
    }
  }, [options]);

  if (!isOpen) return null;

  const handlePay = async () => {
    if (!selectedGateway || !communityId) return;
    setStep("paying");
    setErrorMsg(null);
    try {
      // Step 1: Place food order on server — amount comes from server response
      const placed = await foodOrderService.placeOrder(orderRequest);
      setFoodOrder({ id: placed.id, totalAmount: placed.totalAmount, orderNumber: placed.orderNumber });

      // Step 2: Create unified payment order using server-confirmed totalAmount
      const order = await unifiedPaymentService.createOrder({
        referenceType: "FOOD_ORDER",
        referenceId: placed.id,
        gateway: selectedGateway as any,
        communityId,
        amount: placed.totalAmount,
      });
      setPaymentOrder(order);

      if (selectedGateway === "MANA_PAY") {
        setShowManaPayModal(true);
        return;
      }

      if (selectedGateway === "MANUAL") {
        // Manual payment — admin confirms later
        setPaymentStatus("PENDING");
        setStep("done");
        onOrderComplete(placed.id);
        return;
      }

      // Cashfree/Razorpay: SDK would launch here with order.gatewayOrderId
      // After SDK success, verify on server
      const verified = await unifiedPaymentService.verifyPayment(order.id);
      setPaymentStatus(verified.status);
      setStep("done");
      if (verified.status === "SUCCESS") {
        onOrderComplete(placed.id);
      }
    } catch (err: any) {
      const msg = err?.message ?? "Payment failed. Please try again.";
      setErrorMsg(msg);
      setStep("error");
    }
  };

  const handleManaPaySuccess = async () => {
    if (!paymentOrder || !foodOrder) return;
    try {
      const verified = await unifiedPaymentService.verifyPayment(paymentOrder.id);
      setPaymentStatus(verified.status);
      setStep("done");
      setShowManaPayModal(false);
      if (verified.status === "SUCCESS") {
        onOrderComplete(foodOrder.id);
      }
    } catch {
      setErrorMsg("Payment verification failed.");
      setStep("error");
      setShowManaPayModal(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4">
        <div className="bg-white dark:bg-slate-900 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-700 shrink-0">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-orange-500" />
              <h2 className="text-base font-black text-slate-900 dark:text-white">
                {step === "done" ? "Order Placed!" : "Checkout"}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
            >
              <X className="w-4 h-4 text-slate-500" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {/* Summary Step */}
            {(step === "summary" || step === "paying") && (
              <>
                <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-4 space-y-2">
                  <p className="text-xs font-bold text-orange-700 dark:text-orange-400 uppercase tracking-wide">
                    {restaurantName}
                  </p>
                  {cartItems.map((item) => (
                    <div key={item.itemId} className="flex justify-between text-sm">
                      <span className="text-slate-700 dark:text-slate-300">
                        {item.name} × {item.quantity}
                      </span>
                      <span className="font-semibold">₹{(item.unitPrice * item.quantity).toLocaleString()}</span>
                    </div>
                  ))}
                  <div className="border-t border-orange-200 dark:border-orange-700 pt-2 mt-2 flex justify-between text-sm font-black">
                    <span>Total (estimated)</span>
                    <span className="text-orange-700 dark:text-orange-400">₹{estimatedTotal.toLocaleString()}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    Final amount confirmed by server after order placement.
                  </p>
                </div>

                {optionsLoading && (
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Loader2 className="w-4 h-4 animate-spin" /> Loading payment options...
                  </div>
                )}
                {optionsError && (
                  <div className="text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> {optionsError}
                    <button onClick={retry} className="underline ml-1">Retry</button>
                  </div>
                )}
                {options && (
                  <PaymentGatewaySelector
                    options={options}
                    selectedGateway={selectedGateway}
                    selectedManualMode={selectedManualMode}
                    onChange={(gw, mode) => { setSelectedGateway(gw); setSelectedManualMode(mode); }}
                    orderAmount={estimatedTotal}
                  />
                )}
              </>
            )}

            {/* Error Step */}
            {step === "error" && (
              <div className="text-center space-y-3 py-4">
                <div className="w-14 h-14 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto">
                  <AlertCircle className="w-8 h-8 text-red-600" />
                </div>
                <p className="font-bold text-slate-900 dark:text-white">Payment Failed</p>
                <p className="text-sm text-slate-500">{errorMsg}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setStep("summary")}
                >
                  Try Again
                </Button>
              </div>
            )}

            {/* Done Step */}
            {step === "done" && (
              <div className="text-center space-y-3 py-4">
                <div className="w-14 h-14 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
                <div>
                  <p className="font-black text-slate-900 dark:text-white text-lg">Order Placed!</p>
                  {foodOrder && (
                    <p className="text-xs text-slate-500 mt-1">
                      Order #{foodOrder.orderNumber} · ₹{foodOrder.totalAmount.toLocaleString()}
                    </p>
                  )}
                </div>
                {paymentStatus && (
                  <PaymentStatusBadge status={paymentStatus} />
                )}
                <p className="text-xs text-slate-500">
                  {paymentStatus === "SUCCESS"
                    ? "Payment confirmed. Your order is being prepared."
                    : paymentStatus === "PENDING"
                    ? "Payment pending confirmation. Your order has been received."
                    : "Track your order in My Orders."}
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          {(step === "summary" || step === "paying") && (
            <div className="p-5 border-t border-slate-200 dark:border-slate-700 shrink-0">
              <Button
                className="w-full bg-orange-600 hover:bg-orange-700 font-bold gap-2"
                disabled={!selectedGateway || !options || optionsLoading || step === "paying"}
                onClick={handlePay}
              >
                {step === "paying" ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Placing Order...</>
                ) : (
                  <>Place Order & Pay ₹{estimatedTotal.toLocaleString()} <ArrowRight className="w-4 h-4" /></>
                )}
              </Button>
            </div>
          )}

          {step === "done" && (
            <div className="p-5 border-t border-slate-200 dark:border-slate-700 shrink-0">
              <Button className="w-full font-bold" onClick={onClose}>
                Done
              </Button>
            </div>
          )}
        </div>
      </div>

      {showManaPayModal && paymentOrder && foodOrder && (
        <ManaPayCheckoutModal
          isOpen={showManaPayModal}
          onClose={() => { setShowManaPayModal(false); setStep("summary"); }}
          paymentOrderId={paymentOrder.id}
          order={{
            domain: "FOOD_ORDER",
            orderReferenceId: `FOOD-${foodOrder.id}`,
            title: `Food Order — ${restaurantName}`,
            description: `${cartItems.length} item(s)`,
            totalAmount: paymentOrder.grossAmount,
            payer: {
              name: user?.name ?? "Resident",
              unit: user?.flatNo ? `Flat ${user.flatNo}` : undefined,
            },
            items: cartItems.map((c) => ({
              title: `${c.name} ×${c.quantity}`,
              quantity: c.quantity,
              unitPrice: c.unitPrice,
              amount: c.unitPrice * c.quantity,
            })),
          }}
          onPaymentSuccess={handleManaPaySuccess}
        />
      )}
    </>
  );
}
