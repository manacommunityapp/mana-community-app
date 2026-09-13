import { useState } from "react";
import { Plus, Trophy, Star } from "lucide-react";
import type {
  KarateGradingExam, KarateGradingExamRequest, KarateBelt,
  KarateEnrollment, KarateExamResultEntry, ExamStatus,
} from "../../../../services/sports/karateService";

interface Props {
  exams: KarateGradingExam[];
  belts: KarateBelt[];
  enrollments: KarateEnrollment[];
  batchId: number;
  onCreateExam: (data: KarateGradingExamRequest) => Promise<void>;
  onSubmitResults: (examId: number, entries: KarateExamResultEntry[]) => Promise<void>;
}

const STATUS_BADGE: Record<ExamStatus, string> = {
  SCHEDULED: "bg-blue-100 text-blue-700",
  COMPLETED: "bg-emerald-100 text-emerald-700",
  CANCELLED: "bg-red-100 text-red-600",
};

export function KarateGradingTab({ exams, belts, enrollments, batchId, onCreateExam, onSubmitResults }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [examForm, setExamForm] = useState<KarateGradingExamRequest>({ batchId, targetBeltId: 0, scheduledDate: "", venue: "", notes: "" });
  const [savingExam, setSavingExam] = useState(false);
  const [gradingExam, setGradingExam] = useState<KarateGradingExam | null>(null);
  const [results, setResults] = useState<Record<number, { passed: boolean; score: string }>>({});
  const [savingResults, setSavingResults] = useState(false);

  const eligibleEnrollments = enrollments.filter(e => e.gradingEligible && e.status === "ACTIVE");

  async function handleCreateExam() {
    setSavingExam(true);
    try {
      await onCreateExam({ ...examForm, batchId });
      setShowForm(false);
      setExamForm({ batchId, targetBeltId: 0, scheduledDate: "", venue: "", notes: "" });
    } finally {
      setSavingExam(false);
    }
  }

  function openGrading(exam: KarateGradingExam) {
    setGradingExam(exam);
    const init: Record<number, { passed: boolean; score: string }> = {};
    eligibleEnrollments.forEach(e => { init[e.id] = { passed: false, score: "" }; });
    setResults(init);
  }

  async function handleSubmitResults() {
    if (!gradingExam) return;
    setSavingResults(true);
    try {
      const entries: KarateExamResultEntry[] = Object.entries(results).map(([id, r]) => ({
        enrollmentId: +id,
        passed: r.passed,
        score: r.score ? +r.score : null,
      }));
      await onSubmitResults(gradingExam.id, entries);
      setGradingExam(null);
    } finally {
      setSavingResults(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-700">Grading Exams ({exams.length})</h3>
          {eligibleEnrollments.length > 0 && (
            <p className="text-xs text-amber-600 mt-0.5">{eligibleEnrollments.length} student(s) eligible for grading</p>
          )}
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white rounded-lg"
          style={{ background: "linear-gradient(135deg,#4f46e5,#7c3aed)" }}
        >
          <Plus className="w-3.5 h-3.5" /> Schedule Exam
        </button>
      </div>

      <div className="space-y-2">
        {exams.map(exam => (
          <div key={exam.id} className="flex items-center justify-between bg-white rounded-xl border border-slate-100 px-4 py-3 hover:shadow-sm transition-shadow">
            <div className="flex items-center gap-3">
              <span className="w-5 h-5 rounded-full border border-slate-200" style={{ background: exam.targetBeltColorHex }} />
              <div>
                <p className="text-sm font-semibold text-slate-800">{exam.targetBeltName}</p>
                <p className="text-xs text-slate-500">{exam.scheduledDate}{exam.venue ? ` · ${exam.venue}` : ""}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[exam.status]}`}>{exam.status}</span>
              {exam.status === "SCHEDULED" && (
                <button
                  onClick={() => openGrading(exam)}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs text-indigo-700 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors"
                >
                  <Star className="w-3.5 h-3.5" /> Grade
                </button>
              )}
            </div>
          </div>
        ))}
        {exams.length === 0 && (
          <div className="py-10 text-center text-slate-400 text-sm rounded-xl border border-dashed border-slate-200">
            No exams scheduled yet
          </div>
        )}
      </div>

      {/* Schedule exam form */}
      {showForm && (
        <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-4 space-y-3">
          <h4 className="text-sm font-semibold text-indigo-800">Schedule Grading Exam</h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Target Belt</label>
              <select className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400" value={examForm.targetBeltId} onChange={e => setExamForm(f => ({ ...f, targetBeltId: +e.target.value }))}>
                <option value={0}>Select belt…</option>
                {belts.filter(b => b.active).sort((a, b) => a.rank - b.rank).map(b => (
                  <option key={b.id} value={b.id}>{b.name} (Rank {b.rank})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Date</label>
              <input type="date" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400" value={examForm.scheduledDate} onChange={e => setExamForm(f => ({ ...f, scheduledDate: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Venue</label>
              <input className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400" value={examForm.venue ?? ""} onChange={e => setExamForm(f => ({ ...f, venue: e.target.value }))} placeholder="Optional venue" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Notes</label>
              <input className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400" value={examForm.notes ?? ""} onChange={e => setExamForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional notes" />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 text-xs text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">Cancel</button>
            <button onClick={handleCreateExam} disabled={savingExam || !examForm.targetBeltId || !examForm.scheduledDate} className="px-4 py-2 text-xs font-medium text-white rounded-lg disabled:opacity-50" style={{ background: "linear-gradient(135deg,#4f46e5,#7c3aed)" }}>
              {savingExam ? "Scheduling…" : "Schedule Exam"}
            </button>
          </div>
        </div>
      )}

      {/* Grading results modal */}
      {gradingExam && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
              <Trophy className="w-5 h-5 text-indigo-600" />
              <div>
                <p className="font-semibold text-slate-800">Enter Results — {gradingExam.targetBeltName}</p>
                <p className="text-xs text-slate-500">{gradingExam.scheduledDate}</p>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-2">
              {eligibleEnrollments.length === 0 && (
                <p className="text-sm text-slate-400 text-center py-6">No eligible students</p>
              )}
              {eligibleEnrollments.map(enr => {
                const r = results[enr.id] ?? { passed: false, score: "" };
                return (
                  <div key={enr.id} className="flex items-center gap-3 py-2 border-b border-slate-50">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-800">{enr.studentName}</p>
                      <p className="text-xs text-slate-400">{enr.currentBeltName ?? "White Belt"} · {enr.totalClassesAttended} classes</p>
                    </div>
                    <input
                      type="number"
                      placeholder="Score"
                      className="w-20 px-2 py-1.5 text-sm border border-slate-200 rounded-lg text-center focus:outline-none focus:border-indigo-400"
                      value={r.score}
                      onChange={e => setResults(prev => ({ ...prev, [enr.id]: { ...prev[enr.id], score: e.target.value } }))}
                    />
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={r.passed}
                        onChange={e => setResults(prev => ({ ...prev, [enr.id]: { ...prev[enr.id], passed: e.target.checked } }))}
                        className="w-4 h-4 accent-emerald-600"
                      />
                      <span className="text-sm text-slate-700">Passed</span>
                    </label>
                  </div>
                );
              })}
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex gap-2 justify-end">
              <button onClick={() => setGradingExam(null)} className="px-4 py-2 text-xs text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">Cancel</button>
              <button onClick={handleSubmitResults} disabled={savingResults} className="px-4 py-2 text-xs font-medium text-white rounded-lg disabled:opacity-50" style={{ background: "linear-gradient(135deg,#4f46e5,#7c3aed)" }}>
                {savingResults ? "Submitting…" : "Submit Results"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
