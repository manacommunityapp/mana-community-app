import { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
  Check,
  Loader2,
  AlertCircle,
  Store,
  IndianRupee,
  FileText,
  MapPin,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import {
  vendorServiceCatalog,
  vendorService,
  vendorAvailabilityService,
  vendorBookingService,
} from "../../../../services/vendorService";
import { showSuccess, showError } from "../../../../utils/ToastUtils";
import type {
  VendorServiceResponse,
  VendorResponse,
} from "../../../../types/api";
import { useParams, useNavigate } from "react-router";

type BookingStep = "service" | "datetime" | "confirm";

const STEPS: { key: BookingStep; label: string }[] = [
  { key: "service", label: "Service Details" },
  { key: "datetime", label: "Date & Time" },
  { key: "confirm", label: "Confirmation" },
];

function StepIndicator({
  steps,
  current,
}: {
  steps: typeof STEPS;
  current: BookingStep;
}) {
  const currentIdx = steps.findIndex((s) => s.key === current);
  return (
    <div className="flex items-center justify-center gap-2">
      {steps.map((step, idx) => {
        const isComplete = idx < currentIdx;
        const isActive = idx === currentIdx;
        return (
          <div key={step.key} className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                  isComplete
                    ? "bg-primary text-primary-foreground"
                    : isActive
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {isComplete ? <Check className="h-4 w-4" /> : idx + 1}
              </div>
              <span
                className={`text-xs font-medium hidden sm:inline ${
                  isActive
                    ? "text-foreground"
                    : "text-muted-foreground"
                }`}
              >
                {step.label}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div
                className={`h-px w-8 sm:w-12 ${
                  isComplete ? "bg-primary" : "bg-muted"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function generateDates(count: number): Date[] {
  const dates: Date[] = [];
  const today = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    dates.push(d);
  }
  return dates;
}

export function BookingFlow() {
  const { vendorId, serviceId } = useParams<{
    vendorId: string;
    serviceId: string;
  }>();
  const navigate = useNavigate();

  const [step, setStep] = useState<BookingStep>("service");
  const [vendor, setVendor] = useState<VendorResponse | null>(null);
  const [service, setService] = useState<VendorServiceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Date/time selection
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  // Extra fields
  const [notes, setNotes] = useState("");
  const [address, setAddress] = useState("");

  const vId = Number(vendorId);
  const sId = Number(serviceId);
  const availableDates = generateDates(14);

  useEffect(() => {
    if (!vendorId || !serviceId || isNaN(vId) || isNaN(sId)) return;
    loadData();
  }, [vendorId, serviceId]);

  useEffect(() => {
    if (selectedDate) {
      loadSlots();
    }
  }, [selectedDate]);

  async function loadData() {
    setLoading(true);
    try {
      const [vendorData, serviceData] = await Promise.all([
        vendorService.getVendorById(vId),
        vendorServiceCatalog.getServiceById(sId),
      ]);
      setVendor(vendorData);
      setService(serviceData);
    } catch {
      showError("Failed to load booking details");
    } finally {
      setLoading(false);
    }
  }

  async function loadSlots() {
    if (!selectedDate) return;
    setSlotsLoading(true);
    setSelectedTime(null);
    try {
      const dateStr = selectedDate.toISOString().split("T")[0];
      const slots = await vendorAvailabilityService.getAvailableSlots(
        vId,
        sId,
        dateStr
      );
      setAvailableSlots(slots);
    } catch {
      setAvailableSlots([]);
      showError("Failed to load available time slots");
    } finally {
      setSlotsLoading(false);
    }
  }

  async function handleSubmit() {
    if (!selectedDate || !selectedTime || !service) return;
    setSubmitting(true);
    try {
      const booking = await vendorBookingService.createBooking({
        vendorId: vId,
        serviceId: sId,
        scheduledDate: selectedDate.toISOString().split("T")[0],
        scheduledTime: selectedTime,
        notes: notes || undefined,
        address: address || undefined,
      });
      showSuccess(
        `Booking confirmed! Reference: ${booking.bookingNumber}`
      );
      navigate("/marketplace/my-bookings");
    } catch {
      showError("Failed to create booking. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(n);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!vendor || !service) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-sm font-medium text-muted-foreground">
          Service or vendor not found
        </p>
        <Button
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={() => navigate("/marketplace")}
        >
          Back to Marketplace
        </Button>
      </div>
    );
  }

  const effectivePrice =
    service.discountPrice != null && service.discountPrice < service.price
      ? service.discountPrice
      : service.price;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(`/marketplace/vendor/${vId}`)}
          className="mb-2 -ml-2"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to {vendor.businessName}
        </Button>
        <h1 className="text-xl font-bold text-foreground">Book a Service</h1>
      </div>

      {/* Steps */}
      <StepIndicator steps={STEPS} current={step} />

      {/* Step 1: Service Details */}
      {step === "service" && (
        <Card>
          <CardContent className="pt-5">
            <div className="flex flex-col sm:flex-row gap-4">
              {service.imageUrl && (
                <div className="h-40 sm:h-32 sm:w-40 rounded-lg overflow-hidden bg-muted shrink-0">
                  <img
                    src={service.imageUrl}
                    alt={service.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-semibold text-foreground">
                  {service.name}
                </h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  by {vendor.businessName}
                </p>
                {service.description && (
                  <p className="text-sm text-muted-foreground mt-2">
                    {service.description}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-3 mt-3">
                  <div className="flex items-center gap-1 text-sm font-semibold text-foreground">
                    <IndianRupee className="h-3.5 w-3.5" />
                    {formatCurrency(effectivePrice)}
                    {service.priceUnit && (
                      <span className="text-xs font-normal text-muted-foreground">
                        /{service.priceUnit}
                      </span>
                    )}
                  </div>
                  {service.duration != null && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      {service.duration}
                      {service.durationUnit
                        ? ` ${service.durationUnit}`
                        : " min"}
                    </div>
                  )}
                  {service.categoryName && (
                    <Badge variant="outline" className="text-xs">
                      {service.categoryName}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <Button onClick={() => setStep("datetime")}>
                Continue
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Date & Time */}
      {step === "datetime" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">
              Select Date & Time
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Date Grid */}
            <div>
              <p className="text-sm font-medium text-foreground mb-3">
                Choose a date
              </p>
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                {availableDates.map((date) => {
                  const isSelected =
                    selectedDate?.toDateString() === date.toDateString();
                  const isToday =
                    date.toDateString() === new Date().toDateString();
                  return (
                    <button
                      key={date.toISOString()}
                      onClick={() => setSelectedDate(date)}
                      className={`flex flex-col items-center py-2 px-1 rounded-lg border text-center transition-colors ${
                        isSelected
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <span className="text-[10px] uppercase text-muted-foreground">
                        {date.toLocaleDateString("en-US", {
                          weekday: "short",
                        })}
                      </span>
                      <span className="text-sm font-semibold mt-0.5">
                        {date.getDate()}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {date.toLocaleDateString("en-US", { month: "short" })}
                      </span>
                      {isToday && (
                        <span className="text-[9px] text-primary font-medium">
                          Today
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Time Slots */}
            {selectedDate && (
              <div>
                <p className="text-sm font-medium text-foreground mb-3">
                  Choose a time
                </p>
                {slotsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    <span className="ml-2 text-sm text-muted-foreground">
                      Loading available slots...
                    </span>
                  </div>
                ) : availableSlots.length > 0 ? (
                  <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
                    {availableSlots.map((slot) => (
                      <button
                        key={slot}
                        onClick={() => setSelectedTime(slot)}
                        className={`py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${
                          selectedTime === slot
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border hover:border-primary/50 text-foreground"
                        }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-sm text-muted-foreground">
                    No available slots for this date. Please try another date.
                  </div>
                )}
              </div>
            )}

            {/* Notes & Address */}
            {selectedTime && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1.5">
                    Address (optional)
                  </label>
                  <Input
                    placeholder="Service address..."
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1.5">
                    Notes (optional)
                  </label>
                  <textarea
                    placeholder="Any special requests or instructions..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                  />
                </div>
              </div>
            )}

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep("service")}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
              <Button
                onClick={() => setStep("confirm")}
                disabled={!selectedDate || !selectedTime}
              >
                Continue
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Confirmation */}
      {step === "confirm" && selectedDate && selectedTime && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">
              Booking Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-border p-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Service</span>
                <span className="font-medium text-foreground">
                  {service.name}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Vendor</span>
                <span className="font-medium text-foreground">
                  {vendor.businessName}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Date</span>
                <span className="font-medium text-foreground">
                  {selectedDate.toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Time</span>
                <span className="font-medium text-foreground">
                  {selectedTime}
                </span>
              </div>
              {service.duration != null && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Duration</span>
                  <span className="font-medium text-foreground">
                    {service.duration}
                    {service.durationUnit
                      ? ` ${service.durationUnit}`
                      : " min"}
                  </span>
                </div>
              )}
              {address && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Address</span>
                  <span className="font-medium text-foreground text-right max-w-[60%]">
                    {address}
                  </span>
                </div>
              )}
              {notes && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Notes</span>
                  <span className="font-medium text-foreground text-right max-w-[60%]">
                    {notes}
                  </span>
                </div>
              )}
              <div className="border-t border-border pt-3 flex justify-between">
                <span className="text-sm font-semibold text-foreground">
                  Total
                </span>
                <span className="text-sm font-bold text-foreground">
                  {formatCurrency(effectivePrice)}
                </span>
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep("datetime")}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                    Confirming...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-1.5" />
                    Confirm Booking
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
