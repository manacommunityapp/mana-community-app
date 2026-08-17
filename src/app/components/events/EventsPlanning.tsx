import { useState, useEffect } from "react";
import { CheckCircle2, Circle, Clock, AlertTriangle, Plus, ChevronDown, ChevronRight, CalendarDays, Flag, X, Loader2, AlertCircle, Pencil, Trash2 } from "lucide-react";
import { useEventMock } from "./EventMockToggle";
import { ErrorBanner, LoadingSpinner } from "./shared";
import { eventTaskService, type EventTaskResponse } from "../../../services/events/eventTaskService";
import { eventService, type EventResponse } from "../../../services/events/eventService";

// Mock data — shown when toggle is "Mock Data"; live API used otherwise
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

// Mock data — shown when toggle is "Mock Data"; live API used otherwise
const mockTasks: TaskItem[] = [
  { id: 1, title: "Confirm stage lighting vendor",        description: "Need to finalize LED wall and spotlight arrangement",  phase: "Logistics",     priority: "high",   assignee: "Ravi M.",  due: "Aug 12", done: false },
  { id: 2, title: "Publish final event schedule",         description: "Upload to website and share on WhatsApp groups",       phase: "Communication", priority: "high",   assignee: "Priya S.", due: "Aug 14", done: false },
  { id: 3, title: "Order merchandise & goodie bags",      description: "",                                                     phase: "Logistics",     priority: "medium", assignee: "Karan T.", due: "Aug 16", done: false },
  { id: 4, title: "Prepare volunteer induction deck",     description: "Include roles, shifts, and emergency contacts",        phase: "Volunteers",    priority: "medium", assignee: "Neha K.",  due: "Aug 18", done: false },
  { id: 5, title: "Finalize parking layout",              description: "",                                                     phase: "Venue",         priority: "low",    assignee: "Amit P.",  due: "Aug 20", done: false },
  { id: 6, title: "Confirm chief guest attendance",       description: "Dr. Arun Kumar confirmed via email",                   phase: "Programs",      priority: "high",   assignee: "Ravi M.",  due: "Aug 10", done: true  },
  { id: 7, title: "Design event banner & standees",       description: "",                                                     phase: "Marketing",     priority: "medium", assignee: "Sara J.",  due: "Aug 8",  done: true  },
];

const phases = ["All", "Logistics", "Communication", "Volunteers", "Venue", "Programs", "Marketing"];

const priorityColor: Record<string, { bg: string; text: string }> = {
  high:   { bg: "bg-rose-50",    text: "text-rose-600"   },
  medium: { bg: "bg-amber-50",   text: "text-amber-600"  },
  low:    { bg: "bg-emerald-50", text: "text-emerald-600" },
};

type TaskItem = { id: number; title: string; description?: string; phase: string; priority: string; assignee: string; due: string; done: boolean };

function mapLiveTasks(tasks: EventTaskResponse[]): TaskItem[] {
  return tasks.map(t => ({
    id: t.id,
    title: t.title,
    description: t.description ?? "",
    phase: t.phase ?? "General",
    priority: (t.priority ?? "MEDIUM").toLowerCase(),
    assignee: t.assigneeName ?? "Unassigned",
    due: t.dueDate ? new Date(t.dueDate).toLocaleDateString("en-IN", { month: "short", day: "numeric" }) : "",
    done: t.done,
  }));
}

const emptyTaskForm = { eventId: "", title: "", description: "", phase: "General", priority: "MEDIUM", assigneeName: "", dueDate: "" };

