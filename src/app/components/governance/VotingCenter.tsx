import { useState } from "react";
import {
  Vote, ShieldCheck, Lock, CheckCircle2,
  AlertTriangle, Clock, Users, ArrowRight,
  Sparkles, Check, Download, Share2
} from "lucide-react";
import { toast } from "react-toastify";

interface VotingOption {
  id: string;
  label: string;
  votes: number;
}

export function VotingCenter() {
  const [selectedOption, setSelectedOption] = useState<string>("opt-1");
  const [hasVoted, setHasVoted] = useState(false);
  const [digitalReceipt, setDigitalReceipt] = useState<string | null>(null);

  const [options, setOptions] = useState<VotingOption[]>([
    { id: "opt-1", label: "Approve Proposal (Procure 12 EV Fast Chargers)", votes: 412 },
    { id: "opt-2", label: "Reject Proposal (Defer to next FY)", votes: 98 },
    { id: "opt-3", label: "Abstain / Neutral", votes: 32 },
  ]);

  const totalVotes = options.reduce((sum, o) => sum + o.votes, 0);

  const handleCastVote = () => {
    if (!selectedOption) return;

    // Update tallies locally
    setOptions(prev => prev.map(o => o.id === selectedOption ? { ...o, votes: o.votes + 1 } : o));

    const receipt = "RECEIPT-SHA256-" + Math.random().toString(36).substring(2, 10).toUpperCase();
    setDigitalReceipt(receipt);
    setHasVoted(true);
    toast.success("Your secret ballot has been cryptographically recorded! Digital receipt issued.");
  };

  return (
    <div className="space-y-6">
      {/* ── Top Header ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Vote className="w-5 h-5 text-indigo-600" /> Voting & Secret Ballot Center
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Eligible voting snapshot: 1 vote per registered flat unit. Ballots are decoupled from voter identity for total democratic secrecy.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-xs font-black rounded-xl border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" /> Snapshot Locked · Flat B-402 Verified
          </span>
        </div>
      </div>

      {/* ── Active Ballot Box ─────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-[#1E1E36] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-[10px] font-black rounded-lg border border-amber-200 dark:border-amber-800 animate-pulse">
                🗳️ AGM 2026 Live Ballot
              </span>
              <span className="text-[11px] text-slate-400">Resolution Code: <strong>RES-2026-0042</strong></span>
            </div>
            <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
              Resolution: Approval of Basement EV Fast-Charging Station Grid & SLA
            </h1>
            <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
              Shall the General Body authorize the Management Committee to sanction ₹8,50,000 from the Sinking Fund for the turnkey installation of 12 shared AC/DC fast chargers across Basements 1 & 2?
            </p>
          </div>

          {/* Quorum Progress */}
          <div className="bg-slate-50 dark:bg-[#262644] p-4 rounded-2xl border border-slate-200 dark:border-slate-700 min-w-[260px] space-y-2">
            <div className="flex justify-between text-xs font-black">
              <span>Quorum Turnout:</span>
              <span className="text-emerald-600 dark:text-emerald-400">{totalVotes} / 425 (63.8% ✓)</span>
            </div>
            <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: "63.8%" }} />
            </div>
            <div className="text-[10px] text-slate-400">Total Eligible Flats: 850 · Min Required: 50%</div>
          </div>
        </div>

        {/* ── Voting Options or Receipt Confirmation ─────────────────────────── */}
        {!hasVoted ? (
          <div className="space-y-4 max-w-xl">
            <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
              Select Your Ballot Choice
            </h3>

            <div className="space-y-3">
              {options.map((opt) => (
                <label
                  key={opt.id}
                  className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all ${
                    selectedOption === opt.id
                      ? "bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-500 shadow-sm"
                      : "bg-slate-50 dark:bg-[#262644] border-slate-200 dark:border-slate-700 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="ballotOption"
                      value={opt.id}
                      checked={selectedOption === opt.id}
                      onChange={() => setSelectedOption(opt.id)}
                      className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-xs font-bold text-slate-900 dark:text-white">{opt.label}</span>
                  </div>
                </label>
              ))}
            </div>

            <div className="p-3 bg-amber-50/70 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-900 text-[11px] text-amber-800 dark:text-amber-300 flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>Ballot secrecy: Once cast, your choice cannot be viewed or attributed to your flat by admins.</span>
            </div>

            <button
              onClick={handleCastVote}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <Vote className="w-4 h-4" /> Submit Confidential Ballot
            </button>
          </div>
        ) : (
          <div className="p-6 bg-emerald-50/80 dark:bg-emerald-950/40 rounded-3xl border border-emerald-200 dark:border-emerald-800 space-y-4 max-w-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-500 text-white rounded-xl flex items-center justify-center shadow-md">
                <Check className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-black text-emerald-900 dark:text-emerald-200">
                  Ballot Successfully Recorded & Verified
                </h3>
                <p className="text-xs text-emerald-700 dark:text-emerald-400">
                  Your vote has been counted into the anonymous community tally.
                </p>
              </div>
            </div>

            <div className="p-3 bg-white dark:bg-[#1E1E36] rounded-xl border border-emerald-200 dark:border-emerald-900 text-xs">
              <span className="text-[10px] text-slate-400 block font-bold uppercase">Personal Digital Verification Receipt:</span>
              <code className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 mt-0.5 block">{digitalReceipt}</code>
              <span className="text-[9px] text-slate-400 mt-1 block">Keep this receipt to verify your ballot inclusion in the final published audit log.</span>
            </div>
          </div>
        )}

        {/* ── Live Anonymous Breakdown Chart ─────────────────────────────────── */}
        <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-3">
          <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
            Live Verified Tally Breakdown ({totalVotes} Total Ballots)
          </h3>

          <div className="space-y-3">
            {options.map((opt) => {
              const pct = totalVotes > 0 ? ((opt.votes / totalVotes) * 100).toFixed(1) : "0";
              return (
                <div key={opt.id} className="space-y-1">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-700 dark:text-slate-300">{opt.label}</span>
                    <span className="text-slate-900 dark:text-white">{opt.votes} Votes ({pct}%)</span>
                  </div>
                  <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        opt.id === "opt-1" ? "bg-emerald-500" : opt.id === "opt-2" ? "bg-rose-500" : "bg-slate-400"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
