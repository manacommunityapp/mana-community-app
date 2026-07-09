import {
  Headphones, Plus, X, Loader2, MessageSquare, Clock, AlertCircle,
  ChevronDown, Send, Tag, User, Wrench, Zap, Car, Volume2, Sparkles,
  ArrowUpDown, CircleDot, ArrowUpRight
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { ticketService, type TicketResponse, type TicketRequest } from "../../../services/ticketService";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const statuses = ["All", "OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED", "REJECTED"];
const categories = ["GENERAL", "PLUMBING", "ELECTRICAL", "SECURITY", "PARKING", "NOISE", "CLEANLINESS", "ELEVATOR", "OTHER"];
const priorities = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  OPEN: { label: "Open", color: "text-blue-700", bg: "bg-blue-50 border-blue-200" },
  IN_PROGRESS: { label: "In Progress", color: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
  RESOLVED: { label: "Resolved", color: "text-green-700", bg: "bg-green-50 border-green-200" },
  CLOSED: { label: "Closed", color: "text-slate-600", bg: "bg-slate-50 border-slate-200" },
  REJECTED: { label: "Rejected", color: "text-red-700", bg: "bg-red-50 border-red-200" },
};

const categoryConfig: Record<string, { label: string; icon: React.ReactNode }> = {
  GENERAL: { label: "General", icon: <Tag className="w-3.5 h-3.5" /> },
  PLUMBING: { label: "Plumbing", icon: <Wrench className="w-3.5 h-3.5" /> },
  ELECTRICAL: { label: "Electrical", icon: <Zap className="w-3.5 h-3.5" /> },
  SECURITY: { label: "Security", icon: <AlertCircle className="w-3.5 h-3.5" /> },
  PARKING: { label: "Parking", icon: <Car className="w-3.5 h-3.5" /> },
  NOISE: { label: "Noise", icon: <Volume2 className="w-3.5 h-3.5" /> },
  CLEANLINESS: { label: "Cleanliness", icon: <Sparkles className="w-3.5 h-3.5" /> },
  ELEVATOR: { label: "Elevator", icon: <ArrowUpDown className="w-3.5 h-3.5" /> },
  OTHER: { label: "Other", icon: <CircleDot className="w-3.5 h-3.5" /> },
};

const priorityConfig: Record<string, { label: string; dot: string }> = {
  LOW: { label: "Low", dot: "bg-slate-400" },
  MEDIUM: { label: "Medium", dot: "bg-blue-500" },
  HIGH: { label: "High", dot: "bg-amber-500" },
  CRITICAL: { label: "Critical", dot: "bg-red-500" },
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export function Helpdesk() {
  const [tab, setTab] = useState<"all" | "open" | "mine">("all");
  const [statusFilter, setStatusFilter] = useState("All");
  const [tickets, setTickets] = useState<TicketResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<TicketResponse | null>(null);
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      let data: TicketResponse[];
      if (tab === "open") {
        data = await ticketService.getOpenTickets();
      } else if (tab === "mine") {
        data = await ticketService.getMyTickets();
      } else {
        data = await ticketService.getTickets(statusFilter !== "All" ? statusFilter : undefined);
      }
      setTickets(data);
    } catch {
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }, [tab, statusFilter]);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  const handleCreateTicket = async (data: TicketRequest) => {
    try {
      await ticketService.create(data);
      setShowCreate(false);
      fetchTickets();
    } catch { /* ignore */ }
  };

  const handleAddComment = async () => {
    if (!selectedTicket || !commentText.trim()) return;
    setSubmitting(true);
    try {
      const updated = await ticketService.addComment(selectedTicket.id, commentText.trim());
      setSelectedTicket(updated);
      setCommentText("");
      fetchTickets();
    } catch { /* ignore */ }
    finally { setSubmitting(false); }
  };

  const handleStatusChange = async (id: number, status: string) => {
    try {
      const updated = await ticketService.updateStatus(id, status);
      if (selectedTicket?.id === id) setSelectedTicket(updated);
      fetchTickets();
    } catch { /* ignore */ }
  };

  const openCount = tickets.filter(t => t.status === "OPEN").length;
  const inProgressCount = tickets.filter(t => t.status === "IN_PROGRESS").length;
  const resolvedCount = tickets.filter(t => t.status === "RESOLVED" || t.status === "CLOSED").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent flex items-center gap-2">
            <Headphones className="w-7 h-7 text-indigo-600" />
            Helpdesk
          </h1>
          <p className="text-sm text-slate-500 mt-1">Raise and track complaints & service requests</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-4 py-2.5 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all text-sm"
        >
          <Plus className="w-4 h-4" /> New Ticket
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Open", value: openCount, color: "from-blue-500 to-blue-600" },
          { label: "In Progress", value: inProgressCount, color: "from-amber-500 to-amber-600" },
          { label: "Resolved", value: resolvedCount, color: "from-green-500 to-green-600" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{s.label}</p>
            <p className={cn("text-2xl font-bold mt-1 bg-gradient-to-r bg-clip-text text-transparent", s.color)}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs + Filter */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
          {([["all", "All Tickets"], ["open", "Open"], ["mine", "My Tickets"]] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => { setTab(key); setStatusFilter("All"); }}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                tab === key ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
            >
              {label}
            </button>
          ))}
        </div>
        {tab === "all" && (
          <div className="relative">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="appearance-none bg-white border border-slate-200 rounded-lg px-3 py-2 pr-8 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              {statuses.map(s => (
                <option key={s} value={s}>{s === "All" ? "All Statuses" : statusConfig[s]?.label || s}</option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        )}
      </div>

      {/* Ticket List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        </div>
      ) : tickets.length === 0 ? (
        <div className="text-center py-20">
          <Headphones className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No tickets found</p>
          <p className="text-slate-400 text-sm mt-1">Create a new ticket to get started</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map(ticket => (
            <TicketCard
              key={ticket.id}
              ticket={ticket}
              onClick={() => setSelectedTicket(ticket)}
            />
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <CreateTicketModal
          onClose={() => setShowCreate(false)}
          onSubmit={handleCreateTicket}
        />
      )}

      {/* Detail Modal */}
      {selectedTicket && (
        <TicketDetailModal
          ticket={selectedTicket}
          commentText={commentText}
          submitting={submitting}
          onClose={() => { setSelectedTicket(null); setCommentText(""); }}
          onCommentChange={setCommentText}
          onAddComment={handleAddComment}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  );
}

