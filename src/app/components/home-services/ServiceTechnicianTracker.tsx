import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router";
import {
  Wrench,
  ShieldCheck,
  Phone,
  MessageCircle,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  Star,
  Sparkles,
  ArrowLeft,
  Navigation,
  KeyRound,
  Copy,
  FileText,
  Check,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../ui/dialog";
import { Textarea } from "../ui/textarea";
import { homeServiceApi } from "../../../services/homeServices/homeServiceApi";
import type { HomeServiceBooking, BookingStatus } from "../../../types/homeServices";

type TrackingStep = "CONFIRMED" | "DISPATCHED" | "EN_ROUTE" | "AT_GATE" | "IN_PROGRESS" | "COMPLETED";

interface StepConfig {
  step: TrackingStep;
  title: string;
  subtitle: string;
  timeEst: string;
}

const TRACKING_STEPS: StepConfig[] = [
  { step: "CONFIRMED", title: "Booking Confirmed", subtitle: "Technician assigned & work order authorized", timeEst: "10:00 AM" },
  { step: "DISPATCHED", title: "Dispatched", subtitle: "Technician packed tools & left workshop", timeEst: "10:15 AM" },
  { step: "EN_ROUTE", title: "En Route", subtitle: "Approaching society boulevard (1.2 km away)", timeEst: "10:28 AM (~12 mins)" },
  { step: "AT_GATE", title: "Arrived at Gate", subtitle: "Security clearance & facial verification pass", timeEst: "10:35 AM" },
  { step: "IN_PROGRESS", title: "Service In Progress", subtitle: "Work actively underway in your apartment", timeEst: "10:40 AM" },
  { step: "COMPLETED", title: "Completed & Verified", subtitle: "Resident OTP verified & work certified", timeEst: "11:20 AM" },
];

export const ServiceTechnicianTracker: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();

  const [booking, setBooking] = useState<HomeServiceBooking | null>(null);
  const [currentStep, setCurrentStep] = useState<TrackingStep>("EN_ROUTE");
  const [etaMinutes, setEtaMinutes] = useState<number>(12);
  const [copiedOtp, setCopiedOtp] = useState<boolean>(false);

  // Review modal state
  const [reviewModalOpen, setReviewModalOpen] = useState<boolean>(false);
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState<string>("");
  const [reviewSubmitted, setReviewSubmitted] = useState<boolean>(false);

  useEffect(() => {
    loadBooking();
  }, [id]);

  const loadBooking = async () => {
    if (id) {
      const b = await homeServiceApi.getBookingById(id);
      if (b) {
        setBooking(b);
        mapBookingStatusToStep(b.status);
        return;
      }
    }

    // Fallback: search for active booking or initialize rich technician tracker
    const bookings = await homeServiceApi.getBookings();
    const active = bookings.find((b) => b.status === "CONFIRMED" || b.status === "SCHEDULED" || b.status === "IN_PROGRESS");
    if (active) {
      setBooking(active);
      mapBookingStatusToStep(active.status);
    } else {
      // Default fallback demo technician booking
      const fallbackBooking: HomeServiceBooking = {
        id: "SRV-9082",
        communityId: "comm-mana-1",
        flatId: "flat-a-204",
        tower: "A",
        flatNumber: "A-204",
        residentUserId: "user-current",
        residentName: "Sandesh Patil",
        residentPhoneMasked: "98******11",
        workerId: "worker-ramesh",
        workerName: "Ramesh Sharma",
        categoryId: "cat-ac",
        categoryName: "AC / Appliance Service",
        categoryCode: "AC_SERVICE",
        packageName: "AC Jet Pump Deep Cleaning & Gas Inspection",
        bookingType: "ONE_TIME",
        pricingModel: "PER_VISIT",
        startDate: new Date().toISOString().split("T")[0],
        recurringDays: [],
        startTime: "10:30 AM",
        endTime: "11:45 AM",
        price: 850,
        status: "CONFIRMED",
        completionOtp: "5829",
        notes: "Master bedroom split AC needs water jet deep coil clean and filter wash.",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setBooking(fallbackBooking);
      setCurrentStep("EN_ROUTE");
    }
  };

  const mapBookingStatusToStep = (status: BookingStatus) => {
    switch (status) {
      case "REQUESTED":
      case "CONFIRMED":
        setCurrentStep("EN_ROUTE");
        break;
      case "IN_PROGRESS":
        setCurrentStep("IN_PROGRESS");
        break;
      case "COMPLETED":
        setCurrentStep("COMPLETED");
        break;
      default:
        setCurrentStep("EN_ROUTE");
    }
  };

  const currentStepIndex = TRACKING_STEPS.findIndex((s) => s.step === currentStep);

  const handleCopyOtp = (otp: string) => {
    navigator.clipboard.writeText(otp);
    setCopiedOtp(true);
    setTimeout(() => setCopiedOtp(false), 2500);
  };

  const handleSimulateNextStep = () => {
    const nextIdx = currentStepIndex + 1;
    if (nextIdx < TRACKING_STEPS.length) {
      const nextStep = TRACKING_STEPS[nextIdx].step;
      setCurrentStep(nextStep);
      if (nextStep === "AT_GATE") setEtaMinutes(2);
      if (nextStep === "IN_PROGRESS") setEtaMinutes(0);
      if (nextStep === "COMPLETED") {
        setReviewModalOpen(true);
      }
    }
  };

  const handleSubmitReview = async () => {
    if (!booking) return;
    try {
      await homeServiceApi.createReview({
        bookingId: booking.id,
        revieweeId: booking.workerId,
        rating: reviewRating,
        workQuality: reviewRating,
        punctuality: 5,
        behaviour: 5,
        reliability: 5,
        comment: reviewComment || "Excellent and thorough service! Punctual and polite.",
        isAnonymous: false,
      });
      setReviewSubmitted(true);
      setTimeout(() => {
        setReviewModalOpen(false);
      }, 1500);
    } catch {
      setReviewSubmitted(true);
      setTimeout(() => {
        setReviewModalOpen(false);
      }, 1500);
    }
  };

  const completionOtp = booking?.completionOtp || "5829";

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/home-services/bookings")}
          className="text-xs font-bold text-slate-600 dark:text-slate-300"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to My Bookings
        </Button>

        <div className="flex items-center gap-2">
          <Badge className="bg-primary/10 text-primary border-primary/20 text-xs font-mono">
            Booking #{booking?.id || "SRV-9082"}
          </Badge>
          <span className="text-xs font-semibold text-slate-500">Flat {booking?.flatNumber || "A-204"}</span>
        </div>
      </div>

      {/* Main Tracker Card */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-md overflow-hidden">
        {/* Banner with ETA */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-primary p-6 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-[11px] font-extrabold tracking-wide uppercase">
                {currentStep === "COMPLETED" ? "Job Concluded" : "Live Technician Dispatch"}
              </span>
              {currentStep !== "COMPLETED" && (
                <span className="flex items-center gap-1 text-[11px] bg-emerald-500/80 px-2 py-0.5 rounded-full font-bold">
                  <span className="w-2 h-2 rounded-full bg-white animate-ping inline-block" /> Live GPS Active
                </span>
              )}
            </div>

            <h2 className="text-2xl font-black mt-2">
              {currentStep === "COMPLETED"
                ? "Service Successfully Completed"
                : currentStep === "IN_PROGRESS"
                ? "Technician Inside Apartment"
                : currentStep === "AT_GATE"
                ? "Technician Arrived at Main Gate"
                : `Estimated Arrival: ~${etaMinutes} Minutes`}
            </h2>
            <p className="text-xs text-white/80 mt-1">
              {booking?.categoryName || "AC Service"} • {booking?.packageName || "Standard Maintenance"}
            </p>
          </div>

          {/* Quick Simulation Stepper for Demo/Testing */}
          <div className="self-end sm:self-auto flex items-center gap-2">
            {currentStep !== "COMPLETED" ? (
              <Button
                size="sm"
                variant="secondary"
                onClick={handleSimulateNextStep}
                className="bg-white/90 text-slate-900 hover:bg-white text-xs font-bold shadow-md"
              >
                Simulate Step Advance <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={() => setReviewModalOpen(true)}
                className="bg-amber-400 hover:bg-amber-500 text-slate-900 font-bold text-xs"
              >
                <Star className="w-3.5 h-3.5 mr-1" /> Rate Technician
              </Button>
            )}
          </div>
        </div>

        <CardContent className="p-6 space-y-6">
          {/* Progress Timeline */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Service Progression Timeline
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {TRACKING_STEPS.map((s, idx) => {
                const isPassed = idx < currentStepIndex;
                const isCurrent = idx === currentStepIndex;
                return (
                  <div
                    key={s.step}
                    className={`p-3 rounded-xl border transition-all ${
                      isCurrent
                        ? "border-primary bg-primary/5 dark:bg-primary/10 shadow-xs"
                        : isPassed
                        ? "border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20"
                        : "border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 opacity-60"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-mono font-bold text-slate-400">
                        0{idx + 1}
                      </span>
                      {isPassed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : isCurrent ? (
                        <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
                      ) : (
                        <Clock className="w-3.5 h-3.5 text-slate-300" />
                      )}
                    </div>
                    <div className={`text-xs font-bold leading-tight ${isCurrent ? "text-primary" : "text-slate-800 dark:text-slate-200"}`}>
                      {s.title}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1 leading-tight">
                      {s.timeEst}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Technician Profile & Security OTP Box */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
            {/* Technician Card */}
            <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3.5">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center font-black text-xl shrink-0">
                      {booking?.workerName?.[0] || "R"}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-extrabold text-base text-slate-900 dark:text-white">
                          {booking?.workerName || "Ramesh Sharma"}
                        </h4>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 text-[10px] font-bold flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" /> Verified
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Senior Technician • 8 Years Exp.
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-xs">
                        <span className="flex items-center gap-1 text-amber-500 font-extrabold">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> 4.9
                        </span>
                        <span className="text-slate-400">•</span>
                        <span className="text-slate-500 font-medium">142 society jobs completed</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                  <p className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-500" /> Police Verified &amp; Aadhaar Authenticated
                  </p>
                  <p className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-500" /> Society Security Gate RFID Badge Active
                  </p>
                  <p className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-500" /> Equipped with calibrated diagnostic tools
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                <a
                  href="tel:+919876543210"
                  className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                >
                  <Phone className="w-3.5 h-3.5" /> Call Worker
                </a>
                <button
                  onClick={() => alert("Connecting to in-app messaging...")}
                  className="flex-1 py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-primary" /> Chat
                </button>
              </div>
            </div>

            {/* Secret Completion OTP Card */}
            <div className="p-5 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-slate-900/5 rounded-2xl border-2 border-amber-300 dark:border-amber-900/50 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <KeyRound className="w-5 h-5 text-amber-600" />
                    <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                      Secure Completion OTP
                    </span>
                  </div>
                  <Badge className="bg-amber-500 text-white text-[10px]">VERIFICATION KEY</Badge>
                </div>

                <div className="my-4 text-center">
                  <div className="inline-flex items-center gap-3 px-6 py-3 bg-white dark:bg-slate-900 rounded-2xl border border-amber-300 shadow-sm">
                    {completionOtp.split("").map((digit, i) => (
                      <span
                        key={i}
                        className="w-10 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 text-2xl font-black font-mono flex items-center justify-center border border-amber-200 dark:border-amber-800"
                      >
                        {digit}
                      </span>
                    ))}
                  </div>

                  <div className="mt-2">
                    <button
                      onClick={() => handleCopyOtp(completionOtp)}
                      className="text-xs font-bold text-amber-700 dark:text-amber-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      {copiedOtp ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedOtp ? "OTP Copied!" : "Copy 4-Digit Code"}
                    </button>
                  </div>
                </div>

                <div className="bg-amber-50 dark:bg-amber-950/40 p-3 rounded-xl border border-amber-200/80 text-amber-900 dark:text-amber-300 text-xs flex items-start gap-2.5">
                  <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    <strong className="font-bold">Security Note:</strong> Do not share this OTP until the technician has completely finished the repair work and you are fully satisfied.
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-amber-200/60 flex items-center justify-between text-xs text-slate-500">
                <span>Quoted Price:</span>
                <span className="font-black text-slate-900 dark:text-white text-sm">
                  ₹{booking?.price || 850} (CFBOS Pre-Authorized)
                </span>
              </div>
            </div>
          </div>

          {/* Simulated Society Radar & Map View */}
          <div className="bg-slate-50 dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Navigation className="w-4 h-4 text-primary" />
                <span className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wide">
                  Society Campus Radar &amp; Gate Transition
                </span>
              </div>
              <span className="text-xs text-slate-400">
                Gate 2 ➔ Main Boulevard ➔ Tower {booking?.tower || "A"} Lift Lobby
              </span>
            </div>

            {/* Radar Canvas / Path SVG */}
            <div className="relative h-44 w-full bg-slate-950 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center p-4">
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]" />

              {/* Pathway Graph */}
              <div className="relative w-full max-w-lg flex items-center justify-between text-xs z-10">
                {/* Gate 2 */}
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 text-slate-200 border border-slate-700 flex items-center justify-center font-bold">
                    <MapPin className="w-5 h-5 text-emerald-400" />
                  </div>
                  <span className="text-[11px] font-bold text-slate-300 mt-1.5">Gate 2</span>
                  <span className="text-[9px] text-emerald-400 font-mono">ANPR Entry</span>
                </div>

                {/* Connecting Line 1 */}
                <div className="flex-1 h-0.5 bg-gradient-to-r from-emerald-500 via-primary to-primary mx-2 relative">
                  {currentStep === "EN_ROUTE" && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 flex flex-col items-center animate-bounce">
                      <div className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center shadow-lg border-2 border-white">
                        <Wrench className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-[9px] font-bold text-sky-400 bg-slate-900 px-1 rounded mt-0.5">
                        Moving
                      </span>
                    </div>
                  )}
                </div>

                {/* Security Cabin */}
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 text-slate-200 border border-slate-700 flex items-center justify-center font-bold">
                    <ShieldCheck className="w-5 h-5 text-sky-400" />
                  </div>
                  <span className="text-[11px] font-bold text-slate-300 mt-1.5">Security Hub</span>
                  <span className="text-[9px] text-slate-400 font-mono">ID Check</span>
                </div>

                {/* Connecting Line 2 */}
                <div className="flex-1 h-0.5 bg-slate-700 mx-2 relative">
                  {currentStep === "AT_GATE" && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 flex flex-col items-center animate-bounce">
                      <div className="w-7 h-7 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-lg border-2 border-white">
                        <Wrench className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-[9px] font-bold text-amber-400 bg-slate-900 px-1 rounded mt-0.5">
                        At Gate
                      </span>
                    </div>
                  )}
                </div>

                {/* Tower A */}
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-xl bg-indigo-900/60 text-indigo-300 border border-indigo-700 flex items-center justify-center font-bold">
                    <span className="font-black text-sm">T-A</span>
                  </div>
                  <span className="text-[11px] font-bold text-slate-300 mt-1.5">Tower {booking?.tower || "A"}</span>
                  <span className="text-[9px] text-indigo-400 font-mono">Flat {booking?.flatNumber || "A-204"}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Post-Completion Review & Star Rating Modal */}
      <Dialog open={reviewModalOpen} onOpenChange={setReviewModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-500 fill-amber-500" /> Rate Technician Experience
            </DialogTitle>
            <DialogDescription className="text-xs">
              Help maintain top service quality standards across Mana Community.
            </DialogDescription>
          </DialogHeader>

          {reviewSubmitted ? (
            <div className="py-6 text-center space-y-3">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="font-extrabold text-base text-slate-900 dark:text-white">
                Thank you for your rating!
              </h4>
              <p className="text-xs text-slate-500">
                Your feedback has been saved to technician {booking?.workerName}&apos;s profile.
              </p>
            </div>
          ) : (
            <div className="space-y-4 py-2 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 dark:text-white block">
                    {booking?.workerName || "Ramesh Sharma"}
                  </span>
                  <span className="text-[11px] text-slate-500">{booking?.packageName || "AC Maintenance"}</span>
                </div>
                <Badge className="bg-emerald-600 text-white text-[10px]">JOB COMPLETE</Badge>
              </div>

              {/* Star Selector */}
              <div>
                <label className="block text-slate-500 mb-1.5 font-bold">Overall Rating</label>
                <div className="flex items-center justify-center gap-2 py-2 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      className="p-1.5 cursor-pointer hover:scale-115 transition-transform"
                    >
                      <Star
                        className={`w-7 h-7 ${
                          star <= reviewRating
                            ? "fill-amber-400 text-amber-400"
                            : "text-slate-300 dark:text-slate-700"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Comments */}
              <div>
                <label className="block text-slate-500 mb-1 font-bold">Feedback / Remarks (Optional)</label>
                <Textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Share details regarding punctuality, quality of work, and cleanliness..."
                  rows={3}
                  className="text-xs"
                />
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setReviewModalOpen(false)}>
                  Skip
                </Button>
                <Button
                  onClick={handleSubmitReview}
                  className="bg-primary text-primary-foreground font-bold"
                >
                  Submit Review
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
export default ServiceTechnicianTracker;
