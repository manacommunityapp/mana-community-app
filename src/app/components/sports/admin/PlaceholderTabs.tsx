import { CalendarIcon, Edit2, Trophy } from "lucide-react";
import { Link } from "react-router";
import { showSuccess, showInfo } from "../../../../utils/ToastUtils";

const toast = {
  success: (msg: string) => showSuccess(msg),
  info: (msg: string) => showInfo(msg),
};

export function ScheduleTab() {
  return (
    <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm text-center max-w-xl mx-auto my-8 space-y-5 animate-fade-in-up">
      <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
        <CalendarIcon className="w-8 h-8" />
      </div>
      <div>
        <h3 className="text-lg font-bold text-slate-800">Schedule Management</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
          Match fixtures, live scoring, and scheduling controls have been centralized into the dedicated Sports Schedule panel.
        </p>
      </div>
      <div className="pt-2">
        <Link
          to="/sports/schedule"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-100 transition-all duration-150 cursor-pointer"
        >
          Open Sports Schedule
        </Link>
      </div>
    </div>
  );
}

export function ResultsTab() {
  return (
    <div className="rounded-2xl p-5 text-left"
      style={{ background: "white", border: "1px solid rgba(99,102,241,0.12)", boxShadow: "0 2px 12px rgba(99,102,241,0.06)" }}>
      <h3 className="font-semibold mb-4" style={{ color: "#0d0d2b" }}>Enter Match Results</h3>
      <div className="space-y-3">
        {[
          { id: 1, sport: "Basketball", home: "City Hoopers", away: "Fastbreakers", date: "Jun 14 · 6PM", venue: "Main Gym" },
          { id: 2, sport: "Soccer", home: "Galacticos", away: "Athletic Club", date: "Jun 15 · 5PM", venue: "Turf Field A" },
        ].map((game) => (
          <div key={game.id} className="rounded-xl p-4 text-left"
            style={{ background: "rgba(99,102,241,0.03)", border: "1px solid rgba(99,102,241,0.08)" }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium" style={{ color: "#4f46e5" }}>{game.sport} · {game.date}</span>
              <span className="text-xs" style={{ color: "#6b7094" }}>{game.venue}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex-1 text-right text-sm font-semibold truncate" style={{ color: "#0d0d2b" }}>{game.home}</span>
              <div className="flex items-center gap-2">
                <input type="number" placeholder="0" min="0"
                  className="w-12 text-center rounded-lg py-1.5 text-sm font-bold outline-none"
                  style={{ border: "2px solid rgba(99,102,241,0.2)", color: "#0d0d2b", background: "white" }}
                  onFocus={e => (e.currentTarget.style.borderColor = "#6366f1")}
                  onBlur={e => (e.currentTarget.style.borderColor = "rgba(99,102,241,0.2)")} />
                <span className="text-sm font-bold" style={{ color: "#6b7094" }}>–</span>
                <input type="number" placeholder="0" min="0"
                  className="w-12 text-center rounded-lg py-1.5 text-sm font-bold outline-none"
                  style={{ border: "2px solid rgba(99,102,241,0.2)", color: "#0d0d2b", background: "white" }}
                  onFocus={e => (e.currentTarget.style.borderColor = "#6366f1")}
                  onBlur={e => (e.currentTarget.style.borderColor = "rgba(99,102,241,0.2)")} />
              </div>
              <span className="flex-1 text-sm font-semibold truncate" style={{ color: "#0d0d2b" }}>{game.away}</span>
              <button className="px-3 py-1.5 rounded-lg text-xs font-medium text-white flex-shrink-0 cursor-pointer"
                style={{ background: "#10b981" }}
                onClick={() => toast.success("Match results saved successfully!")}>
                Save
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SettingsTab() {
  return (
    <div className="rounded-2xl p-5 text-left"
      style={{ background: "white", border: "1px solid rgba(99,102,241,0.12)", boxShadow: "0 2px 12px rgba(99,102,241,0.06)" }}>
      <h3 className="font-semibold mb-4" style={{ color: "#0d0d2b" }}>League Settings</h3>
      <div className="space-y-4">
        {[
          { label: "Season Name", value: "Summer 2026" },
          { label: "Registration Deadline", value: "July 1, 2026" },
          { label: "Season Start Date", value: "July 15, 2026" },
          { label: "Max Teams per Sport", value: "16" },
        ].map((s) => (
          <div key={s.label} className="flex items-center justify-between py-3 text-left"
            style={{ borderBottom: "1px solid rgba(99,102,241,0.06)" }}>
            <div>
              <p className="text-sm font-medium" style={{ color: "#0d0d2b" }}>{s.label}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm" style={{ color: "#6b7094" }}>{s.value}</span>
              <button className="p-1.5 rounded-lg cursor-pointer" style={{ color: "#4f46e5" }}
                onClick={() => toast.info(`Editing ${s.label}`)}>
                <Edit2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
