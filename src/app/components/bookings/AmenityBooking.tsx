import {
  Building2, Plus, X, Loader2, Clock, Users, CalendarDays, ChevronLeft,
  ChevronRight, Ban
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  bookingService,
  type AmenityResponse,
  type BookingResponse,
  type BookingRequest,
} from "../../../services/bookingService";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const amenityTypeLabels: Record<string, string> = {
  CLUBHOUSE: "Clubhouse",
  GYM: "Gym",
  POOL: "Swimming Pool",
  PARTY_HALL: "Party Hall",
  TENNIS_COURT: "Tennis Court",
  BADMINTON_COURT: "Badminton Court",
  GUEST_ROOM: "Guest Room",
  MEETING_ROOM: "Meeting Room",
};

const amenityColors: Record<string, string> = {
  CLUBHOUSE: "from-violet-50 to-purple-50 border-violet-200 text-violet-600",
  GYM: "from-red-50 to-orange-50 border-red-200 text-red-600",
  POOL: "from-cyan-50 to-sky-50 border-cyan-200 text-cyan-600",
  PARTY_HALL: "from-pink-50 to-rose-50 border-pink-200 text-pink-600",
  TENNIS_COURT: "from-green-50 to-emerald-50 border-green-200 text-green-600",
  BADMINTON_COURT: "from-lime-50 to-green-50 border-lime-200 text-lime-600",
  GUEST_ROOM: "from-amber-50 to-yellow-50 border-amber-200 text-amber-600",
  MEETING_ROOM: "from-indigo-50 to-blue-50 border-indigo-200 text-indigo-600",
};

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "short" });
}

function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

