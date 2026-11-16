import React, { useEffect, useRef, useState } from "react";
import { commercePaymentService } from "../../../../services/commerce/commercePaymentService";
import type { CommerceOrderDto } from "../../../../services/commerce/commerceOrderService";
import { useAuth } from "../../../../contexts/AuthContext";
import type {
  RazorpaySuccessPayload,
  RazorpayCheckoutOptions,
} from "../../../../types/payment";
import { useCheckoutOptions } from "../../../../hooks/payments/useCheckoutOptions";
import { PaymentGatewaySelector } from "../../payments/PaymentGatewaySelector";
import { ManaPayCheckoutModal } from "../../payments/unified/ManaPayCheckoutModal";
import type { ManaPaymentRecord } from "../../../../types/manaPay";

const RAZORPAY_SCRIPT_URL = "https://checkout.razorpay.com/v1/checkout.js";

function loadRazorpayScript(): Promise<boolean> {
  if (typeof window !== "undefined" && window.Razorpay) return Promise.resolve(true);
  return new Promise((resolve) => {
    const s = document.createElement("script");
    s.src = RAZORPAY_SCRIPT_URL;
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

interface Props {
  order: CommerceOrderDto;
  /** Called when payment is fully verified on the backend. */
  onSuccess: (updated: CommerceOrderDto) => void;
  /** Called when the user dismisses the Razorpay modal. */
  onDismiss?: () => void;
  /** Called on any error. */
  onError?: (msg: string) => void;
}

export default function CheckoutPayment({ order, onSuccess, onDismiss, onError }: Props) {
  const { user } = useAuth();
  const [status, setStatus] = useState<"idle" | "loading" | "opening" | "verifying" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const onSuccessRef = useRef(onSuccess);
  const onDismissRef = useRef(onDismiss);
  const onErrorRef = useRef(onError);
  onSuccessRef.current = onSuccess;
  onDismissRef.current = onDismiss;
  onErrorRef.current = onError;

  const { options: checkoutOptions } = useCheckoutOptions();
  const [selectedGateway, setSelectedGateway] = useState<string>("RAZORPAY");
  const [showManaPayModal, setShowManaPayModal] = useState(false);

  useEffect(() => {
    if (checkoutOptions?.defaultGateway) setSelectedGateway(checkoutOptions.defaultGateway);
  }, [checkoutOptions?.defaultGateway]);

  // Preload Razorpay script on mount
  useEffect(() => {
    loadRazorpayScript();
  }, []);

  const handlePay = async () => {
    if (selectedGateway === "MANA_PAY") {
      setShowManaPayModal(true);
      return;
    }

    setStatus("loading");
    setErrorMsg(null);

    try {
      const scriptOk = await loadRazorpayScript();
      if (!scriptOk) {
        throw new Error("Failed to load payment gateway. Please check your connection.");
      }

      const initData = await commercePaymentService.initiatePayment(order.orderNumber);
      setStatus("opening");

      const options: RazorpayCheckoutOptions = {
        key: initData.keyId,
        amount: Math.round(initData.amount * 100), // paise
        currency: initData.currency,
        name: "Mana Community",
        description: initData.description,
        order_id: initData.razorpayOrderId,
        prefill: {
          name: (user as any)?.fullName ?? "",
          email: (user as any)?.email ?? "",
          contact: (user as any)?.phone ?? "",
        },
        theme: { color: "#7c3aed" },
        handler: async (payload: RazorpaySuccessPayload) => {
          setStatus("verifying");
          try {
            const updated = await commercePaymentService.verifyPayment(order.orderNumber, {
              razorpayOrderId: payload.razorpay_order_id,
              razorpayPaymentId: payload.razorpay_payment_id,
              razorpaySignature: payload.razorpay_signature,
            });
            setStatus("done");
            onSuccessRef.current(updated);
          } catch (err) {
            const msg = err instanceof Error ? err.message : "Payment verification failed.";
            setStatus("error");
            setErrorMsg(msg);
            onErrorRef.current?.(msg);
          }
        },
        modal: {
          ondismiss: () => {
            setStatus("idle");
            onDismissRef.current?.();
          },
        },
      };

      new window.Razorpay(options).open();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Payment failed. Please try again.";
      setStatus("error");
      setErrorMsg(msg);
      onErrorRef.current?.(msg);
    }
  };

  const busy = status === "loading" || status === "opening" || status === "verifying";

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
      {/* Gateway selector — only shown when multiple gateways are available */}
      {checkoutOptions && checkoutOptions.gatewayOptions.length > 1 && status === "idle" && (
        <div>
          <p className="text-sm font-semibold text-gray-700 mb-2">Payment method</p>
          <PaymentGatewaySelector
            options={checkoutOptions}
            selectedGateway={selectedGateway}
            onChange={setSelectedGateway}
          />
        </div>
      )}

      {/* ManaPay modal */}
      {showManaPayModal && (
        <ManaPayCheckoutModal
          isOpen={showManaPayModal}
          onClose={() => setShowManaPayModal(false)}
          order={{
            domain: "MARKETPLACE",
            orderReferenceId: order.orderNumber,
            title: `Order ${order.orderNumber}`,
            totalAmount: Number(order.totalAmount),
            payer: { name: (user as any)?.fullName ?? "", unit: (user as any)?.flatNumber ?? "" },
            idempotencyKey: `commerce-${order.orderNumber}-${Date.now()}`,
          } as any}
          onPaymentSuccess={async (_record: ManaPaymentRecord) => {
            setShowManaPayModal(false);
            setStatus("done");
            const updated = { ...order, paymentStatus: "PAID" } as CommerceOrderDto;
            onSuccessRef.current(updated);
          }}
        />
      )}

      {/* Order summary */}
      <div>
        <p className="text-sm font-semibold text-gray-800 mb-1">Order Summary</p>
        <div className="space-y-1">
          {order.items?.map((item, i) => (
            <div key={i} className="flex justify-between text-sm text-gray-600">
              <span>{item.title} × {item.quantity}</span>
              <span>₹{Number(item.totalPrice).toLocaleString("en-IN")}</span>
            </div>
          ))}
        </div>
        <div className="border-t border-gray-100 mt-2 pt-2 flex justify-between text-sm font-bold text-gray-800">
          <span>Total</span>
          <span>₹{Number(order.totalAmount).toLocaleString("en-IN")}</span>
        </div>
      </div>

      {/* Error state */}
      {status === "error" && errorMsg && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {errorMsg}
        </div>
      )}

      {/* Status messages */}
      {status === "verifying" && (
        <div className="rounded-lg bg-violet-50 border border-violet-200 p-3 text-sm text-violet-700 text-center">
          Verifying your payment…
        </div>
      )}
      {status === "done" && (
        <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-700 text-center font-semibold">
          Payment successful!
        </div>
      )}

      {/* Pay button */}
      {status !== "done" && (
        <button
          onClick={handlePay}
          disabled={busy}
          className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {busy
            ? status === "loading" ? "Preparing payment…"
              : status === "opening" ? "Opening checkout…"
              : "Verifying…"
            : `Pay ₹${Number(order.totalAmount).toLocaleString("en-IN")}`}
        </button>
      )}

      <p className="text-center text-xs text-gray-400">
        {selectedGateway === "MANA_PAY" ? "Secured by ManaPay" : "Secured by Razorpay"}
      </p>
    </div>
  );
}
