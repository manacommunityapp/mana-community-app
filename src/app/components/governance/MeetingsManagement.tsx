import { useState } from "react";
import {
  Calendar, Clock, MapPin, Video, Users,
  CheckCircle2, Plus, ArrowRight, ShieldCheck,
  FileText, Download, Share2, Check, AlertCircle
} from "lucide-react";
import { toast } from "react-toastify";

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
  const [attendanceCount, setAttendanceCount] = useState(438);

  const [agendaItems] = useState<AgendaItem[]>([
    { id: 1, order: 1, title: "1. Opening & Formal Quorum Verification", presenter: "President · Sandeep K.", duration: "15 min", description: "Verification of physical + online registered voting members against 50% legal quorum.", status: "PENDING" },
    { id: 2, order: 2, title: "2. Adoption of Previous AGM 2025 Minutes", presenter: "Secretary · Rahul V.", duration: "20 min", description: "Review of compliance and actions completed from FY 2024-25 resolutions.", status: "PENDING" },
    { id: 3, order: 3, title: "3. Presentation of Annual Audited Accounts (FY 2025-26)", presenter: "Treasurer · Priya M.", duration: "45 min", description: "Detailed review of ₹1.82 Cr maintenance collection, vendor audits, and Sinking Fund yields.", status: "PENDING" },
    { id: 4, order: 4, title: "4. Major Capital Proposal: Basement EV Charging Grid", presenter: "Infrastructure Sub-committee", duration: "30 min", description: "Approval of ₹8,50,000 for 12 fast charging units with load management.", status: "VOTING_OPEN" },
    { id: 5, order: 5, title: "5. Security System & ANPR Barrier Modernization", presenter: "Security Marshal", duration: "20 min", description: "Upgrade of Boom barriers, visitor facial recognition, and guard patrol tablets.", status: "PENDING" },
    { id: 6, order: 6, title: "6. Biennial Management Committee Elections 2026-2028", presenter: "Returning Officer", duration: "60 min", description: "Secret electronic ballot declaration for President, Secretary, Treasurer & Members.", status: "PENDING" },
    { id: 7, order: 7, title: "7. Approval of Annual Maintenance Budget (FY 2026-27)", presenter: "Treasurer", duration: "30 min", description: "Determination of per-sq.ft monthly maintenance tariff.", status: "PENDING" },
    { id: 8, order: 8, title: "8. Resident Open Floor & Community Questions", presenter: "General Body", duration: "45 min", description: "Addressing resident queries submitted via Mana Helpdesk.", status: "PENDING" },
    { id: 9, order: 9, title: "9. Any Other Matter with Permission of the Chair", presenter: "President", duration: "15 min", description: "Emergent topics raised by verified voting members.", status: "PENDING" },
    { id: 10, order: 10, title: "10. Vote of Thanks & Meeting Concluding Remarks", presenter: "Joint Secretary", duration: "10 min", description: "Formal conclusion and publishing of raw proceedings.", status: "PENDING" },
  ]);

  const handleConfirmAttendance = () => {
    setHasConfirmedAttendance(true);
    setAttendanceCount((prev) => prev + 1);
    toast.success(`Attendance confirmed for AGM 2026 (${attendedMode} Mode)! Quorum record updated.`);
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
          <div className="p-3.5 bg-slate-50 dark:bg-[#262644] rounded-2xl border border-slate-100 dark:border-slate-800">
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-emerald-500" /> Registered Quorum
            </div>
            <div className="text-xs font-black text-emerald-600 dark:text-emerald-400 mt-1">
              {attendanceCount} / 425 (51.5% ✓)
            </div>
          </div>
        </div>

        {/* ── 10-Point Formal Agenda List ────────────────────────────────────── */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-600" /> Formal 10-Point Meeting Agenda
            </h3>
            <span className="text-xs text-slate-400 font-bold">Total Estimated Duration: 4 hrs 45 min</span>
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
    </div>
  );
}
