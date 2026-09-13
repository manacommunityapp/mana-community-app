import { useState, useEffect, useCallback } from "react";
import { Sword, Layers, Users, CalendarDays, ClipboardCheck, Trophy, ChevronLeft } from "lucide-react";
import { showSuccess, showError } from "../../../../utils/ToastUtils";
import { karateService } from "../../../../services/sports/karateService";
import type {
  KarateBelt, KarateBeltRequest, KarateProgram, KarateProgramRequest,
  KarateBatch, KarateBatchRequest, KarateEnrollment, KarateClass,
  KarateAttendanceRecord, KarateGradingExam, KarateGradingExamRequest,
  BatchStatus, KarateAttendanceEntry, KarateExamResultEntry,
} from "../../../../services/sports/karateService";
import { KarateBeltsTab } from "./KarateBeltsTab";
import { KarateBatchesTab } from "./KarateBatchesTab";
import { KarateAttendanceTab } from "./KarateAttendanceTab";
import { KarateGradingTab } from "./KarateGradingTab";

type Tab = "belts" | "programs" | "batches" | "enrollments" | "classes" | "attendance" | "grading";

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "belts",       label: "Belts",       icon: <Sword className="w-4 h-4" /> },
  { id: "batches",     label: "Batches",     icon: <Layers className="w-4 h-4" /> },
  { id: "enrollments", label: "Enrollments", icon: <Users className="w-4 h-4" /> },
  { id: "classes",     label: "Classes",     icon: <CalendarDays className="w-4 h-4" /> },
  { id: "attendance",  label: "Attendance",  icon: <ClipboardCheck className="w-4 h-4" /> },
  { id: "grading",     label: "Grading",     icon: <Trophy className="w-4 h-4" /> },
];

interface Venue { id: number; name: string; }

