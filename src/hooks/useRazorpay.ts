import { useCallback, useEffect, useRef, useState } from "react";
import { razorpayService } from "../services/payments/razorpayService";
import type {
  CreatePaymentOrderRequest,
  PaymentOrderResponse,
  RazorpaySuccessPayload,
  VerifyPaymentRequest,
} from "../types/payment";
import { useAuth } from "../contexts/AuthContext";

const RAZORPAY_SCRIPT_URL = "https://checkout.razorpay.com/v1/checkout.js";

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window !== "undefined" && window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = RAZORPAY_SCRIPT_URL;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export interface UseRazorpayOptions {
  /** Called after the backend confirms the payment as PAID. */
  onSuccess?: (order: PaymentOrderResponse) => void;
  /** Called when the user dismisses the checkout modal without paying. */
  onDismiss?: () => void;
  /** Called when any step fails (order creation, script load, or verification). */
  onError?: (error: string) => void;
  /** App name shown in the Razorpay checkout title bar. */
  appName?: string;
  /** Brand colour for the Razorpay checkout UI (hex). */
  themeColor?: string;
}

export interface UseRazorpayResult {
  /**
   * True while loading the Razorpay script, creating the backend order,
   * or awaiting backend verification.
   */
  loading: boolean;
  /**
   * Start a full payment flow:
   * 1. Load checkout.js (cached after first call)
   * 2. Create backend Razorpay order
   * 3. Open Razorpay modal
   * 4. On success: verify signature with backend → call onSuccess
   */
  initiatePayment: (req: CreatePaymentOrderRequest) => Promise<void>;
}

/**
 * Reusable hook for Razorpay Standard Checkout.
 *
 * @example
 * const { loading, initiatePayment } = useRazorpay({
 *   onSuccess: (order) => navigate(`/payment-success/${order.id}`),
 *   onError: (msg) => toast.error(msg),
 * });
 *
 * <button onClick={() => initiatePayment({ amount: 501, referenceType: "POOJA", referenceId: 7 })}>
 *   Pay ₹501
 * </button>
 */
export function useRazorpay(options: UseRazorpayOptions = {}): UseRazorpayResult {
  const {
    onSuccess,
    onDismiss,
    onError,
    appName = "Mana Community",
    themeColor = "#7c3aed",
  } = options;

  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  // Keep callbacks in refs to avoid stale closures in the modal handler.
  const onSuccessRef = useRef(onSuccess);
  const onDismissRef = useRef(onDismiss);
  const onErrorRef   = useRef(onError);
  onSuccessRef.current = onSuccess;
  onDismissRef.current = onDismiss;
  onErrorRef.current   = onError;

  // Eagerly load checkout.js when the hook mounts to eliminate network latency
  // at the moment the user clicks Pay.
  useEffect(() => {
    loadRazorpayScript().then((ok) => {
      if (!ok) console.warn("[useRazorpay] Failed to preload Razorpay checkout.js");
    });
  }, []);

  const initiatePayment = useCallback(
    async (req: CreatePaymentOrderRequest) => {
      setLoading(true);
      try {
        // 1. Ensure checkout.js is ready.
        const scriptLoaded = await loadRazorpayScript();
        if (!scriptLoaded) {
          onErrorRef.current?.(
            "Failed to load the payment gateway. Please check your network connection.",
          );
          return;
        }

        // 2. Create the Razorpay order on the backend.
        let orderData: PaymentOrderResponse;
        try {
          orderData = await razorpayService.createOrder(req);
        } catch (err: unknown) {
          const msg =
            err instanceof Error ? err.message : "Could not create payment order. Please try again.";
          onErrorRef.current?.(msg);
          return;
        }

        if (!orderData.keyId) {
          onErrorRef.current?.(
            "Payment gateway is not configured. Please contact support.",
          );
          return;
        }

        // 3. Open the Razorpay checkout modal.
        const rzp = new window.Razorpay({
          key: orderData.keyId,
          // Razorpay requires amount in paise (smallest INR unit).
          amount: Math.round(orderData.amount * 100),
          currency: orderData.currency,
          name: appName,
          description: orderData.description ?? req.description ?? "",
          order_id: orderData.razorpayOrderId,
          prefill: {
            name:    user?.fullName ?? "",
            email:   user?.email    ?? "",
            contact: user?.phone    ?? "",
          },
          notes: {
            referenceType: req.referenceType,
            referenceId:   req.referenceId,
          },
          theme: { color: themeColor },

          // 4. After checkout success, verify the signature on the backend.
          // Do NOT mark the payment successful based on this callback alone.
          handler: async (payload: RazorpaySuccessPayload) => {
            setLoading(true);
            try {
              const verifyReq: VerifyPaymentRequest = {
                razorpayOrderId:   payload.razorpay_order_id,
                razorpayPaymentId: payload.razorpay_payment_id,
                razorpaySignature: payload.razorpay_signature,
              };
              const verified = await razorpayService.verifyPayment(verifyReq);
              onSuccessRef.current?.(verified);
            } catch (err: unknown) {
              const msg =
                err instanceof Error
                  ? err.message
                  : "Payment verification failed. Please contact support.";
              onErrorRef.current?.(msg);
            } finally {
              setLoading(false);
            }
          },

          modal: {
            ondismiss: () => {
              setLoading(false);
              onDismissRef.current?.();
            },
          },
        });

        rzp.open();
        // setLoading(false) is called inside handler/ondismiss once the modal resolves.
      } catch (err: unknown) {
        const msg =
          err instanceof Error ? err.message : "An unexpected error occurred during payment.";
        onErrorRef.current?.(msg);
        setLoading(false);
      }
    },
    [appName, themeColor, user],
  );

  return { loading, initiatePayment };
}
