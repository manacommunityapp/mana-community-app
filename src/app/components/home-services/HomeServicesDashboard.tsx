import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  Search,
  Users,
  CalendarDays,
  FilePlus,
  Star,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Building,
  HeartHandshake,
  ChevronRight,
  TrendingUp,
  Sparkles,
} from "lucide-react";
import type { ServiceCategory, HomeServiceWorker, HomeServiceBooking } from "../../../types/homeServices";
import { homeServiceApi } from "../../../services/homeServices/homeServiceApi";
import { WorkerCard } from "./WorkerCard";
import { BookHomeServiceModal } from "./BookHomeServiceModal";
import { WorkerProfileView } from "./WorkerProfileView";

export function HomeServicesDashboard() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [workers, setWorkers] = useState<HomeServiceWorker[]>([]);
  const [myBookings, setMyBookings] = useState<HomeServiceBooking[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [activeWorkerForBooking, setActiveWorkerForBooking] = useState<HomeServiceWorker | null>(null);
  const [activeWorkerForProfile, setActiveWorkerForProfile] = useState<HomeServiceWorker | null>(null);

  useEffect(() => {
    homeServiceApi.getCategories().then(setCategories);
    homeServiceApi.getWorkers().then(setWorkers);
    homeServiceApi.getBookings("user-current").then(setMyBookings);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/home-services/find-help?q=${encodeURIComponent(searchQuery)}`);
  };

  const activeHelpBookings = myBookings.filter((b) => b.status === "CONFIRMED" || b.status === "SCHEDULED");

  return (
    <div className="space-y-6">
      {/* ── HERO SEARCH & BANNER ── */}
      <div className="relative rounded-3xl bg-gradient-to-br from-indigo-900 via-primary to-violet-950 p-6 sm:p-8 text-white shadow-xl overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-black tracking-wide uppercase border border-white/20 mb-3">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            Trusted Community Help
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight leading-tight">
            Find Verified Home Help Within Your Community
          </h1>
          <p className="text-xs sm:text-sm text-white/80 mt-2 font-medium leading-relaxed">
            Discover dependable domestic helpers, maids, cooks, drivers &amp; technicians already serving your tower and neighbors.
          </p>

          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="mt-5 flex items-center gap-2 bg-white dark:bg-slate-900 p-1.5 rounded-2xl shadow-lg border border-white/30 text-slate-900 dark:text-white">
            <div className="pl-3 pr-2 flex items-center text-slate-400">
              <Search className="w-5 h-5" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="What service do you need? (e.g. Maid, Cook, Cleaning, Electrician...)"
              className="w-full bg-transparent text-xs sm:text-sm font-semibold outline-none placeholder:text-slate-400"
            />
            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs sm:text-sm font-extrabold shadow-md hover:opacity-90 active:scale-95 transition-all shrink-0 cursor-pointer"
            >
              Search
            </button>
          </form>
        </div>
      </div>

      {/* ── POPULAR SERVICES GRID ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
              Explore Popular Services
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Select a service category to discover available community workers
            </p>
          </div>
          <button
            onClick={() => navigate("/home-services/find-help")}
            className="text-xs font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
          >
            View All
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-3">
          {categories.slice(0, 10).map((cat) => (
            <button
              key={cat.id}
              onClick={() => navigate(`/home-services/find-help?category=${cat.id}`)}
              className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-primary/50 hover:shadow-md transition-all text-center group cursor-pointer"
            >
              <span className="text-2xl sm:text-3xl mb-1.5 group-hover:scale-110 transition-transform">
                {cat.icon}
              </span>
              <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 group-hover:text-primary transition-colors line-clamp-1">
                {cat.name}
              </span>
              <span className="text-[10px] text-slate-400 font-semibold mt-0.5">
                {cat.supportsRecurring ? "Daily / Monthly" : "On-Demand"}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── MY ACTIVE HOME HELP CARDS ── */}
      {activeHelpBookings.length > 0 && (
        <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-cyan-500/10 border border-emerald-500/20 rounded-3xl p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black">
                <HeartHandshake className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                  My Active Home Help
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Workers currently serving your residence (Flat A-204)
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate("/home-services/my-help")}
              className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              Manage Help
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {activeHelpBookings.map((b) => (
              <div
                key={b.id}
                className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary font-black text-lg flex items-center justify-center shrink-0">
                    {b.workerName?.[0] || "W"}
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                      {b.workerName}
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase bg-emerald-50 text-emerald-600 border border-emerald-200">
                        Active
                      </span>
                    </h4>
                    <p className="text-xs font-semibold text-primary mt-0.5">
                      {b.categoryName}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                      <span className="flex items-center gap-1 font-medium">
                        <Clock className="w-3 h-3 text-slate-400" />
                        Mon-Sat • {b.startTime}
                      </span>
                      <span>•</span>
                      <span className="font-extrabold text-slate-700 dark:text-slate-300">
                        ₹{b.price.toLocaleString("en-IN")}/mo
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => navigate("/home-services/my-help")}
                    className="w-full sm:w-auto px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-bold text-slate-700 dark:text-slate-200 transition-all cursor-pointer text-center"
                  >
                    View &amp; Attendance
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── POST A REQUIREMENT BANNER ── */}
      <div className="bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-rose-500/15 border border-amber-500/30 rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-amber-500/20 text-amber-800 dark:text-amber-300 text-[10px] font-black uppercase mb-1.5">
            Can't find a slot that fits?
          </div>
          <h3 className="text-base font-black text-slate-900 dark:text-white">
            Post Your Custom Requirement &amp; Receive Worker Bids
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-xl">
            Specify your schedule, frequency, and budget. Verified workers serving your tower will respond directly with quotes.
          </p>
        </div>
        <button
          onClick={() => navigate("/home-services/requirements")}
          className="px-4 py-2.5 rounded-2xl bg-amber-600 text-white font-extrabold text-xs shadow-md hover:bg-amber-700 active:scale-95 transition-all shrink-0 cursor-pointer flex items-center gap-1.5 justify-center"
        >
          <FilePlus className="w-4 h-4" />
          Post Requirement Now
        </button>
      </div>

      {/* ── FEATURED COMMUNITY WORKERS ── */}
      <div>
        <div className="flex items-center justify-between mb-3.5">
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
              Home Help Around You
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Top-rated verified helpers already working in your tower &amp; community
            </p>
          </div>
          <button
            onClick={() => navigate("/home-services/find-help")}
            className="text-xs font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
          >
            Explore All Workers
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {workers.slice(0, 6).map((worker) => (
            <WorkerCard
              key={worker.id}
              worker={worker}
              onSelect={(w) => setActiveWorkerForProfile(w)}
              onRequestBooking={(w) => setActiveWorkerForBooking(w)}
            />
          ))}
        </div>
      </div>

      {/* Modals */}
      {activeWorkerForBooking && (
        <BookHomeServiceModal
          worker={activeWorkerForBooking}
          onClose={() => setActiveWorkerForBooking(null)}
          onSuccess={() => {
            setActiveWorkerForBooking(null);
            homeServiceApi.getBookings("user-current").then(setMyBookings);
            navigate("/home-services/bookings");
          }}
        />
      )}

      {activeWorkerForProfile && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3.5 sm:p-6 overflow-y-auto">
          <WorkerProfileView
            workerId={activeWorkerForProfile.id}
            onClose={() => setActiveWorkerForProfile(null)}
            onRequestBooking={(w) => {
              setActiveWorkerForProfile(null);
              setActiveWorkerForBooking(w);
            }}
          />
        </div>
      )}
    </div>
  );
}
