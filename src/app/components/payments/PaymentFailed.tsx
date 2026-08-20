import React from "react";
import type { CreatePaymentOrderRequest } from "../../../types/payment";
import RazorpayCheckout from "./RazorpayCheckout";
import type { PaymentOrderResponse } from "../../../types/payment";

interface PaymentFailedProps {
  /** User-facing error message (no raw technical details). */
  message?: string;
  /** If provided, shows a "Retry Payment" button using these same params. */
  retryRequest?: CreatePaymentOrderRequest;
  onRetrySuccess?: (order: PaymentOrderResponse) => void;
  onBack?: () => void;
}

/**
 * Payment failure screen with optional retry.
 *
 * Does NOT expose raw Razorpay errors. Shows a user-friendly message.
 * The retry button reuses the same RazorpayCheckout component — it creates
 * a fresh Razorpay order against the same business entity without duplicating
 * the registration.
 *
 * @example
 * <PaymentFailed
 *   message="Your bank declined the transaction."
 *   retryRequest={{ amount: 501, referenceType: "POOJA", referenceId: 7 }}
 *   onRetrySuccess={(order) => navigate(`/payment-success/${order.id}`)}
 *   onBack={() => navigate(-1)}
 * />
 */
const PaymentFailed: React.FC<PaymentFailedProps> = ({
  message = "We couldn't complete your payment. No amount has been confirmed.",
  retryRequest,
  onRetrySuccess,
  onBack,
}) => {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 p-6 text-center">
      {/* X circle */}
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
        <svg className="h-10 w-10 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>

      <div className="space-y-2">
        <p className="text-lg font-semibold text-gray-900">Payment Failed</p>
        <p className="text-sm text-gray-500 max-w-sm">{message}</p>
      </div>

      <div className="flex flex-col gap-3 w-full max-w-sm">
        {retryRequest && (
          <RazorpayCheckout
            amount={retryRequest.amount}
            referenceType={retryRequest.referenceType}
            referenceId={retryRequest.referenceId}
            description={retryRequest.description}
            label="Retry Payment"
            onSuccess={onRetrySuccess}
            className="w-full justify-center"
          />
        )}
        {onBack && (
          <button
            onClick={onBack}
            className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Back to Registration
          </button>
        )}
      </div>
    </div>
  );
};

export default PaymentFailed;
