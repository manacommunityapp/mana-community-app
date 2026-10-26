import { useState, useEffect } from "react";
import {
  Star,
  ShieldCheck,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  Package,
  MessageCircle,
  AlertCircle,
  X,
  Phone,
  Layers,
} from "lucide-react";
import type { HomeServiceWorker } from "../../../types/homeServices";
import { homeServiceApi } from "../../../services/homeServices/homeServiceApi";

interface WorkerProfileViewProps {
  workerId: string;
  onClose?: () => void;
  onRequestBooking?: (worker: HomeServiceWorker) => void;
  onOpenChat?: (worker: HomeServiceWorker) => void;
}

export function WorkerProfileView({ workerId, onClose, onRequestBooking, onOpenChat }: WorkerProfileViewProps) {
  const [worker, setWorker] = useState<HomeServiceWorker | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    homeServiceApi.getWorkerById(workerId).then((w) => {
      setWorker(w);
      setLoading(false);
    });
  }, [workerId]);

  if (loading) {
    return (
      <div className="p-8 text-center text-xs font-bold text-slate-400 animate-pulse">
        Loading worker profile...
      </div>
    );
  }

  if (!worker) {
    return (
      <div className="p-8 text-center text-xs font-bold text-destructive">
        Worker profile not found.
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden max-w-3xl mx-auto w-full">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-primary/15 via-indigo-500/10 to-violet-500/15 p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800 relative">
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/80 dark:bg-slate-800 text-slate-500 hover:text-slate-900 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-primary flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-primary/20 shrink-0">
              {worker.displayName[0]}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                  {worker.displayName}
                </h2>
                {worker.verificationStatus === "VERIFIED" && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 text-[10px] font-extrabold flex items-center gap-1 border border-emerald-200 dark:border-emerald-800">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Verified Help
                  </span>
                )}
              </div>
              <p className="text-xs font-bold text-primary mt-0.5">
                {worker.skills.find((s) => s.isPrimary)?.categoryName || "Domestic Helper"}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Serving this community since {worker.servingSince} ({worker.experienceYears} Years Experience)
              </p>
            </div>
          </div>

          <div className="flex sm:flex-col items-center sm:items-end justify-between gap-1 shrink-0">
            <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 px-3 py-1.5 rounded-xl">
              <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
              <span className="text-sm font-black text-amber-700 dark:text-amber-400">
                {worker.rating.toFixed(1)}
              </span>
              <span className="text-xs text-amber-600/80 font-bold">
                ({worker.reviewCount} Reviews)
              </span>
            </div>
          </div>
        </div>

        {/* Verification Checkmarks */}
        <div className="flex items-center gap-2 flex-wrap mt-4 text-xs font-bold">
          {worker.communityVerified && (
            <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              ✓ Community Verified
            </span>
          )}
          {worker.securityVerified && (
            <span className="px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center gap-1">
              ✓ Security Cleared
            </span>
          )}
          {worker.mobileVerified && (
            <span className="px-2.5 py-1 rounded-lg bg-slate-200/60 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-1">
              ✓ Mobile Verified
            </span>
          )}
        </div>
      </div>

      <div className="p-5 sm:p-6 space-y-6">
        {/* Bio */}
        {worker.bio && (
          <div>
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">
              About Worker
            </h4>
            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              {worker.bio}
            </p>
          </div>
        )}

        {/* Languages & Assigned Flats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
              Languages Spoken
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {worker.languages.map((lang) => (
                <span key={lang} className="px-2 py-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-xs font-bold text-slate-700 dark:text-slate-200">
                  {lang}
                </span>
              ))}
            </div>
          </div>

          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
              Active Flats Served ({worker.flatAssignments.length})
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {worker.flatAssignments.length > 0 ? (
                worker.flatAssignments.map((f) => (
                  <span key={f.id} className="px-2 py-0.5 bg-primary/10 border border-primary/20 text-primary rounded-md text-xs font-bold">
                    Flat {f.flatNumber}
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-500 font-medium">Open to assignments in all towers</span>
              )}
            </div>
          </div>
        </div>

        {/* Skills & Services */}
        <div>
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-2.5">
            Services &amp; Skills Provided
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {worker.skills.map((skill) => (
              <div key={skill.id} className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">
                    {skill.categoryName}
                  </div>
                  <div className="text-[10px] text-slate-400 font-medium">
                    {skill.experienceYears} Years Experience
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Weekly Availability Schedule */}
        <div>
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-2.5">
            Availability Schedule
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
            {worker.availability.map((avail) => (
              <div key={avail.id} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                <span className="font-extrabold text-slate-900 dark:text-white block">
                  {avail.dayOfWeek.slice(0, 3)}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-1 mt-0.5">
                  <Clock className="w-3 h-3 text-primary" />
                  {avail.startTime} - {avail.endTime}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Packages & Pricing Rates */}
        {worker.packages && worker.packages.length > 0 && (
          <div>
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-2.5">
              Available Service Packages &amp; Pricing
            </h4>
            <div className="space-y-2">
              {worker.packages.map((pkg) => (
                <div
                  key={pkg.id}
                  className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {pkg.name}
                      </span>
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase bg-primary/10 text-primary">
                        {pkg.frequency}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {pkg.description}
                    </p>
                    <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                      {pkg.includedTasks.map((t) => (
                        <span key={t} className="text-[9px] font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300">
                          ✓ {t}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-base font-black text-slate-900 dark:text-white">
                      ₹{pkg.price.toLocaleString("en-IN")}
                      <span className="text-[10px] font-normal text-slate-400">
                        {pkg.pricingModel === "FIXED_MONTHLY" ? "/mo" : "/visit"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
          {onOpenChat && (
            <button
              onClick={() => onOpenChat(worker)}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 text-primary" />
              Direct Message
            </button>
          )}
          {onRequestBooking && (
            <button
              onClick={() => onRequestBooking(worker)}
              className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-extrabold shadow-md hover:opacity-95 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
            >
              Request Service Booking
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
