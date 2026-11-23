import { useState } from "react";
import {
  Calendar, Clock, MapPin, Video, Users,
  CheckCircle2, Plus, ArrowRight, ShieldCheck,
  FileText, Download, Share2, Check, AlertCircle,
  Sparkles, Loader2, Copy, X
} from "lucide-react";
import { toast } from "react-toastify";
import {
  automationService,
  type AgmQuorumAuditResponse,
  type GovernanceMomExtractResponse
} from "../../../services/automation/automationService";

interface AgendaItem {
  id: number;
  order: number;
  title: string;
  presenter: string;
  duration: string;
  description: string;
  status: "PENDING" | "DISCUSSED" | "VOTING_OPEN" | "APPROVED";
}

export function MeetingsManagement() {
  const [activeTab, setActiveTab] = useState<"AGM" | "EGM" | "PAST">("AGM");
  const [attendedMode, setAttendedMode] = useState<"PHYSICAL" | "ONLINE">("PHYSICAL");
  const [hasConfirmedAttendance, setHasConfirmedAttendance] = useState(true);
  const [attendanceCount, setAttendanceCount] = useState(112);

  // AI Quorum Sentinel state
  const [isAuditingQuorum, setIsAuditingQuorum] = useState(false);
  const [quorumResult, setQuorumResult] = useState<AgmQuorumAuditResponse["evaluation"] | null>(null);
  const [showQuorumModal, setShowQuorumModal] = useState(false);

  // AI MoM Extractor state
  const [isExtractingMom, setIsExtractingMom] = useState(false);
  const [momResult, setMomResult] = useState<GovernanceMomExtractResponse["mom"] | null>(null);
  const [showMomModal, setShowMomModal] = useState(false);
  const [rawNotesInput, setRawNotesInput] = useState(
    "1. Discussed and confirmed statutory notice compliance (21 days prior).\\n2. Audited society accounts for FY25-26 presented by Treasurer. Sinking fund surplus of 42 Lakhs.\\n3. Resolution passed to install 12 new EV charging points in basement 2 with majority vote.\\n4. Debate on swimming pool filtration pump overhaul - 1.2 Lakhs approved.\\n5. Security agency contract renewal deferred pending service review."
  );

  const [agendaItems] = useState<AgendaItem[]>([
    {
      id: 1,
      order: 1,
      title: "Adoption of Audited Financial Statements & Balance Sheet FY25-26",
      presenter: "Treasurer",
      duration: "45 min",
      description: "Review of statutory auditor report, income & expenditure balance, and reserve funds status.",
      status: "APPROVED"
    },
    {
      id: 2,
      order: 2,
      title: "Basement 2 EV Charging Station Infrastructure Augmentation",
      presenter: "Infra Committee",
      duration: "30 min",
      description: "Sanction of 12 dedicated Level-2 AC chargers with smart sub-metering and load balance.",
      status: "VOTING_OPEN"
    },
    {
      id: 3,
      order: 3,
      title: "Election of Management Committee Office Bearers (2026-2028)",
      presenter: "Election Commissioner",
      duration: "60 min",
      description: "Secret digital ballot to elect President, Secretary, Treasurer, and 6 Executive Members.",
      status: "VOTING_OPEN"
    }
  ]);

  const handleConfirmAttendance = () => {
    setHasConfirmedAttendance(true);
    setAttendanceCount((prev) => prev + 1);
    toast.success(`Attendance confirmed for AGM 2026 (${attendedMode} Mode)! Quorum record updated.`);
  };

  const handleRunQuorumAudit = async () => {
    setIsAuditingQuorum(true);
    try {
      const res = await automationService.auditAgmQuorum({
        meetingId: "AGM-2026",
        title: "Annual General Body Meeting 2026",
        totalEligibleOwners: 320,
        statutoryQuorumPercent: 33.3,
        confirmedPhysical: Math.round(attendanceCount * 0.45),
        confirmedVirtual: Math.round(attendanceCount * 0.55),
        proxyVotesReceived: 14,
        towerBreakdown: [
          { tower: "Tower A", confirmed: Math.round(attendanceCount * 0.35), total: 100 },
          { tower: "Tower B", confirmed: Math.round(attendanceCount * 0.32), total: 100 },
          { tower: "Tower C", confirmed: Math.round(attendanceCount * 0.22), total: 80 },
          { tower: "Villas", confirmed: Math.round(attendanceCount * 0.11), total: 40 }
        ]
      });
      if (res && res.evaluation) {
        setQuorumResult(res.evaluation);
        setShowQuorumModal(true);
        toast.success("AI Quorum & Attendance audit calculated!");
      }
    } catch {
      toast.error("Quorum audit encountered an error. Please try again.");
    } finally {
      setIsAuditingQuorum(false);
    }
  };

  const handleExtractMom = async () => {
    if (!rawNotesInput.trim()) return;
    setIsExtractingMom(true);
    try {
      const res = await automationService.extractMeetingMinutesAndActions({
        meetingId: "AGM-2026",
        title: "Annual General Body Meeting 2026",
        meetingDate: "2026-10-25",
        attendees: ["President", "Secretary", "Treasurer", `${attendanceCount} Registered Owners`],
        rawNotes: rawNotesInput
      });
      if (res && res.mom) {
        setMomResult(res.mom);
        setShowMomModal(true);
        toast.success("AI Meeting Minutes (MoM) & Action Items extracted!");
      }
    } catch {
      toast.error("Failed to extract minutes. Please try again.");
    } finally {
      setIsExtractingMom(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Meeting Tabs & Header ─────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-600" /> General Body Meetings (AGM & EGM)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Formal democratic assemblies governing Mana Residency. Notice, agenda, live quorum & voting.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("AGM")}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeTab === "AGM"
                ? "bg-indigo-600 text-white shadow-md"
                : "bg-white dark:bg-[#1E1E36] border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300"
            }`}
          >
            Annual General Meeting (AGM)
          </button>
          <button
            onClick={() => setActiveTab("EGM")}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeTab === "EGM"
                ? "bg-indigo-600 text-white shadow-md"
                : "bg-white dark:bg-[#1E1E36] border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300"
            }`}
          >
            Extraordinary (EGM)
          </button>
          <button
            onClick={() => setActiveTab("PAST")}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeTab === "PAST"
                ? "bg-indigo-600 text-white shadow-md"
                : "bg-white dark:bg-[#1E1E36] border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300"
            }`}
          >
            Past Archives
          </button>
        </div>
      </div>

      {/* ── AGM 2026 Core Meeting Details Card ────────────────────────────────── */}
      <div className="bg-white dark:bg-[#1E1E36] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-[10px] font-black rounded-lg border border-indigo-200 dark:border-indigo-800">
                AGM 2026 · Notice Circulated
              </span>
              <span className="px-2.5 py-0.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold rounded-lg border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> 21-Day Statutory Notice Compliant
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              Annual General Body Meeting (AGM) 2026
            </h1>
            <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
              Mandatory annual assembly of all registered apartment owners and authorized members to adopt audited financial accounts, approve capital projects, and elect the 2026-2028 Management Committee.
            </p>
          </div>

          {/* Quick RSVP & Check-in Switch */}
          <div className="bg-slate-50 dark:bg-[#262644] p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-700 min-w-[280px] space-y-3">
            <div className="text-xs font-black text-slate-900 dark:text-white flex items-center justify-between">
              <span>My Attendance Status</span>
              {hasConfirmedAttendance ? (
                <span className="text-emerald-600 flex items-center gap-1 text-[11px]">
                  <Check className="w-3.5 h-3.5" /> Confirmed
                </span>
              ) : (
                <span className="text-amber-600 text-[11px]">RSVP Pending</span>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setAttendedMode("PHYSICAL")}
                className={`flex-1 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  attendedMode === "PHYSICAL"
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-white dark:bg-[#1E1E36] border-slate-200 dark:border-slate-700 text-slate-600"
                }`}
              >
                🏢 Physical
              </button>
              <button
                onClick={() => setAttendedMode("ONLINE")}
                className={`flex-1 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  attendedMode === "ONLINE"
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-white dark:bg-[#1E1E36] border-slate-200 dark:border-slate-700 text-slate-600"
                }`}
              >
                💻 Online
              </button>
            </div>

            <button
              onClick={handleConfirmAttendance}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all shadow-sm cursor-pointer flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" /> Confirm & Check-in
            </button>
          </div>
        </div>

        {/* Meeting Specs Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-3.5 bg-slate-50 dark:bg-[#262644] rounded-2xl border border-slate-100 dark:border-slate-800">
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-indigo-500" /> Date & Time
            </div>
            <div className="text-xs font-black text-slate-900 dark:text-white mt-1">25 Oct 2026 · 10:00 AM</div>
          </div>
          <div className="p-3.5 bg-slate-50 dark:bg-[#262644] rounded-2xl border border-slate-100 dark:border-slate-800">
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-amber-500" /> Venue
            </div>
            <div className="text-xs font-black text-slate-900 dark:text-white mt-1">Clubhouse & Grand Lawn</div>
          </div>
          <div className="p-3.5 bg-slate-50 dark:bg-[#262644] rounded-2xl border border-slate-100 dark:border-slate-800">
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
              <Video className="w-3.5 h-3.5 text-blue-500" /> Hybrid Mode
            </div>
            <div className="text-xs font-black text-slate-900 dark:text-white mt-1">Google Meet Livestream</div>
          </div>
          <div className="p-3.5 bg-slate-50 dark:bg-[#262644] rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col justify-between">
            <div>
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center justify-between">
                <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5 text-emerald-500" /> Quorum</span>
                <span className="text-[9px] text-indigo-600 dark:text-indigo-400 font-black">Req 33.3%</span>
              </div>
              <div className="text-xs font-black text-emerald-600 dark:text-emerald-400 mt-1">
                {attendanceCount} / 320 ({Math.round((attendanceCount / 320) * 100)}%)
              </div>
            </div>
            <button
              onClick={handleRunQuorumAudit}
              disabled={isAuditingQuorum}
              className="mt-2 w-full py-1.5 px-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 shadow-xs transition-all disabled:opacity-50 cursor-pointer"
            >
              {isAuditingQuorum ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3 text-amber-300" />}
              AI Quorum Sentinel
            </button>
          </div>
        </div>

        {/* ── 10-Point Formal Agenda List ────────────────────────────────────── */}
        <div className="space-y-4 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-600" /> Formal Meeting Agenda
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={handleExtractMom}
                disabled={isExtractingMom}
                className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50 cursor-pointer"
              >
                {isExtractingMom ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-purple-200" />}
                AI Minutes (MoM) Assistant
              </button>
              <span className="text-xs text-slate-400 font-bold hidden sm:inline">⏱️ Est: 2 hrs 15 min</span>
            </div>
          </div>

          <div className="space-y-3">
            {agendaItems.map((item) => (
              <div
                key={item.id}
                className="p-4 bg-slate-50 dark:bg-[#262644] border border-slate-100 dark:border-slate-800 rounded-2xl hover:border-indigo-200 dark:hover:border-indigo-800 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1 max-w-2xl">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-black text-slate-900 dark:text-white">{item.title}</h4>
                    {item.status === "VOTING_OPEN" && (
                      <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 text-[9px] font-black rounded-full animate-pulse">
                        🗳️ Secret Ballot Linked
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">{item.description}</p>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center">
                  <div className="text-right">
                    <div className="text-xs font-bold text-slate-700 dark:text-slate-300">{item.presenter}</div>
                    <div className="text-[10px] text-slate-400">⏱️ {item.duration}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── AI Quorum Sentinel Modal ────────────────────────────────────────── */}
      {showQuorumModal && quorumResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#1E1E36] rounded-3xl p-6 w-full max-w-lg border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">AI Quorum Sentinel</h3>
                  <p className="text-[10px] text-slate-400">Statutory Attendance & Adjournment Audit</p>
                </div>
              </div>
              <button onClick={() => setShowQuorumModal(false)} className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 dark:bg-[#262644] rounded-2xl border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 font-bold block">Quorum Status</span>
                <span className={`text-xs font-black uppercase inline-block mt-0.5 px-2 py-0.5 rounded-md ${
                  quorumResult.quorumStatus === "QUORUM_MET"
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
                    : "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
                }`}>
                  {quorumResult.quorumStatus.replace(/_/g, " ")}
                </span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-[#262644] rounded-2xl border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 font-bold block">Adjournment Risk</span>
                <span className={`text-xs font-black uppercase inline-block mt-0.5 px-2 py-0.5 rounded-md ${
                  quorumResult.adjournmentRisk === "NONE"
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
                    : "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300"
                }`}>
                  {quorumResult.adjournmentRisk} RISK
                </span>
              </div>
            </div>

            <div className="p-3.5 bg-indigo-50/60 dark:bg-indigo-950/20 rounded-2xl border border-indigo-200/50 dark:border-indigo-900/30 text-xs text-slate-700 dark:text-slate-300">
              <span className="font-bold text-indigo-700 dark:text-indigo-400 block mb-1">Governance Verdict:</span>
              <p className="leading-relaxed">{quorumResult.governanceVerdict}</p>
            </div>

            {quorumResult.towerOutreachTargets && quorumResult.towerOutreachTargets.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-xs font-black text-slate-900 dark:text-white">Tower Mobilization Targets:</span>
                {quorumResult.towerOutreachTargets.map((t, idx) => (
                  <div key={idx} className="p-2.5 bg-slate-50 dark:bg-[#262644] rounded-xl border border-slate-100 dark:border-slate-800 text-xs flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white">{t.tower}: </span>
                      <span className="text-slate-500 text-[11px]">{t.shortfallNotes}</span>
                    </div>
                    <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold">{t.recommendedAction}</span>
                  </div>
                ))}
              </div>
            )}

            {quorumResult.whatsappBroadcastBulletin && (
              <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/20 rounded-2xl border border-emerald-200/40 dark:border-emerald-900/30 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-emerald-800 dark:text-emerald-300">WhatsApp Mobilization Notice:</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(quorumResult.whatsappBroadcastBulletin);
                      toast.success("Broadcast bulletin copied!");
                    }}
                    className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    <Copy className="w-3 h-3" /> Copy Notice
                  </button>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-line font-mono bg-white dark:bg-[#1E1E36] p-2.5 rounded-xl border border-emerald-100 dark:border-emerald-950/60">
                  {quorumResult.whatsappBroadcastBulletin}
                </p>
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setShowQuorumModal(false)}
                className="px-4 py-2 bg-slate-100 dark:bg-[#262644] text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-200 cursor-pointer"
              >
                Close Audit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── AI MoM Extractor Modal ────────────────────────────────────────── */}
      {showMomModal && momResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#1E1E36] rounded-3xl p-6 w-full max-w-xl border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">AI Minutes of Meeting (MoM) Assistant</h3>
                  <p className="text-[10px] text-slate-400">Formal Resolutions & Action Items Matrix</p>
                </div>
              </div>
              <button onClick={() => setShowMomModal(false)} className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-[#262644] rounded-2xl border border-slate-100 dark:border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Executive Assembly Summary</span>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">{momResult.executiveSummary}</p>
            </div>

            {momResult.resolutions && momResult.resolutions.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-black text-slate-900 dark:text-white">Adopted Resolutions:</span>
                {momResult.resolutions.map((r, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 dark:bg-[#262644] rounded-xl border border-slate-100 dark:border-slate-800 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 dark:text-white">{r.resId}: {r.title}</span>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                        {r.verdict.replace(/_/g, " ")}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">{r.details}</p>
                  </div>
                ))}
              </div>
            )}

            {momResult.actionItems && momResult.actionItems.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-black text-slate-900 dark:text-white">Assigned Action Items:</span>
                <div className="space-y-1.5">
                  {momResult.actionItems.map((a, idx) => (
                    <div key={idx} className="p-2.5 bg-slate-50 dark:bg-[#262644] rounded-xl border border-slate-100 dark:border-slate-800 text-xs flex items-center justify-between">
                      <div>
                        <div className="font-bold text-slate-800 dark:text-slate-200">{a.task}</div>
                        <div className="text-[10px] text-slate-400">Assigned: {a.assignedTo} · Deadline: {a.deadline}</div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                        {a.priority}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(momResult.formalMoMBulletin);
                  toast.success("Formal MoM Bulletin copied!");
                }}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Copy className="w-3.5 h-3.5" /> Copy Official MoM
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
