import { useState, useEffect, useCallback } from "react";
import {
  Bus, MapPin, Clock, Phone, AlertCircle, CheckCircle2,
  UserCheck, Shield, ChevronRight, RefreshCw, Plus, Sparkles, Navigation
} from "lucide-react";
import {
  schoolBusService,
  type SchoolBus,
  type RegisteredChild,
  type BusTripLog,
  type RegisterChildRequest
} from "../../../services/mobility/schoolBusService";

const STATUS_META: Record<string, { label: string; badge: string; color: string }> = {
  AT_SCHOOL: { label: "At School", badge: "bg-emerald-50 text-emerald-700 border-emerald-200", color: "#059669" },
  EN_ROUTE_HOME: { label: "En Route Home", badge: "bg-blue-50 text-blue-700 border-blue-200", color: "#2563eb" },
  EN_ROUTE_SCHOOL: { label: "En Route to School", badge: "bg-amber-50 text-amber-700 border-amber-200", color: "#d97706" },
  ARRIVED: { label: "Arrived at Gate", badge: "bg-emerald-50 text-emerald-700 border-emerald-200", color: "#059669" },
  IDLE: { label: "Idle / Not Started", badge: "bg-gray-50 text-gray-700 border-gray-200", color: "#6b7280" }
};

export function SchoolBusLiveTracker() {
  const [children, setChildren] = useState<RegisteredChild[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<number | null>(null);
  const [buses, setBuses] = useState<SchoolBus[]>([]);
  const [trips, setTrips] = useState<BusTripLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  // Form State
  const [form, setForm] = useState<RegisterChildRequest>({
    name: "",
    grade: "",
    schoolName: "",
    stopName: "Mana Community Main Gate"
  });
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formSuccess, setFormSuccess] = useState(false);
  const [formError, setFormError] = useState("");

  const loadData = useCallback(async () => {
    try {
      const [fetchedChildren, fetchedBuses] = await Promise.all([
        schoolBusService.getMyChildren(),
        schoolBusService.getAvailableBuses()
      ]);
      setChildren(fetchedChildren);
      setBuses(fetchedBuses);

      const activeChild = fetchedChildren[0];
      if (activeChild) {
        setSelectedChildId(activeChild.id);
        const childTrips = await schoolBusService.getTripHistory(activeChild.id);
        setTrips(childTrips);
      }
    } catch (err) {
      console.error("Failed to load school bus data:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    // Auto-refresh GPS location every 30s
    const timer = setInterval(() => {
      schoolBusService.getAvailableBuses().then(setBuses).catch(() => {});
    }, 30000);
    return () => clearInterval(timer);
  }, [loadData]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleRegisterChild = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.grade || !form.schoolName) {
      setFormError("Please fill in child name, grade, and school name.");
      return;
    }
    setFormSubmitting(true);
    setFormError("");
    try {
      await schoolBusService.registerChild(form);
      setFormSuccess(true);
      setTimeout(() => {
        setShowRegisterModal(false);
        setFormSuccess(false);
        setForm({ name: "", grade: "", schoolName: "", stopName: "Mana Community Main Gate" });
        loadData();
      }, 1500);
    } catch (err: any) {
      setFormError(err.message || "Failed to register child. Try again.");
    } finally {
      setFormSubmitting(false);
    }
  };

  const activeChild = children.find(c => c.id === selectedChildId) || children[0];
  const activeBus = buses.find(b => b.busNumber === activeChild?.busNumber || b.id === activeChild?.busId) || buses[0];
  const busStatus = activeBus ? (STATUS_META[activeBus.status] || STATUS_META.IDLE) : STATUS_META.IDLE;

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
            <Bus size={28} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900">School Bus Live Tracker</h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live Telematics
              </span>
            </div>
            <p className="text-sm text-gray-500">Real-time GPS route tracking, child boarding status, and gate arrival alerts</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200 transition"
          >
            <RefreshCw size={16} className={refreshing ? "animate-spin text-blue-600" : ""} />
            <span>{refreshing ? "Syncing..." : "Refresh GPS"}</span>
          </button>
          <button
            onClick={() => setShowRegisterModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition"
          >
            <Plus size={16} />
            <span>Register Child</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400 space-y-3">
          <RefreshCw size={32} className="animate-spin text-blue-500" />
          <p className="text-sm font-medium">Connecting to vehicle IoT telematics...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Children list & Live GPS card */}
          <div className="lg:col-span-2 space-y-6">
            {/* Active Bus Telematics Card */}
            {activeBus ? (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-amber-500/5 via-transparent to-transparent">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-lg font-bold text-gray-900 bg-amber-50 px-3 py-1 rounded-lg border border-amber-200">
                        {activeBus.busNumber}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${busStatus.badge}`}>
                        {busStatus.label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1 font-medium">{activeBus.routeName}</p>
                    <p className="text-xs text-gray-400">{activeBus.schoolName}</p>
                  </div>

                  <div className="flex items-center gap-4 bg-white px-4 py-2.5 rounded-xl border border-gray-100 shadow-xs">
                    <div>
                      <p className="text-xs text-gray-400">Current Speed</p>
                      <p className="text-base font-bold text-gray-800">{activeBus.currentLocation?.speed || 24} km/h</p>
                    </div>
                    <div className="h-7 w-px bg-gray-200" />
                    <div>
                      <p className="text-xs text-gray-400">Students Onboard</p>
                      <p className="text-base font-bold text-emerald-600">{activeBus.studentsOnboard || 18} / {activeBus.capacity || 32}</p>
                    </div>
                  </div>
                </div>

                {/* Simulated GPS Visualizer */}
                <div className="relative bg-slate-900 h-64 flex flex-col items-center justify-center p-6 text-white overflow-hidden">
                  <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px]" />
                  
                  {/* Floating vehicle indicator */}
                  <div className="relative z-10 flex flex-col items-center animate-bounce">
                    <div className="w-14 h-14 rounded-2xl bg-amber-400 text-slate-900 flex items-center justify-center shadow-lg shadow-amber-400/40">
                      <Bus size={30} />
                    </div>
                    <span className="mt-2 text-xs font-mono font-semibold bg-slate-800/90 text-amber-300 px-3 py-1 rounded-full border border-amber-400/30">
                      {activeBus.busNumber} · {activeBus.currentLocation?.speed || 28} km/h
                    </span>
                  </div>

                  <div className="absolute bottom-4 left-4 right-4 z-10 flex items-center justify-between text-xs text-slate-400 bg-slate-800/80 backdrop-blur-md px-4 py-2 rounded-xl border border-slate-700">
                    <span className="flex items-center gap-1.5 text-emerald-400">
                      <Navigation size={14} /> GPS Lock: {activeBus.currentLocation?.lat.toFixed(4)}, {activeBus.currentLocation?.lng.toFixed(4)}
                    </span>
                    <span>Updated {new Date(activeBus.currentLocation?.updatedAt || Date.now()).toLocaleTimeString()}</span>
                  </div>
                </div>

                {/* Stops Timeline */}
                <div className="p-6">
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Clock size={16} className="text-blue-600" /> Route Stops & ETA Timeline
                  </h3>
                  <div className="space-y-4">
                    {activeBus.stops.map((stop: any, idx: number) => {
                      const isLast = idx === activeBus.stops.length - 1;
                      return (
                        <div key={stop.id} className="flex items-start gap-4">
                          <div className="flex flex-col items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                              stop.reached
                                ? "bg-emerald-100 text-emerald-700 border-2 border-emerald-500"
                                : idx === activeBus.stops.findIndex((s: any) => !s.reached)
                                ? "bg-blue-100 text-blue-700 border-2 border-blue-500 animate-pulse"
                                : "bg-gray-100 text-gray-400 border-2 border-gray-200"
                            }`}>
                              {stop.reached ? <CheckCircle2 size={16} /> : idx + 1}
                            </div>
                            {!isLast && (
                              <div className={`w-0.5 h-8 my-1 ${stop.reached ? "bg-emerald-400" : "bg-gray-200"}`} />
                            )}
                          </div>

                          <div className="flex-1 pb-2">
                            <div className="flex items-center justify-between">
                              <p className={`text-sm font-semibold ${stop.reached ? "text-gray-900" : "text-gray-700"}`}>
                                {stop.name}
                              </p>
                              <span className={`text-xs font-mono font-medium px-2 py-0.5 rounded ${
                                stop.reached ? "bg-emerald-50 text-emerald-700" : "bg-blue-50 text-blue-700"
                              }`}>
                                {stop.reached ? `Reached at ${stop.reachedAt || stop.eta}` : `Est. ${stop.eta}`}
                              </span>
                            </div>
                            {stop.name.includes("Mana Community") && (
                              <span className="inline-block mt-1 text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                                ⭐ Your Resident Community Drop-Off
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white p-8 rounded-2xl border border-gray-100 text-center text-gray-500">
                <Bus size={40} className="mx-auto text-gray-300 mb-2" />
                <p>No active bus assignment found for this child.</p>
              </div>
            )}

            {/* Past Trip Logs */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Clock size={18} className="text-gray-600" /> Recent Trip Logs
              </h3>
              {trips.length === 0 ? (
                <p className="text-sm text-gray-400 py-4 text-center">No trip logs recorded yet.</p>
              ) : (
                <div className="divide-y divide-gray-100">
                  {trips.map(trip => (
                    <div key={trip.id} className="py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
                          {trip.direction === "TO_SCHOOL" ? "TO" : "HOME"}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            {trip.direction === "TO_SCHOOL" ? "Morning Drop to School" : "Afternoon Return to Home"}
                          </p>
                          <p className="text-xs text-gray-500">Date: {trip.date}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                          <CheckCircle2 size={12} /> Boarded: {trip.pickedUpAt || trip.departureTime}
                        </span>
                        <p className="text-xs text-gray-400 mt-0.5">Arrived: {trip.droppedOffAt || trip.arrivalTime}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Registered Children & Crew Contact */}
          <div className="space-y-6">
            {/* Registered Children Selector */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center justify-between">
                <span>Your Children ({children.length})</span>
                <button
                  onClick={() => setShowRegisterModal(true)}
                  className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
                >
                  <Plus size={14} /> Add
                </button>
              </h3>

              <div className="space-y-3">
                {children.map(child => {
                  const isSelected = child.id === selectedChildId;
                  return (
                    <div
                      key={child.id}
                      onClick={() => setSelectedChildId(child.id)}
                      className={`p-4 rounded-xl border transition cursor-pointer ${
                        isSelected
                          ? "border-blue-500 bg-blue-50/50 shadow-xs"
                          : "border-gray-100 bg-white hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center text-sm">
                            {child.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900">{child.name}</p>
                            <p className="text-xs text-gray-500">{child.grade} · {child.schoolName}</p>
                          </div>
                        </div>
                        {isSelected && <CheckCircle2 size={18} className="text-blue-600" />}
                      </div>

                      <div className="mt-3 pt-3 border-t border-gray-100/80 flex items-center justify-between text-xs text-gray-500">
                        <span>Bus: <strong className="text-gray-800">{child.busNumber || "Route 14"}</strong></span>
                        <span>Stop: <strong className="text-gray-800">{child.stopName || "Main Gate"}</strong></span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Crew Contact & Security */}
            {activeBus && (
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <Shield size={18} className="text-emerald-600" /> Crew & Emergency Contacts
                </h3>

                {/* Driver */}
                <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-400">Assigned Driver</p>
                    <p className="text-sm font-bold text-gray-800">{activeBus.driverName}</p>
                    <p className="text-xs text-gray-500 font-mono">{activeBus.driverPhone}</p>
                  </div>
                  {activeBus.driverPhone && (
                    <a
                      href={`tel:${activeBus.driverPhone}`}
                      className="p-2.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition"
                      title="Call Driver"
                    >
                      <Phone size={16} />
                    </a>
                  )}
                </div>

                {/* Attendant */}
                <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-400">Bus Attendant (Aayah)</p>
                    <p className="text-sm font-bold text-gray-800">{activeBus.attendantName}</p>
                    <p className="text-xs text-gray-500 font-mono">{activeBus.attendantPhone}</p>
                  </div>
                  {activeBus.attendantPhone && (
                    <a
                      href={`tel:${activeBus.attendantPhone}`}
                      className="p-2.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition"
                      title="Call Attendant"
                    >
                      <Phone size={16} />
                    </a>
                  )}
                </div>

                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800 flex items-start gap-2">
                  <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    Drivers are restricted from attending calls while vehicle is in motion. For immediate updates, please call the bus attendant.
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Register Child Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-100 animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-bold text-gray-900 mb-1">Register Child for Bus Service</h3>
            <p className="text-xs text-gray-500 mb-4">Link your child to the society school bus route for live GPS tracking</p>

            {formSuccess ? (
              <div className="py-8 text-center text-emerald-600 space-y-2">
                <CheckCircle2 size={44} className="mx-auto" />
                <p className="font-bold text-base">Child Registered Successfully!</p>
              </div>
            ) : (
              <form onSubmit={handleRegisterChild} className="space-y-4">
                {formError && (
                  <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs font-medium">
                    {formError}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Child Full Name *</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Aarav Sharma"
                    className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Grade / Class *</label>
                    <input
                      type="text"
                      required
                      value={form.grade}
                      onChange={e => setForm({ ...form, grade: e.target.value })}
                      placeholder="e.g. 5-B"
                      className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Boarding Stop</label>
                    <input
                      type="text"
                      value={form.stopName}
                      onChange={e => setForm({ ...form, stopName: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">School Name *</label>
                  <input
                    type="text"
                    required
                    value={form.schoolName}
                    onChange={e => setForm({ ...form, schoolName: e.target.value })}
                    placeholder="e.g. Delhi Public School (DPS)"
                    className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setShowRegisterModal(false)}
                    className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={formSubmitting}
                    className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs"
                  >
                    {formSubmitting ? "Registering..." : "Save Registration"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
export default SchoolBusLiveTracker;
