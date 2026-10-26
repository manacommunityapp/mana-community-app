import { useState, useEffect } from "react";
import {
  BookOpen,
  Calendar,
  Clock,
  MapPin,
  QrCode,
  Download,
  Star,
  CheckCircle2,
  Award,
  Sparkles,
  ChevronRight,
  User,
  X,
  Send,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import type { AcademyEnrollment, AcademyProgram } from "../../../types/academy";
import { academyApi } from "../../../services/academy/academyApi";

export function MyLearningView() {
  const [enrollments, setEnrollments] = useState<AcademyEnrollment[]>([]);
  const [programs, setPrograms] = useState<AcademyProgram[]>([]);
  const [loading, setLoading] = useState(true);

  // QR Pass Modal
  const [activeQrPass, setActiveQrPass] = useState<AcademyEnrollment | null>(null);

  // Review Modal
  const [reviewEnrollment, setReviewEnrollment] = useState<AcademyEnrollment | null>(null);
  const [rating, setRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [myEnroll, allProgs] = await Promise.all([
        academyApi.getMyEnrollments("user-current"),
        academyApi.getPrograms(),
      ]);
      setEnrollments(myEnroll);
      setPrograms(allProgs);
    } catch (err: any) {
      toast.error("Failed to load learning enrollments: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCancel = async (programId: string) => {
    if (!confirm("Are you sure you want to cancel this enrollment?")) return;
    try {
      await academyApi.cancelEnrollment(programId, "user-current");
      toast.success("Enrollment cancelled. Seat released.");
      loadData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewEnrollment) return;
    setSubmittingReview(true);
    try {
      await academyApi.submitReview(reviewEnrollment.programId, {
        userId: "user-current",
        userName: "Sandesh Patil",
        overallRating: rating,
        reviewComment,
      });
      toast.success("Thank you! Review submitted to instructor.");
      setReviewEnrollment(null);
      setReviewComment("");
    } catch (err: any) {
      toast.error("Failed to submit review: " + err.message);
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* ── HEADER BANNER ── */}
      <div className="bg-gradient-to-br from-indigo-900 via-primary to-violet-950 rounded-3xl p-6 text-white shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-black uppercase mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            My Learning Journey
          </div>
          <h2 className="text-xl sm:text-2xl font-black">
            Registered Workshops &amp; Courses
          </h2>
          <p className="text-xs sm:text-sm text-white/80 mt-1">
            Access your QR entry passes, session notes, and certificates of completion.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/15 text-center">
            <span className="text-[10px] uppercase font-black tracking-wider text-slate-300 block">
              Active Enrollments
            </span>
            <span className="text-xl font-black text-white">{enrollments.length}</span>
          </div>
        </div>
      </div>

      {/* ── ENROLLMENTS LIST ── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
          <p className="text-xs font-semibold">Loading your learning enrollments...</p>
        </div>
      ) : enrollments.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 p-12 text-center space-y-3">
          <BookOpen className="w-12 h-12 text-indigo-500 mx-auto opacity-80" />
          <h3 className="text-base font-black text-slate-900 dark:text-white">
            No Active Enrollments Yet
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Discover community workshops and courses conducted by verified resident experts.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {enrollments.map((en) => {
            const prog = programs.find((p) => p.id === en.programId);

            return (
              <div
                key={en.id}
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase border border-emerald-200 dark:border-emerald-800">
                      ✓ {en.status} (Seat #{en.seatNumber || 1})
                    </span>
                    <span className="text-xs font-black text-slate-400">
                      Flat {en.flatNumber || "A-204"}
                    </span>
                  </div>

                  <h3 className="text-base font-black text-slate-900 dark:text-white line-clamp-1">
                    {en.programTitle || prog?.title || "Community Workshop"}
                  </h3>

                  <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400 flex-wrap">
                    <span className="flex items-center gap-1 font-bold">
                      <User className="w-3.5 h-3.5 text-primary" />
                      {prog?.instructorName || "Resident Instructor"}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {prog?.startDate || "Upcoming"} • {prog?.startTime || "17:00"}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setActiveQrPass(en)}
                      className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-xs font-black hover:bg-indigo-100 flex items-center gap-1.5 cursor-pointer"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      QR Pass
                    </button>
                    <button
                      onClick={() => setReviewEnrollment(en)}
                      className="px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 text-xs font-bold hover:bg-amber-100 flex items-center gap-1 cursor-pointer"
                    >
                      <Star className="w-3.5 h-3.5" />
                      Review
                    </button>
                  </div>

                  <button
                    onClick={() => handleCancel(en.programId)}
                    className="text-xs font-semibold text-rose-500 hover:underline cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── QR PASS MODAL ── */}
      {activeQrPass && (
        <div className="fixed inset-0 z-60 bg-slate-900/70 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 max-w-xs w-full shadow-2xl space-y-4 text-center text-slate-900 dark:text-white animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <h4 className="font-black text-sm">Session Entry Pass</h4>
              <button
                onClick={() => setActiveQrPass(null)}
                className="p-1 rounded-full text-slate-400 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="w-44 h-44 mx-auto bg-slate-100 dark:bg-slate-800 rounded-2xl flex flex-col items-center justify-center border border-dashed border-slate-300 dark:border-slate-700">
              <QrCode className="w-28 h-28 text-slate-900 dark:text-white" />
              <span className="text-[10px] font-mono text-slate-400 mt-1 font-bold">
                {activeQrPass.qrPassCode}
              </span>
            </div>

            <div>
              <h5 className="text-xs font-black text-slate-900 dark:text-white">
                {activeQrPass.userName}
              </h5>
              <p className="text-[11px] text-slate-500">
                Seat #{activeQrPass.seatNumber || 1} • {activeQrPass.flatNumber || "A-204"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── REVIEW MODAL ── */}
      {reviewEnrollment && (
        <div className="fixed inset-0 z-60 bg-slate-900/70 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 max-w-sm w-full shadow-2xl space-y-4 text-slate-900 dark:text-white animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-base">Rate Workshop</h4>
              <button
                onClick={() => setReviewEnrollment(null)}
                className="text-slate-400 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-500">
              How was your learning experience in{" "}
              <span className="font-bold text-slate-800 dark:text-white">
                {reviewEnrollment.programTitle}
              </span>
              ?
            </p>

            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div className="flex items-center justify-center gap-2 py-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setRating(s)}
                    className="p-1 cursor-pointer transform hover:scale-125 transition-transform"
                  >
                    <Star
                      className={`w-7 h-7 ${
                        s <= rating
                          ? "text-amber-400 fill-amber-400"
                          : "text-slate-300 dark:text-slate-700"
                      }`}
                    />
                  </button>
                ))}
              </div>

              <div>
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="What did you learn? Give feedback to the instructor..."
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 outline-none resize-none h-20"
                />
              </div>

              <button
                type="submit"
                disabled={submittingReview}
                className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-extrabold shadow hover:opacity-90 transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                Submit Review
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
