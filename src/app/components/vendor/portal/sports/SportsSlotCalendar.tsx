import { useState, useEffect } from "react";
import {
  Calendar as CalendarIcon,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Unlock,
  ChevronLeft,
  ChevronRight,
  Filter,
  DollarSign,
  User,
  ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";
import { sportsVendorService } from "../../../../../services/sports/sportsVendorService";
import type {
  SportsFacility,
  SportsCourtConfig,
  SportsCourtSlot,
} from "../../../../../types/sportsVendor";

export function SportsSlotCalendar() {
  const [facilities, setFacilities] = useState<SportsFacility[]>([]);
  const [selectedFacilityId, setSelectedFacilityId] = useState<string>("");
  const [courts, setCourts] = useState<SportsCourtConfig[]>([]);
  const [selectedCourtId, setSelectedCourtId] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [slots, setSlots] = useState<SportsCourtSlot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initFacilities();
  }, []);

  useEffect(() => {
    if (selectedFacilityId) {
      loadCourts(selectedFacilityId);
    }
  }, [selectedFacilityId]);

  useEffect(() => {
    if (selectedCourtId && selectedDate) {
      loadSlots(selectedCourtId, selectedDate);
    }
  }, [selectedCourtId, selectedDate]);

  async function initFacilities() {
    setLoading(true);
    try {
      const facs = await sportsVendorService.getFacilities();
      setFacilities(facs);
      if (facs.length > 0) {
        setSelectedFacilityId(facs[0].id);
      }
    } catch (err) {
      toast.error("Failed to load facilities");
    } finally {
      setLoading(false);
    }
  }

  async function loadCourts(facilityId: string) {
    try {
      const crts = await sportsVendorService.getCourts(facilityId);
      setCourts(crts);
      if (crts.length > 0) {
        setSelectedCourtId(crts[0].id);
      } else {
        setSelectedCourtId("");
        setSlots([]);
      }
    } catch (err) {
      toast.error("Failed to load courts");
    }
  }

  async function loadSlots(courtId: string, date: string) {
    try {
      const s = await sportsVendorService.getCourtSlots(courtId, date);
      setSlots(s);
    } catch (err) {
      toast.error("Failed to load slots");
    }
  }

  function handleDateShift(days: number) {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + days);
    setSelectedDate(current.toISOString().split("T")[0]);
  }

  function toggleSlotBlock(slot: SportsCourtSlot) {
    if (slot.status === "BOOKED") {
      toast.error("Cannot block an already confirmed booking");
      return;
    }

    const nextStatus = slot.status === "OPEN" ? "CLOSED" : "OPEN";
    setSlots((prev) =>
      prev.map((s) => (s.id === slot.id ? { ...s, status: nextStatus } : s))
    );
    toast.success(
      nextStatus === "CLOSED"
        ? `Slot ${slot.startTime} blocked from public booking`
        : `Slot ${slot.startTime} opened for booking`
    );
  }

  const selectedCourt = courts.find((c) => c.id === selectedCourtId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Court Slot Calendar</h1>
          <p className="text-xs text-slate-500">
            Real-time court availability, slot holds, pricing variations, and manual blackout blocks.
          </p>
        </div>

        {/* Date Selector */}
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl p-1 shadow-xs">
          <button
            onClick={() => handleDateShift(-1)}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-1.5 px-2 text-xs font-bold text-slate-800">
            <CalendarIcon className="w-3.5 h-3.5 text-indigo-600" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border-none bg-transparent font-bold text-xs focus:outline-hidden cursor-pointer"
            />
          </div>
          <button
            onClick={() => handleDateShift(1)}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Facility & Court Selectors */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 text-xs">
          <span className="font-bold text-slate-500">Facility:</span>
          <select
            value={selectedFacilityId}
            onChange={(e) => setSelectedFacilityId(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:outline-hidden focus:border-indigo-500"
          >
            {facilities.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="font-bold text-slate-500">Court:</span>
          <select
            value={selectedCourtId}
            onChange={(e) => setSelectedCourtId(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:outline-hidden focus:border-indigo-500"
          >
            {courts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.sportType})
              </option>
            ))}
          </select>
        </div>

        {selectedCourt && (
          <div className="ml-auto flex items-center gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Open
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" /> Booked
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-400" /> Closed/Blocked
            </span>
          </div>
        )}
      </div>

      {/* Slots Matrix */}
      {selectedCourt ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900">{selectedCourt.name}</h2>
              <p className="text-xs text-slate-500">
                {selectedCourt.surfaceType.replace("_", " ")} • {selectedCourt.isIndoor ? "Indoor" : "Outdoor"} • Base ₹{selectedCourt.baseHourlyPrice}/hr
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-slate-700">
                {new Date(selectedDate).toLocaleDateString("en-IN", {
                  weekday: "long",
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {slots.map((slot) => {
              const isBooked = slot.status === "BOOKED";
              const isClosed = slot.status === "CLOSED" || slot.status === "MAINTENANCE";
              const isOpen = slot.status === "OPEN";

              return (
                <div
                  key={slot.id}
                  className={`relative p-3.5 rounded-xl border transition-all text-xs flex flex-col justify-between min-h-[105px] ${
                    isBooked
                      ? "bg-indigo-50/70 border-indigo-200 text-indigo-900"
                      : isClosed
                      ? "bg-slate-100 border-slate-200 text-slate-400"
                      : "bg-white border-slate-200 hover:border-emerald-400 hover:shadow-xs text-slate-800"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {slot.startTime}
                    </span>
                    <button
                      onClick={() => toggleSlotBlock(slot)}
                      disabled={isBooked}
                      className={`p-1 rounded-md transition-colors ${
                        isBooked
                          ? "cursor-not-allowed opacity-40"
                          : "hover:bg-slate-200/80 text-slate-500"
                      }`}
                      title={isClosed ? "Open Slot" : "Block Slot"}
                    >
                      {isClosed ? (
                        <Lock className="w-3 h-3 text-red-500" />
                      ) : (
                        <Unlock className="w-3 h-3 text-slate-400" />
                      )}
                    </button>
                  </div>

                  <div className="my-1.5">
                    {isBooked ? (
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 block">
                          Booked
                        </span>
                        <span className="font-semibold text-slate-800 truncate block text-[11px]">
                          {slot.customerName || "Resident Player"}
                        </span>
                      </div>
                    ) : isClosed ? (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Unavailable
                      </span>
                    ) : (
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 block">
                          Available
                        </span>
                        <span className="font-bold text-slate-900 text-xs">
                          ₹{slot.price}
                        </span>
                        <span className="text-[10px] text-emerald-700 block">
                          Res: ₹{slot.residentPrice}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="text-[9px] text-slate-400 pt-1 border-t border-slate-100/80">
                    To {slot.endTime}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400">
          No courts configured for this facility. Add courts in Venues & Courts tab.
        </div>
      )}
    </div>
  );
}
