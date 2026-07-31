import { useState, useEffect } from "react";
import {
  Clock, Plus, Trash2, Loader2, AlertCircle, Palmtree,
  CalendarOff, Save,
} from "lucide-react";
import { toast, Toaster } from "sonner";
import { vendorAvailabilityService } from "../../../../services/vendorService";
import type { VendorAvailability, VendorOperatingHours, DaySchedule, VendorHoliday } from "../../../../types/api";

const DAYS: { key: keyof VendorOperatingHours; label: string }[] = [
  { key: "monday", label: "Monday" },
  { key: "tuesday", label: "Tuesday" },
  { key: "wednesday", label: "Wednesday" },
  { key: "thursday", label: "Thursday" },
  { key: "friday", label: "Friday" },
  { key: "saturday", label: "Saturday" },
  { key: "sunday", label: "Sunday" },
];

const DEFAULT_SCHEDULE: DaySchedule = {
  isOpen: true,
  openTime: "09:00",
  closeTime: "18:00",
  breakStart: "13:00",
  breakEnd: "14:00",
};

export function MyAvailability() {
  const [availability, setAvailability] = useState<VendorAvailability | null>(null);
  const [hours, setHours] = useState<VendorOperatingHours>({});
  const [holidays, setHolidays] = useState<VendorHoliday[]>([]);
  const [vacationMode, setVacationMode] = useState(false);
  const [vacationStart, setVacationStart] = useState("");
  const [vacationEnd, setVacationEnd] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Holiday form
  const [showHolidayForm, setShowHolidayForm] = useState(false);
  const [holidayForm, setHolidayForm] = useState({ date: "", reason: "", type: "HOLIDAY" as "HOLIDAY" | "LEAVE" | "VACATION" });

  useEffect(() => {
    loadAvailability();
  }, []);

  const loadAvailability = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await vendorAvailabilityService.getMyAvailability();
      setAvailability(data);
      setHours(data.operatingHours || {});
      setHolidays(data.holidays || []);
      setVacationMode(data.vacationMode);
      setVacationStart(data.vacationStart || "");
      setVacationEnd(data.vacationEnd || "");
    } catch (err) {
      console.error(err);
      setError("Failed to load availability");
      toast.error("Failed to load availability");
    } finally {
      setLoading(false);
    }
  };

  const updateDay = (day: keyof VendorOperatingHours, changes: Partial<DaySchedule>) => {
    setHours((prev) => ({
      ...prev,
      [day]: { ...(prev[day] || DEFAULT_SCHEDULE), ...changes },
    }));
  };

  const handleSaveHours = async () => {
    setSaving(true);
    try {
      await vendorAvailabilityService.updateOperatingHours(hours);
      toast.success("Operating hours updated");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update operating hours");
    } finally {
      setSaving(false);
    }
  };

  const handleAddHoliday = async () => {
    if (!holidayForm.date || !holidayForm.reason) {
      toast.error("Please fill in date and reason");
      return;
    }
    try {
      const holiday = await vendorAvailabilityService.addHoliday({
        date: holidayForm.date,
        reason: holidayForm.reason,
        type: holidayForm.type,
      });
      setHolidays((prev) => [...prev, holiday]);
      setHolidayForm({ date: "", reason: "", type: "HOLIDAY" });
      setShowHolidayForm(false);
      toast.success("Holiday added");
    } catch (err) {
      console.error(err);
      toast.error("Failed to add holiday");
    }
  };

  const handleRemoveHoliday = async (id: number) => {
    try {
      await vendorAvailabilityService.removeHoliday(id);
      setHolidays((prev) => prev.filter((h) => h.id !== id));
      toast.success("Holiday removed");
    } catch (err) {
      console.error(err);
      toast.error("Failed to remove holiday");
    }
  };

  const handleVacationToggle = async () => {
    try {
      const newMode = !vacationMode;
      await vendorAvailabilityService.setVacationMode(
        newMode,
        newMode ? vacationStart : undefined,
        newMode ? vacationEnd : undefined,
      );
      setVacationMode(newMode);
      toast.success(newMode ? "Vacation mode enabled" : "Vacation mode disabled");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update vacation mode");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <AlertCircle className="w-12 h-12 text-red-400" />
        <p className="text-[#6b7094] font-medium">{error}</p>
        <button onClick={loadAvailability} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 transition-colors">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Toaster position="top-right" richColors />

      {/* Header */}
      <div>
        <span className="text-xs text-indigo-600 font-bold uppercase tracking-wider">Vendor Portal</span>
        <h1 className="text-3xl font-black text-[#0d0d2b] flex items-center gap-2 mt-1">
          <Clock className="h-8 w-8 text-indigo-600" />
          Availability
        </h1>
        <p className="text-[#6b7094] text-sm mt-1">Set your working hours and manage holidays</p>
      </div>

      {/* Vacation Mode */}
      <div className={`border rounded-2xl p-5 ${vacationMode ? "bg-amber-50 border-amber-200" : "bg-white border-slate-200"}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Palmtree className={`w-5 h-5 ${vacationMode ? "text-amber-600" : "text-slate-400"}`} />
            <div>
              <h3 className="text-sm font-black text-[#0d0d2b]">Vacation Mode</h3>
              <p className="text-xs text-[#6b7094]">
                {vacationMode ? "You are on vacation. Bookings are paused." : "Enable to pause all bookings temporarily"}
              </p>
            </div>
          </div>
          <button
            onClick={handleVacationToggle}
            className={`px-4 py-2 text-xs font-bold rounded-full transition-all ${
              vacationMode
                ? "bg-amber-600 text-white hover:bg-amber-700"
                : "bg-slate-100 text-[#6b7094] hover:bg-slate-200"
            }`}
          >
            {vacationMode ? "Disable" : "Enable"}
          </button>
        </div>
        {vacationMode && (
          <div className="flex gap-3 mt-4">
            <div>
              <label className="text-xs font-bold text-[#6b7094] block mb-1">Start Date</label>
              <input
                type="date"
                value={vacationStart}
                onChange={(e) => setVacationStart(e.target.value)}
                className="px-3 py-2 text-sm border border-amber-200 rounded-xl focus:outline-none focus:border-amber-500 bg-white"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-[#6b7094] block mb-1">End Date</label>
              <input
                type="date"
                value={vacationEnd}
                onChange={(e) => setVacationEnd(e.target.value)}
                className="px-3 py-2 text-sm border border-amber-200 rounded-xl focus:outline-none focus:border-amber-500 bg-white"
              />
            </div>
          </div>
        )}
      </div>

      {/* Weekly Schedule */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-sm font-black text-[#0d0d2b]">Weekly Working Hours</h3>
          <button
            onClick={handleSaveHours}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-violet-600 rounded-full hover:opacity-95 disabled:opacity-50 transition-all"
          >
            {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
            Save Changes
          </button>
        </div>

        <div className="space-y-3">
          {DAYS.map(({ key, label }) => {
            const schedule = hours[key] || { isOpen: false };
            return (
              <div key={key} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-3 sm:w-32">
                  <button
                    onClick={() => updateDay(key, { isOpen: !schedule.isOpen })}
                    className={`w-9 h-5 rounded-full flex items-center px-0.5 transition-all ${
                      schedule.isOpen ? "bg-emerald-500 justify-end" : "bg-slate-300 justify-start"
                    }`}
                  >
                    <div className="w-4 h-4 bg-white rounded-full shadow-sm" />
                  </button>
                  <span className={`text-xs font-bold ${schedule.isOpen ? "text-[#0d0d2b]" : "text-slate-400"}`}>
                    {label}
                  </span>
                </div>

                {schedule.isOpen ? (
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <div className="flex items-center gap-1">
                      <label className="text-[#6b7094] font-semibold">Open</label>
                      <input
                        type="time"
                        value={schedule.openTime || "09:00"}
                        onChange={(e) => updateDay(key, { openTime: e.target.value })}
                        className="px-2 py-1 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <span className="text-slate-300">-</span>
                    <div className="flex items-center gap-1">
                      <label className="text-[#6b7094] font-semibold">Close</label>
                      <input
                        type="time"
                        value={schedule.closeTime || "18:00"}
                        onChange={(e) => updateDay(key, { closeTime: e.target.value })}
                        className="px-2 py-1 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <span className="text-slate-200 mx-1">|</span>
                    <div className="flex items-center gap-1">
                      <label className="text-[#6b7094] font-semibold">Break</label>
                      <input
                        type="time"
                        value={schedule.breakStart || ""}
                        onChange={(e) => updateDay(key, { breakStart: e.target.value })}
                        className="px-2 py-1 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-indigo-500"
                      />
                      <span className="text-slate-300">-</span>
                      <input
                        type="time"
                        value={schedule.breakEnd || ""}
                        onChange={(e) => updateDay(key, { breakEnd: e.target.value })}
                        className="px-2 py-1 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                ) : (
                  <span className="text-xs text-slate-400 font-semibold">Closed</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Holidays */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-black text-[#0d0d2b]">Holidays & Days Off</h3>
          <button
            onClick={() => setShowHolidayForm(true)}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 rounded-full hover:bg-indigo-100 transition-colors"
          >
            <Plus className="w-3 h-3" />
            Add Holiday
          </button>
        </div>

        {showHolidayForm && (
          <div className="p-4 bg-slate-50 rounded-xl mb-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-bold text-[#6b7094] block mb-1">Date *</label>
                <input
                  type="date"
                  value={holidayForm.date}
                  onChange={(e) => setHolidayForm({ ...holidayForm, date: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-[#6b7094] block mb-1">Reason *</label>
                <input
                  type="text"
                  value={holidayForm.reason}
                  onChange={(e) => setHolidayForm({ ...holidayForm, reason: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                  placeholder="e.g. Public Holiday"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-[#6b7094] block mb-1">Type</label>
                <select
                  value={holidayForm.type}
                  onChange={(e) => setHolidayForm({ ...holidayForm, type: e.target.value as "HOLIDAY" | "LEAVE" | "VACATION" })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 bg-white"
                >
                  <option value="HOLIDAY">Holiday</option>
                  <option value="LEAVE">Leave</option>
                  <option value="VACATION">Vacation</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowHolidayForm(false)}
                className="px-3 py-1.5 text-xs font-bold text-[#6b7094] hover:bg-slate-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddHoliday}
                className="px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Add
              </button>
            </div>
          </div>
        )}

        {holidays.length === 0 ? (
          <p className="text-sm text-[#6b7094] text-center py-8">No holidays configured</p>
        ) : (
          <div className="space-y-2">
            {holidays.map((holiday) => (
              <div key={holiday.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <CalendarOff className="w-4 h-4 text-red-400" />
                  <div>
                    <p className="text-sm font-bold text-[#0d0d2b]">{holiday.reason}</p>
                    <p className="text-xs text-[#6b7094]">
                      {new Date(holiday.date).toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                      {" "}&middot;{" "}
                      <span className="font-semibold">{holiday.type}</span>
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveHoliday(holiday.id)}
                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
