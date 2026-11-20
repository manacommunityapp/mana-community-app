import { useState, useEffect, useCallback } from "react";
import {
  Vote, ShieldCheck, Lock, CheckCircle2,
  AlertTriangle, Clock, Users, ArrowRight,
  Sparkles, Check, Download, Share2, RefreshCw, ChevronDown, ChevronUp
} from "lucide-react";
import { toast } from "react-toastify";
import { governanceService, type Poll } from "../../../../services/governance/governanceService";
import { useTenantContext } from "../../../../contexts/TenantContext";

interface VotingOption {
  id: string;
  label: string;
  votes: number;
}

export function VotingCenter() {
  const { communityId } = useTenantContext();
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePollIdx, setActivePollIdx] = useState(0);
  const [pendingVotes, setPendingVotes] = useState<Record<number, string>>({});

  const loadPolls = useCallback(async () => {
    if (!communityId) return;
    setLoading(true);
    try {
      const data = await governanceService.getAllPolls(communityId);
      setPolls(data);
    } finally {
      setLoading(false);
    }
  }, [communityId]);

  useEffect(() => { loadPolls(); }, [loadPolls]);

  const handleCastVote = async (pollId: number) => {
    const optionId = pendingVotes[pollId];
    if (!optionId) return;
    try {
      await governanceService.castVote(pollId, optionId);
      toast.success("Your ballot has been recorded!");
      loadPolls();
    } catch {
      toast.error("Failed to cast vote. Please try again.");
    }
  };

  const activePoll = polls[activePollIdx] ?? null;

  return (
    <div className="space-y-6">
      {/* ── Top Header ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Vote className="w-5 h-5 text-indigo-600" /> Voting & Ballot Center
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Community polls and binding resolutions. One vote per registered flat unit.
          </p>
        </div>
        <button onClick={loadPolls} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      {/* ── Poll Navigation ─────────────────────────────────────────────────── */}
      {polls.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {polls.map((p, i) => (
            <button key={p.id} onClick={() => setActivePollIdx(i)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${activePollIdx === i ? "bg-indigo-600 text-white border-indigo-600" : "bg-white dark:bg-[#1E1E36] border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"}`}>
              {p.title.length > 30 ? p.title.slice(0, 30) + "…" : p.title}
            </button>
          ))}
        </div>
      )}

      {/* ── Ballot Box ───────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="bg-white dark:bg-[#1E1E36] border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center">
          <RefreshCw className="w-8 h-8 text-indigo-400 mx-auto animate-spin" />
          <p className="text-xs text-slate-500 mt-3">Loading polls…</p>
        </div>
      ) : !activePoll ? (
        <div className="bg-white dark:bg-[#1E1E36] border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center space-y-3">
          <Vote className="w-12 h-12 text-indigo-400 mx-auto opacity-60" />
          <h3 className="text-base font-bold text-slate-800 dark:text-white">No Active Ballots</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            There are currently no open ballots or polls for your community.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#1E1E36] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
          {/* Poll header */}
          <div className="pb-4 border-b border-slate-100 dark:border-slate-800 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`px-2.5 py-1 text-[10px] font-black rounded-lg border ${
                activePoll.status === "ACTIVE"
                  ? "bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700"
              }`}>
                {activePoll.status === "ACTIVE" ? "🗳️ Active" : activePoll.status}
              </span>
              {activePoll.pollType === "BINDING" && (
                <span className="px-2.5 py-1 text-[10px] font-black rounded-lg bg-orange-100 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-800">
                  Binding Resolution
                </span>
              )}
            </div>
            <h1 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">{activePoll.title}</h1>
            {activePoll.description && (
              <p className="text-xs text-slate-500 leading-relaxed">{activePoll.description}</p>
            )}
          </div>

          {/* Already voted — show results */}
          {activePoll.myVoteOptionId ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span className="text-xs font-bold text-emerald-800 dark:text-emerald-200">
                  Your vote has been recorded
                </span>
              </div>
              {activePoll.resultSummary && (
                <div className="space-y-3">
                  {activePoll.options.map((opt, i) => {
                    const count = activePoll.resultSummary?.counts?.[opt.id] ?? 0;
                    const total = activePoll.resultSummary?.totalVotes ?? 1;
                    const pct = ((count / total) * 100).toFixed(1);
                    const colors = ["bg-emerald-500", "bg-rose-500", "bg-blue-500", "bg-amber-500"];
                    return (
                      <div key={opt.id} className="space-y-1">
                        <div className="flex justify-between text-xs font-bold">
                          <span className="text-slate-700 dark:text-slate-300 flex items-center gap-1">
                            {activePoll.myVoteOptionId === opt.id && <Check className="w-3 h-3 text-emerald-500" />}
                            {opt.label}
                          </span>
                          <span className="text-slate-900 dark:text-white">{count} ({pct}%)</span>
                        </div>
                        <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all ${colors[i % colors.length]}`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : activePoll.status !== "ACTIVE" ? (
            <p className="text-xs text-slate-500">This poll is closed.</p>
          ) : (
            /* Voting form */
            <div className="space-y-4 max-w-xl">
              <div className="space-y-3">
                {activePoll.options.map((opt) => (
                  <label key={opt.id} className={`flex items-center gap-3 p-4 rounded-2xl border cursor-pointer transition-all ${
                    pendingVotes[activePoll.id] === opt.id
                      ? "bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-500"
                      : "bg-slate-50 dark:bg-[#262644] border-slate-200 dark:border-slate-700 hover:border-slate-300"
                  }`}>
                    <input type="radio" name={`poll-${activePoll.id}`} value={opt.id}
                      checked={pendingVotes[activePoll.id] === opt.id}
                      onChange={() => setPendingVotes(prev => ({ ...prev, [activePoll.id]: opt.id }))}
                      className="w-4 h-4 text-indigo-600 focus:ring-indigo-500" />
                    <span className="text-xs font-bold text-slate-900 dark:text-white">{opt.label}</span>
                  </label>
                ))}
              </div>
              <div className="p-3 bg-amber-50/70 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-900 text-[11px] text-amber-800 dark:text-amber-300 flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span>Ballot secrecy: once cast your choice cannot be attributed to your flat by admins.</span>
              </div>
              <button onClick={() => handleCastVote(activePoll.id)}
                disabled={!pendingVotes[activePoll.id]}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-black transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer">
                <Vote className="w-4 h-4" /> Submit Ballot
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
