import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { hrmService } from "../../../services/hrm/hrmService";
import type { HrTask } from "../../../types/hrm";

interface Props {
  orgId: number;
  isHrAdmin?: boolean;
}

const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;
const STATUSES = ["OPEN", "IN_PROGRESS", "DONE"] as const;

const priorityColor: Record<string, string> = {
  LOW: "bg-gray-100 text-gray-600",
  MEDIUM: "bg-blue-100 text-blue-700",
  HIGH: "bg-orange-100 text-orange-700",
  URGENT: "bg-red-100 text-red-700",
};

const statusColor: Record<string, string> = {
  OPEN: "bg-yellow-100 text-yellow-700",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  DONE: "bg-green-100 text-green-700",
};

export default function TasksBoard({ orgId, isHrAdmin }: Props) {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", priority: "MEDIUM", assignedToEmployeeId: "", dueDate: "" });
  const [filterStatus, setFilterStatus] = useState<string>("ALL");

  const { data: myTasks } = useQuery({
    queryKey: ["my-tasks", orgId],
    queryFn: () => hrmService.getMyTasks(orgId),
    enabled: !!orgId,
  });

  const { data: allTasks } = useQuery({
    queryKey: ["all-tasks", orgId],
    queryFn: () => hrmService.getAllTasks(orgId),
    enabled: !!orgId && !!isHrAdmin,
  });

  const createTask = useMutation({
    mutationFn: () => hrmService.createTask(orgId, { title: form.title, description: form.description, priority: form.priority, dueDate: form.dueDate, assignedToId: +form.assignedToEmployeeId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-tasks"] });
      qc.invalidateQueries({ queryKey: ["all-tasks"] });
      setShowForm(false);
      setForm({ title: "", description: "", priority: "MEDIUM", assignedToEmployeeId: "", dueDate: "" });
    },
  });

  const updateStatus = useMutation({
    mutationFn: ({ taskId, status }: { taskId: number; status: string }) => hrmService.updateTaskStatus(orgId, taskId, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-tasks"] });
      qc.invalidateQueries({ queryKey: ["all-tasks"] });
    },
  });

  const displayTasks = isHrAdmin ? (allTasks?.content ?? []) : (myTasks?.content ?? []);
  const filtered = filterStatus === "ALL" ? displayTasks : displayTasks.filter(t => t.status === filterStatus);

  const renderTask = (task: HrTask) => (
    <div key={task.id} className="border rounded-lg p-4 space-y-2">
      <div className="flex justify-between items-start gap-2">
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm truncate">{task.title}</div>
          {task.description && <div className="text-xs text-gray-500 mt-1 line-clamp-2">{task.description}</div>}
        </div>
        <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${priorityColor[task.priority]}`}>{task.priority}</span>
      </div>
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2 py-1 rounded-full ${statusColor[task.status]}`}>{task.status}</span>
          {task.dueDate && <span className="text-xs text-gray-400">Due {task.dueDate}</span>}
        </div>
        {task.status !== "DONE" && (
          <select
            value={task.status}
            onChange={e => updateStatus.mutate({ taskId: task.id, status: e.target.value })}
            className="text-xs border rounded px-2 py-1"
          >
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        )}
      </div>
      {isHrAdmin && task.assignedTo && (
        <div className="text-xs text-gray-400">Assigned to: {task.assignedTo.firstName} {task.assignedTo.lastName}</div>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <div className="flex gap-2">
          {["ALL", ...STATUSES].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`text-xs px-3 py-1 rounded-full border ${filterStatus === s ? "bg-blue-600 text-white border-blue-600" : "text-gray-600"}`}>
              {s}
            </button>
          ))}
        </div>
        {isHrAdmin && (
          <button onClick={() => setShowForm(true)} className="bg-blue-600 text-white px-4 py-2 rounded text-sm">+ New Task</button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.length === 0 ? (
          <p className="text-gray-400 text-sm col-span-3">No tasks found.</p>
        ) : filtered.map(renderTask)}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6 space-y-4">
            <div className="flex justify-between">
              <h3 className="font-semibold">Create Task</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400">×</button>
            </div>
            <input placeholder="Task Title *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="w-full border rounded px-3 py-2 text-sm" />
            <textarea placeholder="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="w-full border rounded px-3 py-2 text-sm h-20" />
            <input type="number" placeholder="Assign to Employee ID *" value={form.assignedToEmployeeId} onChange={e => setForm(f => ({ ...f, assignedToEmployeeId: e.target.value }))} className="w-full border rounded px-3 py-2 text-sm" />
            <div className="grid grid-cols-2 gap-2">
              <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))} className="border rounded px-3 py-2 text-sm">
                {PRIORITIES.map(p => <option key={p}>{p}</option>)}
              </select>
              <input type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} className="border rounded px-3 py-2 text-sm" />
            </div>
            <button onClick={() => createTask.mutate()} disabled={createTask.isPending || !form.title || !form.assignedToEmployeeId} className="w-full bg-blue-600 text-white py-2 rounded text-sm disabled:opacity-50">Create Task</button>
          </div>
        </div>
      )}
    </div>
  );
}