export function AmenityBooking() {
  const [amenities, setAmenities] = useState<AmenityResponse[]>([]);
  const [selectedAmenity, setSelectedAmenity] = useState<AmenityResponse | null>(null);
  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [bookings, setBookings] = useState<BookingResponse[]>([]);
  const [myBookings, setMyBookings] = useState<BookingResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [showBookForm, setShowBookForm] = useState(false);
  const [tab, setTab] = useState<"browse" | "mine">("browse");

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const data = await bookingService.getAmenities();
        setAmenities(data);
        if (data.length > 0) setSelectedAmenity(data[0]);
      } catch { /* ignore */ }
      finally { setLoading(false); }
    })();
  }, []);

  const fetchSlots = useCallback(async () => {
    if (!selectedAmenity) return;
    setSlotsLoading(true);
    try {
      const data = await bookingService.getSlots(selectedAmenity.id, selectedDate);
      setBookings(data);
    } catch { setBookings([]); }
    finally { setSlotsLoading(false); }
  }, [selectedAmenity, selectedDate]);

  useEffect(() => { fetchSlots(); }, [fetchSlots]);

  const fetchMyBookings = useCallback(async () => {
    try {
      const data = await bookingService.getMyBookings();
      setMyBookings(data);
    } catch { setMyBookings([]); }
  }, []);

  useEffect(() => { if (tab === "mine") fetchMyBookings(); }, [tab, fetchMyBookings]);

  const handleBooked = () => {
    setShowBookForm(false);
    fetchSlots();
    fetchMyBookings();
  };

  const handleCancel = async (id: number) => {
    try {
      await bookingService.cancelBooking(id);
      fetchMyBookings();
      fetchSlots();
    } catch { /* ignore */ }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen text-[#0d0d2b] p-6 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <span className="text-xs text-indigo-600 font-bold uppercase tracking-wider">Community</span>
          <h1 className="text-3xl font-black text-[#0d0d2b] mt-1">Amenity Booking</h1>
          <p className="text-[#6b7094] text-sm mt-1">Reserve clubhouse, gym, pool, and more.</p>
        </div>
        <button
          onClick={() => setShowBookForm(true)}
          disabled={!selectedAmenity}
          className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:opacity-95 shadow-md shadow-indigo-500/20 text-white text-sm font-bold rounded-full transition-all cursor-pointer self-start md:self-auto disabled:opacity-50"
        >
          <Plus className="w-4.5 h-4.5" />
          Book Slot
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white border border-slate-200 rounded-xl p-1 shadow-sm mb-6 w-fit">
        {([["browse", "Browse & Book"], ["mine", "My Bookings"]] as ["browse" | "mine", string][]).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              "px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer",
              tab === key ? "bg-[#0d0d2b] text-white shadow-sm" : "text-[#6b7094] hover:bg-slate-50"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "browse" ? (
        <>
          {/* Amenity Cards */}
          {amenities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Building2 className="w-12 h-12 text-slate-300 mb-3" />
              <p className="text-[#6b7094] text-sm font-medium">No amenities available</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
                {amenities.map((a) => {
                  const colors = amenityColors[a.type] ?? amenityColors.CLUBHOUSE;
                  return (
                    <button
                      key={a.id}
                      onClick={() => setSelectedAmenity(a)}
                      className={cn(
                        "p-4 rounded-2xl border bg-gradient-to-br text-left transition-all cursor-pointer",
                        colors,
                        selectedAmenity?.id === a.id ? "ring-2 ring-indigo-400 shadow-md" : "hover:shadow-sm"
                      )}
                    >
                      <p className="font-bold text-sm">{a.name}</p>
                      <p className="text-[10px] opacity-70 mt-0.5">{amenityTypeLabels[a.type] ?? a.type}</p>
                      <div className="flex items-center gap-2 mt-2 text-[10px] opacity-60">
                        {a.maxCapacity && (
                          <span className="flex items-center gap-0.5"><Users className="w-3 h-3" /> {a.maxCapacity}</span>
                        )}
                        {a.openTime && a.closeTime && (
                          <span className="flex items-center gap-0.5"><Clock className="w-3 h-3" /> {a.openTime}–{a.closeTime}</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Date picker + slots */}
              {selectedAmenity && (
                <div className="bg-white rounded-2xl border border-[#6366f1]/12 shadow-[0_4px_20px_rgba(99,102,241,0.03)] p-5">
                  {/* Date nav */}
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-sm text-[#0d0d2b]">
                      {selectedAmenity.name} — {formatDate(selectedDate)}
                    </h3>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setSelectedDate(addDays(selectedDate, -1))}
                        disabled={selectedDate <= todayStr()}
                        className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer disabled:opacity-30"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setSelectedDate(todayStr())}
                        className="px-3 py-1 text-[10px] font-bold text-indigo-600 bg-indigo-50 rounded-lg cursor-pointer"
                      >
                        Today
                      </button>
                      <button
                        onClick={() => setSelectedDate(addDays(selectedDate, 1))}
                        className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                      <input
                        type="date"
                        value={selectedDate}
                        min={todayStr()}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="ml-2 px-2 py-1 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  {/* Slot list */}
                  {slotsLoading ? (
                    <div className="flex items-center justify-center py-10">
                      <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
                    </div>
                  ) : bookings.length === 0 ? (
                    <div className="text-center py-10">
                      <CalendarDays className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-xs text-[#6b7094]">No bookings for this date — all slots are open!</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {bookings.map((b) => (
                        <div key={b.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                          <div className="px-2.5 py-1 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-lg whitespace-nowrap">
                            {b.startTime.slice(0, 5)} – {b.endTime.slice(0, 5)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-[#0d0d2b] truncate">{b.bookedByName}</p>
                            {b.purpose && <p className="text-[10px] text-[#6b7094] truncate">{b.purpose}</p>}
                          </div>
                          <span className={cn(
                            "text-[10px] font-bold px-2 py-0.5 rounded-full",
                            b.status === "CONFIRMED" ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-400"
                          )}>
                            {b.status === "CONFIRMED" ? "Booked" : "Cancelled"}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </>
      ) : (
        /* My Bookings tab */
        <div className="space-y-3 max-w-3xl">
          {myBookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <CalendarDays className="w-12 h-12 text-slate-300 mb-3" />
              <p className="text-[#6b7094] text-sm font-medium">No bookings yet</p>
            </div>
          ) : (
            myBookings.map((b) => (
              <div key={b.id} className="bg-white rounded-2xl border border-[#6366f1]/12 p-4 shadow-sm flex items-center gap-4">
                <div className={cn(
                  "w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center shrink-0",
                  amenityColors[b.amenityType] ?? amenityColors.CLUBHOUSE
                )}>
                  <Building2 className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-[#0d0d2b]">{b.amenityName}</p>
                  <p className="text-[11px] text-[#6b7094]">
                    {formatDate(b.bookingDate)} · {b.startTime.slice(0, 5)} – {b.endTime.slice(0, 5)}
                  </p>
                  {b.purpose && <p className="text-[10px] text-slate-400 mt-0.5 truncate">{b.purpose}</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={cn(
                    "text-[10px] font-bold px-2 py-0.5 rounded-full",
                    b.status === "CONFIRMED" ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-400 line-through"
                  )}>
                    {b.status === "CONFIRMED" ? "Confirmed" : "Cancelled"}
                  </span>
                  {b.status === "CONFIRMED" && (
                    <button
                      onClick={() => handleCancel(b.id)}
                      className="p-1.5 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                      title="Cancel booking"
                    >
                      <Ban className="w-3.5 h-3.5 text-red-400" />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {showBookForm && selectedAmenity && (
        <BookSlotModal
          amenity={selectedAmenity}
          initialDate={selectedDate}
          onClose={() => setShowBookForm(false)}
          onBooked={handleBooked}
        />
      )}
    </div>
  );
}

function BookSlotModal({
  amenity, initialDate, onClose, onBooked,
}: {
  amenity: AmenityResponse;
  initialDate: string;
  onClose: () => void;
  onBooked: () => void;
}) {
  const [form, setForm] = useState<BookingRequest>({
    amenityId: amenity.id,
    bookingDate: initialDate,
    startTime: amenity.openTime ?? "09:00",
    endTime: "",
    purpose: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (form.startTime && amenity.slotDurationMinutes) {
      const [h, m] = form.startTime.split(":").map(Number);
      const totalMin = h * 60 + m + amenity.slotDurationMinutes;
      const endH = Math.floor(totalMin / 60).toString().padStart(2, "0");
      const endM = (totalMin % 60).toString().padStart(2, "0");
      setForm((prev) => ({ ...prev, endTime: `${endH}:${endM}` }));
    }
  }, [form.startTime, amenity.slotDurationMinutes]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.bookingDate || !form.startTime || !form.endTime) {
      setError("Date and time are required");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await bookingService.createBooking(form);
      onBooked();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to book";
      setError(msg.includes("conflicts") ? "This time slot is already booked" : msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-black text-[#0d0d2b]">Book {amenity.name}</h2>
            <p className="text-[10px] text-[#6b7094]">{amenityTypeLabels[amenity.type]} · {amenity.slotDurationMinutes} min slots</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer">
            <X className="w-5 h-5 text-[#6b7094]" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && <p className="text-red-500 text-xs font-medium bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

          <div>
            <label className="block text-xs font-bold text-[#0d0d2b] mb-1.5">Date *</label>
            <input
              type="date"
              value={form.bookingDate}
              min={todayStr()}
              onChange={(e) => setForm((prev) => ({ ...prev, bookingDate: e.target.value }))}
              className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#0d0d2b] mb-1.5">Start Time *</label>
              <input
                type="time"
                value={form.startTime}
                onChange={(e) => setForm((prev) => ({ ...prev, startTime: e.target.value }))}
                className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#0d0d2b] mb-1.5">End Time *</label>
              <input
                type="time"
                value={form.endTime}
                onChange={(e) => setForm((prev) => ({ ...prev, endTime: e.target.value }))}
                className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#0d0d2b] mb-1.5">Purpose</label>
            <input
              value={form.purpose}
              onChange={(e) => setForm((prev) => ({ ...prev, purpose: e.target.value }))}
              maxLength={300}
              className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
              placeholder="Birthday party, workout session..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-bold text-[#6b7094] hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-bold rounded-xl hover:opacity-95 transition-all disabled:opacity-50 cursor-pointer flex items-center gap-2"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {saving ? "Booking..." : "Confirm Booking"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
