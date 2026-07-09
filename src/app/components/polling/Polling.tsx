import {
  BarChart3, Plus, X, Loader2, Check, Trash2, Clock, Users,
  ChevronDown, CircleDot, Minus
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { pollService, type PollResponse, type PollRequest } from "../../../services/pollService";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

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

export function Polling() {
  const [tab, setTab] = useState<"active" | "all" | "mine">("active");
  const [polls, setPolls] = useState<PollResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const fetchPolls = useCallback(async () => {
    setLoading(true);
    try {
      let data: PollResponse[];
      if (tab === "mine") data = await pollService.getMyPolls();
      else if (tab === "all") data = await pollService.getAllPolls();
      else data = await pollService.getActivePolls();
      setPolls(data);
    } catch {
      setPolls([]);
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => { fetchPolls(); }, [fetchPolls]);

  const handleVote = async (pollId: number, optionIds: number[]) => {
    try {
      await pollService.vote(pollId, optionIds);
      fetchPolls();
    } catch { /* ignore */ }
  };

  const handleDelete = async (id: number) => {
    try {
      await pollService.deletePoll(id);
      fetchPolls();
    } catch { /* ignore */ }
  };

  const handleCreate = async (data: PollRequest) => {
    try {
      await pollService.create(data);
      setShowCreate(false);
      fetchPolls();
    } catch { /* ignore */ }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-indigo-600" />
            Polls & Voting
          </h1>
          <p className="text-sm text-slate-500 mt-1">Community decisions, made together</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-4 py-2.5 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all text-sm"
        >
          <Plus className="w-4 h-4" /> Create Poll
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
        {([["active", "Active"], ["all", "All Polls"], ["mine", "My Polls"]] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all",
              tab === key ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Poll List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        </div>
      ) : polls.length === 0 ? (
        <div className="text-center py-20">
          <BarChart3 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No polls found</p>
          <p className="text-slate-400 text-sm mt-1">Create a poll to gather community opinions</p>
        </div>
      ) : (
        <div className="space-y-4">
          {polls.map(poll => (
            <PollCard
              key={poll.id}
              poll={poll}
              onVote={handleVote}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <CreatePollModal onClose={() => setShowCreate(false)} onSubmit={handleCreate} />
      )}
    </div>
  );
}

function PollCard({ poll, onVote, onDelete }: {
  poll: PollResponse;
  onVote: (pollId: number, optionIds: number[]) => void;
  onDelete: (id: number) => void;
}) {
  const [selected, setSelected] = useState<Set<number>>(() => {
    const sel = new Set<number>();
    poll.options.filter(o => o.selected).forEach(o => sel.add(o.id));
    return sel;
  });

  const showResults = poll.hasVoted || poll.closed;
  const maxVotes = Math.max(...poll.options.map(o => o.voteCount), 1);

  const toggleOption = (optionId: number) => {
    if (showResults || poll.closed) return;
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(optionId)) {
        next.delete(optionId);
      } else {
        if (!poll.allowMultiple) next.clear();
        next.add(optionId);
      }
      return next;
    });
  };

  const submitVote = () => {
    if (selected.size === 0) return;
    onVote(poll.id, Array.from(selected));
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-bold text-slate-800 text-lg">{poll.question}</h3>
          {poll.description && <p className="text-sm text-slate-500 mt-1">{poll.description}</p>}
          <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
            <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {poll.totalVotes} vote{poll.totalVotes !== 1 ? "s" : ""}</span>
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {timeAgo(poll.createdAt)}</span>
            <span>by {poll.createdByName}</span>
            {poll.allowMultiple && <span className="text-indigo-500 font-medium">Multi-select</span>}
            {poll.closed && <span className="text-red-500 font-medium">Closed</span>}
            {poll.closesOn && !poll.closed && (
              <span className="text-amber-500">Closes {poll.closesOn}</span>
            )}
          </div>
        </div>
        <button
          onClick={() => onDelete(poll.id)}
          className="text-slate-300 hover:text-red-400 transition-colors p-1"
          title="Delete poll"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Options */}
      <div className="space-y-2 mt-4">
        {poll.options.map(opt => (
          <button
            key={opt.id}
            onClick={() => toggleOption(opt.id)}
            disabled={showResults || poll.closed}
            className={cn(
              "w-full text-left rounded-xl border p-3 transition-all relative overflow-hidden",
              showResults
                ? "border-slate-200 cursor-default"
                : selected.has(opt.id)
                  ? "border-indigo-400 bg-indigo-50"
                  : "border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50"
            )}
          >
            {showResults && (
              <div
                className="absolute inset-y-0 left-0 bg-indigo-100/60 transition-all"
                style={{ width: `${(opt.voteCount / maxVotes) * 100}%` }}
              />
            )}
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-2">
                {!showResults && (
                  <span className={cn(
                    "w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0",
                    selected.has(opt.id) ? "border-indigo-500 bg-indigo-500" : "border-slate-300"
                  )}>
                    {selected.has(opt.id) && <Check className="w-2.5 h-2.5 text-white" />}
                  </span>
                )}
                {showResults && opt.selected && (
                  <Check className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                )}
                <span className={cn("text-sm font-medium", showResults && opt.selected ? "text-indigo-700" : "text-slate-700")}>
                  {opt.text}
                </span>
              </div>
              {showResults && (
                <span className="text-sm font-semibold text-slate-600">{opt.voteCount}</span>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Vote Button */}
      {!showResults && !poll.closed && (
        <div className="mt-3 flex justify-end">
          <button
            onClick={submitVote}
            disabled={selected.size === 0}
            className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl text-sm font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 transition-all"
          >
            Cast Vote
          </button>
        </div>
      )}
    </div>
  );
}

function CreatePollModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (data: PollRequest) => void }) {
  const [question, setQuestion] = useState("");
  const [description, setDescription] = useState("");
  const [closesOn, setClosesOn] = useState("");
  const [allowMultiple, setAllowMultiple] = useState(false);
  const [anonymous, setAnonymous] = useState(false);
  const [options, setOptions] = useState(["", ""]);

  const addOption = () => setOptions([...options, ""]);
  const removeOption = (i: number) => {
    if (options.length <= 2) return;
    setOptions(options.filter((_, idx) => idx !== i));
  };
  const updateOption = (i: number, val: string) => {
    const next = [...options];
    next[i] = val;
    setOptions(next);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validOptions = options.map(o => o.trim()).filter(Boolean);
    if (!question.trim() || validOptions.length < 2) return;
    onSubmit({
      question: question.trim(),
      description: description.trim() || undefined,
      closesOn: closesOn || undefined,
      allowMultiple,
      anonymous,
      options: validOptions,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-4 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800">Create Poll</h2>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Question *</label>
          <input
            value={question}
            onChange={e => setQuestion(e.target.value)}
            placeholder="What would you like to ask?"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Description</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Add context (optional)"
            rows={2}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Options *</label>
          <div className="space-y-2">
            {options.map((opt, i) => (
              <div key={i} className="flex gap-2">
                <div className="flex items-center gap-2 flex-1">
                  <CircleDot className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <input
                    value={opt}
                    onChange={e => updateOption(i, e.target.value)}
                    placeholder={`Option ${i + 1}`}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  />
                </div>
                {options.length > 2 && (
                  <button type="button" onClick={() => removeOption(i)}
                    className="text-slate-300 hover:text-red-400 p-1">
                    <Minus className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
          {options.length < 10 && (
            <button type="button" onClick={addOption}
              className="mt-2 text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1">
              <Plus className="w-3 h-3" /> Add option
            </button>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Closes On</label>
          <input
            type="date"
            value={closesOn}
            onChange={e => setClosesOn(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
          />
        </div>

        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
            <input type="checkbox" checked={allowMultiple} onChange={e => setAllowMultiple(e.target.checked)}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
            Allow multiple selections
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
            <input type="checkbox" checked={anonymous} onChange={e => setAnonymous(e.target.checked)}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
            Anonymous voting
          </label>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose}
            className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <button type="submit"
            className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl text-sm font-semibold shadow-lg hover:shadow-xl transition-all">
            Create Poll
          </button>
        </div>
      </form>
    </div>
  );
}
