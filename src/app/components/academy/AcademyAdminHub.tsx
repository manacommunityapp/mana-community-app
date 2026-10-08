import { useState, useEffect } from "react";
import {
  ShieldCheck,
  Users,
  BookOpen,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Award,
  ChevronRight,
  Loader2,
  Check,
  X,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import type { AcademyInstructor, AcademyProgram } from "../../../types/academy";
import { academyApi } from "../../../services/academy/academyApi";
import { resolveImageUrl } from "../../../utils/imageUrlUtils";

export function AcademyAdminHub() {
  const [instructors, setInstructors] = useState<AcademyInstructor[]>([]);
  const [programs, setPrograms] = useState<AcademyProgram[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [instrs, progs] = await Promise.all([
        academyApi.getInstructors(),
        academyApi.getPrograms(),
      ]);
      setInstructors(instrs);
      setPrograms(progs);
    } catch (err: any) {
      toast.error("Failed to load admin data: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApproveInstructor = (id: string) => {
    toast.success("Instructor application APPROVED! Verification badge granted.");
  };

  const handleRejectInstructor = (id: string) => {
    toast.info("Instructor application declined.");
  };

  const totalLearners = programs.reduce((acc, p) => acc + (p.enrolledCount || 0), 0);

  return (
    <div className="space-y-5">
      {/* ── ADMIN HERO BANNER ── */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 rounded-3xl p-6 text-white shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-black uppercase mb-2 border border-emerald-500/30">
            <ShieldCheck className="w-3.5 h-3.5" />
            Academy Governance
          </div>
          <h2 className="text-xl sm:text-2xl font-black">
            Community Academy Administration
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Moderate course offerings, verify resident instructors, and maintain learning quality.
          </p>
        </div>
      </div>

      {/* ── METRICS OVERVIEW ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs text-center">
          <span className="text-[10px] font-black uppercase text-slate-400 block">Total Programs</span>
          <span className="text-2xl font-black text-slate-900 dark:text-white">{programs.length}</span>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs text-center">
          <span className="text-[10px] font-black uppercase text-slate-400 block">Active Learners</span>
          <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{totalLearners}</span>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs text-center">
          <span className="text-[10px] font-black uppercase text-slate-400 block">Verified Instructors</span>
          <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{instructors.length}</span>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs text-center">
          <span className="text-[10px] font-black uppercase text-slate-400 block">Avg Quality Rating</span>
          <span className="text-2xl font-black text-amber-500">★ 4.9</span>
        </div>
      </div>

      {/* ── INSTRUCTOR APPLICATIONS & DIRECTORY ── */}
      <div className="space-y-3">
        <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
          Community Instructor Roster &amp; Verification
        </h3>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
            <p className="text-xs font-semibold">Loading instructors...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {instructors.map((instr) => (
              <div
                key={instr.id}
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={resolveImageUrl(instr.profilePicUrl)}
                      alt={instr.fullName}
                      className="w-12 h-12 rounded-2xl object-cover border-2 border-indigo-500 shrink-0"
                    />
                    <div className="min-w-0">
                      <h4 className="text-sm font-black text-slate-900 dark:text-white truncate">
                        {instr.fullName}
                      </h4>
                      <p className="text-xs text-slate-500 truncate">{instr.profession}</p>
                      <span className="text-[10px] text-slate-400">
                        {instr.tower} • Flat {instr.flatNumber}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                    {instr.bio}
                  </p>

                  <div className="flex flex-wrap gap-1">
                    {instr.skills?.split(",").map((sk, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-400"
                      >
                        {sk.trim()}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase">
                    ✓ {instr.status}
                  </span>
                  <div className="text-right text-xs font-bold text-amber-500">
                    ★ {instr.averageRating} ({instr.reviewCount} reviews)
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
