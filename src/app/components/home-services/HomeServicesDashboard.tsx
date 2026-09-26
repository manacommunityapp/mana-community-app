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
  Car,
  Shirt,
  Sparkle,
  KeyRound,
  Camera,
  QrCode,
  Layers,
  Check,
  Send,
} from "lucide-react";
import { toast } from "sonner";
import type { ServiceCategory, HomeServiceWorker, HomeServiceBooking, ServiceAttendance } from "../../../types/homeServices";
import { homeServiceApi } from "../../../services/homeServices/homeServiceApi";
import { WorkerCard } from "./WorkerCard";
import { BookHomeServiceModal } from "./BookHomeServiceModal";
import { WorkerProfileView } from "./WorkerProfileView";
import { SubscriptionConfigModal } from "./SubscriptionConfigModal";
import { ProviderJobDeck } from "./ProviderJobDeck";
import { GatePassScannerModal } from "./GatePassScannerModal";

export function HomeServicesDashboard() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [workers, setWorkers] = useState<HomeServiceWorker[]>([]);
  const [myBookings, setMyBookings] = useState<HomeServiceBooking[]>([]);
  const [todayJobs, setTodayJobs] = useState<ServiceAttendance[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeWorkerForBooking, setActiveWorkerForBooking] = useState<HomeServiceWorker | null>(null);
  const [activeWorkerForProfile, setActiveWorkerForProfile] = useState<HomeServiceWorker | null>(null);

  // Hyperlocal Recurring modals
  const [subscriptionModalOpen, setSubscriptionModalOpen] = useState(false);
  const [subscriptionPreset, setSubscriptionPreset] = useState<"CAR_WASH" | "IRONING" | "MAID">("CAR_WASH");
  const [providerDeckOpen, setProviderDeckOpen] = useState(false);
  const [gatePassScannerOpen, setGatePassScannerOpen] = useState(false);

  // Rating modal state
  const [ratingJob, setRatingJob] = useState<ServiceAttendance | null>(null);
  const [selectedRating, setSelectedRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [submittingRating, setSubmittingRating] = useState(false);

  const loadData = () => {
    homeServiceApi.getCategories().then(setCategories);
    homeServiceApi.getWorkers().then(setWorkers);
    homeServiceApi.getBookings("user-current").then(setMyBookings);
    homeServiceApi.getTodayJobsForResident("user-current").then(setTodayJobs);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/home-services/find-help?q=${encodeURIComponent(searchQuery)}`);
  };

  const handleRateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ratingJob) return;
    setSubmittingRating(true);
    try {
      await homeServiceApi.rateJob(ratingJob.id, selectedRating, reviewText);
      toast.success("Thank you! Your rating has been submitted.");
      setRatingJob(null);
      setReviewText("");
      loadData();
    } catch (err: any) {
      toast.error("Failed to submit rating: " + err.message);
    } finally {
      setSubmittingRating(false);
    }
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
            Hyperlocal Community OS
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight leading-tight">
            Find Verified Home Help &amp; Daily Subscriptions
          </h1>
          <p className="text-xs sm:text-sm text-white/80 mt-2 font-medium leading-relaxed">
            Recurring doorstep car cleaning, steam ironing pickup, verified domestic helpers &amp; on-demand experts serving your tower.
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
              placeholder="What service do you need? (e.g. Car Wash, Ironing, Maid, Electrician...)"
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

        {/* Quick Demo Switchers */}
        <div className="mt-6 pt-4 border-t border-white/15 flex flex-wrap items-center gap-2 text-xs font-bold">
          <span className="text-white/60 text-[11px] uppercase tracking-wider font-extrabold mr-1">
            Quick Tools:
          </span>
          <button
            onClick={() => setProviderDeckOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-all cursor-pointer flex items-center gap-1.5 border border-white/10"
          >
            👷 Provider Job Deck (PIN &amp; Proof)
          </button>
          <button
            onClick={() => setGatePassScannerOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 backdrop-blur-md transition-all cursor-pointer flex items-center gap-1.5 border border-emerald-500/30"
          >
            🛡️ Security Gate Pass Scanner
          </button>
        </div>
      </div>

      {/* ── TODAY'S LIVE SERVICE & PIN TRACKER (RESIDENT VIEW) ── */}
      {todayJobs.length > 0 && (
        <div className="bg-gradient-to-r from-indigo-500/10 via-purple-500/5 to-pink-500/10 border border-indigo-500/30 rounded-3xl p-5 sm:p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                  Today's Scheduled Services (Flat A-204)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Share your 4-digit PIN with the service provider when they arrive at your vehicle or flat.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {todayJobs.map((job) => (
              <div
                key={job.id}
                className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase border border-indigo-200 dark:border-indigo-800">
                      {job.serviceCategoryName || "Service"}
                    </span>
                    {job.status === "COMPLETED" ? (
                      <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase border border-emerald-200">
                        ✓ Completed
                      </span>
                    ) : job.status === "IN_PROGRESS" ? (
                      <span className="px-2 py-0.5 rounded-md bg-sky-50 text-sky-600 text-[10px] font-black uppercase border border-sky-200 animate-pulse">
                        ● In Progress
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-600 text-[10px] font-black uppercase border border-amber-200">
                        Scheduled
                      </span>
                    )}
                  </div>
                  {job.vehicleNumber && (
                    <span className="text-[11px] font-mono font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                      🚗 {job.vehicleNumber}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                      {job.workerName || "Assigned Specialist"}
                    </h4>
                    <p className="text-xs text-slate-500">Scheduled for today</p>
                  </div>

                  {job.verificationPin && job.status !== "COMPLETED" && (
                    <div className="text-right">
                      <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">
                        Provider Start PIN
                      </span>
                      <span className="text-lg font-mono font-black tracking-widest text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2.5 py-0.5 rounded-lg border border-indigo-200 dark:border-indigo-800 inline-block">
                        {job.verificationPin}
                      </span>
                    </div>
                  )}
                </div>

                {/* Proof Photos & Rating */}
                {job.status === "COMPLETED" && (
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                    {(job.beforePhotoUrl || job.afterPhotoUrl) && (
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-500">Service Proof:</span>
                        <div className="flex gap-2">
                          {job.beforePhotoUrl && (
                            <a
                              href={job.beforePhotoUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] text-indigo-600 hover:underline font-bold"
                            >
                              📷 Before Photo
                            </a>
                          )}
                          {job.afterPhotoUrl && (
                            <a
                              href={job.afterPhotoUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] text-emerald-600 hover:underline font-bold"
                            >
                              ✨ After Photo
                            </a>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-1">
                      {job.rating ? (
                        <div className="flex items-center gap-1 text-xs font-bold text-amber-500">
                          <Star className="w-4 h-4 fill-amber-400" />
                          <span>Rated {job.rating} / 5</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setRatingJob(job);
                            setSelectedRating(5);
                          }}
                          className="px-3 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-xs font-bold hover:bg-amber-100 transition-all cursor-pointer flex items-center gap-1"
                        >
                          <Star className="w-3.5 h-3.5" />
                          Rate Service &amp; Specialist
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── HYPERLOCAL RECURRING SUBSCRIPTIONS (GOPREZZ MODEL) ── */}
      <div>
        <div className="flex items-center justify-between mb-3.5">
          <div>
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase mb-1">
              <Sparkles className="w-3 h-3" />
              Community Recurring Packages
            </div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
              Doorstep Daily &amp; Monthly Subscriptions
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Zero-friction doorstep services delivered by dedicated workers inside your gated community
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Card 1: Car Wash */}
          <div className="relative bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-5 rounded-3xl shadow-md border border-indigo-700/40 flex flex-col justify-between group overflow-hidden">
            <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-white/10 text-indigo-300 flex items-center justify-center font-black">
                <Car className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-300">
                  Most Popular
                </span>
                <h3 className="text-base font-black">Daily Doorstep Car Wash</h3>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Basement exterior cleaning &amp; glass wipe 6 days/week + weekend interior vacuuming.
                </p>
              </div>
              <div className="pt-2">
                <span className="text-xl font-black text-white">₹899</span>
                <span className="text-xs text-slate-300 font-medium"> /month</span>
              </div>
            </div>

            <button
              onClick={() => {
                setSubscriptionPreset("CAR_WASH");
                setSubscriptionModalOpen(true);
              }}
              className="mt-4 w-full py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-extrabold text-xs shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
            >
              Subscribe Now
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Card 2: Steam Ironing */}
          <div className="relative bg-gradient-to-br from-purple-900 to-slate-900 text-white p-5 rounded-3xl shadow-md border border-purple-700/40 flex flex-col justify-between group overflow-hidden">
            <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-white/10 text-purple-300 flex items-center justify-center font-black">
                <Shirt className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-purple-300">
                  Daily Express
                </span>
                <h3 className="text-base font-black">Daily Steam Ironing</h3>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Doorstep pickup before 08:00 AM &amp; crisp delivery by evening with garment tags.
                </p>
              </div>
              <div className="pt-2">
                <span className="text-xl font-black text-white">₹799</span>
                <span className="text-xs text-slate-300 font-medium"> /month</span>
              </div>
            </div>

            <button
              onClick={() => {
                setSubscriptionPreset("IRONING");
                setSubscriptionModalOpen(true);
              }}
              className="mt-4 w-full py-2.5 rounded-xl bg-purple-500 hover:bg-purple-400 text-white font-extrabold text-xs shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
            >
              Subscribe Now
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Card 3: Maid & Housekeeping */}
          <div className="relative bg-gradient-to-br from-teal-900 to-slate-900 text-white p-5 rounded-3xl shadow-md border border-teal-700/40 flex flex-col justify-between group overflow-hidden">
            <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-white/10 text-teal-300 flex items-center justify-center font-black">
                <Sparkle className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-teal-300">
                  Verified Maid
                </span>
                <h3 className="text-base font-black">House Maid &amp; Cook</h3>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Police verified domestic helpers with attendance tracking, salary escrow &amp; replacement guarantee.
                </p>
              </div>
              <div className="pt-2">
                <span className="text-xl font-black text-white">₹3,500</span>
                <span className="text-xs text-slate-300 font-medium"> /month</span>
              </div>
            </div>

            <button
              onClick={() => {
                setSubscriptionPreset("MAID");
                setSubscriptionModalOpen(true);
              }}
              className="mt-4 w-full py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-white font-extrabold text-xs shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
            >
              Configure Package
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
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

      {/* ── MODALS ── */}
      {subscriptionModalOpen && (
        <SubscriptionConfigModal
          isOpen={subscriptionModalOpen}
          initialServiceType={subscriptionPreset}
          onClose={() => setSubscriptionModalOpen(false)}
          onSuccess={() => {
            loadData();
          }}
        />
      )}

      {providerDeckOpen && (
        <ProviderJobDeck
          isOpen={providerDeckOpen}
          onClose={() => {
            setProviderDeckOpen(false);
            loadData();
          }}
        />
      )}

      {gatePassScannerOpen && (
        <GatePassScannerModal
          isOpen={gatePassScannerOpen}
          onClose={() => setGatePassScannerOpen(false)}
        />
      )}

      {/* ── Star Rating Modal ── */}
      {ratingJob && (
        <div className="fixed inset-0 z-60 bg-slate-900/70 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 max-w-sm w-full shadow-2xl space-y-4 text-slate-900 dark:text-white animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-base">Rate Completed Service</h4>
              <button onClick={() => setRatingJob(null)} className="text-slate-400 p-1 cursor-pointer">
                ✕
              </button>
            </div>
            <p className="text-xs text-slate-500">
              How was your service experience with{" "}
              <span className="font-bold text-slate-800 dark:text-white">
                {ratingJob.workerName}
              </span>
              ?
            </p>

            <form onSubmit={handleRateSubmit} className="space-y-4">
              <div className="flex items-center justify-center gap-2 py-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSelectedRating(s)}
                    className="p-1 cursor-pointer transform hover:scale-125 transition-transform"
                  >
                    <Star
                      className={`w-7 h-7 ${
                        s <= selectedRating
                          ? "text-amber-400 fill-amber-400"
                          : "text-slate-300 dark:text-slate-700"
                      }`}
                    />
                  </button>
                ))}
              </div>

              <div>
                <textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Add feedback on quality of cleaning, punctuality..."
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 outline-none resize-none h-20"
                />
              </div>

              <button
                type="submit"
                disabled={submittingRating}
                className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-extrabold shadow hover:opacity-90 transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                Submit Rating &amp; Review
              </button>
            </form>
          </div>
        </div>
      )}

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
