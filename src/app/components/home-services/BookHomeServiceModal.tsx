import { useState } from "react";
import {
  X,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  CreditCard,
  Building,
} from "lucide-react";
import type { HomeServiceWorker, PricingModel, DayOfWeek } from "../../../types/homeServices";
import { homeServiceApi } from "../../../services/homeServices/homeServiceApi";

interface BookHomeServiceModalProps {
  worker: HomeServiceWorker;
  onClose: () => void;
  onSuccess: () => void;
}

const ALL_DAYS: { id: DayOfWeek; label: string }[] = [
  { id: "MONDAY", label: "Mon" },
  { id: "TUESDAY", label: "Tue" },
  { id: "WEDNESDAY", label: "Wed" },
  { id: "THURSDAY", label: "Thu" },
  { id: "FRIDAY", label: "Fri" },
  { id: "SATURDAY", label: "Sat" },
  { id: "SUNDAY", label: "Sun" },
];

export function BookHomeServiceModal({ worker, onClose, onSuccess }: BookHomeServiceModalProps) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(
    worker.skills[0]?.categoryId || ""
  );
  const [selectedPackageId, setSelectedPackageId] = useState<string>("");
  const [bookingType, setBookingType] = useState<"MONTHLY" | "DAILY" | "WEEKLY" | "ONE_TIME">("MONTHLY");
  const [pricingModel, setPricingModel] = useState<PricingModel>("FIXED_MONTHLY");
  const [startDate, setStartDate] = useState<string>("2026-10-01");
  const [startTime, setStartTime] = useState<string>("08:00");
  const [endTime, setEndTime] = useState<string>("09:30");
  const [recurringDays, setRecurringDays] = useState<DayOfWeek[]>([
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
  ]);
  const [price, setPrice] = useState<number>(3500);
  const [flatNumber, setFlatNumber] = useState<string>("A-204");
  const [tower, setTower] = useState<string>("A");
  const [notes, setNotes] = useState<string>("");

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const toggleDay = (day: DayOfWeek) => {
    if (recurringDays.includes(day)) {
      setRecurringDays(recurringDays.filter((d) => d !== day));
    } else {
      setRecurringDays([...recurringDays, day]);
    }
  };

  const handlePackageSelect = (pkgId: string) => {
    setSelectedPackageId(pkgId);
    const pkg = worker.packages?.find((p) => p.id === pkgId);
    if (pkg) {
      setSelectedCategoryId(pkg.categoryId);
      setBookingType(pkg.frequency);
      setPricingModel(pkg.pricingModel);
      setPrice(pkg.price);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSubmitting(true);

    try {
      await homeServiceApi.createBooking({
        workerId: worker.id,
        categoryId: selectedCategoryId,
        packageId: selectedPackageId || undefined,
        bookingType,
        pricingModel,
        startDate,
        recurringDays: bookingType === "ONE_TIME" ? [] : recurringDays,
        startTime,
        endTime,
        price,
        flatNumber,
        tower,
        notes,
      });

      onSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to submit booking request.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3.5 sm:p-6 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden max-w-xl w-full">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground font-black text-base flex items-center justify-center">
              {worker.displayName[0]}
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                Request Service with {worker.displayName}
              </h3>
              <p className="text-xs text-slate-500">
                ⭐ {worker.rating.toFixed(1)} • {worker.experienceYears} Yrs Exp • Flat {flatNumber}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="m-5 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {errorMsg}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {/* Predefined Packages if any */}
          {worker.packages && worker.packages.length > 0 && (
            <div>
              <label className="font-extrabold uppercase text-slate-400 block mb-1.5">
                Select Predefined Package (Optional)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {worker.packages.map((pkg) => (
                  <button
                    type="button"
                    key={pkg.id}
                    onClick={() => handlePackageSelect(pkg.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      selectedPackageId === pkg.id
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-slate-200 dark:border-slate-800 hover:border-slate-300"
                    }`}
                  >
                    <div className="font-extrabold text-slate-900 dark:text-white truncate">
                      {pkg.name}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      ₹{pkg.price} • {pkg.frequency}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Service Category */}
          <div>
            <label className="font-extrabold uppercase text-slate-400 block mb-1.5">
              Service Type
            </label>
            <select
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold outline-none"
            >
              {worker.skills.map((s) => (
                <option key={s.categoryId} value={s.categoryId}>
                  {s.categoryName}
                </option>
              ))}
            </select>
          </div>

          {/* Frequency & Pricing Model */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-extrabold uppercase text-slate-400 block mb-1.5">
                Frequency
              </label>
              <select
                value={bookingType}
                onChange={(e) => setBookingType(e.target.value as any)}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold outline-none"
              >
                <option value="MONTHLY">Monthly Arrangement</option>
                <option value="DAILY">Daily (Pay per Day)</option>
                <option value="WEEKLY">Weekly</option>
                <option value="ONE_TIME">One-Time Visit</option>
              </select>
            </div>

            <div>
              <label className="font-extrabold uppercase text-slate-400 block mb-1.5">
                Pricing Model
              </label>
              <select
                value={pricingModel}
                onChange={(e) => setPricingModel(e.target.value as any)}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold outline-none"
              >
                <option value="FIXED_MONTHLY">Fixed Monthly Rate</option>
                <option value="PER_DAY">Per Completed Day</option>
                <option value="PER_VISIT">Per Visit</option>
                <option value="PER_HOUR">Per Hour</option>
              </select>
            </div>
          </div>

          {/* Recurring Days if recurring */}
          {bookingType !== "ONE_TIME" && (
            <div>
              <label className="font-extrabold uppercase text-slate-400 block mb-1.5">
                Service Days
              </label>
              <div className="flex items-center gap-1.5 flex-wrap">
                {ALL_DAYS.map((d) => {
                  const isChecked = recurringDays.includes(d.id);
                  return (
                    <button
                      type="button"
                      key={d.id}
                      onClick={() => toggleDay(d.id)}
                      className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                        isChecked
                          ? "bg-primary text-primary-foreground shadow-xs"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200"
                      }`}
                    >
                      {d.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Time Slot & Start Date */}
          <div className="grid grid-cols-3 gap-2.5">
            <div>
              <label className="font-extrabold uppercase text-slate-400 block mb-1.5">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold outline-none"
              />
            </div>
            <div>
              <label className="font-extrabold uppercase text-slate-400 block mb-1.5">
                Start Time
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold outline-none"
              />
            </div>
            <div>
              <label className="font-extrabold uppercase text-slate-400 block mb-1.5">
                End Time
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold outline-none"
              />
            </div>
          </div>

          {/* Rate / Agreed Price */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-extrabold uppercase text-slate-400 block mb-1.5">
                Agreed Rate (₹)
              </label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-black text-sm outline-none"
              />
            </div>

            <div>
              <label className="font-extrabold uppercase text-slate-400 block mb-1.5">
                Your Flat
              </label>
              <input
                type="text"
                value={flatNumber}
                onChange={(e) => setFlatNumber(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold outline-none"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="font-extrabold uppercase text-slate-400 block mb-1.5">
              Special Instructions / Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Please ring the main door bell, 3BHK flat, mop with disinfectant."
              className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium outline-none resize-none"
            />
          </div>

          {/* Footer Submit */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Summary</span>
              <span className="text-sm font-black text-slate-900 dark:text-white">
                ₹{price.toLocaleString("en-IN")}
                <span className="text-[10px] font-normal text-slate-400">
                  {pricingModel === "FIXED_MONTHLY" ? "/month" : "/visit"}
                </span>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-bold hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-extrabold shadow-md hover:opacity-95 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
              >
                {submitting ? "Sending..." : "Send Booking Request"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