export function EventsPlanning() {
  const { useMock } = useEventMock();
  const [filter, setFilter] = useState("All");
  const [mockTaskList, setMockTaskList] = useState(mockTasks);
  const [liveTasks, setLiveTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [events, setEvents] = useState<EventResponse[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [taskForm, setTaskForm] = useState(emptyTaskForm);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);

  useEffect(() => {
    eventService.getAll().then(setEvents).catch(() => {});
  }, []);

  useEffect(() => {
    if (useMock) return;
    setLoading(true);
    setError("");
    eventTaskService.getAll()
      .then(data => setLiveTasks(mapLiveTasks(data)))
      .catch(e => setError(e.message ?? "Failed to load tasks"))
      .finally(() => setLoading(false));
  }, [useMock]);

  const taskList = useMock ? mockTaskList : liveTasks;
  const filtered = filter === "All" ? taskList : taskList.filter(t => t.phase === filter);

  const toggle = (id: number) => {
    if (useMock) {
      setMockTaskList(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
    } else {
      eventTaskService.toggleDone(id)
        .then(updated => setLiveTasks(prev => prev.map(t => t.id === id ? { ...t, done: updated.done } : t)))
        .catch(() => {});
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskForm.title.trim()) { setFormError("Title is required"); return; }
    if (useMock) {
      const newTask: TaskItem = {
        id: Date.now(),
        title: taskForm.title,
        description: taskForm.description || "",
        phase: taskForm.phase || "General",
        priority: taskForm.priority.toLowerCase(),
        assignee: taskForm.assigneeName || "Unassigned",
        due: taskForm.dueDate ? new Date(taskForm.dueDate).toLocaleDateString("en-IN", { month: "short", day: "numeric" }) : "",
        done: false,
      };
      setMockTaskList(prev => [newTask, ...prev]);
      setShowAddForm(false);
      setTaskForm(emptyTaskForm);
      return;
    }
    if (!taskForm.eventId) { setFormError("Please select an event"); return; }
    setSaving(true);
    setFormError("");
    try {
      const resp = await eventTaskService.create({
        eventId: Number(taskForm.eventId),
        title: taskForm.title,
        description: taskForm.description || undefined,
        phase: taskForm.phase || undefined,
        priority: taskForm.priority || undefined,
        assigneeName: taskForm.assigneeName || undefined,
        dueDate: taskForm.dueDate || undefined,
      });
      setLiveTasks(prev => [mapLiveTasks([resp])[0], ...prev]);
      setShowAddForm(false);
      setTaskForm(emptyTaskForm);
    } catch (err: any) {
      setFormError(err?.response?.data?.message || err?.message || "Failed to create task");
    } finally {
      setSaving(false);
    }
  };

  const openEditTask = (task: TaskItem) => {
    setEditingTaskId(task.id);
    setTaskForm({
      eventId: "",
      title: task.title,
      description: task.description || "",
      phase: task.phase,
      priority: task.priority.toUpperCase(),
      assigneeName: task.assignee === "Unassigned" ? "" : task.assignee,
      dueDate: "",
    });
    setFormError("");
    setShowAddForm(true);
  };

  const handleEditTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTaskId) return;
    if (!taskForm.title.trim()) { setFormError("Title is required"); return; }
    if (useMock) {
      setMockTaskList(prev => prev.map(t => t.id === editingTaskId ? {
        ...t,
        title: taskForm.title,
        description: taskForm.description || "",
        phase: taskForm.phase || "General",
        priority: taskForm.priority.toLowerCase(),
        assignee: taskForm.assigneeName || "Unassigned",
        due: taskForm.dueDate ? new Date(taskForm.dueDate).toLocaleDateString("en-IN", { month: "short", day: "numeric" }) : t.due,
      } : t));
      setShowAddForm(false);
      setEditingTaskId(null);
      setTaskForm(emptyTaskForm);
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      const resp = await eventTaskService.update(editingTaskId, {
        eventId: taskForm.eventId ? Number(taskForm.eventId) : 0,
        title: taskForm.title,
        description: taskForm.description || undefined,
        phase: taskForm.phase || undefined,
        priority: taskForm.priority || undefined,
        assigneeName: taskForm.assigneeName || undefined,
        dueDate: taskForm.dueDate || undefined,
      });
      setLiveTasks(prev => prev.map(t => t.id === editingTaskId ? mapLiveTasks([resp])[0] : t));
      setShowAddForm(false);
      setEditingTaskId(null);
      setTaskForm(emptyTaskForm);
    } catch (err: any) {
      setFormError(err?.response?.data?.message || err?.message || "Failed to update task");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTask = async (task: TaskItem) => {
    if (useMock) {
      setMockTaskList(prev => prev.filter(t => t.id !== task.id));
      return;
    }
    try {
      await eventTaskService.deleteTask(task.id);
      setLiveTasks(prev => prev.filter(t => t.id !== task.id));
    } catch (err: any) {
      setError(err?.message || "Failed to delete task");
    }
  };

  return (
    <div className="space-y-3 sm:space-y-6">

      {error && <ErrorBanner message={error} />}
      {loading && <LoadingSpinner label="Loading tasks…" />}

      {/* Timeline milestones */}
      <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-6 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
        <div className="flex items-center justify-between mb-3 sm:mb-6 gap-2">
          <div>
            <h2 className="font-bold text-slate-800 text-sm sm:text-base">Event Timeline</h2>
            <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5">Milestones for Ganesh Chaturthi 2026</p>
          </div>
          <span className="text-[10px] sm:text-xs font-bold px-2 sm:px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 flex-shrink-0">
            {milestones.filter(m => m.done).length} / {milestones.length} complete
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-2 bg-slate-100 rounded-full mb-4 sm:mb-6 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-violet-500 animate-fade-in-up"
            style={{ width: `${(milestones.filter(m => m.done).length / milestones.length) * 100}%` }}
          />
        </div>

        {/* Scrollable milestone strip */}
        <div className="flex items-start gap-0 overflow-x-auto pb-2 hide-scrollbar">
          {milestones.map((m, i) => (
            <div key={m.id} className="flex flex-col items-center flex-shrink-0" style={{ minWidth: 80 }}>
              <div className="flex items-center w-full">
                <div className="flex-1 h-0.5" style={{ background: i === 0 ? "transparent" : m.done ? "#4f46e5" : "#e2e8f0" }} />
                <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center border-2 z-10 flex-shrink-0
                  ${m.done ? "bg-indigo-600 border-indigo-600" : "bg-white border-slate-200"}`}>
                  {m.done
                    ? <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                    : <Circle className="w-3 h-3 sm:w-4 sm:h-4 text-slate-300" />
                  }
                </div>
                <div className="flex-1 h-0.5" style={{ background: i === milestones.length - 1 ? "transparent" : m.done ? "#4f46e5" : "#e2e8f0" }} />
              </div>
              <p className="text-[8px] sm:text-[10px] font-semibold text-center mt-1.5 leading-tight px-1"
                style={{ color: m.done ? "#4f46e5" : "#94a3b8" }}>
                {m.label}
              </p>
              <p className="text-[9px] text-slate-400 mt-0.5">{m.date}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Task management */}
      <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.05)] overflow-hidden">
        <div className="flex items-center justify-between px-3 sm:px-6 pt-3 sm:pt-6 pb-2.5 sm:pb-4 border-b border-slate-50 flex-wrap gap-1.5 sm:gap-3">
          <div>
            <h2 className="font-bold text-slate-800 text-sm sm:text-base">Task Board</h2>
            <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5">{taskList.filter(t => !t.done).length} open · {taskList.filter(t => t.done).length} done</p>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto hide-scrollbar flex-wrap">
            {phases.map(p => (
              <button key={p} onClick={() => setFilter(p)}
                className={`px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-semibold transition-all whitespace-nowrap
                  ${filter === p ? "bg-indigo-600 text-white shadow-sm" : "bg-slate-100 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600"}`}>
                {p}
              </button>
            ))}
            <button
              onClick={() => { setTaskForm(emptyTaskForm); setFormError(""); setShowAddForm(true); }}
              className="flex items-center gap-1.5 px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-semibold bg-indigo-600 text-white shadow-sm hover:bg-indigo-700 transition-all whitespace-nowrap">
              <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> Add Task
            </button>
          </div>
        </div>

        <div className="divide-y divide-slate-50">
          {filtered.map((task, i) => {
            const pc = priorityColor[task.priority] || priorityColor.medium;
            return (
              <div key={task.id}
                className="flex items-start sm:items-center gap-2 sm:gap-4 px-3 sm:px-6 py-2 sm:py-4 hover:bg-slate-50/60 transition-colors animate-fade-in-up">
                <button onClick={() => toggle(task.id)} className="flex-shrink-0 mt-0.5 sm:mt-0">
                  {task.done
                    ? <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500" />
                    : <Circle className="w-4 h-4 sm:w-5 sm:h-5 text-slate-300 hover:text-indigo-400 transition-colors" />
                  }
                </button>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs sm:text-sm font-semibold ${task.done ? "line-through text-slate-400" : "text-slate-800"}`}>{task.title}</p>
                  {task.description && (
                    <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5 line-clamp-1">{task.description}</p>
                  )}
                  <div className="flex items-center gap-2 sm:gap-3 mt-1 flex-wrap">
                    <span className="text-[10px] sm:text-xs text-slate-400">{task.phase}</span>
                    <span className="text-[10px] sm:text-xs text-slate-400">· {task.assignee}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full sm:hidden ${pc.bg} ${pc.text}`}>{task.priority}</span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1 sm:hidden">
                      <Clock className="w-3 h-3" /> {task.due}
                    </span>
                  </div>
                </div>
                <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${pc.bg} ${pc.text}`}>{task.priority}</span>
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {task.due}
                  </span>
                  <button onClick={() => openEditTask(task)}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition">
                    <Pencil className="w-3 h-3" />
                  </button>
                  <button onClick={() => handleDeleteTask(task)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add/Edit Task Modal */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800">{editingTaskId ? "Edit Task" : "Add New Task"}</h3>
              <button onClick={() => { setShowAddForm(false); setEditingTaskId(null); }} className="text-slate-400 hover:text-slate-600 text-xl leading-none">&times;</button>
            </div>
            <form onSubmit={editingTaskId ? handleEditTask : handleAddTask} className="px-6 py-5 space-y-4">
              {formError && (
                <div className="flex items-center gap-2 px-3 py-2 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" /> {formError}
                </div>
              )}
              {!useMock && (
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-slate-600">Event *</span>
                  <select value={taskForm.eventId} onChange={e => setTaskForm(f => ({ ...f, eventId: e.target.value }))}
                    className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white" required>
                    <option value="">Select event</option>
                    {events.map(ev => <option key={ev.id} value={String(ev.id)}>{ev.title}</option>)}
                  </select>
                </label>
              )}
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-slate-600">Title *</span>
                <input type="text" value={taskForm.title} onChange={e => setTaskForm(f => ({ ...f, title: e.target.value }))}
                  className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  placeholder="Task title" required />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-slate-600">Description</span>
                <textarea value={taskForm.description} onChange={e => setTaskForm(f => ({ ...f, description: e.target.value }))}
                  className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" rows={2}
                  placeholder="Optional description" />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-slate-600">Phase</span>
                  <select value={taskForm.phase} onChange={e => setTaskForm(f => ({ ...f, phase: e.target.value }))}
                    className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white">
                    {phases.filter(p => p !== "All").map(p => <option key={p} value={p}>{p}</option>)}
                    <option value="General">General</option>
                  </select>
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-slate-600">Priority</span>
                  <select value={taskForm.priority} onChange={e => setTaskForm(f => ({ ...f, priority: e.target.value }))}
                    className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white">
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                  </select>
                </label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-slate-600">Assignee</span>
                  <input type="text" value={taskForm.assigneeName} onChange={e => setTaskForm(f => ({ ...f, assigneeName: e.target.value }))}
                    className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    placeholder="Assignee name" />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-slate-600">Due Date</span>
                  <input type="date" value={taskForm.dueDate} onChange={e => setTaskForm(f => ({ ...f, dueDate: e.target.value }))}
                    className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                </label>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => { setShowAddForm(false); setEditingTaskId(null); }}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors">Cancel</button>
                <button type="submit" disabled={saving}
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center gap-2">
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />} {editingTaskId ? "Save Changes" : "Add Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