function TicketCard({ ticket, onClick }: { ticket: TicketResponse; onClick: () => void }) {
  const status = statusConfig[ticket.status] || statusConfig.OPEN;
  const cat = categoryConfig[ticket.category] || categoryConfig.GENERAL;
  const pri = priorityConfig[ticket.priority] || priorityConfig.MEDIUM;

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all group"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono text-slate-400">{ticket.ticketNumber}</span>
            <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border", status.bg, status.color)}>
              {status.label}
            </span>
            <span className="flex items-center gap-1">
              <span className={cn("w-2 h-2 rounded-full", pri.dot)} />
              <span className="text-xs text-slate-500">{pri.label}</span>
            </span>
          </div>
          <h3 className="font-semibold text-slate-800 truncate group-hover:text-indigo-600 transition-colors">{ticket.subject}</h3>
          {ticket.description && (
            <p className="text-sm text-slate-500 mt-1 line-clamp-2">{ticket.description}</p>
          )}
          <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
            <span className="flex items-center gap-1">{cat.icon} {cat.label}</span>
            <span className="flex items-center gap-1"><User className="w-3 h-3" /> {ticket.raisedByName}</span>
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {timeAgo(ticket.createdAt)}</span>
            {ticket.comments.length > 0 && (
              <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" /> {ticket.comments.length}</span>
            )}
          </div>
        </div>
        <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-400 transition-colors flex-shrink-0 mt-1" />
      </div>
    </button>
  );
}

