import { useState } from "react";
import { CheckCircle2, Circle, Clock, AlertTriangle, Plus, ChevronDown, ChevronRight, CalendarDays, Flag } from "lucide-react";

// TODO: wire to eventService
const milestones = [
  { id: 1, label: "Event Approved",        date: "Jul 1",  done: true  },
  { id: 2, label: "Budget Finalized",       date: "Jul 8",  done: true  },
  { id: 3, label: "Venue Booked",           date: "Jul 15", done: true  },
  { id: 4, label: "Sponsor Confirmed",      date: "Jul 28", done: true  },
  { id: 5, label: "Registration Open",      date: "Aug 1",  done: true  },
  { id: 6, label: "Volunteers Assigned",    date: "Aug 15", done: false },
  { id: 7, label: "Food Vendor Lock-in",    date: "Aug 20", done: false },
  { id: 8, label: "Dry Run",               date: "Aug 25", done: false },
  { id: 9, label: "Event Day",             date: "Aug 27", done: false },
  { id: 10, label: "Post-Event Report",    date: "Sep 3",  done: false },
];

// TODO: wire to eventService
const tasks = [
  { id: 1, title: "Confirm stage lighting vendor",        phase: "Logistics",     priority: "high",   assignee: "Ravi M.",  due: "Aug 12", done: false },
  { id: 2, title: "Publish final event schedule",         phase: "Communication", priority: "high",   assignee: "Priya S.", due: "Aug 14", done: false },
  { id: 3, title: "Order merchandise & goodie bags",      phase: "Logistics",     priority: "medium", assignee: "Karan T.", due: "Aug 16", done: false },
  { id: 4, title: "Prepare volunteer induction deck",     phase: "Volunteers",    priority: "medium", assignee: "Neha K.",  due: "Aug 18", done: false },
  { id: 5, title: "Finalize parking layout",              phase: "Venue",         priority: "low",    assignee: "Amit P.",  due: "Aug 20", done: false },
  { id: 6, title: "Confirm chief guest attendance",       phase: "Programs",      priority: "high",   assignee: "Ravi M.",  due: "Aug 10", done: true  },
  { id: 7, title: "Design event banner & standees",       phase: "Marketing",     priority: "medium", assignee: "Sara J.",  due: "Aug 8",  done: true  },
];

const phases = ["All", "Logistics", "Communication", "Volunteers", "Venue", "Programs", "Marketing"];

const priorityColor: Record<string, { bg: string; text: string }> = {
  high:   { bg: "bg-rose-50",    text: "text-rose-600"   },
  medium: { bg: "bg-amber-50",   text: "text-amber-600"  },
  low:    { bg: "bg-emerald-50", text: "text-emerald-600" },
};

export function EventsPlanning() {
  const [filter, setFilter] = useState("All");
  const [taskList, setTaskList] = useState(tasks);

  const filtered = filter === "All" ? taskList : taskList.filter(t => t.phase === filter);
  const toggle = (id: number) => setTaskList(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));

  return (
    <div className="space-y-6">

      {/* Timeline milestones */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-bold text-slate-800">Event Timeline</h2>
            <p className="text-xs text-slate-400 mt-0.5">Milestones for Ganesh Chaturthi 2026</p>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-indigo-50 text-indigo-600">
            {milestones.filter(m => m.done).length} / {milestones.length} complete
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-2 bg-slate-100 rounded-full mb-6 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-violet-500 animate-fade-in-up"
            style={{ width: `${(milestones.filter(m => m.done).length / milestones.length) * 100}%` }}
          />
        </div>

        {/* Scrollable milestone strip */}
        <div className="flex items-start gap-0 overflow-x-auto pb-2">
          {milestones.map((m, i) => (
            <div key={m.id} className="flex flex-col items-center flex-shrink-0" style={{ minWidth: 96 }}>
              <div className="flex items-center w-full">
                <div className="flex-1 h-0.5" style={{ background: i === 0 ? "transparent" : m.done ? "#4f46e5" : "#e2e8f0" }} />
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 z-10 flex-shrink-0
                  ${m.done ? "bg-indigo-600 border-indigo-600" : "bg-white border-slate-200"}`}>
                  {m.done
                    ? <CheckCircle2 className="w-4 h-4 text-white" />
                    : <Circle className="w-4 h-4 text-slate-300" />
                  }
                </div>
                <div className="flex-1 h-0.5" style={{ background: i === milestones.length - 1 ? "transparent" : m.done ? "#4f46e5" : "#e2e8f0" }} />
              </div>
              <p className="text-[10px] font-semibold text-center mt-1.5 leading-tight px-1"
                style={{ color: m.done ? "#4f46e5" : "#94a3b8" }}>
                {m.label}
              </p>
              <p className="text-[9px] text-slate-400 mt-0.5">{m.date}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Task management */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.05)] overflow-hidden">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-50 flex-wrap gap-3">
          <div>
            <h2 className="font-bold text-slate-800">Task Board</h2>
            <p className="text-xs text-slate-400 mt-0.5">{taskList.filter(t => !t.done).length} open · {taskList.filter(t => t.done).length} done</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {phases.map(p => (
              <button key={p} onClick={() => setFilter(p)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all
                  ${filter === p ? "bg-indigo-600 text-white shadow-sm" : "bg-slate-100 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600"}`}>
                {p}
              </button>
            ))}
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 text-white shadow-sm hover:bg-indigo-700 transition-all">
              <Plus className="w-3.5 h-3.5" /> Add Task
            </button>
          </div>
        </div>

        <div className="divide-y divide-slate-50">
          {filtered.map((task, i) => {
            const pc = priorityColor[task.priority];
            return (
              <div key={task.id}
                className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50/60 transition-colors animate-fade-in-up">
                <button onClick={() => toggle(task.id)} className="flex-shrink-0">
                  {task.done
                    ? <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    : <Circle className="w-5 h-5 text-slate-300 hover:text-indigo-400 transition-colors" />
                  }
                </button>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold ${task.done ? "line-through text-slate-400" : "text-slate-800"}`}>{task.title}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-slate-400">{task.phase}</span>
                    <span className="text-xs text-slate-400">· {task.assignee}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${pc.bg} ${pc.text}`}>{task.priority}</span>
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {task.due}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
