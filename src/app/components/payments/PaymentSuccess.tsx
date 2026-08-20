import React from "react";
import type { PaymentOrderResponse } from "../../../types/payment";

interface PaymentSuccessProps {
  order: PaymentOrderResponse;
  eventName?: string;
  onViewPass?: () => void;
  onDone?: () => void;
}

function formatAmount(amount: number): string {
  return `₹${amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
}

/**
 * Full-screen payment success confirmation.
 *
 * @example
 * <PaymentSuccess
 *   order={paidOrder}
 *   eventName="Ganesh Chaturthi"
 *   onViewPass={() => navigate(`/pass/${registrationId}`)}
 *   onDone={() => navigate("/events")}
 * />
 */
const PaymentSuccess: React.FC<PaymentSuccessProps> = ({
  order,
  eventName,
  onViewPass,
  onDone,
}) => {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 p-6 text-center">
      {/* Check circle */}
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
        <svg className="h-10 w-10 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <div className="space-y-1">
        <p className="text-sm font-medium text-green-600 uppercase tracking-wide">Payment Successful</p>
        <p className="text-4xl font-bold text-gray-900">{formatAmount(order.amount)}</p>
        {eventName && <p className="text-base text-gray-600">{eventName}</p>}
        <p className="text-sm text-gray-500">Registration Confirmed</p>
      </div>

      <div className="rounded-lg bg-gray-50 px-5 py-3 text-left space-y-1 text-sm w-full max-w-sm">
        <div className="flex justify-between text-gray-500">
          <span>Payment Reference</span>
          <span className="font-mono text-xs text-gray-700">{order.razorpayPaymentId ?? order.razorpayOrderId}</span>
        </div>
        <div className="flex justify-between text-gray-500">
          <span>Amount</span>
          <span className="text-gray-800 font-medium">{formatAmount(order.amount)}</span>
        </div>
        <div className="flex justify-between text-gray-500">
          <span>Status</span>
          <span className="text-green-600 font-medium">Paid</span>
        </div>
      </div>

      <div className="flex flex-col gap-3 w-full max-w-sm">
        {onViewPass && (
          <button
            onClick={onViewPass}
            className="rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-700"
          >
            View Pass
          </button>
        )}
        {onDone && (
          <button
            onClick={onDone}
            className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Done
          </button>
        )}
      </div>
    </div>
  );
};

export default PaymentSuccess;
