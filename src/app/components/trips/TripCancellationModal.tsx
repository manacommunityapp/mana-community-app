import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { tripService, type TripBooking, type Trip } from "../../../services/trips/tripService";

interface TripCancellationModalProps {
  booking: TripBooking | null;
  isOpen: boolean;
  onClose: () => void;
  onCancellationComplete: () => void;
}

export function TripCancellationModal({
  booking,
  isOpen,
  onClose,
  onCancellationComplete,
}: TripCancellationModalProps) {
  const [reason, setReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<{ refundAmount: number; penaltyDeducted: number } | null>(null);

  if (!booking) return null;

  const trip = tripService.getTripById(booking.tripId);
  const departureDate = new Date(booking.departureDate);
  const daysUntil = (departureDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24);

  const isFreeWindow = trip ? daysUntil >= trip.cancellationPolicy.freeCancellationBeforeDays : false;
  const estimatedRefundPercent = isFreeWindow ? 100 : trip ? Math.max(0, 100 - trip.cancellationPolicy.penaltyPercentAfterDeadline) : 70;
  const estimatedRefundAmount = Math.round((booking.totalAmount * estimatedRefundPercent) / 100);

  const handleConfirmCancel = () => {
    setIsProcessing(true);
    try {
      const res = tripService.cancelBooking(booking.id, reason);
      setResult(res);
      onCancellationComplete();
    } catch (err: any) {
      alert(err.message || "Failed to cancel booking");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-1">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <DialogTitle className="text-lg font-bold text-slate-900">
            {result ? "Booking Cancelled" : "Cancel Trip Booking"}
          </DialogTitle>
          <DialogDescription className="text-xs">{booking.tripTitle}</DialogDescription>
        </DialogHeader>

        {result ? (
          <div className="py-4 text-center space-y-3 text-xs">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
            <h3 className="text-base font-bold text-slate-900">Refund Processed</h3>
            <p className="text-slate-600">
              An amount of <strong className="text-emerald-700 font-bold">₹{result.refundAmount.toLocaleString()}</strong> has been refunded to your original payment method.
            </p>
            {result.penaltyDeducted > 0 && (
              <p className="text-slate-400 text-[11px]">
                (Deduction as per cancellation window: ₹{result.penaltyDeducted.toLocaleString()})
              </p>
            )}
            <Button className="w-full bg-slate-800 hover:bg-slate-900 font-bold mt-2" onClick={onClose}>
              Done
            </Button>
          </div>
        ) : (
          <div className="space-y-4 py-2 text-xs">
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-1.5 text-rose-900">
              <div className="flex justify-between">
                <span>Total Amount Paid:</span>
                <strong>₹{booking.totalAmount.toLocaleString()}</strong>
              </div>
              <div className="flex justify-between font-bold text-emerald-800">
                <span>Estimated Refund ({estimatedRefundPercent}%):</span>
                <span>₹{estimatedRefundAmount.toLocaleString()}</span>
              </div>
              <p className="text-[11px] text-rose-700 pt-1 border-t border-rose-200">
                {trip?.cancellationPolicy.policyNotes || "Cancellations inside penalty window incur standard deductions."}
              </p>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">Reason for Cancellation (Optional)</label>
              <Textarea
                placeholder="Let the host know why you cannot make it..."
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
          </div>
        )}

        {!result && (
          <DialogFooter className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onClose} disabled={isProcessing}>
              Keep My Ticket
            </Button>
            <Button
              size="sm"
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
              onClick={handleConfirmCancel}
              disabled={isProcessing}
            >
              {isProcessing ? "Processing..." : "Confirm Cancellation & Refund"}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
