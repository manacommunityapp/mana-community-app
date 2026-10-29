import { useState, useEffect } from "react";
import { Link } from "react-router";
import {
  Trophy,
  DollarSign,
  CalendarCheck,
  Percent,
  Clock,
  ArrowUpRight,
  Plus,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  MapPin,
  Calendar,
  Layers,
  Sparkles,
  Users
} from "lucide-react";
import { toast } from "sonner";
import { sportsVendorService } from "../../../../../services/sports/sportsVendorService";
import type {
  SportsVendorDashboardStats,
  SportsVendorBooking,
  SportsFacility,
} from "../../../../../types/sportsVendor";

export function SportsVendorDashboard() {
  const [stats, setStats] = useState<SportsVendorDashboardStats | null>(null);
  const [todayBookings, setTodayBookings] = useState<SportsVendorBooking[]>([]);
  const [facilities, setFacilities] = useState<SportsFacility[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    setLoading(true);
    try {
      const [sData, bData, fData] = await Promise.all([
        sportsVendorService.getDashboardStats(),
        sportsVendorService.getBookings(),
        sportsVendorService.getFacilities(),
      ]);
      setStats(sData);
      setTodayBookings(bData.slice(0, 5));
      setFacilities(fData);
    } catch (err) {
      toast.error("Failed to load sports dashboard data");
    } finally {
      setLoading(false);
    }
  }

  async function handleQuickCheckIn(bookingId: string) {
    try {
      await sportsVendorService.checkInBooking(bookingId);
      toast.success("Player checked in successfully!");
      loadDashboard();
    } catch (err) {
      toast.error("Error checking in player");
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-700 p-6 sm:p-8 text-white shadow-lg">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold text-emerald-100">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
              Verified Sports Facility Partner
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Sports Business Hub
            </h1>
            <p className="text-sm text-emerald-100 max-w-xl">
              Manage court inventory, schedule peak/off-peak pricing, track resident bookings, and verify player check-ins in real-time.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/vendor-portal/sports/venues"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-emerald-800 text-xs font-bold hover:bg-emerald-50 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Add Court / Facility
            </Link>
            <Link
              to="/sports/venues"
              target="_blank"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold backdrop-blur-sm transition-colors border border-white/20"
            >
              <ExternalLink className="w-4 h-4" />
              View Resident Listing
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Revenue */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Today's Revenue</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">
              ₹{stats ? stats.todayRevenue.toLocaleString("en-IN") : "0"}
            </span>
            <span className="text-xs font-bold text-emerald-600 flex items-center">
              <ArrowUpRight className="w-3 h-3" /> +14%
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Paid court bookings today</p>
        </div>

        {/* Court Utilization */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:border-indigo-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Court Utilization</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">
              {stats ? `${stats.courtUtilizationPercent}%` : "0%"}
            </span>
            <span className="text-xs font-bold text-indigo-600">Peak Hours 92%</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Operating capacity filled</p>
        </div>

        {/* Pending Check-ins */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:border-amber-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Pending Check-Ins</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">
              {stats ? stats.pendingCheckIns : 0}
            </span>
            <span className="text-xs font-medium text-amber-600">Upcoming slots</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Arriving in next 3 hours</p>
        </div>

        {/* Active Courts */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:border-teal-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Active Courts</span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
              <Trophy className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">
              {stats ? stats.activeCourtsCount : 0}
            </span>
            <span className="text-xs font-medium text-slate-500">Across {facilities.length} Venues</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Live for resident bookings</p>
        </div>
      </div>

      {/* Main Grid: Live Bookings & Quick Operations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Today's Bookings (2 spans) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Today's Court Reservations</h2>
              <p className="text-xs text-slate-500">Manage real-time check-in and attendance</p>
            </div>
            <Link
              to="/vendor-portal/sports/bookings"
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:underline"
            >
              View All ({todayBookings.length})
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {todayBookings.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-sm">
                No bookings scheduled for today yet.
              </div>
            ) : (
              todayBookings.map((bk) => (
                <div key={bk.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex flex-col items-center justify-center font-bold text-xs shrink-0 border border-slate-200">
                      <span>{bk.startTime.split(":")[0]}</span>
                      <span className="text-[9px] text-slate-400 font-normal">HRS</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">{bk.customerName}</span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            bk.status === "CHECKED_IN"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : bk.status === "CONFIRMED"
                              ? "bg-blue-50 text-blue-700 border border-blue-200"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {bk.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {bk.courtName} • <span className="font-medium text-indigo-600">{bk.sportType}</span>
                      </p>
                      {bk.unitOrCommunity && (
                        <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Users className="w-3 h-3" /> {bk.unitOrCommunity}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3">
                    <div className="text-right">
                      <p className="text-sm font-bold text-slate-900">₹{bk.amount}</p>
                      <span className="text-[10px] text-emerald-600 font-semibold">{bk.paymentStatus}</span>
                    </div>

                    {bk.status === "CONFIRMED" && (
                      <button
                        onClick={() => handleQuickCheckIn(bk.id)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Check-in
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Facilities & Quick Actions */}
        <div className="space-y-6">
          {/* Quick Shortcuts */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Operations Control
            </h3>
            <div className="grid grid-cols-1 gap-2">
              <Link
                to="/vendor-portal/sports/calendar"
                className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50 hover:bg-indigo-50/50 hover:border-indigo-200 transition-all text-xs font-bold text-slate-800"
              >
                <div className="flex items-center gap-2.5">
                  <Calendar className="w-4 h-4 text-indigo-600" />
                  <span>Court Slot Calendar</span>
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
              </Link>

              <Link
                to="/vendor-portal/sports/pricing"
                className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50 hover:bg-emerald-50/50 hover:border-emerald-200 transition-all text-xs font-bold text-slate-800"
              >
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>Peak & Resident Rates</span>
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
              </Link>

              <Link
                to="/vendor-portal/sports/venues"
                className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50 hover:bg-amber-50/50 hover:border-amber-200 transition-all text-xs font-bold text-slate-800"
              >
                <div className="flex items-center gap-2.5">
                  <Layers className="w-4 h-4 text-amber-600" />
                  <span>Facility Details & Surfaces</span>
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
              </Link>
            </div>
          </div>

          {/* Managed Facilities Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                My Facilities ({facilities.length})
              </h3>
              <Link to="/vendor-portal/sports/venues" className="text-xs font-bold text-emerald-600 hover:underline">
                Manage
              </Link>
            </div>

            <div className="space-y-3">
              {facilities.map((fac) => (
                <div key={fac.id} className="p-3 rounded-xl border border-slate-100 bg-slate-50/60 flex items-start gap-3">
                  <img
                    src={fac.images[0]}
                    alt={fac.name}
                    className="w-12 h-12 rounded-lg object-cover border border-slate-200 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-slate-900 truncate">{fac.name}</h4>
                    <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                      {fac.area}, {fac.city}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                        {fac.courtsCount} Courts
                      </span>
                      {fac.isFederated && (
                        <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-200">
                          Federated
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
