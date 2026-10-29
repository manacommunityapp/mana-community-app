import { useState } from "react";
import {
  Users, Vote, Award, ShieldCheck, CheckCircle2,
  Calendar, ArrowRight, UserPlus, FileText, Check, Plus
} from "lucide-react";
import { toast } from "react-toastify";

interface CommitteeMember {
  id: string;
  name: string;
  flat: string;
  role: string;
  domain: string;
  term: string;
  avatar: string;
}

interface Candidate {
  id: string;
  name: string;
  flat: string;
  position: string;
  statement: string;
  votes: number;
  hasVoted: boolean;
}

const MOCK_MEMBERS: CommitteeMember[] = [
  { id: "1", name: "Sandeep Kumar", flat: "B-402", role: "President", domain: "Governance, Legal & External Liaison", term: "2024-2026", avatar: "SK" },
  { id: "2", name: "Rahul Verma", flat: "A-201", role: "Secretary", domain: "Helpdesk, Operations & Notices", term: "2024-2026", avatar: "RV" },
  { id: "3", name: "Priya Menon", flat: "C-503", role: "Treasurer", domain: "Finance, Tariff Audit & Sinking Fund", term: "2024-2026", avatar: "PM" },
  { id: "4", name: "Arjun Mehta", flat: "Villa 12", role: "Joint Secretary", domain: "Security, ANPR Barriers & Infrastructure", term: "2024-2026", avatar: "AM" },
  { id: "5", name: "Kavita Rao", flat: "B-104", role: "Executive Member", domain: "Sports, Clubhouse & Cultural Events", term: "2024-2026", avatar: "KR" },
];

const MOCK_CANDIDATES: Candidate[] = [
  { id: "c-1", name: "Sandeep Kumar", flat: "B-402", position: "President", statement: "Committed to 100% transparent digital governance, expanding rooftop solar generation, and upgrading sports infrastructure.", votes: 214, hasVoted: false },
  { id: "c-2", name: "Kishore V.", flat: "A-804", position: "President", statement: "Focus on reducing common maintenance charges through vendor renegotiation and strict contractor penalties.", votes: 189, hasVoted: false },
  { id: "c-3", name: "Sneha Nair", flat: "C-304", position: "Secretary", statement: "Modernize resident communications, create sub-committees for green living, and conduct monthly open-houses.", votes: 242, hasVoted: false },
];

export function CommitteeAndElections() {
  const [activeSection, setActiveSection] = useState<"COMMITTEE" | "ELECTIONS">("COMMITTEE");
  const [candidates, setCandidates] = useState<Candidate[]>(MOCK_CANDIDATES);

  const handleVoteCandidate = (id: string) => {
    setCandidates(prev => prev.map(c => {
      if (c.id === id) {
        return { ...c, votes: c.votes + 1, hasVoted: true };
      }
      return c;
    }));
    toast.success("Your secret election ballot has been cast and anonymized!");
  };

  return (
    <div className="space-y-6">
      {/* ── Top Header ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" /> Executive Committee & Biennial Elections
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Democratic representation: active office bearers directory and official election voting center.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setActiveSection("COMMITTEE")}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeSection === "COMMITTEE"
                ? "bg-indigo-600 text-white shadow-md"
                : "bg-white dark:bg-[#1E1E36] border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300"
            }`}
          >
            Active Committee Board
          </button>
          <button
            onClick={() => setActiveSection("ELECTIONS")}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeSection === "ELECTIONS"
                ? "bg-indigo-600 text-white shadow-md"
                : "bg-white dark:bg-[#1E1E36] border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300"
            }`}
          >
            2026-2028 Elections Portal
          </button>
        </div>
      </div>

      {/* ── Section 1: Active Committee Board ──────────────────────────────────── */}
      {activeSection === "COMMITTEE" && (
        <div className="space-y-4">
          <div className="p-4 bg-indigo-50/60 dark:bg-indigo-950/30 rounded-2xl border border-indigo-100 dark:border-indigo-900 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-600" />
              <div className="text-xs text-indigo-900 dark:text-indigo-200 font-bold">
                Elected Executive Management Committee (Term: 2024 - 2026)
              </div>
            </div>
            <span className="text-[10px] text-slate-500 font-semibold">Outgoing Term expires AGM 2026</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {MOCK_MEMBERS.map((m) => (
              <div
                key={m.id}
                className="bg-white dark:bg-[#1E1E36] border border-slate-200 dark:border-slate-800 rounded-3xl p-5 hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-black text-sm flex items-center justify-center shadow-md">
                    {m.avatar}
                  </div>
                  <div>
                    <div className="flex items-center gap-1">
                      <h3 className="text-xs font-black text-slate-900 dark:text-white">{m.name}</h3>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    </div>
                    <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 text-[10px] font-black rounded-md inline-block mt-0.5">
                      {m.role}
                    </span>
                    <p className="text-[10px] text-slate-400 mt-0.5">{m.flat}</p>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-[#262644] rounded-2xl border border-slate-100 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">Assigned Responsibility Domain:</span>
                  <strong className="text-slate-800 dark:text-slate-200">{m.domain}</strong>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Section 2: Elections Portal ────────────────────────────────────────── */}
      {activeSection === "ELECTIONS" && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-7 text-white shadow-xl space-y-3">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-amber-400 text-slate-950 text-[10px] font-black rounded-full">
                🗳️ Biennial Democratic Elections 2026-2028
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-black">Management Committee Elections 2026</h2>
            <p className="text-xs text-indigo-200 max-w-2xl leading-relaxed">
              Returning Officer: Adv. Mohan Deshmukh (Independent). One secret vote per registered flat unit. Results announced during AGM 2026 session.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
              Nominated Candidates & Vision Manifestos
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {candidates.map((cand) => (
                <div
                  key={cand.id}
                  className="bg-white dark:bg-[#1E1E36] border border-slate-200 dark:border-slate-800 rounded-3xl p-5 hover:shadow-lg transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 text-[10px] font-black rounded-lg">
                        Position: {cand.position}
                      </span>
                      <span className="text-[10px] text-slate-400">{cand.flat}</span>
                    </div>

                    <h4 className="text-xs font-black text-slate-900 dark:text-white">{cand.name}</h4>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 italic leading-relaxed">
                      "{cand.statement}"
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500">🗳️ {cand.votes} Votes Cast</span>

                    <button
                      onClick={() => handleVoteCandidate(cand.id)}
                      disabled={cand.hasVoted}
                      className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                        cand.hasVoted
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                          : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                      }`}
                    >
                      {cand.hasVoted ? "✓ Voted" : "Vote Candidate"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
