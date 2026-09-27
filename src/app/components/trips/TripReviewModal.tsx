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
import { Star, CheckCircle2 } from "lucide-react";
import { tripService, type Trip } from "../../../services/trips/tripService";

interface TripReviewModalProps {
  trip: Trip | null;
  isOpen: boolean;
  onClose: () => void;
  currentUser: { id: string; fullName: string; flatNo?: string };
}

export function TripReviewModal({ trip, isOpen, onClose, currentUser }: TripReviewModalProps) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);

  if (!trip) return null;

  const handleSubmit = () => {
    if (!comment.trim()) return;
    tripService.submitTripReview(trip.id, {
      tripId: trip.id,
      userId: currentUser.id,
      userName: currentUser.fullName,
      userFlat: currentUser.flatNo || "Resident",
      rating,
      comment,
    });
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setComment("");
      onClose();
    }, 1200);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Rate &amp; Review Trip Experience</DialogTitle>
          <DialogDescription className="text-xs">{trip.title}</DialogDescription>
        </DialogHeader>

        {submitted ? (
          <div className="py-6 text-center space-y-2">
            <CheckCircle2 className="w-14 h-14 text-emerald-500 mx-auto animate-bounce" />
            <h3 className="text-base font-bold text-slate-900">Thank You for Your Feedback!</h3>
            <p className="text-xs text-slate-500">Your review helps neighbors discover the best community trips.</p>
          </div>
        ) : (
          <div className="space-y-4 py-2 text-xs">
            {/* Star selector */}
            <div className="text-center space-y-1">
              <label className="font-bold text-slate-700">How was your overall travel experience?</label>
              <div className="flex justify-center gap-2 pt-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1 text-amber-400 hover:scale-110 transition-transform cursor-pointer"
                  >
                    <Star
                      className={`w-7 h-7 ${
                        star <= rating ? "fill-amber-400 text-amber-400" : "text-slate-300"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">Share your thoughts &amp; highlights</label>
              <Textarea
                placeholder="What did you enjoy most? How was the host, transport, and itinerary?"
                rows={4}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
            </div>
          </div>
        )}

        {!submitted && (
          <DialogFooter className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              size="sm"
              className="bg-indigo-600 hover:bg-indigo-700 font-bold"
              onClick={handleSubmit}
              disabled={!comment.trim()}
            >
              Submit Review
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
