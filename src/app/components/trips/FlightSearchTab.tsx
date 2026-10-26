import { useState, useCallback } from "react";
import {
  Plane,
  Calendar,
  Users,
  Search,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  Tag,
  Clock,
  Luggage,
  Sparkles,
  X,
  CreditCard,
} from "lucide-react";
import { toast } from "sonner";
import {
  flightService,
  POPULAR_AIRPORTS,
  type FlightOption,
  type FlightSearchResponse,
  type PassengerInfo,
  type FlightBookResponse,
} from "../../../services/trips/flightService";

export function FlightSearchTab() {
  const [origin, setOrigin] = useState("BLR");
  const [destination, setDestination] = useState("DEL");
  const [departureDate, setDepartureDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split("T")[0];
  });
  const [adults, setAdults] = useState(1);
  const [cabinClass, setCabinClass] = useState<"ECONOMY" | "BUSINESS">("ECONOMY");
  const [loading, setLoading] = useState(false);
  const [searchResponse, setSearchResponse] = useState<FlightSearchResponse | null>(null);

  // Booking modal
  const [selectedFlight, setSelectedFlight] = useState<FlightOption | null>(null);
  const [passenger, setPassenger] = useState<PassengerInfo>({
    firstName: "",
    lastName: "",
    dateOfBirth: "1990-01-01",
    gender: "MALE",
    passengerType: "ADULT",
  });
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingResult, setBookingResult] = useState<FlightBookResponse | null>(null);

  const handleSearch = useCallback(async () => {
    if (origin === destination) {
      toast.error("Origin and Destination cannot be the same airport");
      return;
    }
    setLoading(true);
    try {
      const res = await flightService.search({
        origin,
        destination,
        departureDate,
        adults,
        cabinClass,
      });
      setSearchResponse(res);
      toast.success(`Found ${res.flights.length} flights for ${origin} → ${destination}`);
    } catch {
      toast.error("Failed to load flights. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [origin, destination, departureDate, adults, cabinClass]);

  const handleConfirmBooking = async () => {
    if (!selectedFlight || !searchResponse) return;
    if (!passenger.firstName.trim() || !passenger.lastName.trim()) {
      toast.error("Please enter passenger full name");
      return;
    }
    setBookingLoading(true);
    try {
      const res = await flightService.book({
        searchId: searchResponse.searchId,
        optionId: selectedFlight.optionId,
        passengers: [passenger],
      });
      setBookingResult(res);
      toast.success(`Flight Confirmed! PNR: ${res.pnr}`);
    } catch {
      toast.error("Booking reservation failed");
    } finally {
      setBookingLoading(false);
    }
  };

  const swapAirports = () => {
    const temp = origin;
    setOrigin(destination);
    setDestination(temp);
  };

  return (
    <div className="space-y-6">
      {/* Search Header Banner */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
              <Plane className="w-5 h-5 text-sky-600" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Community Flight Concierge</h3>
              <p className="text-xs text-slate-500">
                Pre-negotiated group affiliate rates with EaseMyTrip &amp; MakeMyTrip. 3% cashback goes to society kitty.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
              <Tag className="w-3 h-3 text-emerald-600" /> Pre-Applied Society Coupon: MANAFLY
            </span>
          </div>
        </div>

        {/* Input Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
          {/* Origin */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">From (Airport)</label>
            <select
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 font-semibold text-xs text-slate-800 bg-white focus:outline-none focus:border-sky-500"
            >
              {POPULAR_AIRPORTS.map((a) => (
                <option key={a.code} value={a.code}>
                  {a.code} - {a.city}
                </option>
              ))}
            </select>
          </div>

          {/* Destination */}
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-slate-700">To (Destination)</label>
              <button
                onClick={swapAirports}
                className="text-[10px] text-sky-600 hover:underline cursor-pointer font-bold"
              >
                Swap ⇄
              </button>
            </div>
            <select
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 font-semibold text-xs text-slate-800 bg-white focus:outline-none focus:border-sky-500"
            >
              {POPULAR_AIRPORTS.map((a) => (
                <option key={a.code} value={a.code}>
                  {a.code} - {a.city}
                </option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Departure Date</label>
            <input
              type="date"
              value={departureDate}
              min={new Date().toISOString().split("T")[0]}
              onChange={(e) => setDepartureDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold text-xs text-slate-800 focus:outline-none focus:border-sky-500"
            />
          </div>

          {/* Passengers */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Travelers</label>
            <select
              value={adults}
              onChange={(e) => setAdults(Number(e.target.value))}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 font-semibold text-xs text-slate-800 bg-white focus:outline-none focus:border-sky-500"
            >
              {[1, 2, 3, 4, 5, 6].map((num) => (
                <option key={num} value={num}>
                  {num} Adult{num > 1 ? "s" : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Search Button */}
          <button
            onClick={handleSearch}
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            {loading ? (
              <span>Searching...</span>
            ) : (
              <>
                <Search className="w-4 h-4" />
                Find Flights
              </>
            )}
          </button>
        </div>

        {/* Popular Route Chips */}
        <div className="flex items-center gap-2 overflow-x-auto text-xs text-slate-500 pt-2 border-t border-slate-100">
          <span className="font-bold text-slate-400 shrink-0">Popular Society Routes:</span>
          {[
            { from: "BLR", to: "DEL", label: "BLR ➔ DEL" },
            { from: "BLR", to: "GOI", label: "BLR ➔ Goa (Weekend)" },
            { from: "BLR", to: "BOM", label: "BLR ➔ Mumbai" },
            { from: "BLR", to: "HYD", label: "BLR ➔ Hyderabad" },
          ].map((r) => (
            <button
              key={r.label}
              onClick={() => {
                setOrigin(r.from);
                setDestination(r.to);
              }}
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium whitespace-nowrap cursor-pointer transition-colors"
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Flight Results */}
      {searchResponse && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-900">
              Available Flights: {origin} to {destination} ({searchResponse.flights.length})
            </h4>
            <div className="flex items-center gap-2">
              <a
                href={flightService.getAffiliateUrl("EMT", origin, destination, departureDate)}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1"
              >
                Compare on EaseMyTrip <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          <div className="space-y-3">
            {searchResponse.flights.map((opt) => {
              const seg = opt.segments[0];
              const depTime = seg.originTime.slice(11, 16);
              const arrTime = seg.destinationTime.slice(11, 16);

              return (
                <div
                  key={opt.optionId}
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-sky-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  {/* Airline & Timing */}
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-lg font-black text-slate-800 shrink-0">
                      {seg.airlineCode}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-800">{seg.airlineName}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{seg.flightNumber}</span>
                        {seg.mealIncluded && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 font-bold">
                            Meal Free
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-sm font-bold text-slate-900">
                        <span>{depTime}</span>
                        <div className="flex flex-col items-center">
                          <span className="text-[9px] text-slate-400 font-normal">{opt.totalDurationMinutes}m</span>
                          <div className="w-16 h-0.5 bg-slate-200 relative">
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-400 absolute right-0 -top-0.5" />
                          </div>
                          <span className="text-[9px] text-emerald-600 font-semibold">Non-stop</span>
                        </div>
                        <span>{arrTime}</span>
                      </div>
                    </div>
                  </div>

                  {/* Baggage info */}
                  <div className="hidden md:flex items-center gap-4 text-xs text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <Luggage className="w-3.5 h-3.5 text-slate-400" />
                      <span>7kg Cabin · 15kg Check-in</span>
                    </div>
                    {opt.refundable ? (
                      <span className="text-emerald-600 font-bold text-[11px]">Refundable</span>
                    ) : (
                      <span className="text-slate-400 text-[11px]">Non-refundable</span>
                    )}
                  </div>

                  {/* Pricing and Action */}
                  <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-3 sm:pt-0">
                    <div className="text-right">
                      <p className="text-xl font-black text-slate-900">₹{opt.fare.totalFareAllPax}</p>
                      <p className="text-[10px] text-slate-400 font-medium">₹{opt.fare.totalFare} / traveler</p>
                    </div>

                    <button
                      onClick={() => setSelectedFlight(opt)}
                      className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer flex items-center gap-1"
                    >
                      Book Ticket
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Passenger & Booking Modal */}
      {selectedFlight && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-slate-100">
            {!bookingResult ? (
              <>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Plane className="w-5 h-5 text-sky-600" />
                    <h3 className="text-base font-bold text-slate-900">Confirm Flight Reservation</h3>
                  </div>
                  <button
                    onClick={() => setSelectedFlight(null)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-4 rounded-2xl bg-sky-50/60 border border-sky-100 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Route:</span>
                    <span className="font-bold text-slate-800">
                      {selectedFlight.segments[0].originCode} ➔ {selectedFlight.segments[0].destinationCode}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Airline:</span>
                    <span className="font-bold text-slate-800">
                      {selectedFlight.segments[0].airlineName} ({selectedFlight.segments[0].flightNumber})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Travel Date:</span>
                    <span className="font-bold text-slate-800">{departureDate}</span>
                  </div>
                  <div className="pt-2 border-t border-sky-100 flex justify-between items-baseline">
                    <span className="font-bold text-slate-900">Total Payable:</span>
                    <span className="text-lg font-black text-sky-600">₹{selectedFlight.fare.totalFareAllPax}</span>
                  </div>
                </div>

                {/* Passenger Form */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-700">Primary Passenger Details</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="First Name (as on Gov ID)"
                      value={passenger.firstName}
                      onChange={(e) => setPassenger({ ...passenger, firstName: e.target.value })}
                      className="px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-sky-500"
                    />
                    <input
                      type="text"
                      placeholder="Last Name"
                      value={passenger.lastName}
                      onChange={(e) => setPassenger({ ...passenger, lastName: e.target.value })}
                      className="px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={passenger.gender}
                      onChange={(e) => setPassenger({ ...passenger, gender: e.target.value as any })}
                      className="px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:outline-none focus:border-sky-500"
                    >
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                      <option value="OTHER">Other</option>
                    </select>

                    <input
                      type="date"
                      value={passenger.dateOfBirth}
                      onChange={(e) => setPassenger({ ...passenger, dateOfBirth: e.target.value })}
                      className="px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleConfirmBooking}
                    disabled={bookingLoading}
                    className="w-full py-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    {bookingLoading ? (
                      <span>Generating Ticket...</span>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        Confirm Booking &amp; Pay ₹{selectedFlight.fare.totalFareAllPax}
                      </>
                    )}
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-6 space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-slate-900">Flight Ticket Booked!</h3>
                  <p className="text-xs text-slate-500">
                    PNR: <span className="font-mono font-bold text-slate-800">{bookingResult.pnr}</span>
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-600 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Total Paid:</span>
                    <span className="font-bold text-slate-700">₹{bookingResult.totalAmount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Society Cashback Kitty:</span>
                    <span className="font-bold text-emerald-600">+₹{bookingResult.affiliateCommissionEarned} added</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setSelectedFlight(null);
                    setBookingResult(null);
                  }}
                  className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all cursor-pointer"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