export function KarateAdmin() {
  const [activeTab, setActiveTab] = useState<Tab>("belts");
  const [selectedBatch, setSelectedBatch] = useState<KarateBatch | null>(null);

  const [belts, setBelts] = useState<KarateBelt[]>([]);
  const [programs, setPrograms] = useState<KarateProgram[]>([]);
  const [batches, setBatches] = useState<KarateBatch[]>([]);
  const [enrollments, setEnrollments] = useState<KarateEnrollment[]>([]);
  const [classes, setClasses] = useState<KarateClass[]>([]);
  const [exams, setExams] = useState<KarateGradingExam[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);

  // Hardcoded sportId — Karate. Resolve properly from SportsMeta if needed.
  const sportId = 1;

  const loadBelts    = useCallback(() => karateService.getBelts().then(r => setBelts(Array.isArray(r) ? r : (r as any)?.content ?? [])).catch(() => {}), []);
  const loadPrograms = useCallback(() => karateService.getPrograms().then(r => setPrograms((r as any)?.content ?? [])).catch(() => {}), []);
  const loadBatches  = useCallback(() => karateService.getBatches().then(r => setBatches((r as any)?.content ?? [])).catch(() => {}), []);

  const loadBatchDetail = useCallback((batch: KarateBatch) => {
    Promise.all([
      karateService.getEnrollments(batch.id).then(r => setEnrollments(Array.isArray(r) ? r : [])).catch(() => {}),
      karateService.getClasses(batch.id).then(r => setClasses(Array.isArray(r) ? r : [])).catch(() => {}),
      karateService.getExams(batch.id).then(r => setExams(Array.isArray(r) ? r : [])).catch(() => {}),
    ]);
  }, []);

  useEffect(() => {
    loadBelts();
    loadPrograms();
    loadBatches();
  }, []);

  useEffect(() => {
    if (selectedBatch) loadBatchDetail(selectedBatch);
  }, [selectedBatch]);

  // ── Belt handlers ──────────────────────────────────────────────────────────
  async function handleSaveBelt(data: KarateBeltRequest, id?: number) {
    try {
      if (id) { await karateService.updateBelt(id, data); }
      else     { await karateService.createBelt(data); }
      showSuccess(id ? "Belt updated" : "Belt created");
      await loadBelts();
    } catch { showError("Failed to save belt"); }
  }

  // ── Batch handlers ─────────────────────────────────────────────────────────
  async function handleCreateBatch(data: KarateBatchRequest) {
    try {
      await karateService.createBatch(data);
      showSuccess("Batch created");
      await loadBatches();
    } catch { showError("Failed to create batch"); }
  }

  async function handleBatchStatus(id: number, status: BatchStatus) {
    try {
      await karateService.updateBatchStatus(id, status);
      showSuccess(`Batch marked ${status.toLowerCase()}`);
      await loadBatches();
      if (selectedBatch?.id === id) {
        const updated = batches.find(b => b.id === id);
        if (updated) loadBatchDetail({ ...updated, status });
      }
    } catch { showError("Failed to update batch status"); }
  }

  function handleSelectBatch(batch: KarateBatch) {
    setSelectedBatch(batch);
    setActiveTab("enrollments");
  }

  // ── Attendance handlers ────────────────────────────────────────────────────
  async function handleFetchAttendance(classId: number): Promise<KarateAttendanceRecord[]> {
    try {
      const data = await karateService.getAttendance(classId);
      return Array.isArray(data) ? data : [];
    } catch { showError("Failed to load attendance"); return []; }
  }

  async function handleSubmitAttendance(classId: number, entries: KarateAttendanceEntry[]) {
    try {
      await karateService.submitAttendance(classId, entries);
      showSuccess("Attendance saved");
    } catch { showError("Failed to save attendance"); }
  }

  // ── Grading handlers ───────────────────────────────────────────────────────
  async function handleCreateExam(data: KarateGradingExamRequest) {
    try {
      await karateService.createExam(data);
      showSuccess("Exam scheduled");
      if (selectedBatch) await loadBatchDetail(selectedBatch);
    } catch { showError("Failed to schedule exam"); }
  }

  async function handleSubmitResults(examId: number, entries: KarateExamResultEntry[]) {
    try {
      await karateService.submitResults(examId, entries);
      showSuccess("Results submitted");
      if (selectedBatch) await loadBatchDetail(selectedBatch);
    } catch { showError("Failed to submit results"); }
  }

  const batchTabs: Tab[] = ["enrollments", "classes", "attendance", "grading"];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 pb-1">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg" style={{ background: "linear-gradient(135deg,#4f46e5,#7c3aed)" }}>
          🥋
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-800">Karate Classes</h2>
          <p className="text-xs text-slate-500">Belt progression · Batches · Attendance · Grading</p>
        </div>
      </div>

      {/* Batch context banner */}
      {selectedBatch && batchTabs.includes(activeTab) && (
        <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-indigo-50 border border-indigo-100">
          <button
            onClick={() => { setSelectedBatch(null); setActiveTab("batches"); }}
            className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" /> Batches
          </button>
          <span className="text-slate-300">·</span>
          <span className="text-sm font-semibold text-indigo-800">{selectedBatch.name}</span>
          <span className="text-xs text-indigo-500 ml-auto">{selectedBatch.status}</span>
        </div>
      )}

      {/* Tab bar */}
      <div className="flex gap-1 flex-wrap">
        {TABS.filter(t => !batchTabs.includes(t.id) || !!selectedBatch).map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg transition-all ${
              activeTab === tab.id
                ? "text-white shadow-sm"
                : "text-slate-600 bg-white border border-slate-100 hover:bg-indigo-50 hover:text-indigo-700"
            }`}
            style={activeTab === tab.id ? { background: "linear-gradient(135deg,#4f46e5,#7c3aed)" } : {}}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm min-h-[300px]">
        {activeTab === "belts" && (
          <KarateBeltsTab belts={belts} sportId={sportId} onSave={handleSaveBelt} />
        )}

        {activeTab === "programs" && (
          <div className="text-sm text-slate-400 py-8 text-center">Program management coming soon</div>
        )}

        {activeTab === "batches" && (
          <KarateBatchesTab
            batches={batches}
            programs={programs}
            venues={venues}
            onCreateBatch={handleCreateBatch}
            onStatusChange={handleBatchStatus}
            onSelectBatch={handleSelectBatch}
          />
        )}

        {activeTab === "enrollments" && selectedBatch && (
          <KarateEnrollmentsPanel
            enrollments={enrollments}
            batchId={selectedBatch.id}
            onRefresh={() => loadBatchDetail(selectedBatch)}
          />
        )}

        {activeTab === "classes" && selectedBatch && (
          <KarateClassesPanel
            classes={classes}
            batchId={selectedBatch.id}
            onRefresh={() => loadBatchDetail(selectedBatch)}
          />
        )}

        {activeTab === "attendance" && selectedBatch && (
          <KarateAttendanceTab
            classes={classes}
            onFetchAttendance={handleFetchAttendance}
            onSubmitAttendance={handleSubmitAttendance}
          />
        )}

        {activeTab === "grading" && selectedBatch && (
          <KarateGradingTab
            exams={exams}
            belts={belts}
            enrollments={enrollments}
            batchId={selectedBatch.id}
            onCreateExam={handleCreateExam}
            onSubmitResults={handleSubmitResults}
          />
        )}
      </div>
    </div>
  );
}

// ── Inline enrollment panel ────────────────────────────────────────────────────

function KarateEnrollmentsPanel({ enrollments, batchId, onRefresh }: { enrollments: KarateEnrollment[]; batchId: number; onRefresh: () => void }) {
  const [studentId, setStudentId] = useState("");
  const [enrolling, setEnrolling] = useState(false);

  async function handleEnroll() {
    if (!studentId) return;
    setEnrolling(true);
    try {
      await karateService.enroll({ batchId, studentUserId: +studentId });
      showSuccess("Student enrolled");
      setStudentId("");
      onRefresh();
    } catch { showError("Failed to enroll student"); }
    finally { setEnrolling(false); }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <input
          type="number"
          placeholder="Student user ID"
          value={studentId}
          onChange={e => setStudentId(e.target.value)}
          className="w-40 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400"
        />
        <button onClick={handleEnroll} disabled={enrolling || !studentId} className="px-4 py-2 text-xs font-medium text-white rounded-lg disabled:opacity-50" style={{ background: "linear-gradient(135deg,#4f46e5,#7c3aed)" }}>
          {enrolling ? "Enrolling…" : "Enroll"}
        </button>
      </div>
      <div className="overflow-x-auto rounded-xl border border-slate-100">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wide">
              <th className="px-4 py-3 text-left">Student</th>
              <th className="px-4 py-3 text-left">Current Belt</th>
              <th className="px-4 py-3 text-right">Attendance %</th>
              <th className="px-4 py-3 text-right">Classes</th>
              <th className="px-4 py-3 text-center">Eligible</th>
              <th className="px-4 py-3 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {enrollments.map(e => (
              <tr key={e.id} className="hover:bg-slate-50/60">
                <td className="px-4 py-3 font-medium text-slate-800">{e.studentName}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    {e.currentBeltColorHex && <span className="w-3.5 h-3.5 rounded-full border border-slate-200" style={{ background: e.currentBeltColorHex }} />}
                    <span className="text-slate-600">{e.currentBeltName ?? "—"}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className={`font-semibold ${e.attendancePercentage >= 75 ? "text-emerald-600" : "text-red-500"}`}>
                    {e.attendancePercentage.toFixed(0)}%
                  </span>
                </td>
                <td className="px-4 py-3 text-right text-slate-600">{e.totalClassesAttended}</td>
                <td className="px-4 py-3 text-center">
                  {e.gradingEligible
                    ? <span className="px-2 py-0.5 text-xs rounded-full bg-amber-100 text-amber-700 font-medium">Eligible</span>
                    : <span className="text-slate-300 text-xs">—</span>}
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                    e.status === "ACTIVE" ? "bg-emerald-100 text-emerald-700"
                    : e.status === "SUSPENDED" ? "bg-red-100 text-red-600"
                    : "bg-slate-100 text-slate-600"
                  }`}>{e.status}</span>
                </td>
              </tr>
            ))}
            {enrollments.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400 text-sm">No enrollments yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Inline classes panel ───────────────────────────────────────────────────────

function KarateClassesPanel({ classes, batchId, onRefresh }: { classes: KarateClass[]; batchId: number; onRefresh: () => void }) {
  const [generating, setGenerating] = useState(false);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  async function handleGenerate() {
    setGenerating(true);
    try {
      const result = await karateService.generateClasses({ batchId, fromDate, toDate });
      showSuccess(`Generated ${(result as any)?.generated ?? 0} class session(s)`);
      onRefresh();
    } catch { showError("Failed to generate classes"); }
    finally { setGenerating(false); }
  }

  const STATUS_CLS: Record<string, string> = {
    SCHEDULED: "bg-blue-100 text-blue-700",
    ONGOING:   "bg-amber-100 text-amber-700",
    COMPLETED: "bg-emerald-100 text-emerald-700",
    CANCELLED: "bg-red-100 text-red-600",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400" />
        <span className="text-slate-400 text-sm">to</span>
        <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400" />
        <button onClick={handleGenerate} disabled={generating || !fromDate || !toDate} className="px-4 py-2 text-xs font-medium text-white rounded-lg disabled:opacity-50" style={{ background: "linear-gradient(135deg,#4f46e5,#7c3aed)" }}>
          {generating ? "Generating…" : "Generate Classes"}
        </button>
      </div>
      <div className="overflow-x-auto rounded-xl border border-slate-100">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wide">
              <th className="px-4 py-3 text-left">Date</th>
              <th className="px-4 py-3 text-left">Time</th>
              <th className="px-4 py-3 text-center">Status</th>
              <th className="px-4 py-3 text-center">Reminder</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {classes.sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate)).map(cls => (
              <tr key={cls.id} className="hover:bg-slate-50/60">
                <td className="px-4 py-3 font-medium text-slate-800">{cls.scheduledDate}</td>
                <td className="px-4 py-3 text-slate-600">{cls.startTime} – {cls.endTime}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${STATUS_CLS[cls.status] ?? ""}`}>{cls.status}</span>
                </td>
                <td className="px-4 py-3 text-center text-xs text-slate-400">{cls.reminderSent ? "Sent" : "—"}</td>
              </tr>
            ))}
            {classes.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-400 text-sm">No classes yet — generate some above</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
