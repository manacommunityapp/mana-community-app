import { useState, useEffect } from "react";
import { CheckCircle, Clock, XCircle, AlertCircle, Save } from "lucide-react";
import type {
  KarateClass, KarateAttendanceEntry, KarateAttendanceRecord,
  AttendanceStatus,
} from "../../../../services/sports/karateService";

interface Props {
  classes: KarateClass[];
  onFetchAttendance: (classId: number) => Promise<KarateAttendanceRecord[]>;
  onSubmitAttendance: (classId: number, entries: KarateAttendanceEntry[]) => Promise<void>;
}

const STATUS_META: Record<AttendanceStatus, { icon: React.ReactNode; label: string; cls: string }> = {
  PRESENT: { icon: <CheckCircle className="w-4 h-4" />, label: "Present", cls: "text-emerald-600 bg-emerald-50 border-emerald-200" },
  LATE:    { icon: <Clock className="w-4 h-4" />,        label: "Late",    cls: "text-amber-600 bg-amber-50 border-amber-200" },
  EXCUSED: { icon: <AlertCircle className="w-4 h-4" />,  label: "Excused", cls: "text-blue-600 bg-blue-50 border-blue-200" },
  ABSENT:  { icon: <XCircle className="w-4 h-4" />,      label: "Absent",  cls: "text-red-500 bg-red-50 border-red-200" },
};

const STATUSES: AttendanceStatus[] = ["PRESENT", "LATE", "EXCUSED", "ABSENT"];

export function KarateAttendanceTab({ classes, onFetchAttendance, onSubmitAttendance }: Props) {
  const [selectedClass, setSelectedClass] = useState<KarateClass | null>(null);
  const [records, setRecords] = useState<KarateAttendanceRecord[]>([]);
  const [edits, setEdits] = useState<Record<number, AttendanceStatus>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!selectedClass) return;
    setLoading(true);
    onFetchAttendance(selectedClass.id)
      .then(data => {
        setRecords(data);
        const init: Record<number, AttendanceStatus> = {};
        data.forEach(r => { init[r.enrollmentId] = r.status; });
        setEdits(init);
      })
      .finally(() => setLoading(false));
  }, [selectedClass]);

  async function handleSubmit() {
    if (!selectedClass) return;
    setSaving(true);
    try {
      const entries: KarateAttendanceEntry[] = Object.entries(edits).map(([id, status]) => ({
        enrollmentId: +id, status,
      }));
      await onSubmitAttendance(selectedClass.id, entries);
      setSelectedClass(null);
    } finally {
      setSaving(false);
    }
  }

  const completedClasses = classes.filter(c => c.status === "COMPLETED" || c.status === "ONGOING");

  return (
    <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
      {/* Class list */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide px-1">Select Class</p>
        <div className="space-y-1 max-h-80 overflow-y-auto pr-1">
          {completedClasses.map(cls => (
            <button
              key={cls.id}
              onClick={() => setSelectedClass(cls)}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors border ${selectedClass?.id === cls.id ? "bg-indigo-50 border-indigo-200 text-indigo-800 font-medium" : "bg-white border-slate-100 text-slate-700 hover:border-indigo-100 hover:bg-slate-50"}`}
            >
              <p className="font-medium">{cls.scheduledDate}</p>
              <p className="text-xs text-slate-500 mt-0.5">{cls.startTime} – {cls.endTime}</p>
              <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full ${cls.status === "COMPLETED" ? "bg-slate-100 text-slate-600" : "bg-amber-100 text-amber-700"}`}>{cls.status}</span>
            </button>
          ))}
          {completedClasses.length === 0 && (
            <p className="text-xs text-slate-400 px-1">No completed or ongoing classes yet</p>
          )}
        </div>
      </div>

      {/* Attendance sheet */}
      <div>
        {!selectedClass && (
          <div className="flex items-center justify-center h-40 text-slate-400 text-sm rounded-xl border border-dashed border-slate-200">
            Select a class to mark attendance
          </div>
        )}
        {selectedClass && loading && (
          <div className="flex items-center justify-center h-40 text-slate-400 text-sm">Loading…</div>
        )}
        {selectedClass && !loading && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-700">
                {selectedClass.scheduledDate} — {selectedClass.startTime}
              </p>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white rounded-lg disabled:opacity-50"
                style={{ background: "linear-gradient(135deg,#4f46e5,#7c3aed)" }}
              >
                <Save className="w-3.5 h-3.5" />
                {saving ? "Saving…" : "Save Attendance"}
              </button>
            </div>
            <div className="space-y-2">
              {records.map(record => (
                <div key={record.enrollmentId} className="flex items-center justify-between bg-white rounded-xl border border-slate-100 px-4 py-3">
                  <span className="text-sm font-medium text-slate-800">{record.studentName}</span>
                  <div className="flex gap-1.5">
                    {STATUSES.map(s => {
                      const meta = STATUS_META[s];
                      const active = edits[record.enrollmentId] === s;
                      return (
                        <button
                          key={s}
                          onClick={() => setEdits(prev => ({ ...prev, [record.enrollmentId]: s }))}
                          title={meta.label}
                          className={`p-1.5 rounded-lg border text-xs transition-all ${active ? meta.cls + " font-semibold" : "text-slate-300 border-transparent hover:border-slate-200 hover:text-slate-500"}`}
                        >
                          {meta.icon}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
              {records.length === 0 && (
                <p className="text-sm text-slate-400 text-center py-6">No enrollments found for this class</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
