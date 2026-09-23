import { Star, ShieldCheck, MapPin, CheckCircle, Clock, Calendar, ArrowRight } from "lucide-react";
import type { HomeServiceWorker } from "../../../types/homeServices";

interface WorkerCardProps {
  worker: HomeServiceWorker;
  onSelect: (worker: HomeServiceWorker) => void;
  onRequestBooking: (worker: HomeServiceWorker) => void;
}

export function WorkerCard({ worker, onSelect, onRequestBooking }: WorkerCardProps) {
  const primarySkill = worker.skills.find((s) => s.isPrimary) || worker.skills[0];
  const lowestPackage = worker.packages?.slice().sort((a, b) => a.price - b.price)[0];

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs hover:shadow-md transition-all hover:border-primary/40 flex flex-col justify-between group">
      <div>
        {/* Worker Header & Badge */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-100 to-primary/20 dark:from-indigo-950 dark:to-primary/30 flex items-center justify-center text-primary font-black text-lg border border-primary/20 shrink-0">
              {worker.displayName[0]}
            </div>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white leading-tight">
                  {worker.displayName}
                </h3>
                {worker.verificationStatus === "VERIFIED" && (
                  <span title="Community Verified">
                    <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                  </span>
                )}
              </div>
              <p className="text-xs font-semibold text-primary mt-0.5">
                {primarySkill?.categoryName || "Domestic Helper"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 px-2 py-0.5 rounded-lg shrink-0">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
            <span className="text-xs font-black text-amber-700 dark:text-amber-400">
              {worker.rating.toFixed(1)}
            </span>
            <span className="text-[10px] text-amber-600/80 dark:text-amber-400/80 font-semibold">
              ({worker.reviewCount})
            </span>
          </div>
        </div>

        {/* Verification Badges */}
        <div className="flex items-center gap-1.5 flex-wrap mt-3 text-[10px] font-bold">
          {worker.communityVerified && (
            <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              ✓ Community Verified
            </span>
          )}
          {worker.securityVerified && (
            <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              ✓ Security Cleared
            </span>
          )}
          {worker.mobileVerified && (
            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
              ✓ Mobile Verified
            </span>
          )}
        </div>

        {/* Bio Snippet */}
        {worker.bio && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2.5 line-clamp-2 leading-relaxed">
            {worker.bio}
          </p>
        )}

        {/* Experience & Languages */}
        <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-xs">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Experience</span>
            <span className="font-bold text-slate-700 dark:text-slate-200">
              {worker.experienceYears} Years
            </span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Serves</span>
            <span className="font-bold text-slate-700 dark:text-slate-200">
              {worker.flatAssignments.length > 0 ? `${worker.flatAssignments.length} Flats in Community` : "Available Community-wide"}
            </span>
          </div>
        </div>

        {/* Skills Pills */}
        <div className="flex items-center gap-1 flex-wrap mt-2.5">
          {worker.skills.slice(0, 3).map((s) => (
            <span
              key={s.id}
              className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
            >
              {s.categoryName}
            </span>
          ))}
          {worker.skills.length > 3 && (
            <span className="text-[10px] font-semibold text-slate-400">
              +{worker.skills.length - 3} more
            </span>
          )}
        </div>
      </div>

      {/* Pricing & CTA */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Starting from</span>
          <div className="text-sm font-black text-slate-900 dark:text-white">
            {lowestPackage ? (
              <>
                ₹{lowestPackage.price.toLocaleString("en-IN")}
                <span className="text-[10px] font-normal text-slate-400">
                  {lowestPackage.pricingModel === "FIXED_MONTHLY" ? "/mo" : "/visit"}
                </span>
              </>
            ) : (
              "Flexible"
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onSelect(worker)}
            className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
          >
            View
          </button>
          <button
            onClick={() => onRequestBooking(worker)}
            className="px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-xs hover:opacity-95 active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
          >
            Request
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
