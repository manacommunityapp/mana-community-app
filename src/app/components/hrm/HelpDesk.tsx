import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { hrmService } from "../../../services/hrm/hrmService";

interface Props {
  orgId: number;
  isHrAdmin?: boolean;
}

const CATEGORIES = ["PAYROLL", "LEAVE", "IT", "ATTENDANCE", "GENERAL"] as const;
const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;

const statusColor: Record<string, string> = {
  OPEN: "bg-yellow-100 text-yellow-700",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  RESOLVED: "bg-green-100 text-green-700",
  CLOSED: "bg-gray-100 text-gray-500",
};

export default function HelpDesk({ orgId, isHrAdmin }: Props) {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<"my-tickets" | "open">("my-tickets");
  const [showForm, setShowForm] = useState(false);
  const [showResolve, setShowResolve] = useState<number | null>(null);
  const [resolution, setResolution] = useState("");
  const [form, setForm] = useState({ subject: "", description: "", category: "GENERAL", priority: "MEDIUM" });

  const { data: myTickets } = useQuery({
    queryKey: ["my-tickets", orgId],
    queryFn: () => hrmService.getMyTickets(orgId),
    enabled: !!orgId,
  });

  const { data: openTickets } = useQuery({
    queryKey: ["open-tickets", orgId],
    queryFn: () => hrmService.getOpenTickets(orgId),
    enabled: !!orgId && !!isHrAdmin,
  });

  const createTicket = useMutation({
    mutationFn: () => hrmService.createTicket(orgId, form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-tickets"] });
      setShowForm(false);
      setForm({ subject: "", description: "", category: "GENERAL", priority: "MEDIUM" });
    },
  });

  const resolveTicket = useMutation({
    mutationFn: (ticketId: number) => hrmService.resolveTicket(orgId, ticketId, resolution),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["open-tickets"] });
      qc.invalidateQueries({ queryKey: ["my-tickets"] });
      setShowResolve(null);
      setResolution("");
    },
  });

  const assignTicket = useMutation({
    mutationFn: ({ ticketId, employeeId }: { ticketId: number; employeeId: number }) =>
      hrmService.assignTicket(orgId, ticketId, employeeId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["open-tickets"] }),
  });

  const categoryColor: Record<string, string> = {
    PAYROLL: "bg-green-50 text-green-700",
    LEAVE: "bg-purple-50 text-purple-700",
    IT: "bg-blue-50 text-blue-700",
    ATTENDANCE: "bg-orange-50 text-orange-700",
    GENERAL: "bg-gray-50 text-gray-700",
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 border-b pb-2">
        <button onClick={() => setActiveTab("my-tickets")}
          className={`px-4 py-2 rounded-t text-sm font-medium ${activeTab === "my-tickets" ? "bg-white border border-b-white text-blue-600" : "text-gray-500"}`}>
          My Tickets
        </button>
        {isHrAdmin && (
          <button onClick={() => setActiveTab("open")}
            className={`px-4 py-2 rounded-t text-sm font-medium ${activeTab === "open" ? "bg-white border border-b-white text-blue-600" : "text-gray-500"}`}>
            All Open Tickets
          </button>
        )}
      </div>

      {activeTab === "my-tickets" && (
        <div className="space-y-3">
          <button onClick={() => setShowForm(true)} className="bg-blue-600 text-white px-4 py-2 rounded text-sm">+ Raise Ticket</button>
          {myTickets?.content.length === 0 ? (
            <p className="text-gray-400 text-sm">No tickets yet.</p>
          ) : myTickets?.content.map(ticket => (
            <div key={ticket.id} className="border rounded-lg p-4 space-y-2">
              <div className="flex justify-between items-start gap-2">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs text-gray-400">{ticket.ticketNumber}</span>
                    <span className={`text-xs px-2 py-0.5 rounded ${categoryColor[ticket.category]}`}>{ticket.category}</span>
                  </div>
                  <div className="font-medium text-sm mt-1">{ticket.subject}</div>
                  <div className="text-xs text-gray-500 mt-1 line-clamp-2">{ticket.description}</div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${statusColor[ticket.status]}`}>{ticket.status}</span>
              </div>
              {ticket.resolution && (
                <div className="bg-green-50 rounded p-2 text-xs text-green-700">
                  <span className="font-medium">Resolution: </span>{ticket.resolution}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {activeTab === "open" && isHrAdmin && (
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-700">Open & In-Progress Tickets</h3>
          {openTickets?.content.length === 0 ? (
            <p className="text-gray-400 text-sm">No open tickets.</p>
          ) : openTickets?.content.map(ticket => (
            <div key={ticket.id} className="border rounded-lg p-4 space-y-2">
              <div className="flex justify-between items-start gap-2">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs text-gray-400">{ticket.ticketNumber}</span>
                    <span className={`text-xs px-2 py-0.5 rounded ${categoryColor[ticket.category]}`}>{ticket.category}</span>
                    <span className="text-xs text-gray-500">{ticket.employee?.firstName} {ticket.employee?.lastName}</span>
                  </div>
                  <div className="font-medium text-sm mt-1">{ticket.subject}</div>
                  <div className="text-xs text-gray-500 mt-1">{ticket.description}</div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${statusColor[ticket.status]}`}>{ticket.status}</span>
              </div>
              <div className="flex gap-2 flex-wrap">
                <button onClick={() => setShowResolve(ticket.id)} className="bg-green-500 text-white px-3 py-1 rounded text-xs">Resolve</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Ticket Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6 space-y-4">
            <div className="flex justify-between">
              <h3 className="font-semibold">Raise Support Ticket</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400">×</button>
            </div>
            <input placeholder="Subject *" value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} className="w-full border rounded px-3 py-2 text-sm" />
            <textarea placeholder="Describe your issue *" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="w-full border rounded px-3 py-2 text-sm h-24" />
            <div className="grid grid-cols-2 gap-2">
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="border rounded px-3 py-2 text-sm">
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
              <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))} className="border rounded px-3 py-2 text-sm">
                {PRIORITIES.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <button onClick={() => createTicket.mutate()} disabled={createTicket.isPending || !form.subject || !form.description} className="w-full bg-blue-600 text-white py-2 rounded text-sm disabled:opacity-50">Submit Ticket</button>
          </div>
        </div>
      )}

      {/* Resolve Modal */}
      {showResolve !== null && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-sm p-6 space-y-4">
            <div className="flex justify-between">
              <h3 className="font-semibold">Resolve Ticket</h3>
              <button onClick={() => setShowResolve(null)} className="text-gray-400">×</button>
            </div>
            <textarea placeholder="Resolution notes *" value={resolution} onChange={e => setResolution(e.target.value)} className="w-full border rounded px-3 py-2 text-sm h-24" />
            <button onClick={() => resolveTicket.mutate(showResolve)} disabled={resolveTicket.isPending || !resolution} className="w-full bg-green-500 text-white py-2 rounded text-sm disabled:opacity-50">Mark Resolved</button>
          </div>
        </div>
      )}
    </div>
  );
}
