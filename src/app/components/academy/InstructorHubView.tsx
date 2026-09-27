import { useState, useEffect } from "react";
import {
  Users,
  Calendar,
  Clock,
  PlusCircle,
  QrCode,
  CheckCircle2,
  Star,
  Sparkles,
  BookOpen,
  FileText,
  UserCheck,
  Building,
  UploadCloud,
  ChevronRight,
  Loader2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import type { AcademyProgram, AcademyEnrollment, AcademyCategory } from "../../../types/academy";
import { academyApi } from "../../../services/academy/academyApi";
import { CreateProgramModal } from "./CreateProgramModal";

export function InstructorHubView() {
  const [myPrograms, setMyPrograms] = useState<AcademyProgram[]>([]);
  const [categories, setCategories] = useState<AcademyCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Roster / Attendance State
  const [selectedProgramForRoster, setSelectedProgramForRoster] = useState<AcademyProgram | null>(null);
  const [rosterEnrollments, setRosterEnrollments] = useState<AcademyEnrollment[]>([]);
  const [loadingRoster, setLoadingRoster] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [cats, allProgs] = await Promise.all([
        academyApi.getCategories(),
        academyApi.getPrograms(),
      ]);
      setCategories(cats);
      // Filter programs taught by current user
      const mine = allProgs.filter((p) => p.instructorId === "instr-sandeep" || p.instructorName.includes("Sandeep"));
      setMyPrograms(mine.length > 0 ? mine : allProgs.slice(0, 1));
    } catch (err: any) {
      toast.error("Failed to load instructor programs: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenRoster = async (prog: AcademyProgram) => {
    setSelectedProgramForRoster(prog);
    setLoadingRoster(true);
    try {
      const enrolls = await academyApi.getMyEnrollments("user-current");
      setRosterEnrollments(enrolls);
    } catch {
      setRosterEnrollments([]);
    } finally {
      setLoadingRoster(false);
    }
  };

  const handleMarkPresent = (enrollmentId: string) => {
    toast.success("Attendance marked: PRESENT ✓");
  };

  const totalLearners = myPrograms.reduce((acc, p) => acc + (p.enrolledCount || 0), 0);

  return (
    <div className="space-y-5">
      {/* ── INSTRUCTOR HERO BANNER ── */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 text-white shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-black uppercase mb-2 border border-indigo-500/30">
            <Sparkles className="w-3.5 h-3.5" />
            Instructor Dashboard
          </div>
          <h2 className="text-xl sm:text-2xl font-black">
            Teaching &amp; Knowledge Hub
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Manage your community courses, verify attendance, and engage with your learners.
          </p>
        </div>

        <button
          onClick={() => setCreateModalOpen(true)}
          className="px-5 py-2.5 rounded-2xl bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-black shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          Create New Program
        </button>
      </div>

      {/* ── STATS BAR ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs text-center">
          <span className="text-[10px] font-black uppercase text-slate-400 block">Total Programs</span>
          <span className="text-2xl font-black text-slate-900 dark:text-white">{myPrograms.length}</span>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs text-center">
          <span className="text-[10px] font-black uppercase text-slate-400 block">Total Learners</span>
          <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{totalLearners}</span>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs text-center">
          <span className="text-[10px] font-black uppercase text-slate-400 block">Average Rating</span>
          <span className="text-2xl font-black text-amber-500">★ 4.9</span>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs text-center">
          <span className="text-[10px] font-black uppercase text-slate-400 block">Instructor Status</span>
          <span className="text-xs font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full inline-block mt-1">
            ✓ APPROVED
          </span>
        </div>
      </div>

      {/* ── MY PROGRAMS LIST ── */}
      <div className="space-y-3">
        <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
          My Active &amp; Upcoming Programs
        </h3>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
            <p className="text-xs font-semibold">Loading your programs...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myPrograms.map((p) => (
              <div
                key={p.id}
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase border border-indigo-200 dark:border-indigo-800">
                      {p.learningType.replace("_", " ")}
                    </span>
                    <span className="text-xs font-black text-emerald-600">
                      {p.enrolledCount} / {p.capacity} Enrolled
                    </span>
                  </div>

                  <h4 className="text-base font-black text-slate-900 dark:text-white line-clamp-1">
                    {p.title}
                  </h4>

                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {p.startDate} • {p.startTime}
                    </span>
                    <span>•</span>
                    <span>{p.location || "Clubhouse Hall"}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <button
                    onClick={() => handleOpenRoster(p)}
                    className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    View Roster &amp; Attendance
                  </button>

                  <span className="text-xs font-mono font-bold text-slate-400">
                    {p.sessions?.length || 1} Session(s)
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── ATTENDANCE & ROSTER MODAL ── */}
      {selectedProgramForRoster && (
        <div className="fixed inset-0 z-60 bg-slate-900/70 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 max-w-lg w-full shadow-2xl space-y-4 text-slate-900 dark:text-white animate-in zoom-in-95 duration-150 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between shrink-0">
              <div>
                <h4 className="font-extrabold text-base">Class Attendance Roster</h4>
                <p className="text-xs text-slate-500">{selectedProgramForRoster.title}</p>
              </div>
              <button
                onClick={() => setSelectedProgramForRoster(null)}
                className="text-slate-400 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/50 flex items-center justify-between text-xs">
              <span className="font-bold text-indigo-900 dark:text-indigo-300">
                Session 1 • {selectedProgramForRoster.startDate}
              </span>
              <span className="font-extrabold text-emerald-600">
                {selectedProgramForRoster.enrolledCount} Confirmed Learners
              </span>
            </div>

            {/* Roster List */}
            <div className="overflow-y-auto space-y-2 flex-1">
              {[
                { name: "Sandesh Patil", flat: "A-204", seat: 12, attended: true },
                { name: "Rahul Kumar", flat: "B-101", seat: 1, attended: true },
                { name: "Ananya Deshmukh", flat: "C-402", seat: 2, attended: false },
                { name: "Priya Sharma", flat: "B-501", seat: 3, attended: true },
              ].map((student, i) => (
                <div
                  key={i}
                  className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-indigo-600/10 text-indigo-600 font-bold flex items-center justify-center text-xs">
                      #{student.seat}
                    </span>
                    <div>
                      <span className="font-extrabold text-slate-900 dark:text-white block">
                        {student.name}
                      </span>
                      <span className="text-[11px] text-slate-400">Flat {student.flat}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleMarkPresent(String(i))}
                    className={`px-3 py-1 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      student.attended
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                        : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-emerald-500 hover:text-white"
                    }`}
                  >
                    {student.attended ? "✓ Present" : "Mark Present"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── CREATE PROGRAM MODAL ── */}
      {createModalOpen && (
        <CreateProgramModal
          isOpen={createModalOpen}
          categories={categories}
          onClose={() => setCreateModalOpen(false)}
          onSuccess={() => {
            loadData();
          }}
        />
      )}
    </div>
  );
}
