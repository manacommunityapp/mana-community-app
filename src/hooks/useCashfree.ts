import { useCallback, useEffect, useRef, useState } from "react";
import {
  cashfreePaymentService,
  type CashfreeCreateOrderRequest,
  type CashfreeOrderResponse,
} from "../services/payments/cashfreePaymentService";

const CASHFREE_SDK_URL = "https://sdk.cashfree.com/js/v3/cashfree.js";

export type CashfreePaymentStatus = "idle" | "creating" | "checkout" | "verifying" | "success" | "failed";

export interface UseCashfreeOptions {
  onSuccess?: (order: CashfreeOrderResponse) => void;
  onDismiss?: () => void;
  onError?: (error: string) => void;
}

export interface UseCashfreeResult {
  status: CashfreePaymentStatus;
  order: CashfreeOrderResponse | null;
  error: string | null;
  initiatePayment: (req: CashfreeCreateOrderRequest) => Promise<CashfreeOrderResponse | null>;
  reset: () => void;
}

function loadCashfreeScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window !== "undefined" && (window as any).Cashfree) {
      resolve(true);
      return;
    }
    if (document.querySelector('script[data-mana-cashfree]')) {
      // Already injected — wait for it
      const existing = document.querySelector('script[data-mana-cashfree]') as HTMLScriptElement;
      existing.addEventListener("load", () => resolve(true), { once: true });
      existing.addEventListener("error", () => resolve(false), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = CASHFREE_SDK_URL;
    script.setAttribute("data-mana-cashfree", "true");
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

/**
 * Reusable hook for Cashfree v3 JS SDK checkout.
 *
 * @example
 * const { status, initiatePayment, reset } = useCashfree({
 *   onSuccess: (order) => toast.success(`Paid ₹${order.amount}`),
 *   onError:   (msg)   => toast.error(msg),
 * });
 *
 * <button onClick={() => initiatePayment({ amount: 299, referenceType: "SPORTS_REGISTRATION", referenceId: 7 })}>
 *   Pay ₹299
 * </button>
 */
export function useCashfree(options: UseCashfreeOptions = {}): UseCashfreeResult {
  const { onSuccess, onDismiss, onError } = options;

  const [status, setStatus] = useState<CashfreePaymentStatus>("idle");
  const [order, setOrder]   = useState<CashfreeOrderResponse | null>(null);
  const [error, setError]   = useState<string | null>(null);

  const onSuccessRef = useRef(onSuccess);
  const onDismissRef = useRef(onDismiss);
  const onErrorRef   = useRef(onError);
  onSuccessRef.current = onSuccess;
  onDismissRef.current = onDismiss;
  onErrorRef.current   = onError;

  // Preload the SDK on mount to reduce latency at checkout time.
  useEffect(() => {
    loadCashfreeScript().then((ok) => {
      if (!ok) console.warn("[useCashfree] Failed to preload Cashfree SDK");
    });
  }, []);

  const reset = useCallback(() => {
    setStatus("idle");
    setOrder(null);
    setError(null);
  }, []);

  const initiatePayment = useCallback(
    async (req: CashfreeCreateOrderRequest): Promise<CashfreeOrderResponse | null> => {
      setStatus("creating");
      setError(null);
      setOrder(null);

      try {
        // 1. Ensure the Cashfree SDK is loaded.
        const sdkReady = await loadCashfreeScript();
        if (!sdkReady) {
          const msg = "Failed to load the payment gateway. Please check your network connection.";
          setError(msg);
          setStatus("failed");
          onErrorRef.current?.(msg);
          return null;
        }

        // 2. Create the order on the backend.
        let created: CashfreeOrderResponse;
        try {
          created = await cashfreePaymentService.createOrder(req);
        } catch (err: unknown) {
          const msg =
            (err as any)?.response?.data?.message ??
            (err instanceof Error ? err.message : "Could not create payment order. Please try again.");
          setError(msg);
          setStatus("failed");
          onErrorRef.current?.(msg);
          return null;
        }

        if (!created.paymentSessionId) {
          const msg = "Payment gateway is not configured. Please contact support.";
          setError(msg);
          setStatus("failed");
          onErrorRef.current?.(msg);
          return null;
        }

        setOrder(created);
        setStatus("checkout");

        // 3. Open the Cashfree v3 checkout modal.
        const CashfreeSDK = (window as any).Cashfree;
        const isProd = created.appId && !created.appId.startsWith("TEST");
        const cashfree = CashfreeSDK({ mode: isProd ? "production" : "sandbox" });

        let checkoutResult: any;
        try {
          checkoutResult = await cashfree.checkout({
            paymentSessionId: created.paymentSessionId,
            redirectTarget: "_modal",
          });
        } catch (err: unknown) {
          // Modal was dismissed without payment (user closed it).
          setStatus("idle");
          onDismissRef.current?.();
          return null;
        }

        if (checkoutResult?.error) {
          const msg: string = checkoutResult.error?.message ?? "Payment failed. Please try again.";
          setError(msg);
          setStatus("failed");
          onErrorRef.current?.(msg);
          return null;
        }

        if (!checkoutResult?.paymentDetails) {
          // Redirect flow (non-modal) or unexpected result — fall through to verify.
          setStatus("verifying");
        } else {
          setStatus("verifying");
        }

        // 4. Always verify server-side — never trust the frontend callback alone.
        try {
          const verified = await cashfreePaymentService.verifyPayment(created.manaOrderId);
          setOrder(verified);
          if (verified.status === "PAID") {
            setStatus("success");
            onSuccessRef.current?.(verified);
            return verified;
          } else {
            const msg = verified.failureReason ?? "Payment could not be confirmed.";
            setError(msg);
            setStatus("failed");
            onErrorRef.current?.(msg);
            return null;
          }
        } catch (err: unknown) {
          const msg =
            (err as any)?.response?.data?.message ??
            (err instanceof Error ? err.message : "Payment verification failed. Please contact support.");
          setError(msg);
          setStatus("failed");
          onErrorRef.current?.(msg);
          return null;
        }

      } catch (err: unknown) {
        const msg =
          err instanceof Error ? err.message : "An unexpected error occurred during payment.";
        setError(msg);
        setStatus("failed");
        onErrorRef.current?.(msg);
        return null;
      }
    },
    [],
  );

  return { status, order, error, initiatePayment, reset };
}
