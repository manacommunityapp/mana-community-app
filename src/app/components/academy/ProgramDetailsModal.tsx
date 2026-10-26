import React, { useState } from "react";
import {
  X,
  Calendar,
  Clock,
  MapPin,
  Video,
  User,
  Star,
  Users,
  Award,
  CheckCircle2,
  Sparkles,
  BookOpen,
  ArrowRight,
  Layers,
  ChevronRight,
  Loader2,
  Share2,
} from "lucide-react";
import { toast } from "sonner";
import type { AcademyProgram } from "../../../types/academy";
import { academyApi } from "../../../services/academy/academyApi";

interface ProgramDetailsModalProps {
  program: AcademyProgram | null;
  onClose: () => void;
  onEnrollSuccess?: () => void;
}

export function ProgramDetailsModal({
  program,
  onClose,
  onEnrollSuccess,
}: ProgramDetailsModalProps) {
  const [enrolling, setEnrolling] = useState(false);
  const [activeTab, setActiveTab] = useState<"SYLLABUS" | "ABOUT" | "REVIEWS">("SYLLABUS");

  if (!program) return null;

  const handleEnroll = async () => {
    setEnrolling(true);
    try {
      await academyApi.enrollInProgram(program.id, {
        userId: "user-current",
        userName: "Sandesh Patil",
        tower: "Tower A",
        flatNumber: "A-204",
      });
      toast.success(`🎉 You're enrolled in ${program.title}! Seat reserved.`);
      onEnrollSuccess?.();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to enroll in program");
    } finally {
      setEnrolling(false);
    }
  };

  const capacityPct = Math.min(100, Math.round((program.enrolledCount / program.capacity) * 100));

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150">
        {/* Hero Header */}
        <div className="relative h-44 sm:h-52 bg-slate-900 text-white overflow-hidden shrink-0">
          <img
            src={program.coverImageUrl}
            alt={program.title}
            className="w-full h-full object-cover opacity-40 filter brightness-90"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
          
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-md transition-all cursor-pointer z-10"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="absolute bottom-4 left-4 right-4 space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/80 backdrop-blur-md text-[10px] font-black uppercase tracking-wider text-white">
                {program.learningType.replace("_", " ")}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-[10px] font-black uppercase text-white">
                {program.level}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/80 backdrop-blur-md text-[10px] font-black uppercase text-white">
                {program.mode === "IN_PERSON" ? "📍 On-Campus" : "💻 Online"}
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-black leading-tight text-white line-clamp-2">
              {program.title}
            </h2>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-5 pt-3 gap-2 bg-slate-50 dark:bg-slate-800/40 shrink-0">
          {(["SYLLABUS", "ABOUT", "REVIEWS"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-2.5 px-3 text-xs font-black transition-all cursor-pointer border-b-2 ${
                activeTab === tab
                  ? "border-primary text-primary"
                  : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              {tab === "SYLLABUS" ? "Sessions & Syllabus" : tab === "ABOUT" ? "About & Instructor" : "Reviews & Ratings"}
            </button>
          ))}
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 text-slate-900 dark:text-white">
          {activeTab === "SYLLABUS" && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs font-black text-indigo-900 dark:text-indigo-300">
                    <Calendar className="w-4 h-4 text-indigo-600" />
                    <span>Starts {program.startDate} • {program.startTime}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <span>{program.location || "Clubhouse Hall"}</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-black uppercase text-slate-400 block">Duration</span>
                  <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                    {program.durationMinutes} mins / session
                  </span>
                </div>
              </div>

              {/* Sessions List */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
                  Course Timeline ({program.sessions?.length || 1} Session{program.sessions?.length === 1 ? "" : "s"})
                </h4>
                {program.sessions?.map((sess, idx) => (
                  <div
                    key={sess.id || idx}
                    className="p-3.5 rounded-2xl bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 flex items-start gap-3 hover:border-slate-300 transition-all shadow-2xs"
                  >
                    <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-black text-xs flex items-center justify-center shrink-0">
                      #{sess.sessionOrder || idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h5 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                        {sess.title}
                      </h5>
                      {sess.description && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                          {sess.description}
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {sess.sessionDate || program.startDate}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {sess.startTime || program.startTime}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "ABOUT" && (
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-1">
                  Description
                </h4>
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  {program.description || program.summary}
                </p>
              </div>

              {program.prerequisites && (
                <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50">
                  <span className="text-[10px] font-black uppercase text-amber-800 dark:text-amber-300 block mb-0.5">
                    Prerequisites
                  </span>
                  <p className="text-xs text-amber-900 dark:text-amber-200">
                    {program.prerequisites}
                  </p>
                </div>
              )}

              {/* Instructor Bio Card */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2.5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white font-black text-lg flex items-center justify-center shrink-0">
                    {program.instructorName[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-sm font-black text-slate-900 dark:text-white">
                        {program.instructorName}
                      </h4>
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                        Verified Resident
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">Instructor • Tower A Resident</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-xs font-black text-amber-500">
                      <Star className="w-3.5 h-3.5 fill-amber-400" />
                      {program.averageRating}
                    </div>
                    <span className="text-[10px] text-slate-400">({program.reviewCount} reviews)</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "REVIEWS" && (
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50">
                <div className="text-3xl font-black text-amber-500">
                  {program.averageRating}
                </div>
                <div>
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                    Based on {program.reviewCount} resident participant reviews
                  </p>
                </div>
              </div>

              {/* Sample Reviews */}
              <div className="space-y-2.5">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-xs space-y-1">
                  <div className="flex items-center justify-between font-bold">
                    <span>Rahul Sharma (Tower B)</span>
                    <span className="text-amber-500">★★★★★ 5.0</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400">
                    "Exceptional workshop! The hands-on coding demos and live architecture explanations made complex concepts very easy to digest."
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-xs space-y-1">
                  <div className="flex items-center justify-between font-bold">
                    <span>Ananya Deshmukh (Tower C)</span>
                    <span className="text-amber-500">★★★★★ 5.0</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400">
                    "Super engaging and interactive. Loved learning directly from neighbors!"
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Registration Bar */}
        <div className="p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-lg font-black text-slate-900 dark:text-white">
                {program.pricingType === "FREE" ? "Free Workshop" : `₹${program.price}`}
              </span>
              <span className="text-xs text-slate-500">
                • {program.availableSeats} of {program.capacity} seats left
              </span>
            </div>
            
            {/* Progress bar */}
            <div className="w-48 h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  capacityPct >= 90 ? "bg-rose-500" : "bg-emerald-500"
                }`}
                style={{ width: `${capacityPct}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleEnroll}
              disabled={enrolling || program.availableSeats === 0}
              className="w-full sm:w-auto px-6 py-2.5 rounded-2xl bg-primary text-primary-foreground font-black text-xs sm:text-sm shadow-md hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {enrolling ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : program.availableSeats > 0 ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Enroll in Program</span>
                </>
              ) : (
                <>
                  <Users className="w-4 h-4" />
                  <span>Join Waitlist</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