function TicketDetailModal({
  ticket, commentText, submitting, onClose, onCommentChange, onAddComment, onStatusChange
}: {
  ticket: TicketResponse;
  commentText: string;
  submitting: boolean;
  onClose: () => void;
  onCommentChange: (v: string) => void;
  onAddComment: () => void;
  onStatusChange: (id: number, status: string) => void;
}) {
  const status = statusConfig[ticket.status] || statusConfig.OPEN;
  const cat = categoryConfig[ticket.category] || categoryConfig.GENERAL;
  const pri = priorityConfig[ticket.priority] || priorityConfig.MEDIUM;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono text-slate-400">{ticket.ticketNumber}</span>
                <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border", status.bg, status.color)}>
                  {status.label}
                </span>
              </div>
              <h2 className="text-lg font-bold text-slate-800">{ticket.subject}</h2>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
            <span className="flex items-center gap-1">{cat.icon} {cat.label}</span>
            <span className="flex items-center gap-1">
              <span className={cn("w-2 h-2 rounded-full", pri.dot)} /> {pri.label}
            </span>
            <span>Raised by {ticket.raisedByName}</span>
            {ticket.assignedToName && <span>Assigned to {ticket.assignedToName}</span>}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {ticket.description && (
            <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-700">{ticket.description}</div>
          )}

          {ticket.adminRemarks && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm">
              <p className="font-medium text-amber-800 text-xs uppercase tracking-wide mb-1">Admin Remarks</p>
              <p className="text-amber-700">{ticket.adminRemarks}</p>
            </div>
          )}

          {/* Status Actions */}
          {ticket.status !== "CLOSED" && ticket.status !== "REJECTED" && (
            <div className="flex gap-2 flex-wrap">
              {ticket.status === "OPEN" && (
                <button onClick={() => onStatusChange(ticket.id, "IN_PROGRESS")}
                  className="px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-xs font-medium hover:bg-amber-100 transition-colors">
                  Mark In Progress
                </button>
              )}
              {(ticket.status === "OPEN" || ticket.status === "IN_PROGRESS") && (
                <button onClick={() => onStatusChange(ticket.id, "RESOLVED")}
                  className="px-3 py-1.5 bg-green-50 text-green-700 border border-green-200 rounded-lg text-xs font-medium hover:bg-green-100 transition-colors">
                  Mark Resolved
                </button>
              )}
              <button onClick={() => onStatusChange(ticket.id, "CLOSED")}
                className="px-3 py-1.5 bg-slate-50 text-slate-600 border border-slate-200 rounded-lg text-xs font-medium hover:bg-slate-100 transition-colors">
                Close
              </button>
            </div>
          )}

          {/* Comments */}
          <div>
            <h3 className="font-semibold text-sm text-slate-700 mb-3 flex items-center gap-1">
              <MessageSquare className="w-4 h-4" /> Comments ({ticket.comments.length})
            </h3>
            {ticket.comments.length === 0 ? (
              <p className="text-sm text-slate-400">No comments yet</p>
            ) : (
              <div className="space-y-3">
                {ticket.comments.map(c => (
                  <div key={c.id} className="bg-slate-50 rounded-xl p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-slate-600">{c.authorName}</span>
                      <span className="text-xs text-slate-400">{timeAgo(c.createdAt)}</span>
                    </div>
                    <p className="text-sm text-slate-700">{c.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Comment Input */}
        <div className="p-4 border-t border-slate-100">
          <div className="flex gap-2">
            <input
              value={commentText}
              onChange={e => onCommentChange(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && onAddComment()}
              placeholder="Add a comment..."
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            />
            <button
              onClick={onAddComment}
              disabled={!commentText.trim() || submitting}
              className="bg-indigo-600 text-white px-4 py-2.5 rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CreateTicketModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (data: TicketRequest) => void }) {
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("GENERAL");
  const [priority, setPriority] = useState("MEDIUM");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim()) return;
    onSubmit({ subject: subject.trim(), description: description.trim() || undefined, category, priority });
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800">Raise a Ticket</h2>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Subject *</label>
          <input
            value={subject}
            onChange={e => setSubject(e.target.value)}
            placeholder="Brief summary of the issue"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Description</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Provide details about the issue..."
            rows={3}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Category</label>
            <div className="relative">
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 pr-8 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              >
                {categories.map(c => (
                  <option key={c} value={c}>{categoryConfig[c]?.label || c}</option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Priority</label>
            <div className="relative">
              <select
                value={priority}
                onChange={e => setPriority(e.target.value)}
                className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 pr-8 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              >
                {priorities.map(p => (
                  <option key={p} value={p}>{priorityConfig[p]?.label || p}</option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl text-sm font-semibold shadow-lg hover:shadow-xl transition-all"
          >
            Submit Ticket
          </button>
        </div>
      </form>
    </div>
  );
}
