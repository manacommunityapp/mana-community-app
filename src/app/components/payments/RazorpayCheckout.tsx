import React, { useState } from "react";
import { toast } from "sonner";
import { useRazorpay } from "../../../hooks/useRazorpay";
import type {
  CreatePaymentOrderRequest,
  PaymentOrderResponse,
} from "../../../types/payment";

export interface RazorpayCheckoutProps {
  /** Amount in INR rupees. */
  amount: number;
  referenceType: CreatePaymentOrderRequest["referenceType"];
  /** PK of the business entity being paid for. */
  referenceId: number;
  /** Short description shown in the Razorpay checkout modal. */
  description?: string;
  /** Button label. Defaults to "Pay ₹{amount}". */
  label?: string;
  /** Extra CSS class forwarded to the button element. */
  className?: string;
  /** Disable the button (e.g. while a parent form is invalid). */
  disabled?: boolean;
  /** Called after the backend confirms the payment as PAID. */
  onSuccess?: (order: PaymentOrderResponse) => void;
  /** Called when the user closes the modal without paying. */
  onDismiss?: () => void;
}

/**
 * Drop-in Razorpay checkout button.
 *
 * Handles the full flow internally:
 *   createOrder → open modal → verifyPayment → onSuccess
 *
 * @example
 * <RazorpayCheckout
 *   amount={501}
 *   referenceType="POOJA"
 *   referenceId={bookingId}
 *   description="Maha Ganapathi Pooja"
 *   onSuccess={(order) => navigate(`/payment-success/${order.id}`)}
 * />
 */
export const RazorpayCheckout: React.FC<RazorpayCheckoutProps> = ({
  amount,
  referenceType,
  referenceId,
  description,
  label,
  className = "",
  disabled = false,
  onSuccess,
  onDismiss,
}) => {
  const [error, setError] = useState<string | null>(null);

  const { loading, initiatePayment } = useRazorpay({
    onSuccess: (order) => {
      setError(null);
      toast.success("Payment successful!");
      onSuccess?.(order);
    },
    onDismiss: () => {
      toast.info("Payment cancelled.");
      onDismiss?.();
    },
    onError: (msg) => {
      setError(msg);
      toast.error(msg);
    },
  });

  const handleClick = () => {
    setError(null);
    void initiatePayment({ amount, referenceType, referenceId, description });
  };

  const buttonLabel = label ?? `Pay ₹${amount.toLocaleString("en-IN")}`;

  return (
    <div className="inline-flex flex-col gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled || loading}
        className={[
          "inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5",
          "bg-violet-600 text-white font-semibold text-sm",
          "hover:bg-violet-700 active:bg-violet-800",
          "disabled:opacity-60 disabled:cursor-not-allowed",
          "transition-colors duration-150",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {loading ? (
          <>
            <svg
              className="h-4 w-4 animate-spin"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
            </svg>
            Processing…
          </>
        ) : (
          <>
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M20 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z" />
            </svg>
            {buttonLabel}
          </>
        )}
      </button>

      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}

      <p className="text-xs text-gray-400 text-center mt-1">
        Secured by{" "}
        <span className="font-medium text-gray-500">Razorpay</span>
      </p>
    </div>
  );
};

export default RazorpayCheckout;
