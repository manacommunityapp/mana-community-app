import { useState, useEffect } from "react";
import {
  X,
  Clock,
  Calendar,
  CheckCircle2,
  ShieldCheck,
  CreditCard,
  MapPin,
  Sparkles,
  AlertCircle,
  QrCode,
  DollarSign,
  User,
  Phone,
  Building,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { sportsVendorService } from "../../../../services/sports/sportsVendorService";
import type {
  SportsFacility,
  SportsCourtConfig,
  SportsCourtSlot,
  SportsVendorBooking,
} from "../../../../types/sportsVendor";
import { useAuth } from "../../../../contexts/AuthContext";

interface Props {
  facility: SportsFacility;
  onClose: () => void;
}

export function SportsCourtBookingModal({ facility, onClose }: Props) {
  const { user } = useAuth();
  const [courts, setCourts] = useState<SportsCourtConfig[]>([]);
  const [selectedCourtId, setSelectedCourtId] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [slots, setSlots] = useState<SportsCourtSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<SportsCourtSlot | null>(null);
  const [loadingCourts, setLoadingCourts] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState<SportsVendorBooking | null>(null);

  // Resident form details
  const [customerName, setCustomerName] = useState(user?.fullName || "Resident Player");
  const [customerPhone, setCustomerPhone] = useState(user?.phone || "+91 98860 11223");
  const [customerEmail, setCustomerEmail] = useState(user?.email || "resident@manacommunity.in");
  const [unitOrCommunity, setUnitOrCommunity] = useState("Prestige Shantiniketan - Tower 4");
  const [paymentMode, setPaymentMode] = useState<"ONLINE" | "VENUE">("ONLINE");

  useEffect(() => {
    loadCourts();
  }, [facility.id]);

  useEffect(() => {
    if (selectedCourtId && selectedDate) {
      loadSlots(selectedCourtId, selectedDate);
    }
  }, [selectedCourtId, selectedDate]);

  async function loadCourts() {
    setLoadingCourts(true);
    try {
      const crts = await sportsVendorService.getCourts(facility.id);
      setCourts(crts);
      if (crts.length > 0) {
        setSelectedCourtId(crts[0].id);
      }
    } catch (err) {
      toast.error("Failed to load courts");
    } finally {
      setLoadingCourts(false);
    }
  }

  async function loadSlots(courtId: string, date: string) {
    setLoadingSlots(true);
    setSelectedSlot(null);
    try {
      const s = await sportsVendorService.getCourtSlots(courtId, date);
      setSlots(s);
    } catch (err) {
      toast.error("Failed to load time slots");
    } finally {
      setLoadingSlots(false);
    }
  }

  const selectedCourt = courts.find((c) => c.id === selectedCourtId);

  async function handleConfirmBooking(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedSlot) {
      toast.error("Please select an available time slot");
      return;
    }

    setSubmitting(true);
    try {
      const booking = await sportsVendorService.createBooking({
        courtId: selectedSlot.courtId,
        date: selectedSlot.date,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
        customerName,
        customerPhone,
        customerEmail,
        unitOrCommunity,
        isResident: true,
        paymentMode,
      });
      setConfirmedBooking(booking);
      toast.success("Court reservation confirmed!");
    } catch (err) {
      toast.error("Failed to complete booking. Please try another slot.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-6 text-white flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-bold text-emerald-100">
                Live Reservation
              </span>
              {facility.isFederated && (
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/30 text-[10px] font-bold text-indigo-100">
                  Resident Benefit Applied
                </span>
              )}
            </div>
            <h2 className="text-lg font-bold">{facility.name}</h2>
            <p className="text-xs text-emerald-100 flex items-center gap-1 mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-300" />
              {facility.area}, {facility.city}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {confirmedBooking ? (
          /* Confirmation Screen */
          <div className="p-8 text-center space-y-5">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-black text-slate-900">Court Booked Successfully!</h3>
              <p className="text-xs text-slate-500">
                Your reservation has been locked. Show the QR code or booking number at the arena desk.
              </p>
            </div>

            {/* QR Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 max-w-sm mx-auto space-y-3">
              <div className="w-32 h-32 bg-white rounded-xl border border-slate-300 flex items-center justify-center mx-auto shadow-xs">
                <QrCode className="w-24 h-24 text-slate-800" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Booking Number
                </span>
                <span className="text-sm font-mono font-bold text-slate-900">
                  {confirmedBooking.bookingNumber}
                </span>
              </div>
              <div className="text-xs text-slate-600 pt-2 border-t border-slate-200 space-y-1 text-left">
                <div className="flex justify-between">
                  <span className="text-slate-400">Court:</span>
                  <span className="font-bold">{confirmedBooking.courtName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Date & Slot:</span>
                  <span className="font-bold">
                    {confirmedBooking.bookingDate} ({confirmedBooking.startTime} - {confirmedBooking.endTime})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Paid:</span>
                  <span className="font-bold text-emerald-600">₹{confirmedBooking.amount}</span>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors"
            >
              Done & Return
            </button>
          </div>
        ) : (
          /* Selection & Checkout Form */
          <form onSubmit={handleConfirmBooking} className="p-6 space-y-5 text-xs">
            {/* Step 1: Court & Date Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Select Court</label>
                <select
                  value={selectedCourtId}
                  onChange={(e) => setSelectedCourtId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold text-slate-800"
                >
                  {courts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.sportType} • ₹{c.baseHourlyPrice}/hr)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Select Date</label>
                <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white">
                  <Calendar className="w-4 h-4 text-emerald-600" />
                  <input
                    type="date"
                    min={new Date().toISOString().split("T")[0]}
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="border-none bg-transparent font-semibold text-slate-800 focus:outline-hidden w-full cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Step 2: Time Slots Grid */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="font-bold text-slate-700">Available Time Slots</label>
                <span className="text-[11px] text-emerald-600 font-semibold">
                  Includes 15% Community Resident Discount
                </span>
              </div>

              {loadingSlots ? (
                <div className="p-8 text-center text-slate-400">Loading slots...</div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 max-h-48 overflow-y-auto p-1">
                  {slots.map((slot) => {
                    const isOpen = slot.status === "OPEN";
                    const isSelected = selectedSlot?.id === slot.id;

                    return (
                      <button
                        key={slot.id}
                        type="button"
                        disabled={!isOpen}
                        onClick={() => setSelectedSlot(slot)}
                        className={`p-2.5 rounded-xl border text-center transition-all ${
                          !isOpen
                            ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed opacity-60"
                            : isSelected
                            ? "bg-emerald-600 border-emerald-600 text-white shadow-xs font-bold"
                            : "bg-white border-slate-200 hover:border-emerald-300 text-slate-800"
                        }`}
                      >
                        <span className="block font-bold text-xs">{slot.startTime}</span>
                        <span
                          className={`text-[10px] block ${
                            isSelected ? "text-emerald-100" : "text-emerald-600 font-semibold"
                          }`}
                        >
                          ₹{slot.residentPrice}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Step 3: Resident Player Information */}
            <div className="border-t border-slate-100 pt-4 space-y-3">
              <h3 className="font-bold text-slate-900 text-xs">Player Contact & Community Pass</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-500 block mb-1">Full Name</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-500 block mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-500 block mb-1">Apartment / Community Unit</label>
                <input
                  type="text"
                  placeholder="e.g. Tower 3 - Flat 402, Prestige Shantiniketan"
                  value={unitOrCommunity}
                  onChange={(e) => setUnitOrCommunity(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200"
                />
              </div>
            </div>

            {/* Step 4: Summary & Payment Options */}
            {selectedSlot && (
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Standard Court Price</span>
                  <span className="font-semibold text-slate-700">₹{selectedSlot.price}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-emerald-600 font-bold">
                  <span>Resident Partner Benefit</span>
                  <span>- ₹{selectedSlot.price - selectedSlot.residentPrice}</span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-sm">
                  <span className="font-black text-slate-900">Total Payable</span>
                  <span className="font-black text-emerald-700 text-base">
                    ₹{selectedSlot.residentPrice}
                  </span>
                </div>

                <div className="flex items-center gap-4 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                    <input
                      type="radio"
                      name="paymentMode"
                      checked={paymentMode === "ONLINE"}
                      onChange={() => setPaymentMode("ONLINE")}
                      className="text-emerald-600"
                    />
                    Pay Online (Instant Lock)
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                    <input
                      type="radio"
                      name="paymentMode"
                      checked={paymentMode === "VENUE"}
                      onChange={() => setPaymentMode("VENUE")}
                      className="text-emerald-600"
                    />
                    Pay at Venue
                  </label>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!selectedSlot || submitting}
                className={`px-6 py-2.5 rounded-xl font-bold text-white flex items-center gap-2 shadow-xs transition-all ${
                  !selectedSlot || submitting
                    ? "bg-slate-300 cursor-not-allowed"
                    : "bg-emerald-600 hover:bg-emerald-700"
                }`}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Locking Slot...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Confirm Reservation
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
